import pathlib,subprocess,json,hashlib,concurrent.futures
root=pathlib.Path(__file__).resolve().parents[2]; lane=pathlib.Path(__file__).resolve().parent
paths=['/','/hub/','/process/','/api/live/sigz/tracks','/api/live/sigz/albums','/api/live/sigz/health','/api/live/bbc/state','/api/live/tee/teetimes','/api/live/tee/courses','/api/live/not-allowed?url=https://example.com','/api/live/sigz/health?url=https://example.com','/assets/proc/kingdom-idle-current-state-2026-09-17.webp','/assets/still/05-ff-crest-cooking-the-lads.webp','/assets/still/06-ff-ref-james-cook.webp','/assets/still/07-ff-ref-ladd-mcconkey.webp','/.wrangler/cache/pages.json','/.wrangler/cache/cf.json','/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/metadata.sqlite','/nonexistent-review-path','/runescape/fixture/build_fixture.py','/runescape/fixture/raw-items.json']
def run(route):
 p=subprocess.run(['curl','-sS','--max-time','20','-D','-','https://sigouin.net'+route],capture_output=True)
 header,_,body=p.stdout.partition(b'\r\n\r\n');
 while body.startswith(b'HTTP/'):
  header,_,body=body.partition(b'\r\n\r\n')
 h=header.decode(errors='replace');local=root/'site'/route.lstrip('/');local=root/'site'/'index.html' if route=='/' else local/'index.html' if route.endswith('/') else local
 return dict(route=route,exit=p.returncode,headers=h,bytes=len(body),sha256=hashlib.sha256(body).hexdigest(),localMatch=local.is_file() and hashlib.sha256(local.read_bytes()).hexdigest()==hashlib.sha256(body).hexdigest(),jsonValid=bool(body[:1] in [b'{',b'[']),error=p.stderr.decode())
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: results=list(pool.map(run,paths))
(lane/'http.json').write_text(json.dumps(results,indent=2))
for r in results: print(r['route'],r['headers'].splitlines()[0] if r['headers'] else r['error'],r['bytes'],'localMatch',r['localMatch'])
