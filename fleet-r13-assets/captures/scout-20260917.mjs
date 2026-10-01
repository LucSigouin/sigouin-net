import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const OUT='/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/captures';
process.env.TMPDIR=path.join(OUT,'.runtime/tmp');
fs.mkdirSync(process.env.TMPDIR,{recursive:true});
fs.mkdirSync(path.join(OUT,'.runtime/scout'),{recursive:true});
const {chromium}=createRequire('/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/package.json')('playwright-core');
const server=await chromium.launchServer({channel:'msedge',headless:true,args:[`--disk-cache-dir=${OUT}/.runtime/cache`,'--disable-crash-reporter','--disable-breakpad']});
const pid=server.process().pid;
fs.writeFileSync(path.join(OUT,'.runtime/scout-pid.json'),JSON.stringify({pid,started:new Date().toISOString()}));
const browser=await chromium.connect(server.wsEndpoint());
const targets=[
 ['sigz','https://sigzmusic.com',1440,900],
 ['sigz-music','https://sigzmusic.com/music/',1440,900],
 ['teetimes','https://teetime.sigouin.net',1440,900],
 ['teetimes-m','https://teetime.sigouin.net/m/',390,844],
 ['undergrowth','https://undergrowth.pages.dev',1440,900],
 ['sigouin','https://sigouin.net',1440,900],
 ['livetvcan','https://livetvcan.com',1440,900],
 ['bbc','https://bbc.sigouin.net',1440,900]
];
const out=[];
try {
 for(const [id,url,width,height] of targets){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width<500,hasTouch:width<500});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const entry={id,url,viewport:{width,height},errors};
  try{
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
   entry.status=response?.status();
   await page.evaluate(()=>document.fonts.ready);
   if(id==='undergrowth') await page.waitForFunction(()=>!!window.__garden,{timeout:45000});
   await page.waitForTimeout(id==='undergrowth'?3500:2500);
   entry.state=await page.evaluate(()=>({title:document.title,url:location.href,text:document.body.innerText.slice(0,11000),scroll:{x:scrollX,y:scrollY,max:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)-innerHeight},garden:window.__garden?{keys:Object.keys(window.__garden),snapshot:typeof window.__garden.getState==='function'?window.__garden.getState():null}:null,buttons:[...document.querySelectorAll('button')].map(b=>({text:b.innerText,aria:b.getAttribute('aria-label'),disabled:b.disabled})),scrollContainers:[...document.querySelectorAll('body *')].filter(e=>e.clientHeight>150&&e.scrollHeight>e.clientHeight+40&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).map(e=>({tag:e.tagName,id:e.id,class:e.className,clientHeight:e.clientHeight,scrollHeight:e.scrollHeight})).slice(0,15)}));
   await page.screenshot({path:path.join(OUT,'.runtime/scout',id+'.png'),fullPage:false});
  }catch(e){entry.error=e.message;}
  out.push(entry);fs.writeFileSync(path.join(OUT,'.runtime/scout.json'),JSON.stringify(out,null,2));
  console.log(JSON.stringify(entry));
  await context.close();
 }
}finally{
 await browser.close().catch(()=>{});
 try{process.kill(pid,'SIGTERM');}catch(e){if(e.code!=='ESRCH')throw e;}
 await server.close().catch(()=>{});
 fs.writeFileSync(path.join(OUT,'.runtime/scout-pid.json'),JSON.stringify({pid,closed:new Date().toISOString()}));
}
