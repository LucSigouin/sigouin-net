import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
export const OUT='/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/captures';
export const DATE='20260917';
process.env.TMPDIR=path.join(OUT,'.runtime/tmp');
fs.mkdirSync(process.env.TMPDIR,{recursive:true});
const {chromium}=createRequire('/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/package.json')('playwright-core');
export async function launch(label){
 const server=await chromium.launchServer({channel:'msedge',headless:true,args:[`--disk-cache-dir=${OUT}/.runtime/cache-${label}`,'--disable-crash-reporter','--disable-breakpad']});
 const pid=server.process().pid;
 const browser=await chromium.connect(server.wsEndpoint());
 const record={label,pid,started:new Date().toISOString(),version:browser.version(),channel:'msedge',headless:true};
 const dest=path.join(OUT,`.runtime/pid-${label}.json`);
 fs.writeFileSync(dest,JSON.stringify(record,null,2));
 return {browser,close:async()=>{
  await browser.close().catch(()=>{});
  try{process.kill(pid,'SIGTERM');record.sigtermSent=true;}catch(e){if(e.code!=='ESRCH')throw e;record.exitedBeforeSignal=true;}
  await server.close().catch(()=>{});
  record.closed=new Date().toISOString();
  try{process.kill(pid,0);record.stillRunning=true;}catch(e){record.stillRunning=false;}
  fs.writeFileSync(dest,JSON.stringify(record,null,2));
 }};
}
export async function ready(page,id){
 await page.evaluate(()=>document.fonts.ready);
 if(id==='sigouin')await page.waitForSelector('html.sc-ready',{timeout:20000}).catch(()=>{});
 if(id.startsWith('teetimes'))await page.waitForFunction(()=>document.body.innerText.includes('courses with times')||document.body.innerText.includes('courses\nwith times'),null,{timeout:20000});
 if(id==='sigz-music')await page.waitForSelector('.listwrap img',{timeout:20000});
 await page.waitForTimeout(id==='sigz'?3500:2200);
 await page.evaluate(()=>Promise.race([Promise.all([...document.images].filter(i=>{const b=i.getBoundingClientRect();return b.bottom>0&&b.top<innerHeight;}).map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,6000))]));
}
export async function scrollTarget(page){
 return page.evaluate(()=>{
  const max=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)-innerHeight;
  if(max>4)return {selector:'document',max,clientHeight:innerHeight};
  const elements=[...document.querySelectorAll('body *')].filter(e=>e.clientHeight>150&&e.scrollHeight>e.clientHeight+4&&['auto','scroll'].includes(getComputedStyle(e).overflowY)&&e.getBoundingClientRect().width>150);
  elements.sort((a,b)=>(b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight));
  const el=elements[0];
  if(!el)return {selector:'document',max:0,clientHeight:innerHeight};
  const selector=el.id?'#'+CSS.escape(el.id):el.tagName.toLowerCase()+[...el.classList].map(c=>'.'+CSS.escape(c)).join('');
  return {selector,max:el.scrollHeight-el.clientHeight,clientHeight:el.clientHeight};
 });
}
export async function setScroll(page,target,percent){
 let actual;
 for(let attempt=0;attempt<6;attempt++){
  await page.evaluate(({target,percent})=>{
   const el=target.selector==='document'?document.scrollingElement:document.querySelector(target.selector);
   el.scrollTo({top:(el.scrollHeight-el.clientHeight)*percent/100,behavior:'instant'});
  },{target,percent});
  await page.waitForTimeout(1000);
  await page.evaluate(()=>Promise.race([Promise.all([...document.images].filter(i=>{const b=i.getBoundingClientRect();return b.bottom>0&&b.top<innerHeight;}).map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,4000))]));
  actual=await page.evaluate(selector=>{const el=selector==='document'?document.scrollingElement:document.querySelector(selector);return {y:el.scrollTop,max:el.scrollHeight-el.clientHeight};},target.selector);
  if(Math.abs(actual.y-actual.max*percent/100)<=2){actual.settlePasses=attempt+1;return actual;}
 }
 throw new Error(`Scroll did not settle at ${percent}%: ${JSON.stringify(actual)}`);
}
