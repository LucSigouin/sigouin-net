# Luc Sigouin — two original directions

Two independent, complete static websites, built from the content of `https://sigouin.net` on September 5, 2026. `asigouin.net` in the request did not resolve; the existing workspace and reachable domain both identify this as sigouin.net.

## Preview

Run `npm start` in this directory, then open:

- Comparison: http://127.0.0.1:4176/
- Studio: http://127.0.0.1:4176/studio/
- Signal: http://127.0.0.1:4176/signal/

Each direction owns its HTML, CSS, JavaScript, and original artwork. No asset from the existing live website or its previous design rounds was reused. The production site and its deployment source remain untouched.

## Design

Studio is a warm editorial interpretation of Luc's practice: expressive typography, paper tones, red accents, and sculptural artwork. Signal takes a technical, cinematic direction: dark surfaces, vivid accents, and interactive geometry. Both cover Luc's systems work, SiGz, LiveTVCan, the three-machine homelab, upcoming notes, and real contact links. Unpublished notes are identified as in progress.

The directions were implemented by separate Astra agents. The lead handled content research, MCP research, the comparison page, and browser validation.

## Design research and access

- Live content: https://sigouin.net/ and the matching local deploy source `../site/index.html`.
- MotionSites public MCP: `https://motionsites.dev/api/mcp`. Successfully called `tools/list` and `tools/call` → `search_prompts` for editorial/portfolio and waveform/particle references. Results included Header Benjamen, Header 01 Mathew, AI Voice Platform Hero Luma, and How It Works 02 Quell. These were metadata references; their paid source code was not fetched or copied.
- The preconfigured MotionSites endpoint returned HTTP 401. Its credentials were not changed.
- 21st MCP at `https://21st.dev/api/mcp` returned HTTP 401 without an API key. Public research used [scroll animation guidance](https://21st.dev/blog/react-scroll-animation-components), [lightweight effect alternatives](https://21st.dev/blog/magic-ui-alternatives), and [Vertical Cut Reveal](https://21st.dev/@danielpetho/components/vertical-cut-reveal). No claim is made to have used authenticated 21st generation.
- CNVS MCP runs the preview server and presents the sites in browser nodes.

Research response records are in `/Users/ls/Claude-Workspace/personal/scratch/sigouin-redesign-research/`.

## Validation

The website itself needs no npm dependencies or build step. Development dependencies support browser QA only.

```sh
npm ci
npm start
# In another terminal:
npm test
```

The harness checks both directions at 1440, 768, 390, and 320 CSS pixels, local resources, JavaScript errors, internal anchors, project/contact destinations, horizontal overflow, no-JavaScript content visibility, and axe WCAG A/AA rules. It writes screenshots and a structured report to `test-results/`.

It uses an installed Edge/Chrome/Chromium browser, or `BROWSER_PATH` if supplied. Automated accessibility checks do not replace assistive-technology testing.

## Publishing a chosen direction

Each direction can be hosted as ordinary static files. Before replacing production, select a direction, remove its concept-switch links, set its canonical/social URL to the chosen production URL, and serve that directory as the site's root. The comparison page is marked noindex. No production deployment was performed as part of this build.
