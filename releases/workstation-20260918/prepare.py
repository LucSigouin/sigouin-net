from pathlib import Path
import shutil,re,hashlib,base64,json
r=Path(__file__).resolve().parent;p=r.parents[1];source=p.parent/'vybe-workstation/site';stage=r/'site';backup=r/'before-site'
live=(r/'before-live.html').read_bytes();assert live==(backup/'index.html').read_bytes(),'Local rollback differs from live homepage'
(r/'before-live.json').write_text(json.dumps({'sha256':hashlib.sha256(live).hexdigest(),'local_matches':True},indent=2))
v=stage/'vybe';v.mkdir(exist_ok=True)
for name in ['app.js','workspace.js','signal.js','cables.js','signal.css','ASSET_CREDITS.md']:
 s=(source/'realism'/name).read_text()
 if name.endswith('.js'):s=s.replace("'./assets/","'/vybe/assets/").replace("'assets/","'/vybe/assets/").replace("'../vendor/","'./vendor/")
 (v/name).write_text(s)
shutil.copytree(source/'realism/assets',v/'assets',dirs_exist_ok=True);shutil.copytree(source/'vendor',v/'vendor',dirs_exist_ok=True);shutil.copytree(source/'realism/vendor',v/'vendor',dirs_exist_ok=True)
shutil.copy2(source/'assets/Inter-OFL.txt',v/'assets/Inter-OFL.txt');shutil.copy2(source/'assets/inter-400.ttf',v/'assets/inter-400.ttf');shutil.copy2(source/'style.css',v/'style.css')
html=(source/'realism/index.html').read_text().replace('Vybe — realism preview','Vybe — Luc Sigouin').replace('../assets/','/vybe/assets/').replace('../vendor/','/vybe/vendor/').replace('../style.css','/vybe/style.css').replace('href="assets/','href="/vybe/assets/').replace('src="assets/','src="/vybe/assets/').replace('href="signal.css"','href="/vybe/signal.css"').replace('src="app.js"','src="/vybe/app.js"')
html=html.replace('The desk and monitor stay fixed.','Brush over the rack cables to make them wiggle; their connectors stay fixed. The desk and monitor stay fixed.')
(stage/'index.html').write_text(html)
importmap=re.search(r'<script type="importmap">(.*?)</script>',html).group(1);digest=base64.b64encode(hashlib.sha256(importmap.encode()).digest()).decode()
h=(backup/'_headers').read_text().replace("script-src 'self'",f"script-src 'self' 'sha256-{digest}'").replace('font-src https:',"font-src 'self' https:")
h+='\n/vybe/*\n  Cache-Control: public, max-age=0, must-revalidate\n';(stage/'_headers').write_text(h)
(r/'manifest.json').write_text(json.dumps({'source':str(source/'realism'),'previous_site':str(backup),'retained_routes':['/process/','/api/live/*'],'production':'https://sigouin.net','new_files':sorted(str(f.relative_to(stage)) for f in v.rglob('*') if f.is_file()),'importmap_sha256':digest},indent=2))
print('Staged homepage and preserved live rollback bytes.')
