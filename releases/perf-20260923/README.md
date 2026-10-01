# Release: landing performance (2026-09-23)

Deployment `3978da07` (https://3978da07.sigouin-net.pages.dev), live at https://sigouin.net.

| Change | Before | After |
|---|---|---|
| `vybe/assets/workstation.glb` Draco-compressed (`gltf-transform draco`, node tree identical) | 13.6 MB | 3.5 MB |
| `vybe/assets/studio.hdr` 1024x512 → 512x256 (Blender `image.scale`) | 1.7 MB | 434 KB |
| Inter font preload removed from `index.html` (landing shows no HTML text) | 150 KB, high priority | not preloaded |
| Desk poster skipped on upright phones (blank first `<source>`) | 39 KB | 0 |

- Decoder: `vybe/vendor/three/DRACOLoader.js` + `vybe/vendor/draco/` (three r186, wasm only;
  about 71 KB over the wire). `workspace.js` wires it into GLTFLoader and disposes it after parse.
- CSP: `worker-src 'none'` → `worker-src 'self' blob:` (the Draco decoder runs in a blob worker).
- Cache-bust: `app.js?v=perf-20260923`, `workspace.js?v=perf-20260923`.

Verification: 8 changed files hash-match live; live CSP serves `worker-src 'self' blob:`; wasm
serves as `application/wasm`. Local CSP-enforcing server + check page: `mode=live` in 3.1 s, zero
CSP violations. Mutant (worker-src back to 'none'): stuck at `mode=loading` with 4 worker-src
violations, so the check catches it. Live desktop page renders the 3D scene (CNVS screenshot).
Not checked: rack hover animation and a real phone.

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.
