import argparse
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--state', choices=['pending', 'blocked', 'done'], default='pending')
parser.add_argument('--verify-exit', type=int)
args = parser.parse_args()

def read(name, default):
    path = ROOT / name
    return json.loads(path.read_text()) if path.exists() else default

source_map = {}
poster_map = {}
stills = read('capture-stills-20260917.json', []) + read('capture-game-20260917.json', [])
for item in stills:
    viewport = item['viewport']
    base = f"{item['url']} | viewport={viewport['width']}x{viewport['height']} CSS px; deviceScaleFactor=1"
    for shot in item.get('shots', []):
        actual = shot['actual']
        source = (f"{base}; scroll={shot['requestedPercent']}% of {shot['selector']} "
                  f"(y={actual['y']}px / max={actual['max']}px); captured={shot['captured']}")
        if shot.get('state'):
            source += '; game state=' + shot['state']
        if shot.get('elapsed_seconds') is not None:
            source += f"; seconds after Start click={shot['elapsed_seconds']}"
        source_map[shot['filename']] = source + '; real viewport PNG'
        source_map[Path(shot['filename']).with_suffix('.webp').name] = source + '; cwebp quality 88 from PNG'

videos = read('capture-videos-20260917.json', []) + read('capture-game-videos-20260917.json', [])
encoded = read('encoding-20260917.json', {})
for item in videos:
    if not item.get('video'):
        continue
    name = Path(item['video']['filename']).with_suffix('.mp4').name
    viewport = item['viewport']
    source = (f"{item['url']} | viewport={viewport['width']}x{viewport['height']} CSS px; "
              f"motion={json.dumps(item['motion'], sort_keys=True)}; Playwright recordVideo WebM source; "
              'last 7 seconds encoded to muted H.264 MP4')
    source_map[name] = source
    poster = Path(name).stem + '-poster.webp'
    source_map[poster] = source + '; poster at second 1.000 of delivered MP4'
    poster_map[name] = str(ROOT / poster)

images = sorted(f for f in ROOT.iterdir() if f.suffix.lower() in ('.png', '.webp'))
clips = sorted(ROOT.glob('*.mp4'))
parts = ['<!doctype html><html lang="en"><meta charset="utf-8">',
         '<meta name="viewport" content="width=device-width, initial-scale=1">',
         '<title>CAPTURES 2026-09-17</title><body><h1>CAPTURES 2026-09-17</h1>',
         '<p>Real public site captures. Click any image for its full viewport size. PNG originals and WebP twins are both shown.</p>',
         '<p><a href="manifest.json">Manifest</a> | <a href="REPORT.md">Report</a> | <a href="cors-probe.json">CORS probes</a></p>',
         '<div style="display:flex;flex-wrap:wrap;align-items:start;gap:12px">']
for image in images:
    name = html.escape(image.name)
    detail = html.escape(source_map.get(image.name, 'See manifest'))
    parts.append(f'<figure style="margin:0;width:310px"><a href="{name}"><img src="{name}" width="300" alt="{name}" loading="lazy"></a><figcaption><a href="{name}">{name}</a><br>{image.stat().st_size:,} bytes<details><summary>Source</summary>{detail}</details></figcaption></figure>')
parts.append('</div><h2>Muted clips</h2>')
for clip in clips:
    name = html.escape(clip.name)
    poster = html.escape(clip.stem + '-poster.webp')
    parts.append(f'<p>{name}</p><video width="576" controls muted loop playsinline preload="metadata" poster="{poster}"><source src="{name}" type="video/mp4"></video>')
parts.append('</body></html>')
(ROOT / 'captures-index.html').write_text('\n'.join(parts) + '\n')

has_game = any(i['site'] == 'undergrowth' and i.get('shots') for i in stills)
unverified = [
    'Live data and page content can change after the capture timestamps.',
    'Phone captures use headless Edge emulation, not physical iOS or Android hardware.',
    'CORS probes measure GET response headers only, not credentialed requests or preflight.',
]
if not has_game:
    unverified.insert(0, 'Undergrowth screenshots and video are blocked by the missing window.__garden readiness hook. A clarification is pending.')
else:
    unverified.append('Undergrowth production has no window.__garden development hook. The user approved visible canvas and gameplay controls as the readiness condition; all game captures use that approved fallback.')
all_paths = sorted({str(f) for f in ROOT.iterdir() if f.is_file()} | {str(ROOT / 'manifest.json'), str(ROOT / 'result.json')})
result = {'state': args.state, 'taskId': None,
          'model': {'requested': 'gpt-6-astra', 'effective': 'gpt-6-astra', 'source': 'spawn flag'},
          'deliverable': str(ROOT / 'manifest.json'), 'files': all_paths,
          'verify': {'cmd': f'python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/check-assets.py {ROOT}', 'exit': args.verify_exit},
          'unverified': unverified}
(ROOT / 'result.json').write_text(json.dumps(result, indent=2) + '\n')

probes = read('cors-probe.json', {}).get('probes', [])
metadata_sources = {
    'cors-probe.json': '; '.join(p['url'] for p in probes) + ' | curl GET; Origin=https://sigouin.net; viewport=N/A; scroll=N/A',
    'garden-readiness-20260917.json': 'https://undergrowth.pages.dev/ | viewport=1440x900; scroll=0%; initial public DOM and JavaScript readiness inspection, plus the user-approved visible-readiness resolution',
    'captures-index.html': 'Local contact sheet of every delivered PNG, WebP, and MP4 in this lane; original URL, viewport, and scroll in each image Source detail',
}
files = []
for name in all_paths:
    path = Path(name)
    kind = 'image' if path.suffix in ('.png', '.webp') else 'video' if path.suffix == '.mp4' else 'html' if path.suffix == '.html' else 'code' if path.suffix in ('.mjs', '.py') else 'data'
    source = source_map.get(path.name) or metadata_sources.get(path.name)
    if not source:
        source = f'CAPTURES round 13 capture workflow and evidence; viewport=N/A; scroll=N/A; inputs={ROOT.parent / "COMMON.md"} and {ROOT.parent / "RUBRIC.md"}'
    files.append({'path': str(path), 'kind': kind, 'poster': poster_map.get(path.name), 'source': source, 'bytes': path.stat().st_size if path.exists() else 0})
manifest = {'lane': 'captures', 'files': files}
manifest_path = ROOT / 'manifest.json'
for attempt in range(10):
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    changed = False
    for item in files:
        size = Path(item['path']).stat().st_size
        if item['bytes'] != size:
            item['bytes'] = size
            changed = True
    if not changed:
        break
else:
    raise RuntimeError('Manifest sizes did not stabilize')
print(json.dumps({'state': args.state, 'files': len(files), 'images': len(images), 'videos': len(clips), 'game_present': has_game}))
