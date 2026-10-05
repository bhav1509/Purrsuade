const STORE='communication-quest-week1-v1';
const $=s=>document.querySelector(s);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const round1=n=>Math.round(n*10)/10;
// Local calendar dates (YYYY-MM-DD), so late-night sessions land on the day you did them.
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today=()=>ymd(new Date());
const dayDiff=(a,b)=>Math.floor((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000);

const BASE_TOPICS=[
  [1,'Introduce yourself without mentioning your job title.'],[1,'Describe your ideal weekend and what makes it enjoyable.'],[1,'Talk about a hobby you could do for hours.'],[1,'Describe a place that makes you feel calm.'],[1,'Talk about a small habit that improved your life.'],[1,'Describe a meal you always enjoy.'],[1,'Talk about one thing you are looking forward to.'],[1,'Describe your morning routine.'],[1,'Talk about a skill you would like to learn.'],[1,'Describe a person who has influenced you positively.'],
  [2,'Tell a story about a time something did not go as planned.'],[2,'Describe a memorable conversation and why it stayed with you.'],[2,'Tell the story of a decision you are glad you made.'],[2,'Describe a time you helped someone solve a problem.'],[2,'Talk about a mistake that taught you something useful.'],[2,'Describe a trip or outing you remember clearly.'],[2,'Tell a story about a moment you felt proud of yourself.'],[2,'Describe a time you had to adapt quickly.'],[2,'Talk about a challenge you initially underestimated.'],[2,'Describe a funny misunderstanding.'],
  [3,'Explain APIs to a non-technical person using an everyday analogy.'],[3,'Explain why prioritisation matters when several tasks are urgent.'],[3,'Explain a technical problem you solved without using jargon.'],[3,'Explain what makes a meeting useful rather than wasteful.'],[3,'Explain how you decide whether information online is trustworthy.'],[3,'Explain a process you know well to a complete beginner.'],[3,'Explain why sleep matters for performance.'],[3,'Explain how compound interest works in simple language.'],[3,'Explain the difference between being busy and being productive.'],[3,'Explain how you would organise a large personal project.'],
  [4,'Should people work from the office, remotely, or both? Defend your view.'],[4,'Is being busy the same as being productive? Give your view with examples.'],[4,'Should AI tools be encouraged at work? Present a balanced opinion.'],[4,'Is it better to specialise deeply or learn many skills? Argue your position.'],[4,'Should meetings default to 30 minutes instead of one hour?'],[4,'Is social media more useful or distracting for professionals?'],[4,'Should everyone learn basic financial literacy in school?'],[4,'Is consistency more important than motivation?'],[4,'Should companies allow employees to work four days a week?'],[4,'Is failure necessary for meaningful growth?'],
  [5,'Give a concise project update to a manager: progress, blocker, next step.'],[5,'Explain a production issue to a stakeholder who is not technical.'],[5,'Pitch an improvement to an existing team process.'],[5,'Politely disagree with a senior colleague and propose an alternative.'],[5,'Ask your manager for more ownership in your role.'],[5,'Explain why a deadline needs to move without sounding defensive.'],[5,'Introduce yourself in a professional networking conversation.'],[5,'Give feedback to a teammate whose work needs improvement.'],[5,'Present two solution options and recommend one.'],[5,'Summarise a complex discussion into three clear next steps.'],
  [6,'Convince a team to adopt a new tool for one month.'],[6,'Respond to: “Why should I care about this problem?”'],[6,'Speak about a topic you know little about while separating facts from assumptions.'],[6,'Persuade a skeptical audience to try a new process.'],[6,'Defend an unpopular but reasonable workplace decision.'],[6,'Respond to a customer who says your solution is too expensive.'],[6,'Explain why your proposal deserves priority over another good proposal.'],[6,'Handle a meeting where people keep interrupting you.'],[6,'Give a spontaneous two-minute talk on the value of curiosity.'],[6,'Make the case for simplifying a process everyone is used to.'],
  [7,'A stakeholder rejects your proposal in a meeting. Respond calmly and move the discussion forward.'],[7,'Deliver bad news about a delay while preserving confidence and trust.'],[7,'Defend a decision under challenging follow-up questions.'],[7,'Persuade a skeptical audience to try an idea for one month.'],[7,'Respond when a senior leader challenges your data in front of others.'],[7,'Resolve a disagreement between two teammates with opposing priorities.'],[7,'Pitch an unfamiliar idea to an executive in two minutes.'],[7,'Answer: “Why should we trust you to lead this?”'],[7,'Explain a major failure while showing accountability and a recovery plan.'],[7,'Handle a difficult conversation with someone who strongly disagrees with you.']
];
const VARIATIONS=['',' Use one specific example.',' Keep a clear beginning, middle and end.',' Make your conclusion memorable.',' Explain it as if the listener knows nothing about the subject.',' Include one counterpoint before giving your conclusion.',' Keep your answer concise and avoid filler.',' Use an analogy or comparison.'];
const TOPICS=[];
outer: for(const [d,t] of BASE_TOPICS){for(const v of VARIATIONS){TOPICS.push({d,t:t+v});if(TOPICS.length===500)break outer;}}

const SKILLS=['clarity','structure','confidence','vocabulary','conciseness','grammar'];
const LABEL={clarity:'Clarity',structure:'Structure',confidence:'Confidence',vocabulary:'Vocabulary',conciseness:'Conciseness',grammar:'Grammar',overall:'Overall'};

function fresh(){return {xp:0,coins:80,streak:0,lastDaily:null,duration:2,room:'cream_checker',history:[],cat:{name:'Miso',coat:'orange_tabby',hunger:82,thirst:82,cleanliness:82,happiness:82,lastUpdated:Date.now(),criticalSince:null,alive:true},version:1};}
function load(){try{return hydrate({...fresh(),...JSON.parse(localStorage.getItem(STORE)||'{}')});}catch{return fresh();}}
function hydrate(d){d.cat={...fresh().cat,...(d.cat||{})}; d.coins=Number.isFinite(d.coins)?d.coins:80; return decayCat(d);}
function save(){state.cat.lastUpdated=Date.now();localStorage.setItem(STORE,JSON.stringify(state));}
// The quest in progress is kept under its own key so typing can save it without touching the cat's decay clock.
const QUEST_STORE=STORE+'-quest';
function loadQuest(){try{const q=JSON.parse(localStorage.getItem(QUEST_STORE)||'null');return q&&q.topic?q:null;}catch{return null;}}
function saveQuest(){try{if(challenge)localStorage.setItem(QUEST_STORE,JSON.stringify(challenge));else localStorage.removeItem(QUEST_STORE);}catch{}}
function decayCat(d){
  const cat=d.cat; const hours=Math.max(0,(Date.now()-(cat.lastUpdated||Date.now()))/3600000);
  if(hours>0.2 && cat.alive){cat.hunger=clamp(cat.hunger-hours*0.85,0,100);cat.thirst=clamp(cat.thirst-hours*1.0,0,100);cat.cleanliness=clamp(cat.cleanliness-hours*0.55,0,100);cat.happiness=clamp(cat.happiness-hours*0.38,0,100);}
  const danger=Math.min(cat.hunger,cat.thirst,cat.cleanliness);
  if(danger<=0){if(!cat.criticalSince)cat.criticalSince=Date.now(); if((Date.now()-cat.criticalSince)/86400000>=10)cat.alive=false;} else if(danger>15)cat.criticalSince=null;
  cat.lastUpdated=Date.now(); return d;
}
function level(){return Math.floor(state.xp/500)+1;}
function title(){const l=level();return l<=2?'Curious Speaker':l<=4?'Clear Speaker':l<=6?'Confident Communicator':l<=8?'Persuasive Speaker':'Communication Champion';}
function prep(){const l=level();return l<=2?60:l<=4?45:30;}
function averageOverall(){const a=state.history.map(h=>+h.scores.overall).filter(Boolean);return a.length?round1(a.reduce((x,y)=>x+y,0)/a.length):0;}
function recentAvg(){const a=state.history.slice(0,5).map(h=>+h.scores.overall).filter(Boolean);return a.length? a.reduce((x,y)=>x+y,0)/a.length:0;}
function difficulty(){let d=1+Math.floor(state.history.length/5); const a=recentAvg(); if(a>=8)d++; if(a && a<6)d--; return clamp(d,1,7);}
function nextDuration(){const a=state.history.slice(0,3).map(h=>+h.scores.overall).filter(Boolean);if(a.length<3)return state.duration;const avg=a.reduce((x,y)=>x+y,0)/a.length;if(avg>=7.5)return clamp(state.duration+.5,2,5);if(avg<5.5)return clamp(state.duration-.5,2,5);return state.duration;}
function yesterday(){const d=new Date();d.setDate(d.getDate()-1);return ymd(d);}
function catMood(){const c=state.cat;if(!c.alive)return ['Gone','Miso is no longer here. Restore a backup or reset the app to begin again.'];const m=Math.min(c.hunger,c.thirst,c.cleanliness,c.happiness);if(m<15)return ['Critical','Miso urgently needs care.'];if(m<35)return ['Unhappy','Miso needs some attention.'];if(m<60)return ['Okay','Miso is doing okay, but could use some care.'];if(m<85)return ['Happy','Miso is feeling content.'];return ['Thriving','Miso is thriving!'];}
function skillAvg(s){const a=state.history.map(h=>+h.scores[s]).filter(Boolean);return a.length?round1(a.reduce((x,y)=>x+y,0)/a.length):0;}

let state=load(), challenge=loadQuest(), toastTimer=null;
function toast(msg){let el=$('#toast'); if(!el){el=document.createElement('div');el.id='toast';document.body.appendChild(el);} el.textContent=msg;el.className='show';clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className='',2400);}
function persist(){save();render();}

function careIcon(type){return `<canvas class="pixel-care-icon" data-pixel-icon="${type}" width="48" height="48"></canvas>`;}
let roomFrame=null, catReaction=null, careMenuOpen=false, statsOpen=false;
// The one open panel (quest / progress / journal / settings) or null.
let panel=null;
const COIN='<i class="coin" aria-hidden="true"></i>';
const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isWide=()=>window.matchMedia('(min-width: 900px)').matches;
const roomHidden=()=>!!panel&&!isWide();
function paintIcons(){
  document.querySelectorAll('[data-pixel-icon]').forEach(c=>drawSpriteIcon(c,CARE_ICONS[c.dataset.pixelIcon]));
  document.querySelectorAll('[data-coat] canvas').forEach(c=>drawCatIcon(c,c.parentElement.dataset.coat));
  document.querySelectorAll('[data-room] canvas').forEach(c=>drawRoomIcon(c,c.parentElement.dataset.room));
}
// Keep the room clear of the HUD bands, and out from under an open panel.
function measureRoomPads(){
  const room=$('#room-canvas'),top=$('.room-top'),status=$('.room-status'),bottom=$('.room-bottom');if(!room)return;
  room.dataset.padTop=top&&status?top.offsetTop+status.offsetTop+status.offsetHeight+6:0;
  room.dataset.padBottom=bottom?room.clientHeight-bottom.offsetTop+4:0;
  const p=$('.panel');
  room.dataset.panelRight=panel&&isWide()?p.offsetWidth:0;
  room.dataset.panelBottom=0; // full-screen on phone
  if(reducedMotion())room.dataset.still='1';
}
function floatGain(text,kind){
  const room=$('#room-canvas'),stage=room?.parentElement;if(!stage)return;
  const [x,y]=catAnchor(room),el=document.createElement('div');
  el.className=`float-gain ${kind}`;el.textContent=text;el.style.left=`${x}px`;el.style.top=`${y}px`;
  stage.appendChild(el);setTimeout(()=>el.remove(),1600);
}
function paintPixels(){
  cancelAnimationFrame(roomFrame);
  paintIcons();
  roomAssetsReady.then(paintIcons).catch(error=>console.error(error));
  const room=$('#room-canvas');
  if(!room)return;
  measureRoomPads();
  if(reducedMotion()){
    const still=()=>room.isConnected&&drawRoom(room,0,state.cat,null,state.room);
    still();roomAssetsReady.then(still,()=>{});return;
  }
  const animate=time=>{
    if(!room.isConnected)return;
    // On phone a panel covers the whole room: stop drawing until it closes (setPanel restarts us).
    if(roomHidden()){roomFrame=null;return;}
    drawRoom(room,time,state.cat,catReaction,state.room);
    roomFrame=requestAnimationFrame(animate);
  };
  animate(performance.now());
}
// Dropdowns open and close only from their own buttons.
// Phone only: the Needs button opens the Food / Water / Clean / Happy dropdown (meters are always shown on laptop).
function setStatsOpen(open){statsOpen=open;$('.room-top')?.classList.toggle('stats-open',open);$('[data-stats-toggle]')?.setAttribute('aria-expanded',open);}
let resizeTimer=null;
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(panel==='journal')render();else paintPixels();},150);});

// ---- The whole app is the cat room; everything else opens in a panel over it ----
function render(){
  state=decayCat(state);save();saveQuest();
  $('#app').innerHTML=gameView();
  paintPixels(); bind(); paintWheel(); fitHistory();
}
// Open, switch or close a panel. Only open/close toggles the slide animation.
function setPanel(name){
  if(panel===name)name=null;
  const el=$('.panel'),wasOpen=!!panel;panel=name;
  if(!el){render();return;}
  if(name){el.innerHTML=panelView();bindPanel();paintIcons();paintWheel();fitHistory();}
  el.classList.toggle('open',!!name);el.setAttribute('aria-hidden',!name);
  document.querySelectorAll('[data-panel]').forEach(b=>b.classList.toggle('active',b.dataset.panel===name));
  measureRoomPads();
  if(!name&&wasOpen&&!reducedMotion())setTimeout(()=>{if(!panel)el.innerHTML='';},260);
  // Restart the room loop (it pauses itself while a phone panel hides the room).
  if(roomHidden()){cancelAnimationFrame(roomFrame);roomFrame=null;}else paintPixels();
}

const HUD=[['Food','hunger','food','food'],['Water','thirst','water','water'],['Clean','cleanliness','clean','litter'],['Happy','happiness','happy','play']];
const CARE=[['food','Feed',12],['water','Water',0],['litter','Litter',0],['play','Play',5],['treat','Treat',20]];
const CARE_ACTIONS={food:{cost:12,key:'hunger',gain:38,msg:n=>`${n} enjoyed the meal.`},water:{cost:0,key:'thirst',gain:45,msg:()=>'Fresh water added.'},litter:{cost:0,key:'cleanliness',gain:48,msg:()=>'Litter box cleaned.'},play:{cost:5,key:'happiness',gain:28,msg:n=>`${n} had fun playing.`},treat:{cost:20,key:'happiness',gain:20,msg:n=>`${n} loved the treat!`}};
// How much an action would actually add right now (0 when that need is already full).
const careGain=a=>{const x=CARE_ACTIONS[a];return Math.max(0,Math.round(Math.min(x.gain,100-state.cat[x.key])));};
// Overall health is the average of the four needs, shown as five hearts (half hearts allowed).
function catHealth(){const c=state.cat;return c.alive?Math.round((c.hunger+c.thirst+c.cleanliness+c.happiness)/4):0;}
function hearts(health){const n=Math.round(health/10)/2;return [0,1,2,3,4].map(i=>`<i class="hp ${n>=i+1?'hp-full':n>=i+.5?'hp-half':'hp-empty'}"></i>`).join('');}
const PANELS=[['quest','mic','Quest'],['progress','chart','Progress'],['journal','book','Journal'],['settings','gear','Settings']];

function gameView(){const c=state.cat,[,msg]=catMood(),health=catHealth(),daily=state.lastDaily===today();
  const careBtn=([k,l,cost])=>{const g=careGain(k),need=HUD.find(h=>h[1]===CARE_ACTIONS[k].key)[0];return `<button data-care="${k}" class="${state.coins<cost?'locked':''}${g?'':' full'}" ${g?'':'disabled'} title="${l} · ${cost?cost+' coins':'free'}">${careIcon(k)}<span>${l}<em>${g?`+${g} ${need}`:`${need} is full`}</em></span><small>${cost?`${COIN}${cost}`:'Free'}</small></button>`;};
  const speak=challenge?'Continue':daily?'Practice':'Speak';
  return `<div class="game">
  <div class="room-stage">
    <canvas id="room-canvas" data-cam="cat" role="img" aria-label="${esc(msg)}"></canvas>
    <div class="room-top${statsOpen?' stats-open':''}">
      <div class="room-hud">${HUD.map(([l,key,kind,icon])=>{const v=Math.round(c[key]);return `<div class="hud-meter ${kind}${v<35?' low':''}" title="${l} ${v}%"><canvas class="hud-icon" data-pixel-icon="${icon}" width="32" height="32"></canvas><div><span><em>${l}</em><b>${v}%</b></span><div class="bar"><i style="width:${v}%"></i></div></div></div>`;}).join('')}</div>
      <div class="room-status">
        <div class="status-left"><span class="chip hearts" role="img" aria-label="Health ${health}%" title="${esc(msg)}">${hearts(health)}</span><button class="chip needs-toggle" data-stats-toggle aria-expanded="${statsOpen}">Needs${HUD.some(h=>c[h[1]]<35)?'<i class="alert-dot" title="A need is low"></i>':''}<i class="caret" aria-hidden="true"></i></button></div>
        <span class="chip coins" title="Coins">${COIN}${state.coins}</span>
      </div>
      <nav class="hud-menu" aria-label="Menu">${PANELS.slice(1).map(([k,icon,l])=>`<button class="hud-btn${panel===k?' active':''}" data-panel="${k}" title="${l}" aria-label="${l}"><i class="px-icon ${icon}" aria-hidden="true"></i></button>`).join('')}</nav>
    </div>
    <div class="room-bottom">
      <div class="cam-controls">
        <button class="cam-btn cam-zoom" data-zoom="in" title="Zoom in" aria-label="Zoom in"><i class="px-icon plus" aria-hidden="true"></i></button>
        <button class="cam-btn cam-zoom" data-zoom="out" title="Zoom out" aria-label="Zoom out"><i class="px-icon minus" aria-hidden="true"></i></button>
        <button class="cam-btn cam-reset" hidden title="Reset view" aria-label="Reset view"><i class="reset-icon" aria-hidden="true"></i></button>
      </div>
      <button class="speak-btn${!daily&&!challenge?' due':''}" data-panel="quest"><i class="px-icon mic" aria-hidden="true"></i>${speak}</button>
      <details class="care-menu"${careMenuOpen?' open':''}><summary><i class="hp hp-full" aria-hidden="true"></i>Care</summary><div class="care-menu-list">${CARE.map(careBtn).join('')}</div></details>
    </div>
  </div>
  <aside class="panel${panel?' open':''}" aria-hidden="${!panel}">${panel?panelView():''}</aside>
</div>`;}

function panelView(){
  const body={quest:questPanel,progress:progressPanel,journal:journalPanel,settings:settingsPanel}[panel]();
  return `<header class="panel-head"><div class="panel-tabs">${PANELS.map(([k,icon,l])=>`<button class="tab${panel===k?' active':''}" data-panel-tab="${k}" title="${l}" aria-label="${l}"><i class="px-icon ${icon}${k==='quest'?' light':''}" aria-hidden="true"></i></button>`).join('')}</div><h2>${PANELS.find(p=>p[0]===panel)[2]}</h2><button class="close" data-panel-close title="Close" aria-label="Close"><i class="px-icon x" aria-hidden="true"></i></button></header><div class="panel-body">${body}</div>`;
}

// ---- Quest ----
const QUEST_STEPS=['Topic','Transcript','Scores','Reflect'];
// Wheel state while choosing a topic: {rot, spinning, from, to, start, pick, rerolled, landed}
let wheel={rot:wheelRotFor(0,.1),spinning:false};let wheelFrame=null;
function questPanel(){
  const daily=state.lastDaily===today();
  if(!challenge){const tier=WHEEL_TIERS[wheelTierAt(wheel.rot)];return `<div class="spin-area">
    <p class="eyebrow">${daily?'PRACTICE · BONUS XP':"TODAY'S QUEST · MAIN XP"}</p>
    <canvas id="wheel-canvas" width="288" height="288" aria-hidden="true"></canvas>
    <p class="wheel-label" id="wheel-label" style="--tier:${tier[1]}">${wheel.spinning||wheel.landed?tier[0]:'Spin for a topic'}</p>
    <button class="primary" id="spin" ${wheel.spinning?'disabled':''}>${wheel.spinning?'Spinning…':daily?'Spin a practice topic':'Spin for today’s topic'}</button>
    <p class="muted">Difficulty ${difficulty()}/7 · ${prep()} sec prep · ${state.duration} min target</p></div>`;}
  const st=challenge.step||0;
  return `<div class="challenge"><div class="steps">${QUEST_STEPS.map((l,i)=>`<button data-step="${i}" class="${i===st?'active':''}${i<st?' done':''}"><b>${i+1}</b>${l}</button>`).join('')}</div>
  <div class="step-body">${[stepTopic,stepTranscript,stepScores,stepReflect][st]()}</div>
  <div class="step-foot">${st?`<button class="secondary" data-step="${st-1}">← Back</button>`:''}${st<3?`<button class="primary" data-step="${st+1}">Next →</button>`:'<button class="primary" id="complete">Complete quest ✨</button>'}</div></div>`;
}
function stepTopic(){const tier=WHEEL_TIERS[challenge.difficulty-1];return `<div class="topic-box" style="--tier:${tier[1]}"><span>${tier[0].toUpperCase()} · LEVEL ${challenge.difficulty}/7</span><h3>${challenge.topic}</h3><div class="chips"><b><i class="px-icon brain" aria-hidden="true"></i>${prep()}s prep</b><b><i class="px-icon mic light" aria-hidden="true"></i>${state.duration} min target</b></div></div>${!challenge.rerolled?'<button class="secondary" id="reroll">↻ Use free reroll</button>':''}<p class="muted">Take ${prep()} seconds to prepare, then speak for about ${state.duration} minutes. Transcribe it for the next step.</p>`;}
function stepTranscript(){return `<label class="grow">Transcript<textarea id="transcript" placeholder="Paste your transcript here...">${esc(challenge.transcript)}</textarea></label><button class="secondary" id="copy-prompt">Copy friendly-mentor prompt</button><label class="grow">AI feedback<textarea id="feedback" placeholder="Paste the coach feedback here...">${esc(challenge.feedback)}</textarea></label>`;}
function stepScores(){return `<p class="muted">Copy the scores from the AI feedback. Overall is required.</p><div class="score-grid">${[...SKILLS,'overall'].map(s=>`<label class="score-input${s==='overall'?' overall':''}"><span>${LABEL[s]}</span><input data-score="${s}" type="number" min="1" max="10" step="0.5" value="${challenge.scores[s]||''}"><small>/10</small></label>`).join('')}</div>`;}
function stepReflect(){return `<h3 class="form-title">How did it feel?</h3>${['confidence','fluency','satisfaction'].map(s=>`<label class="range"><span>${cap(s)} <b>${challenge.self[s]}/10</b></span><input data-self="${s}" type="range" min="1" max="10" value="${challenge.self[s]}"></label>`).join('')}`;}

// Draw the wheel; while spinning, ease towards the target and let the cat run, then reveal the topic.
function paintWheel(){
  cancelAnimationFrame(wheelFrame);
  const cv=$('#wheel-canvas');if(!cv)return;
  const frame=()=>{
    if(!cv.isConnected)return;
    const now=performance.now();let anim='sit',animT=now/1000;
    if(wheel.spinning){
      const p=Math.min(1,(now-wheel.start)/3200),e=1-(1-p)**4,speed=4*(1-p)**3;
      wheel.rot=wheel.from+(wheel.to-wheel.from)*e;
      anim=speed>1.2?'run':speed>.15?'walk':'idle';
      const lab=$('#wheel-label');if(lab){const t=WHEEL_TIERS[wheelTierAt(wheel.rot)];lab.textContent=t[0];lab.style.setProperty('--tier',t[1]);}
      if(p>=1){wheel.spinning=false;wheel.landed=true;wheel.landedAt=now;}
    }else if(wheel.landed&&now-wheel.landedAt<900){anim='jump';animT=(now-wheel.landedAt)/1000;}
    else if(wheel.landed){startChallenge(wheel.pick,wheel.rerolled);return;}
    drawCatWheel(cv,wheel.rot,state.cat.coat,anim,animT);
    if(wheel.spinning||wheel.landed)wheelFrame=requestAnimationFrame(frame);
    else if(!reducedMotion())wheelFrame=requestAnimationFrame(frame);
  };
  frame();roomAssetsReady.then(()=>{if(!wheel.spinning&&!wheel.landed)drawCatWheel(cv,wheel.rot,state.cat.coat,'sit',0);},()=>{});
}
// Choose the topic first, then spin so the pointer lands on its category.
function spin(rerolled){
  const d=difficulty(),pool=TOPICS.filter(x=>x.d>=Math.max(1,d-1)&&x.d<=d),prev=challenge?.topic;
  let p=pool[Math.floor(Math.random()*pool.length)];
  if(prev&&pool.length>1)while(p.t===prev)p=pool[Math.floor(Math.random()*pool.length)];
  challenge=null;
  const base=wheelRotFor(p.d-1,(Math.random()-.5)*.6),turns=Math.PI*2*5,cur=wheel.rot;
  let to=base;while(to<cur+turns)to+=Math.PI*2;
  wheel={rot:cur,from:cur,to,start:performance.now(),spinning:!reducedMotion(),landed:reducedMotion(),landedAt:-1e9,pick:p,rerolled};
  if(reducedMotion())wheel.rot=to;
  // Safety net: reveal the topic even if animation frames stall (background tab, panel closed mid-spin).
  const pending=wheel;setTimeout(()=>{if(wheel===pending&&!challenge){wheel.rot=to;startChallenge(p,rerolled);}},reducedMotion()?900:4300);
  render();
}
function startChallenge(p,rerolled){
  wheel={rot:wheel.rot,spinning:false};
  challenge={topic:p.t,difficulty:p.d,rerolled,transcript:'',feedback:'',scores:{clarity:0,structure:0,confidence:0,vocabulary:0,conciseness:0,grammar:0,overall:0},self:{confidence:5,fluency:5,satisfaction:5},step:0};
  render();
}

// ---- Progress ----
function skillRow(name,v){return `<div class="skill"><div><span>${name}</span><b>${v||'—'}</b></div><div class="bar"><i style="width:${(v||0)*10}%"></i></div></div>`;}
function progressPanel(){return `
  <div class="tiles"><div><b>${state.streak}</b><small>day streak</small></div><div><b>${state.history.length}</b><small>sessions</small></div><div><b>${averageOverall()||'—'}</b><small>avg score</small></div><div><b>${difficulty()}/7</b><small>difficulty</small></div></div>
  <section class="p-card"><div class="section-head"><h3>Level ${level()} · ${title()}</h3><span class="pill">${state.xp%500}/500 XP</span></div><div class="bar xp"><i style="width:${(state.xp%500)/5}%"></i></div></section>
  <section class="p-card"><div class="section-head"><h3>Speaking target</h3><span class="pill">${state.duration} min</span></div><p class="muted small">Three recent scores averaging 7.5+ add 30 seconds (up to 5 min); below 5.5 eases it down (never under 2 min).</p></section>
  <section class="p-card grow"><h3>Skill profile</h3><div class="skill-list">${SKILLS.map(s=>skillRow(LABEL[s],skillAvg(s))).join('')}</div></section>`;}

// ---- Journal ----
let histPage=0, histPer=6, histSel=null;
function journalPanel(){
  const all=state.history;
  if(!all.length)return `${monthCalendar()}<div class="empty-note">Complete your first quest to start your speaking journal.</div>`;
  const sel=all.find(h=>h.id===histSel);
  if(sel)return histDetail(sel);
  const cal=monthCalendar();
  const pages=Math.max(1,Math.ceil(all.length/histPer));histPage=clamp(histPage,0,pages-1);
  const rows=all.slice(histPage*histPer,(histPage+1)*histPer);
  return `${cal}<div class="hist-list"><div class="hist-rows">${rows.map(h=>`<button class="hist-row" data-hist="${h.id}"><span><span class="eyebrow">${h.date} · ${h.isDaily?'DAILY':'PRACTICE'}</span><b>${esc(h.topic)}</b></span><span class="score">${h.scores.overall}</span></button>`).join('')}</div>
  <div class="pager"><button class="secondary" data-hist-page="-1" ${histPage?'':'disabled'}>←</button><span>${histPage+1} / ${pages}</span><button class="secondary" data-hist-page="1" ${histPage<pages-1?'':'disabled'}>→</button></div></div>`;
}
function histDetail(h){return `<div class="hist-detail"><div class="detail-head"><button class="mini back" data-hist-back>← All sessions</button><span class="eyebrow">${h.date} · ${h.isDaily?'DAILY':'PRACTICE'}</span><h3>${esc(h.topic)}</h3><div class="chips"><b>🎯 ${h.scores.overall}/10</b><b>⭐ +${h.earnedXP} XP</b><b>${COIN}+${h.earnedCoins}</b><b><i class="px-icon mic light" aria-hidden="true"></i>${h.duration} min</b></div><div class="score-chips">${SKILLS.map(s=>`<span>${LABEL[s]} <b>${h.scores[s]||'—'}</b></span>`).join('')}</div></div><div class="detail-text"><h4>Transcript</h4><p class="pre">${esc(h.transcript)}</p></div><div class="detail-text"><h4>AI feedback</h4><p class="pre">${esc(h.feedback||'No feedback saved.')}</p></div></div>`;}
// This month at a glance: days with a completed daily quest are filled in.
function monthCalendar(){
  const now=new Date(),y=now.getFullYear(),m=now.getMonth(),days=new Date(y,m+1,0).getDate(),lead=(new Date(y,m,1).getDay()+6)%7;
  const done=new Set(state.history.filter(h=>h.isDaily).map(h=>h.date)),t=today();
  const cells=[...Array(lead).fill('<span></span>'),...Array.from({length:days},(_,i)=>{const key=ymd(new Date(y,m,i+1));
    return `<span class="${done.has(key)?'done':''}${key===t?' today':''}" title="${key}${done.has(key)?' · daily quest done':''}">${i+1}</span>`;})];
  const count=[...done].filter(d=>d.startsWith(`${y}-${String(m+1).padStart(2,'0')}`)).length;
  return `<section class="cal"><div class="cal-head"><h3>${now.toLocaleString(undefined,{month:'long'})} ${y}</h3><span>${count} daily ${count===1?'quest':'quests'}</span></div>
  <div class="cal-grid">${['M','T','W','T','F','S','S'].map(d=>`<b>${d}</b>`).join('')}${cells.join('')}</div></section>`;
}
// Rows have a fixed height, so the page size is however many fit in the list.
function fitHistory(){const box=$('.hist-rows');if(!box)return;const per=Math.max(1,Math.floor((box.clientHeight+6)/64));if(per!==histPer){histPer=per;$('.panel').innerHTML=panelView();bindPanel();}}

// ---- Settings ----
function settingsPanel(){const c=state.cat;return `
  <section class="p-card"><h3>Your cat</h3><div class="name-row"><input id="cat-name" maxlength="18" value="${esc(c.name)}" placeholder="Cat name"><button class="secondary" id="save-cat-name">Save</button></div>
    <div class="coat-grid">${CAT_COATS.map(k=>`<button data-coat="${k}" class="${(c.coat||'')===k?'active':''}" title="${cap(k.replace('_',' '))}" aria-label="${cap(k.replace('_',' '))}"><canvas width="64" height="64"></canvas></button>`).join('')}</div></section>
  <section class="p-card"><h3>Room style</h3><div class="room-grid">${ROOM_STYLES.map(k=>`<button data-room="${k}" class="${state.room===k?'active':''}"><canvas width="112" height="100"></canvas><span>${cap(k.replace('_',' '))}</span></button>`).join('')}</div></section>
  <section class="p-card"><h3>Backup</h3><p class="muted small">Progress lives on this device. Export a backup regularly.</p><div class="settings"><button class="secondary" id="export">↓ Export</button><button class="secondary" id="import">↑ Import</button><button class="danger" id="reset">Reset</button></div></section>
  <section class="p-card"><h3>Week 1 rule</h3><p class="muted small">Use the app for one week before adding features. Note friction, boring topics, useful feedback, and whether ${esc(c.name)} actually makes you return.</p></section>`;}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}function cap(s){return s[0].toUpperCase()+s.slice(1);}

// ---- Event wiring ----
function bind(){
  document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>setPanel(b.dataset.panel));
  document.querySelectorAll('[data-care]').forEach(b=>b.onclick=()=>care(b.dataset.care));
  $('.care-menu')?.addEventListener('toggle',e=>{careMenuOpen=e.target.open;});
  $('[data-stats-toggle]')?.addEventListener('click',()=>setStatsOpen(!statsOpen));
  const room=$('#room-canvas');
  if(room){
    let lastPet=0;
    const redrawStill=()=>{if(reducedMotion())drawRoom(room,0,state.cat,null,state.room);};
    const pet=e=>{if(!state.cat.alive||!catHit(room,e.clientX,e.clientY))return;
      const now=performance.now();
      // A second tap on the cat soon after the first zooms in on it.
      if(now-lastPet<400){focusCat(room,{instant:reducedMotion(),onChange:redrawStill});lastPet=0;return;}
      lastPet=now;catReaction={type:'pet',started:now};floatGain('♥','pet');};
    enableRoomCamera(room,{pinch:matchMedia('(pointer: coarse)').matches,onTap:pet,resetButton:$('.cam-reset'),zoomIn:$('[data-zoom="in"]'),zoomOut:$('[data-zoom="out"]'),onChange:redrawStill});
  }
  bindPanel();
}
function bindPanel(){
  const p=$('.panel');if(!p)return;const q=s=>p.querySelector(s),qa=s=>p.querySelectorAll(s);
  qa('[data-panel-tab]').forEach(b=>b.onclick=()=>{panel=null;setPanel(b.dataset.panelTab);});
  q('[data-panel-close]')?.addEventListener('click',()=>setPanel(null));
  qa('[data-step]').forEach(b=>b.onclick=()=>{challenge.step=+b.dataset.step;render();});
  qa('[data-hist]').forEach(b=>b.onclick=()=>{histSel=+b.dataset.hist;render();});
  qa('[data-hist-page]').forEach(b=>b.onclick=()=>{histPage+=+b.dataset.histPage;render();});
  q('[data-hist-back]')?.addEventListener('click',()=>{histSel=null;render();});
  q('#spin')?.addEventListener('click',()=>spin(false)); q('#reroll')?.addEventListener('click',()=>spin(true));
  q('#transcript')?.addEventListener('input',e=>{challenge.transcript=e.target.value;saveQuest();}); q('#feedback')?.addEventListener('input',e=>{challenge.feedback=e.target.value;saveQuest();});
  qa('[data-score]').forEach(i=>i.oninput=e=>{challenge.scores[e.target.dataset.score]=+e.target.value;saveQuest();});
  qa('[data-self]').forEach(i=>i.oninput=e=>{challenge.self[e.target.dataset.self]=+e.target.value;saveQuest();e.target.previousElementSibling.querySelector('b').textContent=e.target.value+'/10';});
  q('#copy-prompt')?.addEventListener('click',copyPrompt);q('#complete')?.addEventListener('click',completeQuest);
  qa('[data-coat]').forEach(b=>b.onclick=()=>{state.cat.coat=b.dataset.coat;persist();});
  qa('[data-room]').forEach(b=>b.onclick=()=>{state.room=b.dataset.room;persist();});
  q('#save-cat-name')?.addEventListener('click',()=>{const n=$('#cat-name').value.trim().slice(0,18);if(!n){toast('Give your cat a name first.');return;}state.cat.name=n;persist();toast(`${n} has a new name!`);});
  q('#export')?.addEventListener('click',exportData);q('#import')?.addEventListener('click',()=>$('#import-file').click());
  q('#reset')?.addEventListener('click',()=>{if(confirm('Reset Communication Quest and your cat? This cannot be undone unless you exported a backup.')){localStorage.removeItem(STORE);localStorage.removeItem(QUEST_STORE);state=fresh();panel=null;challenge=null;render();}});
}
async function copyPrompt(){challenge.transcript=$('#transcript').value; if(!challenge.transcript.trim()){flagField(1,'#transcript','Paste your transcript first');return;}const prompt=`You are my friendly but honest communication mentor. I am practicing speaking, not writing. Review the transcript below.\n\nScore each from 1–10: Clarity, Structure, Confidence, Vocabulary, Conciseness, Grammar, Overall.\n\nThen give:\n1. Three specific strengths\n2. Three specific improvements\n3. A stronger structure I could have used\n4. A short improved example answer\n5. One focus for my next speaking session\n\nDo not overpraise me. Be encouraging, concrete and concise.\n\nTOPIC:\n${challenge.topic}\n\nTRANSCRIPT:\n${challenge.transcript}`;try{await navigator.clipboard.writeText(prompt);toast('Coach prompt copied.');}catch{promptFallback(prompt);}}
function promptFallback(t){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('Coach prompt copied.');}
// Point at a missing field: show its step, focus it and pin a "!" note that clears after a few
// seconds or as soon as the user clicks or types in it.
function flagField(step,selector,msg){
  if(challenge.step!==step){challenge.step=step;render();}
  const el=$('.panel '+selector),box=el?.closest('label');if(!el||!box)return;
  box.querySelector('.field-msg')?.remove();
  box.classList.add('invalid');box.insertAdjacentHTML('beforeend',`<span class="field-msg" role="alert"><b>!</b>${msg}</span>`);
  el.focus({preventScroll:true});box.scrollIntoView({block:'nearest'});
  const clear=()=>{box.classList.remove('invalid');box.querySelector('.field-msg')?.remove();el.removeEventListener('pointerdown',clear);el.removeEventListener('input',clear);};
  el.addEventListener('pointerdown',clear);el.addEventListener('input',clear);setTimeout(clear,3500);
}
function completeQuest(){if(!challenge.transcript.trim()){flagField(1,'#transcript','Paste your transcript');return;}if(!challenge.scores.overall){flagField(2,'[data-score="overall"]','Add the Overall score');return;}const daily=state.lastDaily!==today();let xp=daily?100:35;xp+=25+10+(challenge.feedback.trim()?25:0)+(!challenge.rerolled?15:0)+(challenge.scores.overall>=8?20:0);let coins=daily?60:20;if(challenge.scores.overall>=8)coins+=10;if(daily)state.streak=state.lastDaily===yesterday()?state.streak+1:1;const {step,...done}=challenge;const entry={...done,id:Date.now(),date:today(),isDaily:daily,earnedXP:xp,earnedCoins:coins,duration:state.duration,prep:prep()};state.history.unshift(entry);state.xp+=xp;state.coins+=coins;if(daily)state.lastDaily=today();state.duration=nextDuration();challenge=null;panel=null;catReaction={type:'cheer',started:performance.now()};persist();toast(`Quest complete · +${xp} XP · +${coins} coins`);}
function care(a){const c=state.cat;if(!c.alive){toast(`${c.name} cannot be cared for in this state.`);return;}const x=CARE_ACTIONS[a];if(!careGain(a)){toast(`${HUD.find(h=>h[1]===x.key)[0]} is already full.`);return;}if(state.coins<x.cost){toast('Not enough coins. Complete a speaking quest.');return;}state.coins-=x.cost;const before=c[x.key];c[x.key]=clamp(c[x.key]+x.gain,0,100);if(a==='food')c.happiness=clamp(c.happiness+5,0,100);if(a==='litter')c.happiness=clamp(c.happiness+4,0,100);catReaction={type:a,started:performance.now()};persist();toast(x.msg(c.name));floatGain(`+${Math.round(c[x.key]-before)} ${HUD.find(h=>h[1]===x.key)[0]}`,a);}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`communication-quest-backup-${today()}.json`;a.click();URL.revokeObjectURL(url);toast('Backup exported.');}
$('#import-file').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.history||!d.cat)throw new Error();state=hydrate({...fresh(),...d});save();panel=null;challenge=null;render();toast('Backup restored.');}catch{toast('That backup file is not valid.');}};r.readAsText(f);e.target.value='';});

if('serviceWorker' in navigator && location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
