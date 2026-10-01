#!/usr/bin/env python3
"""Check real bytes, image geometry, decode, gate outcomes, and cost reconciliation."""
import collections
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import subprocess
from PIL import Image
LANE=Path(__file__).resolve().parents[1]
manifest=json.loads((LANE/'manifest.json').read_text())
assert manifest['lane']=='process-media'
images=[];videos=[]
for row in manifest['files']:
    p=Path(row['path']);p.resolve().relative_to(LANE)
    assert row['bytes']==p.stat().st_size,(p,'bytes mismatch')
    assert row['sha256']==hashlib.sha256(p.read_bytes()).hexdigest(),(p,'hash mismatch')
    assert row['source']
    if row['kind']=='image':
        assert p.stat().st_size<int(1.5*1024*1024),(p,'image cap')
        with Image.open(p) as im:
            im.load();assert im.format in ('PNG','WEBP');images.append({'path':str(p),'width':im.width,'height':im.height,'bytes':p.stat().st_size})
            if p.name.startswith('landing-') and p.suffix=='.png':assert im.size==(1440,900)
            if p.name.startswith(('board-','how-the-fleet-works-')):
                assert im.width==1440
                if '-full' not in p.name:assert im.size==(1440,900)
    if row['kind']=='video':
        assert p.stat().st_size<3000000
        poster=Path(row['poster']);poster.resolve().relative_to(LANE);assert poster.suffix=='.webp' and poster.is_file()
        info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
        assert len(info['streams'])==1
        stream=info['streams'][0];assert stream['codec_type']=='video' and stream['codec_name']=='h264'
        duration=Decimal(info['format']['duration']);assert Decimal(6)<=duration<=Decimal(10)
        if 'scrollcraft' in p.name:assert duration<=8 and stream['nb_frames']=='210'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(p),'-f','null','-'],check=True)
        videos.append({'path':str(p),'duration':float(duration),'codec':stream['codec_name'],'width':stream['width'],'height':stream['height'],'audio_streams':0,'frames':stream['nb_frames'],'bytes':p.stat().st_size})
assert len(images)>=6 and len(videos)==2
names={Path(x['path']).name for x in images}
for lane in ['claude','codex','grok','kimi-a','kimi-b','kimi-c','kimi-d','kimi-e','live-winner']:assert f'landing-{lane}.png' in names
for name in ['landing-nine-up-2026-09-17.webp','sigouin-five-looks-2026-09-17.webp','sigouin-all-seven-2026-09-17.webp']:assert name in names
cases=json.loads((LANE/'evidence/gate-cases-2026-09-17.json').read_text());assert [x['exit'] for x in cases]==[1,1,0]
assert 'REPORT.md missing' in cases[0]['output'] and 'em dash' in cases[1]['output'] and cases[2]['output'].startswith('PASS: tooling ')
assert cases[2]['command'][-1]=='/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/tooling'
for case in cases:assert case['command'][1].endswith('/fleet-r12-portfolio-discovery/check-lane.py')
costs=json.loads((LANE/'costs-timeline.json').read_text());rows=costs['entries']
assert not costs['scan_errors']
assert [r['ts'] for r in rows]==sorted(r['ts'] for r in rows)
assert len(rows)==sum(s['nonempty_lines'] for s in costs['sources'])
assert len(rows)==len({(r['source'],r['source_line']) for r in rows})
assert len(rows)==costs['totals']['all']['entries']
for unit in ['usd','credits']:
    recorded=sum((Decimal(str(r['usd_or_credits'][unit])) for r in rows if r['usd_or_credits'][unit] is not None),Decimal(0))
    assert recorded==Decimal(str(costs['totals']['all'][unit]))
    assert recorded==sum((Decimal(str(t[unit])) for t in costs['totals']['by_provider'].values()),Decimal(0))
    assert recorded==sum((Decimal(str(t[unit])) for t in costs['totals']['by_model'].values()),Decimal(0))
report={'status':'PASS','manifest_files':len(manifest['files']),'images':images,'videos':videos,'gate_exits':[1,1,0],'cost_sources':len(costs['sources']),'cost_entries':len(rows),'cost_totals':costs['totals'],'known_gap':'Six Kingdom Idle gameplay screenshots cannot be made from the specified archive. Its screenshots folder was deleted, leaving one clean gameplay capture.'}
(LANE/'evidence/verification-2026-09-17.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'status':'PASS','files':len(manifest['files']),'images':len(images),'videos':len(videos),'cost_sources':len(costs['sources']),'cost_entries':len(rows),'gate_exits':[1,1,0]}))
