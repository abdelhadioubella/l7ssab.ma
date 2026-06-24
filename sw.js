var CACHE='l7ssab-v90';
var ASSETS=['./','./index.html','./app.js','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS).catch(function(){});}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){if(k!==CACHE)return caches.delete(k);}));}));self.clients.claim();});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var url=e.request.url;
  if(url.indexOf('openfoodfacts.org')>=0||url.indexOf('supabase.co')>=0||url.indexOf('mymemory.translated.net')>=0||url.indexOf('cdn.jsdelivr')>=0||url.indexOf('cdnjs')>=0){
    e.respondWith(fetch(e.request).catch(function(){return new Response('{"status":0}',{headers:{'Content-Type':'application/json'}});}));return;
  }
  if(/\.(html|js|css)$/.test(url)||url.endsWith('/')){
    e.respondWith(fetch(e.request).then(function(net){var copy=net.clone();caches.open(CACHE).then(function(c){try{c.put(e.request,copy);}catch(_){}});return net;}).catch(function(){return caches.match(e.request).then(function(r){return r||caches.match('./index.html');});}));return;
  }
  e.respondWith(caches.match(e.request).then(function(resp){return resp||fetch(e.request);}));
});
