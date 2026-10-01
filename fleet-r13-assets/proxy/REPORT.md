# PROXY round 13 report

Completed assets for Luc Sigouin's portfolio hub. Started 2026-09-17 at 13:31 UTC. The first report draft was saved at the start, within ten minutes. All writes stayed in this lane. Requested and effective model: gpt-6-astra, source: spawn flag.

## What I made and design

`functions/api/live/[[path]].ts` is a dependency-free Pages Function. It exposes exactly six fixed public API routes. Known routes accept GET and HEAD. Unknown paths return 404 with an empty JSON object. Other methods on known routes return 405. Client queries, headers, cookies, and bodies never reach the upstream. Redirects are rejected.

The function reconstructs JSON responses, adds the source host header, and caches successful reads for 60 seconds in caches.default. The cache key is the proxy origin and path without queries or client headers. HEAD and GET share the same full JSON entry. CORS is applied after the cache lookup: the exact www Origin gets www, and other requests get the apex origin. Vary: Origin prevents a shared browser cache from mixing these responses. It never reflects an unapproved origin.

A five-second AbortController deadline covers headers and the JSON body. Upstream HTTP errors, timeout, network errors, redirects, and invalid JSON return a non-cacheable 502 with the specified error and host fields. Cache failure does not turn a successful upstream response into a failure.

`live.js` supplies one-shot fetch, immediate and 30-second polling while visible, cancellation on hiding or teardown, manual refresh, and protection against late responses. Numeric nodes ease for 600 ms, jump for reduced motion, retain the last display on failure, and gain the stale class. Recovery removes stale. Real schema helpers derive SiGz track statistics, Toronto-date tee slot counts, and BBC totals including bonuses.

The README shows the two runtime copy destinations, browser integration, API contracts, security behavior, and the exact local wrangler pages dev command. The four code files are the two runtime modules and two offline test modules. Node v26.3.0 imports the TypeScript directly. No build step or dependency install was used.

## Public evidence

Six unmodified curl GET responses are saved with dated names in samples/. Every GET used Origin https://sigouin.net and no keys or credentials. The provenance JSON records source URLs, response dates, byte counts, and SHA-256 hashes. The required tee-times CORS probe is also recorded in cors-probe.json.

| Feed | Status | CORS allow origin | Cache-Control | Wire bytes |
|---|---|---|---|---|
| SiGz tracks | 200 | absent | private, max-age=120 | 14,387 |
| SiGz albums | 200 | absent | private, max-age=120 | 1,242 |
| SiGz health | 200 | absent | no-store | 11 |
| BBC state | 200 | absent | absent | 1,000 |
| TeeTimes tee times | 200 | * | public, max-age=60 | 68,328 |
| TeeTimes courses | 200 | * | public, max-age=60 | 25,859 |

SiGz has 69 tracks, 94 cumulative plays, and latest release date 2024-06-14. The capture has per-track accent colors but no inline peaks. TeeTimes has 99 positive-availability tee times across five live courses for 2026-09-18. That is tomorrow relative to the capture. The helper returns coversToday: false on September 17, and the integration example retains the last known number in that case. The upstream reports 9 successful and 19 failed course fetches, so the snapshot is partial.

BBC's public response contains setup, scores by match ID, and bonusWinners by bonus ID. I read the archived app's Scoreboard calculation in /Users/ls/Claude-Workspace/personal/archive/BBC/src/App.jsx without changing it. The correct saved summary is Blue 41 - 29 Green: 39 and 27 holes, plus two bonus points per team. Summing match wins would be incorrect for this app.

Spend: 0 credits and USD 0. No paid asset service or paid generation was used. Credit balance before and after: not queried, because no paid service was called.

## Validation

Command: node --test, from this lane. Node: v26.3.0. Exit: 0. The tests read saved samples and mock every fetch. No network is needed. The mocked cache verifies the intended TTL; it is not a production edge-cache observation.

Exact test output from the successful run:

```text
✔ all six allowlist routes return the saved upstream JSON with cache/source/CORS headers (29.011625ms)
✔ unknown, encoded, extra-segment, trailing-slash and admin paths are empty-object 404s (0.690583ms)
✔ POST, PUT, DELETE and OPTIONS are 405 with Allow; no fetch or cache lookup (0.665208ms)
✔ queries and client headers never reach fetch or cache keys; query variants share cache (0.598041ms)
✔ apex and www CORS are selected on cache hits; untrusted origins are never reflected (0.617084ms)
✔ HEAD returns no body on miss, hit and errors; cached JSON remains usable by GET (1.843083ms)
✔ the modeled cache expires at 60 seconds (0.6865ms)
✔ upstream timeout aborts at 5000 ms and returns a non-cacheable 502 (0.522833ms)
✔ the timeout also covers an upstream body that never finishes (0.414416ms)
✔ HTTP failure, network failure, redirect rejection and invalid JSON are not cached (0.667625ms)
✔ cache read/write failure still serves a successful public response (0.469417ms)
✔ derive SiGz plays, count, newest date and per-track accents from the real sample (3.380291ms)
✔ optional SiGz peaks survive without mutating the source; dates are compared, not array order (1.2945ms)
✔ derive TeeTimes from the real sample: 99 open tee times, five courses, not golfer seats (4.852709ms)
✔ the actual capture covers tomorrow, and Toronto midnight differs from UTC (0.273792ms)
✔ TeeTimes excludes closed, duplicate, mock, non-live and other-date slots (0.466083ms)
✔ BBC sample summary includes configured match holes plus awarded bonuses (0.173333ms)
✔ BBC ignores orphaned scores/bonuses, treats unstarted matches as zero and stays one line (0.098958ms)
✔ unexpected payload shapes throw so a caller retains its last valid number (0.079833ms)
✔ fetchProxy uses a fixed relative path with no cookies, and rejects arbitrary URLs/queries (28.157625ms)
✔ fetchProxy surfaces non-OK JSON and malformed JSON as failures (0.393958ms)
✔ fetchProxy aborts a stalled request after eight seconds and honors a caller signal (0.490375ms)
✔ updateNumber uses a cubic ease for 600 ms and reaches the exact target (0.691ms)
✔ a new number interrupts the old animation at the displayed value; stale cancels it (0.299959ms)
✔ reduced motion jumps immediately and changing the preference finishes an active count (0.195083ms)
✔ pollLive fetches immediately/every 30 s, pauses while hidden, resumes immediately and cleans up (4.5195ms)
✔ a hidden initial tab does not fetch until it becomes visible (0.4695ms)
✔ in-flight reads do not overlap, are aborted on hide, and cannot update the DOM late (0.558334ms)
✔ pollNumber retains the last number and marks stale on fetch or derivation failure, then recovers (0.792708ms)
✔ a first failed poll keeps placeholder text, rather than displaying a fabricated zero (0.269542ms)
ℹ tests 30
ℹ suites 0
ℹ pass 30
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 157.614125
```

Asset gate command:

```sh
python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/check-assets.py /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/proxy
```

Exit: 0. Output:

```text
PASS: proxy 17 files, kinds ['code', 'data'], model {'requested': 'gpt-6-astra', 'effective': 'gpt-6-astra', 'source': 'spawn flag'}
```

The additional inventory audit verified every sample hash, each manifest byte count, all files staying within the lane, four code entries, and no em dashes. Work completed within the 45-minute timebox.

## Could not verify

- No deployment, push, publication, DNS change, or production Pages test was performed. Production edge TTL, final routing rules, and round 14 site integration remain unverified.
- The local Wrangler smoke command is documented but was not run. The cached Wrangler CLI can select an existing account configuration directory outside the lane. I did not load that configuration or any secret; offline handler tests ran directly under Node instead.
- Today's TeeTimes availability cannot be established from the fixed default endpoint: the public response covers tomorrow and some courses failed upstream. The helper exposes the date mismatch rather than claiming zero availability today. Changing that upstream behavior is outside this allowlist contract.
- Real inline SiGz peaks could not be checked because the sample contains none. Preservation is covered with a labeled synthetic test variant of the sample. BBC state has no update timestamp or event date, so a saved score does not establish that a tournament is currently in progress.

## Rubric self-check

| # | Criterion | Result and evidence |
|---|---|---|
| 1 | Real, not invented | Pass. Six unmodified public API samples, hashes, response metadata, and a real source-code check for BBC totals. Synthetic test variants are labeled and are not capture assets. No generated UI or stock assets. |
| 2 | Web-ready | Pass. Two dependency-free runtime modules with the exact requested drop-in filenames. Supporting samples and evidence use dated filenames. Stable runtime and required control filenames follow the explicit task. Media limits do not apply. |
| 3 | Manifest twin | Pass. The asset gate exits 0. Manifest lists all 17 code and data deliverables with absolute paths, exact byte sizes, null posters, and one-line sources. README is data. |
| 4 | Honesty | Pass. Spend is zero. This report distinguishes offline tests, live public probes, and unverified production behavior. |
| 5 | Scope | Pass. All writes are in proxy/. Other permitted files were read-only. No .env or secret was opened. No deploy, publish, push, DNS change, browser launch, or work/ access. |
| 6 | Plain words | Pass. Short explanations, no em dashes in authored files, and a concrete handoff. |
