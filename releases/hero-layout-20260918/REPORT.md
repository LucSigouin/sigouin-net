# Hero layout update

Live: https://sigouin.net/
Deployment: https://71312f4b.sigouin-net.pages.dev

Removed the horizontal dark gradient beside the intro text on desktop and mobile. Moved the intro block higher: 112px from the top at 1440×900, 122px at 1045×1014, and 140px on mobile. The vertical footer fade remains.

Visually inspected screenshots at 1440×900, 1045×1014 and 390×844; no horizontal overflow. Desktop WebGL and mobile still modes work. The live CSS matches the reviewed local bytes. Updated canonical production CSS and the local realism preview; 3D assets and behavior unchanged.

Rollback site: `before-site/`. Previous local preview CSS: `before-preview-signal.css`.

Versioned the stylesheet URL to refresh previously cached browser styles. Live HTML matches the deployed source.
