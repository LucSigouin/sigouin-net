"""Reproduce the small live-wiki development fixture. Run from project root."""
import json, re, urllib.request, urllib.parse, pathlib, concurrent.futures
BASE=pathlib.Path('site/lane-a/fixture'); UA='DragonwildsGuideBot/0.1 (https://sigouin.net; luc@sigouin.net)'
def get(url):
 return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=45).read()
def bucket(table,fields):
 q=f"bucket('{table}').select({fields}).limit(5000).run()"
 return json.loads(get('https://dragonwilds.runescape.wiki/api.php?'+urllib.parse.urlencode({'action':'bucket','format':'json','query':q})))['bucket']
def save(p,d):
 p=BASE/p;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2))
def slug(n):return re.sub('[^a-z0-9]+','_',n.lower()).strip('_')
def wiki(n):return 'https://dragonwilds.runescape.wiki/w/'+urllib.parse.quote(n.replace(' ','_'))
raw=json.loads((BASE/'raw-items.json').read_text())['bucket']; rr=json.loads((BASE/'raw-recipes.json').read_text())['bucket']
extra={'Bronze Bar','Bronze Pickaxe','Bronze Axe','Copper Ore','Tin Ore','Stone','Ash Logs'}
raw += [r for r in bucket('infobox_item',"'page_name','item_name','item_type','item_description','json'") if r['page_name'] in extra]
rr += [r for r in bucket('recipe',"'page_name','output','uses_material','uses_facility','uses_skill','json'") if r['page_name'] in extra]
items={}; recipes=[]; icons={}
def cat(n,t):
 if n.endswith(' Ore'):return 'ore'
 if n.endswith(' Bar'):return 'bar'
 if 'Potion' in n or 'Infusion' in n:return 'potion'
 if n.endswith(('Logs','Plank')):return 'wood'
 if n in ['Flax','Marrentil','Harralander','Cabbage']:return 'plant'
 if any(s in n for s in ['Pickaxe',' Axe']):return 'tool'
 return {'Food':'food','Drink':'food','Tool':'tool','Basic Material':'material','Processed Material':'material','Resource':'material','Raw Ingredient':'food','Consumable':'consumable','Magic Weapon':'weapon'}.get(t,'other')
def ensure(n,im=None):
 id=slug(n)
 if id not in items:items[id]={'id':id,'name':n,'type':'','category':cat(n,''),'description':'','icon':None,'wiki':wiki(n),'recipes':[],'usedIn':[],'sources':{'mapLayers':[],'drops':[],'regions':[],'notes':''}}
 if im:
  f=im.replace(' ','_');items[id]['icon']='img/'+f;icons[f]='https://dragonwilds.runescape.wiki/images/'+urllib.parse.quote(f)
 return items[id]
for row in raw:
 d=json.loads(row['json']); n=row['page_name'];i=ensure(n,d.get('image_raw'));i.update(type=row.get('item_type',''),description=row.get('item_description',''),category=cat(n,row.get('item_type','')))
 for k in ['health','sustenance','hydration','weight','stacklimit','power']:i[k]=d.get(k)
for j,row in enumerate(rr):
 d=json.loads(row['json']);o=d['output']; out=ensure(o.get('item') or row['page_name']);rid=f'fixture_{j:04d}'; materials=[]
 for m in d.get('materials',[]):
  name=m['item'];im=re.search(r'File:([^|\]]+)',m.get('image',''));mi=ensure(name,im[1] if im else None);mi['usedIn'].append(rid);materials.append({'item':mi['id'],'name':name,'qty':float(m.get('qty') or 1)})
 out['recipes'].append(rid);skills=d.get('skills',[]); recipes.append({'id':rid,'output':{'item':out['id'],'name':out['name'],'qty':float(o.get('qty') or 1)},'facility':d.get('facility'),'skill':skills[0]['name'] if skills else None,'skillxp':skills[0].get('experience') if skills else None,'materials':materials,'unlock':d.get('unlock'),'wiki':wiki(out['name'])})
layers=[]
for name,item in [('Copper_Ore_Node','copper_ore'),('Tin_Ore_Node','tin_ore'),('Lodestone',None)]:
 markers=json.loads(get('https://dragonwilds.runescape.wiki/w/Module:Map/'+name+'.json?action=raw'));save(pathlib.Path('map')/(name+'.json'),markers)
 layers.append({'name':name,'file':'map/'+name+'.json','count':len(markers),'icon':items[item]['icon'] if item else None,'items':[item] if item else []})
 if item:items[item]['sources'].update(mapLayers=[name],regions=['Ghornfell'],notes='Ore nodes are found in the Fractured Plains and Stormtouched Highlands.')
save(pathlib.Path('data/items.json'),list(items.values()));save(pathlib.Path('data/recipes.json'),recipes);save(pathlib.Path('data/facilities.json'),[]);save(pathlib.Path('data/regions.json'),[]);save(pathlib.Path('map/layers.json'),layers)
save(pathlib.Path('map/crs.json'),{'size':6144,'mult':6144/420000/16,'offset_x':11075,'offset_y':117685,'maxZoom':4,'tileUrl':'https://maps.runescape.wiki/dw/tiles/{z}/{x}_{y}.png'})
(BASE/'CREDITS.md').write_text('RuneScape: Dragonwilds and game imagery © Jagex Ltd. Wiki text and map data © RuneScape: Dragonwilds Wiki contributors, CC BY-NC-SA 3.0. Unofficial, non-commercial fan guide.')
def download(p):
 f,url=p
 try:
  target=BASE/'img'/f;target.parent.mkdir(exist_ok=True);target.write_bytes(get(url))
 except Exception:
  for item in items.values():
   if item['icon']=='img/'+f:item['icon']=None
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:list(ex.map(download,icons.items()))
save(pathlib.Path('data/items.json'),list(items.values()))
print(f'Fixture: {len(items)} items, {len(recipes)} recipes, {len(layers)} layers')
