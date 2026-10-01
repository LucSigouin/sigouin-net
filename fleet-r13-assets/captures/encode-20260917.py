import datetime
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parent
RUNTIME = ROOT / '.runtime'
(RUNTIME / 'original-video').mkdir(parents=True, exist_ok=True)
(RUNTIME / 'posters').mkdir(parents=True, exist_ok=True)

def run(args):
    process = subprocess.run(args, capture_output=True, text=True)
    if process.returncode:
        raise RuntimeError(f'{args[0]} failed: {process.stderr[-3000:]}')
    return process.stdout

def probe(path):
    return json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]))

images = []
for png in sorted(ROOT.glob('*.png')):
    webp = png.with_suffix('.webp')
    if not webp.exists() or png.stat().st_mtime > webp.stat().st_mtime:
        run(['cwebp', '-quiet', '-q', '88', '-m', '6', '-metadata', 'none', str(png), '-o', str(webp)])
    if webp.stat().st_size >= 1500000 or png.stat().st_size >= 1500000:
        raise RuntimeError(f'Image exceeds strict 1.5 MB limit: {png.name}')
    images.append({'png': png.name, 'webp': webp.name, 'png_bytes': png.stat().st_size, 'webp_bytes': webp.stat().st_size})
    print('image', png.name, webp.stat().st_size, flush=True)

videos = []
previous_report = ROOT / 'encoding-20260917.json'
previous_videos = json.loads(previous_report.read_text()).get('videos', []) if previous_report.exists() else []
sources = {p.name: p for p in (RUNTIME / 'original-video').glob('*.webm')}
sources.update({p.name: p for p in ROOT.glob('*.webm')})
for source in sorted(sources.values()):
    original = RUNTIME / 'original-video' / source.name
    if source != original:
        shutil.move(str(source), str(original))
    raw_info = probe(original)
    raw_duration = float(raw_info['format']['duration'])
    offset = max(0, raw_duration - 7.0)
    mp4 = ROOT / original.with_suffix('.mp4').name
    if not mp4.exists() or original.stat().st_mtime > mp4.stat().st_mtime:
        run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', f'{offset:.6f}',
             '-i', str(original), '-t', '7', '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2',
             '-r', '25', '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
             '-maxrate', '2500k', '-bufsize', '2500k', '-pix_fmt', 'yuv420p',
             '-an', '-movflags', '+faststart', str(mp4)])
    poster_png = RUNTIME / 'posters' / (mp4.stem + '-poster.png')
    poster = ROOT / (mp4.stem + '-poster.webp')
    run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', '1', '-i', str(mp4),
         '-frames:v', '1', '-update', '1', str(poster_png)])
    run(['cwebp', '-quiet', '-q', '88', '-m', '6', '-metadata', 'none', str(poster_png), '-o', str(poster)])
    info = probe(mp4)
    streams = info['streams']
    video = next(s for s in streams if s['codec_type'] == 'video')
    seconds = float(info['format']['duration'])
    assert video['codec_name'] == 'h264'
    assert not any(s['codec_type'] == 'audio' for s in streams)
    assert 6 <= seconds <= 8
    assert video['height'] <= 720
    assert mp4.stat().st_size < 3000000
    assert poster.stat().st_size < 1500000
    videos.append({'video': mp4.name, 'poster': poster.name, 'source_recording': original.name,
                   'source_duration_seconds': raw_duration, 'trim_start_seconds': offset,
                   'duration_seconds': seconds, 'codec': video['codec_name'],
                   'width': video['width'], 'height': video['height'], 'audio_streams': 0,
                   'bytes': mp4.stat().st_size, 'poster_second': 1})
    print('video', mp4.name, seconds, mp4.stat().st_size, flush=True)

updated_names = {v['video'] for v in videos}
videos += [v for v in previous_videos if v['video'] not in updated_names and (ROOT / v['video']).is_file()]
report = {'encoded_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'webp_encoder': 'Existing /opt/homebrew/bin/cwebp, quality 88, method 6. Installed ffmpeg has no WebP encoder; sips lists WebP as read-only.',
          'video_encoder': 'Existing ffmpeg, libx264, CRF 23, no audio, faststart',
          'images': images, 'videos': videos}
(ROOT / 'encoding-20260917.json').write_text(json.dumps(report, indent=2) + '\n')
