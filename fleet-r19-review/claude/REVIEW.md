# Round 19 review lane: claude

Target: `fleet-r17-noscroll/site/`, snapshotted unchanged to
`fleet-r19-review/claude/site-snapshot/` (19 MB, 60 assets, 7 source files).
Served from that snapshot at `http://127.0.0.1:5199/` (port 5196 was up but the
review ran against the snapshot, not the original). All line numbers below are
`site-snapshot/<path>:<line>` and match the r17 originals byte for byte.

Tooling actually run:

- `oxlint 1.83.0` + vendored `anti-slop` plugin, installed only in
  `fleet-r19-review/claude/lint/` (nothing written into any site folder).
- Playwright via `scrollcraft/builds/sigouin-net/node_modules/playwright-core`,
  driving the Chromium at `ms-playwright/chromium-1243`. Script:
  `probe.mjs`, raw output `probe.json`, screenshots in `shots/`.

---

## Anti-Slop

Install: no anti-slop installation existed anywhere in
`/Users/ls/Claude-Workspace/personal`. Vendored a fresh copy into the lane dir
with `node ~/.claude/skills/install-anti-slop/scripts/install.mjs`, then
`npm install --cache "$TMPDIR/npmcache" -D oxlint@1.83.0 @oxlint/plugins@1.83.0`.
All 19 generic rules plus `oxc/no-accumulating-spread` enabled at `error`. The
Effect plugin was not registered: no package manifest here declares `effect`.

Command and result:

```
$ ./node_modules/.bin/oxlint --config .oxlintrc.json src
116  anti-slop(require-readable-spacing)
  8  anti-slop(no-runtime-typeof)
  2  anti-slop(no-conditional-empty-object-spread)
  1  anti-slop(require-safety-comment-for-type-assertion)
  1  anti-slop(no-unknown-parameters)
  3  eslint(no-unused-vars)   [native, warning]
```

Per file: `live.js` 55, `js/hub.js` 44, `functions/api/live/[[path]].ts` 17,
`js/live-hub.js` 15.

### Findings that matter

**`functions/api/live/[[path]].ts:67` - `require-safety-comment-for-type-assertion`**
What: `(globalThis as typeof globalThis & { caches?: { default?: EdgeCache } }).caches?.default`
widens `globalThis` by assertion with no `SAFETY:` comment naming the invariant.
Why: `EdgeCache` is a hand-written shape, not the Workers type. If Cloudflare ever
changes `caches.default` the assertion keeps compiling and the proxy silently stops
caching. A one-line `SAFETY:` note stating "Workers runtime guarantees caches.default;
the optional chain covers local dev where it is absent" makes the risk reviewable.
Not noise.

**`functions/api/live/[[path]].ts:40` - `no-unknown-parameters`**
What: `function json(body: unknown, ...)` takes unparsed input.
Why: real but low value here. `body` is already `await upstreamResponse.json()`,
which is genuinely `unknown` at that point, and the function only calls
`JSON.stringify` on it. Tightening this would mean writing a schema per upstream
for data the proxy deliberately passes through without inspecting. Report it,
do not fix it.

**`live.js:197` and `live.js:198` - `no-conditional-empty-object-spread`**
What: `...(typeof item.accentColor === "string" ? { accentColor: item.accentColor } : {})`
and the same shape for `peaks`.
Why: genuine. The object built at `live.js:195-199` has a shape that changes with
input, so no consumer can rely on `accentColor` existing. Two explicit statements
after the literal say the same thing and let a reader see the real shape. Small fix,
about 4 lines.

**`live.js:139,150,166,170,174,197,229,257` - `no-runtime-typeof` (8 hits)**
What: `record()`, `nonnegative()`, `isoDate()` and the derive functions all branch
on `typeof`.
Why: this is the rule working as designed but pointed at code that is already the
parse boundary. `record`/`nonnegative`/`isoDate` ARE the validators that turn
untrusted upstream JSON into domain values, and they throw on failure. The rule
wants that work moved to a schema parser, which on a no-build static site means
adding a dependency the brief forbids. **Noise for this site.** The one exception
is `live.js:150`, `typeof select !== "function"` inside `pollNumber`, which is
dead code anyway (see Chisle audit) and should be deleted rather than fixed.

**`js/live-hub.js:47,53` and `js/hub.js:86` - `eslint(no-unused-vars)` on catch params**
What: `catch (_)` and `catch (_err)` bind a name nothing reads.
Why: cosmetic. Modern JS allows `catch {}` with no binding, which is both shorter
and silences the warning. 3 one-character edits.

**116 x `require-readable-spacing`**
What: the rule wants a blank line before most statements. `live.js` alone trips it
55 times, `js/hub.js` 44.
Why: **noise for this codebase, and I recommend leaving it off.** These files are
written in a deliberately dense hand-authored style that matches the CSS beside
them. Applying the autofix would inflate `live.js` and `js/hub.js` by roughly 40
percent in line count for zero behaviour change, and it would fight the Chisle
pass below, which wants those files shorter. If round 20 wants the rule, run its
autofix as its own commit, never mixed with a semantic change.

### Rules that found nothing

`no-array-filter-map`, `no-reduce-accumulator-copy`, `no-chained-type-assertions`,
`no-known-value-widening`, `no-module-mocking`, `no-object-parameters`,
`no-reflect-apply`, `no-reflect-get`, `no-shape-in-symbol-names`,
`no-unknown-returns`, `no-unknown-type-aliases`, `no-unsafe-dictionary-type`,
`no-widen-then-assert`, `oxc/no-accumulating-spread`. Clean.

Net: 3 findings worth acting on (`[[path]].ts:67`, `live.js:197-198`, the catch
bindings), 1 worth reporting only, 124 that are noise for a static site.

---

## Chisle audit

Ranked by lines removable. Total identified: about **255 lines**, roughly 20
percent of the 1282-line source.

### 1. `live.js:1-163` is dead on this site. ~160 lines.

`js/live-hub.js:6` is the only importer of `live.js` anywhere in the site, and it
imports exactly three names:

```
js/live-hub.js:6  import { deriveSigzTracks, deriveTeeTimes, deriveBBCState } from '../live.js';
```

Usage count across `index.html`, `process/index.html` and `js/*.js`:

```
pollLive           0
pollNumber         0
updateNumber       0
markStale          0
deriveSigzTracks   2
deriveTeeTimes     2
deriveBBCState     2
```

So everything from `live.js:3` (`LIVE_ROUTES`) through `live.js:163` ships and
parses on every page load and is never called: `LIVE_ROUTES`, `fetchProxy`,
`pollLive`, `markStale`, `updateNumber`, `pollNumber`, plus the module-level
`routes` Set, `numberStates` WeakMap and `numberFormat` Intl formatter. That block
contains a full polling loop with visibility handling, an easing animation with
`requestAnimationFrame`, a `prefers-reduced-motion` listener and a teardown
contract. `js/live-hub.js:44` does its own bare `fetch` and never touches any of it.

Keep `record`, `nonnegative`, `isoDate` and the three `derive*` functions
(`live.js:165-265`). Delete the rest, or if the polling code is wanted for a later
round, move it to a file nothing imports so it stops shipping.

This one change removes the single largest chunk of JS on the site and takes
`live.js` from 265 lines to roughly 105.

### 2. Repeated micro-label typography in `css/hub.css`. ~24 lines.

`text-transform:uppercase` appears **19 times**. The same four declarations
(small font-size, wide letter-spacing, uppercase, `--dim`) are re-typed at
`css/hub.css:70, 97, 114, 158, 182, 186, 209, 230, 255, 270` and two more inside
the phone block. One `--micro` class or a `%micro` pattern applied to those
selectors collapses about 24 lines and makes the scale editable in one place
instead of twelve.

### 3. Repeated orange-underline control style. ~6 lines.

The identical `color:var(--signal);border-bottom:1px solid currentColor` plus
uppercase and letter-spacing block is written five times:
`css/hub.css:71` (`.about-btn`), `:119` (`.about-panel button`), `:201`
(`.stage__back`), `:232` (`.proc-strip .meta button`), `:273` (`.ledger .close`).
They differ only in font-size and one `justify-self`. One `.link-btn` class used in
both HTML files removes four of the five.

### 4. Inline style strings inside `js/hub.js` templates. ~8 lines of very long lines.

`js/hub.js:52` builds each media toggle with a 150-character inline `style=`
attribute that recomputes `var(--signal)` vs `var(--dim)` per button.
`js/hub.js:55` does the same for the live note with five inline properties. Both
belong in `hub.css` behind a class plus `aria-pressed`, which also fixes the a11y
finding UI-6 below. The template lines shrink from 250 characters to about 60.

### 5. Dead and no-op CSS. ~4 lines.

- `css/hub.css:37` defines `.sr` (the visually-hidden helper). Grep of both HTML
  files: **0 uses**. Delete it or use it (see UI-2, the stage needs one).
- `css/hub.css:278` `@media (max-width:900px){ .overture{ animation-name:curtain } }`
  is a no-op. `css/hub.css:55` already sets `animation:curtain ...` in the base
  rule, so the override re-asserts the value that is already there.
- `css/hub.css:324` `*{scroll-behavior:auto !important}` inside the reduced-motion
  block. `html,body` carry `overflow:hidden` at `css/hub.css:21` and nothing on
  either page scrolls, so this targets a behaviour that cannot occur. It is also
  the only `!important` in the file.

### 6. Speculative belt-and-braces in the overture settle. ~5 lines.

`js/hub.js:135-138`:

```js
function settled() {
  if (document.documentElement.dataset.overture === 'settled') return;
  document.documentElement.dataset.overture = 'settled';
}
```

The guard protects an idempotent assignment. Setting a dataset value twice costs
nothing and triggers nothing. The function body is one line.

`js/hub.js:142-143` then registers both an `animationend` listener and a 3200 ms
`setTimeout` fallback. Keeping the timeout is defensible because `animationend`
does not fire if the element is display:none at start, but say so in the comment
instead of leaving a reader to guess which one normally wins.

### 7. `paintAll()` at `js/hub.js:128` duplicates work already done. 1 line.

`select(0)` at `js/hub.js:127` already called `paint(ex.live, ...)` for exhibit 01
via `js/hub.js:70`. `paintAll()` then walks every `[data-live]` in the document,
which re-includes that same stage node. The `cache` Map at `js/live-hub.js:37`
makes the second call cheap, so this is correctness-neutral, but the call should
be scoped to the footer (`paintAll(document.querySelector('.foot'))`) so the
intent is readable.

### 8. Nested try/catch in `js/live-hub.js:42-57`. ~5 lines.

Two stacked `try`/`catch` blocks express "try route, else try sample, else give
up". A flat sequence of two awaited attempts reads the same in fewer lines and
removes the shadowed `_` / `_err` catch bindings the linter flagged.

### 9. Verbose comments. ~7 lines.

The comment style here is mostly good: it explains why, not what. Three exceptions:

- `css/hub.css:129-131`, three lines to say the rail tracks add up to the rail
  height. The `grid-template-rows` line below it says that already.
- `js/hub.js:130-133`, four lines of banner comment for a nine-line block.
- `live.js:179-184` and `live.js:204-210`, long shape-documentation comments that
  describe payloads the derive functions validate line by line immediately below.
  These are worth keeping if the upstream shapes are not documented elsewhere;
  flagging them only so the round 20 author decides deliberately.

### Not over-engineered

`functions/api/live/[[path]].ts` is the right size for what it does. The fixed
`UPSTREAMS` map, the single-origin CORS header, the `AbortController` deadline
and the `waitUntil` cache write are each load-bearing. No cuts recommended there.
`js/exhibits.js` is pure data with no logic. Leave it.

---

## UI evaluation

Method: `probe.mjs` against `http://127.0.0.1:5199/` in Chromium at 1440x900 and
390x844, plus a reduced-motion context and a touch context. Screenshots in
`shots/`: `index-1440.png`, `index-390.png`, `process-1440.png`,
`process-390.png`, `index-390-stage-open.png`, `index-1440-reduced.png`.

Severity scale: 1 blocks a user, 2 hurts a real task, 3 friction, 4 polish.

### Anti-pattern check against the COMMON.md forbidden list

Every item passes. Grepped `index.html`, `process/index.html`, `css/hub.css`,
`js/*.js`, `live.js`:

| Forbidden | Result |
|---|---|
| Inter, Poppins, Space Grotesk | none. Instrument Serif + JetBrains Mono only |
| em dash | none |
| `backdrop-filter` blur cards | none |
| emoji in headings | none |
| `<video>` without a poster | none. All 9 video elements carry a poster |
| marquee logo cloud | none |
| centred column in empty background | none. Both pages are full-bleed grids |
| purple gradient hero | none |

Format rules also hold: no build step, no npm at runtime, no hotlinks beyond the
three live APIs, the Undergrowth iframe, `fonts.googleapis.com` and the pinned
`unpkg` model-viewer. Caps respected: largest video 1.23 MB against a 3 MB cap,
site 18.7 MB against 40 MB. `scrollWidth === clientWidth` at both widths, so no
horizontal scroll. `scrollHeight === clientHeight` at both widths on both pages,
so the no-scroll rule holds.

### Accessibility

**A11Y-1, severity 1. The stage is an `aria-live="polite"` region whose entire
contents are replaced on mouse hover and on focus.**
`index.html:48` sets `aria-live="polite"` on `#stage`. `js/hub.js:107-114`
re-renders it on `pointerover` and on `focusin` over the rail. `js/hub.js:57`
replaces the whole `innerHTML`: kicker, title, a 45-word fact, up to 8 chips, the
link, the live number and the toggles.
Effect: a screen reader user tabbing down the rail hears the full panel re-read on
every single row, ten times, before they have chosen anything. A sighted screen
reader user moving the mouse across the rail triggers it even faster. Verified in
the tab walk: `probe.json` `index-1440.tabOrder` shows focus moving through all ten
`.row` buttons, and each one re-rendered the stage.
Fix: drop `aria-live` from `#stage`. Add a separate visually-hidden
`aria-live="polite"` element that announces only the chosen exhibit title, and
populate it from `select()` on click or Enter, not on hover or focus. The unused
`.sr` class at `css/hub.css:37` is exactly the helper for this.

**A11Y-2, severity 2. Selecting on `focusin` means keyboard and pointer users
cannot browse the rail without committing.**
`js/hub.js:111-114`. There is no way to move focus past exhibit 03 to reach
exhibit 07 without having loaded 03, 04, 05 and 06 in full. On a keyboard this is
the only way to traverse the rail, because the rows are plain buttons in tab order
rather than a roving-tabindex listbox.
Fix: either make the rail a `role="listbox"` with roving tabindex and arrow-key
navigation so Tab enters and leaves the group once, or keep focusin selection and
accept A11Y-1's fix as the mitigation.

**A11Y-3, severity 2. At 390 the rail stays focusable underneath the open stage.**
`css/hub.css:289-293` puts `.rail-col` and `.stage` in the same grid area and
slides the stage across with `transform`. The rail is not hidden. Measured with the
stage open (`probe.json` `phone-stage-open`): `railHidden: "visible"`,
`railStillFocusable: true`.
Effect: a phone keyboard or switch user who opens exhibit 03 then presses Tab lands
on rail rows that are covered by the stage and invisible.
Fix: when `body.stage-open` is set, apply `visibility:hidden` to `.rail-col` after
the transition, the same technique `css/hub.css:235-237` already uses for `.scene`.

**A11Y-4, severity 2. Stepper dots are 11x11 px at 1440 and 9x9 px at 390.**
`css/hub.css:258` and `css/hub.css:312`. Measured in `probe.json`
`process-1440.dots` and `process-390.dots`. WCAG 2.5.8 wants 24x24 CSS px for a
pointer target, or spacing that compensates. These sit 0.45 rem apart, so the
spacing exemption does not apply either.
Fix: keep the 11 px visual dot, wrap it in a 24 px transparent hit area
(`padding:7px;background-clip:content-box`).

**A11Y-5, severity 2. Inactive stepper dots are near invisible.**
`css/hub.css:258` gives an inactive dot only `border:1px solid var(--line)`.
Computed contrast of `--line` `#2c2c33` on `--ink` `#0a0a0b` is **1.43:1**. WCAG
1.4.11 wants 3:1 for a meaningful UI boundary. Visible in `shots/process-1440.png`:
the seven inactive dots read as nothing at normal viewing distance, so the control
does not communicate "8 scenes, you are on 1".
Fix: raise the inactive dot border to at least `#4a4a55`, or fill it at low opacity.
Same applies to `.chips li` borders at `css/hub.css:193`, which are decorative and
can stay.

**A11Y-6, severity 2. The stepper does not announce position.**
`process/index.html:189` is a plain `<span id="count">`, updated in
`process/index.html:216`. No `aria-live`, and the dots use `aria-current` with
`role="tab"` rather than `aria-selected`. The scenes are not `role="tabpanel"` and
nothing points at them with `aria-controls`.
Effect: a screen reader user presses Next and hears nothing. The scene content is
now different but no announcement fires, because `visibility:hidden` to
`visibility:visible` is not a live-region change.
Fix: put `aria-live="polite"` on `#count` at `process/index.html:189`, which then
speaks "P3 / 8" on every step. If the tab pattern is kept, add `aria-selected` on
the dots and `role="tabpanel"` plus `aria-labelledby` on each `.scene`. The
cheaper honest option is to drop `role="tab"`/`role="tablist"` and let the dots be
plain buttons with their existing `aria-label`, which is already accurate.

**A11Y-7, severity 3. The about panel and the ledger are overlays with no focus
management.**
`js/hub.js:153` and `process/index.html:234` toggle `hidden` without moving focus
into the panel, and on close focus is not returned to the trigger. Escape works in
both (`js/hub.js:155`, `process/index.html:238`), which is the important half.
Fix: focus the panel's Close button on open, restore focus to the trigger on close.
Four lines each.

**A11Y-8, severity 3. Rail rows carry `aria-current="false"` on nine of ten
buttons and nothing says they control the stage.**
`js/hub.js:14` and `js/hub.js:94`. `aria-current="false"` is valid but adds noise;
removing the attribute is the conventional way to say "not current". More
importantly there is no `aria-controls="stage"` linking a row to what it changes.

**A11Y-9, severity 3. Scene videos have no `aria-hidden`.**
`process/index.html:34` and `:65` are decorative loops with no caption or
transcript. The header video at `process/index.html:17` correctly has
`aria-hidden="true"`; the two scene videos do not, so a screen reader announces an
unlabelled media element inside each scene.

**Contrast, checked and passing.** Computed sRGB ratios against the real tokens:

```
paper  #ece7dd on ink   #0a0a0b   16.06:1
live   #c6f53c on ink   #0a0a0b   15.57:1
signal #ff5b23 on ink   #0a0a0b    6.38:1
signal #ff5b23 on ink-2 #121215    6.03:1
dim    #8d887e on ink   #0a0a0b    5.61:1
dim    #8d887e on ink-2 #121215    5.30:1
dim    #8d887e on ink-3 #1b1b20    4.86:1
```

Every text pair clears AA at 4.5:1, including `--dim` on the selected row's
`--ink-3` background, which is the worst case at 4.86:1. **Text contrast is not a
problem on this site.** The only contrast failure is the non-text one at A11Y-5.

**Legibility, severity 3, separate from contrast.** `css/hub.css:309` sets
`.ledger__cell span` to `.5rem`, which is 8 px, and `css/hub.css:310` sets
`.ledger p` to `.56rem`, about 9 px, both on the phone. `css/hub.css:306` sets
`.scene pre` to `.52rem`. These pass contrast and still cannot be comfortably read
on a 390 px screen. Raise the phone floor to 0.62 rem, about 10 px.

**Reduced motion, passing.** `shots/index-1440-reduced.png` and `probe.json`
`reduced`: `overture: "settled"` immediately, no curtain, wordmark already at its
final size, `scrollHeight === clientHeight === 900`. `css/hub.css:315-325` still
looks composed rather than stripped. `js/hub.js:73` and `process/index.html:220`
both skip `video.play()` under reduced motion. This branch is done correctly.

### Performance

**PERF-1, severity 2. `preload="none"` on stage video is defeated by an immediate
`play()`.**
`js/hub.js:30` writes `preload="none"` and `js/hub.js:73` then calls
`v.play().catch(()=>{})` on the very next tick. `play()` forces the download the
`preload` attribute was meant to avoid. Confirmed in the request log: with exhibit
02 selected, `/assets/cap/teetimes-1440-scroll-20260917.mp4` (0.51 MB) is fetched
even though nothing else on the page asked for it.
Combined with A11Y-2, tabbing the whole rail pulled **30 requests** on a page that
needs about 12, including `teetimes-...mp4` 0.51 MB, `undergrowth-flyover...av1.mp4`
1.10 MB and `scrollcraft-filmstrip...mp4` 1.23 MB. A mouse sweep down the rail does
the same thing faster.
Fix: debounce hover selection by about 120 ms, and only call `play()` once the
selection has settled. The poster already covers the gap.

**PERF-2, severity 2. Three videos download on `/process/` before the user sees
scene 1.**
`process/index.html:17`, `:34` and `:65` all carry `autoplay` alongside
`preload="none"`. `autoplay` wins. Request log for `/process/`:
`cnvs-canvas-pullback...av1.mp4` fetched **twice** (0.54 MB each, once for the
header strip, once for the scene P1 frame, same file, two requests), plus
`gate-red-green.mp4` for scene P3 which is `visibility:hidden` and seven steps away.
Roughly 1.2 MB pulled for content the user has not reached.
Fix: give only the currently visible scene `autoplay`, and let `show()` at
`process/index.html:219-220` start the video when its scene becomes active, which
it already does. Removing `autoplay` from `process/index.html:34` and `:65` costs
nothing because `show(0)` plays scene 1 anyway. The duplicate header fetch is
worth a separate look: the same URL should hit the HTTP cache, so the second
request suggests the two elements race before the first response lands.

**PERF-3, severity 3. `model-viewer` loads from unpkg on every index visit.**
`index.html:13` is a blocking module script fetched from `unpkg.com` on first
paint, before the overture finishes. It is only needed by the four exhibits that
have a GLB layer (01, 02, 06, 07) and only once a GLB is actually chosen. It is by
far the heaviest third-party request on the page and it sits on a CDN that is not
otherwise used.
Fix: load it lazily from `mediaMarkup` the first time `m.kind === 'glb'` is
rendered. About six lines in `js/hub.js`.

**PERF-4, severity 3. 1.74 MB of assets ship and are never referenced.**
14 files under `site-snapshot/assets/` appear in no HTML, CSS or JS. Largest:

```
0.93 MB  assets/proc/sigouin-live-2026-09-17.png
0.20 MB  assets/cap/sigz-music-1440-scroll-20260917.mp4
0.15 MB  assets/cap/undergrowth-1440-scroll0-ready-20260917.webp
0.11 MB  assets/cap/teetimes-1440-scroll0-20260917.webp
0.11 MB  assets/cap/teetimes-1440-scroll50-20260917.webp
```

plus nine smaller webp captures and `assets/proc/gate-red-green.txt`. No
referenced asset is missing from disk, so this is dead weight only, not breakage.
It matters for the deploy payload, not for page speed.

**PERF-5, severity 4. The AV1 source is larger than the H.264 it precedes.**
`assets/vid/undergrowth-flyover-20260917.av1.mp4` is 1.10 MB against 1.02 MB for
the H.264. `exhibits.js:38` lists AV1 first, so AV1-capable browsers download the
bigger file. The same is true nowhere else: the SiGz loop AV1 is 0.16 MB against
0.53 MB and the CNVS pullback is 0.54 against 0.62, both real wins. Re-encode the
Undergrowth flyover or drop its AV1 source.

**PERF-6, severity 4. The preload at `index.html:11` is redundant.**
`index.html:19` already carries `fetchpriority="high"` and `decoding="sync"` on the
same image, and it is the first element in the body. The preload link saves
nothing and costs a duplicate entry in the resource list.

### UX heuristics

**UX-1, severity 2. Nothing tells a first-time visitor the rail is interactive.**
See `shots/index-1440.png`. Ten rows of number, serif title and year. No chevron,
no caret, no cursor hint visible in a static frame, and the stage on the right is
already populated with exhibit 01, so the causal link is invisible until the
pointer happens to cross a row. The hover affordances that exist are good
(`css/hub.css:164-168`: background shift, 10 px slide, the `--signal` keyword
appears, the title underlines), but all of them require the discovery to have
already happened.
Fix: reveal `.row__word` on the active row only at rest is already done; add one
persistent cue. The cheapest honest one is a right-aligned arrow glyph on the
active row, or a single line of instruction in the overture strip near "Index of
ten". Do not add a tooltip.

**UX-2, severity 2. On a phone the first screen has no call to action at all.**
`shots/index-390.png`: the visitor sees ten titles and a footer and nothing else.
The stage is off-canvas at `translateX(100%)`. There is no "tap for detail", no
chevron per row, and the fact that a second pane exists is unguessable.
`css/hub.css:297-299` even removes the `.row__meta` column and the reveal word from
the phone layout, so the phone rows carry less signal than the desktop ones.
Fix: put a per-row chevron or the `--signal` keyword back at 390, and set
`.row__word` visible at rest on phone.

**UX-3, severity 3. The phone back control is below the fold of attention.**
`shots/index-390-stage-open.png`: "BACK TO THE INDEX" sits at y=351, after the
kicker, the title, a five-line fact, eight chips, the link row and the media
toggles. It is on screen and `probe.json` `phone-stage-open.backVisible` is true,
so this is not a blocker. But phone users reach for the top-left. Escape also
closes the stage (`js/hub.js:158`), which no phone user has.
Fix: move `.stage__back` above `.stage__kicker` in the render at `js/hub.js:58-68`,
or mirror it as a small back arrow in the top-left of `.stage__body` at 390.
Adding a `popstate` handler so the hardware back gesture closes the stage would be
the real fix and is about eight lines.

**UX-4, severity 2. The media toggles do not read as controls.**
`js/hub.js:52`. In `shots/index-390-stage-open.png` they render as
"flyover  real play  play it": three lowercase words, the active one orange with a
1 px underline, the other two in `--dim`. No border, no button shape, no
`aria-pressed`, no group label. A visitor is unlikely to read them as "this exhibit
has three media layers, pick one", which is one of the better ideas on the page.
Fix: reuse the existing `.chips li` box treatment, add `aria-pressed`, and give the
group an `aria-label` such as "Media layers".

**UX-5, severity 2. The live footer currently reads as broken.**
`shots/index-1440.png` bottom left, from `index.html:42-43` painted by
`js/live-hub.js:68`:

```
SIGZ PLAYS 94   SAMPLE DATA, 2026-09-17
OPEN TEE SLOTS 0   FEED DATED 2026-09-18
```

Three problems in two lines. "94" total plays undersells a catalogue the page
elsewhere calls 164 tracks. "0" is the worst possible number to lead with on a
portfolio. And the tee note says the feed is dated **2026-09-18** while the page's
own "Last build" says 2026-09-17, so the fixture is dated tomorrow, which reads as
a bug even though `js/live-hub.js:23` is correctly labelling it stale. The
honesty of the sample-data labelling is right and should stay; the framing is what
fails.
Fix: when `coversToday` is false, say "next open slots: tomorrow" rather than
showing a zero. When the feed is sample data, consider showing the track count,
which is non-zero and true, instead of a play total that looks small.

**UX-6, severity 3. The process scene note column is mostly empty at 1440.**
`shots/process-1440.png`: the right column runs 900 px tall and its content ends
at about 310 px. Roughly 570 px of black. `css/hub.css:244` sets
`align-content:start` on `.scene__note`, which is the correct choice for a stepper
where note lengths vary, but at this ratio the pane reads as unfinished.
Fix: either widen the frame (`minmax(290px,31vw)` to `minmax(260px,26vw)`) or move
the stepper's scene title and count into the empty space so the column has a foot.

**UX-7, severity 2. The wheel is hijacked on `/process/`.**
`process/index.html:246-255` binds a document-level `wheel` listener that advances
one scene per gesture. On a page that visually looks like a document, a trackpad
flick now jumps content sideways. It is implemented carefully (an 8 px threshold, a
380 ms lock that drains only after the gesture stops, disabled while the ledger is
open) and it is consistent with the no-scroll premise, so this is a deliberate
design choice rather than an accident. Flagging it because it is the single most
likely thing to make a first-time visitor feel the page is broken, and because
there is no on-screen hint that a wheel gesture does anything. The "NEXT" button
and the dots are the discoverable path; the wheel is a bonus that currently
surprises.
Fix: keep it, but add a one-line hint next to the count, such as "scroll, swipe or
use the arrow keys".

**UX-8, severity 3. The disabled Previous button is nearly invisible.**
`css/hub.css:261` sets `opacity:.32` on `.step-btn[disabled]`. In
`shots/process-1440.png` "PREVIOUS" on scene 1 is barely legible. Disabled controls
are exempt from contrast minimums, but a control the user cannot see is a control
they cannot learn. Raise to 0.5 and keep the border visible.

**UX-9, severity 4. The iframe exhibit's poster image has no dimensions.**
`js/hub.js:42` renders `<img src="${m.poster}" ...>` with no `width`/`height`,
unlike `js/hub.js:33` which sets 1440x900. Minor layout shift on exhibit 03's third
media layer.

**Heuristics that hold.** Visibility of system status: the active row is marked
three ways (background, orange number, underlined title) and the stepper shows
"P3 / 8". User control and freedom: Escape closes both overlays and the phone
stage, Back exists on phone, no dead ends. Consistency: one type scale, one signal
colour, the same grain and border language on both pages. Error prevention and
honesty: `js/live-hub.js:54` shows "-" and "feed unreachable" rather than inventing
a number, and sample data is labelled in `--signal` where it cannot be missed.
That last one is the strongest thing on the page and should survive round 20
untouched.

---

## Top 10

1. **Remove `aria-live` from `#stage` and announce only the chosen title from a
   visually-hidden region.** `index.html:48`, `js/hub.js:57`. One attribute plus
   four lines; turns the rail from unusable to usable with a screen reader. `[a11y]`
2. **Delete `live.js:1-163`.** Nothing imports any of it. 160 lines and a full
   polling engine off the wire for a one-line edit and a delete. `[code]`
3. **Drop `autoplay` from the two hidden scene videos on `/process/`.**
   `process/index.html:34`, `:65`. `show()` already plays the active scene. Saves
   about 1.2 MB before first interaction. `[perf]`
4. **Debounce hover selection by ~120 ms and delay `video.play()` until it settles.**
   `js/hub.js:73`, `js/hub.js:107-114`. Stops a mouse sweep or a Tab walk pulling
   every video on the page. `[perf]`
5. **Hide `.rail-col` when `body.stage-open` at 390.** `css/hub.css:289-293`. One
   rule; stops phone keyboard focus falling behind the open stage. `[a11y]`
6. **Add `aria-live="polite"` to `#count`.** `process/index.html:189`. One
   attribute; the stepper starts announcing position. `[a11y]`
7. **Give stepper dots a 24 px hit area and a visible inactive state.**
   `css/hub.css:258`, `:312`. Fixes target size and a 1.43:1 non-text contrast
   failure in the same rule. `[a11y]`
8. **Add one persistent cue that the rail is interactive, and restore the reveal
   word at 390.** `css/hub.css:165`, `:297-299`. The single highest-value UX change
   on the page. `[ux]`
9. **Restyle the media toggles as real controls with `aria-pressed`, and move the
   inline styles out of `js/hub.js:52` into CSS.** Fixes a UX and a code finding
   with one edit. `[ux]`
10. **Reframe the live footer so it never leads with "0", and reconcile the
    2026-09-18 fixture date against the 2026-09-17 build date.**
    `js/live-hub.js:23`, `index.html:41-43`. `[ux]`

Just outside: lazy-load `model-viewer` (`index.html:13`), delete the 1.74 MB of
unreferenced assets, collapse the 19 repeated uppercase micro-label blocks in
`css/hub.css`, add a `SAFETY:` comment at `functions/api/live/[[path]].ts:67`.

---

## Could not verify

- **Real devices.** Everything at 390x844 is Chromium's emulation. iOS Safari is
  the one that matters here and it was not available: `100svh` at
  `css/hub.css:48`, `viewport-fit=cover`, the `transform` slide of `.stage`, and
  whether the address bar collapse breaks the one-pane rule are all unconfirmed on
  real hardware. The r17 no-scroll gate proves it in Chromium only.
- **Screen readers.** Every a11y finding above is derived from the DOM, the ARIA
  attributes and the computed tab order, not from listening to VoiceOver, NVDA or
  TalkBack. A11Y-1 in particular is a strong prediction from `aria-live="polite"`
  plus full-subtree replacement, but the actual verbosity depends on the reader.
  Somebody should run VoiceOver down the rail once before round 20 ships.
- **Video playback.** Headless Chromium reports `paused:false` on all three
  `/process/` videos, but no frames were decoded or compared. Whether the AV1
  sources actually decode, whether the loops are seamless, and how they look under
  the `grayscale(.4) brightness(.32)` filter at `css/hub.css:226` are unverified.
  Autoplay policy in a real browser with sound-permission state is also untested.
- **The live proxy in production.** `functions/api/live/[[path]].ts` was read, not
  run. Pages Functions do not execute under `python3 -m http.server`, so every
  `/api/live/*` request in this review fell through to the sample fixture, which is
  exactly the documented fallback at `js/live-hub.js:48-52`. The CORS single-origin
  logic, the 5 s `AbortController` deadline, the edge cache write and the 502 path
  are all unexercised. The one live endpoint that did answer is
  `https://teetime.sigouin.net/api/teetimes`, fetched directly per
  `js/live-hub.js:18`.
- **Lighthouse and real network timings.** All request counts and byte sizes here
  are from localhost with no throttling. No LCP, CLS or TBT number was produced, so
  PERF-1 through PERF-6 are argued from bytes and request order, not from a
  measured score.
- **The round 18 background-video build.** Reviewed r17 only, as briefed. Any
  finding above that touches video attributes may already be moot in r18.
