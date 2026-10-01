# Mobile workstation release

Production: https://sigouin.net/
Deployment: https://4abcce17.sigouin-net.pages.dev
Date: 2026-09-18

Mobile now has a dedicated 960×800 Blender still (about 54 KB), a compact Menu button, a shorter framed scene and four large interest cards. The whole closed workstation fits the image. Explore in 3D explicitly loads the existing workstation and waveform GLBs; no GLB/HDR/player assets load on the default mobile page.

Touch mode uses a matching mobile camera, tap-to-open/close rack, tap/swipe waveform, native vertical scrolling, pause/resume and Back to still. The desk remains fixed. Reduced motion starts as a still and explicit 3D starts paused. Load failures and context loss return to the still with retry. Desktop camera and hover interactions are retained.

Validation: local and live mobile checks passed at 320–768 px, including menu/Escape/navigation, no initial GLB requests, rack toggles, waveform touch input, pause, return-to-still cleanup, reduced motion, loading failure/retry, graphics failure and no-JavaScript behavior. Chromium input protocol checks verified horizontal touch brushing and vertical scrolling. Existing desktop rack, cable, tile and waveform suites and six loading/fallback tests also passed. The production CSP check passed. The six changed live files match the recorded SHA-256 hashes. These are automated checks on a Mac with emulated phone viewports/touch, not physical-phone performance measurements.

Source: `vybe-workstation/revisions/mobile-v1/README.md` documents the render script, editable packed `.blend`, camera contract and evidence. Existing GLB geometry is unchanged and retains its prior fresh-import validation.

Rollback: `before-site/` preserves the previous complete live site. From this folder, `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/before-site"` republishes it; copy it back to canonical `sigouin-net/site` if rolling back. No rollback was executed.
