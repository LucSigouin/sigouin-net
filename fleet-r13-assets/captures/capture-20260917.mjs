import fs from 'node:fs';
import path from 'node:path';
import {OUT,DATE,launch,ready,scrollTarget,setScroll} from './browser-20260917.mjs';
const mode=process.argv[2]||'stills';
const only=process.argv[3];
const targets=[
 {id:'sigz',url:'https://sigzmusic.com/'},
 {id:'sigz-music',url:'https://sigzmusic.com/music/'},
 {id:'teetimes',url:'https://teetime.sigouin.net/',mobileUrl:'https://teetime.sigouin.net/m/'},
 {id:'sigouin',url:'https://sigouin.net/'},
 {id:'livetvcan',url:'https://livetvcan.com/'},
 {id:'bbc',url:'https://bbc.sigouin.net/'}
];
const dataFile=path.join(OUT,`capture-${mode}-${DATE}.json`);
const out=only&&fs.existsSync(dataFile)?JSON.parse(fs.readFileSync(dataFile,'utf8')).filter(r=>r.site!==only):[];
const save=()=>fs.writeFileSync(dataFile,JSON.stringify(out,null,2)+'\n');
const runner=await launch(mode);
try{
 for(const target of targets.filter(t=>(!only||t.id===only)&&(mode==='stills'||['sigz-music','teetimes','sigouin'].includes(t.id)))){
  for(const [width,height] of mode==='stills'?[[1440,900],[390,844]]:[[1440,900]]){
   const url=width===390&&target.mobileUrl?target.mobileUrl:target.url;
   const viewport={width,height};
   const errors=[];
   const opts={viewport,deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390};
   if(mode==='videos')opts.recordVideo={dir:path.join(OUT,'.runtime/video'),size:viewport};
   const context=await runner.browser.newContext(opts);
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   const record={site:target.id,url,viewport,started:new Date().toISOString(),errors};
   try{
    record.status=(await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000}))?.status();
    await ready(page,target.id);
    record.finalUrl=page.url();
    const scrolling=await scrollTarget(page);
    record.scrolling=scrolling;
    if(mode==='stills'){
     record.shots=[];
     for(const percent of scrolling.max>4?[0,50,100]:[0]){
      const actual=await setScroll(page,scrolling,percent);
      await page.mouse.move(width-3,3);
      const filename=`${target.id}-${width}-scroll${percent}-${DATE}.png`;
      await page.screenshot({path:path.join(OUT,filename),fullPage:false});
      record.shots.push({filename,requestedPercent:percent,actual,selector:scrolling.selector,captured:new Date().toISOString()});
      console.log(filename,fs.statSync(path.join(OUT,filename)).size,JSON.stringify(actual));
     }
    }else{
     await setScroll(page,scrolling,0);
     await page.mouse.move(width-3,3);
     const end=Math.min(scrolling.max,target.id==='sigouin'?750:target.id==='teetimes'?1000:scrolling.max);
     record.motion={selector:scrolling.selector,from:0,to:end,seconds:7.5,description:'Slow scroll over 6.5 seconds with a short hold at each end'};
     await page.evaluate(async({selector,end})=>{
      const el=selector==='document'?document.scrollingElement:document.querySelector(selector);
      await new Promise(r=>setTimeout(r,500));
      await new Promise(resolve=>{
       const start=performance.now();
       function step(now){
        const t=Math.min(1,(now-start)/6500);
        const ease=t*t*(3-2*t);
        el.scrollTo({top:end*ease,behavior:'instant'});
        if(t<1)requestAnimationFrame(step);else resolve();
       }
       requestAnimationFrame(step);
      });
      await new Promise(r=>setTimeout(r,500));
     },{selector:scrolling.selector,end});
     const video=page.video();
     await context.close();
     const filename=`${target.id}-1440-scroll-${DATE}.webm`;
     await video.saveAs(path.join(OUT,filename));
     record.video={filename,trim:'last 7 seconds',muted:true};
     console.log(filename,fs.statSync(path.join(OUT,filename)).size);
    }
   }catch(e){record.error=e.message;console.error(target.id,width,e.message);}
   finally{await context.close().catch(()=>{});out.push(record);save();}
  }
 }
}finally{await runner.close();}
