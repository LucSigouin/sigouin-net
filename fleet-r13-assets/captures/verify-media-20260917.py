import datetime
import json
from pathlib import Path
import struct
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
errors = []
missing = []
checked_images = []
checked_videos = []

def read(name, default):
    p = ROOT / name
    return json.loads(p.read_text()) if p.exists() else default

def probe(path):
    result = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr)
    return json.loads(result.stdout)

stills = read('capture-stills-20260917.json', []) + read('capture-game-20260917.json', [])
for record in stills:
    viewport = record['viewport']
    for shot in record.get('shots', []):
        png = ROOT / shot['filename']
        expected = (viewport['width'], viewport['height'])
        with png.open('rb') as handle:
            header = handle.read(24)
        dimensions = struct.unpack('>II', header[16:24])
        if header[:8] != b'\x89PNG\r\n\x1a\n' or dimensions != expected:
            errors.append(f'Wrong PNG dimensions: {png.name}, {dimensions}, expected {expected}')
        webp = png.with_suffix('.webp')
        info = probe(webp)['streams'][0]
        if (info['width'], info['height']) != expected:
            errors.append('Wrong WebP dimensions: ' + webp.name)
        for image in (png, webp):
            if image.stat().st_size >= 1500000:
                errors.append('Image exceeds 1.5 MB: ' + image.name)
        actual = shot['actual']
        if abs(actual['y'] - actual['max'] * shot['requestedPercent'] / 100) > 2:
            errors.append('Wrong scroll position: ' + png.name)
        checked_images.append({'png': png.name, 'webp': webp.name, 'width': dimensions[0], 'height': dimensions[1], 'scroll_percent': shot['requestedPercent']})

for clip in sorted(ROOT.glob('*.mp4')):
    info = probe(clip)
    streams = info['streams']
    video = next(s for s in streams if s['codec_type'] == 'video')
    duration = float(info['format']['duration'])
    poster = ROOT / (clip.stem + '-poster.webp')
    if video['codec_name'] != 'h264' or not 6 <= duration <= 8 or video['height'] > 720:
        errors.append('Wrong video format: ' + clip.name)
    if any(s['codec_type'] == 'audio' for s in streams):
        errors.append('Audio stream found: ' + clip.name)
    if clip.stat().st_size >= 3000000 or not poster.exists():
        errors.append('Video size or poster failed: ' + clip.name)
    checked_videos.append({'filename': clip.name, 'duration_seconds': duration, 'codec': video['codec_name'], 'width': video['width'], 'height': video['height'], 'audio_streams': 0, 'bytes': clip.stat().st_size})

sites = {record['site'] for record in stills if record.get('shots')}
required = {'sigz', 'sigz-music', 'teetimes', 'undergrowth', 'sigouin', 'livetvcan', 'bbc'}
for site in sorted(required - sites):
    missing.append('No desktop or phone captures for ' + site)
for site in sorted(sites):
    records = [r for r in stills if r['site'] == site]
    if {r['viewport']['width'] for r in records if r.get('shots')} != {390, 1440}:
        missing.append('Missing viewport for ' + site)
    for record in records:
        if record.get('scrolling', {}).get('max', 0) > 4 and not {0, 50, 100} <= {s['requestedPercent'] for s in record.get('shots', [])}:
            missing.append('Missing scroll position for ' + site)
if len(checked_videos) < 4:
    missing.append(f'Only {len(checked_videos)} of the four requested clips are present')
probes = read('cors-probe.json', {}).get('probes', [])
if len(probes) != 4 or any(p.get('curl_exit') != 0 for p in probes):
    errors.append('CORS probes missing or curl failed')
browser = read('browser-qa-20260917.json', {})
if not browser.get('allImagesDecoded') or not browser.get('allClipsPlayed'):
    errors.append('Browser decoding or playback verification missing')
report = {'verified': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'present_media_pass': not errors, 'all_requested_deliverables_present': not missing,
          'images': checked_images, 'videos': checked_videos, 'errors': errors, 'missing': missing}
(ROOT / 'media-verification-20260917.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'present_media_pass': not errors, 'capture_pairs': len(checked_images), 'videos': len(checked_videos), 'errors': errors, 'missing': missing}, indent=2))
sys.exit(1 if errors or missing else 0)
