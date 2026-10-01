// Live numbers for the hub. Tries the same origin proxy route first. In a plain
// static preview the Pages Function does not run, so we fall back to the round 13
// fixture and label it as sample data. A stale or sample number is dimmed.
// A number is never invented: if both the route and the fixture fail, the slot stays "-".

import { deriveSigzTracks, deriveTeeTimes, deriveBBCState } from '../live.js';

const FEEDS = {
  sigz: {
    route: '/api/live/sigz/tracks',
    sample: 'data/sigz-tracks-2026-09-17.json',
    read(payload) {
      const d = deriveSigzTracks(payload);
      return { value: d.totalPlays.toLocaleString('en-CA'), note: d.trackCount + ' tracks' };
    }
  },
  tee: {
    route: 'https://teetime.sigouin.net/api/teetimes',
    direct: true,
    sample: 'data/tee-teetimes-2026-09-17.json',
    read(payload) {
      const d = deriveTeeTimes(payload);
      if (!d.coversToday) return { value: String(d.openSlotsToday), note: 'feed dated ' + d.dataDate, stale: true };
      return { value: String(d.openSlotsToday), note: d.coursesWithLiveSlots + ' courses' };
    }
  },
  bbc: {
    route: '/api/live/bbc/state',
    sample: 'data/bbc-state-2026-09-17.json',
    read(payload) {
      const d = deriveBBCState(payload);
      return { value: d.scoreSummary, note: d.matchCount + ' matches' };
    }
  }
};

const cache = new Map();

async function load(key) {
  if (cache.has(key)) return cache.get(key);
  const feed = FEEDS[key];
  const attempt = (async () => {
    try {
      const res = await fetch(feed.route, { credentials: 'omit', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      return { ...feed.read(await res.json()), source: 'live' };
    } catch (_) {
      try {
        const res = await fetch(feed.sample, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        const out = feed.read(await res.json());
        return { ...out, source: 'sample', stale: true };
      } catch (_err) {
        return { value: '-', note: 'feed unreachable', source: 'none', stale: true };
      }
    }
  })();
  cache.set(key, attempt);
  return attempt;
}

export async function paint(key, node) {
  if (!node || !FEEDS[key]) return;
  const out = await load(key);
  node.textContent = out.value;
  const meta = node.nextElementSibling;
  if (meta && meta.classList.contains('live-note')) {
    meta.textContent = out.source === 'sample' ? 'sample data, 2026-09-17' : out.note;
    meta.classList.toggle('sample-note', out.source === 'sample');
  }
  node.classList.toggle('stale', Boolean(out.stale));
}

export function paintAll(root = document) {
  for (const node of root.querySelectorAll('[data-live]')) paint(node.dataset.live, node);
}
