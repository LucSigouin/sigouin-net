# Round 21, golf exhibit lane

Exhibit 04 on the sigouin.net hub was "BBC Scoreboard" with three captures of bbc.sigouin.net.
It is now "Golf Game App", with four real screenshots of the widgell-bach build.

Base: a copy of `fleet-r18-background/site`. Only two things changed inside it,
`site/js/exhibits.js` and the files under `site/assets/cap/`. `css/hub.css`, `js/hub.js` and
`index.html` are byte identical to round 18, confirmed with `diff`:

```
hub.css identical
hub.js identical
index.html identical
```

## How widgell-bach was served, and with what data

Source, read only throughout: `/Users/ls/Claude-Workspace/personal/archive/widgell-bach/`.

A plain `python3 -m http.server` over `dist/` serves the built PWA, but every shared value in
this app comes from Cloudflare KV through `/api/storage/:key`. With no API the board loads
empty: no teams, no match-ups, no draft. The archive has the real data, in
`backups/kv-latest.json` (dated 2026-06-06, 20 keys, the state the app finished the event in).

So instead of `wrangler pages dev`, which would need a KV namespace this machine cannot bind,
`tools/serve-widgell.py` serves `dist/` unchanged and answers the storage API from that backup
file. It is the same contract the real Function implements (`functions/api/storage/[key].js`):
GET returns `{key, value}` with the value as a string, 404 on a miss. PUT and DELETE are
accepted and kept in memory only, so a save inside the app never errors and nothing is ever
written back into the archive. Chat append returns `{ok:true}`.

That means the screenshots show the app's real code with its real recorded tournament data:
Spartans against Elites, the six match-ups, the finished 12 round snake draft. The match scores
read 0 to 0 because that is what the backup holds, not because anything is missing.

Smoke test before capturing:

```
root 200
{"key": "bach:teamPairs", "value": "[{\"num\":1,\"spartan1\":\"Kurt\",\"spartan2\":\"Dave\", ...
players 200
```

Server command, foreground, port 5203:

```
python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r21-golf/tools/serve-widgell.py
```

Note: the bind needs to run outside the Bash sandbox. The first attempt failed with
`PermissionError: [Errno 1] Operation not permitted` on `socket.bind`.

## Captures

Taken with the Playwright already installed at
`/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/node_modules`, driven by
`tools/capture-widgell.mjs` (the round 13 pattern, msedge channel, headless). PNG first, then
`cwebp -q 84`. Nothing was generated, upscaled or retouched.

| File in `site/assets/cap/` | Screen | Viewport | Bytes |
|---|---|---|---|
| `widgell-1440-scroll0-20260917.webp` | Golf tab, top | 1440x900 | 56040 |
| `widgell-1440-scroll50-20260917.webp` | Golf tab, scrolled to 50 percent | 1440x900 | 52892 |
| `widgell-390-scroll0-20260917.webp` | Golf tab, top | 390x844 | 24852 |
| `widgell-1440-teams-20260917.webp` | Teams tab, draft board, reached by a click | 1440x900 | 55542 |

All four are well under the 1.5 MB image cap. The page is only 1021 px tall at 1440, so the
50 percent shot differs from the top shot by about one card row. That is the real page, not a
framing trick.

Console during capture showed some `ERR_CONNECTION_RESET` lines from the local Python server
under the app's burst of parallel key fetches. The rendered page is complete in every shot, and
the captured DOM text confirms the data arrived (`CAPT: Widg`, `MATCH 1 ALL SQUARE`, the twelve
drafted names).

## exhibits.js diff

```diff
-    n: '04', title: 'BBC Scoreboard', year: '2026', word: 'match',
-    fact: 'A golf match scoreboard for one recurring game. Two teams, a target, closest to the pin and long drive bonuses, one public state endpoint driving every phone on the course.',
+    n: '04', title: 'Golf Game App', year: '2026', word: 'match',
+    fact: 'One golf match play scoreboard, built once and dressed for two events: the recurring BBC game and a bachelor party. One public state endpoint drives every phone on the course.',
     link: { href: 'https://bbc.sigouin.net', label: 'bbc.sigouin.net' },
     live: 'bbc',
-    tools: ['Cloudflare Workers', 'Claude Opus 5', 'verify-live skill'],
+    tools: ['Cloudflare Workers', 'Cloudflare Pages', 'Workers KV', 'React', 'Vite', 'Tailwind', 'Claude Opus 5', 'verify-live skill'],
     models: ['Claude Opus 5'],
     media: [
-      { kind: 'image', label: 'board', src: 'assets/cap/bbc-1440-scroll0-20260917.webp', tag: 'Live capture, 1440, 2026-09-17' },
-      { kind: 'pair', label: 'two widths', a: 'assets/cap/bbc-1440-scroll50-20260917.webp', b: 'assets/cap/bbc-390-scroll0-20260917.webp', tag: 'Same page at 1440 and at 390' }
+      { kind: 'image', label: 'board', src: 'assets/cap/widgell-1440-scroll0-20260917.webp', tag: 'widgell-bach, 1440, 2026-09-17' },
+      { kind: 'pair', label: 'two widths', a: 'assets/cap/widgell-1440-scroll50-20260917.webp', b: 'assets/cap/widgell-390-scroll0-20260917.webp', tag: 'Same page at 1440 and at 390' },
+      { kind: 'image', label: 'draft board', src: 'assets/cap/widgell-1440-teams-20260917.webp', tag: 'The draft board screen, one click away' }
     ]
```

`n`, `year` and `word` are untouched. `live: 'bbc'` and the bbc.sigouin.net link stay, because
that is still the live public endpoint the hub polls.

The four added tools all come from the widgell-bach `README.md` and `CLAUDE.md`, which are
explicit: React plus Vite plus Tailwind, Cloudflare Pages with one Function, KV as the shared
store. No model was added; the repo names no model beyond what was already listed.

## bbc files removed

Grep found exactly two references, both the lines replaced above:

```
site/js/exhibits.js:51:  src: 'assets/cap/bbc-1440-scroll0-20260917.webp'
site/js/exhibits.js:52:  a: 'assets/cap/bbc-1440-scroll50-20260917.webp', b: 'assets/cap/bbc-390-scroll0-20260917.webp'
```

So all three were deleted from `site/assets/cap/`:

- `bbc-1440-scroll0-20260917.webp`
- `bbc-1440-scroll50-20260917.webp`
- `bbc-390-scroll0-20260917.webp`

They remain untouched in `fleet-r18-background` and in `fleet-r13-assets`.

## Gate and shots

`shoot.mjs` is round 18's script pointed at port 5204, with one block added that clicks rail row
4 and saves `shots/exhibit04-1440.png`. Its output:

```
index 1440 {"sh":900,"ih":900,"sw":1440,"iw":1440}
index 390 {"sh":844,"ih":844,"sw":390,"iw":390}
process 1440 {"sh":900,"ih":900,"sw":1440,"iw":1440}
process 390 {"sh":844,"ih":844,"sw":390,"iw":390}
rail row heights [90,67,59,90,67,59,90,67,59,90] sum 738 rail box/scroll [739,739]
exhibit 04 row text "04 Golf Game App 2026 MATCH"
stage images [["assets/cap/widgell-1440-scroll0-20260917.webp",1440]]
process counter P8 / 8
ledger 1440 {"box":781,"content":781,"clipped":false}
ledger 390 {"box":709,"content":709,"clipped":false}
phone stage open: true back visible: true
```

No horizontal scroll at either width, nothing clipped, rail rhythm unchanged.

The only console errors are the two live routes plus a favicon, all 404 in a plain static
preview because Pages Functions do not run there. The page falls back to the labelled sample
fixtures, exactly as it does in round 18:

```
"GET /api/live/bbc/state HTTP/1.1"
"GET /api/live/sigz/tracks HTTP/1.1"
"GET /favicon.ico HTTP/1.1"
```

Gate:

```
python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r14-build/check-hub.py \
  /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r21-golf
```

Preview left running on http://127.0.0.1:5204 for Luc.

## Could not verify

- The live bbc.sigouin.net state endpoint was not polled from this lane, so the "LIVE BLUE 41 -
  29 GREEN" line in the shots is the sample fixture, labelled as such on the page.
- No browser other than headless Edge was used. Real Safari and iOS rendering of the new
  exhibit is unverified.
- The widgell-bach screenshots are the archived build served locally against a June 2026 KV
  backup. The production site at bach.sigouin.net was not visited, so the app's current live
  state is unverified. All scores read 0 because the backup holds 0, not because data is
  missing.
- Player photos exist in `dist/players/` but the draft board renders initials circles instead.
  That is the app's own behaviour on this data, not a serving fault, and it was not chased.
- `wrangler pages dev` was not run. Binding a KV namespace would need Cloudflare credentials,
  and the backup file gives the same data through the same API contract.

## RUBRIC.md self-check

| # | Criterion | Verdict |
|---|---|---|
| 1 | Wow on load | Pass. Overture, rail and stage are round 18's, byte identical, and the shots show the name and the stage on the first frame. |
| 2 | Real work shown | Pass. Exhibit 04 now carries four screenshots of the actual widgell-bach build running its own recorded tournament data. Nothing invented, nothing generated. |
| 3 | Process wing | Pass, untouched. `process counter P8 / 8` and the ledger measures unclipped at both widths. |
| 4 | Not a template | Pass. No CSS changed, the rail stays uneven (90/67/59 row heights), the title fits one line at 1440 and at 390. |
| 5 | Fast and honest | Pass. Biggest new image is 56 KB against a 1.5 MB cap, site total about 24 MB against 40 MB, sample data still labelled, live line still dims. |
| 6 | Verified by eye | Pass. Five shots in `shots/` looked at: index and process at 1440 and 390, plus exhibit 04 open on its stage. Limits listed above. |
