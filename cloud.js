// ---- Cloud (optional): sign in, back up / sync progress, and instant AI feedback ----
// The Purrsuade backend on AWS (see cloud/README.md). With these empty the app works as before, fully on this device,
// and feedback is through the user's own AI app only.
const CLOUD_CONFIG={
  api:'https://b656y245il3odhhf4l3fntwneu0emqws.lambda-url.ap-southeast-2.on.aws/',
  authDomain:'https://ap-southeast-2k4xfr0rzy.auth.ap-southeast-2.amazoncognito.com',
  clientId:'4o27mfs0rl36t8lhjkomsr593j',
  google:true,
};
const cloudOn=()=>!!(CLOUD_CONFIG.api&&CLOUD_CONFIG.authDomain&&CLOUD_CONFIG.clientId);
const AUTH_KEY='purrsuade-auth',PKCE_KEY='purrsuade-pkce',SYNC_KEY='purrsuade-sync';
// Earlier versions could keep the user's own Anthropic API key on the device; that option is gone, so forget any.
try{localStorage.removeItem('purrsuade-anthropic-key');}catch{}
// Settings that belong to this device (speech model, crash guard…) stay out of the synced copy.
const DEVICE_KEYS=['transcriber','whisperReady','whisperCrashes','backupSnooze','lastBackup'];
const readJSON=k=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}};
const writeJSON=(k,v)=>{try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v));}catch{}};

// ---- Sign in: Cognito's sign-in page with the authorization code + PKCE flow (no secrets in the app) ----
const appUrl=()=>location.origin+location.pathname;
const b64url=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const jwtClaims=t=>{try{return JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}catch{return {};}};
async function cloudSignIn(provider){
  const verifier=b64url(crypto.getRandomValues(new Uint8Array(32))),nonce=b64url(crypto.getRandomValues(new Uint8Array(16)));
  const challenge=b64url(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
  writeJSON(PKCE_KEY,{verifier,nonce,panel});
  const q=new URLSearchParams({response_type:'code',client_id:CLOUD_CONFIG.clientId,redirect_uri:appUrl(),scope:'openid email profile',state:nonce,code_challenge:challenge,code_challenge_method:'S256'});
  if(provider)q.set('identity_provider',provider);
  location.href=`${CLOUD_CONFIG.authDomain}/oauth2/authorize?${q}`;
}
async function tokenRequest(params){
  const r=await fetch(`${CLOUD_CONFIG.authDomain}/oauth2/token`,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:CLOUD_CONFIG.clientId,...params})});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(d.error||'token'),{status:r.status});return d;
}
function keepTokens(d,old={}){const t={access:d.access_token,id:d.id_token||old.id,refresh:d.refresh_token||old.refresh,exp:Date.now()+(d.expires_in||3600)*1000};writeJSON(AUTH_KEY,t);return t;}
// Back from the sign-in page with ?code=…: swap it for tokens and tidy the address bar.
async function cloudFinishSignIn(){
  const q=new URLSearchParams(location.search),code=q.get('code'),pk=readJSON(PKCE_KEY);
  if(!code&&!q.get('error'))return null;
  history.replaceState(null,'',appUrl()+location.hash);writeJSON(PKCE_KEY,null);
  if(!code||!pk||q.get('state')!==pk.nonce)return null;
  try{keepTokens(await tokenRequest({grant_type:'authorization_code',code,redirect_uri:appUrl(),code_verifier:pk.verifier}));return pk;}
  catch{toast('Sign-in didn’t finish. Please try again.');return null;}
}
const signedIn=()=>cloudOn()&&!!readJSON(AUTH_KEY)?.refresh;
const accountEmail=()=>jwtClaims(readJSON(AUTH_KEY)?.id||'').email||'';
let refreshing=null;
async function accessToken(force){
  const t=readJSON(AUTH_KEY);if(!t?.refresh)return null;
  if(!force&&t.access&&t.exp>Date.now()+60000)return t.access;
  refreshing??=tokenRequest({grant_type:'refresh_token',refresh_token:t.refresh}).then(d=>keepTokens(d,t).access)
    .catch(e=>{if(e.status===400){writeJSON(AUTH_KEY,null);writeJSON(SYNC_KEY,null);toast('Signed out · please sign in again.');render();}return null;})
    .finally(()=>{refreshing=null;});
  return refreshing;
}
// Removes the sign-in and the cloud copy; the progress on this device is left alone.
async function cloudDeleteAccount(){
  await api('/account',{method:'DELETE'});
  writeJSON(AUTH_KEY,null);writeJSON(SYNC_KEY,null);coachLeft=null;
}
function cloudSignOut(){
  writeJSON(AUTH_KEY,null);writeJSON(SYNC_KEY,null);
  location.href=`${CLOUD_CONFIG.authDomain}/logout?${new URLSearchParams({client_id:CLOUD_CONFIG.clientId,logout_uri:appUrl()})}`;
}
async function api(path,opts={},retried){
  const tok=await accessToken();if(!tok)throw Object.assign(new Error('signed-out'),{status:401});
  const r=await fetch(CLOUD_CONFIG.api.replace(/\/$/,'')+path,{...opts,headers:{authorization:`Bearer ${tok}`,'content-type':'application/json'}});
  if(r.status===401&&!retried){await accessToken(true);return api(path,opts,true);}
  const d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(d.error||'api'),{status:r.status,data:d});return d;
}

// ---- Sync: the whole progress file, last saved copy wins unless both devices made sessions the other lacks ----
// SYNC_KEY holds {etag, dirty, at}: the cloud copy this device last matched, and whether it has unsent changes.
const syncMeta=()=>readJSON(SYNC_KEY)||{};
const setSync=p=>writeJSON(SYNC_KEY,{...syncMeta(),...p});
function cloudCopy(){const c={...state};for(const k of DEVICE_KEYS)delete c[k];return c;}
let pushTimer=null,pushing=false,lastPull=0;
// Called from save(): note the change and send it a little later, so a burst of taps is one upload.
function cloudChanged(){if(!signedIn())return;if(!syncMeta().dirty)setSync({dirty:true});if(!pushTimer)pushTimer=setTimeout(cloudPush,20000);}
function cloudSyncSoon(){if(!signedIn())return;clearTimeout(pushTimer);pushTimer=setTimeout(cloudPush,800);}
async function cloudPush(){
  clearTimeout(pushTimer);pushTimer=null;
  if(!signedIn()||pushing||!navigator.onLine)return;pushing=true;
  try{const {etag}=await api('/progress',{method:'PUT',body:JSON.stringify({state:cloudCopy(),etag:syncMeta().etag||null})});setSync({etag,dirty:false,at:Date.now()});}
  catch(e){if(e.status===409)await cloudPull(true);}
  finally{pushing=false;}
}
async function cloudPull(force){
  if(!signedIn()||!navigator.onLine||(!force&&Date.now()-lastPull<30000))return;lastPull=Date.now();
  const meta=syncMeta();let d;
  try{d=await api(`/progress${meta.etag&&!force?`?etag=${encodeURIComponent(meta.etag)}`:''}`);}
  catch{return;}
  if(d.none){setSync({etag:null});if(hasProgress(state))cloudPush();return;}
  if(d.unchanged){if(meta.dirty)cloudPush();else setSync({at:Date.now()});return;}
  if(!meta.dirty||!hasProgress(state))return adoptCloud(d.state,d.etag);
  resolveSync(d.state,d.etag);
}
const hasProgress=s=>!!(s.history?.length||s.xp);
function adoptCloud(remote,etag){
  const mine={};for(const k of DEVICE_KEYS)if(k in state)mine[k]=state[k];
  state=hydrate({...fresh(),...remote,...mine});localStorage.setItem(STORE,JSON.stringify(state));
  setSync({etag,dirty:false,at:Date.now()});applyRoom(performance.now());render();
}
// Both copies changed. If one simply contains the other, keep the fuller one; otherwise ask.
function resolveSync(remote,etag){
  const ids=s=>new Set((s.history||[]).map(h=>h.id)),mine=ids(state),theirs=ids(remote);
  const inside=(a,b)=>[...a].every(x=>b.has(x));
  if(inside(mine,theirs)&&(remote.xp||0)>=(state.xp||0))return adoptCloud(remote,etag);
  if(inside(theirs,mine)&&(state.xp||0)>=(remote.xp||0)){setSync({etag});return cloudPush();}
  const sum=s=>`Level ${Math.floor((s.xp||0)/500)+1} · ${(s.history||[]).filter(h=>!h.incomplete).length} sessions · ${esc(s.cat?.name||'')}`;
  showModal(`<h3>Which progress should we keep?</h3><p>This device and your account both have progress the other doesn’t. Pick one to keep on all your devices.</p>
    <div class="sync-pick"><button class="secondary" data-keep="device"><b>This device</b><small>${sum(state)}</small></button><button class="secondary" data-keep="cloud"><b>Your account</b><small>${sum(remote)}</small></button></div>
    <p class="muted small">Not sure? Export a backup from Settings first.</p>`,sh=>{
      sh.querySelector('[data-keep="device"]').onclick=()=>{closeModal();setSync({etag});cloudPush();toast('Kept this device’s progress.');};
      sh.querySelector('[data-keep="cloud"]').onclick=()=>{closeModal();adoptCloud(remote,etag);toast('Loaded your account’s progress.');};});
}
async function cloudBoot(){
  if(!cloudOn())return;
  const back=await cloudFinishSignIn();
  if(back){toast(`Signed in${accountEmail()?` as ${accountEmail()}`:''} · progress backs up automatically`);if(back.panel&&back.panel!==panel)setPanel(back.panel);else render();}
  if(signedIn())cloudPull(true);
}
document.addEventListener('visibilitychange',()=>{if(!signedIn())return;if(document.hidden){if(syncMeta().dirty)cloudPush();}else cloudPull();});
addEventListener('online',()=>{if(signedIn()&&syncMeta().dirty)cloudPush();});

// ---- Instant AI feedback: through your account (a few free a day) ----
// 'account' (signed in) or '' (copy-paste with your own AI app only).
const instantMode=()=>signedIn()?'account':'';
let coachLeft=null;
async function refreshCoachLeft(){if(!signedIn())return;try{const d=await api('/usage');if(d.remaining!==coachLeft){coachLeft=d.remaining;if(panel==='quest')render();}}catch{}}
async function instantFeedback(){
  const talk={topic:challenge.topic,transcript:challenge.transcript,spokeSec:challenge.spokeSec||0,targetMin:state.duration};
  const d=await api('/coach',{method:'POST',body:JSON.stringify(talk)});coachLeft=d.remaining;return d.text;
}
// Plain-language reasons for the toast when instant feedback fails.
function instantError(e){
  if(e.status===429)return e.data?.error==='busy'?'Instant feedback is very busy today. Use your AI app below for now.':`That’s today’s ${e.data?.limit||''} free instant feedbacks. Use your AI app below.`;
  if(e.status===401)return 'Please sign in again.';
  if(!navigator.onLine)return 'You’re offline. Instant feedback needs the internet.';
  return 'Couldn’t get feedback right now. Try again, or use your AI app below.';
}
