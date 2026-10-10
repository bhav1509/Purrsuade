// Cat room drawn from the Cat Game Pixel Pack atlas (assets/cat-game-atlas.png + .js).
// World units follow the pack: x runs along the right back wall, y along the left one,
// both 0–180. Screen = floorOrigin + (x - y, (x + y) / 2 - z). Everything is drawn 1:1
// into room space, then the whole room is scaled to fit the canvas.
const atlasImage=new Image();
let atlasPixels=null;
const roomAssetsReady=new Promise((resolve,reject)=>{atlasImage.onload=resolve;atlasImage.onerror=()=>reject(new Error('Could not load cat-game-atlas.png'));});
atlasImage.src=new URL('assets/cat-game-atlas.png',document.currentScript.src).href;
let roomImagesLoaded=false;
roomAssetsReady.then(()=>{roomImagesLoaded=true;},()=>{});

const CAT_COATS=Object.keys(CAT_ATLAS.cats);
const ROOM_STYLES=Object.keys(CAT_ATLAS.rooms);
const CARE_ICONS={food:'bowl_sky_kibble',water:'bowl_blush_water',litter:'litter_tray_mint',play:'toy_yarn_pink',treat:'treat_jar_pink'};
// What the cat's thought bubble shows when that need is lowest.
const NEED_ICONS={hunger:'bowl_sky_kibble',thirst:'bowl_blush_water',cleanliness:'litter_scoop_mint',happiness:'toy_yarn_pink'};

const ROOM={
  walls:[['window_curtain_rose_left',40,50],['art_plant_left',122,66],['art_heart_left',150,74],['window_blind_white_right',30,54],['art_cat_right',100,80],['art_waves_right',124,90],['wall_clock_blue_right',150,96]],
};
// Everything on the floor can be moved in arrange mode. [x, y] is the default spot; `pad` keeps the
// footprint inside the room; `spot` is where the cat stands to use it ([dx, dy, z, face left]);
// `carries` are items that sit on top and move with it ([sprite, dx, dy, z]).
const ROOM_ITEMS=[
  {id:'rug',sprite:'rug_sage',x:100,y:104,pad:30,flat:true,spot:[0,0,0,false]},
  {id:'plant',sprite:'plant_big_sky',x:16,y:18,pad:8,shadow:9},
  {id:'shelf',sprite:'shelf_sage',x:128,y:2,pad:2,carries:[['plant_small_blush',22,7,62],['treat_jar_pink',12,11,62]]},
  {id:'bed',sprite:'basket_bed_sage',x:54,y:54,pad:16,shadow:19,spot:[0,0,4,false]},
  {id:'post',sprite:'scratch_post_oak',x:28,y:150,pad:9,shadow:11},
  {id:'lamp',sprite:'floor_lamp_cream',x:10,y:112,pad:6,shadow:7},
  {id:'cushion',sprite:'floor_cushion_lavender',x:170,y:118,pad:9,shadow:9,spot:[-20,-6,0,true]},
  {id:'litter',sprite:'litter_tray_mint',x:160,y:62,pad:14,spot:[0,0,3,false]},
  {id:'food',sprite:'bowl_sky_kibble',bowl:['bowl_sky_kibble','bowl_sky_empty','hunger'],x:124,y:160,pad:6,shadow:6,spot:[-6,2,0,false]},
  {id:'water',sprite:'bowl_blush_water',bowl:['bowl_blush_water','bowl_blush_empty','thirst'],x:150,y:146,pad:6,shadow:6,spot:[-6,2,0,false]},
  {id:'yarn',sprite:'toy_yarn_pink',x:84,y:132,pad:4,spot:[-6,0,0,false]},
];
// Where the cat stands for each spot: [x, y, z, face left]. Item spots follow the layout.
const SPOT={window:[24,74,0,true]};
let roomLayout={};
const itemPos=it=>roomLayout[it.id]||[it.x,it.y];
function updateSpots(){
  const fix=v=>Math.max(4,Math.min(176,v));
  for(const it of ROOM_ITEMS){if(!it.spot)continue;const [x,y]=itemPos(it),[dx,dy,z,f]=it.spot;SPOT[it.id]=[fix(x+dx),fix(y+dy),z,f];}
}
// Saved positions from the app ({id: [x, y]}). The cat walks to the new spots on its next move.
function setRoomLayout(layout,time){
  roomLayout=layout||{};updateSpots();
  if(time!=null&&catPlan){const p=poseAt(catPlan,time);catPlan=buildPlan(time,[p.x,p.y,p.z,p.flip],[{to:'bed'},{at:'bed',anim:'idle',dur:.5}],false);planReaction=null;}
}
updateSpots();

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
  sick:[{at:'bed',anim:'sleep',dur:12}],
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
function resetCatPlan(){catPlan=null;planReaction=null;planMood=null;}
function currentPose(time,cat,reaction){
  // Below 1 heart the cat is sick: it stays curled up in bed and ignores toys and treats.
  const health=(cat.hunger+cat.thirst+cat.cleanliness+cat.happiness)/4,mood=health<15?'sick':cat.happiness<25?'tired':'happy';
  if(reaction&&mood==='sick'&&['play','treat','cheer'].includes(reaction.type))planReaction=reaction;
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
// Thought bubble: a puffy pixel cloud (cached per size) with two little puffs trailing to the cat.
const cloudCache={};
function thoughtCloud(w,h){
  const key=w+'x'+h;if(cloudCache[key])return cloudCache[key];
  const M=6,c=document.createElement('canvas');c.width=w+M*2;c.height=h+M*2;const g=c.getContext('2d');
  const blobs=[[w/2,h/2,w/2-2.5,h/2-2],[w*.27,h*.3,h*.3,h*.3],[w*.52,h*.22,h*.34,h*.34],[w*.76,h*.32,h*.28,h*.28],[w*.12,h*.56,h*.28,h*.28],[w*.88,h*.58,h*.27,h*.27],[w*.34,h*.78,h*.26,h*.24],[w*.66,h*.8,h*.25,h*.23]];
  const inside=(x,y)=>blobs.some(([cx,cy,rx,ry])=>((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1);
  for(let y=-M;y<h+M;y++)for(let x=-M;x<w+M;x++){
    if(inside(x,y)){g.fillStyle=inside(x,y+2)?'#fffaf2':'#efe4d8';g.fillRect(x+M,y+M,1,1);}
    else if([[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]].some(([a,b2])=>inside(x+a,y+b2))){g.fillStyle='#5b4a44';g.fillRect(x+M,y+M,1,1);}}
  return cloudCache[key]=c;
}
function drawThought(ctx,X,Y,icon,time){
  const s=CAT_ATLAS.sprites[icon],w=s.w+14,h=s.h+12,bob=Math.floor(time/600)%2;
  const x=Math.round(X)+1,y=Math.round(Y)-38-h-bob;
  ctx.drawImage(thoughtCloud(w,h),x-6,y-6);
  // trailing puffs, getting smaller towards the cat's head
  const puff=(px,py,r)=>{ctx.fillStyle='#5b4a44';ctx.fillRect(px-r,py-r+1,r*2+1,r*2-1);ctx.fillRect(px-r+1,py-r,r*2-1,r*2+1);ctx.fillStyle='#fffaf2';ctx.fillRect(px-r+1,py-r+1,r*2-1,r*2-1);};
  puff(x+4,y+h+3,2);puff(x+1,y+h+8,1);
  ctx.drawImage(atlasImage,s.x,s.y,s.w,s.h,x+Math.round((w-s.w)/2),y+Math.round((h-s.h)/2),s.w,s.h);
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
  if(cam&&H/W>(r.h/r.w)*1.2)fit=Math.min(fit*1.65,(usePad?H-pt-pb:H)/r.h);
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
// `grab(e)` may claim a press (arrange mode) by returning {move, end}; otherwise the press pans.
function enableRoomCamera(canvas,{pinch,onTap,onChange,resetButton,zoomIn,zoomOut,grab}){
  const cam=camFor(canvas);if(!cam)return;
  const pts=new Map();let start=null,moved=false,held=null;
  let sync=()=>{if(resetButton)resetButton.hidden=camIsHome(cam);onChange?.();};
  const snap=()=>{const p=[...pts.values()],two=p.length>1;
    return {x:two?(p[0].x+p[1].x)/2:p[0].x,y:two?(p[0].y+p[1].y)/2:p[0].y,d:two?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0,camX:cam.x,camY:cam.y,zoom:cam.zoom};};
  canvas.style.touchAction='none';
  canvas.onpointerdown=e=>{
    try{canvas.setPointerCapture(e.pointerId);}catch{}pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===1){moved=false;held=grab?.(e)||null;}else if(held){held.end();held=null;}
    start=snap();canvas.classList.add('dragging');
  };
  canvas.onpointermove=e=>{
    if(!pts.has(e.pointerId)){canvas.style.cursor=arrange.on?(itemAt(canvas,e.clientX,e.clientY)||graveAt(canvas,e.clientX,e.clientY)?'grab':''):catHit(canvas,e.clientX,e.clientY)?'pointer':'';return;}
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(held){moved=true;held.move(e);onChange?.();return;}
    const now=snap();
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
    if(held){held.end();held=null;}
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

// ---- Garden: a floating grass island around the room, drawn once in room-space pixels ----
// The layer is larger than the room sprite by GARDEN_PAD on each side; the room is drawn on top of it.
const GARDEN_PAD={x:200,top:20,bottom:110},GARDEN_G=100;
let gardenLayer=null,gardenTint={night:-1,canvas:null};
function hash(n){n=Math.sin(n*127.1+311.7)*43758.5453;return n-Math.floor(n);}
function pixelBlob(ctx,X,Y,rx,ry,col){for(let dy=-ry;dy<=ry;dy++){const h=Math.round(rx*Math.sqrt(Math.max(0,1-(dy/ry)**2)));ctx.fillStyle=col;ctx.fillRect(Math.round(X)-h,Math.round(Y)+dy,h*2,1);}}
// ---- Cemetery: a headstone in the front-left garden for each cat that has died (newest six shown) ----
// Default spots in the front-left garden, near the path; each can be moved in arrange mode (layout key 'g<id>').
const GRAVE_SPOTS=[[150,202],[124,202],[98,202],[150,226],[124,226],[98,226]];
let roomGraves=[];
function setRoomGraves(list){roomGraves=Array.isArray(list)?list:[];}
// The newest six graves with their positions (moved or default).
function shownGraves(){return roomGraves.slice(-GRAVE_SPOTS.length).map((gr,i)=>{const [x,y]=roomLayout['g'+gr.id]||GRAVE_SPOTS[i];return {gr,x,y};});}
// Graves get their own layer (rebuilt only when they move), drawn over the garden in room space.
// Graves in front of the room (x or y past its front walls) are drawn over it; the rest behind it.
const graveLayers={};
function gravesFor(night,front){
  const G=gardenLayer,list=shownGraves().filter(g=>(g.x>=190||g.y>=190)===front),n=Math.round(night*20)/20,key=JSON.stringify([list.map(g=>[g.gr.id,g.x,g.y]),arrange.drag,n,roomStyle]);
  if(!G||!list.length)return null;
  const old=graveLayers[front];if(old?._key===key)return old;
  const c=old&&old.width===G.width&&old.height===G.height?old:document.createElement('canvas');c.width=G.width;c.height=G.height;
  const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.save();g.translate(GARDEN_PAD.x,GARDEN_PAD.top);
  list.slice().sort((a,b)=>(a.x+a.y)-(b.x+b.y)).forEach(({gr,x,y})=>drawGrave(g,x,y,arrange.drag==='g'+gr.id));
  g.restore();
  if(n>0){g.globalCompositeOperation='source-atop';g.fillStyle=`rgba(38,30,86,${.5*n})`;g.fillRect(0,0,c.width,c.height);g.globalCompositeOperation='source-over';}
  c._key=key;return graveLayers[front]=c;
}
const STONE=['....#######....','...#hhssssd#...','..#hhsssssssd#.','.#hhssssssssd#.','.#hhsssessssd#.','.#hhsssessssd#.','.#hhseeeeessd#.','.#hhsssessssd#.','.#hhsssessssd#.','.#hhsssessssd#.','.#hhsssessssd#.','.#hhssssssssd#.','.#hhssssssssd#.','.#hheeeeeeesd#.','.#hhssssssssd#.','.#hhseeeeessd#.','.#hhssssssssd#.','###############','#bbbbbbbbbbbbb#','###############'],STONE_COL={'#':'#4d4660',h:'#e4e0ee',s:'#c3bdd3',d:'#9d96b2',e:'#7f7896',b:'#a8a1bd'};
function drawGrave(g,x,y,lifted){
  const [X0,Y0]=project(x,y,lifted?3:0),X=Math.round(X0),Y=Math.round(Y0),H=STONE.length;
  pixelBlob(g,X,Y+2,13,4,'#6f9f5c');pixelBlob(g,X,Y+1,12,3,'#8a6646');pixelBlob(g,X,Y,11,3,'#9ccf7f');
  STONE.forEach((row,j)=>[...row].forEach((c,i)=>{if(c!=='.'){g.fillStyle=STONE_COL[c];g.fillRect(X-7+i,Y-H+1+j,1,1);}}));
  [['#ff9ec4',-10],['#ffe39a',9],['#fbf6ee',-8],['#b4a2ff',11]].forEach(([col,dx])=>{g.fillStyle='#5d9a4c';g.fillRect(X+dx,Y-1,1,3);g.fillStyle=col;g.fillRect(X+dx-1,Y-2,3,1);g.fillRect(X+dx,Y-3,1,3);});
}
// The grave under a pointer, or null. Graves live in room space like everything else.
function graveAt(canvas,clientX,clientY){
  const p=roomPoint(canvas,clientX,clientY);if(!p)return null;const shown=shownGraves();
  const hits=shown.filter(({x,y})=>{const [X,Y]=project(x,y);return p[0]>=X-11&&p[0]<=X+11&&p[1]>=Y-STONE.length-2&&p[1]<=Y+4;}).sort((a,c)=>(c.x+c.y)-(a.x+a.y));
  if(hits.length)return hits[0].gr;
  return null;
}

function buildGarden(){
  const rm=CAT_ATLAS.rooms[roomStyle],P=GARDEN_PAD,c=document.createElement('canvas');
  c.width=rm.w+P.x*2;c.height=rm.h+P.top+P.bottom;const g=c.getContext('2d');g.translate(P.x,P.top);
  const G=GARDEN_G,[ox,oy]=rm.floorOrigin,top=oy-G,bot=oy+180+G,mid=(top+bot)/2,T=12;
  // island sides: soil under the front-left and front-right edges
  for(let y=Math.round(mid);y<=bot+T;y++){const k=Math.max(0,bot-y),hw=2*Math.min(bot-mid,k+T);
    const hwTop=2*Math.max(0,bot-y);g.fillStyle='#8a6646';g.fillRect(ox-hw,y,hw-hwTop,1);g.fillStyle='#a07a55';g.fillRect(ox+hwTop,y,hw-hwTop,1);}
  for(let i=0;i<260;i++){const t=hash(i+.3),side=t<.5?-1:1,u=hash(i+9.1),y=mid+u*(bot-mid),hw=2*(bot-y),dy=hash(i+4.2)*T;
    g.fillStyle=hash(i+2)<.5?'#74553a':'#b58c63';g.fillRect(Math.round(ox+side*(hw+hash(i+7)*0)-(side<0?1:0)*2),Math.round(y+2+dy),2,1);}
  // grass top, a pixel row at a time so the diamond edges stay crisp
  for(let y=top;y<=bot;y++){const hw=2*Math.min(y-top,bot-y);g.fillStyle='#9ccf7f';g.fillRect(ox-hw,y,hw*2,1);}
  // grass fringe hanging over the soil edge
  for(let i=0;i<120;i++){const u=hash(i+20.5),y=mid+u*(bot-mid),hw=2*(bot-y),side=hash(i+3.3)<.5?-1:1;g.fillStyle='#7fb86a';g.fillRect(Math.round(ox+side*hw)-1,Math.round(y)+1,2,1+Math.floor(hash(i+5)*3));}
  const inside=(x,y)=>x>-G+4&&y>-G+4&&x<180+G-4&&y<180+G-4,inRoom=(x,y)=>x>-6&&y>-6&&x<186&&y<186;
  // soft shadow where the room sits on the grass
  for(let y=oy;y<=oy+180+8;y++){const hw=2*Math.min(y-oy,oy+188-y);g.fillStyle='#86bb6c';g.fillRect(ox-hw-6,y+4,hw*2+12,1);}
  // texture: light and dark tufts
  for(let i=0;i<1400;i++){const x=-G+hash(i)*(180+2*G),y=-G+hash(i+.5)*(180+2*G);if(!inside(x,y)||inRoom(x,y))continue;
    const [X,Y]=project(x,y),dark=hash(i+.9)<.55;g.fillStyle=dark?'#7fb86a':'#b5dd8f';
    g.fillRect(Math.round(X),Math.round(Y),1,1);if(dark){g.fillRect(Math.round(X)-1,Math.round(Y)-1,1,1);g.fillRect(Math.round(X)+1,Math.round(Y)-1,1,1);}}
  // stepping-stone path out from the front of the room
  for(let k=0;k<5;k++){const t=196+k*15,[X,Y]=project(t+(k%2?3:-3),t);pixelBlob(g,X,Y+1,6,2,'#7d8a74');pixelBlob(g,X,Y,6,2,'#d9d2c3');g.fillStyle='#ece6da';g.fillRect(Math.round(X)-3,Math.round(Y)-1,3,1);}
  // pond
  {const [X,Y]=project(250,140);pixelBlob(g,X,Y,19,9,'#6f9f5c');pixelBlob(g,X,Y,17,8,'#87b9d8');pixelBlob(g,X+2,Y+1,13,6,'#9fcde6');g.fillStyle='#e6f4f8';g.fillRect(Math.round(X)-8,Math.round(Y)-3,5,1);g.fillRect(Math.round(X)+5,Math.round(Y)+2,3,1);
    pixelBlob(g,X+10,Y-2,3,1,'#6cc08e');}
  // flowers
  const FL=['#ff9ec4','#ffe39a','#fbf6ee','#b4a2ff'];
  for(let i=0;i<170;i++){const x=-G+hash(i+50)*(180+2*G),y=-G+hash(i+51)*(180+2*G);if(!inside(x,y)||inRoom(x,y))continue;const [X,Y]=project(x,y);
    if(Math.abs(X-ox)<9&&Y>oy+190)continue;const col=FL[i%4];g.fillStyle='#5d9a4c';g.fillRect(Math.round(X),Math.round(Y),1,2);
    g.fillStyle=col;g.fillRect(Math.round(X)-1,Math.round(Y)-1,3,1);g.fillRect(Math.round(X),Math.round(Y)-2,1,3);g.fillStyle='#ffe39a';if(col!=='#ffe39a')g.fillRect(Math.round(X),Math.round(Y)-1,1,1);}
  // bushes
  const bush=(x,y,rr,berry)=>{const [X,Y]=project(x,y);pixelBlob(g,X,Y,rr+2,Math.ceil(rr/2),'#6f9f5c');pixelBlob(g,X,Y-rr+1,rr+1,rr,'#4f8a49');pixelBlob(g,X-1,Y-rr,rr,rr-1,'#6cae5c');pixelBlob(g,X-3,Y-rr-3,rr-4,rr-5,'#8fcd73');
    if(berry)for(let j=0;j<5;j++){g.fillStyle=berry;g.fillRect(Math.round(X-rr+2+hash(j+x)*(rr*2-4)),Math.round(Y-rr*1.6+hash(j+y)*rr*1.3),2,2);}};
  bush(205,150,8,'#ff9ec4');bush(155,210,9);bush(232,58,7,'#fbf6ee');bush(60,228,8,'#ffe39a');bush(245,205,6);bush(208,96,6);
  // trees at the island's side corners
  const tree=(x,y,h)=>{const [X,Y]=project(x,y);pixelBlob(g,X,Y,10,4,'#6f9f5c');g.fillStyle='#7a5a3f';g.fillRect(Math.round(X)-2,Math.round(Y)-h,4,h);g.fillStyle='#9a7650';g.fillRect(Math.round(X)-2,Math.round(Y)-h,1,h);
    const cy=Y-h-6;pixelBlob(g,X,cy+2,15,12,'#3f7a45');pixelBlob(g,X-1,cy,14,11,'#5a9a52');pixelBlob(g,X-4,cy-4,9,7,'#7cbd66');pixelBlob(g,X-6,cy-7,4,3,'#a3d98a');};
  tree(-40,205,20);tree(205,-40,22);tree(-20,250,16);
  return c;
}
function gardenFor(night){
  const key=roomStyle;
  if(!gardenLayer||gardenLayer._key!==key){gardenLayer=buildGarden();gardenLayer._key=key;gardenTint.night=-1;gardenTint.style=null;}
  if(night<=0)return gardenLayer;
  const n=Math.round(night*20)/20;
  if(gardenTint.night!==n||gardenTint.style!==roomStyle){const c=gardenTint.canvas||(gardenTint.canvas=document.createElement('canvas'));c.width=gardenLayer.width;c.height=gardenLayer.height;
    const x=c.getContext('2d');x.drawImage(gardenLayer,0,0);x.globalCompositeOperation='source-atop';x.fillStyle=`rgba(38,30,86,${.5*n})`;x.fillRect(0,0,c.width,c.height);gardenTint.night=n;gardenTint.style=roomStyle;}
  return gardenTint.canvas;
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
  // Arrange mode: a faint floor grid, and a footprint under the item being moved.
  if(arrange.on){drawFloorGrid(b);const it=arrange.drag&&ROOM_ITEMS.find(i=>i.id===arrange.drag);if(it){const [x,y]=itemPos(it);drawFootprint(b,x,y,Math.max(6,it.pad));}}
  // Rugs lie flat under everything; the rest is depth-sorted by x + y (further back first).
  const items=[];
  ROOM_ITEMS.forEach((it,i)=>{
    if(it.id==='yarn'&&pose?.hideYarn)return;
    const [x,y]=itemPos(it),lift=arrange.drag===it.id?3:0,name=typeof it.sprite==='function'?it.sprite(cat):it.sprite;
    const draw=()=>{drawShadow(b,x,y,0,it.shadow);
      if(it.bowl){const [full,empty,need]=it.bowl,lv=cat[need],frac=lv>60?1:lv>30?.6:lv>10?.3:0,s=CAT_ATLAS.sprites[full],[X,Y]=project(x,y,lift);
        b.drawImage(bowlLevel(full,empty,frac),Math.round(X-s.anchor[0]),Math.round(Y-s.anchor[1]));}
      else drawSprite(b,name,x,y,lift);(it.carries||[]).forEach(([n,dx,dy,z])=>drawSprite(b,n,x+dx,y+dy,z+lift));
      if(it.id==='litter')drawLitterMess(b,x,y,cat.cleanliness,time);};
    if(it.flat)draw();else items.push({depth:x+y+i/1000+(lift?400:0),draw});
  });
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
    const [lpx,lpy]=itemPos(ROOM_ITEMS.find(i=>i.id==='lamp')),[lx2,ly2]=project(lpx,lpy,88),glow=b.createRadialGradient(lx2,ly2,4,lx2,ly2,120);
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
  const gl=gardenFor(night),P=GARDEN_PAD;
  ctx.drawImage(gl,Math.round(view.x-P.x*view.scale),Math.round(view.y-P.top*view.scale),Math.round(gl.width*view.scale),Math.round(gl.height*view.scale));
  const layer=c=>{if(c)ctx.drawImage(c,Math.round(view.x-P.x*view.scale),Math.round(view.y-P.top*view.scale),Math.round(c.width*view.scale),Math.round(c.height*view.scale));};
  layer(gravesFor(night,false));
  ctx.drawImage(roomBuf,view.x,view.y,Math.round(rm.w*view.scale),Math.round(rm.h*view.scale));
  layer(gravesFor(night,true));
}
// Dirty litter: poop piles appear as Clean drops (below 60 / 40 / 20), smell lines below 40, flies below 20.
const POOP=['..a..','.aba.','abbba','.ccc.'],POOP_COL={a:'#8a6244',b:'#6b4a32',c:'#4e3524'};
function drawLitterMess(ctx,x,y,clean,time){
  const [X0,Y0]=project(x,y),X=Math.round(X0),Y=Math.round(Y0),n=clean<20?3:clean<40?2:clean<60?1:0;
  [[-9,-7],[4,-4],[-2,-11]].slice(0,n).forEach(([dx,dy])=>POOP.forEach((row,j)=>[...row].forEach((c,i)=>{if(c!=='.'){ctx.fillStyle=POOP_COL[c];ctx.fillRect(X+dx+i,Y+dy+j,1,1);}})));
  const t=time/1000;
  if(clean<40)for(let k=0;k<3;k++){const ph=(t*7+k*5)%14,bx=X-7+k*7;
    for(let j=0;j<7;j++){const yy=Y-16-ph-j*1.4,a=Math.max(0,.75-(ph+j)/20);ctx.fillStyle=`rgba(120,190,70,${Math.min(1,a*1.3)})`;const sx=Math.round(bx+Math.sin((yy+t*6)*.7)*1.6);ctx.fillRect(sx,Math.round(yy),2,1);}}
  if(clean<20)for(let k=0;k<2;k++){const fx=X+Math.cos(t*3.1+k*3)*11,fy=Y-15+Math.sin(t*4.7+k*1.7)*4;
    ctx.fillStyle='#2b2230';ctx.fillRect(Math.round(fx),Math.round(fy),1,1);if(Math.floor(t*14+k)%2){ctx.fillStyle='rgba(235,240,255,.85)';ctx.fillRect(Math.round(fx)-1,Math.round(fy)-1,1,1);ctx.fillRect(Math.round(fx)+1,Math.round(fy)-1,1,1);}}
}
// Bowl with its food / water at a fill level: the empty bowl, plus the lower part of whatever the full
// sprite adds on top (kibble or water), so less is visible as the need drops. Cached per level.
const bowlCache={};
function atlasData(){if(!atlasPixels){const c=document.createElement('canvas');c.width=atlasImage.width;c.height=atlasImage.height;const x2=c.getContext('2d');x2.drawImage(atlasImage,0,0);atlasPixels=x2.getImageData(0,0,c.width,c.height);}return atlasPixels;}
function bowlLevel(full,empty,frac){
  const key=full+frac;if(bowlCache[key])return bowlCache[key];
  const F=CAT_ATLAS.sprites[full],E=CAT_ATLAS.sprites[empty],A=atlasData(),w=F.w,h=F.h,c=document.createElement('canvas');c.width=w;c.height=h;
  const x=c.getContext('2d'),img=x.createImageData(w,h),px=(s,i,j)=>{const o=((s.y+j)*A.width+s.x+i)*4;return [A.data[o],A.data[o+1],A.data[o+2],A.data[o+3]];};
  let x0=w,x1=-1,y0=h,y1=-1;const diff=[];
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const f=px(F,i,j),e=(i<E.w&&j<E.h)?px(E,i,j):[0,0,0,0],d=f.some((v,k)=>Math.abs(v-e[k])>8);diff.push(d);if(d){x0=Math.min(x0,i);x1=Math.max(x1,i);y0=Math.min(y0,j);y1=Math.max(y1,j);}}
  // Less food / water = a smaller pile or puddle, sinking towards the bottom of the bowl.
  const rx=(x1-x0+1)/2,ry=(y1-y0+1)/2,cx=x0+rx-.5,cy=y0+ry-.5+ry*(1-frac)*.6,k=Math.sqrt(frac);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const o=(j*w+i)*4,inside=frac>0&&((i-cx)/(rx*k+.5))**2+((j-cy)/(ry*k+.5))**2<=1,use=diff[j*w+i]&&inside?px(F,i,j):(i<E.w&&j<E.h?px(E,i,j):[0,0,0,0]);img.data.set(use,o);}
  x.putImageData(img,0,0);return bowlCache[key]=c;
}
// ---- Arrange mode: drag floor items around; positions snap to a 2-unit grid inside the room ----
const arrange={on:false,drag:null};
function drawFloorGrid(ctx){
  ctx.fillStyle='rgba(255,255,255,.22)';
  for(let k=20;k<180;k+=20)for(let t=0;t<=180;t+=2){let [X,Y]=project(k,t);ctx.fillRect(Math.round(X),Math.round(Y),1,1);[X,Y]=project(t,k);ctx.fillRect(Math.round(X),Math.round(Y),1,1);}
}
function drawFootprint(ctx,x,y,r){
  ctx.fillStyle='rgba(143,224,188,.45)';
  for(let t=-r;t<=r;t+=.5)for(const [a,c] of [[x+t,y-r],[x+t,y+r],[x-r,y+t],[x+r,y+t]]){const [X,Y]=project(a,c);ctx.fillRect(Math.round(X),Math.round(Y),1,1);}
}
// Canvas pointer -> room-space pixel, and -> floor coordinates (z = 0).
function roomPoint(canvas,clientX,clientY){
  const v=canvas._view,rc=canvas.getBoundingClientRect();if(!v)return null;
  const k=canvas.width/rc.width;return [((clientX-rc.left)*k-v.x)/v.scale,((clientY-rc.top)*k-v.y)/v.scale];
}
function floorAt(px,py){const [ox,oy]=CAT_ATLAS.rooms[roomStyle].floorOrigin,a=px-ox,c=2*(py-oy);return [(a+c)/2,(c-a)/2];}
// Opaque-pixel test against the atlas, so a click on a bed's empty corner doesn't grab it.
function spriteHit(name,x,y,z,px,py){
  const s=CAT_ATLAS.sprites[name],[X,Y]=project(x,y,z),sx=Math.floor(px-(Math.round(X-s.anchor[0]))),sy=Math.floor(py-(Math.round(Y-s.anchor[1])));
  if(sx<0||sy<0||sx>=s.w||sy>=s.h)return false;
  atlasData();
  return atlasPixels.data[((s.y+sy)*atlasPixels.width+(s.x+sx))*4+3]>40;
}
// Front-most item under the pointer (the rug only if nothing stands on that pixel).
function itemAt(canvas,clientX,clientY){
  const p=roomPoint(canvas,clientX,clientY);if(!p||!roomImagesLoaded)return null;
  const order=ROOM_ITEMS.map((it,i)=>({it,d:it.flat?-1:itemPos(it)[0]+itemPos(it)[1]+i/1000})).sort((a,c)=>c.d-a.d);
  for(const {it} of order){const [x,y]=itemPos(it),name=typeof it.sprite==='function'?it.sprite({hunger:50,thirst:50}):it.sprite;
    if(spriteHit(name,x,y,0,...p)||(it.carries||[]).some(([n,dx,dy,z])=>spriteHit(n,x+dx,y+dy,z,...p)))return it;}
  return null;
}
// Start dragging the item under the pointer; returns move/end handlers, or null if nothing is there.
// Graves stay on the garden island and out of the room.
function clampGrave(x,y){
  const lo=-GARDEN_G+14,hi=180+GARDEN_G-14;x=Math.max(lo,Math.min(hi,x));y=Math.max(lo,Math.min(hi,y));
  if(x>-16&&x<196&&y>-16&&y<196){const opts=[[-16,y],[196,y],[x,-16],[x,196]];[x,y]=opts.sort((a,b)=>Math.hypot(a[0]-x,a[1]-y)-Math.hypot(b[0]-x,b[1]-y))[0];}
  return [Math.round(x/2)*2,Math.round(y/2)*2];
}
function grabGrave(canvas,e,{onMove,onDrop}={}){
  const gr=graveAt(canvas,e.clientX,e.clientY);if(!gr)return null;
  const g=shownGraves().find(v=>v.gr===gr),p=roomPoint(canvas,e.clientX,e.clientY),[fx,fy]=floorAt(...p),off=[g.x-fx,g.y-fy],key='g'+gr.id;
  arrange.drag=key;
  return {
    move(ev){const q=roomPoint(canvas,ev.clientX,ev.clientY);if(!q)return;const [gx,gy]=floorAt(...q);roomLayout={...roomLayout,[key]:clampGrave(gx+off[0],gy+off[1])};onMove?.();},
    end(){arrange.drag=null;onDrop?.(roomLayout,key);},
  };
}
function grabItem(canvas,e,{onMove,onDrop}={}){
  const grave=grabGrave(canvas,e,{onMove,onDrop});if(grave)return grave;
  const it=itemAt(canvas,e.clientX,e.clientY);if(!it)return null;
  const p=roomPoint(canvas,e.clientX,e.clientY),[fx,fy]=floorAt(...p),[x0,y0]=itemPos(it),off=[x0-fx,y0-fy];
  arrange.drag=it.id;
  const clampTo=v=>Math.max(it.pad,Math.min(180-it.pad,Math.round(v/2)*2));
  return {
    move(ev){const q=roomPoint(canvas,ev.clientX,ev.clientY);if(!q)return;const [gx,gy]=floorAt(...q);
      roomLayout={...roomLayout,[it.id]:[clampTo(gx+off[0]),clampTo(gy+off[1])]};updateSpots();onMove?.();},
    end(){arrange.drag=null;onDrop?.(roomLayout,it.id);},
  };
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
// Everything (backdrop, wheel, labels, cat, pointer) is drawn 1:1 into one small buffer and then scaled up
// by a whole number, so every pixel on screen is the same size.
// [label, segment colour (sampled from the room furniture), shade for the segment's rim band]
const WHEEL_TIERS=[['Everyday','#d9b48c','#ad9070'],['Story','#f6e7c8','#c4b8a0'],['Explain','#bccbae','#8aa47d'],['Opinion','#87a9c5','#647c91'],['Workplace','#a9a1ca','#8078a5'],['Persuade','#e3a6a6','#b98585'],['Pressure','#6cc08e','#3f9a6e']];
const WHEEL_SEG=Math.PI*2/WHEEL_TIERS.length;
const WHEEL_BUF=156;
const wheelBuf=document.createElement('canvas');wheelBuf.width=wheelBuf.height=WHEEL_BUF;
const wheelTop=document.createElement('canvas');wheelTop.width=wheelTop.height=WHEEL_BUF;
// Segment index under the pointer (top) for a wheel rotated by `rot` radians.
function wheelTierAt(rot){const a=((-Math.PI/2-rot)%(Math.PI*2)+Math.PI*4)%(Math.PI*2);return Math.floor(a/WHEEL_SEG)%WHEEL_TIERS.length;}
// Rotation that parks the pointer inside segment `i` (with a little jitter so it isn't always dead centre).
function wheelRotFor(i,jitter=0){return -Math.PI/2-(i+.5+jitter)*WHEEL_SEG;}
function drawCatWheel(canvas,rot,coat,anim,animT){
  const B=WHEEL_BUF,b=wheelBuf.getContext('2d'),t=wheelTop.getContext('2d'),cx=78,cy=78,R=58,floor=145,py=cy-R-9;
  b.imageSmoothingEnabled=false;t.imageSmoothingEnabled=false;b.clearRect(0,0,B,B);t.clearRect(0,0,B,B);
  // light backdrop: a slice of the room's cream wall and oak floor
  b.fillStyle='#f3eee4';b.fillRect(0,0,B,B);
  b.fillStyle='#e9e2d4';for(let y=6;y<floor-2;y+=12)for(let x=(y/12|0)%2*12+6;x<B;x+=24)b.fillRect(x,y,2,2);
  b.fillStyle='#d9b48c';b.fillRect(0,floor,B,B-floor);b.fillStyle='#c9a27a';b.fillRect(0,floor,B,2);
  for(let x=10;x<B;x+=30)b.fillRect(x,floor+5,22,1);
  // stand
  const top=cy+R-16,leg=floor+2-top;
  b.fillStyle='#7c6a5c';b.fillRect(cx-34,top,6,leg);b.fillRect(cx+28,top,6,leg);b.fillRect(cx-42,floor+1,84,3);
  b.fillStyle='#a58d78';b.fillRect(cx-33,top+1,2,leg-1);b.fillRect(cx+29,top+1,2,leg-1);b.fillRect(cx-41,floor+1,82,1);
  // wheel face, painted per pixel so its edges are hard: segment colour, with a darker band at the rim
  const img=b.getImageData(0,0,B,B),d=img.data,n=WHEEL_TIERS.length;
  for(let y=0;y<B;y++)for(let x=0;x<B;x++){const dx=x+.5-cx,dy=y+.5-cy,r2=dx*dx+dy*dy;if(r2>(R+.5)**2)continue;
    const i=(y*B+x)*4,seg=((Math.floor((Math.atan2(dy,dx)-rot)/WHEEL_SEG)%n)+n)%n;
    const hex=WHEEL_TIERS[seg][r2>(R-5)**2?2:1];d[i]=parseInt(hex.slice(1,3),16);d[i+1]=parseInt(hex.slice(3,5),16);d[i+2]=parseInt(hex.slice(5,7),16);d[i+3]=255;}
  b.putImageData(img,0,0);
  // spokes, outer ring and rivets, drawn as hard 1px dots so they stay on the grid
  const dot=(x,y,c)=>{b.fillStyle=c;b.fillRect(Math.round(cx+x-.5),Math.round(cy+y-.5),1,1);};
  WHEEL_TIERS.forEach((_,i)=>{const a=rot+i*WHEEL_SEG;for(let r=6;r<R;r+=.5)dot(Math.cos(a)*r,Math.sin(a)*r,'#5c4f63');});
  for(let i=0;i<900;i++){const a=i*Math.PI/450;dot(Math.cos(a)*(R+.5),Math.sin(a)*(R+.5),'#5c4f63');dot(Math.cos(a)*(R+1.5),Math.sin(a)*(R+1.5),'#5c4f63');}
  for(let i=0;i<14;i++){const a=rot+i*Math.PI/7;dot(Math.cos(a)*(R-2.5),Math.sin(a)*(R-2.5),'#fbf6ee');}
  // hub
  b.fillStyle='#5c4f63';b.fillRect(cx-5,cy-5,10,10);b.fillStyle='#f6e7c8';b.fillRect(cx-3,cy-3,6,6);b.fillStyle='#c4b8a0';b.fillRect(cx-1,cy-1,2,2);
  // cat running on the inside of the rim (at the sprite's own 1:1 size) and the pointer go on a layer above the labels
  if(roomImagesLoaded){const c=CAT_ATLAS.cats[coat]||CAT_ATLAS.cats[CAT_COATS[0]],a=c.animations[anim];
    let i=Math.floor(animT*a.fps);i=a.loop?i%a.frames:Math.min(i,a.frames-1);const [sx,sy,w,h]=a.rects[i];
    t.drawImage(atlasImage,sx,sy,w,h,cx-16,cy+R-5-29,w,h);}
  t.fillStyle='#5c4f63';t.fillRect(cx-6,py,13,3);t.fillRect(cx-5,py+3,11,2);t.fillRect(cx-4,py+5,9,2);t.fillRect(cx-3,py+7,7,2);t.fillRect(cx-2,py+9,5,2);t.fillRect(cx-1,py+11,3,1);
  t.fillStyle='#ffe39a';t.fillRect(cx-4,py+1,9,2);t.fillRect(cx-3,py+3,7,2);t.fillRect(cx-2,py+5,5,2);t.fillRect(cx-1,py+7,3,2);t.fillRect(cx,py+9,1,2);

  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);
  const k=Math.max(1,Math.floor(Math.min(canvas.width,canvas.height)/B)),ox=Math.round((canvas.width-B*k)/2),oy=Math.round((canvas.height-B*k)/2);
  ctx.drawImage(wheelBuf,ox,oy,B*k,B*k);
  // Labels: the pixel font at about the wheel's pixel size, centred along each segment
  // and turned so none read upside down. Drawn at screen resolution so the letters stay clean when tilted.
  const rc=(7+R-5)/2;
  ctx.save();ctx.translate(ox+cx*k,oy+cy*k);ctx.font=`${12*k}px 'Jersey 10', monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#3d394e';
  WHEEL_TIERS.forEach(([name],i)=>{const mid=rot+(i+.5)*WHEEL_SEG,flip=Math.cos(mid)<0;
    ctx.save();ctx.rotate(flip?mid+Math.PI:mid);ctx.fillText(name,(flip?-rc:rc)*k,k*.5);ctx.restore();});
  ctx.restore();
  ctx.drawImage(wheelTop,ox,oy,B*k,B*k);
}
