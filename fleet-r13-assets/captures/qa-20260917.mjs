import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {OUT,launch} from './browser-20260917.mjs';
const runner=await launch('qa');
const page=await runner.browser.newPage({viewport:{width:1300,height:1000},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(pathToFileURL(path.join(OUT,'captures-index.html')).href);
 const images=await page.evaluate(async()=>{
  return Promise.all([...document.images].map(async img=>{
   img.loading='eager';
   await img.decode();
   return {filename:decodeURIComponent(new URL(img.src).pathname.split('/').pop()),width:img.naturalWidth,height:img.naturalHeight,complete:img.complete};
  }));
 });
 const clips=[];
 for(const video of await page.locator('video').all()){
  const info=await video.evaluate(async v=>{
   v.muted=true;
   if(v.readyState<1)await new Promise((r,j)=>{v.addEventListener('loadedmetadata',r,{once:true});v.addEventListener('error',j,{once:true});});
   await v.play();
   await new Promise(r=>setTimeout(r,1200));
   const currentTime=v.currentTime;
   v.pause();
   await new Promise(r=>{v.addEventListener('seeked',r,{once:true});v.currentTime=6;});
   v.controls=false;
   return {filename:decodeURIComponent(new URL(v.querySelector('source').src).pathname.split('/').pop()),duration:v.duration,width:v.videoWidth,height:v.videoHeight,muted:v.muted,playbackAdvanced:currentTime>0.5,currentTimeAtPause:currentTime,seekedTo:v.currentTime,error:v.error?.message||null};
  });
  clips.push(info);
  await video.screenshot({path:path.join(OUT,'.runtime',info.filename.replace('.mp4','-at6.png'))});
 }
 const data={verified:new Date().toISOString(),images,clips,errors,allImagesDecoded:images.every(i=>i.complete&&i.width>0),allClipsPlayed:clips.every(c=>c.playbackAdvanced&&!c.error)};
 fs.writeFileSync(path.join(OUT,'browser-qa-20260917.json'),JSON.stringify(data,null,2)+'\n');
 console.log(JSON.stringify({imageCount:images.length,clips,errors}));
 if(!data.allImagesDecoded||!data.allClipsPlayed||errors.length)throw new Error('Browser asset QA failed');
}finally{await runner.close();}
