const {test,expect}=require('../../Sigouin-Hub/node_modules/@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const out=__dirname;
for(const mode of ['desktop','reduced','portrait','landscape','process','process-reduced','hub','hub-mobile','hub-links']){
 test(mode,async({browser})=>{
  const context=await browser.newContext({viewport:mode.includes('portrait')||mode==='hub-mobile'?{width:390,height:844}:mode==='landscape'?{width:844,height:390}:{width:1440,height:900},isMobile:['portrait','landscape','hub-mobile'].includes(mode),hasTouch:['portrait','landscape','hub-mobile'].includes(mode),reducedMotion:mode.includes('reduced')?'reduce':'no-preference'});
  const page=await context.newPage();const errors=[],responses=[],failures=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('response',r=>responses.push({url:r.url(),status:r.status()}));page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()}));
  await page.goto('https://sigouin.net/'+(mode.startsWith('process')?'process/':mode.startsWith('hub')?'hub/'+(mode==='hub-links'?'?links':''):''));
  if(mode==='desktop')await page.waitForFunction(()=>window.__vybe?.mode==='live',null,{timeout:90000});
  if(mode.startsWith('hub'))await page.waitForFunction(()=>['play','links'].includes(window.__hub?.state()),null,{timeout:150000});
  await page.waitForTimeout(2500);
  const state=await page.evaluate(()=>({vybe:window.__vybe?{mode:window.__vybe.mode,stats:window.__vybe.stats}:null,hub:window.__hub?{state:window.__hub.state(),debug:window.__hub.debug?.()}:null,visibleControls:[...document.querySelectorAll('a,button,canvas[tabindex]')].filter(e=>e.checkVisibility()).map(e=>({tag:e.tagName,id:e.id,text:e.innerText,label:e.getAttribute('aria-label'),href:e.getAttribute('href')})),videos:[...document.querySelectorAll('video')].map(v=>({src:v.currentSrc,paused:v.paused,time:v.currentTime,autoplay:v.autoplay,visible:v.checkVisibility()})),resources:performance.getEntriesByType('resource').map(r=>({url:r.name,transfer:r.transferSize,encoded:r.encodedBodySize,decoded:r.decodedBodySize,duration:r.duration})),paint:performance.getEntriesByType('paint').map(r=>({name:r.name,start:r.startTime})),images:[...document.images].map(i=>({src:i.currentSrc,complete:i.complete,width:i.naturalWidth})),scroll:{w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,iw:innerWidth,ih:innerHeight}}));
  await page.screenshot({path:path.join(out,mode+'.png')});
  if(mode==='reduced'){await page.keyboard.press('Tab');state.tabFocus=await page.evaluate(()=>document.activeElement.outerHTML.slice(0,200));}
  if(mode==='portrait'){await page.locator('#rack-door').click();state.rackOpen=await page.locator('#rack-door').getAttribute('aria-pressed');await page.locator('#rack-enter').click();await page.waitForURL('**/hub/');state.enteredHub=true;}
  if(mode==='process'||mode==='process-reduced'){await page.locator('#next').click();state.nextCount=await page.locator('#count').textContent();await page.locator('#ledgerBtn').click();state.ledgerVisible=await page.locator('#ledger').isVisible();}
  fs.writeFileSync(path.join(out,mode+'.json'),JSON.stringify({state,errors,responses,failures},null,2));
  expect(responses.find(r=>r.url==='https://sigouin.net/'+(mode.startsWith('process')?'process/':mode.startsWith('hub')?'hub/'+(mode==='hub-links'?'?links':''):''))?.status).toBe(200);
  await context.close();
 });
}
