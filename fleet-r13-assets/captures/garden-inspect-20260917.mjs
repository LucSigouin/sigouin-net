import fs from 'node:fs';
import path from 'node:path';
import {OUT,launch} from './browser-20260917.mjs';
const runner=await launch('garden-inspect');
const context=await runner.browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const scripts=[];
page.on('response',async response=>{
 if(response.request().resourceType()==='script'&&response.url().startsWith('https://undergrowth.pages.dev/')){
  const source=await response.text().catch(()=>'');
  scripts.push({url:response.url(),bytes:source.length,containsGarden:source.includes('__garden'),gardenContext:source.includes('__garden')?source.slice(Math.max(0,source.indexOf('__garden')-200),source.indexOf('__garden')+700):null});
 }
});
try{
 await page.goto('https://undergrowth.pages.dev',{waitUntil:'domcontentloaded',timeout:45000});
 let hookWait;
 try{await page.waitForFunction(()=>!!window.__garden,null,{timeout:45000});hookWait='ready';}catch(e){hookWait=e.message;}
 const state=await page.evaluate(()=>({url:location.href,title:document.title,ready:document.readyState,hook:!!window.__garden,text:document.body.innerText.slice(0,6000),canvas:[...document.querySelectorAll('canvas')].map(c=>({width:c.width,height:c.height,rect:c.getBoundingClientRect().toJSON()})),buttons:[...document.querySelectorAll('button')].map(b=>({text:b.innerText,aria:b.getAttribute('aria-label'),id:b.id,disabled:b.disabled})),frames:frames.length,keys:Object.keys(window).filter(k=>/garden|game|world|scene/i.test(k))}));
 const data={captured:false,hookWait,state,scripts,errors};
 fs.writeFileSync(path.join(OUT,'garden-readiness-20260917.json'),JSON.stringify(data,null,2)+'\n');
 console.log(JSON.stringify(data));
}finally{await context.close();await runner.close();}
