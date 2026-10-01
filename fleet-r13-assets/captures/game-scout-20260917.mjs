import fs from 'node:fs';
import path from 'node:path';
import {OUT,launch} from './browser-20260917.mjs';
const runner=await launch('game-scout');
try{
 for(const [width,height] of [[1440,900],[390,844]]){
  const context=await runner.browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390});
  const page=await context.newPage();
  await page.goto('https://undergrowth.pages.dev/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('canvas',{state:'visible'});
  await page.locator('#start').waitFor({state:'visible'});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(3000);
  await page.screenshot({path:path.join(OUT,'.runtime',`game-scout-${width}.png`)});
  console.log(JSON.stringify({width,canvas:await page.locator('canvas').boundingBox(),body:await page.locator('body').innerText(),buttons:await page.locator('button').evaluateAll(bs=>bs.filter(b=>b.getBoundingClientRect().height).map(b=>({id:b.id,text:b.innerText,aria:b.getAttribute('aria-label'),rect:b.getBoundingClientRect().toJSON()})))}));
  await context.close();
 }
}finally{await runner.close();}
