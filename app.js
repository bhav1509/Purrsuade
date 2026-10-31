// Semantic version (MAJOR.MINOR.PATCH), bumped by scripts/release.sh on every push; 1.0.0 is the public launch.
const APP_VERSION='0.3.3';
const APP_RELEASED='2026-10-31';
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

function fresh(){return {xp:0,coins:80,streak:0,lastDaily:null,duration:2,room:'cream_checker',layout:{},history:[],cat:{name:'Miso',coat:'orange_tabby',hunger:82,thirst:82,cleanliness:82,happiness:82,lastUpdated:Date.now(),zeroSince:null,alive:true,born:today()},graves:[],owned:{coats:['orange_tabby'],rooms:['cream_checker'],items:['plant_big_sky','cardboard_box']},decor:{variants:{},extras:[{id:'plant',sprite:'plant_big_sky',x:12,y:12},{id:'box',sprite:'cardboard_box',x:144,y:126}],hidden:[],starter:2},version:1};}
function load(){try{return hydrate({...fresh(),...JSON.parse(localStorage.getItem(STORE)||'{}')});}catch{return fresh();}}
function hydrate(d){const savedBorn=d.cat?.born;d.cat={...fresh().cat,...(d.cat||{})};d.graves=Array.isArray(d.graves)?d.graves:[];d.history=d.history||[];
  // Cats from before birthdays were tracked: born on the day of the first session (or after the previous cat).
  const firstDay=d.history.map(h=>h.date).sort()[0];
  if(!savedBorn)d.cat.born=d.graves.length?d.graves[d.graves.length-1].died:(firstDay||today());
  repairGraves(d);d.layout=d.layout&&typeof d.layout==='object'?d.layout:{}; d.coins=Number.isFinite(d.coins)?d.coins:80;
  // Coats and room styles used to be free in Settings: whatever was picked before the shop stays owned.
  const own=d.owned||{};d.owned={coats:[...new Set([...(own.coats||[]),'orange_tabby',d.cat.coat])],rooms:[...new Set([...(own.rooms||[]),'cream_checker',d.room])],items:Array.isArray(own.items)?own.items:[]};
  // Perches, water fountains, ottomans, tunnels and sofas left the shop; any already bought are taken out of the
  // room (tunnels and sofas are refunded).
  const retired=/^(perch|fountain|ottoman|tunnel|sofa)_/,refund={tunnel:80,sofa:240};
  d.coins+=d.owned.items.reduce((n,s)=>n+(refund[s.split('_')[0]]||0),0);d.owned.items=d.owned.items.filter(s=>!retired.test(s));
  d.decor={variants:{...(d.decor?.variants||{})},extras:Array.isArray(d.decor?.extras)?d.decor.extras.filter(e=>!retired.test(e.sprite)):[],hidden:Array.isArray(d.decor?.hidden)?d.decor.hidden:[],starter:d.decor?.starter};
  // Rooms used to come with a rug, shelf, lamp, pictures and more; now a new room has just the bed, bowls, litter
  // tray, one window, a big plant and a cardboard box. A room from before keeps its floor pieces as things it owns
  // (in the colour it had), so they can be put away and placed again from the shop like anything bought.
  if(d.decor.starter!==2){
    const OLD=[['rug','rug_sage',90,99],['plant','plant_big_sky',170,10],['shelf','shelf_sage',108,0],['treats','treat_jar_pink',126,27,['shelf',0]],
      ['pot','plant_small_blush',144,27,['shelf',1]],['post','scratch_post_oak',27,153],['lamp','floor_lamp_cream',10,10],['cushion','floor_cushion_lavender',153,135],['yarn','toy_yarn_pink',108,117]];
    for(const [id,sp,x,y,on] of OLD){if(d.decor.hidden.includes(id)||d.decor.extras.some(e=>e.id===id))continue;const sprite=d.decor.variants[id]||sp;
      d.decor.extras.push({id,sprite,x,y});if(!d.owned.items.includes(sprite))d.owned.items.push(sprite);if(on&&!d.layout[id])d.layout[id]=['on',...on];}
    for(const id of OLD.map(o=>o[0]))delete d.decor.variants[id];
    d.decor.hidden=[];d.decor.starter=2;}
  return decayCat(d);}
function save(){localStorage.setItem(STORE,JSON.stringify(state));cloudChanged();}
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
// [first level, title]
const TITLES=[[1,'Curious Speaker'],[3,'Clear Speaker'],[5,'Confident Communicator'],[7,'Persuasive Speaker'],[9,'Communication Champion']];
function title(){const l=level();return TITLES.filter(([n])=>l>=n).pop()[1];}
function prep(){const l=level();return l<=2?60:l<=4?45:30;}
// Finished sessions only; quests left half-done at midnight sit in the journal as incomplete.
function sessions(){return state.history.filter(h=>!h.incomplete);}
function averageOverall(){const a=sessions().map(h=>+h.scores.overall).filter(Boolean);return a.length?round1(a.reduce((x,y)=>x+y,0)/a.length):0;}
function recentAvg(){const a=sessions().slice(0,5).map(h=>+h.scores.overall).filter(Boolean);return a.length? a.reduce((x,y)=>x+y,0)/a.length:0;}
// Hardest topic category unlocked: follows the speaker's level (Lv 1 -> Everyday + Story, each level adds one),
// nudged up by strong recent scores and down by weak ones.
function difficulty(){let d=level()+1;const a=recentAvg();if(a>=8)d++;if(a&&a<5.5)d--;return clamp(d,2,7);} // never fewer than two categories
// Which of the 60 base prompts a topic came from (topics = base prompt + a variation).
const topicBase=t=>BASE_TOPICS.findIndex(([,b])=>t.startsWith(b));
function nextDuration(){const a=sessions().slice(0,3).map(h=>+h.scores.overall).filter(Boolean);if(a.length<3)return state.duration;const avg=a.reduce((x,y)=>x+y,0)/a.length;if(avg>=7.5)return clamp(state.duration+.5,2,5);if(avg<5.5)return clamp(state.duration-.5,2,5);return state.duration;}
function yesterday(){const d=new Date();d.setDate(d.getDate()-1);return ymd(d);}
function catMood(){const c=state.cat,n=c.name;if(!c.alive)return ['Gone',`${n} is resting in the garden.`];const m=Math.min(c.hunger,c.thirst,c.cleanliness,c.happiness);if(healthOf(c)<15)return ['Sick',`${n} is very weak and needs care now.`];if(m<15)return ['Critical',`${n} urgently needs care.`];if(m<35)return ['Unhappy',`${n} needs some attention.`];if(m<60)return ['Okay',`${n} is doing okay, but could use some care.`];if(m<85)return ['Happy',`${n} is feeling content.`];return ['Thriving',`${n} is thriving!`];}
function skillAvg(s){const a=sessions().map(h=>+h.scores[s]).filter(Boolean);return a.length?round1(a.reduce((x,y)=>x+y,0)/a.length):0;}

let state=load(), challenge=loadQuest(), toastTimer=null;
applyRoom();
// Hand the room drawing everything it shows from the saved state: bought furniture and colours, layout, headstones.
function applyRoom(time){setRoomDecor(arrange.pending?{...state.decor,extras:[...state.decor.extras,arrange.pending]}:state.decor);setRoomLayout(state.layout,time);setRoomGraves(state.graves);}
rolloverQuest();
// Check again at each local midnight, and whenever the app comes back (timers sleep on phones).
function newDayCheck(){const r=rolloverQuest();if(r){wheel={rot:wheel.rot,spinning:false};render();toast(r==='saved'?'New day · your unfinished quest was saved to the journal.':'New day · time for a fresh quest.');}}
(function scheduleMidnight(){const n=new Date(),next=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1,0,0,2);setTimeout(()=>{newDayCheck();scheduleMidnight();},next-n);})();
document.addEventListener('visibilitychange',()=>{markVisibility();if(!document.hidden){newDayCheck();if(panel==='quest'&&!challenge)paintWheel();if(typeof rec!=='undefined'&&recActive())keepAwake(true);}});
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
  document.querySelectorAll('canvas[data-sprite]').forEach(c=>drawSpriteIcon(c,c.dataset.sprite,true));
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
  // The room stays animated even with "Reduce motion" on: the cat's slow walk isn't the kind of motion that setting
  // guards against, and a frozen first frame left the cat asleep forever.
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
  if(name&&arrange.on){endArrange();panel=name;render();return;}
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
const CARE_ACTIONS={food:{cost:12,key:'hunger',gain:38,msg:n=>`${n} enjoyed the meal.`},water:{cost:0,key:'thirst',gain:45,msg:()=>'Fresh water added.'},litter:{cost:0,key:'cleanliness',gain:48,msg:()=>'Litter box cleaned.'},play:{cost:5,key:'happiness',gain:25,msg:n=>`${n} had fun playing.`},treat:{cost:20,key:'happiness',gain:50,msg:n=>`${n} loved the treat!`}};
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
        <button class="chip level" data-level title="Level ${level()} · ${title()} · ${state.xp%500}/500 XP to the next level" aria-label="Level ${level()}: see your progress">Lv ${level()}<i class="lv-bar"><b style="width:${(state.xp%500)/5}%"></b></i></button>
        <span class="chip coins" title="Coins">${COIN}${state.coins}</span>
      </div>
      <nav class="hud-menu" aria-label="Menu">${PANELS.map(([k,icon,l])=>`<button class="hud-btn${panel===k?' active':''}" data-panel="${k}" title="${l}" aria-label="${l}"><i class="px-icon ${icon}" aria-hidden="true"></i><span>${l}</span></button>`).join('')}</nav>
    </div>
    <div class="room-bottom">
      <div class="cam-controls">
        <button class="cam-btn cam-zoom" data-zoom="in" title="Zoom in" aria-label="Zoom in"><i class="px-icon plus" aria-hidden="true"></i></button>
        <button class="cam-btn cam-zoom" data-zoom="out" title="Zoom out" aria-label="Zoom out"><i class="px-icon minus" aria-hidden="true"></i></button>
        <button class="cam-btn cam-arrange${arrange.on?' on':''}" data-arrange title="Move furniture" aria-label="Move furniture" aria-pressed="${arrange.on}"><i class="px-icon move" aria-hidden="true"></i></button>
        <button class="cam-btn cam-shop${panel==='shop'?' active':''}" data-panel="shop" title="Shop" aria-label="Shop"><i class="px-icon bag" aria-hidden="true"></i></button>
        <button class="cam-btn cam-reset" hidden title="Reset view" aria-label="Reset view"><i class="reset-icon" aria-hidden="true"></i></button>
      </div>
      ${arrange.on?arrangeBar()
        :`<button class="speak-btn${!daily&&!challenge?' due':''}" data-panel="quest"><i class="px-icon mic" aria-hidden="true"></i>${speak}</button>`}
      ${arrange.on?'<span></span>':`<details class="care-menu"${careMenuOpen?' open':''}><summary><i class="hp hp-full" aria-hidden="true"></i>Care</summary><div class="care-menu-list">${CARE.map(careBtn).join('')}</div></details>`}
    </div>
  </div>
  <aside class="panel${panel?' open':''}" aria-hidden="${!panel}">${panel?panelView():''}</aside>
</div>`;}

function panelView(){
  const body={quest:questPanel,progress:progressPanel,journal:journalPanel,settings:settingsPanel,shop:shopPanel}[panel]();
  return `<header class="panel-head"><div class="panel-tabs">${PANELS.map(([k,icon,l])=>`<button class="tab${panel===k?' active':''}" data-panel-tab="${k}" title="${l}" aria-label="${l}"><i class="px-icon ${icon}" aria-hidden="true"></i></button>`).join('')}</div><h2>${[...PANELS,SHOP_PANEL].find(p=>p[0]===panel)[2]}</h2><button class="close" data-panel-close title="Close" aria-label="Close"><i class="px-icon x" aria-hidden="true"></i></button></header><div class="panel-body pb-${panel}">${body}</div>`;
}

// ---- Quest ----
const QUEST_STEPS=['Topic','Speak','Feedback'];
// Wheel state while choosing a topic: {rot, spinning, from, to, start, pick, rerolled, landed}
let wheel={rot:wheelRotFor(0,.1),spinning:false};let wheelFrame=null;
function questPanel(){
  const daily=state.lastDaily===today();
  if(!challenge){const tier=WHEEL_TIERS[wheelTierAt(wheel.rot)];return `<div class="spin-area">
    <p class="eyebrow">${daily?'PRACTICE · BONUS XP':"TODAY'S QUEST · MAIN XP"}</p>
    <canvas id="wheel-canvas" width="288" height="288" aria-hidden="true"></canvas>
    <p class="wheel-label" id="wheel-label" style="--tier:${tier[1]}">${wheel.spinning||wheel.landed?tier[0]:'Spin for a topic'}</p>
    <button class="primary" id="spin" ${wheel.spinning?'disabled':''}>${wheel.spinning?'Spinning…':daily?'Spin a practice topic':'Spin for today’s topic'}</button>
    <p class="muted">Topics: ${WHEEL_TIERS.slice(Math.max(0,difficulty()-3),difficulty()).map(t=>t[0]).join(' · ')}<br>${prep()} sec to plan · ${state.duration} min to speak</p></div>`;}
  const st=Math.min(challenge.step||0,QUEST_STEPS.length-1);
  return `<div class="challenge"><div class="steps">${QUEST_STEPS.map((l,i)=>`<button data-step="${i}" class="${i===st?'active':''}${i<st?' done':''}"><b>${i+1}</b>${l}</button>`).join('')}</div>
  <div class="step-body">${[stepTopic,stepSpeak,stepCoach][Math.min(st,2)]()}</div>
  <div class="step-foot">${st?`<button class="secondary" data-step="${st-1}">← Back</button>`:''}${st===0?`<button class="primary" id="go-speak">I’m ready · start speaking →</button>`:st===1?`<button class="primary" data-step="2" ${recActive()||rec.whisper?'disabled':''}>Get feedback →</button>`:'<button class="primary" id="complete">Complete quest ✨</button>'}</div></div>`;
}
function stepTopic(){const tier=WHEEL_TIERS[challenge.difficulty-1];return `<div class="topic-box" style="--tier:${tier[1]}"><span>${tier[0].toUpperCase()} · DIFFICULTY ${challenge.difficulty}/7</span><h3>${challenge.topic}</h3><div class="chips"><b><i class="px-icon brain" aria-hidden="true"></i>${prep()}s prep</b><b><i class="px-icon mic light" aria-hidden="true"></i>${state.duration} min target</b></div></div>${!challenge.rerolled?'<button class="secondary" id="reroll">↻ Use free reroll</button>':''}<p class="muted">Take ${prep()} seconds to prepare, then speak for about ${state.duration} minutes. Transcribe it for the next step.</p>`;}
// Big countdown digits drawn as pixels (the font's "1" has a flag that reads like a stray line).
const DIGITS=['.###.|#...#|#..##|#.#.#|##..#|#...#|.###.','..#..|.##..|..#..|..#..|..#..|..#..|.###.','.###.|#...#|....#|...#.|..#..|.#...|#####','####.|....#|....#|.###.|....#|....#|####.','...#.|..##.|.#.#.|#..#.|#####|...#.|...#.','#####|#....|####.|....#|....#|#...#|.###.','.###.|#....|#....|####.|#...#|#...#|.###.','#####|....#|...#.|..#..|.#...|.#...|.#...','.###.|#...#|#...#|.###.|#...#|#...#|.###.','.###.|#...#|#...#|.####|....#|....#|.###.'].map(d=>d.split('|'));
DIGITS[1]=['..#..','..#..','..#..','..#..','..#..','..#..','..#..'];DIGITS[0]=['.###.','#...#','#...#','#...#','#...#','#...#','.###.'];
function pixelNumber(n){const ds=String(n).split('').map(Number),W=ds.length*6-1;
  return `<svg viewBox="0 0 ${W} 7" width="${W*11}" height="77" shape-rendering="crispEdges" aria-hidden="true">${ds.map((d,k)=>DIGITS[d].map((row,y)=>[...row].map((c,x)=>c==='#'?`<rect x="${k*6+x}" y="${y}" width="1" height="1"/>`:'').join('')).join('')).join('')}</svg>`;}

// ---- Speak: plan countdown, then record with a timer and a live transcript ----
const SpeechRec=window.SpeechRecognition||window.webkitSpeechRecognition;
// Phones generally can't share the mic between speech recognition and a recorder, so there we only transcribe.
const isPhone=()=>matchMedia('(pointer: coarse)').matches;
// High accuracy (Whisper, on this device) is the default everywhere: browsers' live recognition misses words, and on
// phones stops after the first pause. A device where Whisper crashes twice switches to keyboard dictation.
const transcriber=()=>state.transcriber||'whisper';
// Phones get the smaller Whisper model (faster, ~40 MB); laptops the more accurate one (~79 MB).
const whisperModel=()=>isPhone()?'Xenova/whisper-tiny.en':'Xenova/whisper-base.en';
const useWhisper=()=>transcriber()==='whisper'&&!!window.Worker&&!!window.OfflineAudioContext;
// Keyboard dictation: the user talks into the text box with the phone keyboard's microphone (no recording here).
const dictating=()=>transcriber()==='dictate';
// Whisper needs the audio, so it always records; then phones skip live recognition (it can't share the mic).
const keepAudio=()=>!dictating()&&!useWhisper()&&(!SpeechRec||!isPhone());
const liveText=()=>!!SpeechRec&&!dictating()&&!(useWhisper()&&isPhone());
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
  // Ask for the mic up front, so the permission prompt doesn't eat into speaking time (not needed for dictation).
  if(!dictating())try{stream=await navigator.mediaDevices.getUserMedia({audio:true});}
  catch{toast('The microphone is blocked. You can type or paste your transcript instead.');rec={phase:'done'};render();return;}
  rec={phase:'prep',stream,prepEnd:Date.now()+prep()*1000};
  if(useWhisper()&&stream)whisperCall('load',{model:whisperModel()}).catch(()=>{});
  clearInterval(recTick);recTick=setInterval(tickRecorder,250);render();
}
function beginRecording(){
  const r={...rec,phase:'rec',start:Date.now(),final:'',interim:''};
  // One continuous recording (no time slices: iPhones produce unplayable pieces otherwise), in a format this browser can play back.
  if(keepAudio()&&window.MediaRecorder&&r.stream){try{r.chunks=[];const type=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(t=>MediaRecorder.isTypeSupported?.(t));
    r.mr=new MediaRecorder(r.stream,type?{mimeType:type}:undefined);r.mr.ondataavailable=e=>{if(e.data.size)r.chunks.push(e.data);};r.mr.start();}catch{r.mr=null;}}
  if(!r.mr&&!useWhisper()){r.stream?.getTracks().forEach(t=>t.stop());r.stream=null;}
  // Level meter from the live mic, so it's obvious the app can hear you.
  if(r.stream){try{const ac=audioCtx();r.an=ac.createAnalyser();r.an.fftSize=512;r.src=ac.createMediaStreamSource(r.stream);r.src.connect(r.an);r.lvl=new Float32Array(r.an.fftSize);}catch{r.an=null;}}
  rec=r;if(useWhisper())startPcm(r);if(liveText())startRecognition(r);cue('start');render();
}
// ---- Whisper mode: capture raw 16 kHz audio and write it out in ~15 s pieces while the user talks ----
// Nothing heavy is ever built: no audio file to encode or decode, and only one short piece is transcribed at a
// time, so memory stays flat however long the talk is (a 2-minute talk used to crash iPhones at the end).
// Each finished piece's text is saved straight away, so even a crash keeps almost everything.
const PCM_RATE=16000;
function startPcm(r){
  const ac=audioCtx();if(!ac||!r.stream)return;
  try{
    const src=r.src||ac.createMediaStreamSource(r.stream),proc=ac.createScriptProcessor(4096,1,1),mute=ac.createGain();
    r.src=src;mute.gain.value=0;src.connect(proc);proc.connect(mute);mute.connect(ac.destination);
    const step=ac.sampleRate/PCM_RATE,q=challenge,model=whisperModel();let carry=0;
    const P=r.pcm={all:[],piece:[],len:0,texts:[],sent:0,done:0,queue:Promise.resolve(),proc,mute,dl:{stage:'prep',pct:0}};
    markWhisper('recording');
    P.flush=()=>{
      if(P.len<PCM_RATE*.4){P.piece=[];P.len=0;return;}
      const audio=new Float32Array(P.len);let o=0;for(const c of P.piece){audio.set(c,o);o+=c.length;}
      const idx=P.sent++;P.piece=[];P.len=0;
      P.queue=P.queue.then(()=>{markWhisper(P.dl.stage==='download'?'download':'writing piece '+(idx+1));
        // A piece that hasn't come back in 90 s is skipped (and the worker restarted) rather than waited on forever.
        return Promise.race([whisperCall('run',{audio,model},trackDownload(P.dl,()=>{})),new Promise((_,rej)=>setTimeout(()=>{try{whisperWorker?.terminate();}catch{}whisperWorker=null;rej(new Error('timed out'));},90000))]);}).then(out=>{
        P.texts[idx]=out.text||'';P.done++;
        if(challenge===q){q.transcript=P.texts.filter(Boolean).join(' ').replace(/\s+/g,' ').trim();saveQuest();}
      }).catch(err=>{console.warn(err);noteWhisperIssue(`piece ${idx+1} failed: ${err.message}`);P.failed=true;P.done++;});
    };
    proc.onaudioprocess=e=>{
      if(r.phase!=='rec')return;
      const inp=e.inputBuffer.getChannelData(0),out=new Float32Array(Math.ceil((inp.length-carry)/step));let n=0,pos=carry,sum=0;
      for(;pos<inp.length;pos+=step){const v=inp[Math.floor(pos)];out[n++]=v;sum+=v*v;}
      carry=pos-inp.length;const chunk=out.subarray(0,n);P.all.push(chunk);P.piece.push(chunk);P.len+=n;
      // Cut at a pause after ~14 s (or at 20 s regardless), so words aren't split between pieces.
      const quiet=Math.sqrt(sum/Math.max(1,n))<.012;
      if((P.len>=PCM_RATE*14&&quiet)||P.len>=PCM_RATE*20)P.flush();
    };
  }catch(err){console.warn(err);r.pcm=null;}
}
function stopPcm(r){const P=r.pcm;if(!P)return;try{P.proc.disconnect();P.mute.disconnect();}catch{}P.flush();}
// 16-bit mono WAV from the captured audio: small (~4 MB for 2 min) and plays everywhere.
function pcmToWav(chunks){
  const n=chunks.reduce((a,c)=>a+c.length,0),buf=new ArrayBuffer(44+n*2),v=new DataView(buf),w=(o,str)=>[...str].forEach((ch,i)=>v.setUint8(o+i,ch.charCodeAt(0)));
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,PCM_RATE,true);v.setUint32(28,PCM_RATE*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  let o=44;for(const c of chunks)for(let i=0;i<c.length;i++,o+=2)v.setInt16(o,Math.max(-1,Math.min(1,c[i]))*0x7fff,true);
  return new Blob([buf],{type:'audio/wav'});
}
// After stopping: wait for the last pieces, showing progress, then mark the transcript as high-accuracy.
async function finishPcm(job,P){
  const q=challenge,w=job.whisper={stage:'run',pct:P.sent?P.done/P.sent:1};render();
  const tick=setInterval(()=>{w.stage=P.dl.stage==='download'?'download':'run';w.pct=P.dl.stage==='download'?P.dl.pct:(P.sent?P.done/P.sent:1);w.mb=P.dl.mb;
    const m=$('#whisper-msg'),b=$('#whisper-bar');if(m)m.textContent=whisperMsg();if(b)b.style.width=`${Math.round(w.pct*100)}%`;},300);
  await P.queue;clearInterval(tick);markWhisper(null);if(!P.failed&&state.whisperCrashes){state.whisperCrashes=0;save();}
  if(challenge===q){if(P.texts.some(Boolean)){q.transcript=P.texts.filter(Boolean).join(' ').replace(/\s+/g,' ').trim();job.accurate=!P.failed;job.noText=false;saveQuest();}
    else if(!q.transcript.trim()){job.noText=true;}}
  if(P.failed)toast('Part of the recording couldn’t be written out. Check the transcript.');
  job.whisper=null;if(rec===job&&challenge===q&&panel==='quest')render();
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
  r.phase='stopping';r.spoke=Math.round(recSeconds());cue('done');keepAwake(false);stopPcm(r);render();
  const waits=[];
  if(r.sr&&!r.noSpeech)waits.push(new Promise(res=>{r.srDone=res;try{r.sr.stop();}catch{res();}setTimeout(res,1500);}));
  if(r.mr&&r.mr.state!=='inactive')waits.push(new Promise(res=>{r.mr.onstop=res;r.mr.stop();}));
  Promise.all(waits).then(()=>{
    clearInterval(recTick);r.stream?.getTracks().forEach(t=>t.stop());try{r.src?.disconnect();}catch{}
    if(!challenge){resetRecorder();return;}
    const text=`${r.final} ${r.interim}`.trim();
    if(text)challenge.transcript=text;else if(dictating()){const ta=$('#transcript');if(ta)challenge.transcript=ta.value;}
    challenge.spokeSec=r.spoke;
    const blob=r.pcm?pcmToWav(r.pcm.all):r.chunks?.length?new Blob(r.chunks,{type:r.chunks[0].type||r.mr.mimeType||'audio/webm'}):null,audio=blob?URL.createObjectURL(blob):null;
    rec={phase:'done',audio,noText:!challenge.transcript.trim()&&!r.pcm};saveQuest();render();
    if(r.pcm)finishPcm(rec,r.pcm);
  });
}
function cancelSpeaking(){keepAwake(false);try{rec.pcm&&(rec.pcm.proc.disconnect(),rec.pcm.mute.disconnect());}catch{}markWhisper(null);try{rec.src?.disconnect();}catch{}try{rec.sr&&(rec.sr.onend=null,rec.sr.abort());}catch{}try{rec.mr?.state!=='inactive'&&rec.mr?.stop();}catch{}rec.stream?.getTracks().forEach(t=>t.stop());resetRecorder();render();}
function stepSpeak(){
  const target=state.duration*60;
  if(rec.phase==='prep'){const left=Math.max(1,Math.ceil((rec.prepEnd-Date.now())/1000));return `<div class="speak-stage">
    <span class="eyebrow">PLAN</span><b class="big-count" id="prep-count" data-n="${left}" aria-label="${left} seconds">${pixelNumber(left)}</b><p class="speak-topic">${esc(challenge.topic)}</p>
    <div class="speak-actions"><button class="secondary" id="rec-cancel">Cancel</button><button class="primary" id="rec-now">Start speaking now</button></div></div>`;}
  if(rec.phase==='rec'||rec.phase==='stopping'){const s=recSeconds();return `<div class="speak-stage live">
    <div class="rec-head"><span class="rec-dot"></span>${rec.phase==='stopping'?'Finishing…':'Recording'}<span class="mic-meter" title="Microphone level"><i id="mic-level"></i></span><b id="rec-clock">${mmss(s)} / ${mmss(target)}</b></div>
    <div class="bar rec-bar${s>=target?' reached':''}" id="rec-bar"><i style="width:${Math.min(100,s/target*100)}%"></i></div>
    ${dictating()?`<label class="grow dictate-box"><span>Tap the box, then the <b>microphone</b> on your keyboard, and talk.</span><textarea id="transcript" placeholder="Your words appear here as you talk…">${esc(challenge.transcript)}</textarea></label>`
      :'<div class="listening"><i class="px-icon mic light listen-mic" aria-hidden="true"></i><b>I’m listening, keep talking</b><span class="muted">Your words will appear here when you finish.</span></div>'}
    <button class="primary" id="rec-stop" ${rec.phase==='stopping'?'disabled':''}>Stop</button></div>`;}
  if(rec.phase==='done'||challenge.transcript.trim()){const w=rec.whisper;return `${rec.audio?`<audio controls src="${rec.audio}"></audio>`:''}
    ${challenge.spokeSec?`<div class="chips"><b><i class="px-icon mic light" aria-hidden="true"></i>You spoke for ${mmss(challenge.spokeSec)}</b>${rec.accurate?'<b class="ok">High-accuracy ✓</b>':''}</div>`:''}
    ${w?`<div class="whisper-status"><span id="whisper-msg">${whisperMsg()}</span><div class="bar"><i id="whisper-bar" style="width:${Math.round((w.pct||0)*100)}%"></i></div></div>`
      :rec.noText?'<p class="note">No words were picked up. Type the transcript, or use your keyboard’s dictation.</p>':rec.audio&&!rec.accurate?'<p class="muted small">Missed a sentence? Play the recording back and fill it in.</p>':''}
    <label class="grow">Transcript · fix anything it misheard<textarea id="transcript" placeholder="${w?'Writing out your words…':'Type or paste your transcript here...'}" ${w?'readonly':''}>${esc(challenge.transcript)}</textarea></label>
    <button class="secondary" id="rec-again" ${w?'disabled':''}>↻ Record again</button>`;}
  return `<div class="speak-stage">
    <i class="px-icon mic light big" aria-hidden="true"></i><h3>Ready to speak?</h3>
    <ul class="speak-points"><li><b>Plan</b>${prep()} seconds</li><li><b>Talk</b>about ${state.duration} min</li>
      <li><b>Words</b>${dictating()?'type with your keyboard’s mic':useWhisper()||SpeechRec?'written out for you':'typed in afterwards'}</li></ul>
    <button class="primary" id="rec-start">Start</button></div>`;
}

// ---- High-accuracy transcript: Whisper in a background worker, on this device ----
let whisperWorker=null,whisperSeq=0;const whisperJobs={};
const WHISPER_FLAG='purrsuade-whisper-running';
// Crash guard marker: {t, stage, visible}. "visible" turns false while the app is in the background, so a page
// that iOS unloads there (very common when switching apps) isn't mistaken for a crash.
function markWhisper(stage){try{if(stage)localStorage.setItem(WHISPER_FLAG,JSON.stringify({t:Date.now(),stage,visible:!document.hidden}));else localStorage.removeItem(WHISPER_FLAG);}catch{}}
function readWhisperMark(){try{const v=localStorage.getItem(WHISPER_FLAG);if(!v)return null;try{return JSON.parse(v);}catch{return {t:+v,stage:'run',visible:true};}}catch{return null;}}
function markVisibility(){const m=readWhisperMark();if(m){m.visible=!document.hidden;try{localStorage.setItem(WHISPER_FLAG,JSON.stringify(m));}catch{}}}
addEventListener('pagehide',()=>{const m=readWhisperMark();if(m){m.visible=false;try{localStorage.setItem(WHISPER_FLAG,JSON.stringify(m));}catch{}}});
// Last thing that went wrong while writing out words, included with Send feedback.
function noteWhisperIssue(what){try{localStorage.setItem('purrsuade-last-issue',`${new Date().toISOString()} ${what}`);}catch{}}
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
  else if(m.type==='segment'){target.stage='run';target.pct=m.done/m.total;}
  onUpdate();};}
function whisperMsg(){const w=rec.whisper;if(!w)return '';return w.stage==='download'?`Downloading the speech model · first time only · ${Math.round(w.pct*100)}%${w.mb?` of ${w.mb} MB`:''}`:w.stage==='run'?'Writing out your words accurately…':'Getting ready…';}
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
  return `You are my friendly but honest communication mentor. I am practicing speaking, not writing. The transcript below was captured by speech recognition, so ignore small transcription errors.\n\nScore each from 1–10: Clarity, Structure, Confidence, Vocabulary, Conciseness, Grammar, Overall.\n\nThen give:\n1. Three specific strengths\n2. Three specific improvements\n3. Timing and pace: did my length suit the target, and was my pace comfortable to listen to (around 130–160 words per minute is typical)?\n4. A stronger structure I could have used\n5. A short improved example answer\n6. One focus for my next speaking session\n\nDo not overpraise me. Be encouraging, concrete and concise.\n\nFinish your reply with these two sections as plain text (no headings, bold or other formatting), exactly in this format:\nKEY POINTS:\n- 3 to 5 bullet points, each under 15 words: the most important takeaways\nSCORES: clarity=X; structure=X; confidence=X; vocabulary=X; conciseness=X; grammar=X; overall=X\n\nTOPIC:\n${challenge.topic}\n\n${timing}\n\nTRANSCRIPT:\n${challenge.transcript}`;}
// Reads scores from the reply: the SCORES line if present, otherwise lines like "Clarity: 7", "Clarity 7/10" or "| Clarity | 7/10 |".
function parseScores(text){
  const out={},line=[...text.matchAll(/SCORES:[*\s]*?([^\n]*\d[^\n]*)/gi)].pop()?.[1];
  for(const k of SCORE_KEYS){for(const src of [line,text]){if(!src)continue;
    const m=src.match(new RegExp(`\\b${k}\\b[^0-9\\n]{0,12}?(\\d{1,2}(?:\\.\\d)?)(?!\\d)`,'i'));
    if(m&&+m[1]>=1&&+m[1]<=10){out[k]=+m[1];break;}}}
  return out;
}
function scoreStatus(){const n=SCORE_KEYS.filter(k=>challenge.scores[k]).length;return n===7?'All 7 scores in ✓':n?`${n} of 7 · fill in the rest`:'Fills in with the feedback';}
// ---- Feedback: one tap sends the talk to the user's AI app; then copy its answer and paste it back ----
// ChatGPT and Claude accept the message in the link (?q=), so it arrives already typed in; for the others we copy it.
const AI_APPS=[['chatgpt','ChatGPT','https://chatgpt.com/?q='],['claude','Claude','https://claude.ai/new?q='],['gemini','Gemini','https://gemini.google.com/app'],['other','Other app','']];
// Instant feedback (signed in) fills the answer in directly; the AI-app steps stay as the other way.
let coachBusy=false;
function instantCard(got){
  const mode=instantMode();
  // Not signed in: an invitation to sign in (instant feedback only comes with an account).
  if(!mode)return cloudOn()?`<div class="instant-card"><div><h4>✨ Instant feedback</h4><p class="muted small">Skip the copy and paste: <b>sign in</b> for ${coachLeft??'a few'} free AI feedbacks a day.</p></div>
    <div class="instant-actions">${CLOUD_CONFIG.google?'<button class="primary" data-sign-in="Google">Continue with Google</button>':''}<button class="${CLOUD_CONFIG.google?'secondary':'primary'}" data-sign-in="">Sign in with email</button></div></div>`:'';
  const left=coachLeft!=null?` · ${coachLeft} left today`:'';
  return `<div class="instant-card${got?' done':''}"><div><h4>${got?'Feedback added ✓':'✨ Instant feedback'}</h4><p class="muted small">${coachBusy?`${esc(state.cat.name)} is reading your talk… about 10–30 seconds.`:`The AI reads your talk and fills in the feedback and scores${left}.`}</p></div>
    <button class="${got?'secondary':'primary'}" id="instant-feedback" ${coachBusy||(coachLeft===0)?'disabled':''}>${coachBusy?'Getting feedback…':got?'Get new feedback':coachLeft===0?'None left today':'Get feedback'}</button></div>`;
}
async function getInstantFeedback(){
  if(!challenge.transcript.trim()){rec={phase:'done'};flagField(1,'#transcript','Add your transcript first');return;}
  if(coachBusy)return;coachBusy=true;render();
  try{const text=await instantFeedback();if(challenge){setFeedback(text);toast(SCORE_KEYS.every(k=>challenge.scores[k])?'Feedback added · scores filled in':'Feedback added');}}
  catch(e){toast(instantError(e));manualOpen=true;}
  finally{coachBusy=false;render();}
}
let manualOpen=false;
function stepCoach(){
  const fav=state.coachApp,apps=fav?[...AI_APPS.filter(a=>a[0]===fav),...AI_APPS.filter(a=>a[0]!==fav)]:AI_APPS,got=!!challenge.feedback.trim(),instant=!!instantMode();
  return `${instantCard(got)}
    ${instant?`<details class="manual-coach"${manualOpen?' open':''}><summary>Or use your own AI app (ChatGPT, Claude, Gemini)</summary>`:''}<div class="coach-step${got?' done':''}"><b class="num">1</b><div class="cs-body"><h4>Send your talk to an AI helper</h4>
      <p class="muted small">Tap your app. Your talk is copied and the app opens with it${fav&&fav!=='gemini'&&fav!=='other'?' already typed in':''}. Just press send.</p>
      <div class="ai-apps">${apps.map(([k,l],i)=>`<button class="${i===0&&fav?'primary':'secondary'}" data-ai="${k}">${i===0&&fav?'★ ':''}${l}</button>`).join('')}</div></div></div>
    <div class="coach-step${got?' done':''}"><b class="num">2</b><div class="cs-body"><h4>Copy the AI’s answer</h4>
      <p class="muted small">When it has answered, tap the <b>copy</b> button under the answer (two small squares), or press and hold the answer and choose <b>Copy</b>. Then come back here.</p></div></div>
    <div class="coach-step${got?' done':''}"><b class="num">3</b><div class="cs-body"><h4>${got?'Answer added ✓':'Paste the answer here'}</h4>
      ${navigator.clipboard?.readText?`<button class="${got?'secondary':'primary'}" id="paste-reply">${got?'Paste a different answer':'Paste the answer'}</button>`:''}
      <label class="grow feedback-box"><textarea id="feedback" aria-label="AI answer" placeholder="Or press and hold here and choose Paste">${esc(challenge.feedback)}</textarea></label></div></div>
    ${instant?'</details>':''}
    <div class="paste-head"><span class="eyebrow">SCORES</span><em id="score-status">${scoreStatus()}</em></div>
    <div class="score-grid compact">${SCORE_KEYS.map(s=>`<label class="score-input${s==='overall'?' overall':''}"><span>${LABEL[s]}</span><input data-score="${s}" type="number" inputmode="decimal" min="1" max="10" step="0.5" value="${challenge.scores[s]||''}"></label>`).join('')}</div>
    ${got||coachBusy?'':'<button class="mini skip-feedback" id="skip-feedback">Skip feedback today and finish</button>'}`;}
async function openAI(app){
  if(!challenge.transcript.trim()){rec={phase:'done'};flagField(1,'#transcript','Add your transcript first');return;}
  state.coachApp=app;save();
  const prompt=coachPrompt();
  if(app==='other'){if(navigator.share){try{await navigator.share({text:prompt});}catch(e){if(e.name!=='AbortError')copyPrompt();}}else copyPrompt();render();return;}
  // Copy first (works inside the tap), so the user can always paste if the app doesn't pick up the link.
  let copied=true;try{await navigator.clipboard.writeText(prompt);}catch{copied=false;try{promptFallback(prompt,true);copied=true;}catch{}}
  const [,label,base]=AI_APPS.find(a=>a[0]===app),prefill=base.includes('?q=')&&encodeURIComponent(prompt).length<7000;
  window.open(prefill?base+encodeURIComponent(prompt):base,'_blank','noopener');
  toast(prefill?`Opening ${label} · press send`:`Copied · in ${label}, press and hold the message box and tap Paste`);
  render();
}
// The short takeaways from the "KEY POINTS:" section of the reply (shown in the journal).
function parseKeyPoints(text=''){
  const m=text.match(/KEY POINTS:?[*\s]*([\s\S]*?)(?:\n[\s#*]*SCORES:|$)/i);if(!m)return [];
  return m[1].split('\n').map(l=>l.replace(/^[\s#]*(?:[-•*·]|\d+[.)])?\s*/,'').replace(/\*+/g,'').trim()).filter(l=>/[a-z0-9]/i.test(l)&&!/^SCORES/i.test(l)).slice(0,6);
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
      const p=Math.min(1,(now-wheel.start)/(wheel.dur||3200)),e=1-(1-p)**4,speed=4*(1-p)**3;
      wheel.rot=wheel.from+(wheel.to-wheel.from)*e;
      anim=speed>1.2?'run':speed>.15?'walk':'idle';
      const lab=$('#wheel-label');if(lab){const t=WHEEL_TIERS[wheelTierAt(wheel.rot)];lab.textContent=t[0];lab.style.setProperty('--tier',t[1]);}
      if(p>=1){wheel.spinning=false;wheel.landed=true;wheel.landedAt=now;}
    }else if(wheel.landed&&now-wheel.landedAt<900){anim='jump';animT=(now-wheel.landedAt)/1000;}
    else if(wheel.landed){startChallenge(wheel.pick,wheel.rerolled);return;}
    drawCatWheel(cv,wheel.rot,state.cat.coat,anim,animT);
    if(wheel.spinning||wheel.landed)wheelFrame=requestAnimationFrame(frame);
    else wheelFrame=requestAnimationFrame(frame);
  };
  frame();roomAssetsReady.then(()=>{if(!wheel.spinning&&!wheel.landed)drawCatWheel(cv,wheel.rot,state.cat.coat,'sit',0);},()=>{});
}
// Choose the topic first, then spin so the pointer lands on its category.
function spin(rerolled){
  // Pick a category from the unlocked range (the newest one a little more often), then a topic in it
  // whose base prompt hasn't come up in the last 20 sessions.
  const top=difficulty(),lo=Math.max(1,top-2),tiers=[];for(let t=lo;t<=top;t++)for(let w=0;w<(t===top?2:1);w++)tiers.push(t);
  const recent=new Set([challenge?.topic,...state.history.slice(0,20).map(h=>h.topic)].filter(Boolean).map(topicBase));
  let tier=tiers[Math.floor(Math.random()*tiers.length)];
  if(state.history[0]&&TOPICS.find(x=>x.t===state.history[0].topic)?.d===tier&&tiers.some(t=>t!==tier)&&Math.random()<.6)tier=tiers.filter(t=>t!==tier)[Math.floor(Math.random()*tiers.filter(t=>t!==tier).length)];
  const inTier=TOPICS.filter(x=>x.d===tier),fresh=inTier.filter(x=>!recent.has(topicBase(x.t))),pool=fresh.length?fresh:inTier,prev=challenge?.topic;
  let p=pool[Math.floor(Math.random()*pool.length)];
  if(prev&&pool.length>1)while(p.t===prev)p=pool[Math.floor(Math.random()*pool.length)];
  challenge=null;
  // With "Reduce motion" on (common on phones) the wheel still turns, just once and gently.
  const calm=reducedMotion(),base=wheelRotFor(p.d-1,(Math.random()-.5)*.6),turns=Math.PI*2*(calm?1:5),cur=wheel.rot,dur=calm?1400:3200;
  let to=base;while(to<cur+turns)to+=Math.PI*2;
  wheel={rot:cur,from:cur,to,dur,start:performance.now(),spinning:true,landed:false,landedAt:-1e9,pick:p,rerolled};
  // Safety net: reveal the topic even if animation frames stall (background tab, panel closed mid-spin).
  const pending=wheel;setTimeout(()=>{if(wheel===pending&&!challenge){wheel.rot=to;startChallenge(p,rerolled);}},dur+1100);
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
  return `${cal}<div class="hist-list"><div class="hist-rows">${rows.map(h=>`<button class="hist-row" data-hist="${h.id}"><span><span class="eyebrow">${h.date} · ${h.isDaily?'DAILY':'PRACTICE'}${h.incomplete?' · INCOMPLETE':''}</span><b>${esc(h.topic)}</b></span><span class="score${h.incomplete||!h.scores.overall?' inc':''}">${h.incomplete||!h.scores.overall?'—':h.scores.overall}</span></button>`).join('')}</div>
  <div class="pager"><button class="secondary" data-hist-page="-1" ${histPage?'':'disabled'}>←</button><span>${histPage+1} / ${pages}</span><button class="secondary" data-hist-page="1" ${histPage<pages-1?'':'disabled'}>→</button></div></div>`;
}
function histDetail(h){return `<div class="hist-detail"><div class="detail-head"><button class="mini back" data-hist-back>← All sessions</button><span class="eyebrow">${h.date} · ${h.isDaily?'DAILY':'PRACTICE'}${h.incomplete?' · INCOMPLETE':''}</span><h3>${esc(h.topic)}</h3><div class="chips"><b>🎯 ${h.scores.overall||'—'}/10</b><b>⭐ +${h.earnedXP} XP</b><b>${COIN}+${h.earnedCoins}</b><b><i class="px-icon mic light" aria-hidden="true"></i>${h.spokeSec?mmss(h.spokeSec):h.duration+' min'}</b></div><div class="score-chips">${SKILLS.map(s=>`<span>${LABEL[s]} <b>${h.scores[s]||'—'}</b></span>`).join('')}</div></div>${(()=>{const kp=h.keyPoints?.length?h.keyPoints:parseKeyPoints(h.feedback);
    return kp.length?`<div class="detail-text key-points"><h4>Key points</h4><ul>${kp.map(p=>`<li>${esc(p)}</li>`).join('')}</ul><details><summary>Full AI feedback</summary><div class="fb">${feedbackHtml(h.feedback)}</div></details></div>`
      :`<div class="detail-text"><h4>AI feedback</h4>${h.feedback?`<div class="fb">${feedbackHtml(h.feedback)}</div>`:'<p class="pre">No feedback saved.</p>'}</div>`;})()}<div class="detail-text"><h4>Transcript</h4><p class="pre">${esc(h.transcript||'No transcript saved.')}</p></div></div>`;}
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

// ---- Shop: new furniture, new colours for what's in the room, room styles, coats and a new name ----
const SHOP_PANEL=['shop','bag','Shop'];
// Aisles of [name, price, sprites…]: each colour is bought once, then can be put away and placed again.
const SHOP_FURNITURE=[
  ['Cat stuff',[['Cat tree',200,'cat_tree_mint','cat_tree_lilac','cat_tree_white'],['Cat condo',180,'condo_cream','condo_oak'],
    ['Teepee',140,'teepee_cream_rose','teepee_grey_mint','teepee_white_blue'],['Cushion bed',90,'bed_rose','bed_sage','bed_blue','bed_lavender','bed_teal','bed_grey'],
    ['Scratching post',40,'scratch_post_oak','scratch_post_cream'],['Scratcher',70,'scratcher_rose','scratcher_sage','scratcher_blue'],['Cardboard box',25,'cardboard_box']]],
  ['Seats & rugs',[['Armchair',160,'armchair_lavender','armchair_rose','armchair_teal','armchair_grey'],
    ['Stool',50,'stool_lilac','stool_blue','stool_cream','stool_grey'],['Floor cushion',30,'floor_cushion_lavender','floor_cushion_blue','floor_cushion_grey','floor_cushion_rose','floor_cushion_sage','floor_cushion_teal'],
    ['Rug',60,'rug_sage','rug_rose','rug_blue'],['Blanket',45,'blanket_rose','blanket_sage','blanket_blue','blanket_lavender']]],
  ['Decor',[['Shelf',80,'shelf_sage','shelf_lilac','shelf_peach','shelf_sky'],['Bookshelf',170,'bookshelf_full_oak','bookshelf_full_walnut','bookshelf_full_white'],['Aquarium',260,'aquarium_oak','aquarium_white'],
    ['Side table',60,'side_table_oak','side_table_walnut','side_table_white'],['Big plant',70,'plant_big_mauve','plant_big_navy','plant_big_taupe','plant_big_sky'],
    ['Floor lamp',90,'floor_lamp_mint','floor_lamp_pink','floor_lamp_cream'],['Curtain window',120,'window_curtain_rose','window_curtain_blue','window_curtain_grey'],['Blind window',100,'window_blind_white','window_blind_lilac','window_blind_teal'],
    ['Plant painting',40,'art_plant'],['Cat painting',40,'art_cat'],['Heart painting',40,'art_heart'],['Waves painting',40,'art_waves'],['Clock',50,'wall_clock_blue','wall_clock_pink']]],
  ['Small things',[['Small plant',35,'plant_small_blush','plant_small_butter','plant_small_sky','plant_small_white'],['Cactus',30,'cactus_terracotta','cactus_blue','cactus_white'],
    ['Treat jar',20,'treat_jar_pink','treat_jar_blue','treat_jar_yellow'],['Book stack',25,'book_stack'],['Ball',15,'toy_ball_pink','toy_ball_blue','toy_ball_green','toy_ball_yellow'],['Toy mouse',15,'toy_mouse_grey','toy_mouse_brown'],
    ['Toy fish',15,'toy_fish_pastel','toy_fish_ocean','toy_fish_leaf'],['Feather wand',15,'toy_feather_wand_pink','toy_feather_wand_teal','toy_feather_wand_yellow'],
    ['Yarn ball',15,'toy_yarn_pink','toy_yarn_blue','toy_yarn_green','toy_yarn_yellow']]],
];
const SHOP_ITEMS=SHOP_FURNITURE.flatMap(([,items])=>items);
// New colours for what every room has, shown first in the Cat stuff aisle: [room item, name, price, colours]; the
// first colour is the one the room comes with.
const SHOP_COLOURS=[
  ['bed','Bed',40,['basket_bed_sage','basket_bed_blue','basket_bed_rose']],
  ['litter','Litter tray',25,['litter_tray_mint','litter_tray_grey','litter_tray_lilac','litter_tray_pink']],
  ['food','Food bowl',20,['bowl_sky_kibble','bowl_blush_kibble','bowl_butter_kibble','bowl_lilac_kibble','bowl_mint_kibble','bowl_white_kibble']],
  ['water','Water bowl',20,['bowl_blush_water','bowl_sky_water','bowl_butter_water','bowl_lilac_water','bowl_mint_water','bowl_white_water']],
];
// Colour dots for each colour name the sprites end in (kibble and water bowls are named by the bowl colour).
const SWATCH={rose:'#d99a9c',sage:'#9cbf8e',blue:'#8fb2d9',grey:'#a9acb3',lavender:'#a99cc6',teal:'#5f9ea0',mint:'#a9dcc6',lilac:'#c4b8e6',white:'#f2f0ea',
  cream:'#efe3cf',oak:'#c9a07a',walnut:'#8a6446',pink:'#e9a0b4',green:'#8cc9a2',yellow:'#ead27a',sky:'#9cc4e4',blush:'#f2c9c9',butter:'#f3e3a6',mauve:'#a98aa6',
  navy:'#3b4466',taupe:'#8a7a72',terracotta:'#c9775a',brown:'#b98a6a',pastel:'#f2b8c6',ocean:'#6f9ac4',leaf:'#9cbf8e',peach:'#f6c9a4'};
const colourOf=sp=>{const p=sp.replace(/_(kibble|water)$/,'').split('_');return p[0]==='bowl'?p[1]:p.pop();};
const COAT_PRICE=100,ROOM_PRICE=150,RENAME_PRICE=40;
let shopTab='furniture',shopAisle=SHOP_FURNITURE[0][0];
// The colour shown on each product card: picked with its colour dots, otherwise the one in use or owned.
const shopPick={};
// "Teepee (rose)", "Feather wand (teal)", "Cardboard box".
function furnitureName(sp){const [label,,...sprites]=SHOP_ITEMS.find(g=>g.includes(sp));return sprites.length<2?label:`${label} (${colourOf(sp)})`;}
const priceTag=(price,owned,status)=>status?`<em class="using">${status}</em>`:owned?'<em>Owned</em>':`<em class="${state.coins<price?'short':''}">${COIN}${price}</em>`;
function shopPanel(){
  const tabs=[['furniture','Furniture'],['look','Room & cat']];
  return `<div class="shop"><div class="shop-head"><span>Your coins</span><b>${COIN}${state.coins}</b></div>
  <div class="shop-tabs" role="tablist">${tabs.map(([k,l])=>`<button role="tab" aria-selected="${shopTab===k}" class="${shopTab===k?'active':''}" data-shop-tab="${k}">${l}</button>`).join('')}</div>
  ${shopTab==='look'?shopLook():shopFurniture()}</div>`;
}
// A product card: the picked colour large, then its colour dots with the picked colour's name and whether it's
// yours, and one button for what to do; a mint frame marks what's in the room.
function shopCard(key,label,sprites,pick,action,{status='',owns=()=>false}={}){
  const note=status==='using'?'In your room':owns(pick)?'Yours':'';
  return `<article class="shop-card${status?' '+status:''}"><canvas data-sprite="${pick}" width="144" height="120"></canvas><b>${label}</b>
    ${sprites.length>1?`<div class="swatches" role="radiogroup" aria-label="${label} colours">${sprites.map(sp=>`<button class="swatch${sp===pick?' on':''}${owns(sp)?' own':''}" style="--c:${SWATCH[colourOf(sp)]||'#ccc'}" data-swatch="${key}" data-colour="${sp}" role="radio" aria-checked="${sp===pick}" title="${cap(colourOf(sp))}" aria-label="${cap(colourOf(sp))}"></button>`).join('')}</div>
    <span class="swatch-name">${cap(colourOf(pick))}${note?` · <i>${note}</i>`:''}</span>`:''}
    ${action}</article>`;
}
function shopFurniture(){
  const placed=new Set(state.decor.extras.map(e=>e.sprite)),own=sp=>state.owned.items.includes(sp);
  const chips=`<div class="shop-aisles">${SHOP_FURNITURE.map(([a])=>`<button class="${shopAisle===a?'active':''}" data-aisle="${a}">${a}</button>`).join('')}</div>`;
  if(!SHOP_FURNITURE.some(([a])=>a===shopAisle))shopAisle=SHOP_FURNITURE[0][0];
  const items=SHOP_FURNITURE.find(([a])=>a===shopAisle)[1];
  return chips+`<div class="shop-grid">${shopAisle==='Cat stuff'?colourCards():''}${items.map(([label,price,...sprites])=>{
      const pick=shopPick[label]||sprites.find(sp=>placed.has(sp))||sprites.find(own)||sprites[0],has=own(pick),here=placed.has(pick);
      const act=here?`<button class="shop-act" data-buy-item="${pick}">Put away</button>`:has?`<button class="shop-act" data-buy-item="${pick}">Place in room</button>`
        :`<button class="shop-act buy${state.coins<price?' short':''}" data-buy-item="${pick}">Buy · ${COIN}${price}</button>`;
      return shopCard(label,label,sprites,pick,act,{status:here?'using':has?'owned':'',owns:own});}).join('')}</div>`;
}
// The bed, bowls and litter tray every room has: buy a colour once, switch any time.
function colourCards(){
  return SHOP_COLOURS.map(([id,label,price,sprites])=>{const cur=state.decor.variants[id]||sprites[0],pick=shopPick['c:'+id]||cur,owns=sp=>sp===sprites[0]||state.owned.items.includes(`${id}:${sp}`);
    const act=pick===cur?'<button class="shop-act" disabled>In use</button>':owns(pick)?`<button class="shop-act" data-recolour="${id}" data-colour="${pick}">Use this colour</button>`
      :`<button class="shop-act buy${state.coins<price?' short':''}" data-recolour="${id}" data-colour="${pick}">Buy · ${COIN}${price}</button>`;
    return shopCard('c:'+id,label,sprites,pick,act,{status:pick===cur?'using':'',owns});}).join('');
}
// Re-draw the open panel in place, keeping where it was scrolled to.
function refreshPanel(){const el=$('.panel'),top=$('.panel-body')?.scrollTop||0;if(!el||!panel)return;el.innerHTML=panelView();bindPanel();paintIcons();const b=$('.panel-body');if(b)b.scrollTop=top;}
// The room's style and the cat's coat and name, together on one tab.
function shopLook(){const c=state.cat;return `
  <section class="p-card"><h3>Room style</h3><p class="muted small">${COIN}${ROOM_PRICE} each. Buy once, switch any time.</p>
    <div class="room-grid shop-rooms">${ROOM_STYLES.map(k=>{const own=state.owned.rooms.includes(k);
      return `<button data-room="${k}" data-buy-room="${k}" class="${state.room===k?'active':''}"><canvas width="112" height="100"></canvas><span>${cap(k.replace('_',' '))}</span>${priceTag(ROOM_PRICE,own,state.room===k&&'In use')}</button>`;}).join('')}</div></section>
  <section class="p-card"><h3>Coat</h3><p class="muted small">${COIN}${COAT_PRICE} each. Buy a coat once, switch any time.</p>
    <div class="coat-grid shop-coats">${CAT_COATS.map(k=>{const own=state.owned.coats.includes(k);
      return `<button data-coat="${k}" data-buy-coat="${k}" class="${c.coat===k?'active':''}" title="${cap(k.replace('_',' '))}"><canvas width="64" height="64"></canvas>${priceTag(COAT_PRICE,own,c.coat===k&&'In use')}</button>`;}).join('')}</div></section>
  <section class="p-card"><h3>Name</h3><p class="muted small">A new name for ${esc(c.name)} costs ${COIN}${RENAME_PRICE}.</p>
    <div class="name-row"><input id="cat-name" maxlength="18" value="${esc(c.name)}" placeholder="Cat name"><button class="secondary" id="rename-cat">Rename</button></div></section>`;}
// The game's own pixel dialog for a yes/no question (with a picture of the item); resolves true on OK.
function ask({title,body,ok,cancel='Cancel',sprite}){return new Promise(done=>{
  showModal(`<h3>${title}</h3>${sprite?`<canvas class="ask-thumb" data-sprite="${sprite}" width="192" height="160"></canvas>`:''}<p>${body}</p>
    <div class="modal-foot"><button class="modal-later" data-no>${cancel}</button>${ok?`<button class="modal-ok" data-yes>${ok}</button>`:''}</div>`,
    sh=>{const end=v=>{closeModal();done(v);};sh.querySelector('[data-no]').onclick=()=>end(false);sh.querySelector('[data-yes]')?.addEventListener('click',()=>end(true));});});}
// Ask before spending; false if there aren't enough coins or the user says no.
async function pay(price,what,sprite){
  if(state.coins<price){await ask({title:'Not enough coins',body:`${cap(what)} costs ${COIN}${price} and you have ${COIN}${state.coins}. Speaking quests earn coins.`,cancel:'OK',sprite});return false;}
  if(!await ask({title:`Buy ${what}?`,body:`You have ${COIN}${state.coins}.`,ok:`Buy · ${COIN}${price}`,sprite}))return false;
  state.coins-=price;return true;
}
// Placing something from the shop: on a laptop the shop stays open beside the room; on a phone it closes so the
// whole room shows while the piece is moved.
function placing(id){arrange.on=true;arrange.sel=id;if(!isWide())panel=null;}
function renderKeepScroll(){const top=$('.panel-body')?.scrollTop||0;render();const b=$('.panel-body');if(b)b.scrollTop=top;}
async function buyFurniture(sp){
  const [,price]=SHOP_ITEMS.find(g=>g.includes(sp)),name=furnitureName(sp),placed=state.decor.extras.find(e=>e.sprite===sp),own=state.owned.items.includes(sp);
  if(placed){if(await ask({title:`Put the ${name.toLowerCase()} away?`,body:'You can bring it back any time for free.',ok:'Put away',sprite:sp})){
    putAway(placed.id);refreshPanel();toast(`${name} put away.`);}return;}
  cancelPending();
  // A window, painting or clock goes on the clearest bit of wall; anything else on the clearest bit of floor.
  const wall=isWallDecor(sp),spot=wall?freeWallSpot(sp):findFreeSpot(sp),id='x'+Date.now().toString(36);
  if(!spot){toast('No room on the walls. Move or put away something there first.');return;}
  const piece=wall?{id,sprite:sp,side:spot[0],along:spot[1],z:spot[2]}:{id,sprite:sp,x:spot[0],y:spot[1]};
  placing(piece.id);
  if(own){state.decor.extras.push(piece);applyRoom(performance.now());save();renderKeepScroll();toast(`${name} is back. Drag it where you like, then tap Done.`);return;}
  // Not bought yet: it goes into the room to be placed (and turned) first; the Buy button is in the arrange bar.
  arrange.pending={...piece,price,name};applyRoom(performance.now());renderKeepScroll();
  toast(`Drag the ${name.toLowerCase()} into place, then tap Buy.`);
}
async function buyPending(){
  const pc=arrange.pending;if(!pc)return;const it=roomItems.find(i=>i.id===pc.id),w=wallItems.find(o=>o.id===pc.id);
  if(w?!wallOk(pc.id,...wallPos(w)):!hostOf(it)&&!placementOk(pc.id,...itemPos(it))){toast('Move it to a clear spot first.');return;}
  if(!await pay(pc.price,`the ${pc.name.toLowerCase()}`,pc.turned?pc.sprite+'_turned':pc.sprite))return;
  const {price,name,...piece}=pc;state.owned.items.push(pc.sprite);state.decor.extras.push(piece);
  arrange.pending=null;arrange.on=false;arrange.sel=null;applyRoom(performance.now());save();renderKeepScroll();cloudSyncSoon();
  toast(`New ${name.toLowerCase()} for ${state.cat.name}!`);
}
// What's in the room under an id: a bought piece, a built-in piece or a wall item, with the name to show.
function roomPiece(id){
  const ex=state.decor.extras.find(e=>e.id===id);if(ex)return {id,name:furnitureName(ex.sprite)};
  const it=roomItems.find(i=>i.id===id)||wallItems.find(w=>w.id===id);return it&&{id,name:it.name,keep:it.keep};
}
// Put a piece away (back to its card in the shop). Whatever stood on it (a plant on a shelf) moves down to the floor.
function putAway(id){
  const host=roomItems.find(i=>i.id===id);
  for(const o of host?carried(host):[]){const spot=findFreeSpot(o.base),ex=state.decor.extras.find(e=>e.id===o.id);
    if(ex){delete state.layout[o.id];[ex.x,ex.y]=spot;}else state.layout[o.id]=spot;}
  const ex=state.decor.extras.find(e=>e.id===id);
  if(ex){state.decor.extras=state.decor.extras.filter(e=>e!==ex);delete state.layout[id];}else if(!state.decor.hidden.includes(id))state.decor.hidden.push(id);
  if(arrange.sel===id)arrange.sel=null;
  applyRoom(performance.now());save();
}
function cancelPending(){const pc=arrange.pending;if(!pc)return;arrange.pending=null;delete state.layout[pc.id];applyRoom(performance.now());}
function endArrange(){cancelPending();arrange.on=false;arrange.sel=null;}
// A quarter turn for the selected armchair, if there's room for it where it stands.
function turnPiece(){
  const id=arrange.sel,pc=arrange.pending?.id===id?arrange.pending:state.decor.extras.find(e=>e.id===id);if(!pc||!canTurn(pc.sprite))return;
  const [x,y]=state.layout[id]||[pc.x,pc.y];
  if(!placementOk(id,x,y,!pc.turned)){toast('No room to turn it here. Move it somewhere clearer first.');return;}
  pc.turned=!pc.turned;applyRoom(performance.now());if(pc!==arrange.pending)save();
}
// Bottom bar in arrange mode: placing a new piece (Turn / Cancel / Buy), moving the picked piece (Turn / Put away
// / Done), or nothing picked (Reset / Done).
function arrangeBar(){
  const pc=arrange.pending,sel=pc?.id===arrange.sel?pc:state.decor.extras.find(e=>e.id===arrange.sel),turn=sel&&canTurn(sel.sprite)?'<button data-turn>↻ Turn</button>':'';
  const picked=!pc&&arrange.sel&&roomPiece(arrange.sel);
  return pc?`<div class="arrange-bar" role="status"><span>Place the ${esc(pc.name.toLowerCase())}</span>${turn}<button data-place-cancel>Cancel</button><button class="done" data-place-buy>Buy · ${COIN}${pc.price}</button></div>`
    :picked?`<div class="arrange-bar" role="status"><span>${esc(picked.name)}</span>${turn}${picked.keep?'':'<button data-put-away>Put away</button>'}<button class="done" data-arrange>Done</button></div>`
    :`<div class="arrange-bar" role="status"><span>Drag things to move them</span><button data-arrange-reset>Reset</button><button class="done" data-arrange>Done</button></div>`;
}
function refreshArrangeBar(){const bar=$('.arrange-bar');if(!bar)return;bar.outerHTML=arrangeBar();bindArrangeBar();}
function bindArrangeBar(){
  document.querySelectorAll('[data-arrange]').forEach(b=>b.onclick=()=>{if(arrange.on)endArrange();else{arrange.on=true;if(panel)setPanel(null);}render();});
  $('[data-turn]')?.addEventListener('click',turnPiece);
  $('[data-place-cancel]')?.addEventListener('click',()=>{endArrange();render();});
  $('[data-place-buy]')?.addEventListener('click',buyPending);
  $('[data-put-away]')?.addEventListener('click',()=>{const p=roomPiece(arrange.sel);if(!p)return;putAway(p.id);refreshArrangeBar();toast(`${p.name} put away. Bring it back from the shop any time.`);});
  // Back to the original spots; bought pieces go to the clearest free spots around them.
  $('[data-arrange-reset]')?.addEventListener('click',()=>{
    state.layout={};const extras=state.decor.extras;state.decor.extras=[];applyRoom();
    for(const e of extras){if(isWallDecor(e.sprite)){const w=freeWallSpot(e.sprite);if(w)[e.side,e.along,e.z]=w;}else [e.x,e.y]=findFreeSpot(e.sprite,e.turned);
      state.decor.extras.push(e);applyRoom();}
    applyRoom(performance.now());save();render();toast('Furniture back in its original spots.');});
}
async function recolour(id,sp){
  const [,label,price,sprites]=SHOP_COLOURS.find(r=>r[0]===id),own=sp===sprites[0]||state.owned.items.includes(`${id}:${sp}`);
  if((state.decor.variants[id]||sprites[0])===sp)return;
  if(!own){if(!await pay(price,`a new colour for the ${label.toLowerCase()}`,sp))return;state.owned.items.push(`${id}:${sp}`);}
  if(sp===sprites[0])delete state.decor.variants[id];else state.decor.variants[id]=sp;
  applyRoom();save();refreshPanel();toast(`${label} changed.`);
}

// ---- Settings ----
function settingsPanel(){return `
  ${accountCard()}
  <section class="p-card"><h3>Transcription</h3>
    <div class="choice">${[['dictate','Keyboard dictation','Talk into the text box with your keyboard’s microphone. Most reliable on iPhone; no replay.'],['browser','Quick','Live text from your browser while you talk. Can miss words, especially around pauses.'],['whisper','High accuracy',`Whisper writes it out on this device after you stop. Catches more words, and keeps the recording for replay. One-time ~${isPhone()?40:79} MB download.`]].map(([k,t,d])=>`<button data-transcriber="${k}" class="${transcriber()===k?'active':''}"><b>${t}</b><small>${d}</small></button>`).join('')}</div>
    ${transcriber()==='whisper'?(state.whisperReady?'<p class="muted small">Speech model downloaded ✓ Works offline.</p>':'<button class="secondary" id="whisper-prep">Download the speech model now</button>'):''}</section>
  ${installCard()}
  ${location.hash==='#debug'?`<section class="p-card"><h3>Test: skip time</h3><div class="settings">${[6,24,72].map(h=>`<button class="secondary" data-skip="${h}">+${h<24?h+' h':h/24+' d'}</button>`).join('')}</div></section>`:''}
  <section class="p-card"><h3>Help &amp; feedback</h3><p class="muted small">Found a bug or have an idea? It really helps.</p><div class="settings"><button class="primary" id="send-feedback">Send feedback</button><button class="secondary" id="replay-tour">Show the tour again</button></div></section>
  <section class="p-card"><h3>Privacy</h3><p class="muted small">Without an account, everything stays on this device. If you sign in, your progress (cat, coins, journal with transcripts and feedback) is stored in your account on Amazon Web Services so you can restore it; recordings never leave this device. High-accuracy transcription runs on this device. Quick transcription uses your browser’s speech service (Chrome sends audio to Google). Your talk only goes to an AI when you ask for feedback: instant feedback sends it to Claude (through your account on AWS, or to Anthropic with your own key). <a href="privacy.html" target="_blank" rel="noopener">Privacy policy</a></p></section>
  <section class="p-card"><h3>Backup</h3><p class="muted small">${signedIn()?'Your progress backs up to your account automatically. A file backup is extra safety.':'Progress lives on this device. Sign in or export a backup regularly.'}${state.lastBackup?` Last backup: ${longDate(ymd(new Date(state.lastBackup)))}.`:' No backup yet.'}</p><div class="settings"><button class="secondary" id="export">↓ Export</button><button class="secondary" id="import">↑ Import</button><button class="danger" id="reset">Reset</button></div></section>
  <section class="p-card about"><h3>About</h3><div class="about-row"><span>Purrsuade</span><b>Version ${APP_VERSION}</b></div><p class="muted small">Released ${longDate(APP_RELEASED)}${APP_VERSION.startsWith('0.')?' · test version (v1.0.0 will be the public launch)':''}</p></section>
`;}
function accountCard(){
  if(!cloudOn())return '';
  if(!signedIn())return `<section class="p-card"><h3>Account</h3><p class="muted small">Sign in to keep your cat and journal safe if this browser is cleared, use them on all your devices, and get ${coachLeft??'a few'} free instant AI feedbacks a day. Free, and the app still works without it.</p>
    <div class="settings">${CLOUD_CONFIG.google?'<button class="primary" data-sign-in="Google">Continue with Google</button>':''}<button class="${CLOUD_CONFIG.google?'secondary':'primary'}" data-sign-in="">Sign in with email</button></div></section>`;
  const at=syncMeta().at,dirty=syncMeta().dirty;
  return `<section class="p-card"><h3>Account</h3><p class="muted small">Signed in as <b>${esc(accountEmail()||'you')}</b>.<br>${dirty?'Changes waiting to sync.':at?`Synced ${new Date(at).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}.`:'Syncing…'}</p>
    <div class="settings"><button class="secondary" id="sync-now">Sync now</button><button class="secondary" id="sign-out">Sign out</button><button class="mini delete-account" id="delete-account">Delete my account</button></div></section>`;
}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}function cap(s){return s[0].toUpperCase()+s.slice(1);}

// Zoom is the room's own: pinch on a phone, the + and - buttons on a laptop. A trackpad pinch (a ctrl + wheel event)
// or a Safari gesture would otherwise zoom the whole page; keyboard zoom (Cmd +/-) still works.
addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault();},{passive:false});
for(const t of ['gesturestart','gesturechange'])addEventListener(t,e=>e.preventDefault());

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
  bindArrangeBar();
  $('.care-menu')?.addEventListener('toggle',e=>{careMenuOpen=e.target.open;});
  $('[data-stats-toggle]')?.addEventListener('click',()=>setStatsOpen(!statsOpen));
  $('[data-level]')?.addEventListener('click',showLevel);
  const room=$('#room-canvas');
  if(room){
    const redrawStill=()=>{}; // the animation loop redraws every frame
    const pet=e=>{if(!state.cat.alive||!catHit(room,e.clientX,e.clientY))return;
      catReaction={type:'pet',started:performance.now()};floatGain('♥','pet');tourEvent('pet');};
    // Arrange mode: presses on furniture drag it instead of panning; the layout is saved on drop.
    const grab=e=>arrange.on?grabItem(room,e,{onMove:redrawStill,onDrop:(layout,id,stuck)=>{state.layout=layout;setRoomLayout(layout,performance.now());save();refreshArrangeBar();
      if(stuck)toast(wallItems.some(w=>w.id===id)?'No room on that wall. Move or put away something there first.':'That spot is taken, so it stayed where it was.');}}):null;
    enableRoomCamera(room,{grab,pinch:matchMedia('(pointer: coarse)').matches,onTap:e=>{if(arrange.on)return;const g=graveAt(room,e.clientX,e.clientY);if(g){showGrave(g);return;}pet(e);},resetButton:$('.cam-reset'),zoomIn:$('[data-zoom="in"]'),zoomOut:$('[data-zoom="out"]'),onChange:redrawStill});
  }
  bindPanel();
}
function bindPanel(){
  const p=$('.panel');if(!p)return;const q=s=>p.querySelector(s),qa=s=>p.querySelectorAll(s);
  qa('[data-panel-tab]').forEach(b=>b.onclick=()=>{panel=null;setPanel(b.dataset.panelTab);});
  q('[data-panel-close]')?.addEventListener('click',()=>setPanel(null));
  qa('[data-step]').forEach(b=>b.onclick=()=>{if(recActive())stopRecording();challenge.step=+b.dataset.step;render();if(challenge.step===2)refreshCoachLeft();});
  qa('[data-hist]').forEach(b=>b.onclick=()=>{histSel=+b.dataset.hist;render();});
  qa('[data-hist-page]').forEach(b=>b.onclick=()=>{histPage+=+b.dataset.histPage;render();});
  q('[data-hist-back]')?.addEventListener('click',()=>{histSel=null;render();});
  q('#spin')?.addEventListener('click',()=>spin(false)); q('#reroll')?.addEventListener('click',()=>spin(true));
  q('#transcript')?.addEventListener('input',e=>{challenge.transcript=e.target.value;saveQuest();}); q('#feedback')?.addEventListener('input',e=>setFeedback(e.target.value)); q('#feedback')?.addEventListener('paste',()=>setTimeout(render,50));
  q('#rec-start')?.addEventListener('click',startSpeaking);q('#rec-now')?.addEventListener('click',beginRecording);q('#rec-cancel')?.addEventListener('click',cancelSpeaking);
  q('#rec-stop')?.addEventListener('click',stopRecording);
  q('#rec-again')?.addEventListener('click',()=>{if(challenge.transcript.trim()&&!confirm('Record again? This replaces the current transcript.'))return;resetRecorder();challenge.transcript='';challenge.spokeSec=0;startSpeaking();});
  qa('[data-ai]').forEach(b=>b.onclick=()=>openAI(b.dataset.ai));
  q('#instant-feedback')?.addEventListener('click',getInstantFeedback);
  q('.manual-coach')?.addEventListener('toggle',e=>{manualOpen=e.target.open;});
  qa('[data-sign-in]').forEach(b=>b.onclick=()=>cloudSignIn(b.dataset.signIn));
  q('#sign-out')?.addEventListener('click',()=>{if(confirm('Sign out? Your progress stays on this device and in your account.'))cloudSignOut();});
  q('#delete-account')?.addEventListener('click',async e=>{
    if(!confirm('Delete your account? This removes your sign-in and the progress saved in your account. Progress on this device stays (use Reset to clear it). This cannot be undone.'))return;
    e.currentTarget.disabled=true;
    try{await cloudDeleteAccount();toast('Account deleted. Your progress is still on this device.');render();}
    catch{e.currentTarget.disabled=false;toast('Couldn’t delete the account right now. Please try again.');}});
  q('#sync-now')?.addEventListener('click',async e=>{e.currentTarget.disabled=true;await cloudPush();await cloudPull(true);toast(syncMeta().dirty?'Couldn’t reach your account. It will retry.':'Progress synced ✓');render();});
  q('#skip-feedback')?.addEventListener('click',()=>{if(confirm('Finish without AI feedback? You still get XP and coins, just a little less.'))completeQuest(true);});
  q('#go-speak')?.addEventListener('click',()=>{challenge.step=1;render();if(rec.phase==='idle'&&!challenge.transcript.trim())startSpeaking();});
  q('#paste-reply')?.addEventListener('click',async()=>{try{const t=await navigator.clipboard.readText();if(!t.trim()){toast('Nothing copied yet. Copy the AI’s answer first.');return;}setFeedback(t);render();toast(SCORE_KEYS.every(k=>challenge.scores[k])?'Answer added · scores filled in':'Answer added');}catch{toast('Paste was blocked. Press and hold the box below and choose Paste.');$('#feedback')?.focus();}});
  qa('[data-score]').forEach(i=>i.oninput=e=>{challenge.scores[e.target.dataset.score]=+e.target.value;saveQuest();const st=$('#score-status');if(st)st.textContent=scoreStatus();});
  qa('[data-self]').forEach(i=>i.oninput=e=>{challenge.self[e.target.dataset.self]=+e.target.value;saveQuest();e.target.previousElementSibling.querySelector('b').textContent=e.target.value+'/10';});
  q('#complete')?.addEventListener('click',()=>completeQuest(false));
  qa('[data-shop-tab]').forEach(b=>b.onclick=()=>{shopTab=b.dataset.shopTab;render();});
  qa('[data-buy-item]').forEach(b=>b.onclick=()=>buyFurniture(b.dataset.buyItem));
  qa('[data-aisle]').forEach(b=>b.onclick=()=>{shopAisle=b.dataset.aisle;refreshPanel();$('.panel-body').scrollTop=0;});
  qa('[data-swatch]').forEach(b=>b.onclick=()=>{shopPick[b.dataset.swatch]=b.dataset.colour;refreshPanel();});
  qa('[data-recolour]').forEach(b=>b.onclick=()=>recolour(b.dataset.recolour,b.dataset.colour));
  qa('[data-buy-room]').forEach(b=>b.onclick=async()=>{const k=b.dataset.buyRoom;if(state.room===k)return;
    if(!state.owned.rooms.includes(k)){if(!await pay(ROOM_PRICE,`the ${cap(k.replace('_',' '))} room`))return;state.owned.rooms.push(k);}state.room=k;persist();});
  qa('[data-buy-coat]').forEach(b=>b.onclick=async()=>{const k=b.dataset.buyCoat;if(state.cat.coat===k)return;
    if(!state.owned.coats.includes(k)){if(!await pay(COAT_PRICE,`the ${cap(k.replace('_',' '))} coat`))return;state.owned.coats.push(k);}state.cat.coat=k;persist();});
  q('#rename-cat')?.addEventListener('click',async()=>{const n=$('#cat-name').value.trim().slice(0,18),old=state.cat.name;
    if(!n){toast('Type a new name first.');return;}if(n===old){toast(`${old} already has that name.`);return;}
    if(!await pay(RENAME_PRICE,`the name “${n}”`))return;state.cat.name=n;persist();toast(`${old} is now ${n}!`);});
  q('#install-app')?.addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice.catch(()=>{});installPrompt=null;render();});
  q('#replay-tour')?.addEventListener('click',()=>startTour());
  q('#send-feedback')?.addEventListener('click',()=>{
    let issue='';try{issue=localStorage.getItem('purrsuade-last-issue')||'';}catch{}
    const info=`\n\n---\nPurrsuade v${APP_VERSION} · ${isPhone()?'phone':'computer'} · transcription: ${transcriber()}${issue?` · last issue: ${issue}`:''} · ${navigator.userAgent}`;
    const url=FEEDBACK_URL.startsWith('mailto:')?`${FEEDBACK_URL}?subject=${encodeURIComponent('Purrsuade feedback')}&body=${encodeURIComponent('What happened / what would you like?'+info)}`
      :FEEDBACK_URL.includes('github.com')?`${FEEDBACK_URL}?title=${encodeURIComponent('Feedback: ')}&body=${encodeURIComponent('What happened / what would you like?'+info)}`:FEEDBACK_URL;
    window.open(url,'_blank','noopener');});
  qa('[data-skip]').forEach(b=>b.onclick=()=>cqSkip(+b.dataset.skip));
  qa('[data-transcriber]').forEach(b=>b.onclick=()=>{state.transcriber=b.dataset.transcriber;persist();});
  q('#whisper-prep')?.addEventListener('click',e=>prepareWhisper(e.currentTarget));
  q('#export')?.addEventListener('click',exportData);q('#import')?.addEventListener('click',()=>$('#import-file').click());
  q('#reset')?.addEventListener('click',()=>{if(confirm(`Reset Purrsuade and your cat?${signedIn()?' This also resets the progress in your account.':''} This cannot be undone unless you exported a backup.`)){localStorage.removeItem(STORE);localStorage.removeItem(QUEST_STORE);state=fresh();save();cloudSyncSoon();applyRoom(performance.now());panel=null;challenge=null;render();}});
}
async function copyPrompt(){if(!challenge.transcript.trim()){rec={phase:'done'};flagField(1,'#transcript','Add your transcript first');return;}const prompt=coachPrompt();try{await navigator.clipboard.writeText(prompt);toast('Copied · paste it into your AI');}catch{promptFallback(prompt);}}
function promptFallback(t,quiet){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();if(!quiet)toast('Coach prompt copied.');}
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
function completeQuest(skipFeedback){if(!challenge.transcript.trim()){rec={phase:'done'};flagField(1,'#transcript','Add your transcript');return;}if(!skipFeedback&&!challenge.scores.overall){flagField(2,'[data-score="overall"]','Add Overall');return;}const lvBefore=level(),topBefore=difficulty(),daily=state.lastDaily!==today();let xp=daily?100:35;xp+=(skipFeedback?10:25+10)+(challenge.feedback.trim()?25:0)+(!challenge.rerolled?15:0)+(challenge.scores.overall>=8?20:0);let coins=daily?60:20;if(challenge.scores.overall>=8)coins+=10;if(daily)state.streak=state.lastDaily===yesterday()?state.streak+1:1;resetRecorder();const {step,daily:_daily,...done}=challenge;if(skipFeedback)done.noFeedback=true;const entry={...done,id:Date.now(),date:today(),isDaily:daily,earnedXP:xp,earnedCoins:coins,duration:state.duration,prep:prep()};state.history.unshift(entry);state.xp+=xp;state.coins+=coins;if(daily)state.lastDaily=today();state.duration=nextDuration();challenge=null;panel=null;catReaction={type:'cheer',started:performance.now()};persist();cloudSyncSoon();showResult(entry,lvBefore,topBefore);}
function care(a){const c=state.cat;if(!c.alive){toast(`${c.name} cannot be cared for in this state.`);return;}const x=CARE_ACTIONS[a];if(!careGain(a)){toast(`${HUD.find(h=>h[1]===x.key)[0]} is already full.`);return;}if(state.coins<x.cost){toast('Not enough coins. Complete a speaking quest.');return;}state.coins-=x.cost;const before=c[x.key];c[x.key]=clamp(c[x.key]+x.gain,0,100);if(a==='food')c.happiness=clamp(c.happiness+5,0,100);if(a==='litter')c.happiness=clamp(c.happiness+4,0,100);if(healthOf(c)>=5)c.zeroSince=null;catReaction={type:a,started:performance.now()};persist();tourEvent('care');toast(x.msg(c.name));floatGain(`+${Math.round(c[x.key]-before)} ${HUD.find(h=>h[1]===x.key)[0]}`,a);}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`purrsuade-backup-${today()}.json`;a.click();URL.revokeObjectURL(url);state.lastBackup=Date.now();save();toast('Backup exported.');}
$('#import-file').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.history||!d.cat)throw new Error();state=hydrate({...fresh(),...d});applyRoom(performance.now());save();cloudSyncSoon();panel=null;challenge=null;render();toast('Backup restored.');}catch{toast('That backup file is not valid.');}};r.readAsText(f);e.target.value='';});

if('serviceWorker' in navigator && location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
// ---- First-run tour: spotlight each control; some steps wait for the user to try it ----
const visible=el=>el&&el.offsetParent!==null&&getComputedStyle(el).visibility!=='hidden';
// The Care button, plus its menu when open (the menu pops up outside the button's own box).
function careArea(){const m=$('.care-menu');if(!m)return null;const rs=[m,m.open&&m.querySelector('.care-menu-list')].filter(Boolean).map(e=>e.getBoundingClientRect()).filter(r=>r.width);
  if(!rs.length)return null;const l=Math.min(...rs.map(r=>r.left)),t=Math.min(...rs.map(r=>r.top)),R=Math.max(...rs.map(r=>r.right)),B=Math.max(...rs.map(r=>r.bottom));return {left:l,top:t,width:R-l,height:B-t};}
const TOUR=[
  {title:'Meet your cat!',body:()=>`This little one lives in your room. Speak every day to earn coins and keep them happy.<label class="tour-name">Name your cat<input id="tour-cat-name" maxlength="18" value="${esc(state.cat.name)}"></label>`,next:'Let’s go'},
  {target:()=>{const cv=$('#room-canvas'),c=cv?._cat;if(!c)return null;const rc=cv.getBoundingClientRect(),k=rc.width/cv.width;return {left:rc.left+c.x*k,top:rc.top+c.y*k,width:c.w*k,height:c.h*k};},
    title:'Say hi',body:()=>`Tap ${esc(state.cat.name)} to pet them.`,wait:'pet'},
  {target:()=>$('.room-hud'),when:()=>!visible($('.needs-toggle')),title:'Needs',body:()=>`Food, water, litter and fun. They drop slowly over time, so check in each day.`},
  {target:()=>$('.needs-toggle'),when:()=>visible($('.needs-toggle')),title:'Needs',body:()=>`Tap <b>Needs</b> to see ${esc(state.cat.name)}’s food, water, litter and fun.`,wait:'needs',
    after:{target:()=>$('.room-hud'),body:()=>`These bars are ${esc(state.cat.name)}’s needs. They drop slowly over time, so check in every day.`}},
  {target:()=>$('.hearts'),title:'Health',body:()=>`Hearts show overall health. Keep the needs up and the hearts stay full.`},
  {target:()=>$('.coins'),title:'Coins',body:()=>`You earn coins by speaking, and spend them on food, toys and treats.`},
  {target:careArea,title:'Look after them',body:()=>`Open <b>Care</b> and give ${esc(state.cat.name)} some water. It’s free!`,wait:'care',
    after:{target:careArea,body:()=>`Nice! Water and litter are free. Food, play and treats cost coins, which you earn by speaking.`}},
  {target:()=>$('.cam-arrange'),title:'Make it yours',body:()=>`Tap here any time to move the furniture around the room. The cart next to it is the shop: furniture, toys, room styles and coats.`},
  {target:()=>$('.hud-menu'),title:'Menu',body:()=>`Your quests, progress, journal and settings live here.`},
  {target:()=>$('.speak-btn'),title:'Your first quest',body:()=>`Ready? Tap <b>Speak</b> to spin a topic and practise for a couple of minutes.`,wait:'quest'},
];
let tour=null;
function startTour(){
  // Start from a clean room: close the panel, any dialog, arrange mode and the Needs / Care dropdowns.
  closeModal();if(panel)setPanel(null);endArrange();careMenuOpen=false;if(statsOpen)setStatsOpen(false);render();
  document.querySelectorAll('.tour-shade,.tour-card').forEach(e=>e.remove());
  const shade=document.createElement('div'),card=document.createElement('div');shade.className='tour-shade';card.className='tour-card';card.setAttribute('role','dialog');
  document.body.append(shade,card);tour={i:-1,shade,card,frame:0};tourGo(1);
  const follow=()=>{if(!tour)return;placeTour();tour.frame=requestAnimationFrame(follow);};follow();
}
function tourGo(dir){
  let i=tour.i+dir;while(TOUR[i]?.when&&!TOUR[i].when())i+=dir;
  if(i>=TOUR.length){endTour(true);return;}
  if(statsOpen&&TOUR[tour.i]?.wait==='needs')setStatsOpen(false);
  if(TOUR[tour.i]?.wait==='care'){careMenuOpen=false;const m=$('.care-menu');if(m)m.open=false;}
  tour.i=i;tour.done=false;drawTourCard();
}
// A waiting step shows "Skip step" until the user does the action; steps with an `after` then explain what opened.
function drawTourCard(){
  const st=TOUR[tour.i],n=TOUR.filter(x=>!x.when||x.when()).length,pos=TOUR.slice(0,tour.i+1).filter(x=>!x.when||x.when()).length,waiting=st.wait&&!tour.done;
  tour.card.className='tour-card'+(waiting?' waiting':'')+(st.target?'':' center');
  tour.card.innerHTML=`<h3>${st.title}${tour.done?' ✓':''}</h3><p>${tour.done&&st.after?st.after.body():st.body()}</p><div class="tour-foot"><span class="tour-dots">${pos} / ${n}</span><button class="tour-skip" data-tour="skip">Skip tour</button>${waiting?'<button class="tour-later" data-tour="next">Skip step</button>':`<button class="tour-next" data-tour="next">${st.next||'Next'}</button>`}</div>`;
  tour.card.querySelector('[data-tour="skip"]').onclick=()=>endTour(false);
  tour.card.querySelector('[data-tour="next"]').onclick=()=>{
    const nm=$('#tour-cat-name');if(nm&&nm.value.trim()){state.cat.name=nm.value.trim().slice(0,18);persist();}
    tourGo(1);};
  placeTour();
}
function placeTour(){
  const st=TOUR[tour.i],el=(tour.done&&st.after?.target?.())||st.target?.(),r=el&&(el.getBoundingClientRect?el.getBoundingClientRect():el),{shade,card}=tour,W=innerWidth,H=innerHeight;
  if(!r||!r.width){shade.style.cssText=`left:${W/2}px;top:${H/2}px;width:0;height:0`;card.dataset.side='';card.style.left=`${Math.max(12,(W-card.offsetWidth)/2)}px`;card.style.top=`${Math.max(12,(H-card.offsetHeight)/2)}px`;return;}
  const p=6;shade.style.cssText=`left:${r.left-p}px;top:${r.top-p}px;width:${r.width+p*2}px;height:${r.height+p*2}px`;
  const cw=card.offsetWidth,ch=card.offsetHeight,below=r.top+r.height/2<H/2,left=Math.min(W-cw-12,Math.max(12,r.left+r.width/2-cw/2));
  card.style.left=`${left}px`;
  card.style.top=`${below?Math.min(H-ch-12,r.top+r.height+p+20):Math.max(12,r.top-p-20-ch)}px`;
  // Arrow on the card's edge pointing at the highlighted control.
  card.dataset.side=below?'below':'above';card.style.setProperty('--ax',`${Math.min(cw-22,Math.max(22,r.left+r.width/2-left))}px`);
}
function tourEvent(name){const st=tour&&TOUR[tour.i];if(!st||st.wait!==name||tour.done)return;
  if(st.after){tour.done=true;setTimeout(()=>tour&&drawTourCard(),150);}else setTimeout(()=>tour&&tourGo(1),name==='quest'?0:700);}
function endTour(finished){
  if(!tour)return;cancelAnimationFrame(tour.frame);tour.shade.remove();tour.card.remove();tour=null;
  state.tourDone=true;save();if(finished)toast(`Have fun with ${state.cat.name}!`);
}
addEventListener('keydown',e=>{if(e.key==='Escape'&&tour)endTour(false);});

render();
// ---- Modals: farewell + adoption, headstone details, danger warning ----
function showModal(html,wire,kind=''){
  closeModal();const sh=document.createElement('div');sh.className=`modal-shade${kind?` ${kind}-shade`:''}`;sh.innerHTML=`<div class="modal${kind?` ${kind}`:''}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(sh);sh.querySelector('[data-close]')?.addEventListener('click',closeModal);wire?.(sh);paintIcons();
}
function closeModal(){document.querySelector('.modal-shade')?.remove();}
const longDate=d=>new Date(d+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
const daysBetween=(a,b)=>Math.max(1,dayDiff(a,b)+1);
// After completing a quest: score, rewards, level progress (and level-ups / new topics), then the whole feedback.
// Big on laptops, full screen on phones.
function showResult(h,lvBefore,topBefore){
  const lv=level(),up=lv>lvBefore,top=difficulty(),kp=h.keyPoints?.length?h.keyPoints:parseKeyPoints(h.feedback),o=+h.scores.overall||0,full=feedbackHtml(h.feedback);
  showModal(`<div class="result-body">
    <div class="result-top"><h3>Quest complete! ✨</h3><p class="modal-sub">${esc(h.topic)}</p></div>
    ${o?`<div class="result-score"><b>${o}</b><span>/10 overall</span></div>`:'<p class="modal-sub">No feedback today, still a great practice.</p>'}
    <div class="result-chips"><span>⭐ +${h.earnedXP} XP</span><span>${COIN}+${h.earnedCoins}</span>${h.isDaily?`<span>🔥 ${state.streak}-day streak</span>`:''}${h.spokeSec?`<span>🎙 ${mmss(h.spokeSec)}</span>`:''}</div>
    ${up?`<p class="result-up">Level up! You’re now <b>Lv ${lv} · ${title()}</b>${top>topBefore?`<br>New topics unlocked: <b>${WHEEL_TIERS[top-1][0]}</b>`:''}</p>`:''}
    <div class="result-level"><span>Lv ${lv} · ${title()}</span><span>${state.xp%500}/500 XP</span></div><div class="bar result-bar"><i style="width:${(state.xp%500)/5}%"></i></div>
    ${o?`<div class="result-scores">${SKILLS.map(s=>`<span>${LABEL[s]}<b>${h.scores[s]||'—'}</b></span>`).join('')}</div>`:''}
    ${kp.length?`<div class="result-kp"><b>Remember next time</b><ul>${kp.map(k=>`<li>${esc(k)}</li>`).join('')}</ul></div>`:''}
    ${full?`<div class="result-feedback"><h4>Full feedback</h4><div class="fb">${full}</div></div>`:''}
    </div><div class="modal-foot result-foot"><button class="modal-ok" data-close>Back to ${esc(state.cat.name)}</button></div>`,null,'result');
}
// The AI's reply as tidy HTML: headings, lists, bold and italics. KEY POINTS and SCORES are shown on their own,
// so they're left out here.
function feedbackHtml(text=''){
  let t=text.replace(/\r/g,'');const cut=t.search(/\n[\s#*]*KEY POINTS:?/i);if(cut>=0)t=t.slice(0,cut);
  const inline=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g,'$1<i>$2</i>').replace(/`([^`]+)`/g,'<code>$1</code>');
  let html='',list=null;const close=()=>{if(list){html+=`</${list}>`;list=null;}};
  for(const raw of t.split('\n')){const l=raw.trim();let m;
    if(!l||/^[-*_]{3,}$/.test(l)){close();continue;}
    if(/^#*\s*\**scores?\**:?\**\s*$/i.test(l)||/clarity\s*[=:]\s*\d.*overall\s*[=:]\s*\d/i.test(l))continue;
    if((m=l.match(/^#{1,6}\s+(.*)$/))){close();html+=`<h5>${inline(m[1].replace(/:\s*$/,''))}</h5>`;continue;}
    if((m=l.match(/^[-•*·]\s+(.*)$/))){if(list!=='ul'){close();html+='<ul>';list='ul';}html+=`<li>${inline(m[1])}</li>`;continue;}
    if((m=l.match(/^\d+[.)]\s+(.*)$/))){if(list!=='ol'){close();html+='<ol>';list='ol';}html+=`<li>${inline(m[1])}</li>`;continue;}
    close();html+=`<p>${inline(l)}</p>`;}
  close();return html;
}
// Tapping the level chip: where you are, what's next, and how XP is earned.
function showLevel(){
  const lv=level(),into=state.xp%500,next=TITLES.find(([n])=>n>lv),d=difficulty();
  showModal(`<h3>Level ${lv} · ${title()}</h3><p class="modal-sub">${state.xp} XP so far</p>
    <div class="result-level"><span>Lv ${lv}</span><span>${into}/500 XP</span><span>Lv ${lv+1}</span></div><div class="bar result-bar"><i style="width:${into/5}%"></i></div>
    <p>${500-into} XP to level ${lv+1}.${next?` At level ${next[0]} you become a <b>${next[1]}</b>.`:''}</p>
    <div class="level-ladder">${TITLES.map(([n,t],i)=>{const upTo=TITLES[i+1]?.[0]-1,cur=lv>=n&&!(TITLES[i+1]&&lv>upTo);
      return `<div class="${cur?'current':lv>=n?'done':''}"><span>Lv ${n}${upTo?(upTo>n?`–${upTo}`:''):'+'}</span><b>${t}</b></div>`;}).join('')}</div>
    <p class="modal-sub">On your topic wheel: ${WHEEL_TIERS.slice(Math.max(0,d-3),d).map(t=>t[0]).join(' · ')}</p>
    <div class="result-kp"><b>How to earn XP</b><ul><li>Daily quest: 100 XP</li><li>Extra practice: 35 XP</li><li>Bonuses for AI feedback, not rerolling, and scoring 8+</li></ul></div>
    <div class="modal-foot"><button class="modal-later" data-see-progress>All progress</button><button class="modal-ok" data-close>Close</button></div>`,
    sh=>sh.querySelector('[data-see-progress]').onclick=()=>{closeModal();setPanel('progress');});
}
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
        state.cat={...fresh().cat,name,coat,born:today(),lastUpdated:Date.now()};if(!state.owned.coats.includes(coat))state.owned.coats.push(coat);resetCatPlan();closeModal();catReaction={type:'cheer',started:performance.now()};persist();toast(`Welcome home, ${name}!`);};
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
  if(sessions().length<3||signedIn())return;
  const last=Math.max(state.lastBackup||0,state.backupSnooze||0);if(Date.now()-last<14*DAY)return;
  showModal(`<h3>Back up your progress</h3><p>Your cat, coins and journal live only in this browser. A backup file lets you restore them if this browser’s data is ever cleared, or move to a new phone.</p>
    <div class="modal-foot"><button class="modal-later" data-close>Later</button><button class="modal-ok" data-backup-now>Back up now</button></div>`,
    sh=>{sh.querySelector('[data-close]').addEventListener('click',()=>{state.backupSnooze=Date.now()-7*DAY;save();});sh.querySelector('[data-backup-now]').onclick=()=>{exportData();closeModal();};});
}
// Test helper: skip time ahead to see needs drop. In the console: cqSkip(24); or open the app with #debug.
window.cqSkip=hours=>{state.cat.lastUpdated-=hours*3600000;if(state.cat.zeroSince)state.cat.zeroSince-=hours*3600000;state=decayCat(state);save();setRoomGraves(state.graves);render();if(!state.cat.alive)showFarewell();};

if(!state.tourDone&&!state.history.length)roomAssetsReady.then(()=>setTimeout(startTour,600),()=>{});
else roomAssetsReady.then(()=>setTimeout(dangerCheck,700),()=>{});
// Did writing out the words crash this browser last time? Then use keyboard dictation on this device.
// Did writing out the words crash last time? Closed in the background = iOS tidying up, not a crash.
// First real crash: a heads-up; second: switch this device to keyboard dictation.
{const m=readWhisperMark();if(m){markWhisper(null);
  if(m.visible){noteWhisperIssue(`app closed while ${m.stage}`);state.whisperCrashes=(state.whisperCrashes||0)+1;
    const second=state.whisperCrashes>=2;if(second)state.transcriber='dictate';save();
    setTimeout(()=>showModal(second?`<h3>Switched to dictation</h3><p>The app closed again while writing out your words. This phone seems short on memory for it.</p><p>From now on you’ll talk into the text box with your keyboard’s <b>microphone</b> (Apple’s / Google’s own dictation, very reliable). You can change this in Settings → Transcription.</p><div class="modal-foot"><button class="modal-ok" data-close>Got it</button></div>`
      :`<h3>The app closed</h3><p>It closed while writing out your words, maybe from running low on memory. Anything already written out is kept in your quest.</p><p>If it happens again, the app will switch to keyboard dictation for you.</p><div class="modal-foot"><button class="modal-ok" data-close>OK</button></div>`),900);}}}
cloudBoot();
