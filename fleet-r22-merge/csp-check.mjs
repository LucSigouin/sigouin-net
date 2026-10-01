import { chromium } from '/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
process.env.TMPDIR = new URL('./.runtime/', import.meta.url).pathname;
fs.mkdirSync(process.env.TMPDIR,{recursive:true});
const browser = await chromium.launch({channel:'msedge',headless:true});
const results=[];
try {
for(const route of ['/process/','/']) {
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const consoleErrors=[],pageErrors=[];
 page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
 page.on('pageerror',e=>pageErrors.push(e.message));
 await page.addInitScript(()=>{window.cspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.cspViolations.push({directive:e.violatedDirective,blockedURI:e.blockedURI}));});
 const response=await page.goto('http://127.0.0.1:5205'+route,{waitUntil:'networkidle'});
 let counter=null;
 if(route==='/process/') {await page.locator('#next').click();counter=await page.locator('#count').innerText();}
 await page.waitForTimeout(1500);
 const violations=await page.evaluate(()=>window.cspViolations);
 const csp=response.headers()['content-security-policy'];
 results.push({route,status:response.status(),csp,counter,violations,consoleErrors,pageErrors});
 await page.close();
}
} finally {await browser.close();fs.writeFileSync('csp-results.json',JSON.stringify(results,null,2)+'\n');}
console.log(JSON.stringify(results,null,2));
if(results.length!==2||results.some(r=>!r.csp||r.violations.length||r.pageErrors.length)||results[0].counter!=='P2 / 8')process.exit(1);
