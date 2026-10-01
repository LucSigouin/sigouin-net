(() => {
  document.documentElement.classList.add('js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    document.documentElement.classList.add('js-reveal');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }

  // Original parametric sculpture: a bent, tapered tube, drawn as contour rings.
  // Its changing cross-section gives a quiet, physical sense of tension and weight.
  const group = document.querySelector('#sculpture-lines');
  const control = document.querySelector('#art-control');
  const label = control.querySelector('.control-label');
  group.replaceChildren();
  control.hidden = false;
  const ns = 'http://www.w3.org/2000/svg';
  const count = 112;
  const segments = 58;
  const rings = [];
  let angle = 0.16;
  let moving = false;
  let inView = true;
  let frame = null;
  let lastTime = 0;
  for (let i = 0; i < count; i++) {
    const t = i / count * Math.PI * 2;
    const points = [];
    const radius = 1.4 + 0.16 * Math.cos(3 * t);
    const thickness = 0.46 + 0.19 * Math.sin(t + 0.5);
    for (let j = 0; j <= segments; j++) {
      const v = j / segments * Math.PI * 2;
      const r = radius + thickness * Math.cos(v);
      points.push([r * Math.cos(t), r * Math.sin(t) * 1.18, thickness * Math.sin(v) + 0.33 * Math.sin(2 * t)]);
    }
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linejoin', 'round');
    group.appendChild(path);
    rings.push({ path, points, depth: 0 });
  }
  function project(point, rotation) {
    const [x, y, z] = point;
    const ca = Math.cos(rotation), sa = Math.sin(rotation);
    const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
    const tilt = .57;
    const y1 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
    const z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
    const roll = -.39;
    return [310 + (x1 * Math.cos(roll) - y1 * Math.sin(roll)) * 126, 318 + (x1 * Math.sin(roll) + y1 * Math.cos(roll)) * 126, z2];
  }
  function draw() {
    rings.forEach(ring => {
      let depth = 0;
      const d = ring.points.map((point, index) => {
        const p = project(point, angle);
        depth += p[2];
        return `${index ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`;
      }).join(' ') + 'Z';
      ring.depth = depth / ring.points.length;
      ring.path.setAttribute('d', d);
      const strength = Math.max(0, Math.min(1, (ring.depth + 1.5) / 3));
      ring.path.setAttribute('stroke', `rgba(163, 55, 32, ${(.26 + strength * .56).toFixed(2)})`);
      ring.path.setAttribute('stroke-width', (.58 + strength * .45).toFixed(2));
    });
  }
  function tick(time) {
    if (!moving || !inView || document.hidden) { frame = null; return; }
    const delta = Math.min(time - (lastTime || time), 40);
    lastTime = time;
    angle += delta * .00013;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function start() {
    if (moving && inView && !document.hidden && frame === null) {
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    }
  }
  control.addEventListener('click', () => {
    if (reducedMotion.matches) {
      angle += .45;
      draw();
      return;
    }
    moving = !moving;
    control.setAttribute('aria-pressed', String(moving));
    label.textContent = moving ? 'Pause the study' : 'Set in motion';
    if (moving) start();
  });
  if (reducedMotion.matches) label.textContent = 'Turn the study';
  reducedMotion.addEventListener('change', () => {
    moving = false;
    control.setAttribute('aria-pressed', 'false');
    label.textContent = reducedMotion.matches ? 'Turn the study' : 'Set in motion';
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      start();
    }).observe(document.querySelector('.hero-art'));
  }
  document.addEventListener('visibilitychange', start);
  draw();
})();
