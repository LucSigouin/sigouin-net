import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { onRequest } from "./[[path]].ts";

const routes = [
  ["sigz/tracks", "https://sigzmusic.com/api/tracks", "sigz-tracks"],
  ["sigz/albums", "https://sigzmusic.com/api/albums", "sigz-albums"],
  ["sigz/health", "https://sigzmusic.com/api/health", "sigz-health"],
  ["bbc/state", "https://bbc.sigouin.net/api/state", "bbc-state"],
  ["tee/teetimes", "https://teetime.sigouin.net/api/teetimes", "tee-teetimes"],
  ["tee/courses", "https://teetime.sigouin.net/api/courses", "tee-courses"],
];
const fixtures = new Map(await Promise.all(routes.map(async ([route, , name]) => [
  route, await readFile(new URL(`../../../samples/${name}-2026-09-17.json`, import.meta.url), "utf8"),
])));

function setGlobal(t, name, value) {
  const before = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  t.after(() => before ? Object.defineProperty(globalThis, name, before) : delete globalThis[name]);
}

function harness(t, fetcher) {
  const entries = new Map();
  const gets = [];
  const puts = [];
  const background = [];
  let now = 0;
  const cache = {
    async match(key) {
      gets.push(key);
      const found = entries.get(key.url);
      return found && found.expires > now ? found.response.clone() : undefined;
    },
    async put(key, response) {
      puts.push({ key, response: response.clone() });
      assert.equal(response.headers.get("Cache-Control"), "public, max-age=60");
      entries.set(key.url, { response: response.clone(), expires: now + 60_000 });
    },
  };
  setGlobal(t, "caches", { default: cache });
  const fetchMock = t.mock.method(globalThis, "fetch", fetcher ?? (async () => new Response(fixtures.get("sigz/tracks"))));
  async function call(path = "/api/live/sigz/tracks", init = {}, origin = "https://sigouin.net") {
    const response = await onRequest({
      request: new Request(`${origin}${path}`, init),
      waitUntil(promise) { background.push(promise); },
    });
    await Promise.all(background);
    return response;
  }
  return { call, fetchMock, cache, entries, gets, puts, advance(ms) { now += ms; } };
}

test("all six allowlist routes return the saved upstream JSON with cache/source/CORS headers", async t => {
  const h = harness(t, async url => {
    const [route] = routes.find(([, expected]) => expected === url);
    return new Response(fixtures.get(route), {
      headers: { "Cache-Control": "private, max-age=120", "Set-Cookie": "test-only=discard", "X-Upstream": "discard" },
    });
  });
  for (const [route, upstream] of routes) {
    const response = await h.call(`/api/live/${route}`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), JSON.parse(fixtures.get(route)));
    assert.equal(response.headers.get("Content-Type"), "application/json");
    assert.equal(response.headers.get("Cache-Control"), "public, max-age=60");
    assert.equal(response.headers.get("X-Live-Source"), new URL(upstream).host);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://sigouin.net");
    assert.equal(response.headers.get("Vary"), "Origin");
    assert.equal(response.headers.get("Set-Cookie"), null);
    assert.equal(response.headers.get("X-Upstream"), null);
  }
  assert.equal(h.fetchMock.mock.callCount(), 6);
  assert.equal(h.puts.length, 6);
});

test("unknown, encoded, extra-segment, trailing-slash and admin paths are empty-object 404s", async t => {
  const h = harness(t);
  for (const path of ["/api/live", "/api/live/", "/api/live/admin", "/api/live/sigz/key", "/api/live/sigz/tracks/", "/api/live/sigz/tracks/extra", "/api/live/sigz/%74racks", "/api/live/tee/health", "/api/live/__proto__"]) {
    const response = await h.call(path);
    assert.equal(response.status, 404, path);
    assert.deepEqual(await response.json(), {});
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
  assert.equal((await h.call("/api/live/missing", { method: "POST" })).status, 404);
  assert.equal(h.fetchMock.mock.callCount(), 0);
});

test("POST, PUT, DELETE and OPTIONS are 405 with Allow; no fetch or cache lookup", async t => {
  const h = harness(t);
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = await h.call("/api/live/bbc/state", { method, body: "test-only-body" });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "GET, HEAD");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await response.json(), {});
  }
  assert.equal(h.fetchMock.mock.callCount(), 0);
  assert.equal(h.gets.length, 0);
});

test("queries and client headers never reach fetch or cache keys; query variants share cache", async t => {
  const h = harness(t);
  await h.call("/api/live/sigz/tracks?url=https%3A%2F%2Fexample.test&date=2020-01-01", {
    headers: { Cookie: "test-only-cookie", Authorization: "Bearer test-only", Range: "bytes=0-1", "X-Client": "discard" },
  });
  await h.call("/api/live/sigz/tracks?another=query");
  assert.equal(h.fetchMock.mock.callCount(), 1);
  const [url, init] = h.fetchMock.mock.calls[0].arguments;
  assert.equal(url, "https://sigzmusic.com/api/tracks");
  assert.equal(init.method, "GET");
  assert.equal(init.credentials, "omit");
  assert.equal(init.redirect, "error");
  assert.deepEqual([...new Headers(init.headers)], [["accept", "application/json"]]);
  assert.equal(init.body, undefined);
  for (const key of h.gets) {
    assert.equal(key.url, "https://sigouin.net/api/live/sigz/tracks");
    assert.equal(key.method, "GET");
    assert.deepEqual([...key.headers], []);
  }
});

test("apex and www CORS are selected on cache hits; untrusted origins are never reflected", async t => {
  const h = harness(t);
  await h.call();
  for (const [origin, expected] of [
    ["https://www.sigouin.net", "https://www.sigouin.net"],
    ["https://sigouin.net", "https://sigouin.net"],
    ["https://attacker.test", "https://sigouin.net"],
    ["https://www.sigouin.net.attacker.test", "https://sigouin.net"],
    ["null", "https://sigouin.net"],
  ]) {
    const response = await h.call("/api/live/sigz/tracks", { headers: { Origin: origin } });
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), expected);
    assert.equal(response.headers.get("Access-Control-Allow-Credentials"), null);
    assert.equal(response.headers.get("Access-Control-Expose-Headers"), "X-Live-Source");
    assert.equal(response.headers.get("Vary"), "Origin");
  }
  assert.equal(h.fetchMock.mock.callCount(), 1);
  assert.equal(h.puts[0].response.headers.get("Access-Control-Allow-Origin"), null);
});

test("HEAD returns no body on miss, hit and errors; cached JSON remains usable by GET", async t => {
  const h = harness(t);
  for (let i = 0; i < 2; i += 1) {
    const response = await h.call("/api/live/sigz/tracks", { method: "HEAD" });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "");
    assert.equal(response.headers.get("Cache-Control"), "public, max-age=60");
  }
  assert.deepEqual(await (await h.call()).json(), JSON.parse(fixtures.get("sigz/tracks")));
  assert.equal(h.fetchMock.mock.callCount(), 1);
  assert.equal(h.fetchMock.mock.calls[0].arguments[1].method, "GET");
  const missing = await h.call("/api/live/missing", { method: "HEAD" });
  assert.equal(missing.status, 404);
  assert.equal(await missing.text(), "");
});

test("the modeled cache expires at 60 seconds", async t => {
  const h = harness(t);
  await h.call();
  h.advance(59_999);
  await h.call();
  assert.equal(h.fetchMock.mock.callCount(), 1);
  h.advance(1);
  await h.call();
  assert.equal(h.fetchMock.mock.callCount(), 2);
});

test("upstream timeout aborts at 5000 ms and returns a non-cacheable 502", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let signal;
  let began;
  const started = new Promise(resolve => { began = resolve; });
  const h = harness(t, (url, init) => new Promise((resolve, reject) => {
    signal = init.signal;
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    began();
  }));
  const pending = h.call();
  await started;
  t.mock.timers.tick(4_999);
  assert.equal(signal.aborted, false);
  t.mock.timers.tick(1);
  const response = await pending;
  assert.equal(signal.aborted, true);
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "upstream", host: "sigzmusic.com" });
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(h.puts.length, 0);
});

test("the timeout also covers an upstream body that never finishes", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let began;
  const started = new Promise(resolve => { began = resolve; });
  const h = harness(t, async (url, { signal }) => new Response(new ReadableStream({
    start(controller) {
      signal.addEventListener("abort", () => controller.error(signal.reason), { once: true });
      began();
    },
  })));
  const pending = h.call();
  await started;
  t.mock.timers.tick(5_000);
  assert.equal((await pending).status, 502);
  assert.equal(h.puts.length, 0);
});

test("HTTP failure, network failure, redirect rejection and invalid JSON are not cached", async t => {
  const modes = [
    () => new Response("unavailable", { status: 503 }),
    () => { throw new TypeError("network unavailable"); },
    () => { throw new TypeError("redirect rejected"); },
    () => new Response("<html>not JSON</html>"),
    () => new Response(null, { status: 204 }),
  ];
  let i = 0;
  const h = harness(t, async () => modes[i++]());
  for (const mode of modes) {
    const response = await h.call();
    assert.equal(response.status, 502, String(mode));
    assert.deepEqual(await response.json(), { error: "upstream", host: "sigzmusic.com" });
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("X-Live-Source"), "sigzmusic.com");
  }
  assert.equal(h.puts.length, 0);
  assert.equal(h.fetchMock.mock.callCount(), modes.length);
});

test("cache read/write failure still serves a successful public response", async t => {
  const h = harness(t);
  h.cache.match = async () => { throw new Error("cache read failed"); };
  h.cache.put = async () => { throw new Error("cache write failed"); };
  assert.equal((await h.call()).status, 200);
  setGlobal(t, "caches", undefined);
  assert.equal((await h.call()).status, 200);
});
