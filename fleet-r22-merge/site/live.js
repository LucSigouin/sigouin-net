/** Browser ES module for the portfolio hub. No dependencies or import-time DOM work. */

export const LIVE_ROUTES = Object.freeze([
  "/api/live/sigz/tracks", "/api/live/sigz/albums", "/api/live/sigz/health",
  "/api/live/bbc/state", "/api/live/tee/teetimes", "/api/live/tee/courses",
]);
const routes = new Set(LIVE_ROUTES);
const numberStates = new WeakMap();
const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

/** Fetch only an exact, same-origin proxy path. Never send browser credentials. */
export async function fetchProxy(route, { signal } = {}) {
  if (!routes.has(route)) throw new TypeError("Unknown live proxy route");
  if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal?.addEventListener("abort", abort, { once: true });
  // A slightly longer client deadline allows the server's five-second 502.
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(route, {
      method: "GET", credentials: "omit", redirect: "error",
      headers: { Accept: "application/json" }, signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Live request failed (${response.status})`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

/**
 * Fetch immediately and every 30 s while visible. Hiding aborts any in-flight
 * read. Showing refreshes immediately. There is never an overlapping read.
 * Call stop() on teardown; refresh() is also available for a manual retry.
 */
export function pollLive(route, { onData = () => {}, onError = () => {}, intervalMs = 30_000 } = {}) {
  if (!routes.has(route)) throw new TypeError("Unknown live proxy route");
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) throw new TypeError("Invalid poll interval");
  const page = globalThis.document;
  if (!page) throw new Error("pollLive requires a browser document");
  let stopped = false;
  let timer = null;
  let active = null;
  let generation = 0;

  async function refresh() {
    if (stopped || page.hidden || active) return;
    const controller = new AbortController();
    const token = ++generation;
    active = controller;
    const current = () => !stopped && !page.hidden && token === generation;
    try {
      const payload = await fetchProxy(route, { signal: controller.signal });
      if (current()) onData(payload);
    } catch (error) {
      if (current() && !controller.signal.aborted) onError(error);
    } finally {
      if (active === controller) active = null;
    }
  }

  function pause() {
    clearInterval(timer);
    timer = null;
    generation += 1;
    active?.abort();
    active = null;
  }

  function visibilityChanged() {
    pause();
    if (!stopped && !page.hidden) {
      void refresh();
      timer = setInterval(() => { void refresh(); }, intervalMs);
    }
  }

  page.addEventListener("visibilitychange", visibilityChanged);
  visibilityChanged();
  return {
    refresh,
    stop() {
      stopped = true;
      pause();
      page.removeEventListener("visibilitychange", visibilityChanged);
    },
  };
}

/** Keep the last rendered number on an error, including during an animation. */
export function markStale(node) {
  numberStates.get(node)?.cancel();
  node.classList.add("stale");
}

/** Ease from the last shown value to next over 600 ms; reduced motion jumps. */
export function updateNumber(node, next, { format = value => numberFormat.format(value) } = {}) {
  if (!Number.isFinite(next)) throw new TypeError("Live number must be finite");
  const previous = numberStates.get(node);
  previous?.cancel();
  const initial = Number(node.dataset.liveValue ?? node.textContent.replace(/[,\s]/g, ""));
  const from = previous?.value ?? (Number.isFinite(initial) ? initial : 0);
  const media = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  let frame = null;
  let started = null;
  let cancelled = false;
  const state = { value: from, cancel };
  numberStates.set(node, state);

  function paint(value) {
    state.value = value;
    node.dataset.liveValue = String(value);
    node.textContent = format(value);
  }
  function cancel() {
    cancelled = true;
    if (frame !== null) globalThis.cancelAnimationFrame?.(frame);
    media?.removeEventListener?.("change", motionChanged);
  }
  function finish() {
    paint(next);
    cancel();
  }
  function motionChanged(event) {
    if (event.matches) finish();
  }
  function step(now) {
    if (cancelled) return;
    started ??= now;
    const progress = Math.min(1, Math.max(0, (now - started) / 600));
    paint(from + (next - from) * (1 - (1 - progress) ** 3));
    if (progress < 1) frame = globalThis.requestAnimationFrame(step);
    else finish();
  }

  node.classList.remove("stale");
  if (media?.matches || from === next || typeof globalThis.requestAnimationFrame !== "function") {
    finish();
  } else {
    media?.addEventListener?.("change", motionChanged);
    frame = globalThis.requestAnimationFrame(step);
  }
  return cancel;
}

/** Connect a numeric selector to polling, easing, stale handling, and teardown. */
export function pollNumber(route, node, select, { format, intervalMs = 30_000 } = {}) {
  if (typeof select !== "function") throw new TypeError("A numeric selector is required");
  const poller = pollLive(route, {
    intervalMs,
    onData: payload => updateNumber(node, select(payload), { format }),
    onError: () => markStale(node),
  });
  return {
    refresh: poller.refresh,
    stop() {
      poller.stop();
      numberStates.get(node)?.cancel();
    },
  };
}

function record(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`Invalid ${label}`);
  return value;
}
function nonnegative(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new TypeError(`Invalid ${label}`);
  return value;
}
function isoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

/**
 * Real /api/tracks shape: { tracks: [{ slug, title, playCount, releaseDate,
 * accentColor, ... }] }. The 2026-09-17 sample has 69 tracks and no inline peaks.
 * Optional peaks are preserved when supplied; no waveform or daily play count
 * is invented. totalPlays is the sum of the endpoint's cumulative playCount.
 */
export function deriveSigzTracks(payload) {
  if (!Array.isArray(payload?.tracks)) throw new TypeError("Invalid SiGz tracks");
  let totalPlays = 0;
  let latestReleaseDate = null;
  const tracks = payload.tracks.map(item => {
    record(item, "SiGz track");
    const playCount = nonnegative(item.playCount, "playCount");
    totalPlays += playCount;
    const releaseDate = isoDate(item.releaseDate) ? item.releaseDate : null;
    if (releaseDate && (!latestReleaseDate || releaseDate > latestReleaseDate)) latestReleaseDate = releaseDate;
    return {
      slug: item.slug, title: item.title, playCount, releaseDate,
      ...(typeof item.accentColor === "string" ? { accentColor: item.accentColor } : {}),
      ...(Array.isArray(item.peaks) ? { peaks: [...item.peaks] } : {}),
    };
  });
  return { totalPlays, trackCount: tracks.length, latestReleaseDate, tracks };
}

/**
 * Real /api/teetimes shape: { date, fetchedAt, mock, courses: [{id, live}],
 * slots: [{id, courseId, date, time, playersAvailable, source, ...}], ... }.
 * A slot is one tee time, not one golfer's seat. Count only live courses and
 * positive availability for today's Toronto calendar date. Deduplicate IDs.
 * The captured default response is for tomorrow: coversToday is false. A hub
 * must retain its last count or label the returned date in that case.
 */
export function deriveTeeTimes(payload, { now = new Date(), timeZone = "America/Toronto" } = {}) {
  if (!Array.isArray(payload?.slots) || !Array.isArray(payload?.courses) || !isoDate(payload.date)) {
    throw new TypeError("Invalid TeeTimes payload");
  }
  if (payload.mock !== false) throw new TypeError("TeeTimes payload is not live data");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(now));
  const part = type => parts.find(item => item.type === type).value;
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  const liveCourses = new Set(payload.courses.filter(course => course.live === true).map(course => course.id));
  const slotIds = new Set();
  const courseIds = new Set();
  for (const slot of payload.slots) {
    record(slot, "tee slot");
    if (slot.date !== date || !liveCourses.has(slot.courseId) || slot.source === "mock") continue;
    if (nonnegative(slot.playersAvailable, "playersAvailable") === 0) continue;
    if (typeof slot.id !== "string" || !slot.id) throw new TypeError("Invalid tee slot id");
    if (slotIds.has(slot.id)) continue;
    slotIds.add(slot.id);
    courseIds.add(slot.courseId);
  }
  return {
    date, dataDate: payload.date, coversToday: payload.date === date,
    openSlotsToday: slotIds.size, coursesWithLiveSlots: courseIds.size,
    fetchedAt: payload.fetchedAt ?? null,
  };
}

/**
 * curl GET /api/state on 2026-09-17 returned:
 * { setup: {teamA:{name,color}, teamB:{name,color}, matchTarget:18,
 *   matches:[{id,aPlayers,bPlayers}], bonuses:[{id,type,hole,points}]},
 *   scores: {[matchId]: {a,b}}, bonusWinners: {[bonusId]: "a"|"b"|null} }.
 * Mirror archive/BBC/src/App.jsx Scoreboard: sum holes for configured matches,
 * then add configured bonuses awarded to each team. These are not match wins.
 * The captured score is Blue 41 - 29 Green (39/27 holes plus 2/2 bonuses).
 */
export function deriveBBCState(payload) {
  const setup = record(payload?.setup, "BBC setup");
  const scores = record(payload.scores, "BBC scores");
  const winners = record(payload.bonusWinners, "BBC bonus winners");
  if (!Array.isArray(setup.matches) || !Array.isArray(setup.bonuses)) throw new TypeError("Invalid BBC setup");
  function team(key, config, fallback) {
    record(config, "BBC team");
    const name = typeof config.name === "string" ? config.name.replace(/\s+/g, " ").trim() || fallback : fallback;
    const holes = setup.matches.reduce((sum, match) => sum + Math.round(nonnegative(scores[match.id]?.[key] ?? 0, "BBC holes")), 0);
    const bonus = setup.bonuses.reduce((sum, item) => sum + (winners[item.id] === key ? nonnegative(item.points, "BBC bonus") : 0), 0);
    return { name, color: config.color, holes, bonus, score: holes + bonus };
  }
  const teamA = team("a", setup.teamA, "Team A");
  const teamB = team("b", setup.teamB, "Team B");
  return { teamA, teamB, matchCount: setup.matches.length, scoreSummary: `${teamA.name} ${teamA.score} - ${teamB.score} ${teamB.name}` };
}
