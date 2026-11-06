// Scripted play for the probe: a walk grid built from the real collision code, A* paths over
// it, and steps that drive the player through the same input a thumbstick uses.
import type { App } from '../core/app';
import type { Probe, Shot, ShotOpts } from './probe';

export interface Grid { level: string; minX: number; minZ: number; step: number; nx: number; nz: number; cells: Uint8Array }
const grids = new WeakMap<object, Grid>();

/** Walkability per 25 cm cell: 0 outside the level, 1 the player can stand here, 2 a collider blocks it. */
export function grid(app: App): Grid {
  const L = app.level;
  const hit = grids.get(L);
  if (hit) return hit;
  const col = L.colliders, step = 0.25, R = app.player.radius + 0.05, room = col.room;
  const [x0, x1, z0, z1] = room ? [room.minX, room.maxX, room.minZ, room.maxZ] : [-28, 30, -33, 28];
  const nx = Math.ceil((x1 - x0) / step), nz = Math.ceil((z1 - z0) / step);
  const cells = new Uint8Array(nx * nz);
  const p = { x: 0, z: 0 };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + (i + 0.5) * step, z = z0 + (j + 0.5) * step;
    if (col.boundary && col.boundary(x, z) > -0.05) continue;
    p.x = x;
    p.z = z;
    col.resolve(p, R);
    cells[j * nx + i] = Math.abs(p.x - x) + Math.abs(p.z - z) > 1e-4 ? 2 : 1;
  }
  const g = { level: L.id, minX: x0, minZ: z0, step, nx, nz, cells };
  grids.set(L, g);
  return g;
}

const cellOf = (g: Grid, x: number, z: number): [number, number] => [Math.floor((x - g.minX) / g.step), Math.floor((z - g.minZ) / g.step)];
const centre = (g: Grid, i: number, j: number): [number, number] => [g.minX + (i + 0.5) * g.step, g.minZ + (j + 0.5) * g.step];
const open = (g: Grid, i: number, j: number) => i >= 0 && j >= 0 && i < g.nx && j < g.nz && g.cells[j * g.nx + i] === 1;

function nearestOpen(g: Grid, i: number, j: number): [number, number] | null {
  for (let r = 0; r < 16; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    if (Math.max(Math.abs(di), Math.abs(dj)) === r && open(g, i + di, j + dj)) return [i + di, j + dj];
  }
  return null;
}

function sight(g: Grid, ax: number, az: number, bx: number, bz: number) {
  const n = Math.ceil(Math.hypot(bx - ax, bz - az) / (g.step * 0.5));
  for (let k = 0; k <= n; k++) {
    const [i, j] = cellOf(g, ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n);
    if (!open(g, i, j)) return false;
  }
  return true;
}

/** A* over the grid (8 neighbours, no corner cutting), then pulled tight along lines of sight. */
export function plan(g: Grid, from: [number, number], to: [number, number]): [number, number][] | null {
  const s = nearestOpen(g, ...cellOf(g, ...from)), t = nearestOpen(g, ...cellOf(g, ...to));
  if (!s || !t) return null;
  const N = g.nx * g.nz, idx = (i: number, j: number) => j * g.nx + i;
  const cost = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const heap: [number, number][] = [];
  const push = (f: number, k: number) => {
    heap.push([f, k]);
    for (let c = heap.length - 1; c > 0;) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      for (let c = 0; ;) {
        const l = c * 2 + 1, r = l + 1;
        let m = c;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === c) break;
        [heap[m], heap[c]] = [heap[c], heap[m]];
        c = m;
      }
    }
    return top;
  };
  const h = (i: number, j: number) => { const dx = Math.abs(i - t[0]), dz = Math.abs(j - t[1]); return Math.max(dx, dz) + 0.4142 * Math.min(dx, dz); };
  const start = idx(...s), goal = idx(...t);
  cost[start] = 0;
  push(h(...s), start);
  while (heap.length) {
    const [, k] = pop();
    if (done[k]) continue;
    done[k] = 1;
    if (k === goal) break;
    const i = k % g.nx, j = (k / g.nx) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj;
      if (!open(g, ni, nj) || (di && dj && (!open(g, i + di, j) || !open(g, i, j + dj)))) continue;
      const nk = idx(ni, nj), c = cost[k] + (di && dj ? 1.4142 : 1);
      if (c < cost[nk]) { cost[nk] = c; came[nk] = k; push(c + h(ni, nj), nk); }
    }
  }
  if (!done[goal]) return null;
  const cells: [number, number][] = [];
  for (let k = goal; k !== -1; k = came[k]) cells.push(centre(g, k % g.nx, (k / g.nx) | 0));
  cells.reverse();
  cells[cells.length - 1] = to;
  const path: [number, number][] = [from];
  for (let a = 0; a < cells.length - 1;) {
    let b = cells.length - 1;
    while (b > a + 1 && !sight(g, ...(path[path.length - 1]), ...cells[b])) b--;
    path.push(cells[b]);
    a = b;
  }
  return path;
}

export type Step =
  | { walkTo: string | [number, number]; run?: boolean; timeout?: number; tol?: number }
  | { press: string }
  | { hold: string; ms: number }
  | { wait: number }
  | { expect: Partial<{ level: string; state: string; cardOpen: boolean; nearest: string | null; leaving: boolean }>; timeout?: number }
  | ({ shot: string } & ShotOpts)
  | { teleport: string }
  | { leave: true; timeout?: number };

export interface StepResult { i: number; step: Record<string, unknown>; pass: boolean; reason: string; ms: number; at: { level: string; x: number; z: number }; shot?: Shot }

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function steer(app: App, dx: number, dz: number, mag: number, run: boolean) {
  // Camera-relative stick, exactly as the touch thumbstick feeds Input.
  const yaw = app.rig.yaw, len = Math.hypot(dx, dz) || 1;
  const x = dx / len, z = dz / len;
  app.input.stickMoveX = (x * Math.cos(yaw) - z * Math.sin(yaw)) * mag;
  app.input.stickMoveY = (-x * Math.sin(yaw) - z * Math.cos(yaw)) * mag;
  app.input.stickRun = run;
}
const release = (app: App) => { app.input.stickMoveX = app.input.stickMoveY = 0; app.input.stickRun = false; };

const KEYS: Record<string, string> = { Escape: 'Escape', Enter: 'Enter', Space: ' ', ShiftLeft: 'Shift', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight' };
const keyOf = (code: string) => KEYS[code] ?? (/^Key[A-Z]$/.test(code) ? code.slice(3).toLowerCase() : code);
const key = (type: 'keydown' | 'keyup', code: string) => dispatchEvent(new KeyboardEvent(type, { key: keyOf(code), code, bubbles: true }));

async function until(test: () => boolean, ms: number) {
  const end = performance.now() + ms;
  while (!test()) { if (performance.now() > end) return false; await frame(); }
  return true;
}

async function walk(app: App, to: [number, number], o: { run?: boolean; timeout?: number; tol?: number }, stopWhen?: () => boolean) {
  if (!(await until(() => app.state === 'play', 8000))) return `the hub never got back to play (state ${app.state})`;
  const g = grid(app), p = app.player.pos, tol = o.tol ?? 0.3;
  const path = plan(g, [p.x, p.z], to);
  if (!path) return `no walkable path from (${p.x.toFixed(1)}, ${p.z.toFixed(1)}) to (${to[0].toFixed(1)}, ${to[1].toFixed(1)}) in ${g.level}`;
  const end = performance.now() + (o.timeout ?? 45000);
  let k = 1, mark = { t: performance.now(), x: p.x, z: p.z };
  try {
    for (;;) {
      await frame();
      if (stopWhen?.()) return '';
      const dGoal = Math.hypot(to[0] - p.x, to[1] - p.z);
      if (dGoal < tol) break;
      while (k < path.length - 1 && Math.hypot(path[k][0] - p.x, path[k][1] - p.z) < 0.7) k++;
      const [wx, wz] = path[k];
      const last = k === path.length - 1;
      steer(app, wx - p.x, wz - p.z, last ? Math.min(1, Math.max(0.35, dGoal / 1.2)) : 1, (o.run ?? true) && dGoal > 2.5);
      const now = performance.now();
      if (now - mark.t > 2500) {
        if (Math.hypot(p.x - mark.x, p.z - mark.z) < 0.2) return `stuck at (${p.x.toFixed(2)}, ${p.z.toFixed(2)}), heading for waypoint ${k}/${path.length - 1} (${wx.toFixed(1)}, ${wz.toFixed(1)})`;
        mark = { t: now, x: p.x, z: p.z };
      }
      if (now > end) return `timed out ${dGoal.toFixed(2)} m short at (${p.x.toFixed(2)}, ${p.z.toFixed(2)})`;
    }
  } finally { release(app); }
  await until(() => app.player.speed < 0.05, 1500);
  return '';
}

export async function run(probe: Probe, steps: Step[], o: { stopOnFail?: boolean } = {}) {
  const app = probe.app, t0 = performance.now();
  const wasFrozen = probe.frozen, size = probe.size();
  if (wasFrozen) probe.freeze(false);
  const out: StepResult[] = [];
  const state = () => ({ level: app.level.id, state: app.state, cardOpen: app.card.isOpen, nearest: app.nearest?.id ?? null, leaving: app.leaving });
  try {
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i], ts = performance.now();
      let reason = '', shot: Shot | undefined;
      try {
        if ('walkTo' in s) {
          const it = typeof s.walkTo === 'string' ? app.level.interactables.find((x) => x.id === s.walkTo) : null;
          if (typeof s.walkTo === 'string' && !it) reason = `no interactable "${s.walkTo}" in ${app.level.id} (have: ${app.level.interactables.map((x) => x.id).join(', ')})`;
          else {
            reason = await walk(app, it ? [it.stand.x, it.stand.z] : (s.walkTo as [number, number]), s);
            if (!reason && it) {
              await until(() => app.nearest?.id === it.id, 1000);
              if (app.nearest?.id !== it.id) reason = `arrived, but the nearest prompt is ${app.nearest?.id ?? 'none'}, not ${it.id}`;
            }
          }
        } else if ('press' in s) {
          key('keydown', s.press);
          await frame(); await frame();
          key('keyup', s.press);
        } else if ('hold' in s) {
          key('keydown', s.hold);
          await sleep(s.ms);
          key('keyup', s.hold);
        } else if ('wait' in s) {
          await sleep(s.wait);
        } else if ('expect' in s) {
          const want = s.expect as Record<string, unknown>;
          const ok = () => { const now = state() as Record<string, unknown>; return Object.keys(want).every((k) => now[k] === want[k]); };
          if (!(await until(ok, s.timeout ?? 8000))) {
            const now = state() as Record<string, unknown>;
            reason = `wanted ${Object.keys(want).map((k) => `${k}=${want[k]}`).join(' ')}, got ${Object.keys(want).map((k) => `${k}=${now[k]}`).join(' ')}`;
          }
        } else if ('shot' in s) {
          if (wasFrozen) probe.pin();
          const { shot: _name, ...opts } = s;
          shot = probe.shot(opts);
        } else if ('teleport' in s) {
          const it = app.level.interactables.find((x) => x.id === s.teleport);
          if (!it) reason = `no interactable "${s.teleport}"`;
          else { app.player.teleport(it.stand.x, it.stand.z, it.stand.heading); app.rig.reset(app.player, app.level.cam); await frame(); }
        } else if ('leave' in s) {
          if (app.level !== app.courtyard) reason = `leave only works in the courtyard, not ${app.level.id}`;
          else {
            reason = await walk(app, [0, 23.4], { run: true, tol: 0.5 }, () => app.leaving);
            if (!reason && !app.leaving) {
              const end = performance.now() + (s.timeout ?? 6000);
              while (!app.leaving && performance.now() < end) { steer(app, 0, 1, 1, false); await frame(); }
              release(app);
              if (!app.leaving) reason = `walked out to z=${app.player.pos.z.toFixed(2)} but the hub did not start leaving`;
            }
          }
        } else reason = `unknown step ${JSON.stringify(s)}`;
      } catch (e) {
        reason = `threw: ${(e as Error).message}`;
      }
      const p = app.player.pos;
      const { ...echo } = s as Record<string, unknown>;
      out.push({ i, step: echo, pass: !reason, reason: reason || 'ok', ms: Math.round(performance.now() - ts), at: { level: app.level.id, x: +p.x.toFixed(2), z: +p.z.toFixed(2) }, ...(shot ? { shot } : {}) });
      if (reason && (o.stopOnFail ?? true)) break;
    }
  } finally {
    release(app);
    if (wasFrozen && !app.leaving) probe.freeze(true, { size });
  }
  return { pass: out.length === steps.length && out.every((r) => r.pass), ran: out.length, of: steps.length, ms: Math.round(performance.now() - t0), steps: out };
}
