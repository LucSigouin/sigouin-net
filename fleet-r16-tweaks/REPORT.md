# Round 16 tweaks: three changes to the sigouin.net hub

Lane dir: `/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r16-tweaks/`
Source: a fresh copy of `sigouin-net/site` (the round 14 lane A winner, with `_headers` and the
fixed functions proxy). `site/_headers` and `site/functions/api/live/[[path]].ts` were not touched.
Nothing else in the design was changed.

Model: claude-opus-5. Date: 2026-09-17.

## Change 1: ten exhibits, not twelve

Removed two exhibits and renumbered the rest 01 to 10 in order.

| File | Line | What changed |
|---|---|---|
| `site/js/exhibits.js` | 1 | Header comment now says "The ten exhibits" |
| `site/js/exhibits.js` | (deleted) | The `n: '08'` Kingdom Idle entry, whole object |
| `site/js/exhibits.js` | (deleted) | The `n: '12'` Cooking The Lads entry, whole object |
| `site/js/exhibits.js` | 87 | Imagegen renumbered 09 to 08 |
| `site/js/exhibits.js` | 97 | Scrollcraft renumbered 10 to 09 |
| `site/js/exhibits.js` | 106 | This Page, Before renumbered 11 to 10 |
| `site/js/exhibits.js` | 121, 122 | Dropped the now pointless `contain: true` flags, since contain is the default (change 3) |
| `site/index.html` | 6 | Title: "Luc Sigouin: ten exhibits" |
| `site/index.html` | 7 | Meta description: "Ten things Luc Sigouin built" |
| `site/index.html` | 23 | Overture top rail: "Index of ten" |
| `site/index.html` | 29 | Tagline: "Ten things I built." The "Six of them are live right now" half is unchanged and still true: neither removed exhibit was live |
| `site/index.html` | 34 | Rail aria-label: "The ten exhibits" |
| `site/process/index.html` | 188 | Backlink: "Back to the ten" |
| `site/js/hub.js` | 35 | The image branch no longer writes an inline `object-fit:contain` style |

There is no other count on either page. `grep -rniE "twelve" site/index.html site/process/index.html
site/js site/css` returns nothing.

Kimi K3 is still named where it did real work: the sigzmusic landing nine-up and the two model
build off on the process wing, and in the tool chips for SiGz Music and Undergrowth. Only the
Kingdom Idle exhibit went.

### Asset files deleted

Four files, all orphaned by the two removed exhibits, all confirmed unreferenced by any html, css,
js or data file before deletion:

- `site/assets/proc/kingdom-idle-current-state-2026-09-17.webp`
- `site/assets/still/05-ff-crest-cooking-the-lads.webp` (the crest)
- `site/assets/still/06-ff-ref-james-cook.webp` (reference photo)
- `site/assets/still/07-ff-ref-ladd-mcconkey.webp` (reference photo)

Also removed: the empty `site/.wrangler/` cache directory that rode along in the copy. It is build
scratch, not shipped content.

`site/data/*.json` was left alone. `data/costs-timeline-20260917.json` does contain the string
`cooking-the-lads` inside source file paths, but no page fetches that file, so nothing renders it.
The one cost file that is fetched, `data/stills-costs-20260917.jsonl`, is read only for a row count
and a dollar total, never for names.

## Change 2: no previews in the left rail

| File | Line | What changed |
|---|---|---|
| `site/js/hub.js` | 7 (deleted) | The whole `SLIVERS` map |
| `site/js/hub.js` | 12 to 20 | The `<img class="rail__sliver">` insert dropped out of the row template |
| `site/css/hub.css` | 141 to 142 (deleted) | The `.rail__sliver` rule |
| `site/css/hub.css` | 118 | Rhythm comment reworded, it no longer mentions slivers |
| `site/css/hub.css` | 120 | `nth-child(5n+2)` bottom padding went from `0` to `.35rem`. It was zero only so a sliver could sit flush under the row. With no sliver, zero left the row cramped against the divider. `.35rem` keeps it visibly tighter than its neighbours, so the uneven rhythm survives |

The rest of the rhythm is untouched: every third row still breathes (`nth-child(3n+1)`, bigger face
and more air), every fourth is still italic. `shots/exhibit01-1440.png` shows the whole rail at
once: 01 large, 04 italic, 07 large, 08 italic, 10 large. The capture harness counts
`.rail__sliver` on the live page and reports `slivers: 0`.

## Change 3: the stage shows the whole capture

| File | Line | What changed |
|---|---|---|
| `site/css/hub.css` | 145 | New comment saying why the black ground is there |
| `site/css/hub.css` | 146 | `.stage__media > :not(.stage__tag)`: `object-fit:cover` became `object-fit:contain` |
| `site/css/hub.css` | (deleted) | `.stage__media img,.stage__pair img{object-position:center top}`, the crop anchor |
| `site/css/hub.css` | 150 | `.stage__pair img`: `object-fit:cover` became `object-fit:contain` |

`.stage__media{background:#000}` on line 145 was already there and stays, so an image that does not
match the panel ratio letterboxes against black. `model-viewer` keeps `object-fit:unset` plus its
radial background (line 147) and `iframe` keeps `border:0` (line 148). Neither rule changed.

### Measured, not eyeballed

The harness reads the computed `object-fit`, the element's natural size, the panel box, and the
size the browser actually draws, then checks the drawn box fits inside the panel on both axes:

```
exhibit01 {"objectFit":"contain","natural":[1440,900],"box":[893,561],"drawn":[893,558],"fitsInside":true}
exhibit02 {"objectFit":"contain","natural":[1152,720],"box":[893,561],"drawn":[893,558],"fitsInside":true}
phone stage {"objectFit":"contain","natural":[1440,900],"box":[390,490],"drawn":[390,244],"fitsInside":true}
```

I mutant tested that check before trusting it. The first version computed the contain geometry no
matter what the CSS said, so it reported `fitsInside:true` even with `object-fit:cover` put back.
It proved nothing. `shoot.mjs` now scales the way the declared fit actually scales. With the
deliberate `cover` mutant in `css/hub.css` line 146 it goes red:

```
exhibit01 {"objectFit":"cover","natural":[1440,900],"box":[893,561],"drawn":[898,561],"fitsInside":false}
exhibit02 {"objectFit":"cover","natural":[1152,720],"box":[893,561],"drawn":[898,561],"fitsInside":false}
phone stage {"objectFit":"cover","natural":[1440,900],"box":[390,490],"drawn":[783,490],"fitsInside":false}
```

The mutant was then reverted and the real run above is the shipped state. The shipped
`css/hub.css` line 146 reads `object-fit:contain`.

- exhibit 01 is the 1440 wide sigzmusic capture on the 1440 stage. The player bar at the bottom of
  that capture is now visible. Under `cover` plus `object-position:center top` it was cut off.
- exhibit 02 is the 1152x720 teetimes scroll video. Sidebar and map both land inside the panel.
- The phone check is exhibit 04, the 1440x900 BBC board capture, on the 390 layout. It draws at
  390x244 inside a 390x490 panel, so the whole board is on screen with black above and below.

`hscroll: false` at 1440 and at 390 on both pages.

## Screenshots

Served from `python3 -m http.server 5193 --directory <lane>/site`, still running for preview.

| Name | What it shows |
|---|---|
| `shots/index-1440.png` | `/` at 1440x900. Overture reads "Index of ten" and "Ten things I built" |
| `shots/index-390.png` | `/` at 390x844 |
| `shots/process-1440.png` | `/process/` at 1440x900, unchanged by this round |
| `shots/process-390.png` | `/process/` at 390x844, unchanged by this round |
| `shots/exhibit01-1440.png` | Exhibit 01 selected. Whole rail 01 to 10, no slivers, whole sigzmusic capture in the stage |
| `shots/exhibit02-1440.png` | Exhibit 02 selected, the teetimes video contained |
| `shots/exhibit04-390.png` | The phone stage, a 1440 wide capture letterboxed and complete |

Before images live in the record at `fleet-r14-build/a/shots/index-1440.png`,
`index-390.png`, `process-1440.png` and `process-390.png`. Those are the twelve exhibit, sliver
carrying, cover cropped versions. I did not copy them into this lane, so the comparison is
before in `fleet-r14-build/a/shots/`, after in `fleet-r16-tweaks/shots/`.

## Could not verify

- The rendered pages by human eye. I looked at my own PNG captures, which is what the harness
  gives me. Luc should open http://127.0.0.1:5193/ to confirm the rail rhythm still reads and the
  letterboxing looks deliberate rather than broken.
- Live numbers. `python3 -m http.server` does not run Cloudflare Functions, so
  `/api/live/sigz/tracks` returned 404 and the page fell back to its labelled sample fixture
  ("sample data, 2026-09-17" is visible in the captures). The TeeTimes direct fetch worked and
  returned 0 open slots with a feed date of 2026-09-18. Nothing here changed that code path.
- Video decode on a real phone. The 390 captures come from a desktop browser in mobile emulation.
- Whether the four deleted asset files exist anywhere else. They were copies inside this lane's
  `site/`; the round 13 originals under `fleet-r13-assets/` are untouched, so nothing is lost.
- Anything about the live site. I did not deploy, push, or touch `sigouin-net/site`.

## RUBRIC.md self-check

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Wow on load | Pass, unchanged | The overture still leads with the kinetic wordmark over the waveform still, preloaded as the LCP. This round touched only copy in that block |
| 2 | Real work shown | Pass, now ten | Ten exhibits, each still on real round 13 captures, stills, loops or GLBs. Nothing invented, nothing left as a placeholder. Renumbered 01 to 10 with no gap |
| 3 | Process wing | Pass, unchanged | The eight scenes and every named tool and model are as they were. Only the backlink wording changed |
| 4 | Not a template | Pass | Uneven rail rhythm survives the sliver removal, confirmed in `shots/exhibit01-1440.png`. No glass, no purple, no three equal cards, no centred column. Gate greps clean |
| 5 | Fast and honest | Pass | Site is 18.9 MB per the gate, every cap respected, videos still posterised and `preload="none"`, reduced motion branch intact, sample data still labelled. Four orphaned asset files deleted, so nothing unused ships |
| 6 | Verified by eye | Pass | Seven screenshots in `shots/`, all looked at. The four the gate needs plus three that show the contain behaviour. Limits listed under "Could not verify" |

## Gate

```
python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r14-build/check-hub.py \
  /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r16-tweaks
```
