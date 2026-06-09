// L7ssab.ma service worker — enables installation + offline use
var CACHE='l7ssab-v1';
var ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS).catch(function(){});}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){if(k!==CACHE)return caches.delete(k);}));
  }));
  self.clients.claim();
});

self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  // network-first for the Open Food Facts API, cache-first for app files
  if(e.request.url.indexOf('openfoodfacts.org')>=0){
    e.respondWith(fetch(e.request).catch(function(){return new Response('{"status":0}',{headers:{'Content-Type':'application/json'}});}));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(resp){
      return resp||fetch(e.request).then(function(net){
        return caches.open(CACHE).then(function(c){try{c.put(e.request,net.clone());}catch(_){}return net;});
      }).catch(function(){return caches.match('./index.html');});
    })
  );
});
