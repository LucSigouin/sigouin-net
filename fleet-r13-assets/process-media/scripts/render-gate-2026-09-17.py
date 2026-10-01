#!/usr/bin/env python3
"""Render real VHS frames and encode H.264, including the VHS 0.12.0 workaround."""
import json
import os
from pathlib import Path
import shutil
import subprocess
from PIL import Image
LANE=Path(__file__).resolve().parents[1]
(LANE/'.runtime').mkdir(exist_ok=True)
raw=LANE/'.runtime/gate-frames'
if raw.exists(): shutil.rmtree(raw)
env=os.environ.copy()
env['TMPDIR']=str(LANE/'.runtime')
env['XDG_CACHE_HOME']=str(LANE/'.runtime/cache')
with (LANE/'evidence/vhs-render-2026-09-17.log').open('w') as log:
    result=subprocess.run(['vhs',str(LANE/'gate-red-green.tape')],cwd=LANE,env=env,stdout=log,stderr=subprocess.STDOUT)
    if result.returncode: raise SystemExit(result.returncode)
frames=sorted(raw.glob('frame-text-*.png'))
assert len(frames)>=180, f'Expected at least 6 seconds of VHS frames, got {len(frames)}'
filtergraph='[0:v][1:v]overlay=shortest=1,scale=1384:844:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2:color=0x282a36,format=yuv420p'
command=['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate','30','-start_number','1','-i',str(raw/'frame-text-%05d.png'),'-framerate','30','-start_number','1','-i',str(raw/'frame-cursor-%05d.png'),'-filter_complex',filtergraph,'-c:v','libx264','-preset','slow','-crf','20','-an','-movflags','+faststart',str(LANE/'gate-red-green.mp4')]
subprocess.run(command,check=True)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-sseof','-1','-i',str(LANE/'gate-red-green.mp4'),'-frames:v','1',str(LANE/'.runtime/gate-final-2026-09-17.png')],check=True)
with Image.open(LANE/'.runtime/gate-final-2026-09-17.png') as im:
    im.convert('RGB').save(LANE/'gate-red-green-poster-2026-09-17.webp',quality=94,method=6)
(LANE/'evidence/gate-render-2026-09-17.json').write_text(json.dumps({'vhs_version':'0.12.0','vhs_exit':result.returncode,'raw_frame_count':len(frames),'encoding_command':command,'workaround':'VHS 0.12.0 cancels its recording context before creating encoder subprocesses. Raw frames are kept by Output and encoded with ffmpeg after VHS exits.','source':'https://github.com/charmbracelet/vhs/blob/v0.12.0/evaluator.go'},indent=2)+'\n')
print('Rendered gate replay from',len(frames),'real VHS frames.')
