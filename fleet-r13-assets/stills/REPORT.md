# Lane STILLS, round 13

Seven images for exhibits that have no real capture, plus the cost log.
All generated stills came from gpt-image-2, quality medium, size 1536x1024.
Everything lives in `out/`: the PNG the API returned, a matching `.prompt.txt`,
and the webp listed in `manifest.json`.

Live gallery node line: **Live on page 1 (CNVS can't target page 4 yet): hub stills r13**
(loop terminal node: Rex, page 1). Both nodes left open.

## What I made

| File | What it is | Verdict |
|---|---|---|
| `out/01-livetvcan-hero.webp` | LiveTVCan marketing hero in the locked brand style | keeper |
| `out/02-gardens-homelab.webp` | The Gardens: two matte-black servers plus game tower on a desk | keeper |
| `out/03-sigz-waveform.webp` | Acid lime waveform on near-black, SiGz live feed backdrop | keeper |
| `out/04-teetimes-map.webp` | Golf greens from above at dusk with soft pins, TeeTimes backdrop | keeper |
| `out/05-ff-crest-cooking-the-lads.webp` | Fantasy football crest, copy of the existing file, not regenerated | copy |
| `out/06-ff-ref-james-cook.webp` | Source photo for the crest | copy |
| `out/07-ff-ref-ladd-mcconkey.webp` | Source photo for the crest | copy |
| `costs.jsonl` | Per image cost log from this run | data |

Rejects: none. All four generations were first takes and all four are usable.
No reroll was needed, so no image was thrown away.

## Prompts

1. **01-livetvcan-hero.** The LiveTVCan master style prefix from
   `~/.claude/skills/imagegen/SKILL.md` verbatim (flat vector, #F4F5F7 ground,
   navy #1F2430 outlines, red #DC1414, halftone dot clusters, confetti accents),
   then the subject sentence: a wide flat-screen television as the hero, screen
   showing a big red play triangle and a small red maple leaf in the corner,
   four rounded channel tiles and a phone floating around it connected by thin
   dotted navy lines, and one small red pill badge reading exactly LIVE in white
   letters, no other text anywhere. Reference read first (read only):
   `personal/IPTV/livetvcan-website/public/images/livetvcan-how-it-works-v2.png`.
   Full text in `out/01-livetvcan-hero.prompt.txt`.
2. **02-gardens-homelab.** Cinematic photograph of two matte-black rack-style
   home servers stacked on a wooden desk beside a small black game-server tower,
   warm late-afternoon light through a window to the left, tidy braided cables
   routed behind, tiny green and amber status LEDs, shallow depth of field, fine
   film grain, dust motes, muted warm grade, no people, no text, no logos, no
   readable screens, photographic realism, not a 3D render, not CGI.
3. **03-sigz-waveform.** Abstract audio waveform as a dense row of thin vertical
   bars in acid lime #C6F53C on near-black #0A0B0A, one smooth organic envelope
   across the full width, soft lime glow, subtle scan texture and grain, empty
   near-black space above and below, no text, no labels, no logos, no interface.
4. **04-teetimes-map.** Top-down aerial view of a golf course fragment at dusk,
   winding fairways and rounded greens in deep muted green, sand bunkers, a small
   pond reflecting a dim blue sky, dark tree canopies, low warm dusk light, a few
   soft glowing amber pin markers with gentle bloom, calm, cinematic, slightly
   desaturated, no text, no labels, no logos, no interface, no people.

No logo or wordmark was generated. The LiveTVCan image uses the brand's own
shape vocabulary (TV, play triangle, maple leaf, LIVE badge), which is what every
existing marketing image on the live site does, not a rendering of the logo file.

## Spend

Source of truth: `costs.jsonl`, written by `personal/imagegen/costlog.py` from the
API `usage` block on each call.

- Before this lane: $0.00 spent by this lane.
- 4 images on gpt-image-2 medium at 1536x1024: $0.04235, $0.04170, $0.04166, $0.04167.
- **Total this lane: $0.16738 USD.** No kie.ai spend (see below). No Higgsfield, no Tripo.

Two earlier API calls succeeded on OpenAI's side but their responses were cut off
in transit before the file was written (`IncompleteRead`, the sandbox proxy
truncating the base64 body). Those two are billed by OpenAI but produced no file
and no `costs.jsonl` line, so real spend is about $0.25, not $0.167. I cannot read
the account balance to confirm the exact figure.

## Step 5, kie.ai: skipped

The kie path is not wired for this key. `scripts/kie.mjs` in the scrollcraft skill
reads the variable `KIE_AI_API_KEY`; the key in the personal `.env` is named
`KIE_API`. Running the script's own probe with the personal workspace as the
working directory returns:

```
Error: KIE_AI_API_KEY not found in /Users/ls/Claude-Workspace/personal/.env
```

I did not open the `.env` and did not rename anything. One line fixes it when Luc
wants it: add `KIE_AI_API_KEY=` with the same value, or export it before the call.
Because the edit is not mine to make, I skipped the dusk mood edit of a real
TeeTimes screenshot and took no screenshot of https://teetime.sigouin.net.

## Could not verify

- The two lost API calls above. I cannot see the OpenAI balance, so the exact
  overspend beyond $0.16738 is unconfirmed.
- The lime in `03-sigz-waveform.webp` reads slightly more yellow-green than the
  requested #C6F53C. I judged it by eye in the tool, I did not sample the pixels
  against the hex.
- I cannot see the rendered gallery page. The loop and the browser node were
  started and CNVS reported both as opened, but CNVS browser screenshots are
  unreliable here, so whether the page is drawing the cards is unconfirmed. Luc
  can look at the node named "hub stills r13".
- The dusk kie edit of a real TeeTimes screenshot does not exist, so nothing about
  it is verified.
- Whether these stills suit the final hub layout is a judgment call for Luc. I
  checked each image by looking at it, not against a built page.

## Rubric self-check

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Real, not invented | pass | No UI was invented and no logo was generated. The three fantasy football files are byte copies of real files on disk, converted to webp, with their original paths as `source`. Each generated still lists its full prompt as `source` and has a `.prompt.txt` twin. |
| 2 | Web-ready | pass | 7 webp files, largest 168968 bytes, all far under the 1.5 MB cap. PNGs kept beside them. Numbered filenames. |
| 3 | Manifest twin | pass | `manifest.json` lists 8 entries: 7 image, 1 data, each with path, kind, poster null and source. |
| 4 | Honesty | pass | Spend line above, "## Could not verify" is not empty, the two lost calls are stated. |
| 5 | Scope | pass | Every write is under the stills lane dir. No `.env` opened, no deploy, no push, no `work/`. |
| 6 | Plain words | pass | Short sentences, no em dashes. |
