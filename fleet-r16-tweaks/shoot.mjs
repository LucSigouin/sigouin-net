import fs from 'node:fs';
import {createRequire} from 'node:module';
const L='/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r16-tweaks';
process.env.TMPDIR=L+'/.runtime/tmp';
fs.mkdirSync(process.env.TMPDIR,{recursive:true});
const {chromium}=createRequire('/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/package.json')('playwright-core');
const base='http://127.0.0.1:5193';
const b=await chromium.launch({channel:'msedge',headless:true,args:[`--disk-cache-dir=${L}/.runtime/cache`,'--disable-crash-reporter','--disable-breakpad']});

for(const [name,path] of [['index','/'],['process','/process/']]){
 for(const [w,h] of [[1440,900],[390,844]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:w===390,hasTouch:w===390});
  const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
  await p.goto(base+path,{waitUntil:'load',timeout:30000});
  await p.evaluate(()=>document.fonts.ready);
  await p.waitForTimeout(3800);
  const wide=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  const rows=name==='index'?await p.evaluate(()=>document.querySelectorAll('#rail .row').length):null;
  const slivers=name==='index'?await p.evaluate(()=>document.querySelectorAll('.rail__sliver').length):null;
  await p.screenshot({path:`${L}/shots/${name}-${w}.png`});
  console.log(name,w,'hscroll:',wide,'rows:',rows,'slivers:',slivers,'errors:',JSON.stringify(errs));
  await ctx.close();
 }
}

/* Exhibit 01 and 02 stages at 1440, so the contain behaviour is visible.
   Also measure the rendered image box against its natural size: contain means
   the whole capture fits inside the media panel, so no side is clipped. */
for(const [label,i] of [['exhibit01',0],['exhibit02',1]]){
 const ctx=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const p=await ctx.newPage();
 await p.goto(base+'/',{waitUntil:'load',timeout:30000});
 await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(n=>document.querySelectorAll('#rail .row')[n].click(),i);
 await p.waitForTimeout(2600);
 await p.evaluate(()=>document.querySelector('#stage').scrollIntoView({block:'start'}));
 await p.waitForTimeout(700);
 const fit=await p.evaluate(()=>{
  const el=document.querySelector('.stage__media img, .stage__media video');
  if(!el) return null;
  const cs=getComputedStyle(el), box=el.getBoundingClientRect();
  const nw=el.naturalWidth||el.videoWidth, nh=el.naturalHeight||el.videoHeight;
  if(!nw) return {objectFit:cs.objectFit,natural:null};
  /* Scale the way the declared object-fit actually scales, so cover really does
     report a drawn box wider or taller than the panel. */
  const sx=box.width/nw, sy=box.height/nh;
  const scale=cs.objectFit==='cover'?Math.max(sx,sy):Math.min(sx,sy);
  return {objectFit:cs.objectFit,natural:[nw,nh],box:[Math.round(box.width),Math.round(box.height)],
          drawn:[Math.round(nw*scale),Math.round(nh*scale)],
          fitsInside:nw*scale<=box.width+1&&nh*scale<=box.height+1};
 });
 await p.screenshot({path:`${L}/shots/${label}-1440.png`});
 console.log(label,JSON.stringify(fit));
 await ctx.close();
}

/* Same check on the phone layout. */
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const p=await ctx.newPage();
await p.goto(base+'/',{waitUntil:'load',timeout:30000});
await p.evaluate(()=>document.fonts.ready);
await p.evaluate(()=>document.querySelectorAll('#rail .row')[3].click());
await p.waitForTimeout(2600);
const fit390=await p.evaluate(()=>{
 const el=document.querySelector('.stage__media img');
 if(!el) return null;
 const cs=getComputedStyle(el), box=el.getBoundingClientRect();
 const sx=box.width/el.naturalWidth, sy=box.height/el.naturalHeight;
 const scale=cs.objectFit==='cover'?Math.max(sx,sy):Math.min(sx,sy);
 return {objectFit:cs.objectFit,natural:[el.naturalWidth,el.naturalHeight],
         box:[Math.round(box.width),Math.round(box.height)],
         drawn:[Math.round(el.naturalWidth*scale),Math.round(el.naturalHeight*scale)],
         fitsInside:el.naturalWidth*scale<=box.width+1&&el.naturalHeight*scale<=box.height+1};
});
await p.screenshot({path:`${L}/shots/exhibit04-390.png`});
console.log('phone stage',JSON.stringify(fit390));
await ctx.close();
await b.close();
