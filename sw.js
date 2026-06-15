var CACHE='l7ssab-v22';
var ASSETS=[
'./','./index.html','./app.html','./manifest.json',
'./css/styles.css',
'./js/config.js','./js/arabicfont.js','./js/arabicreshaper.js','./js/login.js','./js/app.js','./js/profile.js','./js/database.js','./js/statistics.js','./js/backup.js','./js/users.js','./js/adminprojects.js',
'./pages/profile.html','./pages/database.html','./pages/statistics.html','./pages/backup.html','./pages/users.html','./pages/projects.html',
'./assets/icon-192.png','./assets/icon-512.png'
];
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS).catch(function(){});}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){if(k!==CACHE)return caches.delete(k);}));}));self.clients.claim();});
self.addEventListener('message',function(e){if(e.data==='skipWaiting')self.skipWaiting();});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var url=e.request.url;
  if(url.indexOf('openfoodfacts.org')>=0||url.indexOf('supabase.co')>=0||url.indexOf('cdn.jsdelivr')>=0||url.indexOf('cdnjs')>=0){
    e.respondWith(fetch(e.request).catch(function(){return new Response('{"status":0}',{headers:{'Content-Type':'application/json'}});}));return;
  }
  if(/\.(html|js|css)$/.test(url)||url.endsWith('/')){
    e.respondWith(fetch(e.request).then(function(net){var copy=net.clone();caches.open(CACHE).then(function(c){try{c.put(e.request,copy);}catch(_){}});return net;}).catch(function(){return caches.match(e.request).then(function(r){return r||caches.match('./index.html');});}));
    return;
  }
  e.respondWith(caches.match(e.request).then(function(resp){return resp||fetch(e.request).then(function(net){var copy=net.clone();caches.open(CACHE).then(function(c){try{c.put(e.request,copy);}catch(_){}});return net;});}));
});
