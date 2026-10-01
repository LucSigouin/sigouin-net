#!/usr/bin/env python3
"""Derive the requested stills from existing captures with no generated content."""
import json
from pathlib import Path
from PIL import Image, ImageOps
LANE = Path(__file__).resolve().parents[1]
OUT = LANE / '2026-09-17'
ARCHIVE = Path('/Users/ls/Claude-Workspace/personal/archive/sigouin-net-fleet-2026-09-02')
steps = []
# Full-page captures may include horizontal overflow beyond the viewport.
# Keep all captured columns and scale proportionally to the requested 1440 width.
for p in sorted(OUT.glob('*-full.png')):
    with Image.open(p) as original:
        im=original.convert('RGB')
        if im.width != 1440:
            im=im.resize((1440,round(im.height*1440/im.width)),Image.Resampling.LANCZOS)
        if p.stat().st_size < 1500000 and original.width == 1440:
            continue
        for colors in [128,64,32,16,12,8,4]:
            im.quantize(colors=colors,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).save(p,optimize=True)
            if p.stat().st_size < 1500000: break
        print('Full page:',p.name,im.size,p.stat().st_size,colors,flush=True)
def export(source, name, size=None, crop=None):
    with Image.open(source) as original:
        im = original.convert('RGB')
        if crop:
            im = im.crop(crop)
        if size:
            im = im.resize(size, Image.Resampling.LANCZOS)
        dest = OUT / name
        im.save(dest, optimize=True)
        quantization = None
        if dest.stat().st_size >= 1500000:
            for colors in [256, 192, 128, 96]:
                im.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(dest, optimize=True)
                quantization = colors
                if dest.stat().st_size < 1500000:
                    break
        steps.append({'path': str(dest), 'source': str(source), 'source_dimensions': list(original.size), 'crop': crop, 'dimensions': list(im.size), 'palette_colors': quantization})
        print(name,im.size,dest.stat().st_size,flush=True)
        return dest

r1 = export(ARCHIVE/'fleet-r1-site/lane-c/shots/home-1440.png', 'sigouin-r1-lane-c-2026-09-17.png', (1440,1215))
r2 = export(ARCHIVE/'fleet-r2-polish/worker/shots/home-1440.png', 'sigouin-r2-polish-2026-09-17.png', (1440,850), (50,42,1202,722))
a = export(ARCHIVE/'scrollcraft-builds/sigouin-layered-a/lab/shots/00.png', 'sigouin-layered-a-2026-09-17.png', (1440,900))
b = export(ARCHIVE/'scrollcraft-builds/sigouin-layered-b/lab/shots/00.png', 'sigouin-layered-b-2026-09-17.png', (1440,900))

names = ['claude','codex','grok','kimi-a','kimi-b','kimi-c','kimi-d','kimi-e','live-winner']
grid = Image.new('RGB',(4320,2700))
for i,name in enumerate(names):
    with Image.open(OUT/f'landing-{name}.png') as im:
        grid.paste(im,(i%3*1440,i//3*900))
dest = OUT/'landing-nine-up-2026-09-17.webp'
grid.save(dest,quality=94,method=6)
steps.append({'path': str(dest), 'source': [str(OUT/f'landing-{n}.png') for n in names], 'dimensions': list(grid.size), 'order': names, 'transform': '3 by 3, no crop, no labels'})

five=[r1,r2,a,b,OUT/'sigouin-live-2026-09-17.png']
seven=[OUT/'sigouin-r1-lane-a-2026-09-17.png',OUT/'sigouin-r1-lane-b-2026-09-17.png',*five]
for name,files in [('sigouin-five-looks-2026-09-17.webp',five),('sigouin-all-seven-2026-09-17.webp',seven)]:
    strip=Image.new('RGB',(1440*len(files),900),'#111113')
    for i,p in enumerate(files):
        with Image.open(p) as original:
            im=ImageOps.contain(original.convert('RGB'),(1440,900),method=Image.Resampling.LANCZOS)
            strip.paste(im,(i*1440+(1440-im.width)//2,(900-im.height)//2))
    dest=OUT/name
    strip.save(dest,quality=92,method=6)
    steps.append({'path':str(dest),'source':[str(p) for p in files],'dimensions':list(strip.size),'transform':'Horizontal, contained without distortion, no labels'})
    print(name,strip.size,dest.stat().st_size,flush=True)

source=Path('/Users/ls/Claude-Workspace/personal/archive/kimi-projects/current-state.png')
with Image.open(source) as im:
    dest=OUT/'kingdom-idle-current-state-2026-09-17.webp'
    im.convert('RGB').save(dest,quality=94,method=6)
    steps.append({'path':str(dest),'source':str(source),'dimensions':list(im.size),'transform':'Format conversion, no crop or content change'})
(LANE/'evidence/derivations-2026-09-17.json').write_text(json.dumps(steps,indent=2)+'\n')
