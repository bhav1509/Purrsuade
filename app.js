const APP_VERSION='1.0';
// Where the Feedback button sends people (a prefilled GitHub issue; swap for a form or mailto: link).
const FEEDBACK_URL='https://github.com/bhav1509/Purrsuade/issues/new';
// Storage keys keep the original name so existing progress carries over after the rename.
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

function fresh(){return {xp:0,coins:80,streak:0,lastDaily:null,duration:2,room:'cream_checker',layout:{},history:[],cat:{name:'Miso',coat:'orange_tabby',hunger:82,thirst:82,cleanliness:82,happiness:82,lastUpdated:Date.now(),zeroSince:null,alive:true,born:today()},graves:[],version:1};}
function load(){try{return hydrate({...fresh(),...JSON.parse(localStorage.getItem(STORE)||'{}')});}catch{return fresh();}}
function hydrate(d){const savedBorn=d.cat?.born;d.cat={...fresh().cat,...(d.cat||{})};d.graves=Array.isArray(d.graves)?d.graves:[];d.history=d.history||[];
  // Cats from before birthdays were tracked: born on the day of the first session (or after the previous cat).
  const firstDay=d.history.map(h=>h.date).sort()[0];
  if(!savedBorn)d.cat.born=d.graves.length?d.graves[d.graves.length-1].died:(firstDay||today());
  repairGraves(d);d.layout=d.layout&&typeof d.layout==='object'?d.layout:{}; d.coins=Number.isFinite(d.coins)?d.coins:80; return decayCat(d);}
function save(){localStorage.setItem(STORE,JSON.stringify(state));}
// The quest in progress is kept under its own key so typing can save it without touching the cat's decay clock.
const QUEST_STORE=STORE+'-quest';
function loadQuest(){try{const q=JSON.parse(localStorage.getItem(QUEST_STORE)||'null');return q&&q.topic?q:null;}catch{return null;}}
// A quest belongs to the day it was spun. After midnight it is filed away: anything typed into it
// is kept in the journal as an incomplete session; an untouched quest is simply dropped.
function questHasData(q){return !!(q.transcript?.trim()||q.feedback?.trim()||Object.values(q.scores||{}).some(Number)||Object.values(q.self||{}).some(v=>+v!==5));}
function rolloverQuest(){
  if(!challenge)return false;
  if(!challenge.date)challenge.date=today();
  if(challenge.date===today())return false;
  const kept=questHasData(challenge);
  if(kept){const {step,date,...rest}=challenge;
    state.history.unshift({...rest,scores:{...rest.scores},id:Date.now(),date,isDaily:!!challenge.daily,incomplete:true,earnedXP:0,earnedCoins:0,duration:state.duration,prep:prep()});
    state.history.sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);save();}
  challenge=null;saveQuest();return kept?'saved':'dropped';
}
function saveQuest(){try{if(challenge)localStorage.setItem(QUEST_STORE,JSON.stringify(challenge));else localStorage.removeItem(QUEST_STORE);}catch{}}
// Needs fall every hour, even while the app is closed (% per hour).
const DECAY={hunger:.85,thirst:1,cleanliness:.55,happiness:.38};
const NEED_KEYS=Object.keys(DECAY),DAY=86400000,GRACE_DAYS=3;
const healthOf=c=>(c.hunger+c.thirst+c.cleanliness+c.happiness)/4;
// Health after `h` hours of no care, from needs `c`.
const healthAfter=(c,h)=>NEED_KEYS.reduce((s,k)=>s+clamp(c[k]-h*DECAY[k],0,100),0)/4;
// 0 hearts = health below 5%. After GRACE_DAYS at 0 hearts the cat dies and gets a headstone.
function decayCat(d){
  const cat=d.cat,now=Date.now(),hours=Math.max(0,(now-(cat.lastUpdated||now))/3600000);
  if(!cat.alive){cat.lastUpdated=now;return d;}
  if(hours<0.02)return d; // keep the clock running between quick re-renders
  const before={...cat},startHealth=healthOf(cat);
  for(const k of NEED_KEYS)cat[k]=clamp(cat[k]-hours*DECAY[k],0,100);
  if(healthOf(cat)<5){
    if(!cat.zeroSince){
      // When did the hearts run out? Binary-search the decay curve so time away is counted fairly.
      let lo=0,hi=hours;if(startHealth>=5){for(let i=0;i<30;i++){const m=(lo+hi)/2;healthAfter(before,m)<5?hi=m:lo=m;}}else hi=0;
      cat.zeroSince=(cat.lastUpdated||now)+hi*3600000;
    }
    if(now-cat.zeroSince>=GRACE_DAYS*DAY)catDies(d,cat.zeroSince+GRACE_DAYS*DAY);
  }else cat.zeroSince=null;
  cat.lastUpdated=now;return d;
}
function catDies(d,when){
  const cat=d.cat,born=cat.born||d.history.map(h=>h.date).sort()[0]||today(),diedOn=ymd(new Date(Math.min(when,Date.now())));
  d.graves=d.graves||[];
  // Sessions count until the death is noticed (you may have practised before opening the app).
  d.graves.push({id:Date.now(),name:cat.name,coat:cat.coat,born,died:diedOn<born?born:diedOn,sessions:sessionsBetween(d,born,today())});
  cat.alive=false;cat.diedOn=diedOn;
}
const sessionsBetween=(d,from,to)=>d.history.filter(h=>!h.incomplete&&h.date>=from&&h.date<=to).length;
// Fix headstones saved by an earlier version (born after died, sessions miscounted).
function repairGraves(d){
  const firstDay=d.history.map(h=>h.date).sort()[0];
  d.graves.forEach((g,i)=>{if(g.repaired)return;const prev=d.graves[i-1],next=d.graves[i+1];
    if(g.born>g.died)g.born=prev?prev.died:(firstDay&&firstDay<g.died?firstDay:g.died);
    if(!prev&&firstDay&&firstDay<g.born)g.born=firstDay; // the first cat was there from the first session
    const until=next?next.born:(d.cat.alive?d.cat.born:today());g.sessions=sessionsBetween(d,g.born,until>g.born?until:g.died);g.repaired=true;});
}
function level(){return Math.floor(state.xp/500)+1;}
function title(){const l=level();return l<=2?'Curious Speaker':l<=4?'Clear Speaker':l<=6?'Confident Communicator':l<=8?'Persuasive Speaker':'Communication Champion';}
function prep(){const l=level();return l<=2?60:l<=4?45:30;}
// Finished sessions only; quests left half-done at midnight sit in the journal as incomplete.
function sessions(){return state.history.filter(h=>!h.incomplete);}
function averageOverall(){const a=sessions().map(h=>+h.scores.overall).filter(Boolean);return a.length?round1(a.reduce((x,y)=>x+y,0)/a.length):0;}
function recentAvg(){const a=sessions().slice(0,5).map(h=>+h.scores.overall).filter(Boolean);return a.length? a.reduce((x,y)=>x+y,0)/a.length:0;}
function difficulty(){let d=1+Math.floor(sessions().length/5); const a=recentAvg(); if(a>=8)d++; if(a && a<6)d--; return clamp(d,1,7);}
function nextDuration(){const a=sessions().slice(0,3).map(h=>+h.scores.overall).filter(Boolean);if(a.length<3)return state.duration;const avg=a.reduce((x,y)=>x+y,0)/a.length;if(avg>=7.5)return clamp(state.duration+.5,2,5);if(avg<5.5)return clamp(state.duration-.5,2,5);return state.duration;}
function yesterday(){const d=new Date();d.setDate(d.getDate()-1);return ymd(d);}
function catMood(){const c=state.cat,n=c.name;if(!c.alive)return ['Gone',`${n} is resting in the garden.`];const m=Math.min(c.hunger,c.thirst,c.cleanliness,c.happiness);if(healthOf(c)<15)return ['Sick',`${n} is very weak and needs care now.`];if(m<15)return ['Critical',`${n} urgently needs care.`];if(m<35)return ['Unhappy',`${n} needs some attention.`];if(m<60)return ['Okay',`${n} is doing okay, but could use some care.`];if(m<85)return ['Happy',`${n} is feeling content.`];return ['Thriving',`${n} is thriving!`];}
function skillAvg(s){const a=sessions().map(h=>+h.scores[s]).filter(Boolean);return a.length?round1(a.reduce((x,y)=>x+y,0)/a.length):0;}

let state=load(), challenge=loadQuest(), toastTimer=null;
setRoomLayout(state.layout);setRoomGraves(state.graves);
rolloverQuest();
// Check again at each local midnight, and whenever the app comes back (timers sleep on phones).
function newDayCheck(){const r=rolloverQuest();if(r){wheel={rot:wheel.rot,spinning:false};render();toast(r==='saved'?'New day · your unfinished quest was saved to the journal.':'New day · time for a fresh quest.');}}
(function scheduleMidnight(){const n=new Date(),next=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1,0,0,2);setTimeout(()=>{newDayCheck();scheduleMidnight();},next-n);})();
document.addEventListener('visibilitychange',()=>{if(!document.hidden){newDayCheck();if(typeof rec!=='undefined'&&recActive())keepAwake(true);}});
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
function setStatsOpen(open){statsOpen=open;if(open)tourEvent('needs');$('.room-top')?.classList.toggle('stats-open',open);$('[data-stats-toggle]')?.setAttribute('aria-expanded',open);}
let resizeTimer=null;
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(panel==='journal')render();else paintPixels();},150);});

// ---- The whole app is the cat room; everything else opens in a panel over it ----
function render(){
  const wasAlive=state.cat.alive;state=decayCat(state);save();saveQuest();
  if(wasAlive&&!state.cat.alive){setRoomGraves(state.graves);setTimeout(showFarewell,0);}
  $('#app').innerHTML=gameView();
  paintPixels(); bind(); paintWheel(); fitHistory();
}
// Open, switch or close a panel. Only open/close toggles the slide animation.
function setPanel(name){
  if(panel===name)name=null;
  if(name!=='quest'&&recActive())stopRecording();
  if(name==='quest')tourEvent('quest');
  if(name&&arrange.on){arrange.on=false;panel=name;render();return;}
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
const PANELS=[['quest','mic light','Quest'],['progress','chart','Progress'],['journal','book','Journal'],['settings','gear','Settings']];

function gameView(){const c=state.cat,[,msg]=catMood(),health=catHealth(),daily=state.lastDaily===today();
  const careBtn=([k,l,cost])=>{const g=careGain(k),need=HUD.find(h=>h[1]===CARE_ACTIONS[k].key)[0];return `<button data-care="${k}" class="${state.coins<cost?'locked':''}${g?'':' full'}" ${g?'':'disabled'} title="${l} · ${cost?cost+' coins':'free'}">${careIcon(k)}<span>${l}<em>${g?`+${g} ${need}`:`${need} is full`}</em></span><small>${cost?`${COIN}${cost}`:'Free'}</small></button>`;};
  const speak=challenge?'Continue':daily?'Practice':'Speak';
  return `<div class="game">
  <div class="room-stage">
    <canvas id="room-canvas" data-cam="cat" role="img" aria-label="${esc(msg)}"></canvas>
    <div class="room-top${statsOpen?' stats-open':''}">
      <div class="room-hud">${HUD.map(([l,key,kind,icon])=>{const v=Math.round(c[key]);return `<div class="hud-meter ${kind}${v<35?' low':''}" title="${l} ${v}%"><canvas class="hud-icon" data-pixel-icon="${icon}" width="32" height="32"></canvas><div><span><em>${l}</em><b>${v}%</b></span><div class="bar"><i style="width:${v}%"></i></div></div></div>`;}).join('')}</div>
      <div class="room-status">
        <div class="status-left"><span class="chip hearts${c.alive&&health<25?' danger':''}" role="img" aria-label="Health ${health}%" title="${esc(msg)}">${hearts(health)}</span><button class="chip needs-toggle" data-stats-toggle aria-expanded="${statsOpen}">Needs${HUD.some(h=>c[h[1]]<35)?'<i class="alert-dot" title="A need is low"></i>':''}<i class="caret" aria-hidden="true"></i></button></div>
        <span class="chip level" title="Level ${level()} · ${title()} · ${state.xp%500}/500 XP to the next level">Lv ${level()}<i class="lv-bar"><b style="width:${(state.xp%500)/5}%"></b></i></span>
        <span class="chip coins" title="Coins">${COIN}${state.coins}</span>
      </div>
      <nav class="hud-menu" aria-label="Menu">${PANELS.map(([k,icon,l])=>`<button class="hud-btn${panel===k?' active':''}" data-panel="${k}" title="${l}" aria-label="${l}"><i class="px-icon ${icon}" aria-hidden="true"></i><span>${l}</span></button>`).join('')}</nav>
    </div>
    <div class="room-bottom">
      <div class="cam-controls">
        <button class="cam-btn cam-zoom" data-zoom="in" title="Zoom in" aria-label="Zoom in"><i class="px-icon plus" aria-hidden="true"></i></button>
        <button class="cam-btn cam-zoom" data-zoom="out" title="Zoom out" aria-label="Zoom out"><i class="px-icon minus" aria-hidden="true"></i></button>
        <button class="cam-btn cam-arrange${arrange.on?' on':''}" data-arrange title="Move furniture" aria-label="Move furniture" aria-pressed="${arrange.on}"><i class="px-icon move" aria-hidden="true"></i></button>
        <button class="cam-btn cam-reset" hidden title="Reset view" aria-label="Reset view"><i class="reset-icon" aria-hidden="true"></i></button>
      </div>
      ${arrange.on?`<div class="arrange-bar" role="status"><span>Drag things to move them</span><button data-arrange-reset>Reset</button><button class="done" data-arrange>Done</button></div>`
        :`<button class="speak-btn${!daily&&!challenge?' due':''}" data-panel="quest"><i class="px-icon mic" aria-hidden="true"></i>${speak}</button>`}
      <details class="care-menu"${careMenuOpen?' open':''}><summary><i class="hp hp-full" aria-hidden="true"></i>Care</summary><div class="care-menu-list">${CARE.map(careBtn).join('')}</div></details>
    </div>
  </div>
  <aside class="panel${panel?' open':''}" aria-hidden="${!panel}">${panel?panelView():''}</aside>
</div>`;}

function panelView(){
  const body={quest:questPanel,progress:progressPanel,journal:journalPanel,settings:settingsPanel}[panel]();
  return `<header class="panel-head"><div class="panel-tabs">${PANELS.map(([k,icon,l])=>`<button class="tab${panel===k?' active':''}" data-panel-tab="${k}" title="${l}" aria-label="${l}"><i class="px-icon ${icon}" aria-hidden="true"></i></button>`).join('')}</div><h2>${PANELS.find(p=>p[0]===panel)[2]}</h2><button class="close" data-panel-close title="Close" aria-label="Close"><i class="px-icon x" aria-hidden="true"></i></button></header><div class="panel-body pb-${panel}">${body}</div>`;
}

// ---- Quest ----
const QUEST_STEPS=['Topic','Speak','Coach'];
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
  const st=Math.min(challenge.step||0,QUEST_STEPS.length-1);
  return `<div class="challenge"><div class="steps">${QUEST_STEPS.map((l,i)=>`<button data-step="${i}" class="${i===st?'active':''}${i<st?' done':''}"><b>${i+1}</b>${l}</button>`).join('')}</div>
  <div class="step-body">${[stepTopic,stepSpeak,stepCoach][Math.min(st,2)]()}</div>
  <div class="step-foot">${st?`<button class="secondary" data-step="${st-1}">← Back</button>`:''}${st<2?`<button class="primary" data-step="${st+1}">Next →</button>`:'<button class="primary" id="complete">Complete quest ✨</button>'}</div></div>`;
}
function stepTopic(){const tier=WHEEL_TIERS[challenge.difficulty-1];return `<div class="topic-box" style="--tier:${tier[1]}"><span>${tier[0].toUpperCase()} · LEVEL ${challenge.difficulty}/7</span><h3>${challenge.topic}</h3><div class="chips"><b><i class="px-icon brain" aria-hidden="true"></i>${prep()}s prep</b><b><i class="px-icon mic light" aria-hidden="true"></i>${state.duration} min target</b></div></div>${!challenge.rerolled?'<button class="secondary" id="reroll">↻ Use free reroll</button>':''}<p class="muted">Take ${prep()} seconds to prepare, then speak for about ${state.duration} minutes. Transcribe it for the next step.</p>`;}
// Big countdown digits drawn as pixels (the font's "1" has a flag that reads like a stray line).
const DIGITS=['.###.|#...#|#..##|#.#.#|##..#|#...#|.###.','..#..|.##..|..#..|..#..|..#..|..#..|.###.','.###.|#...#|....#|...#.|..#..|.#...|#####','####.|....#|....#|.###.|....#|....#|####.','...#.|..##.|.#.#.|#..#.|#####|...#.|...#.','#####|#....|####.|....#|....#|#...#|.###.','.###.|#....|#....|####.|#...#|#...#|.###.','#####|....#|...#.|..#..|.#...|.#...|.#...','.###.|#...#|#...#|.###.|#...#|#...#|.###.','.###.|#...#|#...#|.####|....#|....#|.###.'].map(d=>d.split('|'));
DIGITS[1]=['..#..','..#..','..#..','..#..','..#..','..#..','..#..'];DIGITS[0]=['.###.','#...#','#...#','#...#','#...#','#...#','.###.'];
function pixelNumber(n){const ds=String(n).split('').map(Number),W=ds.length*6-1;
  return `<svg viewBox="0 0 ${W} 7" width="${W*11}" height="77" shape-rendering="crispEdges" aria-hidden="true">${ds.map((d,k)=>DIGITS[d].map((row,y)=>[...row].map((c,x)=>c==='#'?`<rect x="${k*6+x}" y="${y}" width="1" height="1"/>`:'').join('')).join('')).join('')}</svg>`;}

// ---- Speak: plan countdown, then record with a timer and a live transcript ----
const SpeechRec=window.SpeechRecognition||window.webkitSpeechRecognition;
// Phones generally can't share the mic between speech recognition and a recorder, so there we only transcribe.
const isPhone=()=>matchMedia('(pointer: coarse)').matches;
// Laptops default to Whisper (browser live text misses words there); phones default to quick, to spare mobile data.
// High accuracy is the default everywhere: phone browsers' live recognition stops after the first pause.
const transcriber=()=>state.transcriber||'whisper';
// Phones get the smaller Whisper model (faster, ~40 MB); laptops the more accurate one (~79 MB).
const whisperModel=()=>isPhone()?'Xenova/whisper-tiny.en':'Xenova/whisper-base.en';
const useWhisper=()=>transcriber()==='whisper'&&!!window.Worker&&!!window.OfflineAudioContext;
// Whisper needs the audio, so it always records; then phones skip live recognition (it can't share the mic).
const keepAudio=()=>useWhisper()||!SpeechRec||!isPhone();
const liveText=()=>!!SpeechRec&&!(useWhisper()&&isPhone());
// Recorder state lives outside `challenge` (it holds live objects); phase: idle | prep | rec | stopping | done
let rec={phase:'idle'},recTick=null;
const mmss=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const recSeconds=()=>rec.start?(Date.now()-rec.start)/1000:0;
const recActive=()=>['prep','rec','stopping'].includes(rec.phase);
function resetRecorder(){if(rec.audio)URL.revokeObjectURL(rec.audio);clearInterval(recTick);rec={phase:'idle'};}
// One audio context, unlocked by the Start tap (phones only allow sound from a tap), for cues and the level meter.
let sfxCtx=null;
function audioCtx(){try{sfxCtx??=new (window.AudioContext||window.webkitAudioContext)();if(sfxCtx.state==='suspended')sfxCtx.resume();}catch{}return sfxCtx;}
// Short tones: 'start' when recording begins, 'warn' with 15 seconds to go, 'done' when time is up.
function cue(kind){const ac=audioCtx();if(!ac)return;const now=ac.currentTime;
  const notes={start:[[660,0],[880,.14]],warn:[[740,0],[740,.22]],done:[[523,0],[659,.14],[784,.28],[1047,.42]]}[kind];
  notes.forEach(([f,t])=>{const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;
    g.gain.setValueAtTime(0,now+t);g.gain.linearRampToValueAtTime(.35,now+t+.02);g.gain.exponentialRampToValueAtTime(.001,now+t+.18);
    o.connect(g).connect(ac.destination);o.start(now+t);o.stop(now+t+.2);});}
// Keep the screen on while planning and speaking (a locked screen pauses the page and the mic).
let wakeLock=null;
async function keepAwake(on){try{if(on&&!wakeLock&&navigator.wakeLock){wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>{wakeLock=null;});}else if(!on&&wakeLock){await wakeLock.release();wakeLock=null;}}catch{wakeLock=null;}}
async function startSpeaking(){
  audioCtx();keepAwake(true);
  let stream=null;
  // Ask for the mic up front, so the permission prompt doesn't eat into speaking time.
  try{stream=await navigator.mediaDevices.getUserMedia({audio:true});}
  catch{toast('The microphone is blocked. You can type or paste your transcript instead.');rec={phase:'done'};render();return;}
  rec={phase:'prep',stream,prepEnd:Date.now()+prep()*1000};
  clearInterval(recTick);recTick=setInterval(tickRecorder,250);render();
}
function beginRecording(){
  const r={...rec,phase:'rec',start:Date.now(),final:'',interim:''};
  // One continuous recording (no time slices: iPhones produce unplayable pieces otherwise), in a format this browser can play back.
  if(keepAudio()&&window.MediaRecorder&&r.stream){try{r.chunks=[];const type=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(t=>MediaRecorder.isTypeSupported?.(t));
    r.mr=new MediaRecorder(r.stream,type?{mimeType:type}:undefined);r.mr.ondataavailable=e=>{if(e.data.size)r.chunks.push(e.data);};r.mr.start();}catch{r.mr=null;}}
  if(!r.mr){r.stream?.getTracks().forEach(t=>t.stop());r.stream=null;}
  // Level meter from the live mic, so it's obvious the app can hear you.
  if(r.stream){try{const ac=audioCtx();r.an=ac.createAnalyser();r.an.fftSize=512;r.src=ac.createMediaStreamSource(r.stream);r.src.connect(r.an);r.lvl=new Float32Array(r.an.fftSize);}catch{r.an=null;}}
  rec=r;if(liveText())startRecognition(r);cue('start');render();
}
function startRecognition(r){
  const sr=new SpeechRec();sr.continuous=true;sr.interimResults=true;sr.lang=navigator.language||'en-US';
  sr.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript.trim();if(!t)continue;
    if(e.results[i].isFinal)r.final+=(r.final?' ':'')+t;else interim+=(interim?' ':'')+t;}r.interim=interim;showLive();};
  sr.onerror=e=>{if(['not-allowed','service-not-allowed','audio-capture'].includes(e.error))r.noSpeech=true;};
  // Without a mic stream to measure (phones), show when the recogniser itself hears sound.
  sr.onsoundstart=()=>{r.hearing=true;};sr.onsoundend=()=>{r.hearing=false;};
  // Browsers end recognition after a pause or about a minute. Keep whatever was still being recognised
  // (it would otherwise be lost), then restart straight away until the user stops.
  sr.onend=()=>{
    if(r.interim){r.final+=(r.final?' ':'')+r.interim;r.interim='';showLive();}
    if(rec===r&&r.phase==='rec'&&!r.noSpeech){const restart=(n)=>{try{sr.start();}catch{if(n<5)setTimeout(()=>restart(n+1),120);}};restart(0);}
    else r.srDone?.();};
  try{sr.start();r.sr=sr;}catch{r.noSpeech=true;}
}
function showLive(){const el=$('#live-text');if(!el)return;el.innerHTML=`${esc(rec.final)} <i>${esc(rec.interim)}</i>`;el.scrollTop=el.scrollHeight;}
function tickRecorder(){
  if(rec.phase==='prep'){const left=Math.ceil((rec.prepEnd-Date.now())/1000);if(left<=0){beginRecording();return;}const el=$('#prep-count');if(el&&el.dataset.n!=String(left)){el.dataset.n=left;el.innerHTML=pixelNumber(left);}}
  else if(rec.phase==='rec'){const s=recSeconds(),target=state.duration*60;
    const lv=$('#mic-level');if(lv){let v=0;if(rec.an){rec.an.getFloatTimeDomainData(rec.lvl);let sum=0;for(const x of rec.lvl)sum+=x*x;v=Math.min(1,Math.sqrt(sum/rec.lvl.length)*6);}else v=rec.hearing?.6+Math.random()*.3:0;
      rec.level=Math.max(v,(rec.level||0)*.8);lv.style.width=`${Math.round(rec.level*100)}%`;}
    const c=$('#rec-clock');if(c)c.textContent=`${mmss(s)} / ${mmss(target)}`;
    const b=$('#rec-bar');if(b){b.firstElementChild.style.width=`${Math.min(100,s/target*100)}%`;b.classList.toggle('reached',s>=target);}
    if(s>=target-15&&!rec.warned){rec.warned=true;cue('warn');}
    // Stop by itself when the target time is up.
    if(s>=target)stopRecording();}
}
// Stop both the recorder and recognition, wait (briefly) for their last results, then show the transcript.
function stopRecording(){
  const r=rec;if(r.phase==='prep'){cancelSpeaking();return;}if(r.phase!=='rec'||!challenge)return;
  r.phase='stopping';r.spoke=Math.round(recSeconds());cue('done');keepAwake(false);render();
  const waits=[];
  if(r.sr&&!r.noSpeech)waits.push(new Promise(res=>{r.srDone=res;try{r.sr.stop();}catch{res();}setTimeout(res,1500);}));
  if(r.mr&&r.mr.state!=='inactive')waits.push(new Promise(res=>{r.mr.onstop=res;r.mr.stop();}));
  Promise.all(waits).then(()=>{
    clearInterval(recTick);r.stream?.getTracks().forEach(t=>t.stop());try{r.src?.disconnect();}catch{}
    if(!challenge){resetRecorder();return;}
    const text=`${r.final} ${r.interim}`.trim();
    if(text)challenge.transcript=text;
    challenge.spokeSec=r.spoke;
    const blob=r.chunks?.length?new Blob(r.chunks,{type:r.chunks[0].type||r.mr.mimeType||'audio/webm'}):null,audio=blob?URL.createObjectURL(blob):null;
    rec={phase:'done',audio,noText:!text&&!(blob&&useWhisper())};saveQuest();render();
    if(blob&&useWhisper())runWhisper(blob);
  });
}
function cancelSpeaking(){keepAwake(false);try{rec.src?.disconnect();}catch{}try{rec.sr&&(rec.sr.onend=null,rec.sr.abort());}catch{}try{rec.mr?.state!=='inactive'&&rec.mr?.stop();}catch{}rec.stream?.getTracks().forEach(t=>t.stop());resetRecorder();render();}
function stepSpeak(){
  const target=state.duration*60;
  if(rec.phase==='prep'){const left=Math.max(1,Math.ceil((rec.prepEnd-Date.now())/1000));return `<div class="speak-stage">
    <span class="eyebrow">PLAN YOUR ANSWER</span><b class="big-count" id="prep-count" data-n="${left}" aria-label="${left} seconds">${pixelNumber(left)}</b><p class="speak-topic">${esc(challenge.topic)}</p>
    <p class="muted">Pick an opening, two or three points and a closing line. Recording stops by itself at ${mmss(state.duration*60)}.</p>
    <div class="speak-actions"><button class="secondary" id="rec-cancel">Cancel</button><button class="primary" id="rec-now">Start speaking now</button></div></div>`;}
  if(rec.phase==='rec'||rec.phase==='stopping'){const s=recSeconds();return `<div class="speak-stage live">
    <div class="rec-head"><span class="rec-dot"></span>${rec.phase==='stopping'?'Finishing…':'Recording'}<span class="mic-meter" title="Microphone level"><i id="mic-level"></i></span><b id="rec-clock">${mmss(s)} / ${mmss(target)}</b></div>
    <div class="bar rec-bar${s>=target?' reached':''}" id="rec-bar"><i style="width:${Math.min(100,s/target*100)}%"></i></div>
    <div class="live-text" id="live-text">${!liveText()&&useWhisper()?'<i>Keep talking. Your words are written out when you stop.</i>':SpeechRec&&!rec.noSpeech?`${esc(rec.final||'')} <i>${esc(rec.interim||'Listening…')}</i>`:'<i>Live transcript isn’t available in this browser. Your audio is still being recorded.</i>'}</div>
    <button class="primary" id="rec-stop" ${rec.phase==='stopping'?'disabled':''}>Stop</button></div>`;}
  if(rec.phase==='done'||challenge.transcript.trim()){const w=rec.whisper;return `${rec.audio?`<audio controls src="${rec.audio}"></audio>`:''}
    ${challenge.spokeSec?`<div class="chips"><b><i class="px-icon mic light" aria-hidden="true"></i>You spoke for ${mmss(challenge.spokeSec)}</b>${rec.accurate?'<b class="ok">High-accuracy ✓</b>':''}</div>`:''}
    ${w?`<div class="whisper-status"><span id="whisper-msg">${whisperMsg()}</span><div class="bar"><i id="whisper-bar" style="width:${Math.round((w.pct||0)*100)}%"></i></div></div>`
      :rec.noText?'<p class="note">No words were picked up. Type the transcript, or use your keyboard’s dictation.</p>':rec.audio&&!rec.accurate?'<p class="muted small">Missed a sentence? Play the recording back and fill it in.</p>':''}
    <label class="grow">Transcript · fix anything it misheard<textarea id="transcript" placeholder="${w?'Writing out your words…':'Type or paste your transcript here...'}" ${w?'readonly':''}>${esc(challenge.transcript)}</textarea></label>
    <button class="secondary" id="rec-again" ${w?'disabled':''}>↻ Record again</button>`;}
  return `<div class="speak-stage">
    <i class="px-icon mic light big" aria-hidden="true"></i><h3>Ready to speak?</h3>
    <p class="muted">${prep()} seconds to plan, then talk for about ${state.duration} min. ${useWhisper()?'Your words are written out accurately on this device after you stop.':SpeechRec?'Your words are written down as you speak.':'This browser can’t write down speech, so you’ll add the transcript afterwards.'}</p>
    <button class="primary" id="rec-start">Start</button><button class="mini" id="rec-type">I’ll type or paste it instead</button></div>`;
}

// ---- High-accuracy transcript: Whisper in a background worker, on this device ----
let whisperWorker=null,whisperSeq=0;const whisperJobs={};
function whisperCall(type,data={},onEvent){
  whisperWorker??=new Worker('whisper-worker.js',{type:'module'});
  whisperWorker.onmessage=e=>{const m=e.data,job=m.id!=null?whisperJobs[m.id]:null;
    if(m.type==='progress'){Object.values(whisperJobs).forEach(j=>j.onEvent?.(m));return;}
    if(!job)return;job.onEvent?.(m);if(m.type==='done'||m.type==='ready'){delete whisperJobs[m.id];job.res(m);}else if(m.type==='error'){delete whisperJobs[m.id];job.rej(new Error(m.message));}};
  whisperWorker.onerror=e=>{Object.values(whisperJobs).forEach(j=>j.rej(new Error(e.message||'Whisper failed to start')));for(const k in whisperJobs)delete whisperJobs[k];whisperWorker=null;};
  const id=++whisperSeq;return new Promise((res,rej)=>{whisperJobs[id]={res,rej,onEvent};whisperWorker.postMessage({id,type,...data},data.audio?[data.audio.buffer]:[]);});
}
// Model download progress, summed over its files.
function trackDownload(target,onUpdate){const files={};return m=>{
  if(m.type==='progress'&&m.total){files[m.file]=[m.loaded,m.total];const [l,t]=Object.values(files).reduce((a,[x,y])=>[a[0]+x,a[1]+y],[0,0]);target.stage='download';target.pct=t?l/t:0;target.mb=Math.round(t/1e6);}
  else if(m.type==='transcribing'){target.stage='run';target.pct=0;target.t0=Date.now();}
  onUpdate();};}
function whisperMsg(){const w=rec.whisper;if(!w)return '';return w.stage==='download'?`Downloading the speech model · first time only · ${Math.round(w.pct*100)}%${w.mb?` of ${w.mb} MB`:''}`:w.stage==='run'?'Writing out your words accurately…':'Getting ready…';}
// Whisper expects 16 kHz mono samples.
async function audioTo16k(blob){
  const ac=new AudioContext(),dec=await ac.decodeAudioData(await blob.arrayBuffer());ac.close();
  const off=new OfflineAudioContext(1,Math.max(1,Math.ceil(dec.duration*16000)),16000),src=off.createBufferSource();
  src.buffer=dec;src.connect(off.destination);src.start();return new Float32Array((await off.startRendering()).getChannelData(0));
}
async function runWhisper(blob){
  const job=rec,w=job.whisper={stage:'prep',pct:0},q=challenge;render();
  // While it runs, time-based progress stands in for real progress (Whisper doesn't report it).
  const tick=setInterval(()=>{if(w.stage==='run'){w.pct=Math.min(.95,(Date.now()-w.t0)/1000/Math.max(8,(q.spokeSec||60)*.35));}paintWhisper();},400);
  const paintWhisper=()=>{const m=$('#whisper-msg'),b=$('#whisper-bar');if(m)m.textContent=whisperMsg();if(b)b.style.width=`${Math.round(w.pct*100)}%`;};
  try{
    const audio=await audioTo16k(blob),out=await whisperCall('run',{audio,model:whisperModel()},trackDownload(w,paintWhisper));
    if(challenge===q&&out.text){q.transcript=out.text;job.accurate=true;job.noText=false;saveQuest();}
    else if(!out.text)toast('Whisper heard no words; kept the quick transcript.');
  }catch(err){console.warn(err);toast('High-accuracy transcript failed; kept the quick one.');}
  finally{clearInterval(tick);job.whisper=null;if(rec===job&&challenge===q&&panel==='quest')render();}
}
async function prepareWhisper(btn){
  const st={stage:'prep',pct:0},paint=()=>{btn.textContent=st.stage==='download'?`Downloading… ${Math.round(st.pct*100)}%`:'Loading…';};
  btn.disabled=true;paint();
  try{await whisperCall('load',{model:whisperModel()},trackDownload(st,paint));state.whisperReady=true;save();toast('Speech model ready · works offline now');}
  catch(err){console.warn(err);toast('Could not download the speech model. Check your connection.');}
  if(panel==='settings')render();
}

// ---- Coach: send the transcript to any chat AI, paste the reply back, scores fill themselves in ----
const SCORE_KEYS=[...SKILLS,'overall'];
function coachPrompt(){
  const words=challenge.transcript.trim().split(/\s+/).filter(Boolean).length,sec=challenge.spokeSec||0;
  const timing=sec?`SPEAKING TIME: ${mmss(sec)} (target: about ${state.duration} min) · roughly ${Math.round(words/(sec/60))} words per minute`:`TARGET LENGTH: about ${state.duration} min (actual time not recorded)`;
  return `You are my friendly but honest communication mentor. I am practicing speaking, not writing. The transcript below was captured by speech recognition, so ignore small transcription errors.\n\nScore each from 1–10: Clarity, Structure, Confidence, Vocabulary, Conciseness, Grammar, Overall.\n\nThen give:\n1. Three specific strengths\n2. Three specific improvements\n3. Timing and pace: did my length suit the target, and was my pace comfortable to listen to (around 130–160 words per minute is typical)?\n4. A stronger structure I could have used\n5. A short improved example answer\n6. One focus for my next speaking session\n\nDo not overpraise me. Be encouraging, concrete and concise.\n\nFinish your reply with these two sections, exactly in this format:\nKEY POINTS:\n- 3 to 5 bullet points, each under 15 words: the most important takeaways\nSCORES: clarity=X; structure=X; confidence=X; vocabulary=X; conciseness=X; grammar=X; overall=X\n\nTOPIC:\n${challenge.topic}\n\n${timing}\n\nTRANSCRIPT:\n${challenge.transcript}`;}
// Reads scores from the reply: the SCORES line if present, otherwise lines like "Clarity: 7", "Clarity 7/10" or "| Clarity | 7/10 |".
function parseScores(text){
  const out={},line=(text.match(/SCORES:([^\n]*)/i)||[])[1];
  for(const k of SCORE_KEYS){for(const src of [line,text]){if(!src)continue;
    const m=src.match(new RegExp(`\\b${k}\\b[^0-9\\n]{0,12}?(\\d{1,2}(?:\\.\\d)?)(?!\\d)`,'i'));
    if(m&&+m[1]>=1&&+m[1]<=10){out[k]=+m[1];break;}}}
  return out;
}
function scoreStatus(){const n=SCORE_KEYS.filter(k=>challenge.scores[k]).length;return n===7?'All 7 scores in ✓':n?`${n} of 7 · fill in the rest`:'Fills in when you paste the reply';}
function stepCoach(){return `<div class="coach-send"><span class="eyebrow">1 · SEND TO YOUR AI</span>
    <div class="speak-actions"><button class="primary" id="copy-prompt">Copy for AI</button>${navigator.share?'<button class="secondary" id="share-prompt">Share to app</button>':''}</div>
    <p class="muted small">Paste it into ChatGPT, Claude, Gemini or any chat AI.</p></div>
  <div class="paste-head"><span class="eyebrow">2 · PASTE THE REPLY</span>${navigator.clipboard?.readText?'<button class="mini" id="paste-reply">Paste</button>':''}</div>
  <label class="grow"><textarea id="feedback" aria-label="AI reply" placeholder="Paste the AI’s reply here...">${esc(challenge.feedback)}</textarea></label>
  <div class="paste-head"><span class="eyebrow">SCORES</span><em id="score-status">${scoreStatus()}</em></div>
  <div class="score-grid compact">${SCORE_KEYS.map(s=>`<label class="score-input${s==='overall'?' overall':''}"><span>${LABEL[s]}</span><input data-score="${s}" type="number" inputmode="decimal" min="1" max="10" step="0.5" value="${challenge.scores[s]||''}"></label>`).join('')}</div>`;}
// The short takeaways from the "KEY POINTS:" section of the reply (shown in the journal).
function parseKeyPoints(text=''){
  const m=text.match(/KEY POINTS:?(?:\*\*)?[^\S\n]*\n?([\s\S]*?)(?:\n\s*(?:\*\*)?SCORES:|$)/i);if(!m)return [];
  return m[1].split('\n').map(l=>l.replace(/^\s*(?:[-•*·]|\d+[.)])\s*/,'').replace(/\*\*/g,'').trim()).filter(l=>/[a-z0-9]/i.test(l)&&!/^SCORES/i.test(l)).slice(0,6);
}
function setFeedback(text){
  challenge.feedback=text;challenge.keyPoints=parseKeyPoints(text);const found=parseScores(text);Object.assign(challenge.scores,found);saveQuest();
  for(const [k,v] of Object.entries(found)){const i=$(`[data-score="${k}"]`);if(i)i.value=v;}
  const st=$('#score-status');if(st)st.textContent=scoreStatus();
}

// Draw the wheel; while spinning, ease towards the target and let the cat run, then reveal the topic.
function paintWheel(){
  cancelAnimationFrame(wheelFrame);
  const cv=$('#wheel-canvas');if(!cv)return;
  // Snap the canvas to a whole-number multiple of the wheel's pixel buffer so no pixel is drawn wider than another.
  cv.style.width=cv.style.height='';const dpr=devicePixelRatio||1,k=Math.max(1,Math.floor(cv.getBoundingClientRect().width*dpr/WHEEL_BUF));
  cv.width=cv.height=WHEEL_BUF*k;cv.style.width=cv.style.height=`${WHEEL_BUF*k/dpr}px`;
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
  wheel={rot:wheel.rot,spinning:false};resetRecorder();
  challenge={topic:p.t,difficulty:p.d,rerolled,date:today(),daily:state.lastDaily!==today(),transcript:'',feedback:'',scores:{clarity:0,structure:0,confidence:0,vocabulary:0,conciseness:0,grammar:0,overall:0},self:{confidence:5,fluency:5,satisfaction:5},step:0};
  render();
}

// ---- Progress ----
// Skill averages shown as meters, styled like the cat's Food / Water / Clean / Happy bars.
function skillRow(key,v){return `<div class="skill-meter ${key}" title="${LABEL[key]} ${v||'—'}/10"><span><em>${LABEL[key]}</em><b>${v||'—'}<small>/10</small></b></span><div class="bar"><i style="width:${(v||0)*10}%"></i></div></div>`;}
function progressPanel(){return `<div class="progress-view">
  <div class="tiles"><div><b>${state.streak}</b><small>day streak</small></div><div><b>${sessions().length}</b><small>sessions</small></div><div><b>${averageOverall()||'—'}</b><small>avg score</small></div><div><b>${difficulty()}/7</b><small>difficulty</small></div></div>
  <section class="p-card"><div class="section-head"><h3>Level ${level()} · ${title()}</h3><span class="pill">${state.xp%500}/500 XP</span></div><div class="bar xp"><i style="width:${(state.xp%500)/5}%"></i></div></section>
  <section class="p-card"><div class="section-head"><h3>Speaking target</h3><span class="pill">${state.duration} min</span></div><p class="muted small">Three recent scores averaging 7.5+ add 30 seconds (up to 5 min); below 5.5 eases it down (never under 2 min).</p></section>
  <section class="p-card grow"><h3>Skill profile</h3><div class="skill-list">${SKILLS.map(s=>skillRow(s,skillAvg(s))).join('')}</div></section></div>`;}

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
  return `${cal}<div class="hist-list"><div class="hist-rows">${rows.map(h=>`<button class="hist-row" data-hist="${h.id}"><span><span class="eyebrow">${h.date} · ${h.isDaily?'DAILY':'PRACTICE'}${h.incomplete?' · INCOMPLETE':''}</span><b>${esc(h.topic)}</b></span><span class="score${h.incomplete?' inc':''}">${h.incomplete?'—':h.scores.overall}</span></button>`).join('')}</div>
  <div class="pager"><button class="secondary" data-hist-page="-1" ${histPage?'':'disabled'}>←</button><span>${histPage+1} / ${pages}</span><button class="secondary" data-hist-page="1" ${histPage<pages-1?'':'disabled'}>→</button></div></div>`;
}
function histDetail(h){return `<div class="hist-detail"><div class="detail-head"><button class="mini back" data-hist-back>← All sessions</button><span class="eyebrow">${h.date} · ${h.isDaily?'DAILY':'PRACTICE'}${h.incomplete?' · INCOMPLETE':''}</span><h3>${esc(h.topic)}</h3><div class="chips"><b>🎯 ${h.scores.overall||'—'}/10</b><b>⭐ +${h.earnedXP} XP</b><b>${COIN}+${h.earnedCoins}</b><b><i class="px-icon mic light" aria-hidden="true"></i>${h.spokeSec?mmss(h.spokeSec):h.duration+' min'}</b></div><div class="score-chips">${SKILLS.map(s=>`<span>${LABEL[s]} <b>${h.scores[s]||'—'}</b></span>`).join('')}</div></div>${(()=>{const kp=h.keyPoints?.length?h.keyPoints:parseKeyPoints(h.feedback);
    return kp.length?`<div class="detail-text key-points"><h4>Key points</h4><ul>${kp.map(p=>`<li>${esc(p)}</li>`).join('')}</ul><details><summary>Full AI feedback</summary><p class="pre">${esc(h.feedback)}</p></details></div>`
      :`<div class="detail-text"><h4>AI feedback</h4><p class="pre">${esc(h.feedback||'No feedback saved.')}</p></div>`;})()}<div class="detail-text"><h4>Transcript</h4><p class="pre">${esc(h.transcript||'No transcript saved.')}</p></div></div>`;}
// This month at a glance: days with a completed daily quest are filled in.
function monthCalendar(){
  const now=new Date(),y=now.getFullYear(),m=now.getMonth(),days=new Date(y,m+1,0).getDate(),lead=(new Date(y,m,1).getDay()+6)%7;
  const done=new Set(sessions().filter(h=>h.isDaily).map(h=>h.date)),t=today();
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
  <section class="p-card"><h3>Transcription</h3>
    <div class="choice">${[['browser','Quick','Live text from your browser while you talk. Can miss words, especially around pauses.'],['whisper','High accuracy',`Whisper writes it out on this device after you stop. Catches more words, and keeps the recording for replay. One-time ~${isPhone()?40:79} MB download.`]].map(([k,t,d])=>`<button data-transcriber="${k}" class="${transcriber()===k?'active':''}"><b>${t}</b><small>${d}</small></button>`).join('')}</div>
    ${transcriber()==='whisper'?(state.whisperReady?'<p class="muted small">Speech model downloaded ✓ Works offline.</p>':'<button class="secondary" id="whisper-prep">Download the speech model now</button>'):''}</section>
  ${installCard()}
  ${location.hash==='#debug'?`<section class="p-card"><h3>Test: skip time</h3><div class="settings">${[6,24,72].map(h=>`<button class="secondary" data-skip="${h}">+${h<24?h+' h':h/24+' d'}</button>`).join('')}</div></section>`:''}
  <section class="p-card"><h3>Help &amp; feedback</h3><p class="muted small">Found a bug or have an idea? It really helps.</p><div class="settings"><button class="primary" id="send-feedback">Send feedback</button><button class="secondary" id="replay-tour">Show the tour again</button></div></section>
  <section class="p-card"><h3>Privacy</h3><p class="muted small">Everything (your cat, sessions and recordings) stays on this device; there are no accounts. High-accuracy transcription runs on this device too. Quick transcription uses your browser’s speech service (Chrome sends audio to Google). Feedback only goes to an AI when you copy or share it yourself.</p></section>
  <section class="p-card"><h3>Backup</h3><p class="muted small">Progress lives on this device. Export a backup regularly.${state.lastBackup?` Last backup: ${longDate(ymd(new Date(state.lastBackup)))}.`:' No backup yet.'}</p><div class="settings"><button class="secondary" id="export">↓ Export</button><button class="secondary" id="import">↑ Import</button><button class="danger" id="reset">Reset</button></div></section>
  <p class="app-version">Purrsuade v${APP_VERSION}</p>
`;}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}function cap(s){return s[0].toUpperCase()+s.slice(1);}

// ---- Install as an app ----
let installPrompt=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;if(panel==='settings')render();});
addEventListener('appinstalled',()=>{installPrompt=null;toast('Installed · find Purrsuade with your apps');});
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function installCard(){
  if(standalone())return '';
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const how=installPrompt?'<button class="primary" id="install-app">Install app</button>'
    :ios?'<p class="muted small">In Safari: tap <b>Share</b> → <b>Add to Home Screen</b> → <b>Add</b>.</p>'
    :'<p class="muted small">In Chrome or Edge: use the install icon in the address bar, or the menu → <b>Install app</b> / <b>Add to Home screen</b>.</p>';
  return `<section class="p-card"><h3>Install the app</h3><p class="muted small">Opens full screen like a normal app and works offline.</p>${how}</section>`;
}

// ---- Event wiring ----
function bind(){
  document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>setPanel(b.dataset.panel));
  document.querySelectorAll('[data-care]').forEach(b=>b.onclick=()=>care(b.dataset.care));
  document.querySelectorAll('[data-arrange]').forEach(b=>b.onclick=()=>{arrange.on=!arrange.on;if(arrange.on&&panel)setPanel(null);render();});
  $('[data-arrange-reset]')?.addEventListener('click',()=>{state.layout={};setRoomLayout({},performance.now());save();render();toast('Furniture back in its original spots.');});
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
      lastPet=now;catReaction={type:'pet',started:now};floatGain('♥','pet');tourEvent('pet');};
    // Arrange mode: presses on furniture drag it instead of panning; the layout is saved on drop.
    const grab=e=>arrange.on?grabItem(room,e,{onMove:redrawStill,onDrop:layout=>{state.layout=layout;setRoomLayout(layout,performance.now());save();}}):null;
    enableRoomCamera(room,{grab,pinch:matchMedia('(pointer: coarse)').matches,onTap:e=>{if(arrange.on)return;const g=graveAt(room,e.clientX,e.clientY);if(g){showGrave(g);return;}pet(e);},resetButton:$('.cam-reset'),zoomIn:$('[data-zoom="in"]'),zoomOut:$('[data-zoom="out"]'),onChange:redrawStill});
  }
  bindPanel();
}
function bindPanel(){
  const p=$('.panel');if(!p)return;const q=s=>p.querySelector(s),qa=s=>p.querySelectorAll(s);
  qa('[data-panel-tab]').forEach(b=>b.onclick=()=>{panel=null;setPanel(b.dataset.panelTab);});
  q('[data-panel-close]')?.addEventListener('click',()=>setPanel(null));
  qa('[data-step]').forEach(b=>b.onclick=()=>{if(recActive())stopRecording();challenge.step=+b.dataset.step;render();});
  qa('[data-hist]').forEach(b=>b.onclick=()=>{histSel=+b.dataset.hist;render();});
  qa('[data-hist-page]').forEach(b=>b.onclick=()=>{histPage+=+b.dataset.histPage;render();});
  q('[data-hist-back]')?.addEventListener('click',()=>{histSel=null;render();});
  q('#spin')?.addEventListener('click',()=>spin(false)); q('#reroll')?.addEventListener('click',()=>spin(true));
  q('#transcript')?.addEventListener('input',e=>{challenge.transcript=e.target.value;saveQuest();}); q('#feedback')?.addEventListener('input',e=>setFeedback(e.target.value));
  q('#rec-start')?.addEventListener('click',startSpeaking);q('#rec-now')?.addEventListener('click',beginRecording);q('#rec-cancel')?.addEventListener('click',cancelSpeaking);
  q('#rec-stop')?.addEventListener('click',stopRecording);q('#rec-type')?.addEventListener('click',()=>{rec={phase:'done'};render();$('#transcript')?.focus();});
  q('#rec-again')?.addEventListener('click',()=>{if(challenge.transcript.trim()&&!confirm('Record again? This replaces the current transcript.'))return;resetRecorder();challenge.transcript='';challenge.spokeSec=0;startSpeaking();});
  q('#share-prompt')?.addEventListener('click',sharePrompt);
  q('#paste-reply')?.addEventListener('click',async()=>{try{const t=await navigator.clipboard.readText();if(!t.trim()){toast('The clipboard is empty.');return;}$('#feedback').value=t;setFeedback(t);toast(SCORE_KEYS.every(k=>challenge.scores[k])?'Reply pasted · scores filled in':'Reply pasted');}catch{toast('Paste was blocked. Long-press the box and paste instead.');}});
  qa('[data-score]').forEach(i=>i.oninput=e=>{challenge.scores[e.target.dataset.score]=+e.target.value;saveQuest();const st=$('#score-status');if(st)st.textContent=scoreStatus();});
  qa('[data-self]').forEach(i=>i.oninput=e=>{challenge.self[e.target.dataset.self]=+e.target.value;saveQuest();e.target.previousElementSibling.querySelector('b').textContent=e.target.value+'/10';});
  q('#copy-prompt')?.addEventListener('click',copyPrompt);q('#complete')?.addEventListener('click',completeQuest);
  qa('[data-coat]').forEach(b=>b.onclick=()=>{state.cat.coat=b.dataset.coat;persist();});
  qa('[data-room]').forEach(b=>b.onclick=()=>{state.room=b.dataset.room;persist();});
  q('#install-app')?.addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice.catch(()=>{});installPrompt=null;render();});
  q('#replay-tour')?.addEventListener('click',()=>startTour());
  q('#send-feedback')?.addEventListener('click',()=>{
    const info=`\n\n---\nPurrsuade v${APP_VERSION} · ${isPhone()?'phone':'computer'} · ${navigator.userAgent}`;
    const url=FEEDBACK_URL.startsWith('mailto:')?`${FEEDBACK_URL}?subject=${encodeURIComponent('Purrsuade feedback')}&body=${encodeURIComponent('What happened / what would you like?'+info)}`
      :FEEDBACK_URL.includes('github.com')?`${FEEDBACK_URL}?title=${encodeURIComponent('Feedback: ')}&body=${encodeURIComponent('What happened / what would you like?'+info)}`:FEEDBACK_URL;
    window.open(url,'_blank','noopener');});
  qa('[data-skip]').forEach(b=>b.onclick=()=>cqSkip(+b.dataset.skip));
  qa('[data-transcriber]').forEach(b=>b.onclick=()=>{state.transcriber=b.dataset.transcriber;persist();});
  q('#whisper-prep')?.addEventListener('click',e=>prepareWhisper(e.currentTarget));
  q('#save-cat-name')?.addEventListener('click',()=>{const n=$('#cat-name').value.trim().slice(0,18);if(!n){toast('Give your cat a name first.');return;}state.cat.name=n;persist();toast(`${n} has a new name!`);});
  q('#export')?.addEventListener('click',exportData);q('#import')?.addEventListener('click',()=>$('#import-file').click());
  q('#reset')?.addEventListener('click',()=>{if(confirm('Reset Purrsuade and your cat? This cannot be undone unless you exported a backup.')){localStorage.removeItem(STORE);localStorage.removeItem(QUEST_STORE);state=fresh();setRoomLayout(state.layout,performance.now());setRoomGraves(state.graves);panel=null;challenge=null;render();}});
}
async function copyPrompt(){if(!challenge.transcript.trim()){rec={phase:'done'};flagField(1,'#transcript','Add your transcript first');return;}const prompt=coachPrompt();try{await navigator.clipboard.writeText(prompt);toast('Copied · paste it into your AI');}catch{promptFallback(prompt);}}
// On phones this opens the share sheet, so the prompt can go straight into the ChatGPT / Claude / Gemini app.
async function sharePrompt(){if(!challenge.transcript.trim()){rec={phase:'done'};flagField(1,'#transcript','Add your transcript first');return;}try{await navigator.share({text:coachPrompt()});}catch(e){if(e.name!=='AbortError')copyPrompt();}}
function promptFallback(t){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('Coach prompt copied.');}
// Point at a missing field: show its step, focus it and pin a "!" note that clears after a few
// seconds or as soon as the user clicks or types in it.
function flagField(step,selector,msg){
  if(challenge.step!==step||!$('.panel '+selector)){challenge.step=step;render();}
  const el=$('.panel '+selector),box=el?.closest('label');if(!el||!box)return;
  box.querySelector('.field-msg')?.remove();
  box.classList.add('invalid');box.insertAdjacentHTML('beforeend',`<span class="field-msg" role="alert"><b>!</b>${msg}</span>`);
  el.focus({preventScroll:true});box.scrollIntoView({block:'nearest'});
  const clear=()=>{box.classList.remove('invalid');box.querySelector('.field-msg')?.remove();el.removeEventListener('pointerdown',clear);el.removeEventListener('input',clear);};
  el.addEventListener('pointerdown',clear);el.addEventListener('input',clear);setTimeout(clear,3500);
}
function completeQuest(){if(!challenge.transcript.trim()){rec={phase:'done'};flagField(1,'#transcript','Add your transcript');return;}if(!challenge.scores.overall){flagField(2,'[data-score="overall"]','Add Overall');return;}const daily=state.lastDaily!==today();let xp=daily?100:35;xp+=25+10+(challenge.feedback.trim()?25:0)+(!challenge.rerolled?15:0)+(challenge.scores.overall>=8?20:0);let coins=daily?60:20;if(challenge.scores.overall>=8)coins+=10;if(daily)state.streak=state.lastDaily===yesterday()?state.streak+1:1;resetRecorder();const {step,daily:_daily,...done}=challenge;const entry={...done,id:Date.now(),date:today(),isDaily:daily,earnedXP:xp,earnedCoins:coins,duration:state.duration,prep:prep()};state.history.unshift(entry);state.xp+=xp;state.coins+=coins;if(daily)state.lastDaily=today();state.duration=nextDuration();challenge=null;panel=null;catReaction={type:'cheer',started:performance.now()};persist();toast(`Quest complete · +${xp} XP · +${coins} coins`);}
function care(a){const c=state.cat;if(!c.alive){toast(`${c.name} cannot be cared for in this state.`);return;}const x=CARE_ACTIONS[a];if(!careGain(a)){toast(`${HUD.find(h=>h[1]===x.key)[0]} is already full.`);return;}if(state.coins<x.cost){toast('Not enough coins. Complete a speaking quest.');return;}state.coins-=x.cost;const before=c[x.key];c[x.key]=clamp(c[x.key]+x.gain,0,100);if(a==='food')c.happiness=clamp(c.happiness+5,0,100);if(a==='litter')c.happiness=clamp(c.happiness+4,0,100);if(healthOf(c)>=5)c.zeroSince=null;catReaction={type:a,started:performance.now()};persist();tourEvent('care');toast(x.msg(c.name));floatGain(`+${Math.round(c[x.key]-before)} ${HUD.find(h=>h[1]===x.key)[0]}`,a);}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`purrsuade-backup-${today()}.json`;a.click();URL.revokeObjectURL(url);state.lastBackup=Date.now();save();toast('Backup exported.');}
$('#import-file').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.history||!d.cat)throw new Error();state=hydrate({...fresh(),...d});setRoomLayout(state.layout,performance.now());setRoomGraves(state.graves);save();panel=null;challenge=null;render();toast('Backup restored.');}catch{toast('That backup file is not valid.');}};r.readAsText(f);e.target.value='';});

if('serviceWorker' in navigator && location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
// ---- First-run tour: spotlight each control; some steps wait for the user to try it ----
const visible=el=>el&&el.offsetParent!==null&&getComputedStyle(el).visibility!=='hidden';
const TOUR=[
  {title:'Meet your cat!',body:()=>`This little one lives in your room. Speak every day to earn coins and keep them happy.<label class="tour-name">Name your cat<input id="tour-cat-name" maxlength="18" value="${esc(state.cat.name)}"></label>`,next:'Let’s go'},
  {target:()=>{const cv=$('#room-canvas'),c=cv?._cat;if(!c)return null;const rc=cv.getBoundingClientRect(),k=rc.width/cv.width;return {left:rc.left+c.x*k,top:rc.top+c.y*k,width:c.w*k,height:c.h*k};},
    title:'Say hi',body:()=>`Tap ${esc(state.cat.name)} to pet them.`,wait:'pet'},
  {target:()=>$('.room-hud'),when:()=>!visible($('.needs-toggle')),title:'Needs',body:()=>`Food, water, litter and fun. They drop slowly over time, so check in each day.`},
  {target:()=>$('.needs-toggle'),when:()=>visible($('.needs-toggle')),title:'Needs',body:()=>`Tap <b>Needs</b> to see ${esc(state.cat.name)}’s food, water, litter and fun.`,wait:'needs'},
  {target:()=>$('.hearts'),title:'Health',body:()=>`Hearts show overall health. Keep the needs up and the hearts stay full.`},
  {target:()=>$('.coins'),title:'Coins',body:()=>`You earn coins by speaking, and spend them on food, toys and treats.`},
  {target:()=>$('.care-menu'),title:'Look after them',body:()=>`Open <b>Care</b> and give ${esc(state.cat.name)} some water. It’s free!`,wait:'care'},
  {target:()=>$('.cam-arrange'),title:'Make it yours',body:()=>`Tap here any time to move the furniture around the room.`},
  {target:()=>$('.hud-menu'),title:'Menu',body:()=>`Your quests, progress, journal and settings live here.`},
  {target:()=>$('.speak-btn'),title:'Your first quest',body:()=>`Ready? Tap <b>Speak</b> to spin a topic and practise for a couple of minutes.`,wait:'quest'},
];
let tour=null;
function startTour(){
  if(panel)setPanel(null);if(arrange.on){arrange.on=false;render();}
  document.querySelectorAll('.tour-shade,.tour-card').forEach(e=>e.remove());
  const shade=document.createElement('div'),card=document.createElement('div');shade.className='tour-shade';card.className='tour-card';card.setAttribute('role','dialog');
  document.body.append(shade,card);tour={i:-1,shade,card,frame:0};tourGo(1);
  const follow=()=>{if(!tour)return;placeTour();tour.frame=requestAnimationFrame(follow);};follow();
}
function tourGo(dir){
  let i=tour.i+dir;while(TOUR[i]?.when&&!TOUR[i].when())i+=dir;
  if(i>=TOUR.length){endTour(true);return;}
  if(statsOpen&&TOUR[tour.i]?.wait==='needs')setStatsOpen(false);
  tour.i=i;const st=TOUR[i],n=TOUR.filter(x=>!x.when||x.when()).length,pos=TOUR.slice(0,i+1).filter(x=>!x.when||x.when()).length;
  tour.card.className='tour-card'+(st.wait?' waiting':'')+(st.target?'':' center');
  tour.card.innerHTML=`<h3>${st.title}</h3><p>${st.body()}</p><div class="tour-foot"><span class="tour-dots">${pos} / ${n}</span><button class="tour-skip" data-tour="skip">Skip tour</button>${st.wait?'<button class="tour-later" data-tour="next">Skip step</button>':`<button class="tour-next" data-tour="next">${st.next||'Next'}</button>`}</div>`;
  tour.card.querySelector('[data-tour="skip"]').onclick=()=>endTour(false);
  tour.card.querySelector('[data-tour="next"]').onclick=()=>{
    const nm=$('#tour-cat-name');if(nm&&nm.value.trim()){state.cat.name=nm.value.trim().slice(0,18);persist();}
    tourGo(1);};
  placeTour();
}
function placeTour(){
  const st=TOUR[tour.i],el=st.target?.(),r=el&&(el.getBoundingClientRect?el.getBoundingClientRect():el),{shade,card}=tour,W=innerWidth,H=innerHeight;
  if(!r||!r.width){shade.style.cssText=`left:${W/2}px;top:${H/2}px;width:0;height:0`;card.style.left=`${Math.max(12,(W-card.offsetWidth)/2)}px`;card.style.top=`${Math.max(12,(H-card.offsetHeight)/2)}px`;return;}
  const p=6;shade.style.cssText=`left:${r.left-p}px;top:${r.top-p}px;width:${r.width+p*2}px;height:${r.height+p*2}px`;
  const cw=card.offsetWidth,ch=card.offsetHeight,below=r.top+r.height/2<H/2;
  card.style.left=`${Math.min(W-cw-12,Math.max(12,r.left+r.width/2-cw/2))}px`;
  card.style.top=`${below?Math.min(H-ch-12,r.top+r.height+p+12):Math.max(12,r.top-p-12-ch)}px`;
}
function tourEvent(name){if(tour&&TOUR[tour.i]?.wait===name)setTimeout(()=>tour&&tourGo(1),name==='quest'?0:700);}
function endTour(finished){
  if(!tour)return;cancelAnimationFrame(tour.frame);tour.shade.remove();tour.card.remove();tour=null;
  state.tourDone=true;save();if(finished)toast(`Have fun with ${state.cat.name}!`);
}
addEventListener('keydown',e=>{if(e.key==='Escape'&&tour)endTour(false);});

render();
// ---- Modals: farewell + adoption, headstone details, danger warning ----
function showModal(html,wire){
  closeModal();const sh=document.createElement('div');sh.className='modal-shade';sh.innerHTML=`<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(sh);sh.querySelector('[data-close]')?.addEventListener('click',closeModal);wire?.(sh);paintIcons();
}
function closeModal(){document.querySelector('.modal-shade')?.remove();}
const longDate=d=>new Date(d+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
const daysBetween=(a,b)=>Math.max(1,dayDiff(a,b)+1);
function showGrave(g){
  showModal(`<h3>${esc(g.name)}</h3><p class="modal-sub">${cap(g.coat.replace('_',' '))} cat</p>
    <p>${longDate(g.born)} – ${longDate(g.died)}<br>Lived ${daysBetween(g.born,g.died)} ${daysBetween(g.born,g.died)===1?'day':'days'} with you · ${g.sessions} ${g.sessions===1?'session':'sessions'} together</p>
    <div class="modal-foot"><button class="modal-ok" data-close>Close</button></div>`);
}
function showFarewell(){
  const g=state.graves[state.graves.length-1]||{name:state.cat.name,born:state.cat.born,died:today(),sessions:0};
  showModal(`<h3>Goodbye, ${esc(g.name)}</h3><p>${esc(g.name)} went too long without care and has passed away. They lived ${daysBetween(g.born,g.died)} days with you, and you did ${g.sessions} speaking ${g.sessions===1?'session':'sessions'} together.</p>
    <p>A headstone has been placed in the garden. Tap it any time to remember them.</p>
    <div class="modal-foot"><button class="modal-ok" data-adopt>Adopt a kitten</button></div>`,sh=>sh.querySelector('[data-adopt]').onclick=showAdopt);
}
function showAdopt(){
  let coat=CAT_COATS.find(k=>k!==state.cat.coat)||CAT_COATS[0];
  showModal(`<h3>Adopt a kitten</h3><p>Your XP, coins, streak and journal carry on with your new cat.</p>
    <label class="modal-field">Name<input id="adopt-name" maxlength="18" placeholder="Kitten name"></label>
    <div class="coat-grid">${CAT_COATS.map(k=>`<button data-coat-pick="${k}" class="${k===coat?'active':''}" title="${cap(k.replace('_',' '))}" data-coat="${k}"><canvas width="64" height="64"></canvas></button>`).join('')}</div>
    <div class="modal-foot"><button class="modal-ok" data-welcome>Welcome home</button></div>`,sh=>{
      sh.querySelectorAll('[data-coat-pick]').forEach(b=>b.onclick=()=>{coat=b.dataset.coatPick;sh.querySelectorAll('[data-coat-pick]').forEach(x=>x.classList.toggle('active',x===b));});
      sh.querySelector('[data-welcome]').onclick=()=>{const name=sh.querySelector('#adopt-name').value.trim().slice(0,18);if(!name){toast('Give your kitten a name first.');sh.querySelector('#adopt-name').focus();return;}
        state.cat={...fresh().cat,name,coat,born:today(),lastUpdated:Date.now()};resetCatPlan();closeModal();catReaction={type:'cheer',started:performance.now()};persist();toast(`Welcome home, ${name}!`);};
      setTimeout(()=>sh.querySelector('#adopt-name')?.focus(),50);});
}
// On opening: a heads-up if the cat is down to 1 heart or less.
function dangerCheck(){
  const c=state.cat;if(!c.alive){showFarewell();return;}
  const h=healthOf(c);if(h>=25){backupCheck();return;}
  const left=c.zeroSince?Math.max(0,GRACE_DAYS-(Date.now()-c.zeroSince)/DAY):null;
  const when=left==null?'Their hearts are almost gone.':left<1?'Less than a day left to save them!':`${Math.ceil(left)} ${Math.ceil(left)===1?'day':'days'} left to save them.`;
  showModal(`<h3>${esc(c.name)} is very weak</h3><p>${when} Feed them, refill the water and clean the litter.</p>
    <div class="modal-foot"><button class="modal-later" data-close>Later</button><button class="modal-ok" data-care-now>Care now</button></div>`,
    sh=>sh.querySelector('[data-care-now]').onclick=()=>{closeModal();careMenuOpen=true;const m=$('.care-menu');if(m)m.open=true;});
}
// Progress lives only in this browser, so nudge for a backup every two weeks once there's something to lose.
function backupCheck(){
  if(sessions().length<3)return;
  const last=Math.max(state.lastBackup||0,state.backupSnooze||0);if(Date.now()-last<14*DAY)return;
  showModal(`<h3>Back up your progress</h3><p>Your cat, coins and journal live only in this browser. A backup file lets you restore them if this browser’s data is ever cleared, or move to a new phone.</p>
    <div class="modal-foot"><button class="modal-later" data-close>Later</button><button class="modal-ok" data-backup-now>Back up now</button></div>`,
    sh=>{sh.querySelector('[data-close]').addEventListener('click',()=>{state.backupSnooze=Date.now()-7*DAY;save();});sh.querySelector('[data-backup-now]').onclick=()=>{exportData();closeModal();};});
}
// Test helper: skip time ahead to see needs drop. In the console: cqSkip(24); or open the app with #debug.
window.cqSkip=hours=>{state.cat.lastUpdated-=hours*3600000;if(state.cat.zeroSince)state.cat.zeroSince-=hours*3600000;state=decayCat(state);save();setRoomGraves(state.graves);render();if(!state.cat.alive)showFarewell();};

if(!state.tourDone&&!state.history.length)roomAssetsReady.then(()=>setTimeout(startTour,600),()=>{});
else roomAssetsReady.then(()=>setTimeout(dangerCheck,700),()=>{});
