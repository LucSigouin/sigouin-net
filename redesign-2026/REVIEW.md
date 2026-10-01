# Independent implementation review

Reviewed September 5, 2026. Scope: both implementations' HTML, CSS, and JavaScript; focused Edge browser checks at 390 and 1440 CSS pixels; disabled JavaScript; reduced motion; keyboard navigation. This is independent of the lead's axe, responsive-layout, and screenshot review. Implementation files were not changed by this reviewer.

## Findings to resolve

1. **High — Studio contact links lose their keyboard focus indicator.** In `studio/style.css`, the global `a:focus-visible` outline uses the same accent as `.contact`'s background. Edge confirmed a focused contact heading link has `rgb(177, 60, 38) solid 2px` outline on `rgb(177, 60, 38)`. Email and GitHub links share the rule. Add a contrasting contact-specific outline, as Signal already does. Reported to lead immediately.

2. **Medium — Studio's mobile navigation disappears when JavaScript is unavailable.** At 390px with JavaScript disabled, all three navigation links have no rendered boxes, while an inert Menu button remains visible. In `studio/style.css`, mobile `nav` defaults to `display:none`; only script can add `.is-open`. Make expanded navigation the baseline and apply collapsed styling only once the menu interaction is initialized, or supply an equivalent no-script navigation layout.

3. **Medium — Both hero artworks and their controls need a no-script presentation.** Studio ships an empty `#sculpture-lines` group, and Signal an empty canvas, so the prominent hero illustrations disappear when scripts fail or are disabled. Both retain visible buttons that cannot perform their advertised actions. The authored project artwork and main page content remain available. Prefer a static original hero fallback and hide/disable motion and mode controls until their initialization succeeds.

## Checks passed and limitations

- Studio's functioning mobile menu accepts keyboard entry. Escape closes it and returns focus to the toggle. Activating Selected work closes navigation; subsequent Tab enters the project link at the destination. No focus trap found.
- Signal's compact navigation uses ordinary anchors. At 390px it exposes Projects and Say hello; About and The lab remain reachable by reading/scrolling. At 380px and below only Say hello is retained in the header; the hero still links to Projects.
- Both initial hero renderings remain unchanged over a sampled interval under `prefers-reduced-motion: reduce`. Studio changes its control to Turn the study for a static step. Signal begins paused and offers an explicit play action. CSS disables transitions and smooth scrolling for reduced motion.
- Studio motion is opt-in. Both animation loops account for page visibility and hero intersection. Signal caps device pixel ratio at 2. Its thousands of per-frame canvas operations are the principal mobile performance exposure, but this review did not establish a device performance regression. No speculative performance blocker is asserted.
- Core text is present with JavaScript disabled. Reveal effects do not erase baseline content in that case.
- Project names, technical descriptions, email, GitHub identity, and homelab descriptions agree with the supplied facts and matching local source. Notes explicitly say nothing is published and show in-progress status. No fabricated performance metrics, testimonials, or clients found.
- Hero artwork is authored parametrically in SVG/canvas. Project illustrations use local CSS shapes/gradients; Signal's texture is an inline SVG data URI. Runtime resource inspection found local CSS/JavaScript plus Google Fonts, with no image fetched from the old/live site. This establishes the current implementation's asset references, not an independent proof of authorship history.
- The sites use semantic headings, landmark navigation, skip links, descriptive artwork names, native buttons, and pressed states for art controls. External project links use `noopener noreferrer`; Signal also provides explicit new-tab announcements throughout. Studio's project-image links announce new tabs, but its repeated text versions do not.
- No WCAG AAA conformance certification is implied. This bounded review does not include a full screen-reader or device-lab audit, and the lead owns the broader automated accessibility results.

Findings describe the inspected snapshot; owner agents may subsequently resolve them. Recheck the three findings above after their final edits.
