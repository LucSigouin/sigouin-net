import { EXHIBITS } from './exhibits.js';
import { paint, paintAll } from './live-hub.js';

const rail = document.querySelector('#rail');
const stage = document.querySelector('#stage');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let current = 0;
let mediaIndex = 0;

/* ---------- the index rail ---------- */
rail.innerHTML = EXHIBITS.map((ex, i) => `
  <li>
    <button class="row" type="button" data-i="${i}" aria-current="${i === 0}">
      <span class="row__num">${ex.n}</span>
      <span><span class="row__title">${ex.title}</span></span>
      <span class="row__meta">${ex.year}</span>
      <span class="row__word">${ex.word}</span>
    </button>
  </li>`).join('');

/* ---------- the stage ---------- */
function mediaMarkup(m) {
  const tag = m.tag ? `<p class="stage__tag">${m.tag}</p>` : '';
  if (m.kind === 'video') {
    const sources = [
      m.av1 ? `<source src="${m.av1}" type="video/mp4; codecs=av01.0.05M.08">` : '',
      m.h264 ? `<source src="${m.h264}" type="video/mp4">` : ''
    ].join('');
    return `<video poster="${m.poster}" muted playsinline loop preload="none" ${reduced ? '' : 'autoplay'} width="1280" height="720">${sources}</video>${tag}`;
  }
  if (m.kind === 'image') {
    return `<img src="${m.src}" alt="${m.label}" decoding="async" width="1440" height="900">${tag}`;
  }
  if (m.kind === 'pair') {
    return `<span class="stage__pair"><img src="${m.a}" alt="${m.label} left" decoding="async"><img src="${m.b}" alt="${m.label} right" decoding="async"></span>${tag}`;
  }
  if (m.kind === 'glb') {
    return `<model-viewer src="${m.src}" poster="${m.poster}" alt="${m.label}" camera-controls auto-rotate loading="lazy" reveal="interaction" shadow-intensity="0.7" exposure="1.05" touch-action="pan-y"></model-viewer>${tag}`;
  }
  if (m.kind === 'iframe') {
    return `<img src="${m.poster}" alt="${m.label}" decoding="async">
      <button class="stage__tag" type="button" data-load-frame="${m.src}">Load the live game</button>`;
  }
  return '';
}

function render(i) {
  const ex = EXHIBITS[i];
  const m = ex.media[Math.min(mediaIndex, ex.media.length - 1)];
  const toggles = ex.media.length > 1
    ? `<span>${ex.media.map((x, k) => `<button type="button" data-m="${k}" style="border-bottom:1px solid ${k === mediaIndex ? 'var(--signal)' : 'transparent'};color:${k === mediaIndex ? 'var(--signal)' : 'var(--dim)'};margin-right:.9rem">${x.label}</button>`).join('')}</span>`
    : '';
  const liveLine = ex.live
    ? `<span>live <b class="stage__live" data-live="${ex.live}">...</b> <i class="live-note" style="font-style:normal;color:var(--dim);text-transform:none;letter-spacing:.06em"></i></span>`
    : '';
  stage.innerHTML = `
    <div class="stage__body">
      <p class="stage__kicker"><span class="n">${ex.n}</span><span>${ex.year}</span><span>${ex.word}</span></p>
      <h2 class="stage__title">${ex.title}</h2>
      <p class="stage__fact">${ex.fact}</p>
      <ul class="chips">${ex.tools.map(t => `<li${ex.models.includes(t) ? ' class="is-model"' : ''}>${t}</li>`).join('')}</ul>
      <p class="stage__out">
        ${ex.link ? `<a href="${ex.link.href}" rel="noopener">${ex.link.label}</a>` : '<span>not public</span>'}
        ${liveLine}${ex.costs ? '<span data-costs>reading the spend log...</span>' : ''}${toggles}
      </p>
      <button class="stage__back" type="button" data-back>Back to the index</button>
    </div>
    <div class="stage__media">${mediaMarkup(m)}</div>`;
  if (ex.live) paint(ex.live, stage.querySelector('[data-live]'));
  if (ex.costs) paintCosts(stage.querySelector('[data-costs]'));
  const v = stage.querySelector('video');
  if (v && !reduced) v.play().catch(() => {});
}

/* Real spend, read from the round 13 cost log that imagegen wrote. Never estimated. */
let costText = null;
async function paintCosts(node) {
  if (!node) return;
  if (costText === null) {
    try {
      const raw = await (await fetch('data/stills-costs-20260917.jsonl')).text();
      const rows = raw.trim().split('\n').map(JSON.parse);
      const usd = rows.reduce((sum, r) => sum + (r.usd || 0), 0);
      costText = rows.length + ' images, ' + usd.toFixed(2) + ' USD, logged';
    } catch (_) { costText = 'spend log unreadable'; }
  }
  node.textContent = costText;
}

function select(i, { keepMedia = false } = {}) {
  if (!keepMedia) mediaIndex = 0;
  current = i;
  for (const b of rail.querySelectorAll('.row')) b.setAttribute('aria-current', String(Number(b.dataset.i) === i));
  render(i);
}

const wide = () => window.matchMedia('(min-width: 901px)').matches;

rail.addEventListener('click', e => {
  const b = e.target.closest('.row');
  if (!b) return;
  select(Number(b.dataset.i));
  /* Phone: the stage is a second pane that slides in over the rail. Nothing scrolls. */
  if (!wide()) document.body.classList.add('stage-open');
});
rail.addEventListener('pointerover', e => {
  const b = e.target.closest('.row');
  if (b && wide()) select(Number(b.dataset.i));
});
rail.addEventListener('focusin', e => {
  const b = e.target.closest('.row');
  if (b) select(Number(b.dataset.i));
});

stage.addEventListener('click', e => {
  if (e.target.closest('[data-back]')) { document.body.classList.remove('stage-open'); return; }
  const pick = e.target.closest('[data-m]');
  if (pick) { mediaIndex = Number(pick.dataset.m); select(current, { keepMedia: true }); return; }
  const frame = e.target.closest('[data-load-frame]');
  if (frame) {
    const host = stage.querySelector('.stage__media');
    host.innerHTML = `<iframe src="${frame.dataset.loadFrame}" title="Undergrowth, live" loading="lazy" allow="fullscreen"></iframe><p class="stage__tag">Live build at undergrowth.pages.dev</p>`;
  }
});

select(0);
paintAll();

/* ---------- the overture settles into the header strip ----------
   Nothing on this page ever scrolls, so the load animation is the only thing that
   moves the layout. When the curtain finishes we mark the document settled, which is
   also the signal the no scroll gate waits for. */
const overture = document.querySelector('#overture');
function settled() {
  if (document.documentElement.dataset.overture === 'settled') return;
  document.documentElement.dataset.overture = 'settled';
}
if (reduced) {
  settled();
} else {
  overture.addEventListener('animationend', e => { if (e.animationName === 'curtain') settled(); });
  setTimeout(settled, 3200);
}

/* ---------- the about toggle: the old below the fold copy, inside the pane ---------- */
const aboutBtn = document.querySelector('#aboutBtn');
const about = document.querySelector('#about');
function setAbout(open) {
  about.hidden = !open;
  aboutBtn.setAttribute('aria-expanded', String(open));
}
aboutBtn.addEventListener('click', () => setAbout(about.hidden));
about.addEventListener('click', e => { if (e.target.closest('[data-close-about]')) setAbout(false); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!about.hidden) { setAbout(false); return; }
  document.body.classList.remove('stage-open');
});

/* One runnable check: every exhibit must have at least one media layer and a tool list. */
for (const ex of EXHIBITS) {
  if (!ex.media.length || !ex.tools.length) console.error('Exhibit is incomplete:', ex.n);
}
