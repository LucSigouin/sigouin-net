const monitorToolbar=document.querySelector('#monitor-toolbar');
const scene=document.querySelector('#scene'),poster=document.querySelector('#scene-poster');
const mobilePoster=document.querySelector('#mobile-poster-source');
const hint=document.querySelector('#scene-hint'),announcement=document.querySelector('#scene-announcement');
const explore=document.querySelector('#explore-3d'),mobileControls=document.querySelector('#mobile-live-controls');
const mobileStatus=document.querySelector('#mobile-scene-status'),pauseButton=document.querySelector('#mobile-pause');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const mobile=matchMedia('(max-width: 759px), (pointer: coarse)');
const connection=navigator.connection;
let engine=null,loading=false,generation=0,abort=null,opened=false,paused=false,explicit3D=false,compact=mobile.matches;
function shouldUseStill(){return new URLSearchParams(location.search).has('still')||(!explicit3D&&(reduced.matches||mobile.matches||connection?.saveData))}
function syncControls(){
  document.querySelector('#mobile-zoom').hidden=!engine;
  explore.hidden=Boolean(engine);explore.disabled=loading;
  explore.textContent=loading?'Loading workspace…':'Explore in 3D';
  mobileControls.hidden=!engine&&!loading;
  pauseButton.hidden=!engine;pauseButton.textContent=paused?'Resume motion':'Pause motion';pauseButton.setAttribute('aria-pressed',String(paused));
}
function showPose(value,announce=true){
  opened=value;poster.src=opened?'/vybe/assets/open.webp?v=ls-20261001d':'/vybe/assets/closed.webp?v=ls-20261001d';mobilePoster.srcset=opened?'/vybe/assets/mobile-open.webp?v=ls-20261001d':'/vybe/assets/mobile-closed.webp?v=ls-20261001d';
  poster.alt=`Amber-lit workstation with the server rack ${opened?'open for service, with two trays extended':'closed'}`;
  engine?.setOpen(opened);if(announce)announcement.textContent=opened?'Rack open. Service trays extended.':'Rack closed.';
}
function setPaused(value){paused=value;engine?.setPaused(value);syncControls();announcement.textContent=value?'Motion paused.':'Motion resumed.'}
function stopLive(reason='Still view'){
  monitorToolbar.hidden=true;generation++;abort?.abort();loading=false;engine?.dispose();engine=null;scene.dataset.mode='still';scene.setAttribute('aria-busy','false');showPose(false,false);hint.textContent=reason;syncControls();
}
function failLive(message='3D is unavailable right now. You can still explore the page.'){
  explicit3D=false;stopLive();mobileStatus.textContent=message;announcement.textContent=message;
}
// Enter on the monitor's login screen: fade the room out, then load the walkable hub.
function enterHub(){if(document.body.classList.contains('leaving'))return;document.body.classList.add('leaving');setTimeout(()=>{location.href='/hub/'},650)}
async function startLive(){
  if(engine||loading||shouldUseStill())return;
  const id=++generation;loading=true;scene.dataset.mode='loading';scene.setAttribute('aria-busy','true');hint.textContent='Loading workspace…';mobileStatus.textContent='Preparing the interactive workspace…';syncControls();
  abort=new AbortController();const signal=abort.signal;let candidate=null;
  const timeout=setTimeout(()=>{if(id===generation)failLive('The workspace is taking too long to load. Try again, or enjoy the still view.')},25000);
  try{
    const {createWorkspace}=await import('./workspace.js?v=ls-20261001d');if(id!==generation)return;
    candidate=await createWorkspace({host:document.querySelector('#canvas-host'),signal,onEnter:enterHub,compact:mobile.matches,onZoomChange:updateZoom,onOpenChange:value=>showPose(value),onPauseChange:setPaused,onFailure:()=>failLive('Graphics paused. Showing the still view.'),paused,opened,onMonitorLayout:bounds=>{monitorToolbar.style.left=bounds.left+'px';monitorToolbar.style.top=bounds.top+'px';monitorToolbar.style.width=bounds.width+'px';monitorToolbar.style.height=bounds.height+'px'}});
    if(id!==generation){candidate.dispose();return}
    engine=candidate;loading=false;scene.dataset.mode='live';scene.setAttribute('aria-busy','false');hint.textContent='Brush the song waveform · hover over the rack to open';monitorToolbar.hidden=false;
    mobileStatus.textContent='Pinch to zoom · two fingers to pan. Tap the rack or swipe the waveform.';syncControls();
  }catch(e){candidate?.dispose();if(id===generation){failLive();console.warn('Vybe live scene unavailable:',e.message)}}finally{clearTimeout(timeout)}
}
document.querySelector('#mobile-explore').hidden=false;
explore.addEventListener('click',()=>{explicit3D=true;paused=reduced.matches;startLive()});
document.querySelector('#use-still').addEventListener('click',()=>{explicit3D=false;stopLive();mobileStatus.textContent='A look inside my workspace. Tap to explore.';explore.focus({preventScroll:true})});
pauseButton.addEventListener('click',()=>setPaused(!paused));
function updateZoom(value){
  document.querySelector('#zoom-level').textContent=Number(value.toFixed(1))+'×';
  document.querySelector('#zoom-out').disabled=value<=1.001;
  document.querySelector('#zoom-in').disabled=value>=2.999;
  document.querySelector('#zoom-fit').disabled=value<=1.001;
}
document.querySelector('#zoom-out').addEventListener('click',()=>engine?.zoomBy(1/1.35));
document.querySelector('#zoom-in').addEventListener('click',()=>engine?.zoomBy(1.35));
document.querySelector('#zoom-fit').addEventListener('click',()=>engine?.fitView());
document.querySelector('#signal-pluck').addEventListener('click',()=>{engine?.pluckSong();announcement.textContent=paused?'Resume motion to ripple the waveform.':'Vybe waveform ripple.'});
for(const el of document.querySelectorAll('[data-return]'))el.addEventListener('click',()=>{showPose(false,false);engine?.reset();document.querySelector('#home').scrollIntoView({behavior:reduced.matches?'instant':'smooth'})});
const contact=document.querySelector('#contact-link');contact.href='mailto:luc@sigouin.net';contact.firstChild.textContent='Say hello ';
function preferenceChanged(){
  const layoutChanged=compact!==mobile.matches;compact=mobile.matches;
  if(layoutChanged){explicit3D=false;stopLive()}
  if(reduced.matches&&engine&&explicit3D)setPaused(true);
  if(shouldUseStill())stopLive();else startLive();
}
reduced.addEventListener('change',preferenceChanged);mobile.addEventListener('change',preferenceChanged);connection?.addEventListener?.('change',preferenceChanged);
window.addEventListener('pagehide',()=>stopLive());window.addEventListener('pageshow',()=>{if(!engine)preferenceChanged()});
const menu=document.querySelector('#menu-toggle'),header=document.querySelector('.site-header'),nav=document.querySelector('#main-navigation');
menu.hidden=false;header.classList.add('has-menu');
function closeMenu(){header.classList.remove('menu-open');menu.setAttribute('aria-expanded','false')}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';header.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',String(open))});
nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus()}});
document.addEventListener('pointerdown',event=>{if(!header.contains(event.target))closeMenu()});
mobile.addEventListener('change',closeMenu);
const sectionObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;for(const link of nav.querySelectorAll('a')){if(link.hash==='#'+entry.target.id)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')}}},{rootMargin:'-20% 0px -55% 0px'});
for(const section of document.querySelectorAll('main section[id]'))sectionObserver.observe(section);
Object.defineProperty(window,'__vybe',{value:{get mode(){return scene.dataset.mode},get opened(){return opened},get paused(){return paused},get stats(){return engine?.stats()??null}},writable:false});
showPose(false,false);preferenceChanged();
