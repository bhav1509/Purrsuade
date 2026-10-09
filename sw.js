const CACHE='communication-quest-week1-v51';
const ASSETS=['./','./index.html','./styles.css','./room-art.js','./assets/cat-game-atlas.js','./assets/cat-game-atlas.png','./assets/fonts/jersey10-latin.woff2','./app.js','./whisper-worker.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./icons/favicon-32.png','./icons/paw.svg','./icons/icon-maskable-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('communication-quest-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// Network first so updates show up on the next load; the cache is the offline fallback.
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  // The Whisper library (jsDelivr) is versioned, so cache-first keeps it working offline.
  if(url.origin==='https://cdn.jsdelivr.net'){e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return res;})));return;}
  // Model files and anything else off-site: leave to the browser (the model library caches its own downloads).
  if(url.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(res=>{
    if(res.ok&&new URL(e.request.url).origin===location.origin){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
    return res;
  }).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
