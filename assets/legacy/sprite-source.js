// Editable source for our original PNG assets. Not loaded by the app.
function pixelBrush(canvas){
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
  // Scanline fill avoids antialiased edges on diagonals.
  const poly=(points,c)=>{
    const top=Math.floor(Math.min(...points.map(p=>p[1]))),bottom=Math.ceil(Math.max(...points.map(p=>p[1])));
    for(let y=top;y<bottom;y++){
      const hits=[];
      for(let i=0;i<points.length;i++){
        const a=points[i],b=points[(i+1)%points.length],scan=y+.5;
        if((a[1]<=scan&&b[1]>scan)||(b[1]<=scan&&a[1]>scan))hits.push(a[0]+(scan-a[1])*(b[0]-a[0])/(b[1]-a[1]));
      }
      hits.sort((a,b)=>a-b);
      for(let i=0;i+1<hits.length;i+=2){const left=Math.ceil(hits[i]-.5),right=Math.ceil(hits[i+1]-.5);r(left,y,right-left,1,c);}
    }
  };
  return {ctx,r,poly};
}

function makeRoomBackground(canvas){
  canvas.width=320;canvas.height=320;
  const {r,poly}=pixelBrush(canvas);
  r(0,0,320,320,ROOM_SPRITES.stage.background);
  // Every wall and floor edge uses the same 148 : 80 isometric slope.
  poly([[6,230],[160,312],[314,230],[160,148]],'#a8a997');
  poly([[6,226],[160,308],[314,226],[160,144]],'#d7d4bf');
  poly([[12,224],[160,304],[308,224],[160,144]],'#faf6e3');
  poly([[12,120],[160,40],[160,144],[12,224]],'#bea9a4');
  poly([[160,40],[308,120],[308,224],[160,144]],'#e8e2cd');
  poly([[6,117],[160,33],[314,117],[308,124],[160,40],[12,124]],'#fffbe8');
  poly([[6,117],[12,120],[12,224],[6,227]],'#e8e2ce');
  poly([[308,120],[314,117],[314,227],[308,224]],'#b7a59b');
  poly([[12,219],[160,139],[160,144],[12,224]],'#d9c9b7');
  poly([[160,139],[308,219],[308,224],[160,144]],'#cecbb4');
  poly([[12,224],[160,304],[160,308],[12,228]],'#e7e1cb');
  poly([[160,304],[308,224],[308,228],[160,308]],'#c8c7ae');
  r(159,40,2,100,'#b1a498');
}

function makeObjectAtlas(canvas){
  canvas.width=384;canvas.height=192;
  const {ctx,r,poly}=pixelBrush(canvas),ink='#69656b';
  const draw=(id,fn)=>{ctx.save();ctx.translate((id%6)*64,Math.floor(id/6)*64);fn();ctx.restore();};
  draw(0,()=>{
    // Rounded upholstered corners, thick bolsters, and a recessed cushion.
    poly([[3,24],[7,19],[25,9],[38,9],[56,19],[61,24],[61,34],[56,39],[38,49],[25,49],[7,39],[3,34]],'#496a80');
    poly([[4,25],[8,20],[26,10],[37,10],[55,20],[60,25],[55,29],[36,18],[27,18],[10,29]],'#7c9db4');
    poly([[7,22],[26,12],[37,12],[55,22],[50,26],[36,18],[28,18],[12,27]],'#9db7c8');
    poly([[12,27],[17,23],[28,18],[36,18],[48,24],[52,28],[48,32],[36,39],[28,39],[16,32]],'#f3e9ce');
    poly([[14,29],[28,37],[36,37],[50,29],[48,33],[36,40],[28,40],[16,33]],'#dacfb2');
    poly([[4,27],[10,25],[27,35],[37,35],[55,25],[60,27],[58,34],[38,45],[25,45],[6,34]],'#7197ad');
    poly([[6,28],[10,27],[27,37],[37,37],[55,27],[58,28],[55,31],[37,41],[27,41],[9,31]],'#9ab6c6');
    poly([[6,34],[25,45],[38,45],[58,34],[56,39],[38,49],[25,49],[8,39]],'#52788f');
    for(const [x,y] of [[16,17],[24,13],[38,13],[46,17]]){r(x,y,1,6,'#66879e');r(x+1,y,1,2,'#b0c6d0');}
  });
  const plant=(small)=>{
    ctx.save();if(small){ctx.translate(15,24);ctx.scale(.65,.65);}
    poly([[18,48],[33,42],[47,48],[33,55]],'#9fa5b0');
    poly([[19,47],[33,53],[33,63],[21,58]],small?'#ba8996':'#6b86a0');
    poly([[33,53],[46,47],[44,58],[33,63]],small?'#986879':'#516b87');
    poly([[20,46],[33,41],[46,46],[33,51]],'#53616b');r(32,14,2,33,'#52765d');
    poly([[32,27],[23,20],[20,12],[24,9],[32,17]],'#43876b');
    poly([[33,20],[29,10],[30,3],[34,0],[39,5],[38,14]],'#559981');
    poly([[33,36],[41,29],[46,18],[41,17],[34,25]],'#35735b');
    poly([[32,42],[22,35],[16,23],[21,23],[32,31]],'#367b61');
    poly([[33,44],[45,37],[51,27],[45,26],[34,35]],'#4b9276');
    r(32,5,1,13,'#71aa8e');r(24,14,1,6,'#69a487');ctx.restore();
  };
  draw(1,()=>plant(false));draw(2,()=>plant(true));
  draw(3,()=>{
    poly([[5,25],[49,1],[49,35],[5,59]],ink);
    poly([[8,26],[46,5],[46,34],[8,55]],'#f5f0dd');
    poly([[10,27],[44,9],[44,33],[10,51]],'#add8df');
    poly([[11,29],[18,25],[18,46],[11,50]],'#cbe7e8');
    poly([[26,18],[28,17],[28,43],[26,44]],'#7c939a');
    poly([[10,39],[44,21],[44,23],[10,41]],'#7c939a');
    poly([[4,57],[50,32],[55,34],[9,60]],'#fff4dd');
    // Hanging vertical slats share the wall's diagonal header.
    for(let x=7;x<49;x+=4){const y=25-(x-5)*24/44;poly([[x,y],[x+3,y-2],[x+3,y+13],[x,y+15]],'#fff1d0');r(x,Math.round(y),1,14,'#c6af91');}
    poly([[4,23],[50,-2],[50,0],[4,25]],'#b59980');
  });
  draw(4,()=>{
    poly([[13,3],[46,21],[46,58],[13,40]],'#8a7c80');
    poly([[16,8],[43,23],[43,53],[16,38]],'#faf0d7');
    poly([[24,32],[34,37],[34,46],[24,41]],'#c28990');
    r(29,21,2,17,'#567d66');poly([[30,29],[22,21],[24,18],[30,24]],'#7b9d70');poly([[30,32],[38,28],[37,23],[30,28]],'#5f896b');
  });
  const bowl=(water,empty)=>{
    const light=water?'#a7cfdf':'#ead6ab',dark=water?'#688fa3':'#bba27b';
    const ellipse=(cx,cy,rx,ry,color)=>{for(let y=-ry;y<=ry;y++){const extent=Math.floor(rx*Math.sqrt(Math.max(0,1-y*y/(ry*ry))));r(cx-extent,cy+y,extent*2+1,1,color);}};
    ellipse(31,40,21,6,'#c3b9ab');ellipse(31,33,20,10,dark);r(11,25,41,8,dark);
    ellipse(31,25,21,9,light);ellipse(31,25,16,6,empty?'#9b9389':water?'#69aacb':'#705243');
    if(!empty&&water){r(22,22,12,1,'#aad6e4');r(25,23,15,1,'#aad6e4');r(29,28,7,1,'#94c7dc');}
    if(!empty&&!water)for(const [x,y]of [[23,24],[28,22],[34,24],[29,26],[37,25],[24,27]]){r(x,y,3,2,'#ce8d50');r(x,y,1,1,'#f1c078');}
    r(15,34,3,2,light);r(18,36,9,1,light);
  };
  draw(5,()=>bowl(false,false));draw(6,()=>bowl(true,false));draw(8,()=>bowl(false,true));draw(9,()=>bowl(true,true));
  const litter=(dirty)=>{
    poly([[5,31],[31,18],[59,32],[32,46]],'#6d8196');
    poly([[5,31],[32,45],[32,55],[5,41]],'#859bb0');poly([[32,45],[59,32],[59,42],[32,55]],'#687f97');
    poly([[8,29],[31,17],[56,30],[32,42]],'#b8cbd6');
    poly([[13,30],[31,21],[50,30],[32,39]],'#dbcdb0');
    for(const [x,y]of [[21,29],[33,25],[39,32],[29,34],[44,30]])r(x,y,2,1,'#bba781');
    if(dirty){r(23,30,4,2,'#8c7864');r(35,28,4,2,'#8c7864');}
  };
  draw(7,()=>litter(false));draw(10,()=>litter(true));
  draw(11,()=>{
    poly([[1,30],[31,15],[63,30],[32,47]],'#869d96');
    poly([[6,30],[31,18],[58,30],[32,43]],'#b5c4ad');
    poly([[11,30],[31,21],[53,30],[32,40]],'#c9d4ba');
    for(let x=9;x<32;x+=5)r(x,33+Math.floor((x-9)/2),2,1,'#9fac98');
  });
  draw(12,()=>{
    poly([[10,20],[44,2],[44,43],[10,61]],'#85736d');
    poly([[14,22],[40,8],[40,41],[14,55]],'#acd1d4');
    poly([[15,24],[21,21],[21,51],[15,54]],'#cce3e1');
    poly([[10,20],[44,2],[46,4],[12,22]],'#9b8980');
  });
}

function makeCatAtlas(canvas){
  canvas.width=256;canvas.height=192;
  const {ctx,r,poly}=pixelBrush(canvas);
  const outline='#6b5b54',fur='#fff0d4',shade='#dcc9aa',patch='#b58c75',pink='#dba69a';
  const oval=(x,y,w,h,color)=>{r(x+2,y,w-4,h,color);r(x,y+2,w,h-4,color);};
  const face=(x,y,blink)=>{
    r(x+1,y-3,4,5,outline);r(x+11,y-3,4,5,outline);r(x+2,y-2,2,4,pink);r(x+12,y-2,2,4,pink);
    oval(x,y,16,12,outline);oval(x+1,y+1,14,10,fur);
    r(x+1,y+1,5,4,patch);r(x+11,y+1,3,3,patch);
    r(x+3,y+5,2,blink?1:2,outline);r(x+10,y+5,2,blink?1:2,outline);
    r(x+7,y+7,2,1,pink);r(x+7,y+8,1,1,outline);r(x+2,y+9,3,1,shade);r(x+11,y+9,2,1,shade);
  };
  const sitting=(frame)=>{
    const breathe=frame===2?1:0;
    oval(8,14,15,14,outline);oval(9,15,13,12,fur);r(16,16,5,6,patch);r(9,23,3,3,shade);
    r(21,22,7,3,outline);r(26,17-frame%2,3,7,outline);r(22,23,5,1,patch);r(27,18-frame%2,1,5,patch);
    r(9,26,5,3,outline);r(16,26,5,3,outline);r(10,26,3,2,fur);r(17,26,3,2,fur);
    face(6,7+breathe,frame===3);
  };
  const walking=(frame)=>{
    const step=frame%3,bob=frame%2;
    oval(7,15+bob,17,10,outline);oval(8,16+bob,15,8,fur);r(17,17+bob,5,5,patch);
    r(8+step,24,3,5,outline);r(9+step,24,2,4,fur);r(18-step,24,3,5,outline);r(19-step,24,2,4,fur);
    r(23,15+bob,6,3,outline);r(28,9+bob,2,8,outline);r(24,16+bob,5,1,patch);r(29,10+bob,1,6,patch);
    face(2,10+bob,false);
  };
  const sleeping=(frame)=>{
    poly([[13,13],[23,13],[29,17],[31,22],[30,26],[25,29],[11,29],[7,25],[8,18]],outline);
    poly([[13,14],[23,14],[28,18],[30,22],[29,26],[25,28],[11,28],[8,24],[9,18]],fur);
    poly([[18,15],[24,16],[28,19],[29,23],[27,27],[20,27],[17,24],[17,19]],patch);
    r(5,17,3,4,outline);r(5,18,2,3,pink);r(12,18,3,3,outline);oval(3,20,13,8,outline);oval(4,21,11,6,fur);
    r(6,23,3,1,outline);r(12,23,2,1,outline);r(10,25,1,1,pink);
    r(17,23,1,4,outline);r(18,22,5,1,outline);r(23,23,1,3,outline);r(20,26,4,1,outline);
    r(12,27,4,1,shade);if(frame%2)r(20,14,4,1,fur);
  };
  Object.entries(ROOM_SPRITES.cat.animations).forEach(([name,animation])=>{
    for(let frame=0;frame<animation.frames;frame++){
      ctx.save();ctx.translate(frame*32,animation.row*32);
      if(name==='sleep'){ctx.translate(0,frame%2?-1:0);sleeping(frame);}
      else if(name==='walk')walking(frame);
      else if(name==='eat'){
        oval(10,16,17,11,outline);oval(11,17,15,9,fur);r(20,17,5,6,patch);
        r(24,25,5,2,outline);r(12,25,3,3,outline);face(2,16+frame%2,frame===2);
      }else if(name==='groom'){
        sitting(frame);r(3,18+frame%2,8,3,outline);r(4,18+frame%2,6,2,fur);r(5,20+frame%2,2,1,pink);
      }else if(name==='play'){
        ctx.translate(0,-[0,2,5,7,4,1][frame]);walking(frame);r(3,24,6,2,outline);r(4,24,5,1,fur);
      }else sitting(frame);
      ctx.restore();
    }
  });
}
