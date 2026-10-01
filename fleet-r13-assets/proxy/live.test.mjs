import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { setImmediate as nextTurn } from "node:timers/promises";
import {
  LIVE_ROUTES, fetchProxy, pollLive, pollNumber, updateNumber, markStale,
  deriveSigzTracks, deriveTeeTimes, deriveBBCState,
} from "./live.js";

const sample = async name => JSON.parse(await readFile(new URL(`./samples/${name}-2026-09-17.json`, import.meta.url), "utf8"));
const [sigz, tee, bbc] = await Promise.all([sample("sigz-tracks"), sample("tee-teetimes"), sample("bbc-state")]);
const route = "/api/live/sigz/tracks";

function setGlobal(t, name, value) {
  const before = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  t.after(() => before ? Object.defineProperty(globalThis, name, before) : delete globalThis[name]);
}
function node(text = "0") {
  const classes = new Set();
  return {
    textContent: text, dataset: {},
    classList: { add: item => classes.add(item), remove: item => classes.delete(item), contains: item => classes.has(item) },
  };
}
function browser(t, { hidden = false, reduced = false } = {}) {
  const page = new EventTarget();
  page.hidden = hidden;
  page.setHidden = value => { page.hidden = value; page.dispatchEvent(new Event("visibilitychange")); };
  const media = new EventTarget();
  media.matches = reduced;
  media.setReduced = value => {
    media.matches = value;
    const event = new Event("change");
    event.matches = value;
    media.dispatchEvent(event);
  };
  const frames = new Map();
  let nextId = 1;
  setGlobal(t, "document", page);
  setGlobal(t, "matchMedia", query => {
    assert.equal(query, "(prefers-reduced-motion: reduce)");
    return media;
  });
  setGlobal(t, "requestAnimationFrame", fn => { const id = nextId++; frames.set(id, fn); return id; });
  setGlobal(t, "cancelAnimationFrame", id => frames.delete(id));
  return {
    page, media, frames,
    frame(time) {
      const callbacks = [...frames.values()];
      frames.clear();
      for (const fn of callbacks) fn(time);
    },
  };
}

test("derive SiGz plays, count, newest date and per-track accents from the real sample", () => {
  const stats = deriveSigzTracks(sigz);
  assert.equal(stats.totalPlays, 94);
  assert.equal(stats.trackCount, 69);
  assert.equal(stats.latestReleaseDate, "2024-06-14");
  assert.equal(stats.tracks[0].slug, "to-the-beach");
  assert.equal(stats.tracks[0].accentColor, "#35E0FF");
  assert.equal(Object.hasOwn(stats.tracks[0], "peaks"), false);
  assert.equal(stats.tracks[0].playCount, 40);
});

test("optional SiGz peaks survive without mutating the source; dates are compared, not array order", () => {
  const payload = structuredClone(sigz);
  payload.tracks[1].peaks = [0, 0.2, 0.8, 0.1];
  payload.tracks[20].releaseDate = "2027-01-01";
  const stats = deriveSigzTracks(payload);
  assert.deepEqual(stats.tracks[1].peaks, [0, 0.2, 0.8, 0.1]);
  stats.tracks[1].peaks.push(1);
  assert.equal(payload.tracks[1].peaks.length, 4);
  assert.equal(stats.latestReleaseDate, "2027-01-01");
  assert.deepEqual(deriveSigzTracks({ tracks: [] }), { totalPlays: 0, trackCount: 0, latestReleaseDate: null, tracks: [] });
});

test("derive TeeTimes from the real sample: 99 open tee times, five courses, not golfer seats", () => {
  const stats = deriveTeeTimes(tee, { now: "2026-09-18T12:00:00Z" });
  assert.equal(stats.openSlotsToday, 99);
  assert.equal(stats.coursesWithLiveSlots, 5);
  assert.equal(stats.coversToday, true);
  assert.equal(stats.date, "2026-09-18");
  assert.equal(stats.dataDate, "2026-09-18");
  assert.equal(stats.fetchedAt, "2026-09-17T13:32:58.482Z");
  assert.ok(tee.slots.reduce((sum, slot) => sum + slot.playersAvailable, 0) > stats.openSlotsToday);
});

test("the actual capture covers tomorrow, and Toronto midnight differs from UTC", () => {
  for (const now of [tee.fetchedAt, "2026-09-18T02:00:00Z"]) {
    const stats = deriveTeeTimes(tee, { now });
    assert.equal(stats.date, "2026-09-17");
    assert.equal(stats.coversToday, false);
    assert.equal(stats.openSlotsToday, 0);
    assert.equal(stats.coursesWithLiveSlots, 0);
  }
  assert.equal(deriveTeeTimes(tee, { now: "2026-09-18T02:00:00Z", timeZone: "UTC" }).openSlotsToday, 99);
});

test("TeeTimes excludes closed, duplicate, mock, non-live and other-date slots", () => {
  const payload = structuredClone(tee);
  const first = payload.slots[0];
  payload.slots.push(structuredClone(first));
  payload.slots.push({ ...first, id: "closed-test", playersAvailable: 0 });
  payload.slots.push({ ...first, id: "other-date-test", date: "2026-09-19" });
  payload.slots.push({ ...first, id: "mock-test", source: "mock" });
  payload.courses.push({ id: "offline-test", live: false });
  payload.slots.push({ ...first, id: "offline-slot-test", courseId: "offline-test" });
  assert.equal(deriveTeeTimes(payload, { now: "2026-09-18T12:00:00Z" }).openSlotsToday, 99);
  payload.mock = true;
  assert.throws(() => deriveTeeTimes(payload), /not live data/);
});

test("BBC sample summary includes configured match holes plus awarded bonuses", () => {
  const stats = deriveBBCState(bbc);
  assert.equal(stats.scoreSummary, "Blue 41 - 29 Green");
  assert.deepEqual(stats.teamA, { name: "Blue", color: "#1d4ed8", holes: 39, bonus: 2, score: 41 });
  assert.deepEqual(stats.teamB, { name: "Green", color: "#15803d", holes: 27, bonus: 2, score: 29 });
  assert.equal(stats.matchCount, 6);
});

test("BBC ignores orphaned scores/bonuses, treats unstarted matches as zero and stays one line", () => {
  const payload = structuredClone(bbc);
  payload.scores.removedMatch = { a: 999, b: 999 };
  payload.bonusWinners.removedBonus = "a";
  payload.setup.matches.push({ id: "new-test-match" });
  payload.setup.teamA.name = " Blue\n Team ";
  const stats = deriveBBCState(payload);
  assert.equal(stats.scoreSummary, "Blue Team 41 - 29 Green");
  assert.equal(stats.matchCount, 7);
});

test("unexpected payload shapes throw so a caller retains its last valid number", () => {
  assert.throws(() => deriveSigzTracks([]), /Invalid/);
  assert.throws(() => deriveSigzTracks({ tracks: [{ playCount: "94" }] }), /playCount/);
  assert.throws(() => deriveTeeTimes({ slots: [] }), /Invalid/);
  assert.throws(() => deriveBBCState({}), /Invalid/);
});

test("fetchProxy uses a fixed relative path with no cookies, and rejects arbitrary URLs/queries", async t => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(sigz)));
  assert.deepEqual(await fetchProxy(route), sigz);
  const [url, init] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, route);
  assert.equal(init.method, "GET");
  assert.equal(init.credentials, "omit");
  assert.equal(init.redirect, "error");
  assert.deepEqual(init.headers, { Accept: "application/json" });
  assert.equal(LIVE_ROUTES.length, 6);
  for (const invalid of ["https://sigzmusic.com/api/tracks", `${route}?x=1`, "/api/live/admin"]) {
    await assert.rejects(fetchProxy(invalid), /Unknown live proxy/);
  }
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("fetchProxy surfaces non-OK JSON and malformed JSON as failures", async t => {
  let mode = 0;
  t.mock.method(globalThis, "fetch", async () => mode++ === 0 ? new Response('{"error":"upstream"}', { status: 502 }) : new Response("<html>"));
  await assert.rejects(fetchProxy(route), /502/);
  await assert.rejects(fetchProxy(route), SyntaxError);
});

test("fetchProxy aborts a stalled request after eight seconds and honors a caller signal", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const signals = [];
  t.mock.method(globalThis, "fetch", (url, { signal }) => new Promise((resolve, reject) => {
    signals.push(signal);
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  }));
  const pending = fetchProxy(route);
  const rejected = assert.rejects(pending, { name: "AbortError" });
  t.mock.timers.tick(7_999);
  assert.equal(signals[0].aborted, false);
  t.mock.timers.tick(1);
  await rejected;
  const controller = new AbortController();
  const other = assert.rejects(fetchProxy(route, { signal: controller.signal }), { name: "AbortError" });
  controller.abort();
  await other;
  assert.equal(signals[1].aborted, true);
  await assert.rejects(fetchProxy(route, { signal: controller.signal }), { name: "AbortError" });
  assert.equal(signals.length, 2);
});

test("updateNumber uses a cubic ease for 600 ms and reaches the exact target", t => {
  const b = browser(t);
  const el = node("10");
  el.classList.add("stale");
  updateNumber(el, 110, { format: value => String(Math.round(value)) });
  assert.equal(el.classList.contains("stale"), false);
  b.frame(0);
  assert.equal(el.textContent, "10");
  b.frame(300);
  assert.equal(el.textContent, "98");
  b.frame(600);
  assert.equal(el.textContent, "110");
  assert.equal(el.dataset.liveValue, "110");
  assert.equal(b.frames.size, 0);
});

test("a new number interrupts the old animation at the displayed value; stale cancels it", t => {
  const b = browser(t);
  const el = node("0");
  updateNumber(el, 100);
  b.frame(0);
  b.frame(300);
  const mid = el.dataset.liveValue;
  updateNumber(el, 200);
  b.frame(400);
  assert.equal(el.dataset.liveValue, mid);
  b.frame(700);
  markStale(el);
  const last = el.textContent;
  b.frame(1_000);
  assert.equal(el.textContent, last);
  assert.equal(el.classList.contains("stale"), true);
  assert.equal(b.frames.size, 0);
});

test("reduced motion jumps immediately and changing the preference finishes an active count", t => {
  const b = browser(t, { reduced: true });
  const el = node("3");
  updateNumber(el, 94);
  assert.equal(el.textContent, "94");
  assert.equal(b.frames.size, 0);
  b.media.setReduced(false);
  updateNumber(el, 110);
  b.frame(0);
  b.media.setReduced(true);
  assert.equal(el.textContent, "110");
  assert.equal(b.frames.size, 0);
  assert.throws(() => updateNumber(el, NaN), /finite/);
  assert.equal(el.textContent, "110");
});

test("pollLive fetches immediately/every 30 s, pauses while hidden, resumes immediately and cleans up", async t => {
  t.mock.timers.enable({ apis: ["setInterval", "setTimeout"] });
  const b = browser(t);
  const received = [];
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(sigz)));
  const poller = pollLive(route, { onData: payload => received.push(payload) });
  t.after(() => poller.stop());
  await nextTurn();
  assert.equal(received.length, 1);
  t.mock.timers.tick(29_999);
  assert.equal(fetchMock.mock.callCount(), 1);
  t.mock.timers.tick(1);
  await nextTurn();
  assert.equal(received.length, 2);
  b.page.setHidden(true);
  t.mock.timers.tick(120_000);
  await nextTurn();
  assert.equal(fetchMock.mock.callCount(), 2);
  b.page.setHidden(false);
  await nextTurn();
  assert.equal(received.length, 3);
  poller.stop();
  b.page.setHidden(true);
  b.page.setHidden(false);
  t.mock.timers.tick(60_000);
  await poller.refresh();
  assert.equal(fetchMock.mock.callCount(), 3);
});

test("a hidden initial tab does not fetch until it becomes visible", async t => {
  const b = browser(t, { hidden: true });
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(sigz)));
  const poller = pollLive(route);
  t.after(() => poller.stop());
  await poller.refresh();
  assert.equal(fetchMock.mock.callCount(), 0);
  b.page.setHidden(false);
  await nextTurn();
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("in-flight reads do not overlap, are aborted on hide, and cannot update the DOM late", async t => {
  const b = browser(t);
  const waiting = [];
  const received = [];
  const errors = [];
  // Deliberately ignore abort in this mock to exercise the late-result guard.
  const fetchMock = t.mock.method(globalThis, "fetch", (url, init) => new Promise(resolve => waiting.push({ resolve, signal: init.signal })));
  const poller = pollLive(route, { onData: payload => received.push(payload), onError: error => errors.push(error) });
  t.after(() => poller.stop());
  await poller.refresh();
  assert.equal(fetchMock.mock.callCount(), 1);
  b.page.setHidden(true);
  assert.equal(waiting[0].signal.aborted, true);
  b.page.setHidden(false);
  assert.equal(fetchMock.mock.callCount(), 2);
  waiting[0].resolve(new Response('{"old":true}'));
  await nextTurn();
  assert.deepEqual(received, []);
  waiting[1].resolve(new Response('{"new":true}'));
  await nextTurn();
  assert.deepEqual(received, [{ new: true }]);
  assert.deepEqual(errors, []);
});

test("pollNumber retains the last number and marks stale on fetch or derivation failure, then recovers", async t => {
  browser(t, { reduced: true });
  const el = node("12");
  let mode = "ok";
  t.mock.method(globalThis, "fetch", async () => {
    if (mode === "fail") throw new TypeError("offline");
    return new Response(JSON.stringify(mode === "shape" ? { changed: true } : sigz));
  });
  const poller = pollNumber(route, el, payload => deriveSigzTracks(payload).totalPlays);
  t.after(() => poller.stop());
  await nextTurn();
  assert.equal(el.textContent, "94");
  for (const failure of ["fail", "shape"]) {
    mode = failure;
    await poller.refresh();
    assert.equal(el.textContent, "94");
    assert.equal(el.classList.contains("stale"), true);
  }
  mode = "ok";
  await poller.refresh();
  assert.equal(el.textContent, "94");
  assert.equal(el.classList.contains("stale"), false);
});

test("a first failed poll keeps placeholder text, rather than displaying a fabricated zero", async t => {
  browser(t, { reduced: true });
  const el = node("...");
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("offline"); });
  const poller = pollNumber(route, el, payload => deriveSigzTracks(payload).totalPlays);
  t.after(() => poller.stop());
  await nextTurn();
  assert.equal(el.textContent, "...");
  assert.equal(el.classList.contains("stale"), true);
});
