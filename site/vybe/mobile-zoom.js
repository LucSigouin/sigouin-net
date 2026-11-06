// Crop the camera's original view, keeping the model and camera orientation fixed.
export function createMobileZoom({camera,canvas,onChange=()=>{},requestFrame,onGesture=()=>{}}){
  const min=1,max=3;let zoom=1,x=0,y=0,pinch=null,multiTouch=false;
  const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
  function apply(){
    const r=canvas.getBoundingClientRect();
    if(zoom===1)camera.clearViewOffset();
    else camera.setViewOffset(r.width,r.height,x*r.width,y*r.height,r.width/zoom,r.height/zoom);
    camera.updateProjectionMatrix();onChange(zoom);requestFrame();
  }
  function setView(value,offsetX,offsetY){
    zoom=clamp(value,min,max);const limit=1-1/zoom;
    x=clamp(offsetX,0,limit);y=clamp(offsetY,0,limit);apply();
  }
  function setZoom(value){
    const next=clamp(value,min,max);setView(next,x+.5/zoom-.5/next,y+.5/zoom-.5/next);
  }
  function pair(event){
    const [a,b]=event.touches,r=canvas.getBoundingClientRect();
    return {distance:Math.max(1,Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY)),mx:((a.clientX+b.clientX)/2-r.left)/r.width,my:((a.clientY+b.clientY)/2-r.top)/r.height};
  }
  function start(event){
    if(event.touches.length<2)return;
    event.preventDefault();multiTouch=true;onGesture();
    const p=pair(event);pinch={distance:p.distance,zoom,anchorX:x+p.mx/zoom,anchorY:y+p.my/zoom};
  }
  function move(event){
    if(!multiTouch)return;
    event.preventDefault();
    if(event.touches.length<2||!pinch)return;
    const p=pair(event),next=clamp(pinch.zoom*p.distance/pinch.distance,min,max);
    setView(next,pinch.anchorX-p.mx/next,pinch.anchorY-p.my/next);
  }
  function end(event){
    if(!multiTouch)return;
    event.preventDefault();pinch=null;
    if(event.touches.length===0)multiTouch=false;
    else if(event.touches.length>=2)start(event);
  }
  const cancel=()=>{pinch=null;multiTouch=false};
  const gesture=event=>event.preventDefault();
  const listeners=[['touchstart',start],['touchmove',move],['touchend',end],['touchcancel',end],['gesturestart',gesture],['gesturechange',gesture]];
  for(const [name,fn] of listeners)canvas.addEventListener(name,fn,{passive:false});
  return {apply,cancel,get active(){return multiTouch},by(factor){setZoom(zoom*factor)},reset(){cancel();setView(1,0,0)},stats(){return {zoom,offset:[x,y],min,max,gestureActive:multiTouch}},dispose(){for(const [name,fn] of listeners)canvas.removeEventListener(name,fn)}};
}
