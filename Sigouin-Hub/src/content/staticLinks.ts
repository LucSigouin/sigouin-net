// Renders the plain-HTML version of the hub. Used at build time (injected into index.html,
// so crawlers and screen readers get it without JS) and reused as the no-WebGL fallback.
import type { Content } from './types.ts';
import { BUILDING_IDS } from './types.ts';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderStaticLinks(content: Content): string {
  const sections = BUILDING_IDS.map((id) => {
    const b = content.buildings[id];
    const items = b.entries
      .map((e) => {
        const title = e.url
          ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)}</a>`
          : `<span>${esc(e.title)}</span>`;
        return `<li>${title}<p>${esc(e.blurb)}</p></li>`;
      })
      .join('');
    return `<section class="links-section" data-building="${id}" aria-labelledby="links-${id}">
<p class="links-kicker">${esc(b.theme)}</p>
<h2 id="links-${id}">${esc(b.name)}</h2>
<p class="links-intro">${esc(b.intro)}</p>
<ul>${items}</ul>
</section>`;
  }).join('\n');
  return `<header class="links-head">
<p class="links-kicker">sigouin.net</p>
<h1>Luc Sigouin</h1>
<p class="links-intro">Games, music, infrastructure and AI. Four buildings around one courtyard, here as a plain list.</p>
<div class="links-actions"><a class="links-home" href="/">Home</a><button type="button" class="links-back" id="links-back" hidden>Back to the courtyard</button></div>
</header>
<div class="links-grid">
${sections}
</div>`;
}
