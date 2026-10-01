# Live data drop-in, round 13, 2026-09-17

Copy these two runtime files into the round 14 Pages project. No runtime dependencies, bindings, API keys, or build step are needed.

| Lane file | Destination, relative to the Pages project root |
|---|---|
| `functions/api/live/[[path]].ts` | `functions/api/live/[[path]].ts` |
| `live.js` | `public/live.js`, or the equivalent static asset directory |

Keep `functions/` beside `public/`, not inside it. Copy only `[[path]].ts` from the function directory. The tests, saved samples, package.json, manifest, and reports are development assets. Do not copy them into the site's public output or overwrite the site's package.json. If the site already uses a Pages advanced-mode `_worker.js`, its routing must be integrated separately. If it has `_routes.json`, include `/api/live/*` in the function routes.

The requested runtime filenames stay stable for drop-in use. Samples and verification evidence are dated 2026-09-17.

## Routes

| Proxy path | Fixed upstream |
|---|---|
| `/api/live/sigz/tracks` | `https://sigzmusic.com/api/tracks` |
| `/api/live/sigz/albums` | `https://sigzmusic.com/api/albums` |
| `/api/live/sigz/health` | `https://sigzmusic.com/api/health` |
| `/api/live/bbc/state` | `https://bbc.sigouin.net/api/state` |
| `/api/live/tee/teetimes` | `https://teetime.sigouin.net/api/teetimes` |
| `/api/live/tee/courses` | `https://teetime.sigouin.net/api/courses` |

Only exact pathnames match. Unknown paths return `404 {}`. Known paths accept GET and HEAD; other methods, including OPTIONS, return `405 {}` with `Allow: GET, HEAD`. HEAD has no response body. A cache miss for HEAD fetches the upstream with GET and fills the same JSON cache as GET.

Successful responses set `Content-Type: application/json`, `Cache-Control: public, max-age=60`, and `X-Live-Source: <upstream host>`. The function stores successful JSON in `caches.default` under the proxy origin and path for 60 seconds. Query strings are removed from both the cache key and the upstream request. GET and HEAD share the entry. Edge cache read or write failure falls back to the public fetch result.

Each response allows exactly one CORS origin: `https://www.sigouin.net` when that exact Origin was requested, otherwise `https://sigouin.net`. It sets `Vary: Origin` and exposes `X-Live-Source`. CORS is added after cache lookup, so a cached apex response cannot break www. It never reflects any other origin and never enables credentials. Same-origin local reads still work.

The upstream deadline is five seconds, including body consumption. HTTP errors, network errors, redirects, timeout, empty bodies, and invalid JSON produce `502 {"error":"upstream","host":"..."}` and `Cache-Control: no-store`. Errors are not cached. SiGz and BBC currently lack CORS headers; this same-origin bridge supplies them. TeeTimes supports direct CORS but uses the same interface here.

## Browser use

Import from the static file in a module script. Put an initial known raw value in `data-live-value` if the initial text uses locale-specific formatting. Otherwise a placeholder such as `...` remains until the first successful fetch.

```html
<span id="sigz-plays">...</span>
<span id="tee-slots">...</span>
<span id="bbc-score">...</span>
<style>.stale { opacity: 0.55; }</style>
<script type="module">
  import {
    pollNumber, pollLive, deriveSigzTracks, deriveTeeTimes, deriveBBCState
  } from '/live.js';

  const plays = pollNumber(
    '/api/live/sigz/tracks', document.querySelector('#sigz-plays'),
    payload => deriveSigzTracks(payload).totalPlays
  );

  const slots = pollNumber(
    '/api/live/tee/teetimes', document.querySelector('#tee-slots'),
    payload => {
      const stats = deriveTeeTimes(payload);
      if (!stats.coversToday) throw new Error('Feed does not cover today');
      return stats.openSlotsToday;
    }
  );

  const score = document.querySelector('#bbc-score');
  const scoreboard = pollLive('/api/live/bbc/state', {
    onData(payload) {
      score.textContent = deriveBBCState(payload).scoreSummary;
      score.classList.remove('stale');
    },
    onError() { score.classList.add('stale'); }
  });

  // On component teardown call plays.stop(), slots.stop(), scoreboard.stop().
</script>
```

`pollLive(route, {onData, onError, intervalMs})` runs immediately, then every 30 seconds by default. Callbacks are synchronous. Hidden tabs stop their timer and abort the active read. Showing the tab refreshes immediately. Overlapping reads and late results from hidden/stopped polls are ignored. It returns `{refresh, stop}`. `fetchProxy(route, {signal})` performs one read with an eight-second client deadline. It accepts only the six relative paths above and sends no cookies.

`updateNumber(node, next, {format})` counts from the last shown number with cubic ease-out over 600 ms using requestAnimationFrame. Reduced motion jumps immediately, including when the preference changes during the count. The optional formatter receives the current numeric value. The default uses whole numbers. `markStale(node)` freezes the display and adds `stale`. `pollNumber(route, node, select, {format, intervalMs})` connects those behaviors and returns `{refresh, stop}`. Fetch, JSON, and selector failures preserve the last displayed number. The next valid number removes `stale`.

## Payload facts and date limits

All six dated files in `samples/` are unmodified public curl GET responses. `samples/provenance-2026-09-17.json` records their URLs, response dates, headers, wire byte counts, and SHA-256 hashes. Tests use these files and mocked fetch without a network connection.

| Helper | Saved sample result | Meaning |
|---|---|---|
| `deriveSigzTracks(payload)` | `totalPlays: 94`, `trackCount: 69`, `latestReleaseDate: "2024-06-14"` | Sum every track's cumulative `playCount`; this is not plays today. |
| `deriveTeeTimes(payload, {now, timeZone})` | At `now: "2026-09-18T12:00:00Z"`, `openSlotsToday: 99`, `coursesWithLiveSlots: 5` | One positive-availability tee-time record is one slot, regardless of available golfer seats. |
| `deriveBBCState(payload)` | `scoreSummary: "Blue 41 - 29 Green"`, `matchCount: 6` | Sum configured match holes plus awarded bonus points. |

SiGz returns `{tracks:[...]}`. The helper also returns per-track `slug`, `title`, `playCount`, `releaseDate`, optional `accentColor`, and optional `peaks`. No tracks in this capture contain inline peaks; the client does not fabricate waveforms or fetch unallowlisted assets. `latestReleaseDate` is null if no valid dates are present.

TeeTimes returns `{date,fetchedAt,mock,courses:[{id,live,...}],slots:[{id,courseId,date,time,playersAvailable,source,...}],...}`. The helper uses the Toronto calendar date by default, matching the Ottawa-area courses. It counts live courses with at least one open slot today, ignores mock slots, deduplicates slot IDs, and rejects a mock response. `fetchedAt`, `dataDate`, `date`, and `coversToday` are returned alongside the counts.

**The actual September 17 response is for September 18.** At the capture time, the helper returns zero matching slots and `coversToday: false`. That flag means today's availability is unknown, not that all courses are full. Use the guard in the example to retain the last known count, or explicitly label the feed's date. The fixed proxy deliberately cannot add a date query. The captured `sources.chronogolf` also reports 9 successful and 19 failed courses, so the data is a partial view of availability. A reliable today feed requires an upstream default-date change or an explicitly revised proxy contract.

BBC returns `{setup:{teamA,teamB,matchTarget,matches,bonuses},scores:{[matchId]:{a,b}},bonusWinners:{[bonusId]:"a"|"b"|null}}`. Its own `archive/BBC/src/App.jsx` Scoreboard sums holes for configured matches and adds the configured awarded bonuses. The helper follows that logic: Blue has 39 holes plus 2 bonuses; Green has 27 holes plus 2 bonuses. The state has no timestamp or event-date field. Treat it as the current saved scoreboard, not proof that an event is happening now. Render its summary with `textContent`.

## Offline checks and local Pages smoke test

From this lane directory:

```sh
node --version
node --test
python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/check-assets.py /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/proxy
```

Node v26.3.0 imports the TypeScript function directly in the tests. No esbuild, transpilation, or network install is used. The package.json is only for this development bundle's ES module mode.

After copying the runtime files, use this exact command from the Pages project root with `public/` as its static directory and Wrangler already installed or cached:

```sh
npx --offline wrangler pages dev public --ip 127.0.0.1 --port 8788 --compatibility-date 2026-09-17
```

In another terminal, check both an allowed read and an unknown path:

```sh
curl --silent --show-error --include --request GET --header 'Origin: https://www.sigouin.net' http://127.0.0.1:8788/api/live/sigz/tracks
curl --silent --show-error --include --request GET http://127.0.0.1:8788/api/live/unknown
curl --silent --show-error --head http://127.0.0.1:8788/api/live/bbc/state
```

Expect 200 JSON with the headers above, 404 with `{}`, and a bodyless HEAD respectively. The offline flag prevents a package download; the smoke test's allowed API reads still require a network connection. This is local development only. No deployment command is needed.

The handler and local command follow Cloudflare's [Pages API reference](https://developers.cloudflare.com/pages/functions/api-reference/), [Cache API documentation](https://developers.cloudflare.com/workers/runtime-apis/cache/), and [Pages local development documentation](https://developers.cloudflare.com/pages/functions/local-development/). Actual production edge TTL and round 14 integration remain unverified until the authorized build and release stages.

## Security notes

The allowlist is the complete routing policy. There is no arbitrary URL input, hostname substitution, query passthrough, or client header/cookie/body forwarding. Redirects are rejected. No environment variables, bindings, secrets, keys, or authenticated endpoints are used. Cached responses are reconstructed from public JSON; upstream cookies and arbitrary headers are discarded. The CORS policy is browser access control, not authentication. API consumers outside a browser can read these already-public payloads.

`cors-probe.json` records the required TeeTimes probe with Origin `https://sigouin.net`: HTTP 200, `access-control-allow-origin: *`, `cache-control: public, max-age=60`, 68,328 bytes. Its sample is the exact response from that GET.
