from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess,json,hashlib
r=Path(__file__).resolve().parent;manifest=json.loads((r/'manifest.json').read_text());names=['index.html','process/index.html']+manifest['new_files']
def check(name):
 route='/' if name=='index.html' else '/process/' if name=='process/index.html' else '/'+name
 p=subprocess.run(['curl','-fsSL','--connect-timeout','10','--max-time','30','https://sigouin.net'+route],capture_output=True)
 digest=hashlib.sha256(p.stdout).hexdigest();expected=hashlib.sha256((r/'site'/name).read_bytes()).hexdigest()
 return {'path':route,'passed':p.returncode==0 and digest==expected,'sha256':digest}
with ThreadPoolExecutor(max_workers=4) as pool:records=list(pool.map(check,names))
apis=[]
for route in ['/api/live/sigz/tracks','/api/live/bbc/state']:
 p=subprocess.run(['curl','-fsSL','--max-time','20','https://sigouin.net'+route],capture_output=True)
 try:d=json.loads(p.stdout);passed=p.returncode==0 and isinstance(d,dict)
 except ValueError:passed=False
 apis.append({'path':route,'passed':passed})
passed=all(x['passed'] for x in records+apis);(r/'live-assets.json').write_text(json.dumps({'passed':passed,'assets':records,'apis':apis},indent=2));print('Asset hashes:',sum(x['passed'] for x in records),'/',len(records),'API JSON:',apis);raise SystemExit(0 if passed else 1)
