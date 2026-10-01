export type Tier = 'low' | 'medium' | 'high';
export const TIERS: Tier[] = ['low', 'medium', 'high'];

export interface Quality {
  tier: Tier;
  pixelRatio: number;
  shadowMap: number;
  post: boolean;
  bloom: boolean;
  dof: boolean;
  msaa: number;
  grass: number;
  flowers: number;
  particles: number;
  life: number;
  clouds: number;
}

export function settingsFor(tier: Tier, mobile: boolean): Quality {
  const dpr = window.devicePixelRatio || 1;
  switch (tier) {
    case 'high':
      return { tier, pixelRatio: Math.min(dpr, mobile ? 1.5 : 1.75), shadowMap: 2048, post: true, bloom: true, dof: true, msaa: 4, grass: 1, flowers: 1, particles: 1, life: 1, clouds: 1 };
    case 'medium':
      return { tier, pixelRatio: Math.min(dpr, mobile ? 1.35 : 1.4), shadowMap: 2048, post: true, bloom: true, dof: false, msaa: mobile ? 0 : 2, grass: 0.55, flowers: 0.75, particles: 0.7, life: 0.7, clouds: 0.8 };
    default:
      return { tier, pixelRatio: Math.min(dpr, 1.15), shadowMap: 1024, post: false, bloom: false, dof: false, msaa: 0, grass: 0.3, flowers: 0.45, particles: 0.4, life: 0.4, clouds: 0.6 };
  }
}

const KEY = 'hub-quality';

/** Medium by default; the HUD button saves High or Medium; `?quality=low|medium|high` overrides both. */
export function pickTier(): Tier {
  const q = new URLSearchParams(location.search).get('quality');
  if ((TIERS as string[]).includes(q ?? '')) return q as Tier;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'high' || saved === 'medium') return saved;
  } catch { /* storage blocked: default */ }
  return 'medium';
}

/** Grass, flowers and render targets are sized at startup, so a new tier needs a reload. */
export function switchTier(tier: Tier) {
  const url = new URL(location.href);
  url.searchParams.delete('quality');
  try { localStorage.setItem(KEY, tier); } catch { url.searchParams.set('quality', tier); }
  location.replace(url);
}

export function isMobile() {
  return matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
