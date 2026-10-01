import fs from 'node:fs';
import path from 'node:path';
import {OUT,DATE,launch,scrollTarget,setScroll} from './browser-20260917.mjs';
const mode=process.argv[2]||'stills';
const runner=await launch('game-'+mode);
const out=[];
const dataFile=path.join(OUT,mode==='stills'?'capture-game-20260917.json':'capture-game-videos-20260917.json');
async function place(page,width,type,point){
 await page.getByRole('button',{name:new RegExp('^'+type)}).click();
 if(width===390)await page.touchscreen.tap(point[0],point[1]);else await page.mouse.click(point[0],point[1]);
 if(width===390){await page.locator('#confirm-place').waitFor({state:'visible'});await page.locator('#confirm-place').click();}
 await page.waitForTimeout(250);
}
async function shot(page,record,label,state,elapsed=null){
 const width=record.viewport.width;
 const filename=`undergrowth-${width}-scroll0-${label}-${DATE}.png`;
 await page.mouse.move(width-2,2);
 const actual=await page.evaluate(()=>({y:scrollY,max:document.scrollingElement.scrollHeight-document.scrollingElement.clientHeight}));
 await page.screenshot({path:path.join(OUT,filename),fullPage:false});
 record.shots.push({filename,requestedPercent:0,actual,selector:'document',state,elapsed_seconds:elapsed,captured:new Date().toISOString(),hud:await page.locator('header').innerText().catch(()=>''),startButton:await page.locator('#start').innerText()});
 console.log(filename,fs.statSync(path.join(OUT,filename)).size);
}
try{
 for(const [width,height] of mode==='stills'?[[1440,900],[390,844]]:[[1440,900]]){
  const opts={viewport:{width,height},deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390};
  if(mode==='video')opts.recordVideo={dir:path.join(OUT,'.runtime/game-video'),size:{width,height}};
  const context=await runner.browser.newContext(opts);
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const record={site:'undergrowth',url:'https://undergrowth.pages.dev/',viewport:{width,height},errors,shots:[],started:new Date().toISOString(),readiness:'User approved visible canvas and gameplay controls in place of absent development hook',actions:[]};
  try{
   record.status=(await page.goto(record.url,{waitUntil:'domcontentloaded',timeout:45000}))?.status();
   await page.waitForSelector('canvas',{state:'visible'});
   await page.locator('#start').waitFor({state:'visible'});
   await page.waitForFunction(()=>{const c=document.querySelector('canvas');return c?.width>200&&c?.height>200&&!document.querySelector('#start').disabled;});
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForTimeout(2500);
   record.canvas=await page.locator('canvas').boundingBox();
   record.scrolling=await scrollTarget(page);
   record.autoruns=false;
   if(mode==='stills')await shot(page,record,'ready','Initial battlefield; Start control enabled');
   const positions=width===390?[[166,220],[224,278],[166,337],[224,395]]:[[465,250],[575,360],[465,475],[575,585]];
   for(let i=0;i<positions.length;i++){
    const type=i===3?'Catapult':'Ballista';
    await place(page,width,type,positions[i]);
    record.actions.push({action:'Click engine, then battlefield'+(width===390?', then Place engine':''),engine:type,point:positions[i]});
   }
   await page.keyboard.press('Escape');
   await page.waitForTimeout(500);
   if(mode==='stills')await shot(page,record,'built','Three Ballista defenses and one Catapult placed by clicks');
   await page.locator('#start').click();
   record.actions.push({action:'Click Start',at:new Date().toISOString()});
   const start=performance.now();
   if(mode==='stills'){
    for(const seconds of [3,8,15]){
     await page.waitForTimeout(Math.max(0,seconds*1000-(performance.now()-start)));
      const active=await page.locator('#start').innerText()==='Playing';
      await shot(page,record,`play${seconds}s`,'Battlefield after Start click; '+(active?'wave active':'stage cleared; waiting for next Start click'),+((performance.now()-start)/1000).toFixed(3));
    }
   }else{
    await page.mouse.move(width-2,2);
    await page.waitForTimeout(8000);
    record.motion={selector:'document',from:0,to:0,seconds:7,description:'First-stage play after placing three Ballista defenses and one Catapult, then clicking Start; no scroll'};
    const video=page.video();
    await context.close();
    const filename=`undergrowth-1440-play-${DATE}.webm`;
    await video.saveAs(path.join(OUT,filename));
    record.video={filename,trim:'last 7 seconds',muted:true};
    console.log(filename,fs.statSync(path.join(OUT,filename)).size);
   }
  }catch(e){record.error=e.message;console.error(e.message);}
  finally{await context.close().catch(()=>{});out.push(record);fs.writeFileSync(dataFile,JSON.stringify(out,null,2)+'\n');}
 }
}finally{await runner.close();}
