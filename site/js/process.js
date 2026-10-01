
  /* The process wing is a stepper, not a scroll. One scene fills the pane at a time and
     next, previous, arrow keys, one wheel gesture or one swipe swaps it in place. */
  const scenes = [...document.querySelectorAll('#scenes .scene')];
  const dots = document.querySelector('#dots');
  const count = document.querySelector('#count');
  const prev = document.querySelector('#prev');
  const next = document.querySelector('#next');
  const ledger = document.querySelector('#ledger');
  const ledgerBtn = document.querySelector('#ledgerBtn');
  /* bg.js sets this from reduced motion or Data Saver; when still, no clip on the page plays. */
  const still = document.documentElement.dataset.motion === 'still';
  const strip = document.querySelector('.proc-strip video');
  if (strip && !still) strip.play().catch(() => {});
  let at = 0;

  dots.innerHTML = scenes.map((_, i) =>
    `<button type="button" data-i="${i}" aria-label="Scene P${i + 1}"></button>`).join('');

  function show(i) {
    at = Math.max(0, Math.min(scenes.length - 1, i));
    scenes.forEach((s, k) => s.classList.toggle('is-on', k === at));
    for (const d of dots.children) {
      if (Number(d.dataset.i) === at) d.setAttribute('aria-current', 'step');
      else d.removeAttribute('aria-current');
    }
    count.textContent = `P${at + 1} / ${scenes.length}`;
    prev.disabled = at === 0;
    next.disabled = at === scenes.length - 1;
    /* Media loads only for the scene on screen and the next one, so hidden scenes cost nothing. */
    for (const k of [at, at + 1]) scenes[k]?.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
    scenes.forEach((s, k) => s.querySelectorAll('video').forEach(v => {
      if (k === at && !still) v.play().catch(() => {});
      else v.pause();
    }));
  }

  prev.addEventListener('click', () => show(at - 1));
  next.addEventListener('click', () => show(at + 1));
  dots.addEventListener('click', e => {
    const d = e.target.closest('[data-i]');
    if (d) show(Number(d.dataset.i));
  });

  function setLedger(open) {
    ledger.hidden = !open;
    ledgerBtn.setAttribute('aria-expanded', String(open));
  }
  ledgerBtn.addEventListener('click', () => setLedger(ledger.hidden));
  ledger.addEventListener('click', e => { if (e.target.closest('[data-close-ledger]')) setLedger(false); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { setLedger(false); return; }
    if (!ledger.hidden) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); show(at + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); show(at - 1); }
  });

  /* One wheel gesture moves one scene. The lock drains only after the gesture stops. */
  let locked = false, unlock = null;
  document.addEventListener('wheel', e => {
    if (!ledger.hidden) return;
    const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(d) < 8) return;
    clearTimeout(unlock);
    unlock = setTimeout(() => { locked = false; }, 380);
    if (locked) return;
    locked = true;
    show(at + (d > 0 ? 1 : -1));
  }, { passive: true });

  let sx = 0, sy = 0;
  document.addEventListener('touchstart', e => {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!ledger.hidden) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < 44 && Math.abs(dy) < 44) return;
    const d = Math.abs(dx) > Math.abs(dy) ? -dx : -dy;
    show(at + (d > 0 ? 1 : -1));
  }, { passive: true });

  show(0);
  /* Same settled flag the index sets, so the no scroll gate waits on one signal. */
  document.documentElement.dataset.overture = 'settled';
