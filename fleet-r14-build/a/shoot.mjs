import fs from 'node:fs';
import {createRequire} from 'node:module';
const L='/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r14-build/a';
process.env.TMPDIR=L+'/.runtime/tmp';
fs.mkdirSync(process.env.TMPDIR,{recursive:true});
const {chromium}=createRequire('/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/package.json')('playwright-core');
const base='http://127.0.0.1:5191';
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
  await p.screenshot({path:`${L}/shots/${name}-${w}.png`});
  console.log(name,w,'hscroll:',wide,'errors:',JSON.stringify(errs));
  await ctx.close();
 }
}
await b.close();
