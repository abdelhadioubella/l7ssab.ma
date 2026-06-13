var CACHE='l7ssab-v11';
var ASSETS=[
'./','./index.html','./manifest.json',
'./css/styles.css',
'./js/config.js','./js/arabicfont.js','./js/login.js','./js/inventory.js','./js/products.js','./js/adjustments.js','./js/recap.js','./js/profile.js','./js/database.js','./js/statistics.js','./js/backup.js','./js/users.js','./js/adminprojects.js',
'./pages/inventory.html','./pages/products.html','./pages/adjustments.html','./pages/recap.html','./pages/profile.html','./pages/database.html','./pages/statistics.html','./pages/backup.html','./pages/users.html','./pages/projects.html',
'./assets/icon-192.png','./assets/icon-512.png'
];
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS).catch(function(){});}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){if(k!==CACHE)return caches.delete(k);}));}));self.clients.claim();});
self.addEventListener('fetch',function(e){if(e.request.method!=='GET')return;if(e.request.url.indexOf('openfoodfacts.org')>=0||e.request.url.indexOf('supabase.co')>=0){e.respondWith(fetch(e.request).catch(function(){return new Response('{"status":0}',{headers:{'Content-Type':'application/json'}});}));return;}e.respondWith(caches.match(e.request).then(function(resp){return resp||fetch(e.request).then(function(net){return caches.open(CACHE).then(function(c){try{c.put(e.request,net.clone());}catch(_){}return net;});}).catch(function(){return caches.match('./index.html');});}));});
