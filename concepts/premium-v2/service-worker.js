/* FOTOPOLIS Studio PWA — network-first for always-current installed versions. */
const CACHE='fotopolis-studio-2026-11-08-v4';
const SHELL=[
  '/', '/offline.html', '/manifest.webmanifest',
  '/pwa-update.js', '/favicon.ico',
  '/styles.css', '/studio-polish.css', '/reference-v4.css', '/studio-v5.css',
  '/home-premium-refinement.css', '/assets/design-gallery.css',
  '/site.js', '/reference-v4.js', '/studio-v5.js',
  '/assets/fotopolis-logo-original.png',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon-180.png'
];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(SHELL.map(path=>new Request(path,{cache:'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys()){
      if(key.startsWith('fotopolis-')&&key!==CACHE)await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/admin/'))return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(request,{cache:'no-cache'});
      if(response.ok&&response.type==='basic'){
        const cache=await caches.open(CACHE);
        await cache.put(request,response.clone());
      }
      return response;
    }catch(error){
      const cached=await caches.match(request);
      if(cached)return cached;
      if(request.mode==='navigate'){
        const offline=await caches.match('/offline.html');
        if(offline)return offline;
      }
      throw error;
    }
  })());
});
