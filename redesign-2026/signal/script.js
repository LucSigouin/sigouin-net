(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.getElementById('signal-canvas');
  const ctx = canvas.getContext('2d');
  const modeButtons = [...document.querySelectorAll('[data-mode]')];
  const caption = document.getElementById('mode-caption');
  const motionButton = document.getElementById('motion-toggle');
  let mode = 'systems', previousMode = 'systems', transition = 1, paused = reducedMotion.matches;
  let w = 0, h = 0, tick = 0, pointerX = 0, pointerY = 0, targetX = 0, targetY = 0, frame = null, inView = true;
  const captions = { systems: 'A LITTLE ORDER IN THE COMPLEXITY', sound: 'A DIFFERENT KIND OF SIGNAL', selfhosted: 'MY OWN SMALL, CONNECTED WORLD' };
  const TAU = Math.PI * 2;
  const points = [];
  for (let ring = 0; ring < 27; ring++) {
    const latitude = -Math.PI / 2 + (ring + .5) / 27 * Math.PI;
    for (let j = 0; j < 90; j++) points.push({ latitude, longitude: j / 90 * TAU, ring, j });
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width; h = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function position(p, activeMode, t) {
    const lat = p.latitude, lon = p.longitude;
    let x, y, z;
    if (activeMode === 'sound') {
      const amplitude = .45 + .23 * Math.sin(lon * 3 + t * .5) + .12 * Math.cos(lon * 7 - t * .3);
      const r = 1 + Math.cos(lat) * .11 * Math.sin(lon * 6 + t);
      x = Math.cos(lon) * r;
      z = Math.sin(lon) * r;
      y = Math.sin(lat) * amplitude + .13 * Math.cos(lon * 3 + t * .5);
    } else if (activeMode === 'selfhosted') {
      const sector = Math.floor(p.j / 30);
      const localLon = (p.j % 30) / 30 * TAU;
      const center = sector / 3 * TAU + t * .06;
      x = Math.cos(lat) * Math.cos(localLon) * .34 + Math.cos(center) * .78;
      z = Math.cos(lat) * Math.sin(localLon) * .34 + Math.cos(center) * .15;
      y = Math.sin(lat) * .34 + Math.sin(center) * .72;
    } else {
      const r = 1 + .035 * Math.sin(lon * 3 + lat * 5 + t * .25);
      x = Math.cos(lat) * Math.cos(lon) * r;
      y = Math.sin(lat) * r;
      z = Math.cos(lat) * Math.sin(lon) * r;
    }
    return { x, y, z };
  }
  function project(p, spin, tilt, scale) {
    let x = p.x * Math.cos(spin) + p.z * Math.sin(spin);
    let z = -p.x * Math.sin(spin) + p.z * Math.cos(spin);
    let y = p.y * Math.cos(tilt) - z * Math.sin(tilt);
    z = p.y * Math.sin(tilt) + z * Math.cos(tilt);
    const perspective = 3.9 / (3.9 + z);
    return { x: w * .52 + x * scale * perspective, y: h * .52 + y * scale * perspective, z, perspective };
  }
  function draw() {
    if (!ctx || !w) return;
    ctx.clearRect(0, 0, w, h);
    const scale = Math.min(w * .335, h * .355);
    const spin = tick * .075 + pointerX * .26 - .3;
    const tilt = -.27 + pointerY * .2;
    const glow = ctx.createRadialGradient(w * .52, h * .52, 0, w * .52, h * .52, scale * 1.65);
    glow.addColorStop(0, 'rgba(150,188,73,.045)'); glow.addColorStop(.65, 'rgba(137,172,62,.025)'); glow.addColorStop(1, 'rgba(137,172,62,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    const mix = transition * transition * (3 - 2 * transition);
    const projected = points.map(p => {
      let a = position(p, mode, tick);
      if (transition < 1) {
        const b = position(p, previousMode, tick);
        a = { x: b.x + (a.x - b.x) * mix, y: b.y + (a.y - b.y) * mix, z: b.z + (a.z - b.z) * mix };
      }
      return project(a, spin, tilt, scale);
    });
    for (let ring = 0; ring < 27; ring++) {
      for (let j = 0; j < 90; j++) {
        const a = projected[ring * 90 + j], b = projected[ring * 90 + (j + 1) % 90];
        if (mode === 'selfhosted' && transition === 1 && (j + 1) % 30 === 0) continue;
        const front = (1.4 - a.z) / 2.8;
        ctx.strokeStyle = `rgba(191,220,121,${.035 + front * .24})`;
        ctx.lineWidth = .6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if (j % 6 === 0 && ring < 26 && mode !== 'selfhosted') {
          const c = projected[(ring + 1) * 90 + j];
          ctx.strokeStyle = `rgba(181,204,136,${.015 + front * .085})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke();
        }
        if ((j + ring) % 3 === 0) {
          ctx.fillStyle = `rgba(209,240,145,${.08 + front * .65})`;
          ctx.beginPath(); ctx.arc(a.x, a.y, Math.max(.25, .7 * a.perspective), 0, TAU); ctx.fill();
        }
      }
    }
    // Thin orbital paths extend beyond the dense central signal.
    for (let orbit = 0; orbit < 3; orbit++) {
      ctx.beginPath();
      for (let j = 0; j <= 150; j++) {
        const theta = j / 150 * TAU;
        const radius = 1.36 + orbit * .1;
        const px = Math.cos(theta) * radius;
        const py = Math.sin(theta) * radius;
        const p = project({ x: px, y: py * Math.cos(.8 + orbit * .7), z: py * Math.sin(.8 + orbit * .7) }, spin + orbit * .8, tilt + .2, scale);
        if (!j) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = `rgba(172,203,110,${orbit === 1 ? .28 : .11})`; ctx.lineWidth = .65; ctx.stroke();
      const theta = tick * (.13 + orbit * .025) + orbit * 2;
      const radius = 1.36 + orbit * .1;
      const p = project({ x: Math.cos(theta) * radius, y: Math.sin(theta) * radius * Math.cos(.8 + orbit * .7), z: Math.sin(theta) * radius * Math.sin(.8 + orbit * .7) }, spin + orbit * .8, tilt + .2, scale);
      ctx.fillStyle = '#d2f56b'; ctx.beginPath(); ctx.arc(p.x, p.y, orbit === 1 ? 3 : 1.8, 0, TAU); ctx.fill();
      if (orbit === 1) { ctx.strokeStyle = '#d2f56b45'; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, TAU); ctx.stroke(); }
    }
    // Registration ticks make the sculpture feel like an instrument, not a metric.
    ctx.strokeStyle = '#a8bd7226'; ctx.lineWidth = .6;
    for (let i = 0; i < 72; i++) {
      const a = i / 72 * TAU;
      const r = scale * 1.53;
      ctx.beginPath(); ctx.moveTo(w * .52 + Math.cos(a) * r, h * .52 + Math.sin(a) * r);
      ctx.lineTo(w * .52 + Math.cos(a) * (r + (i % 6 === 0 ? 7 : 3)), h * .52 + Math.sin(a) * (r + (i % 6 === 0 ? 7 : 3))); ctx.stroke();
    }
  }
  let lastTime = 0;
  function animate(time) {
    frame = null;
    const delta = Math.min((time - lastTime) / 1000 || .016, .05); lastTime = time;
    if (!paused) tick += delta;
    pointerX += (targetX - pointerX) * .045; pointerY += (targetY - pointerY) * .045;
    if (transition < 1) transition = Math.min(1, transition + delta * 1.15);
    draw();
    if (inView && !document.hidden && (!paused || transition < 1)) frame = requestAnimationFrame(animate);
  }
  function requestFrame() { if (frame === null && inView && !document.hidden) { lastTime = performance.now(); frame = requestAnimationFrame(animate); } }
  modeButtons.forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.mode;
    if (next === mode) return;
    previousMode = mode; mode = next; transition = reducedMotion.matches ? 1 : 0;
    modeButtons.forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
    caption.textContent = captions[mode];
    canvas.setAttribute('aria-label', `Abstract ${mode === 'selfhosted' ? 'three-node self-hosting' : mode} signal sculpture. ${captions[mode].toLowerCase()}.`);
    requestFrame();
  }));
  function updateMotionControl() {
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
    motionButton.title = paused ? 'Play animation' : 'Pause animation';
    motionButton.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
  }
  motionButton.addEventListener('click', () => { paused = !paused; updateMotionControl(); requestFrame(); });
  reducedMotion.addEventListener('change', event => { paused = event.matches; transition = 1; updateMotionControl(); requestFrame(); });
  canvas.addEventListener('pointermove', event => {
    if (reducedMotion.matches || paused) return;
    const rect = canvas.getBoundingClientRect();
    targetX = (event.clientX - rect.left) / rect.width - .5;
    targetY = (event.clientY - rect.top) / rect.height - .5;
  });
  canvas.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (inView) requestFrame(); }, { threshold: 0 }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestFrame(); });
  updateMotionControl();
  resize(); requestFrame();
  document.documentElement.classList.add('signal-ready');
  canvas.removeAttribute('aria-hidden');
  const bars = document.querySelector('.sound-bars');
  for (let i = 0; i < 64; i++) {
    const bar = document.createElement('i');
    const height = 7 + Math.abs(Math.sin(i * .71) * Math.cos(i * .21)) * 36;
    bar.style.setProperty('--bar-height', `${height}px`); bars.appendChild(bar);
  }
  const revealTargets = document.querySelectorAll('.about-content, .section-heading, .project, .lab-heading, .lab-network, .lab-footnote, .note-row');
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
    }, { threshold: .08 });
    revealTargets.forEach(el => { el.classList.add('reveal'); observer.observe(el); });
  }
})();
