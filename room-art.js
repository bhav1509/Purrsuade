// Cat room drawn from the Cat Game Pixel Pack atlas (assets/cat-game-atlas.png + .js).
// World units follow the pack: x runs along the right back wall, y along the left one,
// both 0–180. Screen = floorOrigin + (x - y, (x + y) / 2 - z). Everything is drawn 1:1
// into room space, then the whole room is scaled to fit the canvas.
const atlasImage=new Image();
const roomAssetsReady=new Promise((resolve,reject)=>{atlasImage.onload=resolve;atlasImage.onerror=()=>reject(new Error('Could not load cat-game-atlas.png'));});
atlasImage.src=new URL('assets/cat-game-atlas.png',document.currentScript.src).href;
let roomImagesLoaded=false;
roomAssetsReady.then(()=>{roomImagesLoaded=true;},()=>{});

const CAT_COATS=Object.keys(CAT_ATLAS.cats);
const ROOM_STYLES=Object.keys(CAT_ATLAS.rooms);
const CARE_ICONS={food:'bowl_sky_kibble',water:'bowl_blush_water',litter:'litter_tray_mint',play:'toy_yarn_pink',treat:'treat_jar_pink'};
// What the cat's thought bubble shows when that need is lowest.
const NEED_ICONS={hunger:'bowl_sky_empty',thirst:'bowl_blush_water',cleanliness:'litter_scoop_mint',happiness:'toy_yarn_pink'};

const ROOM={
  walls:[['window_curtain_rose_left',40,50],['art_plant_left',122,66],['art_heart_left',150,74],['window_blind_white_right',30,54],['art_cat_right',100,80],['art_waves_right',124,90],['wall_clock_blue_right',150,96]],
  rug:['rug_sage',100,104],
  // [sprite, x, y, z, shadow radius]
  furniture:[['plant_big_sky',16,18,0,9],['shelf_sage',128,2,0,0],['plant_small_blush',150,9,62,0],['treat_jar_pink',136,9,42,0],['basket_bed_sage',54,54,0,19],['scratch_post_oak',28,150,0,11],['floor_lamp_cream',10,112,0,7],['floor_cushion_lavender',170,118,0,9]],
  litter:[160,62],food:[124,160],water:[150,146],yarn:[84,132],
};
// Where the cat stands for each spot: [x, y, z, face left].
const SPOT={bed:[54,54,4,false],rug:[100,104,0,false],window:[24,74,0,true],cushion:[150,112,0,true],
  food:[118,162,0,false],water:[144,148,0,false],litter:[160,62,3,false],yarn:[78,132,0,false]};

let roomStyle=ROOM_STYLES[0];
const project=(x,y,z=0)=>{const [ox,oy]=CAT_ATLAS.rooms[roomStyle].floorOrigin;return [ox+x-y,oy+(x+y)/2-z];};

function drawSprite(ctx,name,x,y,z=0){
  const s=CAT_ATLAS.sprites[name],[X,Y]=project(x,y,z);
  ctx.drawImage(atlasImage,s.x,s.y,s.w,s.h,Math.round(X-s.anchor[0]),Math.round(Y-s.anchor[1]),s.w,s.h);
}
function drawWallItem(ctx,name,along,z){
  const s=CAT_ATLAS.sprites[name];
  if(s.side==='left'){const [X,Y]=project(0,along,z+s.height_px);ctx.drawImage(atlasImage,s.x,s.y,s.w,s.h,Math.round(X-s.w),Math.round(Y-1),s.w,s.h);}
  else{const [X,Y]=project(along,0,z+s.height_px);ctx.drawImage(atlasImage,s.x,s.y,s.w,s.h,Math.round(X-1),Math.round(Y-1),s.w,s.h);}
}
// Pixel-stepped ellipse so shadows stay crisp at any zoom.
function drawShadow(ctx,x,y,z,r){
  if(!r)return;const [X,Y]=project(x,y,z),ry=Math.max(1,Math.round(r/2));
  ctx.fillStyle='rgba(60,40,30,.18)';
  for(let dy=-ry;dy<=ry;dy++){const half=Math.round(r*Math.sqrt(1-(dy/ry)**2));ctx.fillRect(Math.round(X)-half,Math.round(Y)+dy,half*2,1);}
}

// Walls, floor and wall decor never change, so each room style is drawn once.
const staticLayers={};
function getStaticLayer(){
  if(staticLayers[roomStyle])return staticLayers[roomStyle];
  const r=CAT_ATLAS.rooms[roomStyle],c=document.createElement('canvas');c.width=r.w;c.height=r.h;
  const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  ctx.drawImage(atlasImage,r.x,r.y,r.w,r.h,0,0,r.w,r.h);
  ROOM.walls.forEach(([n,a,z])=>drawWallItem(ctx,n,a,z));
  drawSprite(ctx,...ROOM.rug);
  return staticLayers[roomStyle]=c;
}

// ---- Sky behind the room follows the local clock ----
const SKY=[[0,'#151330','#28224a'],[5,'#2a2550','#5a4677'],[6.5,'#8a9fd6','#f5bfa8'],[9,'#93c3ea','#dcecf6'],[16,'#86b6e2','#d4e6f2'],[18,'#7c7fc4','#f6b48c'],[19.5,'#463c7a','#c9789a'],[21,'#1b1840','#332a5c'],[24,'#151330','#28224a']];
const STARS=Array.from({length:46},(_,i)=>[(i*0.618034)%1,((i*0.377)%1)*.75,i%3]);
function mixHex(a,b,k){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=p(a),B=p(b);return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*k)).join(',')})`;}
// 0 by day, 1 at night, easing through dusk and dawn.
function nightAmount(){const d=new Date(),h=d.getHours()+d.getMinutes()/60;return h>=21||h<5?1:h>=19.5?(h-19.5)/1.5:h<6.5?(6.5-h)/1.5:0;}
// Pixel clouds as rows of [left offset, width] in cloud pixels.
const CLOUD=[[4,6],[2,11],[0,16],[1,14]];
const CLOUDS=[[.08,.1,1,.9],[.55,.2,.7,.6],[.3,.72,.85,.75],[.82,.62,.6,.5]]; // [start x, y, size, speed]
function drawSky(ctx,W,H,time,px){
  const d=new Date(),h=d.getHours()+d.getMinutes()/60;
  const i=SKY.findIndex((s,j)=>h>=s[0]&&h<SKY[j+1][0]),[h0,t0,b0]=SKY[i],[h1,t1,b1]=SKY[i+1],k=(h-h0)/(h1-h0);
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,mixHex(t0,t1,k));g.addColorStop(1,mixHex(b0,b1,k));
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const night=nightAmount(),size=Math.max(1,Math.round(px));
  if(night<1){
    ctx.fillStyle='#ffffff';
    CLOUDS.forEach(([sx,sy,sc,sp])=>{
      const u=Math.max(1,Math.round(px*2*sc)),cw=16*u,span=W+cw;
      const x=Math.round(((sx*span+time*.012*sp*u)%span)-cw),y=Math.round(sy*H);
      ctx.globalAlpha=(1-night)*.55*sc;
      CLOUD.forEach(([l,w],row)=>ctx.fillRect(x+l*u,y+row*u,w*u,u));
    });
  }
  if(night>0)STARS.forEach(([sx,sy,t],n)=>{
    ctx.globalAlpha=night*(.45+.4*Math.abs(Math.sin(time/900+n)));ctx.fillStyle=t?'#f6f1ff':'#ffe9a8';
    ctx.fillRect(Math.round(sx*W),Math.round(sy*H),size*(t===2?2:1),size*(t===2?2:1));
  });
  ctx.globalAlpha=1;
}

// ---- Cat behaviour: a plan is a timeline of walk / stay segments. ----
const WALK_SPEED=32; // world units per second
function buildPlan(start,from,steps,loop){
  const segs=[];let t=0,pos=from.slice(0,3),flip=from[3],spot=null;
  for(const step of steps){
    if(step.to){
      const to=SPOT[step.to],dist=Math.hypot(to[0]-pos[0],to[1]-pos[1]);spot=step.to;
      if(dist<1){pos=to.slice(0,3);continue;}
      const screenDx=(to[0]-pos[0])-(to[1]-pos[1]);if(Math.abs(screenDx)>2)flip=screenDx<0;
      const dur=Math.max(.3,dist/WALK_SPEED);
      segs.push({t0:t,t1:t+dur,from:pos,to:to.slice(0,3),anim:'walk',flip});t+=dur;pos=to.slice(0,3);
    }else{
      if(step.at){const at=SPOT[step.at];pos=at.slice(0,3);flip=step.flip??at[3];spot=step.at;}
      segs.push({t0:t,t1:t+step.dur,from:pos,to:pos,anim:step.anim,flip,spot:step.at,hearts:step.hearts,hideYarn:step.hideYarn});t+=step.dur;
    }
  }
  return {start,segs,dur:t,loop,endSpot:spot};
}
function poseAt(plan,time){
  let t=(time-plan.start)/1000;
  if(plan.loop)t=((t%plan.dur)+plan.dur)%plan.dur;else t=Math.min(Math.max(t,0),plan.dur-.001);
  const seg=plan.segs.find(s=>t<s.t1)||plan.segs[plan.segs.length-1],k=(t-seg.t0)/(seg.t1-seg.t0);
  const lerp=i=>seg.from[i]+(seg.to[i]-seg.from[i])*k;
  return {x:lerp(0),y:lerp(1),z:lerp(2),anim:seg.anim,flip:seg.flip,animT:t-seg.t0,hearts:seg.hearts,hideYarn:seg.hideYarn,reacting:!plan.loop};
}
const IDLE_STEPS={
  happy:[{at:'bed',anim:'sleep',dur:9},{at:'bed',anim:'idle',dur:1.5},{to:'rug'},{at:'rug',anim:'sit',dur:4},{at:'rug',anim:'idle',dur:1.5},{to:'window'},{at:'window',anim:'sit',dur:4},{to:'cushion'},{at:'cushion',anim:'idle',dur:2.5},{to:'bed'}],
  tired:[{at:'bed',anim:'sleep',dur:10}],
};
const REACTION_STEPS={
  food:[{to:'food'},{at:'food',anim:'sit',dur:3,hearts:true}],
  water:[{to:'water'},{at:'water',anim:'sit',dur:3,hearts:true}],
  litter:[{to:'litter'},{at:'litter',anim:'sit',dur:2.5,hearts:true}],
  play:[{to:'yarn'},{at:'yarn',anim:'play',dur:3.5,hearts:true,hideYarn:true}],
  treat:[{to:'rug'},{at:'rug',anim:'jump',dur:.6},{at:'rug',anim:'jump',dur:.6},{at:'rug',anim:'sit',dur:2,hearts:true}],
  pet:[{anim:'sit',dur:2.2,hearts:true}],
  cheer:[{to:'rug'},{at:'rug',anim:'jump',dur:.6},{at:'rug',anim:'jump',dur:.6},{at:'rug',anim:'jump',dur:.6},{at:'rug',anim:'sit',dur:2,hearts:true}],
};
let catPlan=null,planReaction=null,planMood=null;
function currentPose(time,cat,reaction){
  const mood=cat.happiness<25?'tired':'happy';
  if(reaction&&reaction!==planReaction&&REACTION_STEPS[reaction.type]){
    const p=catPlan?poseAt(catPlan,reaction.started):null,from=p?[p.x,p.y,p.z,p.flip]:SPOT.bed;
    catPlan=buildPlan(reaction.started,from,[...REACTION_STEPS[reaction.type],{to:mood==='happy'?'rug':'bed'}],false);planReaction=reaction;
  }
  if(catPlan&&!catPlan.loop&&time>=catPlan.start+catPlan.dur*1000){
    // Rejoin the idle loop at the spot the reaction finished on, so the cat never jumps.
    const end=catPlan.start+catPlan.dur*1000,idle=buildPlan(0,SPOT.bed,IDLE_STEPS[mood],true);
    const seg=idle.segs.find(s=>s.spot===catPlan.endSpot&&s.anim!=='walk');
    idle.start=end-(seg?seg.t0:0)*1000;catPlan=idle;planMood=mood;
  }
  if(!catPlan||(catPlan.loop&&planMood!==mood)){catPlan=buildPlan(time,SPOT.bed,IDLE_STEPS[mood],true);planMood=mood;}
  return poseAt(catPlan,time);
}

function drawCatFrame(ctx,coat,anim,animT,X,Y,flip){
  const c=CAT_ATLAS.cats[coat]||CAT_ATLAS.cats[CAT_COATS[0]],a=c.animations[anim];
  let i=Math.floor(animT*a.fps);i=a.loop?i%a.frames:Math.min(i,a.frames-1);
  const [sx,sy,w,h]=a.rects[i],[fx,fy]=c.feetAnchor;
  ctx.save();ctx.translate(Math.round(X),Math.round(Y));if(flip)ctx.scale(-1,1);
  ctx.drawImage(atlasImage,sx,sy,w,h,-fx,-fy,w,h);ctx.restore();
}
function drawHeart(ctx,X,Y,time){
  const y=Math.round(Y)-40-Math.floor(time/400)%2,x=Math.round(X)-3;ctx.fillStyle='#e0707f';
  ctx.fillRect(x,y,2,2);ctx.fillRect(x+4,y,2,2);ctx.fillRect(x,y+2,6,2);ctx.fillRect(x+1,y+4,4,1);ctx.fillRect(x+2,y+5,2,1);
}
// Pixel speech bubble above the cat showing the sprite of what it wants.
function drawThought(ctx,X,Y,icon,time){
  const s=CAT_ATLAS.sprites[icon],w=s.w+8,h=s.h+8,bob=Math.floor(time/600)%2;
  const x=Math.round(X)+2,y=Math.round(Y)-36-h-bob;
  ctx.fillStyle='#5b4a44';ctx.fillRect(x+1,y,w-2,h);ctx.fillRect(x,y+1,w,h-2);
  ctx.fillStyle='#fffaf2';ctx.fillRect(x+1,y+1,w-2,h-2);
  ctx.fillStyle='#5b4a44';ctx.fillRect(x+1,y+h+1,3,3);ctx.fillRect(x-1,y+h+5,2,2);
  ctx.fillStyle='#fffaf2';ctx.fillRect(x+2,y+h+2,1,1);
  ctx.drawImage(atlasImage,s.x,s.y,s.w,s.h,x+4,y+4,s.w,s.h);
}

// ---- Camera: optional pan (all devices) and pinch-zoom (touch only) per canvas ----
// A canvas opts in with data-cam="<key>"; the offset/zoom survive re-renders under that key.
const roomCams={};
const MAX_ZOOM=3;
function camFor(canvas){const k=canvas.dataset.cam;return k?(roomCams[k]||(roomCams[k]={x:0,y:0,zoom:1})):null;}
function camIsHome(cam){return cam.zoom===1&&!cam.x&&!cam.y;}

// Fit the room into the canvas, keeping clear of overlay bands (data-pad-top/bottom, CSS px)
// when that costs little size; snap to whole-number zoom when it costs little space.
function fitCanvas(canvas){
  const r=CAT_ATLAS.rooms[roomStyle],rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  const CW=Math.max(1,Math.round(rect.width*dpr)),CH=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==CW||canvas.height!==CH){canvas.width=CW;canvas.height=CH;}
  // An open side panel / bottom sheet (data-panel-right/-bottom, CSS px) shrinks the visible area;
  // ease towards it so the room glides aside instead of jumping.
  const pp=canvas._pp||(canvas._pp={r:0,b:0}),tr=(+canvas.dataset.panelRight||0)*dpr,tb=(+canvas.dataset.panelBottom||0)*dpr;
  const ease=canvas.dataset.still?1:.22;pp.r+=(tr-pp.r)*ease;pp.b+=(tb-pp.b)*ease;
  if(Math.abs(tr-pp.r)<.5)pp.r=tr;if(Math.abs(tb-pp.b)<.5)pp.b=tb;
  const W=Math.max(1,CW-pp.r),H=Math.max(1,CH-pp.b);
  const pt=(+canvas.dataset.padTop||0)*dpr,pb=(+canvas.dataset.padBottom||0)*dpr;
  const full=Math.min(W/r.w,H/r.h),padded=Math.min(W/r.w,Math.max(1,H-pt-pb)/r.h),usePad=padded>=full*.9;
  let fit=usePad?padded:full;const cam=camFor(canvas),zoom=cam?cam.zoom:1;
  // Tall, narrow stages (phones) leave the room tiny, so draw it larger and let the sides spill;
  // the camera can pan to the edges.
  if(cam&&H/W>(r.h/r.w)*1.2)fit=Math.min(fit*1.3,(usePad?H-pt-pb:H)/r.h);
  const scale=zoom!==1?fit*zoom:fit>=1&&Math.floor(fit)/fit>.85?Math.floor(fit):fit;
  const top=usePad?pt:0,avail=usePad?H-pt-pb:H;
  let x=(W-r.w*scale)/2,y=top+(avail-r.h*scale)/2;
  if(cam){
    // Let the room slide until about a third of it is off-screen, further when zoomed in.
    const maxX=(Math.max(0,r.w*scale-W)/2+W*.3)/dpr,maxY=(Math.max(0,r.h*scale-H)/2+H*.3)/dpr;
    cam.x=Math.max(-maxX,Math.min(maxX,cam.x));cam.y=Math.max(-maxY,Math.min(maxY,cam.y));
    x+=cam.x*dpr;y+=cam.y*dpr;
  }
  return {scale,x:Math.round(x),y:Math.round(y),W:CW,H:CH,dpr,cx:W/2,cy:top+avail/2};
}
// Zoom in on the cat and centre it, easing over a moment (instantly with reduced motion).
function focusCat(canvas,{zoom=2.25,instant=false,onChange}={}){
  const cam=camFor(canvas),c=canvas._cat,v=canvas._view;if(!cam||!c||!v)return;
  // Cat offset from the room's zoom centre in CSS px; room offsets scale linearly with zoom.
  const ox=(c.x+c.w/2-v.cx)/v.dpr,oy=(c.y+c.h/2-v.cy)/v.dpr,z=Math.max(cam.zoom,Math.min(MAX_ZOOM,zoom)),k=z/cam.zoom;
  const to={zoom:z,x:-(ox-cam.x)*k,y:-(oy-cam.y)*k},from={...cam},t0=performance.now();
  // Read the clock directly: rAF timestamps can lag performance.now() taken in the tap handler.
  const step=()=>{const p=instant?1:Math.max(0,Math.min(1,(performance.now()-t0)/350)),e=1-(1-p)**3;
    cam.zoom=from.zoom+(to.zoom-from.zoom)*e;cam.x=from.x+(to.x-from.x)*e;cam.y=from.y+(to.y-from.y)*e;
    canvas._camSync?.();onChange?.();if(p<1)requestAnimationFrame(step);};
  step();
}
// Drag to pan; two-finger pinch to zoom when `pinch` is on. A press that barely moves is a tap.
function enableRoomCamera(canvas,{pinch,onTap,onChange,resetButton,zoomIn,zoomOut}){
  const cam=camFor(canvas);if(!cam)return;
  const pts=new Map();let start=null,moved=false;
  let sync=()=>{if(resetButton)resetButton.hidden=camIsHome(cam);onChange?.();};
  const snap=()=>{const p=[...pts.values()],two=p.length>1;
    return {x:two?(p[0].x+p[1].x)/2:p[0].x,y:two?(p[0].y+p[1].y)/2:p[0].y,d:two?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0,camX:cam.x,camY:cam.y,zoom:cam.zoom};};
  canvas.style.touchAction='none';
  canvas.onpointerdown=e=>{
    try{canvas.setPointerCapture(e.pointerId);}catch{}pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===1)moved=false;start=snap();canvas.classList.add('dragging');
  };
  canvas.onpointermove=e=>{
    if(!pts.has(e.pointerId)){canvas.style.cursor=catHit(canvas,e.clientX,e.clientY)?'pointer':'';return;}
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});const now=snap();
    if(pts.size>1){
      if(!pinch||!start.d)return;
      // Zoom about the pinch midpoint so the spot under the fingers stays put.
      const rc=canvas.getBoundingClientRect(),px=start.x-(rc.left+rc.width/2),py=start.y-(rc.top+rc.height/2);
      const z=Math.max(1,Math.min(MAX_ZOOM,start.zoom*now.d/start.d)),k=z/start.zoom;
      cam.zoom=z;cam.x=px-(px-start.camX)*k+(now.x-start.x);cam.y=py-(py-start.camY)*k+(now.y-start.y);moved=true;
    }else{
      const dx=now.x-start.x,dy=now.y-start.y;if(Math.hypot(dx,dy)>6)moved=true;
      if(moved){cam.x=start.camX+dx;cam.y=start.camY+dy;}
    }
    sync();
  };
  const end=(e,tap)=>{
    if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);
    if(pts.size){start=snap();return;}
    canvas.classList.remove('dragging');if(tap&&!moved)onTap?.(e);
  };
  canvas.onpointerup=e=>end(e,true);canvas.onpointercancel=e=>end(e,false);
  if(resetButton)resetButton.onclick=()=>{cam.x=0;cam.y=0;cam.zoom=1;sync();};
  // Zoom buttons (laptop): step about the middle of the view.
  const zoomBy=f=>{const z=Math.max(1,Math.min(MAX_ZOOM,Math.round(cam.zoom*f*4)/4)),k=z/cam.zoom;cam.zoom=z;cam.x*=k;cam.y*=k;sync();};
  if(zoomIn)zoomIn.onclick=()=>zoomBy(1.5);
  if(zoomOut)zoomOut.onclick=()=>zoomBy(1/1.5);
  const baseSync=sync;sync=()=>{baseSync();if(zoomIn)zoomIn.disabled=cam.zoom>=MAX_ZOOM;if(zoomOut)zoomOut.disabled=cam.zoom<=1;};
  canvas._camSync=sync;
  sync();
}

const roomBuf=document.createElement('canvas'),glowBuf=document.createElement('canvas');
function drawRoom(canvas,time,cat,reaction,style){
  if(CAT_ATLAS.rooms[style])roomStyle=style;
  const ctx=canvas.getContext('2d'),view=fitCanvas(canvas);
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,view.W,view.H);
  drawSky(ctx,view.W,view.H,time,view.scale);
  canvas._view=view;canvas._cat=null;
  if(!roomImagesLoaded)return;
  const rm=CAT_ATLAS.rooms[roomStyle];
  if(roomBuf.width!==rm.w||roomBuf.height!==rm.h){roomBuf.width=rm.w;roomBuf.height=rm.h;}
  const b=roomBuf.getContext('2d');b.setTransform(1,0,0,1,0,0);b.globalCompositeOperation='source-over';b.clearRect(0,0,rm.w,rm.h);b.imageSmoothingEnabled=false;
  b.drawImage(getStaticLayer(),0,0);

  const pose=cat.alive?currentPose(time,cat,reaction):null;
  // Everything on the floor is depth-sorted by x + y (further back first).
  const items=ROOM.furniture.map(([n,x,y,z,sh],i)=>({depth:x+y+z/100+i/1000,draw:()=>{drawShadow(b,x,y,0,sh);drawSprite(b,n,x,y,z);}}));
  const [lx,ly]=ROOM.litter,[fx,fy]=ROOM.food,[wx,wy]=ROOM.water,[yx,yy]=ROOM.yarn;
  items.push({depth:lx+ly,draw:()=>{drawSprite(b,'litter_tray_mint',lx,ly);if(cat.cleanliness<35)drawLitterMess(b,lx,ly);}});
  items.push({depth:fx+fy,draw:()=>{drawShadow(b,fx,fy,0,6);drawSprite(b,cat.hunger>20?'bowl_sky_kibble':'bowl_sky_empty',fx,fy);}});
  items.push({depth:wx+wy,draw:()=>{drawShadow(b,wx,wy,0,6);drawSprite(b,cat.thirst>20?'bowl_blush_water':'bowl_blush_empty',wx,wy);}});
  if(!pose?.hideYarn)items.push({depth:yx+yy,draw:()=>drawSprite(b,'toy_yarn_pink',yx,yy)});
  let catXY=null;
  if(pose){
    // Small bias keeps the cat in front of the bed / litter tray it is sitting in.
    items.push({depth:pose.x+pose.y+(pose.z?1:0),draw:()=>{
      const [X,Y]=project(pose.x,pose.y,pose.z);catXY=[X,Y];
      if(!pose.z)drawShadow(b,pose.x,pose.y,0,8);
      drawCatFrame(b,cat.coat,pose.anim,pose.animT,X,Y+(pose.anim==='sleep'?2:0),pose.flip);
    }});
  }
  items.sort((a,c)=>a.depth-c.depth).forEach(it=>it.draw());

  // Night: a cool tint over the room, then warm light pooling around the floor lamp.
  const night=nightAmount();
  if(night>0){
    b.globalCompositeOperation='source-atop';
    b.fillStyle=`rgba(38,30,86,${.42*night})`;b.fillRect(0,0,rm.w,rm.h);
    const [lx2,ly2]=project(10,112,88),glow=b.createRadialGradient(lx2,ly2,4,lx2,ly2,120);
    glow.addColorStop(0,`rgba(255,214,150,${.5*night})`);glow.addColorStop(.45,`rgba(255,190,130,${.18*night})`);glow.addColorStop(1,'rgba(255,190,130,0)');
    // Mask the light to the room's own pixels, then add it, so nothing glows outside the room.
    if(glowBuf.width!==rm.w||glowBuf.height!==rm.h){glowBuf.width=rm.w;glowBuf.height=rm.h;}
    const gb=glowBuf.getContext('2d');gb.globalCompositeOperation='source-over';gb.clearRect(0,0,rm.w,rm.h);
    gb.fillStyle=glow;gb.fillRect(0,0,rm.w,rm.h);gb.globalCompositeOperation='destination-in';gb.drawImage(roomBuf,0,0);
    b.globalCompositeOperation='lighter';b.drawImage(glowBuf,0,0);
    b.globalCompositeOperation='source-over';
  }
  if(catXY){
    const [X,Y]=catXY;
    if(pose.hearts)drawHeart(b,X,Y,time);
    else if(!pose.reacting){
      const need=Object.keys(NEED_ICONS).filter(k=>cat[k]<35).sort((a,c)=>cat[a]-cat[c])[0];
      if(need)drawThought(b,X,Y,NEED_ICONS[need],time);
    }
    // Cat hit box in canvas pixels, for tap-to-pet and placing floating text.
    canvas._cat={x:view.x+(X-13)*view.scale,y:view.y+(Y-27)*view.scale,w:26*view.scale,h:28*view.scale};
  }
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(roomBuf,view.x,view.y,Math.round(rm.w*view.scale),Math.round(rm.h*view.scale));
}
function drawLitterMess(ctx,x,y){
  const [X,Y]=project(x,y);ctx.fillStyle='#8e7967';
  [[-10,-4],[3,-2],[9,-7],[-3,-8]].forEach(([dx,dy])=>ctx.fillRect(Math.round(X)+dx,Math.round(Y)+dy,2,2));
}
// Hit-test a pointer against the cat last drawn on this canvas.
function catHit(canvas,clientX,clientY){
  const c=canvas._cat;if(!c)return false;const r=canvas.getBoundingClientRect(),k=canvas.width/r.width;
  const x=(clientX-r.left)*k,y=(clientY-r.top)*k,pad=8*k; // forgiving tap target
  return x>=c.x-pad&&x<=c.x+c.w+pad&&y>=c.y-pad&&y<=c.y+c.h+pad;
}
// Cat head position in CSS pixels relative to the canvas.
function catAnchor(canvas){
  const c=canvas._cat,r=canvas.getBoundingClientRect();if(!c)return [r.width/2,r.height/2];
  const k=r.width/canvas.width;return [(c.x+c.w/2)*k,c.y*k];
}

// Static icons: a pack sprite (or a cat's first idle frame) centred at whole-number zoom.
function drawSpriteIcon(canvas,name){
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  const s=CAT_ATLAS.sprites[name];if(!roomImagesLoaded||!s)return;
  // Whole-number zoom for small sprites; big ones (the litter tray) halve so pixels stay even.
  const fit=Math.min((canvas.width-4)/s.w,(canvas.height-4)/s.h),k=fit>=1?Math.floor(fit):fit>=.5?.5:.25;
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(atlasImage,s.x,s.y,s.w,s.h,Math.round((canvas.width-s.w*k)/2),Math.round((canvas.height-s.h*k)/2),s.w*k,s.h*k);
}
function drawCatIcon(canvas,coat){
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  const c=CAT_ATLAS.cats[coat];if(!roomImagesLoaded||!c)return;
  const [sx,sy,w,h]=c.animations.idle.rects[0],k=Math.max(1,Math.floor(canvas.width/w));
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(atlasImage,sx,sy,w,h,Math.round((canvas.width-w*k)/2),Math.round((canvas.height-h*k)/2),w*k,h*k);
}
function drawRoomIcon(canvas,style){
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  const r=CAT_ATLAS.rooms[style];if(!roomImagesLoaded||!r)return;
  const k=Math.min(canvas.width/r.w,canvas.height/r.h);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(atlasImage,r.x,r.y,r.w,r.h,Math.round((canvas.width-r.w*k)/2),Math.round((canvas.height-r.h*k)/2),Math.round(r.w*k),Math.round(r.h*k));
}

// ---- Topic wheel: the cat runs inside a pixel exercise wheel; a fixed pointer marks the result ----
// [label, bright accent for text, muted segment fill blended towards the app's plum base]
const WHEEL_TIERS=[['Everyday','#ffb894','#c89285'],['Story','#ffe39a','#c8b18a'],['Explain','#8fe0bc','#77afa2'],['Opinion','#92cdf5','#7aa1cb'],['Workplace','#b4a2ff','#9282d2'],['Persuade','#ff9ec4','#c87fa8'],['Pressure','#ff8fa3','#c87590']];
const WHEEL_SEG=Math.PI*2/WHEEL_TIERS.length;
const wheelBuf=document.createElement('canvas');wheelBuf.width=wheelBuf.height=96;
// Segment index under the pointer (top) for a wheel rotated by `rot` radians.
function wheelTierAt(rot){const a=((-Math.PI/2-rot)%(Math.PI*2)+Math.PI*4)%(Math.PI*2);return Math.floor(a/WHEEL_SEG)%WHEEL_TIERS.length;}
// Rotation that parks the pointer inside segment `i` (with a little jitter so it isn't always dead centre).
function wheelRotFor(i,jitter=0){return -Math.PI/2-(i+.5+jitter)*WHEEL_SEG;}
function drawCatWheel(canvas,rot,coat,anim,animT){
  const b=wheelBuf.getContext('2d'),cx=48,cy=46,R=38;b.clearRect(0,0,96,96);
  // stand
  b.fillStyle='#2a1f35';b.fillRect(cx-22,cy+R-6,6,18);b.fillRect(cx+16,cy+R-6,6,18);b.fillRect(cx-28,cy+R+10,56,4);
  b.fillStyle='#5c4d91';b.fillRect(cx-21,cy+R-5,4,15);b.fillRect(cx+17,cy+R-5,4,15);
  b.save();b.translate(cx,cy);b.rotate(rot);
  WHEEL_TIERS.forEach(([,,col],i)=>{b.beginPath();b.moveTo(0,0);b.arc(0,0,R,i*WHEEL_SEG,(i+1)*WHEEL_SEG);b.closePath();b.fillStyle=col;b.fill();});
  b.strokeStyle='#2a1f35';b.lineWidth=2;
  WHEEL_TIERS.forEach((_,i)=>{const a=i*WHEEL_SEG;b.beginPath();b.moveTo(0,0);b.lineTo(Math.cos(a)*R,Math.sin(a)*R);b.stroke();});
  b.lineWidth=4;b.beginPath();b.arc(0,0,R-1,0,Math.PI*2);b.stroke();
  b.fillStyle='#d6c9ff';for(let i=0;i<14;i++){const a=i*Math.PI/7;b.fillRect(Math.round(Math.cos(a)*(R-1))-1,Math.round(Math.sin(a)*(R-1))-1,2,2);}
  b.restore();
  b.fillStyle='#2a1f35';b.fillRect(cx-4,cy-4,8,8);b.fillStyle='#d6c9ff';b.fillRect(cx-2,cy-2,4,4);
  // cat running on the inside of the rim
  if(roomImagesLoaded){const c=CAT_ATLAS.cats[coat]||CAT_ATLAS.cats[CAT_COATS[0]],a=c.animations[anim];
    let i=Math.floor(animT*a.fps);i=a.loop?i%a.frames:Math.min(i,a.frames-1);const [sx,sy,w,h]=a.rects[i];
    b.drawImage(atlasImage,sx,sy,w,h,cx-16,cy+R-4-29,w,h);}
  // pointer
  b.fillStyle='#2a1f35';b.fillRect(cx-6,0,12,3);b.fillRect(cx-5,3,10,2);b.fillRect(cx-4,5,8,2);b.fillRect(cx-3,7,6,2);b.fillRect(cx-2,9,4,2);
  b.fillStyle='#ffe39a';b.fillRect(cx-4,1,8,2);b.fillRect(cx-3,3,6,2);b.fillRect(cx-2,5,4,2);b.fillRect(cx-1,7,2,2);
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);
  const k=Math.max(1,Math.floor(Math.min(canvas.width,canvas.height)/96));
  ctx.drawImage(wheelBuf,Math.round((canvas.width-96*k)/2),Math.round((canvas.height-96*k)/2),96*k,96*k);
}
