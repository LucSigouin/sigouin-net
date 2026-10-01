/**
 * Public, read-only JSON bridge for sigouin.net. SiGz and BBC have no CORS
 * headers for the hub. Only the six fixed upstream URLs below are reachable.
 */

type EdgeCache = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
};
type Context = {
  request: Request;
  waitUntil(promise: Promise<unknown>): void;
};

const UPSTREAMS = new Map([
  ["/api/live/sigz/tracks", "https://sigzmusic.com/api/tracks"],
  ["/api/live/sigz/albums", "https://sigzmusic.com/api/albums"],
  ["/api/live/sigz/health", "https://sigzmusic.com/api/health"],
  ["/api/live/bbc/state", "https://bbc.sigouin.net/api/state"],
  ["/api/live/tee/teetimes", "https://teetime.sigouin.net/api/teetimes"],
  ["/api/live/tee/courses", "https://teetime.sigouin.net/api/courses"],
]);
const APEX = "https://sigouin.net";
const WWW = "https://www.sigouin.net";
const TIMEOUT_MS = 5_000;

// CORS is applied AFTER the cache lookup so one origin cannot poison the other.
// HTTP permits only one origin in this header, not a comma-separated list.
function forClient(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", request.headers.get("Origin") === WWW ? WWW : APEX);
  headers.set("Access-Control-Expose-Headers", "X-Live-Source");
  headers.set("Vary", "Origin");
  return new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    headers,
  });
}

function json(body: unknown, status: number, host?: string): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": status === 200 ? "public, max-age=60" : "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (host) headers.set("X-Live-Source", host);
  return new Response(JSON.stringify(body), { status, headers });
}

export async function onRequest(context: Context): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);
  const upstream = UPSTREAMS.get(url.pathname);

  // Unknown paths stay 404 regardless of method. No upstream URL is user input.
  if (!upstream) return forClient(json({}, 404), request);
  const host = new URL(upstream).host;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const response = json({}, 405, host);
    response.headers.set("Allow", "GET, HEAD");
    return forClient(response, request);
  }

  // One cache entry per proxy origin + path, shared by GET and HEAD. Strip all
  // queries and client headers before lookup as well as before upstream fetch.
  const cacheKey = new Request(`${url.origin}${url.pathname}`, { method: "GET" });
  const cache = (globalThis as typeof globalThis & { caches?: { default?: EdgeCache } }).caches?.default;
  if (cache) {
    try {
      const cached = await cache.match(cacheKey);
      if (cached) return forClient(cached, request);
    } catch {
      // A cache outage must not prevent a public read.
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    // Build this request from scratch. Never clone or spread the client request.
    // Workers supports manual redirects, not redirect: "error". The !ok check
    // below rejects every 3xx without following it beyond the fixed allowlist.
    const upstreamResponse = await fetch(upstream, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
      redirect: "manual",
      signal: controller.signal,
    });
    if (!upstreamResponse.ok) {
      await upstreamResponse.body?.cancel();
      throw new Error("upstream status");
    }
    // Keep the deadline active through body consumption. Invalid JSON is a 502.
    const body = await upstreamResponse.json();
    response = json(body, 200, host);
  } catch {
    return forClient(json({ error: "upstream", host }, 502, host), request);
  } finally {
    clearTimeout(timeout);
  }

  if (cache) {
    // Only successful JSON is stored. Upstream cookies and private cache headers
    // are discarded; these are fixed public, unauthenticated API reads.
    const copy = response.clone();
    context.waitUntil(Promise.resolve().then(() => cache.put(cacheKey, copy)).catch(() => {}));
  }
  return forClient(response, request);
}
