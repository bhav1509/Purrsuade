// Cat room drawn from the Cat Game Pixel Pack atlas (assets/cat-game-atlas.png + .js).
// World units follow the pack: x runs along the right back wall, y along the left one,
// both 0–180. Screen = floorOrigin + (x - y, (x + y) / 2 - z). Everything is drawn 1:1
// into room space, then the whole room is scaled to fit the canvas.
const atlasImage=new Image();
let atlasPixels=null;
const roomAssetsReady=new Promise((resolve,reject)=>{atlasImage.onload=resolve;atlasImage.onerror=()=>reject(new Error('Could not load cat-game-atlas.png'));});
atlasImage.src=new URL('assets/cat-game-atlas.png'+new URL(document.currentScript.src).search,document.currentScript.src).href;
let roomImagesLoaded=false;
roomAssetsReady.then(()=>{roomImagesLoaded=true;},()=>{});

const CAT_COATS=Object.keys(CAT_ATLAS.cats);
const ROOM_STYLES=Object.keys(CAT_ATLAS.rooms);
const CARE_ICONS={food:'bowl_sky_kibble',water:'bowl_blush_water',litter:'litter_tray_mint',play:'toy_yarn_pink',treat:'treat_jar_pink'};
// What the cat's thought bubble shows when that need is lowest.
const NEED_ICONS={hunger:'bowl_sky_kibble',thirst:'bowl_blush_water',cleanliness:'litter_scoop_mint',happiness:'toy_yarn_pink'};

// Wall decor: the room comes with one window. It can slide along either back wall (switching to that wall's
// drawing) but not be put away. `along` runs from the back corner, `z` is the bottom edge, in wall pixels.
const WALL_ITEMS=[
  {id:'window',base:'window_curtain_rose',name:'Window',side:'left',along:26,z:50,keep:true},
];
const WALL_TOP=136; // wall items stay below the top trim of the 140 px walls
// What every room has, laid out with the starter plant and box (see fresh() in app.js) so the room reads tidy: the
// plant in the back corner, the bed centred under the window, the bowls together along the same wall nearer the
// front, the litter tray at the far end of the other wall (away from the food), the box at the front right, and
// open floor in the middle. They can be moved in arrange mode but not put away (`keep`). `spot` is where the cat
// stands to use it ([dx, dy, z, face left]).
const ROOM_ITEMS=[
  {id:'bed',sprite:'basket_bed_sage',name:'Bed',x:19,y:59,shadow:19,spot:[0,0,4,false],keep:true},
  {id:'litter',sprite:'litter_tray_mint',name:'Litter tray',x:153,y:18,spot:[0,0,3,false],keep:true},
  {id:'food',sprite:'bowl_sky_kibble',name:'Food bowl',bowl:['bowl_sky_kibble','bowl_sky_empty','hunger'],x:16,y:120,shadow:6,spot:[6,2,0,true],keep:true},
  {id:'water',sprite:'bowl_blush_water',name:'Water bowl',bowl:['bowl_blush_water','bowl_blush_empty','thirst'],x:16,y:140,shadow:6,spot:[6,2,0,true],keep:true},
];
// Small things that can stand on a shelf or side table as well as on the floor.
const SMALL=/^(plant_small|book_stack|cactus|toy_|treat_jar)/;
// Shelf spots [dx, dy, z] on pieces with a flat top or open shelves: three on top of a shelf and three on each of
// its two open racks.
const SURFACES={shelf:[[10,9,62],[25,9,62],[40,9,62],[10,11,43],[24,11,43],[38,11,43],[10,11,23],[24,11,23],[38,11,23],[10,11,3],[24,11,3],[38,11,3]],
  bookshelf_full:[[10,9,62],[25,9,62],[40,9,62]],side_table:[[0,0,32]]};
// Open racks: after what stands on a rack (at height z) is drawn, these parts of the shelf are drawn again over it
// (the board above and the near side panel, as [x, y, z, dx, dy, dz] boxes from the art pack), so things sit
// inside the rack instead of in front of it.
const SHELF_SIDE=[47,0,0,3,18,62],RACKS={shelf:[[3,[[3,0,20,44,18,3],SHELF_SIDE]],[23,[[3,0,40,44,18,3],SHELF_SIDE]],[43,[[3,0,59,44,18,3],SHELF_SIDE]]]};
// Where the cat sits, sleeps or scratches at furniture: [dx, dy, z, animation, face left], from the art pack's seat
// heights. Turned pieces swap dx and dy. For scratching, the cat stands in front of the post facing it, paws up.
// 'inside' (condo, teepee) adds [door, inner, eyes]: the cat walks from the spot to the doorway and squeezes
// through it (see drawSqueezing), and only its eyes show in the doorway ([dx, dy, z]) until it comes back out.
const PERCHES={armchair:[[0,5,23,'sit']],cat_tree:[[8,-8,37,'sit'],[-8,8,65,'sit'],[-8,-8,96,'sleep']],
  condo:[[8,-8,57,'sit'],[-1,20,0,'inside',false,[[-1,12],[-1,0],[-1,12,12]]]],scratcher:[[2,14,0,'scratch',false]],scratch_post:[[2,14,0,'scratch',false]],stool:[[0,0,27,'sit']],
  bed:[[0,0,4,'sleep']],cardboard_box:[[0,0,0,'sit',false,'into']],floor_cushion:[[0,0,4,'sit']],teepee:[[3,22,0,'inside',false,[[3,14],[3,2],[3,14,8]]]],aquarium:[[19,27,0,'sit']]};
// 'into' (the cardboard box): the cat hops over the rim and sinks down inside, then rises and hops out. While it's
// in, these parts of the box ([x, y, z, dx, dy, dz] around its floor point: the front wall and flap, the right wall
// and flap) are drawn again over it, so only its head peeks out.
const COVERS={cardboard_box:[[-12,9,0,24,9,14],[11,-10,0,8,20,14]]};
const kindOf=(table,name)=>Object.keys(table).filter(k=>name.startsWith(k)).sort((a,b)=>b.length-a.length)[0];
// Shop purchases: `variants` recolours a built-in item ({id: sprite}); `extras` are bought pieces of furniture
// ([{id, sprite, x, y, turned}]), which can be moved (and some turned) like the rest; `hidden` lists built-in
// pieces that were put away.
let roomItems=[],wallItems=[];
// A piece can be turned a quarter when the pack has a `_turned` drawing of it (armchairs).
const canTurn=name=>!!CAT_ATLAS.sprites[name+'_turned'];
function setRoomDecor(decor){
  const variants=decor?.variants||{},hidden=new Set(decor?.hidden||[]);
  const base=ROOM_ITEMS.filter(it=>!hidden.has(it.id)).map(it=>{const v=variants[it.id],small=SMALL.test(it.sprite);if(!v||!CAT_ATLAS.sprites[v])return {...it,base:it.sprite,small};
    return it.bowl?{...it,sprite:v,base:v,small,bowl:[v,v.replace(/_(kibble|water)$/,'_empty'),it.bowl[2]]}:{...it,sprite:v,base:v,small};});
  const extras=(decor?.extras||[]).filter(e=>CAT_ATLAS.sprites[e.sprite]).map(e=>{const s=CAT_ATLAS.sprites[e.sprite],flat=/^(rug|blanket)_/.test(e.sprite),turned=!!e.turned&&canTurn(e.sprite);
    return {id:e.id,base:e.sprite,sprite:turned?e.sprite+'_turned':e.sprite,turned,x:e.x,y:e.y,shadow:flat?0:Math.min(16,Math.max(4,Math.round(s.w/6))),flat,extra:true,small:SMALL.test(e.sprite)};});
  roomItems=[...base,...extras].map(it=>({...it,pad:padOf(footprint(it)),surfaces:surfacesOf(it)}));
  // Bought windows, paintings and clocks: {id, sprite (the drawing's name without its wall), side, along, z}.
  const onWalls=(decor?.extras||[]).filter(e=>isWallDecor(e.sprite)).map(e=>({id:e.id,base:e.sprite,side:e.side,along:e.along,z:e.z,extra:true}));
  wallItems=[...WALL_ITEMS.filter(w=>!hidden.has(w.id)),...onWalls].map(w=>({...w,wall:true}));
  updateSpots();
}
const surfacesOf=it=>SURFACES[kindOf(SURFACES,it.base)]||null;
// Floor footprint of each kind of piece, [x0, y0, x1, y1] around its floor point, from the art pack's sizes.
// Pieces can't overlap (rugs and blankets lie under things); a turned piece swaps its x and y.
const FOOTPRINTS={armchair:[-22,-20,22,20],shelf:[0,0,50,18],bookshelf_full:[0,0,50,18],aquarium:[0,0,38,18],
  rug:[-44,-44,44,44],blanket:[-14,-10,14,10],treat_jar:[-5,-5,5,5],
  cat_tree:[-16,-16,16,16],condo:[-14,-14,16,12],teepee:[-14,-14,14,14],basket_bed:[-15,-15,15,15],bed:[-19,-19,19,19],
  litter_tray:[-15,-12,15,12],scratch_post:[-12,-12,12,12],scratcher:[-12,-12,12,12],stool:[-12,-12,12,12],
  floor_cushion:[-9,-9,9,9],side_table:[-10,-10,10,10],floor_lamp:[-7,-7,7,7],
  plant_big:[-8,-8,8,8],cardboard_box:[-14,-10,12,10],plant_small:[-5,-5,5,5],book_stack:[-6,-6,6,6],cactus:[-4,-4,4,4],bowl:[-6,-6,6,6],toy:[-4,-4,4,4]};
function footprint(it,turned=it.turned){
  const key=kindOf(FOOTPRINTS,it.base);
  const h=Math.round(CAT_ATLAS.sprites[it.base].w/5),r=key?FOOTPRINTS[key]:[-h,-h,h,h];
  return turned?[r[1],r[0],r[3],r[2]]:r;
}
const padOf=r=>Math.max(4,...r.map(Math.abs));
const TILE=18,GRID=9; // the floor is 10 x 10 tiles of 18 u; pieces snap to half a tile
// Is (x, y) inside the walls and clear of every other standing piece? `turned` checks a quarter turn there.
function placementOk(id,x,y,turned){
  const it=roomItems.find(i=>i.id===id);if(!it)return false;
  const [a0,b0,a1,b1]=footprint(it,turned??it.turned);
  if(x+a0<0||y+b0<0||x+a1>180||y+b1>180)return false;
  if(it.flat)return true;
  return !roomItems.some(o=>{if(o.id===id||o.flat||hostOf(o))return false;const [ox,oy]=itemPos(o),[c0,d0,c1,d1]=footprint(o);
    return x+a0<ox+c1&&ox+c0<x+a1&&y+b0<oy+d1&&oy+d0<y+b1;});
}
// A clear spot for a new piece: the grid point with the most space around it.
function findFreeSpot(name,turned=false){
  const probe={id:'_probe',base:name,sprite:name,turned,flat:/^(rug|blanket)_/.test(name)},[a0,b0,a1,b1]=footprint(probe);let best=null,far=-1;
  roomItems.push(probe);
  for(let x=Math.ceil(-a0/GRID)*GRID;x+a1<=180;x+=GRID)for(let y=Math.ceil(-b0/GRID)*GRID;y+b1<=180;y+=GRID){
    if(!placementOk('_probe',x,y))continue;
    const d=Math.min(...roomItems.filter(o=>o!==probe&&!o.flat&&!hostOf(o)).map(o=>{const [ox,oy]=itemPos(o);return Math.hypot(ox-x,oy-y)-o.pad;}));
    if(d>far){far=d;best=[x,y];}}
  roomItems.pop();
  return best||[90,90];
}
// Where the cat stands for each spot: [x, y, z, face left]. Item spots follow the layout. Furniture spots
// ('@<item>:<n>') add, for raised seats, the floor point the cat jumps up from, the piece's depth and an animation:
// [x, y, z, face left, floor x, floor y, depth, animation].
const SPOT={};
// For a raised spot on a piece with several levels (a cat tree): the lower levels the cat hops through on the way
// up, lowest first, as [x, y, z]; it comes down the same way.
const CLIMB={};
// Saved positions from the app: {id: [x, y]} on the floor, ['on', shelf id, spot] on a shelf, or
// ['left' | 'right', along, z] on a wall.
let roomLayout={};
// A piece's floor point, plus its height when it stands on a shelf: [x, y] or [x, y, z].
function itemPos(it){
  const h=hostOf(it);if(h){const [hx,hy]=itemPos(h),s=h.surfaces[shelfPlace(it)[2]];return [hx+s[0],hy+s[1],s[2]];}
  const l=roomLayout[it.id];return typeof l?.[0]==='number'?l:[it.x,it.y];
}
// Where a small piece stands on a shelf, ['on', shelf id, spot]: its saved place, or where it starts (`on`).
const shelfPlace=it=>{const l=roomLayout[it.id];return l?(l[0]==='on'?l:null):it.on?['on',...it.on]:null;};
// The shelf a small piece stands on, or null (also when that shelf has been put away).
function hostOf(it){const l=shelfPlace(it);return l?roomItems.find(o=>o.id===l[1]&&o.surfaces?.[l[2]])||null:null;}
const carried=host=>roomItems.filter(o=>hostOf(o)===host);
function wallPos(w){const l=roomLayout[w.id];return l?.[0]==='left'||l?.[0]==='right'?l:[w.side,w.along,w.z];}
const wallSprite=(w,side=wallPos(w)[0])=>CAT_ATLAS.sprites[`${w.base}_${side}`];
// Inside the wall and clear of the other things hanging on the same wall?
function wallOk(id,side,along,z){
  const w=wallItems.find(o=>o.id===id),s=wallSprite(w,side);
  if(along<2||along+s.wall_width_u>178||z<6||z+s.height_px>WALL_TOP)return false;
  return !wallItems.some(o=>{if(o.id===id)return false;const [os,oa,oz]=wallPos(o),t=wallSprite(o);
    return os===side&&along<oa+t.wall_width_u&&oa<along+s.wall_width_u&&z<oz+t.height_px&&oz<z+s.height_px;});
}
// Wall decor is drawn once per wall: 'art_cat' is art_cat_left / art_cat_right.
const isWallDecor=name=>!CAT_ATLAS.sprites[name]&&!!CAT_ATLAS.sprites[name+'_left'];
// A clear spot on either wall for a new window, painting or clock, as near eye level as there is: [side, along, z].
function freeWallSpot(base){
  const probe={id:'_probe',base,wall:true};wallItems.push(probe);let spot=null;
  for(let k=0;k<30&&!spot;k++){const z=60+(k%2?-1:1)*Math.ceil(k/2)*4;if(z<6||z>=WALL_TOP)continue;
    for(const side of ['left','right'])for(let a=2;a<178&&!spot;a+=4)if(wallOk('_probe',side,a,z))spot=[side,a,z];}
  wallItems.pop();return spot;
}
function updateSpots(){
  const fix=v=>Math.max(4,Math.min(176,v));
  for(const it of roomItems){if(!it.spot)continue;const [x,y]=itemPos(it),[dx,dy,z,f]=it.spot;SPOT[it.id]=[fix(x+dx),fix(y+dy),z,f];}
  // The rug (or, without one, the clear floor nearest the middle) is where the cat sits and celebrates, and a toy
  // on the floor is what it plays with (its own pretend ball when there's none).
  const rug=roomItems.find(i=>i.flat&&!hostOf(i));SPOT.rug=rug?[...itemPos(rug),0,false]:[...openFloorNear(96,108),0,false];
  const toy=roomItems.find(i=>i.base.startsWith('toy_')&&!hostOf(i));playToy=toy?.id;
  SPOT.yarn=toy?[fix(itemPos(toy)[0]-6),itemPos(toy)[1],0,false]:SPOT.rug;
  // The cat sits below each window, facing it.
  for(const w of wallItems){if(!w.base.startsWith('window'))continue;const [side,a]=wallPos(w),m=a+wallSprite(w).wall_width_u/2;
    SPOT[w.id]=side==='left'?[24,fix(m),0,true]:[fix(m),24,0,false];}
  for(const k in SPOT)if(k[0]==='@')delete SPOT[k];
  for(const k in CLIMB)delete CLIMB[k];
  for(const it of roomItems){const k=kindOf(PERCHES,it.base);if(!k)continue;
    const [x,y]=itemPos(it),[,,a1,b1]=footprint(it);
    PERCHES[k].forEach(([dx,dy,z,anim,face,door],n)=>{const sw=p=>it.turned?[p[1],p[0],...p.slice(2)]:p;[dx,dy]=sw([dx,dy]);
      // Raised seats are reached by a jump from the floor in front of the piece.
      // (The box's flaps lie open a few units past its walls, so the cat takes off from further out.)
      const out=door==='into'?13:8,g=z>6||door==='into'?(y+b1+out<=176?[x+dx,y+b1+out]:[x+a1+out,y+dy]):[x+dx,y+dy];
      SPOT[`@${it.id}:${n}`]=[fix(x+dx),fix(y+dy),z,face,fix(g[0]),fix(g[1]),x+y,anim,...(door==='into'?['into']:door?door.map(sw).map(([u,v,w])=>[x+u,y+v,w??0]):[])];});
    const raised=PERCHES[k].map((p,n)=>`@${it.id}:${n}`).filter(key=>SPOT[key][2]>6).sort((p,q)=>SPOT[p][2]-SPOT[q][2]);
    raised.forEach((key,n)=>{CLIMB[key]=raised.slice(0,n).map(p=>SPOT[p].slice(0,3));});}
}
let playToy=null;
// The floor point nearest (x, y) with room for the cat to sit, clear of every standing piece.
function openFloorNear(x,y){
  const clear=(px,py)=>px>=10&&py>=10&&px<=170&&py<=170&&!roomItems.some(o=>{if(o.flat||hostOf(o))return false;const [ox,oy]=itemPos(o),[a0,b0,a1,b1]=footprint(o);
    return px>ox+a0-8&&px<ox+a1+8&&py>oy+b0-8&&py<oy+b1+8;});
  for(let r=0;r<=90;r+=3)for(let k=0;k<Math.max(1,r*2);k++){const t=k/Math.max(1,r*2)*Math.PI*2,px=Math.round(x+r*Math.cos(t)),py=Math.round(y+r*Math.sin(t));if(clear(px,py))return [px,py];}
  return [x,y];
}
function setRoomLayout(layout,time){
  roomLayout=layout||{};updateSpots();
  if(time!=null&&catPlan){const p=poseAt(catPlan,time);catPlan=buildPlan(time,poseFrom(p),[{to:'bed'},{at:'bed',anim:'idle',dur:.5}],false);planReaction=null;}
}
setRoomDecor(null);

let roomStyle=ROOM_STYLES[0];
const project=(x,y,z=0)=>{const [ox,oy]=CAT_ATLAS.rooms[roomStyle].floorOrigin;return [ox+x-y,oy+(x+y)/2-z];};

function drawSprite(ctx,name,x,y,z=0){
  const s=CAT_ATLAS.sprites[name],[X,Y]=project(x,y,z);
  ctx.drawImage(atlasImage,s.x,s.y,s.w,s.h,Math.round(X-s.anchor[0]),Math.round(Y-s.anchor[1]),s.w,s.h);
}
// Top-left pixel of a wall item at a wall position, and its sprite.
function wallRect(w,[side,along,z]=wallPos(w)){
  const s=wallSprite(w,side),[X,Y]=side==='left'?project(0,along,z+s.height_px):project(along,0,z+s.height_px);
  return {s,x:Math.round(side==='left'?X-s.w:X-1),y:Math.round(Y-1)};
}
function drawWallItem(ctx,w){const {s,x,y}=wallRect(w);ctx.drawImage(atlasImage,s.x,s.y,s.w,s.h,x,y,s.w,s.h);}
// The pixels of a sprite that lie inside some boxes of the piece (see RACKS), as a canvas the size of the sprite.
// Each box's outline is the convex hull of its eight corners; a pixel is kept when its centre is inside.
const rackCache={};
function spriteBoxes(name,boxes){
  const key=name+boxes.join('|');if(rackCache[key])return rackCache[key];
  const s=CAT_ATLAS.sprites[name],A=atlasData(),c=document.createElement('canvas');c.width=s.w;c.height=s.h;
  const x=c.getContext('2d'),img=x.createImageData(s.w,s.h);
  const hulls=boxes.map(([bx,by,bz,dx,dy,dz])=>{const pts=[];
    for(const u of [bx,bx+dx])for(const v of [by,by+dy])for(const w of [bz,bz+dz])pts.push([s.anchor[0]+u-v,s.anchor[1]+(u+v)/2-w]);return hull(pts);});
  for(let j=0;j<s.h;j++)for(let i=0;i<s.w;i++)if(hulls.some(h=>inHull(h,i+.5,j+.5))){
    const o=((s.y+j)*A.width+s.x+i)*4;img.data.set(A.data.subarray(o,o+4),(j*s.w+i)*4);}
  x.putImageData(img,0,0);return rackCache[key]=c;
}
// Convex hull (counter-clockwise in screen space) and an inside test.
function hull(pts){
  pts=[...pts].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const half=list=>{const h=[];for(const p of list){while(h.length>1&&cross(h[h.length-2],h[h.length-1],p)<=0)h.pop();h.push(p);}h.pop();return h;};
  return [...half(pts),...half([...pts].reverse())];
}
function inHull(h,x,y){for(let k=0;k<h.length;k++){const a=h[k],b=h[(k+1)%h.length];if((b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0])<0)return false;}return true;}
// Pixel-stepped ellipse so shadows stay crisp at any zoom.
function drawShadow(ctx,x,y,z,r){
  if(!r)return;const [X,Y]=project(x,y,z),ry=Math.max(1,Math.round(r/2));
  ctx.fillStyle='rgba(60,40,30,.18)';
  for(let dy=-ry;dy<=ry;dy++){const half=Math.round(r*Math.sqrt(1-(dy/ry)**2));ctx.fillRect(Math.round(X)-half,Math.round(Y)+dy,half*2,1);}
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
// `from` is [x, y, z, face left] plus, when the cat is up on furniture, the floor point below and that piece's depth,
// then the condo / teepee it's inside and the raised spot it's on (as spot keys).
function buildPlan(start,from,steps,loop){
  const segs=[];let t=0,pos=from.slice(0,3),flip=from[3],spot=null,ground=from[4]!=null?[from[4],from[5]]:null,depth=from[6],inside=from[7],perch=from[8];
  const face=to=>{const dx=(to[0]-pos[0])-(to[1]-pos[1]);if(Math.abs(dx)>2)flip=dx<0;};
  const hop=(to,d)=>{face(to);segs.push({t0:t,t1:t+.6,from:pos,to,anim:'jump',flip,depth:d,perch});t+=.6;pos=to;};
  // Up out of (or down into) the box: a short slide in height, sitting, to z (and to xy if given).
  const rise=(z,d,xy=pos)=>{const to=[xy[0],xy[1],z];segs.push({t0:t,t1:t+.35,from:pos,to,anim:'sit',flip,depth:d,perch});t+=.35;pos=to;};
  const pause=d=>{segs.push({t0:t,t1:t+.35,from:pos,to:pos,anim:'sit',flip,depth:d,perch});t+=.35;};
  // A walk at the usual pace; through a doorway it's drawn in front of the piece (`d`), squeezing through (spot key).
  const walk=(to,d,squeeze)=>{face(to);const dur=Math.max(.25,Math.hypot(to[0]-pos[0],to[1]-pos[1])/WALK_SPEED);
    segs.push({t0:t,t1:t+dur,from:pos,to,anim:'walk',flip,depth:d,squeeze});t+=dur;pos=to;};
  for(const step of steps){
    if(step.to){
      const to=SPOT[step.to];spot=step.to;
      if(inside&&SPOT[inside]){const s=SPOT[inside];walk([...s[8].slice(0,2),0],s[6],inside);walk(s.slice(0,3),s[6],inside);}inside=null;
      if(Math.hypot(to[0]-pos[0],to[1]-pos[1])<1&&Math.abs(to[2]-pos[2])<1){pos=to.slice(0,3);continue;}
      // Down off the furniture first (level by level on a cat tree), then walk, then up onto the next piece.
      if(SPOT[perch]?.[8]==='into'){rise(16,depth);hop([...(ground||pos.slice(0,2)),0],depth);}
      else if(pos[2]>6){for(const v of [...(CLIMB[perch]||[])].reverse())if(v[2]<pos[2]-1){hop(v,depth);pause(depth);}hop([...(ground||pos.slice(0,2)),0],depth);}
      perch=null;
      const into=to[8]==='into',up=to[2]>6||into,walkTo=up?[to[4],to[5],0]:to.slice(0,3),dist=Math.hypot(walkTo[0]-pos[0],walkTo[1]-pos[1]);
      if(dist>=1)for(const leg of catRoute(pos,walkTo)){
        face(leg);const dur=Math.max(.3,Math.hypot(leg[0]-pos[0],leg[1]-pos[1])/WALK_SPEED);
        segs.push({t0:t,t1:t+dur,from:pos,to:leg,anim:'walk',flip});t+=dur;pos=leg;
      }
      if(into){perch=step.to;hop([to[0],to[1]+4,16],to[6]);pos=[to[0],to[1]+4,16];rise(0,to[6],to.slice(0,2));}
      else if(up){perch=step.to;for(const v of CLIMB[step.to]||[]){hop(v,to[6]);pause(to[6]);}hop(to.slice(0,3),to[6]);}
      if(to[7]==='inside'){walk([...to[8].slice(0,2),0],to[6],step.to);walk([...to[9].slice(0,2),0],to[6],step.to);inside=step.to;}
      ground=up?[to[4],to[5]]:null;depth=up?to[6]:undefined;
    }else{
      if(step.at){const at=SPOT[step.at];pos=at[7]==='inside'?[...at[9].slice(0,2),0]:at.slice(0,3);flip=step.flip??at[3]??flip;spot=step.at;
        const raised=at[2]>6||at[8]==='into';ground=raised?[at[4],at[5]]:null;depth=raised||at[7]==='inside'?at[6]:undefined;inside=at[7]==='inside'?step.at:null;perch=raised?step.at:null;}
      segs.push({t0:t,t1:t+step.dur,from:pos,to:pos,anim:step.anim,flip,spot:step.at,hearts:step.hearts,hideYarn:step.hideYarn,ground,depth,perch});t+=step.dur;
    }
  }
  return {start,segs,dur:t,loop,endSpot:spot};
}
// ---- Getting around: the cat walks round the furniture, not through it ----
// The floor as a grid of 6 u cells; a cell is blocked under any standing piece grown by the cat's half-width,
// except the pieces the cat starts in or is heading into (its bed, the litter tray…). A* over the grid, then
// the corners it doesn't need are cut wherever the straight line between two points is clear. Where a gap is too
// tight for the full margin `r` (a piece squeezed into a corner), it tries a thinner one, then just the outlines.
const NAV=6,NAV_N=180/NAV,CAT_R=7;
function catRoute(a,b,r=CAT_R){
  const inside=(r,x,y)=>x>r[0]&&x<r[2]&&y>r[1]&&y<r[3];
  const ends=r=>inside(r,a[0],a[1])||inside(r,b[0],b[1]);
  const blocks=roomItems.filter(it=>!it.flat&&!hostOf(it)).map(it=>{const [x,y]=itemPos(it),[a0,b0,a1,b1]=footprint(it),
    raw=[x+a0,y+b0,x+a1,y+b1],grown=[x+a0-r,y+b0-r,x+a1+r,y+b1+r];
    // Right beside a piece (a bowl, the post) the cat may brush its edge, but still not walk through it.
    return ends(raw)?null:ends(grown)?raw:grown;}).filter(Boolean);
  const free=(x,y)=>x>=2&&y>=2&&x<=178&&y<=178&&!blocks.some(k=>inside(k,x,y));
  const clear=(p,q)=>{const n=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])*2);
    for(let i=1;i<n;i++)if(!free(p[0]+(q[0]-p[0])*i/n,p[1]+(q[1]-p[1])*i/n))return false;return true;};
  if(clear(a,b))return [b];
  const N=NAV_N,cellOf=([x,y])=>Math.min(N-1,Math.max(0,Math.floor(x/NAV)))+N*Math.min(N-1,Math.max(0,Math.floor(y/NAV))),
    mid=c=>[(c%N+.5)*NAV,(Math.floor(c/N)+.5)*NAV];
  // Join the grid at the nearest open cell reachable in a straight line (the cat may stand right against a bowl).
  const join=p=>{const c0=cellOf(p);let best=null,d=Infinity;
    for(let di=-2;di<=2;di++)for(let dj=-2;dj<=2;dj++){const i=c0%N+di,j=Math.floor(c0/N)+dj,c=i+N*j;if(i<0||j<0||i>=N||j>=N)continue;
      const m=mid(c),e=Math.hypot(m[0]-p[0],m[1]-p[1]);if(e<d&&free(...m)&&clear(p,m)){best=c;d=e;}}return best;};
  const s0=join(a),g=join(b),fallback=()=>r>3?catRoute(a,b,3):r>0?catRoute(a,b,0):[b];
  if(s0==null||g==null)return fallback();
  const open=new Set([s0]),cost=new Map([[s0,0]]),prev=new Map(),ok=c=>c===s0||c===g||free(...mid(c)),h=c=>Math.hypot(...mid(c).map((v,k)=>v-b[k]));
  while(open.size){
    let c=null;for(const o of open)if(c===null||cost.get(o)+h(o)<cost.get(c)+h(c))c=o;
    if(c===g)break;open.delete(c);
    const i=c%N,j=Math.floor(c/N);
    for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){
      const ni=i+di,nj=j+dj,n=ni+N*nj;if((!di&&!dj)||ni<0||nj<0||ni>=N||nj>=N||!ok(n))continue;
      if(di&&dj&&(!ok(ni+N*j)||!ok(i+N*nj)))continue; // no squeezing between two corners
      const k=cost.get(c)+(di&&dj?1.414:1);if(k<(cost.get(n)??Infinity)){cost.set(n,k);prev.set(n,c);open.add(n);}
    }
  }
  if(g!==s0&&!prev.has(g))return fallback();
  const pts=[b];for(let c=g;;c=prev.get(c)){pts.unshift([...mid(c),0]);if(c===s0)break;}
  const out=[];let from=a;
  for(let k=0;k<pts.length;){let far=k;for(let m=pts.length-1;m>k;m--)if(clear(from,pts[m])){far=m;break;}out.push(from=pts[far]);k=far+1;}
  return out;
}
function poseAt(plan,time){
  let t=(time-plan.start)/1000;
  if(plan.loop)t=((t%plan.dur)+plan.dur)%plan.dur;else t=Math.min(Math.max(t,0),plan.dur-.001);
  const seg=plan.segs.find(s=>t<s.t1)||plan.segs[plan.segs.length-1],k=(t-seg.t0)/(seg.t1-seg.t0);
  const lerp=i=>seg.from[i]+(seg.to[i]-seg.from[i])*k;
  return {x:lerp(0),y:lerp(1),z:lerp(2),anim:seg.anim,flip:seg.flip,animT:t-seg.t0,hearts:seg.hearts,hideYarn:seg.hideYarn,reacting:!plan.loop,ground:seg.ground,depth:seg.depth,spot:seg.spot,squeeze:seg.squeeze,perch:seg.perch};
}
const poseFrom=p=>[p.x,p.y,p.z,p.flip,p.ground?.[0],p.ground?.[1],p.depth,p.anim==='inside'?p.spot:null,p.perch];
const IDLE_STEPS={
  tired:[{at:'bed',anim:'sleep',dur:10}],
  sick:[{at:'bed',anim:'sleep',dur:12}],
};
// A happy cat naps, sits on the rug, then visits up to four favourite places: the windows, the cushion and
// whatever furniture it can sit on (the armchair, the cat tree…), in a new order each time round.
function idleSteps(mood){
  if(mood!=='happy')return IDLE_STEPS[mood];
  const visits=[...wallItems.filter(w=>SPOT[w.id]).map(w=>[w.id,'sit',4]),
    ...Object.keys(SPOT).filter(k=>k[0]==='@').map(k=>[k,SPOT[k][7],{sleep:6,inside:6,scratch:3}[SPOT[k][7]]||4])];
  for(let i=visits.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[visits[i],visits[j]]=[visits[j],visits[i]];}
  return [{at:'bed',anim:'sleep',dur:5},{at:'bed',anim:'idle',dur:1.5},{to:'rug'},{at:'rug',anim:'sit',dur:4},{at:'rug',anim:'idle',dur:1.5},
    ...visits.slice(0,4).flatMap(([id,anim,dur])=>[{to:id},{at:id,anim,dur}]),{to:'bed'}];
}
const REACTION_STEPS={
  food:[{to:'food'},{at:'food',anim:'sit',dur:3,hearts:true}],
  water:[{to:'water'},{at:'water',anim:'sit',dur:3,hearts:true}],
  litter:[{to:'litter'},{at:'litter',anim:'sit',dur:2.5,hearts:true}],
  play:[{to:'yarn'},{at:'yarn',anim:'play',dur:3.5,hearts:true,hideYarn:true}],
  treat:[{to:'rug'},{at:'rug',anim:'jump',dur:.6},{at:'rug',anim:'jump',dur:.6},{at:'rug',anim:'sit',dur:2,hearts:true}],
  pet:[{anim:'sit',dur:2.2,hearts:true}],
  cheer:[{to:'rug'},{at:'rug',anim:'jump',dur:.6},{at:'rug',anim:'jump',dur:.6},{at:'rug',anim:'jump',dur:.6},{at:'rug',anim:'sit',dur:2,hearts:true}],
};
// Tapping something in the room: the cat goes over and uses it (naps in a bed, climbs the cat tree, sits on the
// armchair, plays with a toy, checks the bowls) or, for things it can't use, walks up to it and sits looking at it.
// The steps for that, or null when nothing is under the pointer.
function visitSteps(canvas,clientX,clientY){
  const it=itemAt(canvas,clientX,clientY);if(!it)return null;
  const fix=v=>Math.max(10,Math.min(170,v));
  // Windows, paintings and clocks: sit on the floor below, facing the wall.
  if(it.wall){const [side,a]=wallPos(it),m=a+wallSprite(it).wall_width_u/2;SPOT['~'+it.id]=side==='left'?[24,fix(m),0,true]:[fix(m),24,0,false];
    return [{to:'~'+it.id},{at:'~'+it.id,anim:'sit',dur:4}];}
  const seats=Object.keys(SPOT).filter(k=>k.startsWith(`@${it.id}:`));
  if(seats.length){const k=seats[Math.floor(Math.random()*seats.length)],anim=SPOT[k][7];return [{to:k},{at:k,anim,dur:{sleep:6,inside:5,scratch:3}[anim]||4}];}
  if(it.id==='bed')return [{to:'bed'},{at:'bed',anim:'sleep',dur:6}];
  if(['food','water','litter'].includes(it.id))return [{to:it.id},{at:it.id,anim:'sit',dur:2.5}];
  // A toy on the floor becomes the one the cat plays with.
  const [x,y,z=0]=itemPos(it);
  if(it.base.startsWith('toy_')&&!z){playToy=it.id;SPOT.yarn=[fix(x-6),y,0,false];return [{to:'yarn'},{at:'yarn',anim:'play',dur:3.5,hideYarn:true}];}
  if(it.flat){SPOT['~'+it.id]=[x,y,0,false];return [{to:'~'+it.id},{at:'~'+it.id,anim:'sit',dur:4}];}
  // Anything else (a plant, a lamp, a shelf and what's on it): the clear floor next to it, facing it.
  const [fx,fy]=openFloorNear(x,y);SPOT['~'+it.id]=[fx,fy,0,(x-fx)-(y-fy)<0];
  return [{to:'~'+it.id},{at:'~'+it.id,anim:'sit',dur:3}];
}
let catPlan=null,planReaction=null,planMood=null,planRoom=null;
function resetCatPlan(){catPlan=null;planReaction=null;planMood=null;}
function currentPose(time,cat,reaction){
  // Below 1 heart the cat is sick: it stays curled up in bed and ignores toys and treats.
  const health=(cat.hunger+cat.thirst+cat.cleanliness+cat.happiness)/4,mood=health<15?'sick':cat.happiness<25?'tired':'happy';
  if(reaction&&mood==='sick'&&['play','treat','cheer','visit'].includes(reaction.type))planReaction=reaction;
  const steps=reaction&&(reaction.steps||REACTION_STEPS[reaction.type]);
  if(steps&&reaction!==planReaction){
    const p=catPlan?poseAt(catPlan,reaction.started):null,from=p?poseFrom(p):SPOT.bed;
    catPlan=buildPlan(reaction.started,from,[...steps,{to:mood==='happy'?'rug':'bed'}],false);planReaction=reaction;
  }
  // Furniture moved (or bought, or put away): walk back to bed by the new routes, then pick the routine up again.
  if(catPlan&&catPlan.loop&&!arrange.drag&&planRoom&&(planRoom[0]!==roomItems||planRoom[1]!==roomLayout)){
    catPlan=buildPlan(time,poseFrom(poseAt(catPlan,time)),[{to:'bed'},{at:'bed',anim:'sleep',dur:.5}],false);catPlan.endSpot='bed';}
  if(!arrange.drag)planRoom=[roomItems,roomLayout];
  if(catPlan&&!catPlan.loop&&time>=catPlan.start+catPlan.dur*1000){
    // Rejoin the idle loop at the spot the reaction finished on, so the cat never jumps.
    const end=catPlan.start+catPlan.dur*1000,idle=buildPlan(0,SPOT.bed,idleSteps(mood),true);
    const seg=idle.segs.find(s=>s.spot===catPlan.endSpot&&s.anim!=='walk');
    idle.start=end-(seg?seg.t0:0)*1000;catPlan=idle;planMood=mood;
  }
  // Join the routine at a random point, so opening the app doesn't always show the same nap.
  if(!catPlan||(catPlan.loop&&planMood!==mood)){catPlan=buildPlan(time,SPOT.bed,idleSteps(mood),true);if(mood==='happy')catPlan.start-=Math.random()*catPlan.dur*1000;planMood=mood;}
  return poseAt(catPlan,time);
}

function drawCatFrame(ctx,coat,anim,animT,X,Y,flip){
  const c=CAT_ATLAS.cats[coat]||CAT_ATLAS.cats[CAT_COATS[0]],a=c.animations[anim];
  let i=Math.floor(animT*a.fps);i=a.loop?i%a.frames:Math.min(i,a.frames-1);
  const [sx,sy,w,h]=a.rects[i],[fx,fy]=c.feetAnchor;
  ctx.save();ctx.translate(Math.round(X),Math.round(Y));if(flip)ctx.scale(-1,1);
  ctx.drawImage(atlasImage,sx,sy,w,h,-fx,-fy,w,h);ctx.restore();
}
// Going through the door of a condo or teepee: the cat is drawn in front of the piece minus every bit of it that
// overlaps the piece's walls, so only what's in the doorway (or still outside) shows.
const squeezeBuf=document.createElement('canvas');squeezeBuf.width=squeezeBuf.height=64;
function drawSqueezing(ctx,coat,pose,X,Y){
  const it=roomItems.find(i=>i.id===pose.squeeze.slice(1).split(':')[0]),eyes=SPOT[pose.squeeze]?.[10];
  if(!it||!eyes){drawCatFrame(ctx,coat,pose.anim,pose.animT,X,Y,pose.flip);return;}
  const s=CAT_ATLAS.sprites[it.sprite],[PX,PY]=project(...itemPos(it)),[EX,EY]=project(...eyes),ox=Math.round(PX-s.anchor[0]),oy=Math.round(PY-s.anchor[1]);
  const x=squeezeBuf.getContext('2d'),bx=Math.round(X)-32,by=Math.round(Y)-48;x.clearRect(0,0,64,64);
  drawCatFrame(x,coat,pose.anim,pose.animT,X-bx,Y-by,pose.flip);
  // Only the part of the cat already through the doorway is behind the walls: going in (towards -y) a pixel k to
  // the right of its feet is about k units further in, so that's everything right of (doorway - cat's y).
  const past=Math.round(X-bx+pose.y-SPOT[pose.squeeze][8][1]);
  x.save();x.beginPath();x.rect(past,0,64,64);x.clip();
  x.globalCompositeOperation='destination-out';x.drawImage(wallMask(it.sprite,Math.round(EX)-ox,Math.round(EY)-oy),ox-bx,oy-by);
  x.restore();ctx.drawImage(squeezeBuf,bx,by);
}
// A piece's walls as a mask the size of its sprite: every opaque pixel except the dark doorway joined to (sx, sy).
const maskCache={};
function wallMask(name,sx,sy){
  const key=name+':'+sx+','+sy;if(maskCache[key])return maskCache[key];
  const s=CAT_ATLAS.sprites[name],A=atlasData(),c=document.createElement('canvas');c.width=s.w;c.height=s.h;
  const x=c.getContext('2d'),img=x.createImageData(s.w,s.h),px=(i,j)=>{const o=((s.y+j)*A.width+s.x+i)*4;return A.data.subarray(o,o+4);};
  const lum=p=>p[0]*.3+p[1]*.59+p[2]*.11,door=new Uint8Array(s.w*s.h),lim=lum(px(sx,sy))*1.25+8,todo=[[sx,sy]];
  while(todo.length){const [i,j]=todo.pop();if(i<0||j<0||i>=s.w||j>=s.h||door[j*s.w+i])continue;const p=px(i,j);if(p[3]<40||lum(p)>lim)continue;
    door[j*s.w+i]=1;todo.push([i+1,j],[i-1,j],[i,j+1],[i,j-1]);}
  for(let j=0;j<s.h;j++)for(let i=0;i<s.w;i++)if(px(i,j)[3]>40&&!door[j*s.w+i])img.data.set([0,0,0,255],(j*s.w+i)*4);
  x.putImageData(img,0,0);return maskCache[key]=c;
}
// Two eyes glowing in a dark doorway, blinking now and then.
function drawEyes(ctx,X,Y,time){
  if(time%3200<160)return;ctx.fillStyle='#f3e37c';
  ctx.fillRect(Math.round(X)-3,Math.round(Y),2,1);ctx.fillRect(Math.round(X)+1,Math.round(Y),2,1);
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
// How far out the camera may zoom: on a phone, until the whole room's width shows; elsewhere, not past the fit.
const minZoom=canvas=>canvas._tall?.85:1;

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
  // On tall, narrow stages (phones) the whole room shows to start with; pinch to zoom in (or a little further out,
  // see minZoom), and the camera can pan to the edges.
  canvas._tall=!!cam&&H/W>(r.h/r.w)*1.2;
  // At rest, a whole number of screen pixels per room pixel when that's at least 3 (sharp phone screens), so every
  // line in the art is drawn equally thick; otherwise whole numbers only when they cost little room. Zoomed, the
  // scale follows the fingers smoothly, and settles on a whole number when they let go (see settleZoom).
  const raw=fit*zoom,scale=zoom!==1?raw:raw>=3?Math.floor(raw):raw>=1&&Math.floor(raw)/raw>.85?Math.floor(raw):raw;
  canvas._fit=fit;
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
// Drag to pan; two-finger pinch to zoom when `pinch` is on. A press that barely moves is a tap.
// `grab(e)` may claim a press (arrange mode) by returning {move, end}; otherwise the press pans.
function enableRoomCamera(canvas,{pinch,onTap,onChange,resetButton,zoomIn,zoomOut,grab}){
  const cam=camFor(canvas);if(!cam)return;
  const pts=new Map();let start=null,moved=false,held=null,pinched=false;
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
    if(!pts.has(e.pointerId)){canvas.style.cursor=arrange.on?(itemAt(canvas,e.clientX,e.clientY)||graveAt(canvas,e.clientX,e.clientY)?'grab':''):catHit(canvas,e.clientX,e.clientY)||itemAt(canvas,e.clientX,e.clientY)?'pointer':'';return;}
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(held){moved=true;held.move(e);onChange?.();return;}
    const now=snap();
    if(pts.size>1){
      if(!pinch||!start.d)return;
      // Zoom about the pinch midpoint so the spot under the fingers stays put.
      const rc=canvas.getBoundingClientRect(),px=start.x-(rc.left+rc.width/2),py=start.y-(rc.top+rc.height/2);
      const z=Math.max(minZoom(canvas),Math.min(MAX_ZOOM,start.zoom*now.d/start.d)),k=z/start.zoom;
      cam.zoom=z;cam.x=px-(px-start.camX)*k+(now.x-start.x);cam.y=py-(py-start.camY)*k+(now.y-start.y);moved=true;pinched=true;
    }else{
      const dx=now.x-start.x,dy=now.y-start.y;if(Math.hypot(dx,dy)>6)moved=true;
      if(moved){cam.x=start.camX+dx;cam.y=start.camY+dy;}
    }
    sync();
  };
  // After a pinch, ease the zoom to the nearest crisp size (a whole number of screen pixels per room pixel), about
  // the middle of the view, over a few frames.
  const settleZoom=()=>{
    const fit=canvas._fit;if(!fit||fit*cam.zoom<3)return;
    const to=Math.max(minZoom(canvas),Math.min(MAX_ZOOM,Math.round(fit*cam.zoom)/fit));if(Math.abs(to-cam.zoom)<1e-3)return;
    const from=cam.zoom,t0=performance.now(),step=now=>{const k=Math.min(1,(now-t0)/140),z=from+(to-from)*(1-(1-k)**3),f=z/cam.zoom;
      cam.zoom=z;cam.x*=f;cam.y*=f;sync();if(k<1&&!pts.size)requestAnimationFrame(step);};
    requestAnimationFrame(step);
  };
  const end=(e,tap)=>{
    if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);
    if(held){held.end();held=null;}
    if(pts.size){start=snap();return;}
    canvas.classList.remove('dragging');if(tap&&!moved)onTap?.(e);
    if(pinched){pinched=false;settleZoom();}
  };
  canvas.onpointerup=e=>end(e,true);canvas.onpointercancel=e=>end(e,false);
  if(resetButton)resetButton.onclick=()=>{cam.x=0;cam.y=0;cam.zoom=1;sync();};
  // Zoom buttons (laptop): step about the middle of the view.
  const zoomBy=f=>{const z=Math.max(minZoom(canvas),Math.min(MAX_ZOOM,Math.round(cam.zoom*f*4)/4)),k=z/cam.zoom;cam.zoom=z;cam.x*=k;cam.y*=k;sync();};
  if(zoomIn)zoomIn.onclick=()=>zoomBy(1.5);
  if(zoomOut)zoomOut.onclick=()=>zoomBy(1/1.5);
  const baseSync=sync;sync=()=>{baseSync();if(zoomIn)zoomIn.disabled=cam.zoom>=MAX_ZOOM;if(zoomOut)zoomOut.disabled=cam.zoom<=minZoom(canvas);};
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
  // Keeps a 2px soil speck or grass fringe from poking past the island's side corners.
  const inSoil=X=>Math.max(ox-2*(bot-mid),Math.min(ox+2*(bot-mid)-2,Math.round(X)));
  // island sides: soil under the front-left and front-right edges, the grass edge pushed T pixels straight down:
  // full width under the side corners, coming to a point at the front
  for(let y=Math.round(mid);y<=bot+T;y++){const hw=2*Math.min(bot-mid,bot+T-y),hwTop=2*Math.max(0,bot-y);if(hw<=hwTop)continue;
    g.fillStyle='#8a6646';g.fillRect(ox-hw,y,hw-hwTop,1);g.fillStyle='#a07a55';g.fillRect(ox+hwTop,y,hw-hwTop,1);}
  for(let i=0;i<260;i++){const t=hash(i+.3),side=t<.5?-1:1,u=hash(i+9.1),y=mid+u*(bot-mid),hw=2*(bot-y),dy=hash(i+4.2)*(T-4);
    g.fillStyle=hash(i+2)<.5?'#74553a':'#b58c63';g.fillRect(inSoil(ox+side*hw-(side<0?2:0)),Math.round(y+2+dy),2,1);}
  // grass top, a pixel row at a time so the diamond edges stay crisp
  for(let y=top;y<=bot;y++){const hw=2*Math.min(y-top,bot-y);g.fillStyle='#9ccf7f';g.fillRect(ox-hw,y,hw*2,1);}
  // grass fringe hanging over the soil edge
  for(let i=0;i<120;i++){const u=hash(i+20.5),y=mid+u*(bot-mid),hw=2*(bot-y),side=hash(i+3.3)<.5?-1:1;g.fillStyle='#7fb86a';g.fillRect(inSoil(ox+side*hw-1),Math.round(y)+1,2,1+Math.floor(hash(i+5)*3));}
  const inside=(x,y)=>x>-G+4&&y>-G+4&&x<180+G-4&&y<180+G-4,inRoom=(x,y)=>x>-6&&y>-6&&x<186&&y<186;
  // soft shadow where the room sits on the grass
  for(let y=oy;y<=oy+180+8;y++){const hw=2*Math.min(y-oy,oy+188-y);g.fillStyle='#86bb6c';g.fillRect(ox-hw-6,y+4,hw*2+12,1);}
  const span=180+2*G,many=n=>Math.round(n*(span/380)**2),at=(x,y)=>project(x,y).map(Math.round),put=(X,Y,col)=>{g.fillStyle=col;g.fillRect(X,Y,1,1);};
  // A random point on the grass at least `m` units clear of the room, and not behind it (where only a pixel or two
  // would peek out past the walls).
  const hidden=(x,y)=>{const [X,Y]=project(x,y),d=Math.abs(X-ox);return d<=192&&Y<=oy+192-d/2;};
  const spot=(k,m=6)=>{const x=-G+hash(k)*span,y=-G+hash(k+.5)*span;return inside(x,y)&&!(x>-m&&y>-m&&x<180+m&&y<180+m)&&!hidden(x,y)?[x,y]:null;};
  // patches of deeper grass, dithered so they stay soft
  for(let i=0;i<many(9);i++){const c=spot(i+300,40);if(!c)continue;const [X,Y]=at(...c),rx=14+Math.round(hash(i+301)*16),ry=Math.round(rx/2);
    for(let dy=-ry;dy<=ry;dy++){const hw=Math.round(rx*Math.sqrt(1-(dy/ry)**2));for(let dx=-hw;dx<=hw;dx++)if((dx+dy)%2===0&&Math.abs(dx)<hw-1+hash(dx*7+dy)*3)put(X+dx,Y+dy,'#93c878');}}
  // texture: light and dark tufts
  for(let i=0;i<many(1400);i++){const c=spot(i);if(!c)continue;const [X,Y]=at(...c),dark=hash(i+.9)<.55;g.fillStyle=dark?'#7fb86a':'#b5dd8f';
    g.fillRect(X,Y,1,1);if(dark){g.fillRect(X-1,Y-1,1,1);g.fillRect(X+1,Y-1,1,1);}}
  // pebbles in twos and threes
  for(let i=0;i<many(10);i++){const c=spot(i+500,10);if(!c)continue;const [X,Y]=at(...c);
    for(let k=0;k<2+(i%2);k++){const px=X+k*3-2,py=Y+(k%2);g.fillStyle='#8f9a88';g.fillRect(px,py+1,3,1);g.fillStyle='#c9cdbf';g.fillRect(px,py,3,1);put(px,py,'#e4e6dc');}}
  // a couple of tiny mushrooms
  for(let i=0;i<many(3);i++){const c=spot(i+700,10);if(!c)continue;const [X,Y]=at(...c);
    g.fillStyle='#efe3cf';g.fillRect(X,Y-1,1,2);g.fillStyle='#d9636f';g.fillRect(X-1,Y-3,3,1);g.fillRect(X-2,Y-2,5,1);put(X,Y-3,'#fbf6ee');}
  // flowers: scattered singles, and a few clumps of one colour
  const FL=['#ff9ec4','#ffe39a','#fbf6ee','#b4a2ff'];
  const flower=(X,Y,col)=>{g.fillStyle='#5d9a4c';g.fillRect(X,Y,1,2);g.fillStyle=col;g.fillRect(X-1,Y-1,3,1);g.fillRect(X,Y-2,1,3);if(col!=='#ffe39a')put(X,Y-1,'#ffe39a');};
  for(let i=0;i<many(150);i++){const c=spot(i+50,10);if(c)flower(...at(...c),FL[i%4]);}
  for(let i=0;i<many(8);i++){const c=spot(i+900,16);if(!c)continue;const [X,Y]=at(...c),col=FL[i%4];
    for(let k=0;k<5;k++)flower(X+Math.round((hash(i*9+k)-.5)*14),Y+Math.round((hash(i*9+k+.3)-.5)*7),col);}
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
  b.drawImage(atlasImage,rm.x,rm.y,rm.w,rm.h,0,0,rm.w,rm.h);
  // The wall grid goes under the things hanging on the walls.
  const wallPick=arrange.on&&wallItems.find(o=>o.id===(arrange.drag||arrange.sel));
  if(wallPick)drawWallGrid(b);
  wallItems.forEach(w=>drawWallItem(b,w));

  const pose=cat.alive?currentPose(time,cat,reaction):null;
  // Arrange mode: the floor grid with the picked piece's footprint shaded on it (red where it won't fit); for the
  // window, the wall grid. The piece itself gets a ring round its own pixels, drawn after the furniture below.
  const pick=arrange.on&&(arrange.drag||arrange.sel),pickWall=pick&&wallItems.find(o=>o.id===pick),pickIt=pick&&roomItems.find(i=>i.id===pick);
  if(arrange.on&&!pickWall){drawFloorGrid(b);if(pickIt&&!hostOf(pickIt))drawFootprint(b,pickIt,...itemPos(pickIt),'rgba(143,224,188,.4)');
    if(pickIt&&typeof arrange.blocked?.[0]==='number')drawFootprint(b,pickIt,...arrange.blocked,'rgba(255,90,120,.35)');}
  // Rugs lie flat under everything; the rest is depth-sorted by x + y (further back first). Small things on a
  // shelf are drawn with it.
  const items=[];
  const drawPiece=(it,lift)=>{const [x,y,z=0]=itemPos(it),name=typeof it.sprite==='function'?it.sprite(cat):it.sprite;
    if(!z)drawShadow(b,x,y,0,it.shadow);
    if(it.bowl){const [full,empty,need]=it.bowl,lv=cat[need],frac=lv>60?1:lv>30?.6:lv>10?.3:0,s=CAT_ATLAS.sprites[full],[X,Y]=project(x,y,z+lift);
      b.drawImage(bowlLevel(full,empty,frac),Math.round(X-s.anchor[0]),Math.round(Y-s.anchor[1]));}
    else drawSprite(b,name,x,y,z+lift);
    // What stands on it, back to front: on each open rack first, with the shelf's board above drawn over it.
    const kids=carried(it).sort((p,q)=>itemPos(p)[0]+itemPos(p)[1]-itemPos(q)[0]-itemPos(q)[1]),rack=RACKS[kindOf(RACKS,it.base)]||[];
    const kid=o=>drawPiece(o,lift+(arrange.drag===o.id?3:0));
    for(const [rz,boxes] of rack){kids.filter(o=>itemPos(o)[2]===rz).forEach(kid);
      const s=CAT_ATLAS.sprites[name],[X,Y]=project(x,y,z+lift);b.drawImage(spriteBoxes(name,boxes),Math.round(X-s.anchor[0]),Math.round(Y-s.anchor[1]));}
    if(it.id==='litter')drawLitterMess(b,x,y,cat.cleanliness,time);
    kids.filter(o=>!rack.some(([rz])=>itemPos(o)[2]===rz)).forEach(kid);};
  roomItems.forEach((it,i)=>{
    if(it.id===playToy&&pose?.hideYarn||hostOf(it))return;
    const [x,y]=itemPos(it),lift=arrange.drag===it.id?3:0,draw=()=>drawPiece(it,lift);
    if(it.flat)draw();else items.push({depth:x+y+i/1000+(lift?400:0),draw});
  });
  let catXY=null,glowEyes=null;
  if(pose){
    // Small bias keeps the cat in front of the bed / litter tray it is sitting in; up on (or jumping onto) a
    // piece of furniture it is drawn just in front of that piece.
    const eyes=pose.anim==='inside'&&SPOT[pose.spot]?.[10];
    // Inside a condo or teepee only the eyes show, drawn in their place (so whatever stands nearer hides them); the
    // pixels of them still showing are lit again after the night tint so they glow in the dark.
    if(eyes)items.push({depth:pose.depth+.5,draw:()=>{const [X,Y]=project(...eyes);drawEyes(b,X,Y,time);glowEyes=[Math.round(X)-3,Math.round(Y)];}});
    // In the cardboard box: its front walls go back over the cat.
    const box=pose.depth!=null&&roomItems.find(it=>COVERS[kindOf(COVERS,it.base)]&&!hostOf(it)&&(([ix,iy],[a0,b0,a1,b1])=>pose.x>ix+a0&&pose.x<ix+a1&&pose.y>iy+b0&&pose.y<iy+b1)(itemPos(it),footprint(it)));
    if(box)items.push({depth:pose.depth+.6,draw:()=>{const s=CAT_ATLAS.sprites[box.sprite],[X,Y]=project(...itemPos(box));b.drawImage(spriteBoxes(box.sprite,COVERS[kindOf(COVERS,box.base)]),Math.round(X-s.anchor[0]),Math.round(Y-s.anchor[1]));}});
    if(!eyes)items.push({depth:pose.depth!=null?pose.depth+.5:pose.x+pose.y+(pose.z?1:0),draw:()=>{
      const [X,Y]=project(pose.x,pose.y,pose.z);catXY=[X,Y];
      if(pose.squeeze){drawSqueezing(b,cat.coat,pose,X,Y);return;}
      if(!pose.z)drawShadow(b,pose.x,pose.y,0,8);
      drawCatFrame(b,cat.coat,pose.anim,pose.animT,X,Y+(pose.anim==='sleep'?2:0),pose.flip);
    }});
  }
  items.sort((a,c)=>a.depth-c.depth).forEach(it=>it.draw());
  if(glowEyes){const [x,y]=glowEyes,d=b.getImageData(x,y,6,1).data;glowEyes=[0,1,4,5].filter(i=>d[i*4]===243&&d[i*4+1]===227&&d[i*4+2]===124).map(i=>[x+i,y]);}
  // Over everything: the ring round the picked piece (so it shows through what stands nearer), and a red one where
  // it won't fit.
  if(pickWall){const {s,x,y}=wallRect(pickWall);b.drawImage(spriteRing(s,PICK_RING),x-1,y-1);
    if(typeof arrange.blocked?.[0]==='string'){const r=wallRect(pickWall,arrange.blocked);b.drawImage(spriteRing(r.s,BLOCK_RING),r.x-1,r.y-1);}}
  if(pickIt){const s=CAT_ATLAS.sprites[pickIt.sprite],at=(x,y,z=0)=>{const [X,Y]=project(x,y,z);return [Math.round(X-s.anchor[0])-1,Math.round(Y-s.anchor[1])-1];};
    const [x,y,z=0]=itemPos(pickIt);b.drawImage(spriteRing(s,PICK_RING),...at(x,y,z+(arrange.drag===pickIt.id?3:0)));
    if(typeof arrange.blocked?.[0]==='number')b.drawImage(spriteRing(s,BLOCK_RING),...at(...arrange.blocked));}

  // Night: a cool tint over the room, then warm light pooling around each floor lamp.
  const night=nightAmount();
  if(night>0){
    b.globalCompositeOperation='source-atop';
    b.fillStyle=`rgba(38,30,86,${.42*night})`;b.fillRect(0,0,rm.w,rm.h);
    // Mask the light to the room's own pixels, then add it, so nothing glows outside the room.
    if(glowBuf.width!==rm.w||glowBuf.height!==rm.h){glowBuf.width=rm.w;glowBuf.height=rm.h;}
    const gb=glowBuf.getContext('2d');gb.globalCompositeOperation='source-over';gb.clearRect(0,0,rm.w,rm.h);
    gb.globalCompositeOperation='lighter';
    for(const lamp of roomItems.filter(i=>i.base.startsWith('floor_lamp'))){
      const [lpx,lpy]=itemPos(lamp),[lx2,ly2]=project(lpx,lpy,88),glow=gb.createRadialGradient(lx2,ly2,4,lx2,ly2,120);
      glow.addColorStop(0,`rgba(255,214,150,${.5*night})`);glow.addColorStop(.45,`rgba(255,190,130,${.18*night})`);glow.addColorStop(1,'rgba(255,190,130,0)');
      gb.fillStyle=glow;gb.fillRect(0,0,rm.w,rm.h);}
    gb.globalCompositeOperation='destination-in';gb.drawImage(roomBuf,0,0);
    b.globalCompositeOperation='lighter';b.drawImage(glowBuf,0,0);
    b.globalCompositeOperation='source-over';
  }
  if(glowEyes){b.fillStyle='#f3e37c';for(const [x,y] of glowEyes)b.fillRect(x,y,1,1);}
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
// Arrange mode: `drag` is the piece in hand, `sel` the last one touched (for Turn), `blocked` where it won't fit,
// `pending` a shop piece being placed before it's bought.
const arrange={on:false,drag:null,sel:null,blocked:null,pending:null};
// A 1px line between two room points [x, y, z], stepped every half unit so slopes come out as clean pixel stairs.
function isoLine(ctx,a,b){
  const n=Math.ceil(Math.max(...a.map((v,k)=>Math.abs(b[k]-v)))*2);
  for(let i=0;i<=n;i++){const [X,Y]=project(...a.map((v,k)=>v+(b[k]-v)*i/n));ctx.fillRect(Math.floor(X),Math.floor(Y),1,1);}
}
// Lines a shade darker than the floor (or wall) under them: the 10 x 10 floor tiles, edges included. The floor is
// washed paler first so its own pattern (wood planks, carpet) fades back and only the grid's lines stand out.
const GRID_INK='rgba(70,45,30,.26)';
function drawFloorGrid(ctx){
  ctx.fillStyle='rgba(255,250,242,.38)';ctx.beginPath();[[0,0],[180,0],[180,180],[0,180]].map(p=>project(...p)).forEach(([X,Y],i)=>i?ctx.lineTo(X,Y):ctx.moveTo(X,Y));ctx.fill();
  ctx.fillStyle=GRID_INK;
  for(let k=0;k<=180;k+=TILE){isoLine(ctx,[k,0,0],[k,180,0]);isoLine(ctx,[0,k,0],[180,k,0]);}
}
// The same grid on both back walls, shown while a window, picture or the clock is picked: 10 columns and
// 8 rows, so the squares end exactly at the floor and under the top trim.
const WALL_ROW=WALL_TOP/8;
function drawWallGrid(ctx){
  ctx.fillStyle=GRID_INK;
  for(let k=0;k<=180;k+=TILE){isoLine(ctx,[0,k,0],[0,k,WALL_TOP]);isoLine(ctx,[k,0,0],[k,0,WALL_TOP]);}
  for(let z=0;z<=WALL_TOP;z+=WALL_ROW){isoLine(ctx,[0,0,z],[0,180,z]);isoLine(ctx,[0,0,z],[180,0,z]);}
}
// The floor a piece takes up at x, y, shaded: its footprint, or the circle inside it for round things.
const ROUND=/^(basket_bed|bed_|rug_|floor_cushion|bowl_|scratch_post|side_table|floor_lamp|plant_|stool|cactus|treat_jar|toy_)/;
function drawFootprint(ctx,it,x,y,fill){
  const [a0,b0,a1,b1]=footprint(it),cx=x+(a0+a1)/2,cy=y+(b0+b1)/2;
  const pts=ROUND.test(it.base)?Array.from({length:48},(_,k)=>{const t=k/48*Math.PI*2;return [cx+(a1-a0)/2*Math.cos(t),cy+(b1-b0)/2*Math.sin(t),0];})
    :[[x+a0,y+b0,0],[x+a1,y+b0,0],[x+a1,y+b1,0],[x+a0,y+b1,0]];
  ctx.fillStyle=fill;ctx.beginPath();pts.map(p=>project(...p)).forEach(([X,Y],i)=>i?ctx.lineTo(X,Y):ctx.moveTo(X,Y));ctx.closePath();ctx.fill();
}
// A 1px ring just outside a sprite's own pixels (cached per sprite and colour), drawn one pixel up and left of it.
const PICK_RING='#8fe0bc',BLOCK_RING='#ff5a78',ringCache=new Map();
function spriteRing(s,colour){
  const key=s.x+','+s.y+colour;if(ringCache.has(key))return ringCache.get(key);
  const A=atlasData(),c=document.createElement('canvas');c.width=s.w+2;c.height=s.h+2;const x=c.getContext('2d'),img=x.createImageData(c.width,c.height);
  const on=(i,j)=>i>=0&&j>=0&&i<s.w&&j<s.h&&A.data[((s.y+j)*A.width+s.x+i)*4+3]>40,rgb=[1,3,5].map(k=>parseInt(colour.slice(k,k+2),16));
  for(let j=-1;j<=s.h;j++)for(let i=-1;i<=s.w;i++)if(!on(i,j)&&(on(i-1,j)||on(i+1,j)||on(i,j-1)||on(i,j+1)))img.data.set([...rgb,255],((j+1)*c.width+i+1)*4);
  x.putImageData(img,0,0);ringCache.set(key,c);return c;
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
// Pointer (room-space pixel) -> a point on the back walls: [side, along, z].
function wallAt([px,py]){const [ox,oy]=CAT_ATLAS.rooms[roomStyle].floorOrigin;
  if(px<ox){const a=ox-px;return ['left',a,oy+a/2-py];}const a=px-ox;return ['right',a,oy+a/2-py];}
// Front-most item under the pointer: floor pieces (what stands on a shelf before the shelf itself, the rug only
// if nothing stands on that pixel), then the walls.
function itemAt(canvas,clientX,clientY){
  const p=roomPoint(canvas,clientX,clientY);if(!p||!roomImagesLoaded)return null;
  const order=roomItems.filter(it=>!hostOf(it)).map((it,i)=>({it,d:it.flat?-1:itemPos(it)[0]+itemPos(it)[1]+i/1000})).sort((a,c)=>c.d-a.d);
  const hit=it=>{const [x,y,z=0]=itemPos(it),name=typeof it.sprite==='function'?it.sprite({hunger:50,thirst:50}):it.sprite;return spriteHit(name,x,y,z,...p);};
  for(const {it} of order){const on=carried(it).find(hit);if(on)return on;
    if(hit(it))return it;}
  for(const w of [...wallItems].reverse()){const {s,x,y}=wallRect(w),sx=Math.floor(p[0]-x),sy=Math.floor(p[1]-y);
    if(sx>=0&&sy>=0&&sx<s.w&&sy<s.h&&atlasData().data[((s.y+sy)*atlasPixels.width+(s.x+sx))*4+3]>40)return w;}
  return null;
}
// The free shelf spot nearest the pointer (within a few pixels), as [shelf id, spot index], or null.
function slotAt(p,id){
  let best=null,bd=11;
  for(const h of roomItems){if(!h.surfaces||h.id===id)continue;const [hx,hy]=itemPos(h);
    h.surfaces.forEach((s,k)=>{if(roomItems.some(o=>{const l=o.id!==id&&shelfPlace(o);return l&&l[1]===h.id&&l[2]===k;}))return;
      const [X,Y]=project(hx+s[0],hy+s[1],s[2]),d=Math.hypot(p[0]-X,p[1]-(Y-5));if(d<bd){bd=d;best=[h.id,k];}});}
  return best;
}
// The free spot on a wall closest to (along, z), or null when nothing fits there.
function nearestWallSpot(w,side,along,z){
  const s=wallSprite(w,side);let best=null,bd=Infinity;
  for(let a=2;a+s.wall_width_u<=178;a+=2)for(let h=6;h+s.height_px<=WALL_TOP;h+=2){const d=(a-along)**2+(h-z)**2;if(d<bd&&wallOk(w.id,side,a,h)){bd=d;best=[a,h];}}
  return best;
}
// Drag a window, picture or the clock along the walls, round the corner onto the other wall if wanted.
function grabWall(canvas,w,p,{onMove,onDrop}){
  const [,a0,z0]=wallPos(w),[,pa,pz]=wallAt(p),off=[a0-pa,z0-pz];
  arrange.drag=arrange.sel=w.id;arrange.blocked=null;
  return {
    move(ev){const q=roomPoint(canvas,ev.clientX,ev.clientY);if(!q)return;const [side,a,z]=wallAt(q),s=wallSprite(w,side);
      const along=Math.max(2,Math.min(178-s.wall_width_u,Math.round((a+off[0])/2)*2)),zz=Math.max(6,Math.min(WALL_TOP-s.height_px,Math.round((z+off[1])/2)*2));
      // Over something else on that wall: the nearest free spot on the same wall; red only when the wall is full.
      const spot=wallOk(w.id,side,along,zz)?[along,zz]:nearestWallSpot(w,side,along,zz);
      if(spot){roomLayout={...roomLayout,[w.id]:[side,...spot]};updateSpots();arrange.blocked=null;}else arrange.blocked=[side,along,zz];onMove?.();},
    end(){const full=!!arrange.blocked;arrange.drag=null;arrange.blocked=null;onDrop?.(roomLayout,w.id,full);},
  };
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
  const p=roomPoint(canvas,e.clientX,e.clientY);if(it.wall)return grabWall(canvas,it,p,{onMove,onDrop});
  // Small things follow the pointer itself (they may be lifted off a shelf), the rest keep the grab offset.
  const [fx,fy]=floorAt(...p),[x0,y0]=itemPos(it),off=it.small?[0,0]:[x0-fx,y0-fy];
  arrange.drag=arrange.sel=it.id;arrange.blocked=null;
  // Snap to the grid and stay inside the walls. Over another piece it stays put (shown in red) — unless it
  // already overlapped something when picked up, then it moves freely until it reaches a clear spot.
  const [a0,b0,a1,b1]=footprint(it);let loose=!!hostOf(it)||!placementOk(it.id,x0,y0);
  const snap=(v,lo,hi)=>Math.max(Math.ceil(lo/GRID)*GRID,Math.min(Math.floor(hi/GRID)*GRID,Math.round(v/GRID)*GRID));
  return {
    move(ev){const q=roomPoint(canvas,ev.clientX,ev.clientY);if(!q)return;
      // Near a free shelf spot, a small thing jumps onto the shelf.
      const slot=it.small&&slotAt(q,it.id);
      if(slot){roomLayout={...roomLayout,[it.id]:['on',...slot]};arrange.blocked=null;loose=true;onMove?.();return;}
      const [gx,gy]=floorAt(...q);
      const x=snap(gx+off[0],-a0,180-a1),y=snap(gy+off[1],-b0,180-b1),ok=placementOk(it.id,x,y);
      if(ok||loose){roomLayout={...roomLayout,[it.id]:[x,y]};updateSpots();if(ok)loose=false;arrange.blocked=null;}else arrange.blocked=[x,y];onMove?.();},
    end(){const stuck=!!arrange.blocked;arrange.drag=null;arrange.blocked=null;onDrop?.(roomLayout,it.id,stuck);},
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
function drawSpriteIcon(canvas,name,fill){
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  const s=CAT_ATLAS.sprites[name]||CAT_ATLAS.sprites[name+'_left'];if(!roomImagesLoaded||!s)return;
  // Whole-number zoom for small sprites; big ones (the litter tray) halve so pixels stay even. `fill` (shop
  // thumbnails, drawn on a double-resolution canvas) scales to fit so tall and wide pieces look the same size.
  const fit=Math.min((canvas.width-4)/s.w,(canvas.height-4)/s.h),k=fill?Math.min(fit,canvas.width/24):fit>=1?Math.floor(fit):fit>=.5?.5:.25;
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
