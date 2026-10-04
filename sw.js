const CACHE='communication-quest-week1-v24';
const ASSETS=['./','./index.html','./styles.css','./room-art.js','./assets/cat-game-atlas.js','./assets/cat-game-atlas.png','./assets/fonts/jersey10-latin.woff2','./app.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('communication-quest-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// Network first so updates show up on the next load; the cache is the offline fallback.
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(res=>{
    if(res.ok&&new URL(e.request.url).origin===location.origin){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
    return res;
  }).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
