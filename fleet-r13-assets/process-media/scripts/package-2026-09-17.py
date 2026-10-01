#!/usr/bin/env python3
"""Write the manifest from actual assets and recorded source mappings."""
import datetime as dt
import hashlib
import json
from pathlib import Path
LANE=Path(__file__).resolve().parents[1]
OUT=LANE/'2026-09-17'
ROUND=LANE.parent.parent/'fleet-r12-portfolio-discovery'
files=[]
used={}
def add(path,kind,source,poster=None,**extra):
    p=Path(path)
    if p in used:return
    r={'path':str(p),'kind':kind,'poster':str(poster) if poster else None,'source':source,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),**extra}
    files.append(r);used[p]=r

captures=[]
for filename in ['captures-2026-09-17.json','captures-extra-2026-09-17.json']:
    captures+=json.loads((LANE/'evidence'/filename).read_text())
for r in captures:
    if r.get('path'):
        add(r['path'],'image',r['source'],capture={'at':r['captured_at'],'viewport':r['viewport'],'full_page':False})
    if r.get('fullPath'):
        add(r['fullPath'],'image',r['source'],capture={'at':r['captured_at'],'viewport':r['viewport'],'full_page':True},transform='Full scroll area retained and resized proportionally to 1440 pixels wide where source content overflows; indexed PNG palette to meet the image cap.')

derivations=json.loads((LANE/'evidence/derivations-2026-09-17.json').read_text())
for r in derivations:
    source=r['source']
    if isinstance(source,list):
        source=[used.get(Path(p),{}).get('source',p) for p in source]
        source='; '.join(source)
    add(r['path'],'image',source,transform={k:v for k,v in r.items() if k not in ('path','source')})

shots=Path('/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/lab/shots')
source_frames=[shots/f'{i:02d}.png' for i in range(49)]
poster=OUT/'scrollcraft-filmstrip-poster-2026-09-17.webp'
add(poster,'image',str(source_frames[0]),transform='Resized to 1280 by 800, WebP conversion.')
add(OUT/'scrollcraft-filmstrip-2026-09-17.mp4','video','; '.join(str(p) for p in source_frames),poster=poster,transform='49 ordered frames at 7 source frames per second, 30 fps H.264, 1280 by 800, no audio.')
gate_sources='; '.join(str(p) for p in [ROUND/'GATE-TESTED.txt',ROUND/'check-lane.py',ROUND/'tooling/REPORT.md',ROUND/'tooling/result.json',ROUND/'tooling/TOOLING.md'])
gate_poster=LANE/'gate-red-green-poster-2026-09-17.webp'
add(gate_poster,'image',str(LANE/'gate-red-green.mp4'),transform='Frame from one second before the end of the real gate replay.')
add(LANE/'gate-red-green.mp4','video',gate_sources,poster=gate_poster,transform='Actual terminal run recorded by VHS; text and cursor frames encoded by FFmpeg due to the installed VHS 0.12.0 encoder context bug.')
add(LANE/'gate-red-green.tape','code',gate_sources+'; https://github.com/charmbracelet/vhs')
add(LANE/'gate-red-green.txt','data',gate_sources)
costs=json.loads((LANE/'costs-timeline.json').read_text())
add(LANE/'costs-timeline.json','data','; '.join(r['path'] for r in costs['sources']))

code_sources={
 'capture-2026-09-17.mjs':'/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/lab/herocheck.mjs',
 'compose-2026-09-17.py':str(LANE/'evidence/derivations-2026-09-17.json'),
 'costs-timeline-2026-09-17.py':'; '.join(r['path'] for r in costs['sources']),
 'gate-replay-2026-09-17.py':gate_sources,
 'render-gate-2026-09-17.py':'https://github.com/charmbracelet/vhs/blob/v0.12.0/evaluator.go; '+str(LANE/'gate-red-green.tape'),
 'package-2026-09-17.py':str(LANE.parent/'COMMON.md'),
 'verify-process-media-2026-09-17.py':str(LANE.parent/'RUBRIC.md')
}
for name,source in code_sources.items():add(LANE/'scripts'/name,'code',source)
for name,source in [
 ('captures-2026-09-17.json','; '.join(r['source'] for r in captures[:14])),
 ('captures-extra-2026-09-17.json','; '.join(r['source'] for r in captures[14:])),
 ('derivations-2026-09-17.json',str(LANE/'scripts/compose-2026-09-17.py')),
 ('gate-cases-2026-09-17.json',gate_sources),
 ('gate-render-2026-09-17.json',str(LANE/'scripts/render-gate-2026-09-17.py')),
 ('kingdom-idle-availability-2026-09-17.json','/Users/ls/Claude-Workspace/personal/archive/README.md; /Users/ls/Claude-Workspace/personal/archive/kimi-projects/TEST_NOTES.md'),
 ('source-image-inventory-2026-09-17.json','/Users/ls/Claude-Workspace/personal/archive/kimi-projects; '+str(shots))
]:add(LANE/'evidence'/name,'data',source)

manifest={'lane':'process-media','created_at':dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z'),'files':sorted(files,key=lambda r:r['path'])}
(LANE/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Manifest:',len(files),'files;',sum(f['kind']=='image' for f in files),'images;',sum(f['kind']=='video' for f in files),'videos')
