/* Dragonwilds field guide · Lane A · Vanilla JS, Leaflet 1.9.4 */
'use strict';
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const title = s => String(s || '').replaceAll('_', ' ');
const nice = s => s ? s[0].toUpperCase() + s.slice(1) : '';
const number = v => Number(v).toLocaleString(undefined, {maximumFractionDigits:2});
const categories = ['food','ore','bar','wood','plant','tool','weapon','armour','building','consumable','potion','material','rune','vestige','other'];
const symbols = ['♧','◈','▰','≋','❧','⚒','†','♜','⌂','◉','♙','◇','✧','✥','⋯'];
const state = {items:[],recipes:[],facilities:[],regions:[],layers:[],byId:new Map(),byRecipe:new Map(),query:'',cats:new Set(),facility:'',skill:'',sort:'relevance',selected:null,limit:120,keyboard:-1,filtered:[],base:'assets/',fixture:false,layerNames:new Set(),layerCache:new Map(),map:null,mini:null,mapEpoch:0,detailEpoch:0,groups:new Map(),crs:null,routeReady:false};
const preferred=['bronze_bar','copper_ore','tin_ore','bronze_pickaxe','ash_logs','stone','flax','coarse_thread','leather','redberries','weak_healing_potion','rune_essence'];
function asset(path) {if(!path)return '';if(/^https?:\/\//.test(path))return path;return state.base + path.split('/').map(p=>encodeURIComponent(p)).join('/');}
function safeLink(url) {return /^https?:\/\//.test(url || '') ? esc(url) : '#items';}
function visualIcon(item) {if(item?.icon)return item.icon;if(item?.file){const id=item.name.replace(/_Node$/i,'').toLowerCase().replace(/[^a-z0-9]+/g,'_');return state.byId.get(id)?.icon||null;}return null;}
function icon(item, cls='') {const path=visualIcon(item);return `<span class="icon ${cls}" aria-hidden="true">${path?`<img src="${esc(asset(path))}" alt="" loading="lazy" decoding="async">`:'◇'}</span>`;}
function sourceLayers(item) {return [...new Set([...(item?.sources?.mapLayers || []),...state.layers.filter(l=>(l.items||[]).includes(item?.id)).map(l=>l.name)])].filter(n=>state.layers.some(l=>l.name===n));}
async function json(url) {const r=await fetch(url);if(!r.ok)throw new Error(`${r.status}: ${url}`);return r.json();}
async function optionalJSON(url,fallback=[]) {try{return await json(url);}catch{return fallback;}}
function notice(message) {const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.hidden=true,3200);}
function itemHref(id) {const p=browseParams();return `#item/${encodeURIComponent(id)}${p.size?'?'+p:''}`;}
function browseParams() {const p=new URLSearchParams();if(state.query)p.set('q',state.query);if(state.cats.size)p.set('category',[...state.cats].join(','));if(state.facility)p.set('facility',state.facility);if(state.skill)p.set('skill',state.skill);if(state.sort!=='relevance')p.set('sort',state.sort);return p;}
function browseHash() {const p=browseParams();return '#items'+(p.size?'?'+p:'');}
function writeBrowse(push=false) {const hash=state.selected?itemHref(state.selected):browseHash();if(push)location.hash=hash;else history.replaceState(null,'',hash);}
function mapHref(names) {return '#map?'+new URLSearchParams({layer:names.join(',')});}
function ingredient(m) {const item=state.byId.get(m.item);return `<a class="ingredient" href="${esc(itemHref(m.item))}">${icon(item)}<span class="ingredient-name">${esc(m.name || item?.name || title(m.item))}</span><span class="qty">× ${number(m.qty || 1)}</span><span class="arrow">↗</span></a>`;}
async function loadData(forceFixture=false) {
 let items,base='assets/';
 if(forceFixture){base='fixture/';items=await json(base+'data/items.json');}
 else {try{items=await json(base+'data/items.json');}catch{base='fixture/';items=await json(base+'data/items.json');}}
 const [recipes,facilities,regions,layers,crs]=await Promise.all([json(base+'data/recipes.json'),optionalJSON(base+'data/facilities.json'),optionalJSON(base+'data/regions.json'),optionalJSON(base+'map/layers.json'),optionalJSON(base+'map/crs.json',null)]);
 state.base=base;state.fixture=base==='fixture/';state.items=items;state.recipes=recipes;state.facilities=facilities;state.regions=regions;state.layers=layers;state.crs=crs;state.layerCache.clear();
 state.byId=new Map(items.map(i=>[i.id,i]));state.byRecipe=new Map(recipes.map(r=>[r.id,r]));
 // Derive both indexes from recipes; partial upstream indexes cannot hide a recipe.
 state.makes=new Map();state.uses=new Map();
 recipes.forEach(r=>{if(!state.makes.has(r.output.item))state.makes.set(r.output.item,[]);state.makes.get(r.output.item).push(r);r.materials.forEach(m=>{if(!state.uses.has(m.item))state.uses.set(m.item,[]);state.uses.get(m.item).push(r);});});
 state.makes.forEach(rs=>rs.sort((a,b)=>Number(b.materials.some(m=>state.byId.get(m.item)?.category==='ore'))-Number(a.materials.some(m=>state.byId.get(m.item)?.category==='ore'))));
 items.forEach(i=>{i._name=i.name.toLowerCase();i._search=[i.name,i.category,i.type,i.description].join(' ').toLowerCase();});
 const fill=(id,values,label)=>{$(id).innerHTML=`<option value="">${label}</option>`+[...new Set(values.filter(Boolean))].sort().map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');};
 fill('#facility',recipes.map(r=>r.facility),'All stations');fill('#skill',recipes.map(r=>r.skill),'All skills');
 fetch(base+'CREDITS.md').then(r=>r.ok?r.text():'').then(t=>{if(t){const jagex=t.split(/\n\s*\n/).find(p=>p.startsWith('Created using intellectual property'))||'An unofficial, non-commercial RuneScape: Dragonwilds fan guide.';$('#credits').textContent=jagex+' Images © Jagex Ltd. Wiki contributors’ text and map data: CC BY-NC-SA 3.0. ';const link=document.createElement('a');link.href=base+'CREDITS.md';link.textContent='Full credits ↗';link.target='_blank';link.rel='noopener';$('#credits').append(link);}}).catch(()=>{});
 document.documentElement.dataset.source=state.fixture?'fixture':'assets';
}
function rank(item,q) {
 if(!q)return preferred.includes(item.id)?500-preferred.indexOf(item.id):0;
 if(item._name===q)return 1000;
 if(item._name.startsWith(q))return 800;
 if(item._name.includes(q))return 600;
 const words=q.split(/\s+/);if(words.every(w=>item._name.includes(w)))return 500;
 if(words.every(w=>item._search.includes(w)))return 200;
 if(q.length>=3){let n=0;for(const c of item._name){if(c===q[n])n++;}if(n===q.length)return 50-q.length/Math.max(1,item._name.length);}
 return -1;
}
function renderCategories() {
 const counts={};state.items.forEach(i=>counts[i.category]=(counts[i.category]||0)+1);
 $('#categories').innerHTML=`<button class="category ${state.cats.size?'':'active'}" data-category="" aria-pressed="${!state.cats.size}"><span class="cat-symbol">▦</span>All items<span class="count">${number(state.items.length)}</span></button>`+categories.map((c,i)=>`<button class="category ${state.cats.has(c)?'active':''}" data-category="${c}" aria-pressed="${state.cats.has(c)}"><span class="cat-symbol">${symbols[i]}</span>${nice(c)}<span class="count">${number(counts[c]||0)}</span></button>`).join('');
}
function renderGrid() {
 const q=state.query.trim().toLowerCase();
 const list=state.items.map(i=>({item:i,rank:rank(i,q)})).filter(({item:i,rank:r})=>r>=0&&(!state.cats.size||state.cats.has(i.category))&&(!state.facility&&!state.skill||(state.makes.get(i.id)||[]).some(r=>(!state.facility||r.facility===state.facility)&&(!state.skill||r.skill===state.skill))));
 list.sort((a,b)=>{if(state.sort==='az')return a.item.name.localeCompare(b.item.name);if(state.sort==='za')return b.item.name.localeCompare(a.item.name);if(state.sort==='category')return a.item.category.localeCompare(b.item.category)||a.item.name.localeCompare(b.item.name);return b.rank-a.rank||a.item.name.localeCompare(b.item.name);});
 state.filtered=list.map(x=>x.item);state.keyboard=-1;
 $('#result-count').textContent=`${number(list.length)} ${list.length===1?'item':'items'}${q?' found':' to discover'}${state.fixture?' · Preview archive':''}`;
 $('#grid').innerHTML=list.slice(0,state.limit).map(i=>card(i.item)).join('')||'<div class="empty">No items found.<br>Try a shorter search or <button class="text-button" data-reset>clear your filters</button>.</div>';
 $('#load-more').hidden=list.length<=state.limit;$('#load-more').textContent=`Show more items (${number(list.length-state.limit)} remaining)`;
}
function card(i) {return `<a class="item-card ${state.selected===i.id?'selected':''}" href="${esc(itemHref(i.id))}" data-item="${esc(i.id)}" aria-label="${esc(i.name)}, ${esc(i.category)}">${icon(i)}<span class="item-name">${esc(i.name)}</span><span class="chip" data-cat="${esc(i.category)}">${esc(i.category)}</span></a>`;}
function recipeHTML(r,index) {
 const facility=state.facilities.find(f=>f.name===r.facility);
 return `<article class="recipe-block"><div class="recipe-facility">${esc(r.facility||'Station not documented')}<span>Yields ${number(r.output.qty||1)}</span></div><div class="recipe-meta">${esc(r.skill||'Skill not documented')}${r.skillxp!=null?' · '+esc(r.skillxp)+' XP':''}</div>${r.materials.length?r.materials.map(ingredient).join(''):'<p class="small-note">Ingredients are not documented on the wiki.</p>'}${r.unlock?`<p class="small-note recipe-unlock">Unlock: ${esc(r.unlock)}</p>`:''}${facility?.description?`<p class="small-note">${esc(facility.description)}</p>`:''}${facility?.unlock?`<p class="small-note">Station unlock: ${esc(facility.unlock)}</p>`:''}</article>`;
}
function treeHTML(item) {
 const recipes=state.makes.get(item.id)||[];
 return `<details class="tree"><summary>Full craft tree & raw materials</summary><div class="tree-body"><p class="small-note">Totals include whole crafting batches and reuse their surplus. Choose a recipe below; intermediate materials use their first displayed recipe. Ore-based recipes are listed first. Fuel and station construction are separate. A leaf is a material with no further documented recipe; it may also be a drop or unlock.</p><label class="tree-controls">Quantity <input id="craft-qty" type="number" min="1" max="9999" value="1" aria-label="Craft quantity"></label>${recipes.length>1?`<label class="tree-controls">Recipe <select id="tree-recipe">${recipes.map((r,i)=>`<option value="${esc(r.id)}">${esc(r.facility||'Unknown station')} · option ${i+1}</option>`).join('')}</select></label>`:''}<div id="tree-result"></div></div></details>`;
}
function renderTree() {
 const item=state.byId.get(state.selected);if(!item||!$('#tree-result'))return;
 const target=Math.max(1,Math.min(9999,Number($('#craft-qty')?.value)||1));const selected=$('#tree-recipe')?.value;const totals=new Map(),surplus=new Map();let nodes=0,cutoff=false;
 function resolve(id,qty,path,depth=0,root=false){
  const it=state.byId.get(id),name=it?.name||title(id);const cycle=path.has(id);const rs=state.makes.get(id)||[];const r=root&&selected?state.byRecipe.get(selected):rs[0];
  nodes++;
  if(cycle||depth>=20||nodes>700||!r||!r.materials.length){const old=totals.get(id)||{qty:0,name,unresolved:false};old.qty+=qty;old.unresolved ||=cycle||depth>=20||nodes>700;totals.set(id,old);if(nodes>700)cutoff=true;return `<li><a href="${esc(itemHref(id))}">${esc(name)}</a> × ${number(qty)}${old.unresolved?' (unresolved cycle / limit)':''}</li>`;}
  const available=surplus.get(id)||0, reused=Math.min(available,qty), needed=qty-reused;surplus.set(id,available-reused);
  if(!needed)return `<li><a href="${esc(itemHref(id))}">${esc(name)}</a> × ${number(qty)} <span class="small-note">· from earlier batch surplus</span></li>`;
  const yieldQty=Number(r.output.qty)||1,times=Math.ceil(needed/yieldQty);surplus.set(id,(surplus.get(id)||0)+times*yieldQty-needed);const p=new Set(path);p.add(id);
  return `<li><a href="${esc(itemHref(id))}">${esc(name)}</a> × ${number(qty)} <span class="small-note">· ${esc(r.facility||'Unknown station')}, ${number(times)} ${times===1?'batch':'batches'}</span><ul>${r.materials.map(m=>resolve(m.item,(Number(m.qty)||1)*times,p,depth+1)).join('')}</ul></li>`;
 }
 const tree=resolve(item.id,target,new Set(),0,true);
 $('#tree-result').innerHTML=`<ul class="tree-list">${tree}</ul><div class="eyebrow">RAW MATERIAL TOTALS</div>${[...totals].map(([id,t])=>ingredient({item:id,name:t.name,qty:t.qty})).join('')}${cutoff?'<p class="small-note">Tree truncated at 700 nodes; unresolved materials are included in totals.</p>':''}`;
}
async function renderDetail(id) {
 if(id&&$('#detail').dataset.item===id&&$('#detail').dataset.base===state.base){state.selected=id;$('#workspace').classList.remove('no-detail');return;}
 $('#detail').dataset.item=id||'';$('#detail').dataset.base=state.base;
 const epoch=++state.detailEpoch;if(state.mini){state.mini.remove();state.mini=null;}
 const item=state.byId.get(id);state.selected=id;$('#workspace').classList.toggle('no-detail',!id);
 if(!id)return;
 if(!item){$('#detail').innerHTML='<div class="detail-topbar">ITEM NOT FOUND <a href="#items">Close ×</a></div><div class="detail-section"><h2>Uncharted territory</h2><p>This item is not in the current archive.</p><a class="wiki-link" href="#items">Browse all items ↗</a></div>';return;}
 const recipes=state.makes.get(id)||[],uses=state.uses.get(id)||[],layers=sourceLayers(item),sources=item.sources||{};
 const stats=['health','sustenance','hydration','weight','power','stacklimit'].filter(k=>item[k]!=null&&item[k]!=='').map(k=>`<div class="stat"><small>${k==='stacklimit'?'Stack limit':k}</small><strong>${esc(item[k])}${k==='weight'?' kg':''}</strong></div>`).join('');
 $('#detail').innerHTML=`<div class="detail-topbar"><span>ITEM FIELD NOTES</span><div class="detail-tools"><button id="share-item" aria-label="Copy item link" title="Copy item link">↗</button><button id="close-detail" aria-label="Close item details">×</button></div></div><div class="detail-hero"><div class="detail-art">${icon(item)}</div><div class="detail-title-row"><h2>${esc(item.name)}</h2><span class="chip" data-cat="${esc(item.category)}">${esc(item.category)}</span></div><p class="detail-description">${esc(item.description||'No description is recorded in the wiki archive.')}</p>${stats?`<div class="stats">${stats}</div>`:''}</div><section class="detail-section"><div class="section-heading"><h3>RECIPE</h3><span>${recipes.length?recipes.length+' available':'Gathered or found'}</span></div>${recipes.length?recipes.map(recipeHTML).join(''):'<p class="detail-placeholder">No crafting recipe is recorded. Check the gathering and drop sources below.</p>'}${recipes.length?treeHTML(item):''}</section><section class="detail-section"><div class="section-heading"><h3>WHERE TO GET</h3><span>${layers.length?layers.length+' map '+(layers.length===1?'layer':'layers'):''}</span></div>${(sources.regions||[]).map(n=>{const r=state.regions.find(r=>r.name===n);return `<span class="region-tag" title="${esc(r?.description||n)}">${esc(n)}${r?.danger?' · '+esc(r.danger):''}</span>`;}).join('')}${sources.notes?`<p class="small-note">${esc(sources.notes)}</p>`:''}${layers.length?`<div id="mini-map" class="mini-map" aria-label="Map preview of ${esc(item.name)} locations"></div><a class="map-link" href="${esc(mapHref(layers))}">Show ${esc(item.name)} on the map <span>↗</span></a><p class="small-note" id="preview-note" style="margin-top:8px">Finding the nearest cluster…</p>`:''}${(sources.drops||[]).length?`<ul class="sources-list">${sources.drops.map(d=>`<li>Dropped by <a href="${safeLink(d.wiki)}" target="_blank" rel="noopener">${esc(d.from)} ↗</a></li>`).join('')}</ul>`:''}${!layers.length&&!sources.notes&&!(sources.regions||[]).length&&!(sources.drops||[]).length?`<p class="detail-placeholder">${recipes.length?'Craft this item at the station listed above.':'A precise source has not been documented in this archive.'}</p>`:''}</section><section class="detail-section"><div class="section-heading"><h3>USED IN</h3><span>${uses.length} ${uses.length===1?'recipe':'recipes'}</span></div><div class="used-in-list">${uses.length?uses.map(r=>`<a class="ingredient" href="${esc(itemHref(r.output.item))}">${icon(state.byId.get(r.output.item))}<span class="ingredient-name">${esc(r.output.name)}<br><span class="small-note">${esc(r.facility||'Unknown station')}</span></span><span class="arrow">↗</span></a>`).join(''):'<p class="detail-placeholder">No further recipes are recorded.</p>'}</div></section><a class="wiki-link" href="${safeLink(item.wiki)}" target="_blank" rel="noopener">Read ${esc(item.name)} on the wiki ↗</a>`;
 $('#detail').scrollTop=0;renderTree();
 if(layers.length){try{await miniMap(layers,epoch);}catch{if(epoch===state.detailEpoch&&$('#preview-note'))$('#preview-note').textContent='Map preview is temporarily unavailable. Open the world map to retry.';}}
}
function crsObject() {const c=state.crs;return L.extend({},L.CRS.Simple,{transformation:new L.Transformation(c.mult,c.mult*c.offset_x,c.mult,c.mult*c.offset_y)});}
function bounds() {const c=state.crs,extent=c.size/c.mult/(2**c.maxZoom);return L.latLngBounds([-c.offset_y,-c.offset_x],[extent-c.offset_y,extent-c.offset_x]);}
function tileLayer() {
 const c=state.crs;const Tile=L.TileLayer.extend({_isValidTile(coords){const dimension=Math.ceil(c.size/(2**(c.maxZoom-coords.z))/256);return coords.z>=0&&coords.z<=c.maxZoom&&coords.x>=0&&coords.y>=0&&coords.x<dimension&&coords.y<dimension;}});
 const url=/^https?:/.test(c.tileUrl)?c.tileUrl:state.base+c.tileUrl;
 return new Tile(url,{minZoom:0,maxZoom:c.maxZoom,tileSize:256,noWrap:true,bounds:bounds(),attribution:'© Jagex · RuneScape Wiki',keepBuffer:1});
}
function makeMap(id,mini=false) {
 if(!window.L||!state.crs)throw new Error('Map library or coordinate data is unavailable.');
 const map=L.map(id,{crs:crsObject(),zoomAnimation:false,fadeAnimation:false,minZoom:0,maxZoom:state.crs.maxZoom,zoomControl:!mini,attributionControl:true,maxBounds:bounds().pad(.08),maxBoundsViscosity:.8,scrollWheelZoom:!mini,dragging:!mini,doubleClickZoom:!mini,boxZoom:!mini,touchZoom:!mini,keyboard:!mini,zoomSnap:1});
 tileLayer().addTo(map);return map;
}
async function markerData(name) {
 if(!state.layerCache.has(name)){const layer=state.layers.find(l=>l.name===name);if(!layer)return [];const promise=json(asset(layer.file||'map/'+name+'.json')).then(d=>Array.isArray(d)?d:[]).catch(e=>{state.layerCache.delete(name);throw e;});state.layerCache.set(name,promise);}
 return state.layerCache.get(name);
}
function markerIcon(layer) {const path=visualIcon(layer);return L.divIcon({className:'resource-marker',html:path?`<img src="${esc(asset(path))}" alt="">`:'<span>◇</span>',iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-12]});}
function addMarker(point,layer,group,mini=false) {
 const x=Number(point.x),y=Number(point.y);if(!Number.isFinite(x)||!Number.isFinite(y))return;if(!bounds().contains([y,x]))return; // instanced interiors (vaults/raids) sit outside the world map
 const marker=L.marker([y,x],{icon:markerIcon(layer),title:point.name||title(layer.name),keyboard:!mini});
 if(!mini){const ids=(layer.items||[]).filter(id=>state.byId.has(id));const related=ids.length?ids:state.items.filter(i=>(i.sources?.mapLayers||[]).includes(layer.name)).map(i=>i.id);
 if(/lodestone/i.test(layer.name))marker.bindTooltip(esc(point.name||title(layer.name)),{permanent:true,direction:'right',offset:[12,0]});
 marker.bindPopup(`<b>${esc(point.name||title(layer.name))}</b>${point.description?`<p>${esc(point.description)}</p>`:''}${related.length?related.map(id=>`<a href="${esc(itemHref(id))}">${esc(state.byId.get(id).name)} · View item ↗</a>`).join(''):`<a href="https://dragonwilds.runescape.wiki/w/${encodeURIComponent(layer.name)}" target="_blank" rel="noopener">Read the wiki ↗</a>`}<small>World ${Math.round(x)}, ${Math.round(y)}</small>`);}
 marker.addTo(group);return marker;
}
async function miniMap(names,epoch) {
 const all=await Promise.all(names.map(async name=>({layer:state.layers.find(l=>l.name===name),points:await markerData(name)})));
 if(epoch!==state.detailEpoch||!$('#mini-map'))return;
 const map=makeMap('mini-map',true);state.mini=map;const points=all.flatMap(a=>a.points).filter(p=>Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y)));
 if(!points.length){map.fitBounds(bounds());$('#preview-note').textContent='No marker coordinates are recorded for this layer.';return;}
 const origin=state.map?.getCenter()||{lng:6133.2593,lat:187356.61};const distance=p=>(p.x-origin.lng)**2+(p.y-origin.lat)**2;
 points.sort((a,b)=>distance(a)-distance(b));const nearest=points[0];const cluster=points.filter(p=>(p.x-nearest.x)**2+(p.y-nearest.y)**2<14000**2);const center=cluster.reduce((v,p)=>[v[0]+Number(p.y)/cluster.length,v[1]+Number(p.x)/cluster.length],[0,0]);
 map.setView(center,3);all.forEach(a=>a.points.forEach(p=>addMarker(p,a.layer,map,true)));$('#preview-note').textContent=`${number(points.length)} mapped locations · cluster nearest ${state.map?'your last map view':'Temple of Saradomin'}.`;
}
function layerGroup(name) {
 if(/ore_node|coal_node|clay_node|stone_node|granite_deposit|sandstone|gypsum_node|anima_vent|essence_geyser/i.test(name))return 'Ores & minerals';
 if(/lodestone|nodestone/i.test(name))return 'Lodestones';if(/vault/i.test(name))return 'Vaults';
 if(/tree|stump|sapling/i.test(name))return 'Trees';if(/plant|bush|flax|berry|berries|herb|cactus|cabbage|cotton|mushroom|wheat|pumpkin|potato|onion|vine|weed/i.test(name))return 'Plants';
 if(/wolf|cow|rat|ram|sheep|chicken|deer|boar|rabbit|bat|spider|fish|trout|salmon|shrimp|eel|bass|lobster|krill/i.test(name))return 'Animals & fishing';
 if(/npc|death$|zanik|veliaf|wise_old_man|doric|vannaka|ellamaria|bob$|icthlarin|zod|oswald/i.test(name))return 'NPCs';
 if(/goblin|garou|knight|dragon|skeleton|zombie|demon|kalphite|zogre/i.test(name))return 'Enemies';return 'Places & discoveries';
}
function renderLayers() {
 const query=$('#layer-search').value.toLowerCase(),groups=new Map();
 state.layers.filter(l=>title(l.name).toLowerCase().includes(query)).forEach(l=>{const key=layerGroup(l.name);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(l);});
 const order=['Ores & minerals','Trees','Plants','Animals & fishing','Vaults','Lodestones','NPCs','Enemies','Places & discoveries'];
 $('#map-layers').innerHTML=order.filter(g=>groups.has(g)).map(g=>`<details class="layer-group" ${query||groups.get(g).some(l=>state.layerNames.has(l.name))||g==='Ores & minerals'?'open':''}><summary>${g} <small>(${groups.get(g).length})</small></summary>${groups.get(g).sort((a,b)=>a.name.localeCompare(b.name)).map(l=>`<label class="layer-option"><input type="checkbox" value="${esc(l.name)}" ${state.layerNames.has(l.name)?'checked':''}>${icon(l)}<span>${esc(title(l.name))}</span><small>${number(l.count||0)}</small></label>`).join('')}</details>`).join('')||'<p class="small-note">No map layers match your search.</p>';
}
function mapHash(withCenter=true) {
 const p=new URLSearchParams({layer:[...state.layerNames].join(',')});if(withCenter&&state.map){const c=state.map.getCenter();p.set('x',Math.round(c.lng));p.set('y',Math.round(c.lat));p.set('z',state.map.getZoom());}return '#map?'+p;
}
async function renderMap(params) {
 const epoch=++state.mapEpoch;const requested=params.has('layer')?params.get('layer').split(',').filter(Boolean):['Lodestone'];state.layerNames=new Set(requested.filter(n=>state.layers.some(l=>l.name===n)));renderLayers();
 try{
  if(!state.map){state.map=makeMap('world-map');state.map.on('moveend',()=>{if(state.routeReady&&location.hash.startsWith('#map')&&!state.settingView)history.replaceState(null,'',mapHash());});}
  state.map.invalidateSize();state.settingView=true;
  const x=Number(params.get('x')),y=Number(params.get('y')),z=Number(params.get('z'));const positioned=params.has('x')&&params.has('y')&&Number.isFinite(x)&&Number.isFinite(y);
  if(positioned)state.map.setView([y,x],Math.max(0,Math.min(4,z)));else state.map.fitBounds(bounds(),{animate:false});
  state.groups.forEach(g=>g.remove());state.groups.clear();$('#map-status').textContent='Loading selected layers…';$('#map-error').hidden=true;
  const results=await Promise.allSettled([...state.layerNames].map(async name=>{const points=await markerData(name);return {name,points};}));
  if(epoch!==state.mapEpoch)return;let count=0,failures=0;const all=[];
  results.forEach(r=>{if(r.status==='rejected'){failures++;return;}const {name,points}=r.value;const layer=state.layers.find(l=>l.name===name),group=L.layerGroup().addTo(state.map);state.groups.set(name,group);points.forEach(p=>{if(addMarker(p,layer,group)){count++;all.push([Number(p.y),Number(p.x)]);}});});
  if(!positioned&&all.length&&params.has('layer'))state.map.fitBounds(L.latLngBounds(all),{padding:[50,50],maxZoom:3,animate:false});
  state.settingView=false;history.replaceState(null,'',mapHash());
  $('#map-status').textContent=`${number(count)} locations · ${state.layerNames.size} ${state.layerNames.size===1?'layer':'layers'}${failures?' · '+failures+' unavailable':''}`;
  if(failures){$('#map-error').hidden=false;$('#map-error').textContent='Some marker layers could not be loaded. Toggle them off and on to retry.';}
 }catch(e){state.settingView=false;$('#map-error').hidden=false;$('#map-error').textContent='The atlas is not ready yet. '+e.message;$('#map-status').textContent='Map data unavailable';}
}
function parseRoute() {const raw=location.hash.slice(1)||'items';const cut=raw.indexOf('?');return {path:cut<0?raw:raw.slice(0,cut),params:new URLSearchParams(cut<0?'':raw.slice(cut+1))};}
async function route() {
 const {path,params}=parseRoute(),isMap=path==='map';$('#workspace').classList.toggle('is-map',isMap);$('#map-view').hidden=!isMap;$('#items-tab').classList.toggle('active',!isMap);$('#map-tab').classList.toggle('active',isMap);
 $('#items-tab').setAttribute('aria-current',isMap?'false':'page');$('#map-tab').setAttribute('aria-current',isMap?'page':'false');
 if(isMap){toggleFilters(false);document.title='Ashenfall Map — Dragonwilds Field Guide';state.routeReady=true;await renderMap(params);return;}
 state.mapEpoch++;state.query=params.get('q')||'';state.cats=new Set((params.get('category')||'').split(',').filter(c=>categories.includes(c)));state.facility=params.get('facility')||'';state.skill=params.get('skill')||'';state.sort=params.get('sort')||'relevance';state.limit=120;
 $('#search').value=state.query;$('#facility').value=state.facility;$('#skill').value=state.skill;$('#sort').value=state.sort;
 let id=null;try{if(path.startsWith('item/'))id=decodeURIComponent(path.slice(5));}catch{}
 state.selected=id;renderCategories();renderGrid();await renderDetail(id);state.routeReady=true;
 document.title=id&&state.byId.has(id)?state.byId.get(id).name+' — Dragonwilds Field Guide':'Dragonwilds — The Field Guide';
}
function reset() {state.query='';state.cats.clear();state.facility='';state.skill='';state.sort='relevance';$('#search').value='';$('#facility').value='';$('#skill').value='';$('#sort').value='relevance';state.limit=120;writeBrowse();renderCategories();renderGrid();}
function bindEvents() {
 $('#search').addEventListener('input',e=>{state.query=e.target.value;state.limit=120;writeBrowse();renderGrid();});
 $('#search').addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const max=Math.min(state.limit,state.filtered.length)-1;state.keyboard=Math.max(0,Math.min(max,state.keyboard+(e.key==='ArrowDown'?1:-1)));document.querySelectorAll('.item-card').forEach((el,i)=>{el.classList.toggle('keyboard',i===state.keyboard);if(i===state.keyboard)el.scrollIntoView({block:'nearest'});});}if(e.key==='Enter'&&state.filtered.length){e.preventDefault();location.hash=itemHref(state.filtered[Math.max(0,state.keyboard)].id);}});
 document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();if(location.hash.startsWith('#map'))$('#layer-search').focus();else $('#search').focus();}if(e.key==='Escape'){if($('#workspace').classList.contains('filters-open'))toggleFilters(false);else if(!location.hash.startsWith('#map')&&state.selected)location.hash=browseHash();}});
 $('#categories').addEventListener('click',e=>{const button=e.target.closest('[data-category]');if(!button)return;const c=button.dataset.category;if(!c)state.cats.clear();else if(state.cats.has(c))state.cats.delete(c);else state.cats.add(c);state.limit=120;writeBrowse(true);renderCategories();renderGrid();});
 for(const field of ['facility','skill','sort'])$('#'+field).addEventListener('change',e=>{state[field]=e.target.value;state.limit=120;writeBrowse(true);renderGrid();});
 $('#reset').onclick=reset;$('#grid').addEventListener('click',e=>{if(e.target.closest('[data-reset]'))reset();});
 $('#load-more').onclick=()=>{state.limit+=120;renderGrid();};$('#filter-toggle').onclick=()=>toggleFilters(!$('#workspace').classList.contains('filters-open'));
 $('#detail').addEventListener('click',async e=>{if(e.target.closest('#close-detail'))location.hash=browseHash();if(e.target.closest('#share-item')){try{await navigator.clipboard.writeText(location.href);notice('Item link copied to your clipboard.');}catch{notice('Copy the address bar to share this item.');}}});
 $('#detail').addEventListener('input',e=>{if(e.target.id==='craft-qty')renderTree();});$('#detail').addEventListener('change',e=>{if(e.target.id==='tree-recipe')renderTree();});
 $('#layer-search').oninput=renderLayers;$('#map-layers').addEventListener('change',e=>{if(e.target.type!=='checkbox')return;if(e.target.checked)state.layerNames.add(e.target.value);else state.layerNames.delete(e.target.value);location.hash=mapHash();});
 $('#clear-layers').onclick=()=>{state.layerNames.clear();location.hash=mapHash();};$('#fit-map').onclick=()=>{if(state.map)state.map.fitBounds(bounds(),{animate:false});};
 window.addEventListener('hashchange',route);document.addEventListener('error',e=>{if(e.target.tagName==='IMG'){e.target.parentElement.textContent='◇';}},true);
}
function toggleFilters(open){$('#workspace').classList.toggle('filters-open',open);$('#filter-toggle').setAttribute('aria-expanded',String(open));}
async function boot() {
 try{const fixture=new URLSearchParams(location.search).get('fixture')==='1';await loadData(fixture);bindEvents();if(!location.hash)history.replaceState(null,'',matchMedia('(max-width:650px)').matches?'#items':'#item/bronze_bar');await route();window.guide={state,route,rank,bounds};
  if(state.fixture&&!fixture){const poll=setInterval(async()=>{try{const r=await fetch('assets/data/items.json',{method:'HEAD'});if(!r.ok)return;await loadData();if(state.fixture)return;clearInterval(poll);if(state.map){state.map.remove();state.map=null;}state.groups.clear();await route();notice('The full Ashenfall archive is now available.');}catch{}},20000);}
 }catch(e){$('#grid').innerHTML=`<div class="empty">The archive could not be loaded.<br>${esc(e.message)}<br>Serve the site directory with a local HTTP server, then reload.</div>`;$('#result-count').textContent='Archive unavailable';}
}
boot();
