import { EXHIBITS } from "./exhibits.js";
import { fetchProxy, deriveSigzTracks, deriveTeeTimes, deriveBBCState } from "./live.js";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = () => matchMedia("(max-width: 900px)").matches;

/* ---------------- index rows ---------------- */

const list = document.querySelector("#index");
const stageMedia = document.querySelector("#stage-media");
const stageFact = document.querySelector("#stage-fact");
const stageCredits = document.querySelector("#stage-credits");
const stageLive = document.querySelector("#stage-live");

const rows = EXHIBITS.map((ex, i) => {
  const li = document.createElement("li");
  li.className = "row" + (ex.weight ? " row--" + ex.weight : "");
  li.setAttribute("aria-current", i === 0 ? "true" : "false");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "row__btn";
  btn.innerHTML =
    '<span class="row__n">' + ex.n + "</span>" +
    '<span class="row__title">' + ex.title + "</span>" +
    '<span class="row__tail">' + ex.year + ' <span class="row__word">' + ex.word + "</span></span>";
  li.append(btn);

  if (ex.thumbs.length) {
    const strip = document.createElement("div");
    strip.className = "row__thumbs";
    for (const t of ex.thumbs) {
      const img = document.createElement("img");
      img.src = t;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      strip.append(img);
    }
    li.append(strip);
  }

  btn.addEventListener("click", () => select(i, true));
  btn.addEventListener("pointerenter", () => { if (!narrow()) select(i, false); });
  btn.addEventListener("focus", () => select(i, false));
  list.append(li);
  return li;
});

let current = -1;
let slot = 0;
let timer = null;

function select(i, locked) {
  if (i === current && !locked) return;
  if (i !== current) slot = 0;
  else slot = (slot + 1) % EXHIBITS[i].media.length;
  current = i;
  rows.forEach((r, k) => r.setAttribute("aria-current", k === i ? "true" : "false"));
  paint();
}

function paint() {
  const ex = EXHIBITS[current];
  const m = ex.media[slot];
  stageMedia.replaceChildren();

  if (m.kind === "video") {
    const v = document.createElement("video");
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "none";
    v.poster = m.poster;
    v.setAttribute("aria-label", ex.title + " loop");
    if (!m.single) {
      const av1 = document.createElement("source");
      av1.src = m.src + ".av1.mp4";
      av1.type = 'video/mp4; codecs="av01.0.05M.08"';
      v.append(av1);
    }
    const h264 = document.createElement("source");
    h264.src = m.src + ".mp4";
    h264.type = "video/mp4";
    v.append(h264);
    v.className = "fade";
    stageMedia.append(v);
    if (!reduced) { v.autoplay = true; v.play().catch(() => {}); }
  } else if (m.kind === "glb") {
    const mv = document.createElement("model-viewer");
    mv.setAttribute("src", m.src);
    mv.setAttribute("poster", m.poster);
    mv.setAttribute("alt", ex.title + " model");
    mv.setAttribute("loading", "lazy");
    mv.setAttribute("camera-controls", "");
    mv.setAttribute("shadow-intensity", "1");
    mv.setAttribute("exposure", "1.1");
    if (!reduced) mv.setAttribute("auto-rotate", "");
    mv.className = "fade";
    stageMedia.append(mv);
  } else if (m.kind === "iframe") {
    const frame = document.createElement("iframe");
    frame.src = m.src;
    frame.title = ex.title + ", playable";
    frame.loading = "lazy";
    frame.className = "fade";
    stageMedia.append(frame);
  } else {
    const img = document.createElement("img");
    img.src = m.src;
    img.alt = ex.title + ", " + m.tag;
    img.decoding = "async";
    img.className = "fade";
    stageMedia.append(img);
  }

  const tag = document.createElement("span");
  tag.className = "stage__tag" + (m.kind === "image" ? " stage__tag--quiet" : "");
  tag.textContent = ex.n + " " + m.tag + (ex.media.length > 1 ? "  /  " + (slot + 1) + " of " + ex.media.length : "");
  stageMedia.append(tag);

  stageFact.textContent = ex.fact;
  stageCredits.innerHTML = ex.credits;
  paintLive(ex);

  clearTimeout(timer);
  if (!reduced && ex.media.length > 1) {
    timer = setTimeout(() => { slot = (slot + 1) % ex.media.length; paint(); }, 5200);
  }
}

/* ---------------- live numbers ---------------- */

const SAMPLES = {
  "/api/live/sigz/tracks": "assets/samples/sigz-tracks-2026-09-17.json",
  "/api/live/tee/teetimes": "assets/samples/tee-teetimes-2026-09-17.json",
  "/api/live/bbc/state": "assets/samples/bbc-state-2026-09-17.json"
};
const DIRECT = { "/api/live/tee/teetimes": "https://teetime.sigouin.net/api/teetimes" };
const feeds = {};

async function readFeed(route) {
  if (feeds[route]) return feeds[route];
  feeds[route] = (async () => {
    try {
      return { data: await fetchProxy(route), source: "live" };
    } catch (e) { /* proxy function not running in a static preview */ }
    if (DIRECT[route]) {
      try {
        const r = await fetch(DIRECT[route], { credentials: "omit" });
        if (r.ok) return { data: await r.json(), source: "live" };
      } catch (e) { /* CORS or offline */ }
    }
    const r = await fetch(SAMPLES[route]);
    return { data: await r.json(), source: "sample" };
  })();
  return feeds[route];
}

function line(label, value, source) {
  const cls = source === "sample" ? "sample" : source === "stale" ? "stale" : "";
  return '<span class="' + cls + '">' + label + " <b>" + value + "</b>" +
    (source === "sample" ? " (sample data, 2026-09-17)" : "") + "</span>";
}

async function paintLive(ex) {
  stageLive.innerHTML = "";
  if (!ex.live) return;
  if (ex.live === "cost") {
    stageLive.innerHTML = line("Images logged", "146", "") + line("Spent", "30.25 USD", "");
    return;
  }
  const route = ex.live === "sigz" ? "/api/live/sigz/tracks"
    : ex.live === "tee" ? "/api/live/tee/teetimes"
      : "/api/live/bbc/state";
  const token = current;
  let html;
  try {
    const { data, source } = await readFeed(route);
    if (token !== current) return;
    if (ex.live === "sigz") {
      const s = deriveSigzTracks(data);
      html = line("Plays logged", s.totalPlays.toLocaleString("en-CA"), source) +
        line("Tracks", String(s.trackCount), source);
    } else if (ex.live === "tee") {
      const t = deriveTeeTimes(data);
      html = line(t.coversToday ? "Open slots today" : "Open slots for " + t.dataDate,
        String(t.openSlotsToday), t.coversToday ? source : "stale") +
        line("Courses with slots", String(t.coursesWithLiveSlots), source);
    } else {
      const b = deriveBBCState(data);
      html = line("Last match", b.scoreSummary, source);
    }
  } catch (e) {
    html = '<span class="stale">Feed unavailable, no number shown</span>';
  }
  if (token === current) stageLive.innerHTML = html;
}

/* ---------------- footer line ---------------- */

async function paintTail() {
  const out = document.querySelector("#tail-live");
  const bits = ['<span>Last deploy <b>2026-09-17</b></span>'];
  try {
    const { data, source } = await readFeed("/api/live/sigz/tracks");
    bits.push(line("SiGz plays logged", deriveSigzTracks(data).totalPlays.toLocaleString("en-CA"), source));
  } catch (e) { bits.push('<span class="stale">SiGz plays unavailable</span>'); }
  try {
    const { data, source } = await readFeed("/api/live/tee/teetimes");
    const t = deriveTeeTimes(data);
    bits.push(line(t.coversToday ? "Open tee slots now" : "Open tee slots for " + t.dataDate,
      String(t.openSlotsToday), t.coversToday ? source : "stale"));
  } catch (e) { bits.push('<span class="stale">Tee slots unavailable</span>'); }
  out.innerHTML = bits.join("");
}

select(0, true);
paintTail();
