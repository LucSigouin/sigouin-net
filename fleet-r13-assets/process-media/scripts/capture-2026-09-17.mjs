import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const lane='/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/process-media';
const runtime=path.join(lane,'.runtime');
fs.mkdirSync(runtime,{recursive:true});
process.env.TMPDIR=runtime;
const {chromium}=createRequire('/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/package.json')('playwright-core');
const executablePath='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const out=path.join(lane,'2026-09-17');
const context=await chromium.launchPersistentContext(path.join(runtime,'edge-profile'),{executablePath,headless:true,viewport:{width:1440,height:900},deviceScaleFactor:1,acceptDownloads:false,args:['--disable-breakpad','--disable-crash-reporter','--disable-sync','--no-first-run','--allow-file-access-from-files']});
fs.writeFileSync(path.join(runtime,'capture-node.pid'),String(process.pid));
const rows=[];
const jobs=[];
for(const name of ['claude','codex','grok','kimi-a','kimi-b','kimi-c','kimi-d','kimi-e']) jobs.push({name:`landing-${name}`,source:`/Users/ls/Claude-Workspace/personal/archive/sigzmusic-landing/${name}/demo.html`,settle:2200});
jobs.push({name:'landing-live-winner',source:'https://sigzmusic.com',settle:3000});
jobs.push({name:'sigouin-live-2026-09-17',source:'https://sigouin.net',settle:2500});
for (const [name,source] of [
 ['board-live-2026-09-17','/Users/ls/Claude-Workspace/personal/sigouin-net/workbench/workbench.html'],
 ['board-claude-2026-09-17','/Users/ls/Claude-Workspace/Fleet-Machine/fleet-r2-workbench/claude/workbench.html'],
 ['board-kimi-2026-09-17','/Users/ls/Claude-Workspace/Fleet-Machine/fleet-r2-workbench/kimi/workbench.html'],
 ['how-the-fleet-works-2026-09-17','/Users/ls/Claude-Workspace/Fleet-Machine/how-the-fleet-works.html']
]) jobs.push({name,source,full:true,settle:1400});
for(const name of ['a','b']) jobs.push({name:`sigouin-r1-lane-${name}-2026-09-17`,source:`/Users/ls/Claude-Workspace/personal/archive/sigouin-net-fleet-2026-09-02/fleet-r1-site/lane-${name}/site/index.html`,settle:2000});
const filter=process.argv.slice(2);
const evidencePath=path.join(lane,'evidence',filter.length && filter.every(n=>n.startsWith('sigouin-r1-'))?'captures-extra-2026-09-17.json':'captures-2026-09-17.json');
const previous=fs.existsSync(evidencePath)?JSON.parse(fs.readFileSync(evidencePath,'utf8')):[];
try {
 for(const job of jobs.filter(j=>!filter.length || filter.includes(j.name))){
  const page=await context.newPage();
  const errors=[],failed=[],responses=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>failed.push({url:r.url().split('?')[0],error:r.failure()?.errorText}));
  page.on('response',r=>{if(r.status()>=400)responses.push({url:r.url().split('?')[0],status:r.status()});});
  const row={...job,captured_at:new Date().toISOString(),viewport:{width:1440,height:900},errors,failed,responses};
  try {
   const url=job.source.startsWith('https:')?job.source:pathToFileURL(job.source).href;
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
   row.status=response?.status()??null;
   await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,8000))]));
   await page.waitForTimeout(job.settle);
   if(job.source==='https://sigouin.net') await page.waitForSelector('html.sc-ready',{timeout:10000}).catch(()=>{});
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForTimeout(300);
   row.page=await page.evaluate(()=>({title:document.title,url:location.href,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,fonts:document.fonts.status,images:[...document.images].filter(x=>!x.complete||x.naturalWidth===0).map(x=>x.getAttribute('src')).filter(Boolean)}));
   row.path=path.join(out,job.name+'.png');
   await page.screenshot({path:row.path,fullPage:false});
   if(job.full){row.fullPath=path.join(out,job.name+'-full.png');await page.screenshot({path:row.fullPath,fullPage:true});}
   console.log(JSON.stringify({name:job.name,status:row.status,dimensions:[row.page.scrollWidth,row.page.scrollHeight],errors:errors.length,failed:failed.length,bytes:fs.statSync(row.path).size,fullBytes:row.fullPath?fs.statSync(row.fullPath).size:undefined}));
  }catch(e){row.error=e.message;console.log(JSON.stringify({name:job.name,error:e.message}));}
  rows.push(row);fs.writeFileSync(evidencePath,JSON.stringify([...previous.filter(p=>!rows.some(r=>r.name===p.name)),...rows],null,2).replaceAll('\u2014','\\u2014')+'\n');
  await page.close();
 }
}finally{await context.close();fs.rmSync(path.join(runtime,'capture-node.pid'),{force:true});}
if(rows.some(x=>x.error))process.exitCode=1;
