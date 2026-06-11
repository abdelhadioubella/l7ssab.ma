// ====== L7ssab.ma — SHARED CONFIG (loaded by every page) ======
// Supabase
var SUPABASE_URL='https://yvpyrmreurcksdqqyvqy.supabase.co';
var SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cHlybXJldXJja3NkcXF5dnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjk0MTcsImV4cCI6MjA5Njc0NTQxN30.EwyuLfQG3g8oUV90pVFdRz5nR0GY4yeS-JUiO5Oo-14';
var sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

// ====== PATH HELPER (root vs /pages/) ======
function inPages(){return location.pathname.indexOf('/pages/')>=0;}
function pageUrl(name){ // name like 'inventory' or 'index'
  if(name==='index')return inPages()?'../index.html':'index.html';
  return inPages()?name+'.html':'pages/'+name+'.html';
}


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
function requireUser(){var s=getSession();if(!s){location.href=pageUrl('index');return null;}if(s.role==='admin'){location.href=pageUrl('database');return null;}return s;}
function requireAdmin(){var s=getSession();if(!s){location.href=pageUrl('index');return null;}if(s.role!=='admin'){location.href=pageUrl('inventory');return null;}return s;}
function logout(){clearSession();location.href=pageUrl('index');}

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
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register(inPages()?'../sw.js':'sw.js').catch(function(){});});}
var _deferredPrompt=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();_deferredPrompt=e;var bs=document.querySelectorAll('.install-btn');for(var i=0;i<bs.length;i++)bs[i].classList.remove('hidden');});
function doInstall(){if(_deferredPrompt){_deferredPrompt.prompt();_deferredPrompt.userChoice.then(function(){_deferredPrompt=null;});}else{showToast('Menu ⋮ → Installer l\'application',4000);}}

// ====== THEME (light / night) ======
function applyTheme(){var th=LS.get('theme','light');if(th==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');var b=document.querySelectorAll('.theme-btn');for(var i=0;i<b.length;i++)b[i].textContent=(th==='dark')?'☀️':'🌙';}
function toggleTheme(){var th=LS.get('theme','light');LS.set('theme',th==='dark'?'light':'dark');applyTheme();}
applyTheme();

// ====== CURRENT PROJECT (shared across the separate pages) ======
function setCurrentProject(p){LS.set('cproj',{id:p.id,name:p.name});}
function getCurrentProject(){return LS.get('cproj',null);}
function clearCurrentProject(){LS.del('cproj');}
function requireProject(){var p=getCurrentProject();if(!p){location.href=pageUrl('inventory');return null;}return p;}

// ====== SHARED HEADER ======
// opts: {title, role:'user'|'admin', activeTab, lang:true/false, showLang}
function buildHeader(opts){
  opts=opts||{};
  var s=getSession();var initial=s?(s.fullname||s.username)[0].toUpperCase():'?';
  var roleLabel=s&&s.role==='admin'?'Administrator':'Utilisateur';
  var langBtn=opts.showLang?'<button class="hdr-btn" onclick="toggleLang&&toggleLang()" id="lang-app-btn">🇫🇷</button>':'';
  var html=''+
  '<div class="hdr">'+
    '<span class="hdr-title" id="hdr-title">'+esc(opts.title||'L7ssab.ma')+'</span>'+
    '<div class="hdr-right">'+
      '<button class="hdr-btn" onclick="location.reload()" title="Rafraîchir">↻</button>'+
      '<button class="hdr-btn theme-btn" onclick="toggleTheme()" title="Mode nuit">🌙</button>'+
      '<button class="hdr-btn" onclick="toggleFS()" title="Plein écran">⛶</button>'+
      langBtn+
      '<div class="hdr-av" id="hdr-av" onclick="toggleAvMenu()">'+initial+'</div>'+
      '<div class="av-menu" id="av-menu">'+
        '<div class="av-head"><div class="n">'+esc(s?(s.fullname||s.username):'—')+'</div><div class="r">'+roleLabel+'</div></div>'+
        (opts.role==='admin'?'':'<button onclick="location.href=\'profile.html\'">👤 Mon profil</button>')+
        (opts.role==='admin'?'<button onclick="location.href=\'profile.html\'">👤 My profile</button>':'')+
        '<button onclick="doInstall()" class="install-btn hidden" style="color:#1a7a4a">📲 Installer</button>'+
        '<button onclick="logout()">🚪 '+(opts.role==='admin'?'Logout':'Déconnexion')+'</button>'+
      '</div>'+
    '</div>'+
  '</div>';
  if(opts.role==='admin'){
    html+='<div class="tabbar">'+
      '<button class="'+(opts.activeTab==='database'?'active':'')+'" onclick="location.href=\'database.html\'">🗄️ Database</button>'+
      '<button class="'+(opts.activeTab==='users'?'active':'')+'" onclick="location.href=\'users.html\'">👥 Users</button>'+
      '<button class="'+(opts.activeTab==='projects'?'active':'')+'" onclick="location.href=\'projects.html\'">📁 Projects</button>'+
    '</div>';
  }
  var holder=G('app-header');if(holder)holder.innerHTML=html;
  applyTheme();
}
function toggleAvMenu(){var m=G('av-menu');if(m)m.classList.toggle('show');}
document.addEventListener('click',function(e){var m=G('av-menu');if(m&&m.classList.contains('show')){if(!e.target.closest('#av-menu')&&!e.target.closest('#hdr-av'))m.classList.remove('show');}});

// ====== SHARED PDF (used by user recap + admin projects) ======
function generatePDF(project,items,adjs,authorName){
  var jsPDFLib=(window.jspdf&&window.jspdf.jsPDF)?window.jspdf.jsPDF:(window.jsPDF||null);
  if(!jsPDFLib){showToast('⚠️ jsPDF non chargé.');return;}
  var tP=items.reduce(function(s,p){return s+(parseFloat(p.price)||0)*(parseFloat(p.quantity)||0);},0);
  var tA=adjs.reduce(function(s,a){return s+(a.type==='+'?1:-1)*(parseFloat(a.amount)||0);},0);
  var grand=tP+tA,now=new Date().toLocaleDateString('fr-MA');
  var doc=new jsPDFLib({orientation:'portrait',unit:'mm',format:'a4'});var W=210,M=15,y=36;
  doc.setFillColor(26,122,74);doc.rect(0,0,W,28,'F');doc.setTextColor(255,255,255);doc.setFontSize(18);doc.setFont('helvetica','bold');doc.text('L7ssab.ma',M,12);
  doc.setFontSize(11);doc.setFont('helvetica','normal');doc.text((project?project.name:'Rapport'),M,20);
  doc.setFontSize(9);doc.text('Genere le '+now+' | par '+(authorName||'-'),M,26);
  doc.setTextColor(26,122,74);doc.setFontSize(11);doc.setFont('helvetica','bold');doc.text('PRODUITS ('+items.length+')',M,y);y+=6;
  doc.setDrawColor(26,122,74);doc.line(M,y,W-M,y);y+=4;doc.setFillColor(26,122,74);doc.rect(M,y,W-2*M,7,'F');doc.setTextColor(255,255,255);doc.setFontSize(8.5);doc.setFont('helvetica','bold');
  doc.text('N',M+2,y+5);doc.text('Produit',M+12,y+5);doc.text('Prix',M+108,y+5,{align:'right'});doc.text('Qte',M+124,y+5,{align:'right'});doc.text('Total DH',W-M-2,y+5,{align:'right'});y+=7;
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(30,30,30);
  items.forEach(function(p,i){var pr=parseFloat(p.price)||0,q=parseFloat(p.quantity)||0;if(i%2===1){doc.setFillColor(240,250,244);doc.rect(M,y,W-2*M,6,'F');}doc.text(String(i+1),M+2,y+4.5);doc.text((p.name||'-').substring(0,40),M+12,y+4.5);doc.text(pr.toFixed(2),M+108,y+4.5,{align:'right'});doc.text(String(q),M+124,y+4.5,{align:'right'});doc.text((pr*q).toFixed(2),W-M-2,y+4.5,{align:'right'});y+=6;if(y>270){doc.addPage();y=15;}});
  doc.setFillColor(232,245,238);doc.rect(M,y,W-2*M,7,'F');doc.setFont('helvetica','bold');doc.setTextColor(15,81,50);doc.text('Sous-total produits',M+2,y+5);doc.text(tP.toFixed(2)+' DH',W-M-2,y+5,{align:'right'});y+=10;
  if(adjs.length>0){doc.setTextColor(26,122,74);doc.setFontSize(11);doc.text('AJUSTEMENTS ('+adjs.length+')',M,y);y+=6;doc.setDrawColor(26,122,74);doc.line(M,y,W-M,y);y+=4;doc.setFillColor(26,122,74);doc.rect(M,y,W-2*M,7,'F');doc.setTextColor(255,255,255);doc.setFontSize(8.5);doc.text('Description',M+2,y+5);doc.text('Type',M+118,y+5);doc.text('Montant',W-M-2,y+5,{align:'right'});y+=7;doc.setFont('helvetica','normal');doc.setFontSize(8);adjs.forEach(function(a,i){var ap=parseFloat(a.amount)||0,col=a.type==='+'?[26,122,74]:[214,48,49];if(i%2===1){doc.setFillColor(240,250,244);doc.rect(M,y,W-2*M,6,'F');}doc.setTextColor(30,30,30);doc.text((a.description||'-').substring(0,46),M+2,y+4.5);doc.setTextColor(col[0],col[1],col[2]);doc.text(a.type,M+118,y+4.5);doc.text((a.type==='+'?'+':'-')+ap.toFixed(2)+' DH',W-M-2,y+4.5,{align:'right'});y+=6;});doc.setFillColor(232,245,238);doc.rect(M,y,W-2*M,7,'F');doc.setFont('helvetica','bold');doc.setTextColor(15,81,50);doc.text('Sous-total ajustements',M+2,y+5);doc.text((tA>=0?'+':'')+tA.toFixed(2)+' DH',W-M-2,y+5,{align:'right'});y+=12;}
  if(y>240){doc.addPage();y=15;}doc.setFillColor(26,122,74);doc.rect(M,y,W-2*M,14,'F');doc.setTextColor(255,255,255);doc.setFontSize(13);doc.setFont('helvetica','bold');doc.text('TOTAL GENERAL',M+4,y+9);doc.text(grand.toFixed(2)+' DH',W-M-4,y+9,{align:'right'});y+=20;
  if(y>250){doc.addPage();y=15;}doc.setTextColor(100,100,100);doc.setFontSize(9);doc.setFont('helvetica','normal');var sw=(W-2*M)/2-5;doc.line(M,y+12,M+sw,y+12);doc.line(M+sw+10,y+12,W-M,y+12);doc.text('Signature responsable',M+sw/2,y+17,{align:'center'});doc.text('Signature controleur',M+sw+10+sw/2,y+17,{align:'center'});
  doc.setFontSize(8);doc.setTextColor(180,180,180);doc.text('L7ssab.ma (c) '+new Date().getFullYear(),W/2,290,{align:'center'});
  doc.save('rapport-'+(project?project.name:'inv').replace(/\s+/g,'-')+'-'+new Date().toISOString().slice(0,10)+'.pdf');
}
function pdfForProjectId(pid,projName,authorName){Promise.all([dbGetItems(pid),dbGetAdjs(pid)]).then(function(r){generatePDF({id:pid,name:projName},r[0],r[1],authorName);});}
