from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import re,json
site=Path('site').resolve(); checked=[];errors=[];videos=0

def check(ref,base,source):
 if not ref or ref.startswith(('#','data:','mailto:','tel:','javascript:')) or urlsplit(ref).netloc: return
 if '${' in ref: return
 path=unquote(urlsplit(ref).path)
 target=(site/path.lstrip('/')) if path.startswith('/') else base/path
 target=target.resolve()
 if target.is_dir(): target=target/'index.html'
 checked.append({'source':source,'ref':ref,'target':str(target.relative_to(site)) if target.is_relative_to(site) else str(target)})
 if not target.is_relative_to(site) or not target.is_file():errors.append(checked[-1])
class Parser(HTMLParser):
 def handle_starttag(self,tag,attrs):
  global videos
  a=dict(attrs)
  if tag=='video':
   videos+=1
   if not a.get('poster'):errors.append({'source':self.source,'error':'video missing poster'})
  for k in ('src','href','poster'):
   if k in a:check(a[k],self.base,self.source)
for p in site.rglob('*.html'):
 parser=Parser();parser.source=str(p.relative_to(site));parser.base=p.parent;parser.feed(p.read_text())
for p in list((site/'js').glob('*.js'))+[site/'live.js']:
 s=p.read_text();source=str(p.relative_to(site))
 for ref in re.findall(r'''(?:from\s*|import\s*)['"]([^'"]+)['"]''',s):check(ref,p.parent,source)
 for ref in re.findall(r'''['"]((?:\.?\.?/)?(?:assets|data)/[^'"\s]+)['"]''',s):check(ref,site,source)
 for ref in re.findall(r'''(?:src|href|poster)\s*=\s*['"]([^'"]+)['"]''',s):check(ref,site,source)
 for obj in re.findall(r"\{\s*kind:\s*'video'.*?\}",s,re.S):
  videos+=1
  if not re.search(r"poster:\s*'[^']+'",obj):errors.append({'source':source,'error':'video media object missing poster'})
 for tag in re.findall(r'<video\b[^>]*>',s):
  if 'poster=' not in tag:errors.append({'source':source,'error':'video template missing poster'})
result={'checked_references':len(checked),'video_elements_and_media_objects':videos,'errors':errors,'references':checked}
Path('asset-results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='references'},indent=2))
raise SystemExit(bool(errors))
