# Mobile 3D zoom deployed

Live: https://sigouin.net/
Deployment: https://d48355f5.sigouin-net.pages.dev

Mobile interactive mode supports 1–3× pinch zoom, two-finger panning, plus/minus buttons and Fit view. Pinching keeps the scene point under the fingers, bounded by the original camera framing. One-finger page scrolling and waveform brushing remain available; multi-touch gestures suppress accidental rack taps and waveform triggers. Zoom works while animation is paused. Fit and new 3D sessions restore 1×; resize preserves the current view. Desk/model transforms and desktop camera behavior remain fixed.

Local and live checks passed in WebKit and Chromium. Chromium touch-input sequences verified pinch, pan, no browser page zoom, restored vertical scrolling, zoom bounds and continued hit testing. WebKit verified accessible buttons, pause, fit and teardown/re-entry. Existing mobile and desktop suites passed, as did the staged production CSP check. Seven checked live files match their SHA-256 hashes. Tests use emulated touch on a Mac, not a physical phone.

Source and local rollback: `vybe-workstation/revisions/mobile-zoom/README.md`. Complete previous production site: `before-site/`. To roll back from this directory: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/before-site"`, then restore that copy to canonical `sigouin-net/site`. No rollback was executed.
