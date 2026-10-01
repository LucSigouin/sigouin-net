import pathlib,json,re
lane=pathlib.Path(__file__).resolve().parent;root=lane.parents[1]
report=(lane/'REPORT.md').read_text();result=json.loads((lane/'result.json').read_text())
assert 'pending final check' not in report
assert result['state']=='done' and result['model']['effective']=='gpt-6-astra'
assert len(re.findall(r'^\| F\d+ / P[012] \|',report,re.M))==15
for path,line in re.findall(r'`((?:site|Sigouin-Hub|deploy)/[^` :]+|README.md):(\d+)`',report):
 p=root/path;assert p.is_file(),path;assert int(line)<=len(p.read_text().splitlines()),(path,line)
for name in ['desktop','reduced','portrait','landscape','process','process-reduced','hub','hub-mobile','hub-links']:
 d=json.loads((lane/(name+'.json')).read_text());assert not d['errors'],(name,d['errors']);assert not [r for r in d['responses'] if r['status']>=400],name
journey=json.loads((lane/'journey.json').read_text());assert journey['returned'] and not journey['errors'];assert not journey['spaceOpened'] and journey['enterOpened']
rooms=json.loads((lane/'rooms.json').read_text());assert len(rooms['rooms'])==4 and sum(len(r['exhibits']) for r in rooms['rooms'])==12 and not rooms['errors']
dead=json.loads((lane/'dead-grep.json').read_text());assert len(dead)==17 and all(r['rgExit']==1 and not r['matches'] for r in dead);assert sum(r['bytes'] for r in dead)==3405600
http=json.loads((lane/'http.json').read_text());assert all(r['localMatch'] for r in http if r['route'] in ['/','/hub/','/process/'])
links=json.loads((lane/'html-links.json').read_text());assert len(links)==29 and all('200' in r['status'][-1] for r in links)
assert not json.loads((lane/'reduced.json').read_text())['state']['visibleControls']
assert sum(not v['paused'] for v in json.loads((lane/'process-reduced.json').read_text())['state']['videos'])==3
print('PASS: report locations, 15 findings, result schema/model, route/error evidence, all rooms/cards, keyboard repro, 17 orphan proofs and 29 links')
