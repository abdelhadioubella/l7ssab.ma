// ====== L7ssab.ma — SHARED CONFIG (loaded by every page) ======
// Supabase
var SUPABASE_URL='https://yvpyrmreurcksdqqyvqy.supabase.co';
var SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cHlybXJldXJja3NkcXF5dnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjk0MTcsImV4cCI6MjA5Njc0NTQxN30.EwyuLfQG3g8oUV90pVFdRz5nR0GY4yeS-JUiO5Oo-14';
var sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

// DOM helpers
var G=function(id){return document.getElementById(id);};
function setText(id,v){var e=G(id);if(e)e.textContent=v;}
function show(id){var e=G(id);if(e)e.classList.remove('hidden');}
function hide(id){var e=G(id);if(e)e.classList.add('hidden');}
function showToast(msg,ms){ms=ms||2500;var el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.appendChild(el);setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},ms);}
function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
function fmt(n){return (parseFloat(n)||0).toFixed(2)+' DH';}
var LS={get:function(k,d){try{var v=localStorage.getItem('l7_'+k);return v!=null?JSON.parse(v):d;}catch(e){return d;}},set:function(k,v){try{localStorage.setItem('l7_'+k,JSON.stringify(v));}catch(e){}},del:function(k){try{localStorage.removeItem('l7_'+k);}catch(e){}}};

// PIN hashing (SHA-256 + salt) — must match the SQL
function hashPIN(pin){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(pin+'l7ssab_salt')).then(function(buf){var arr=Array.prototype.slice.call(new Uint8Array(buf));return arr.map(function(b){return ('0'+b.toString(16)).slice(-2);}).join('');});}

// ====== SESSION (keeps you logged in across refreshes / pages) ======
// stores only identity (id, username, fullname, role, color) — NEVER the PIN
function setSession(u){LS.set('session',{id:u.id,username:u.username,fullname:u.fullname,role:u.role,color:u.color,ts:Date.now()});}
function getSession(){return LS.get('session',null);}
function clearSession(){LS.del('session');}
function requireUser(){var s=getSession();if(!s){location.href='index.html';return null;}if(s.role==='admin'){location.href='admin.html';return null;}return s;}
function requireAdmin(){var s=getSession();if(!s){location.href='index.html';return null;}if(s.role!=='admin'){location.href='app.html';return null;}return s;}
function logout(){clearSession();location.href='index.html';}

// ====== DATA LAYER (Supabase) ======
function dbGetUserByUsername(u){return sb.from('app_users').select('*').ilike('username',u).limit(1).then(function(r){return r.error?null:((r.data&&r.data[0])||null);});}
function dbGetUserById(id){return sb.from('app_users').select('*').eq('id',id).limit(1).then(function(r){return r.error?null:((r.data&&r.data[0])||null);});}
function dbGetUsers(){return sb.from('app_users').select('*').order('created_at',{ascending:true}).then(function(r){return r.error?[]:(r.data||[]);});}
function dbGetProducts(){return sb.from('products').select('*').order('name',{ascending:true}).then(function(r){return r.error?[]:(r.data||[]);});}
function dbGetProjects(uid){return sb.from('projects').select('*').eq('user_id',uid).order('updated_at',{ascending:false}).then(function(r){return r.error?[]:(r.data||[]);});}
function dbGetItems(pid){return sb.from('project_items').select('*').eq('project_id',pid).order('created_at',{ascending:true}).then(function(r){return r.error?[]:(r.data||[]);});}
function dbGetAdjs(pid){return sb.from('adjustments').select('*').eq('project_id',pid).order('created_at',{ascending:true}).then(function(r){return r.error?[]:(r.data||[]);});}
function dbGetCustomPrice(uid,bc){return sb.from('custom_prices').select('*').eq('user_id',uid).eq('barcode',bc).limit(1).then(function(r){return (r.data&&r.data[0])||null;});}

// ====== SHARED UI bits ======
function toggleFS(){var d=document,el=d.documentElement;var isFs=d.fullscreenElement||d.webkitFullscreenElement;if(!isFs){var rq=el.requestFullscreen||el.webkitRequestFullscreen;if(rq)rq.call(el);}else{var ex=d.exitFullscreen||d.webkitExitFullscreen;if(ex)ex.call(d);}}

// PWA registration (shared)
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}
var _deferredPrompt=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();_deferredPrompt=e;var bs=document.querySelectorAll('.install-btn');for(var i=0;i<bs.length;i++)bs[i].classList.remove('hidden');});
function doInstall(){if(_deferredPrompt){_deferredPrompt.prompt();_deferredPrompt.userChoice.then(function(){_deferredPrompt=null;});}else{showToast('Menu ⋮ → Installer l\'application',4000);}}
