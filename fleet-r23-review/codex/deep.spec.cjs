const {test,expect}=require('../../Sigouin-Hub/node_modules/@playwright/test');
const fs=require('node:fs');const out=__dirname;
test('journey and hub keyboard',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('https://sigouin.net/');await page.waitForFunction(()=>window.__vybe?.mode==='live');await page.locator('#canvas-host canvas').focus();await page.keyboard.press('Enter');await page.waitForURL('**/hub/');await page.waitForFunction(()=>window.__hub?.state()==='play');
 const map=page.getByRole('button',{name:'Map of the courtyard',exact:true});await map.focus();await page.keyboard.press('Space');const spaceOpened=await page.locator('.map-panel').isVisible();await page.keyboard.press('Enter');const enterOpened=await page.locator('.map-panel').isVisible();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Skip to links',exact:true}).click();const links=await page.locator('#links').isVisible();await page.getByRole('button',{name:'Back to the courtyard'}).click();await page.mouse.click(720,450);await page.keyboard.down('s');await page.waitForURL(u=>u.pathname==='/',{timeout:15000});await page.keyboard.up('s');await page.waitForFunction(()=>window.__vybe?.mode==='live');
 fs.writeFileSync(out+'/journey.json',JSON.stringify({spaceOpened,enterOpened,links,returned:true,errors},null,2));expect(errors).toEqual([]);
});
test('process small screens and clipping',async({browser})=>{
 const result=[];
 for(const [w,h] of [[390,844],[320,568],[844,390]]){
 const c=await browser.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true});const p=await c.newPage();await p.goto('https://sigouin.net/process/');await p.waitForTimeout(700);
 const scenes=[];
 for(let i=0;i<8;i++){
  if(i)await p.locator('#next').click();await p.waitForTimeout(400);scenes.push(await p.locator('.scene.is-on .scene__note').evaluate(e=>({scroll:e.scrollHeight,client:e.clientHeight,overflow:getComputedStyle(e).overflowY})));
 }
 await p.locator('#ledgerBtn').click();const ledger=await p.locator('#ledger').evaluate(e=>({scroll:e.scrollHeight,client:e.clientHeight,overflow:getComputedStyle(e).overflowY,close:e.querySelector('.close').getBoundingClientRect().toJSON(),rect:e.getBoundingClientRect().toJSON()}));await p.screenshot({path:out+`/process-ledger-${w}.png`});result.push({w,h,scenes,ledger});await c.close();
 }
 fs.writeFileSync(out+'/process-clipping.json',JSON.stringify(result,null,2));
});
test('landing without WebGL and javascript',async({browser})=>{
 const result=[];
 for(const js of [true,false]){
 const c=await browser.newContext({javaScriptEnabled:js,viewport:{width:1440,height:900}});const p=await c.newPage();if(js)await p.addInitScript(()=>{const orig=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){if(t==='webgl2'||t==='webgl')return null;return orig.call(this,t,...args)}});await p.goto('https://sigouin.net/');await p.waitForTimeout(1200);result.push({js,controls:await p.locator('a,button').evaluateAll(es=>es.filter(e=>e.checkVisibility()).map(e=>e.outerHTML)),mode:await p.locator('#scene').getAttribute('data-mode')});await c.close();
 }
 fs.writeFileSync(out+'/fallback.json',JSON.stringify(result,null,2));
});
