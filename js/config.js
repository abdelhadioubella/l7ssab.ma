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
function requireUser(){var s=getSession();if(!s){location.href=pageUrl('index');return null;}if(s.role==='admin'){location.href=pageUrl('statistics');return null;}return s;}
function requireAdmin(){var s=getSession();if(!s){location.href=pageUrl('index');return null;}if(s.role!=='admin'){location.href=pageUrl('inventory');return null;}return s;}
function logout(){clearSession();LS.set('fs',0);location.href=pageUrl('index');}

// ====== DATA LAYER (Supabase) ======
function dbGetUserByUsername(u){return sb.from('app_users').select('*').ilike('username',u).limit(1).then(function(r){return r.error?null:((r.data&&r.data[0])||null);});}
function dbGetUserById(id){return sb.from('app_users').select('*').eq('id',id).limit(1).then(function(r){return r.error?null:((r.data&&r.data[0])||null);});}
function dbGetUsers(){return sb.from('app_users').select('*').order('created_at',{ascending:true}).limit(100000).then(function(r){return r.error?[]:(r.data||[]);});}
function dbGetProducts(){return sb.from('products').select('*').order('name',{ascending:true}).limit(100000).then(function(r){return r.error?[]:(r.data||[]);});}
function dbGetProjects(uid){return sb.from('projects').select('*').eq('user_id',uid).order('updated_at',{ascending:false}).limit(100000).then(function(r){return r.error?[]:(r.data||[]);});}
function dbGetItems(pid){return sb.from('project_items').select('*').eq('project_id',pid).order('created_at',{ascending:true}).then(function(r){return r.error?[]:(r.data||[]);});}
function dbGetAdjs(pid){return sb.from('adjustments').select('*').eq('project_id',pid).order('created_at',{ascending:true}).then(function(r){return r.error?[]:(r.data||[]);});}
function dbGetCustomPrice(uid,bc){return sb.from('custom_prices').select('*').eq('user_id',uid).eq('barcode',bc).limit(1).then(function(r){return (r.data&&r.data[0])||null;});}

// ====== SHARED UI bits ======
function isFSnow(){return !!(document.fullscreenElement||document.webkitFullscreenElement);}
function toggleFS(){var d=document,el=d.documentElement;if(!isFSnow()){var rq=el.requestFullscreen||el.webkitRequestFullscreen;if(rq)rq.call(el);LS.set('fs',1);}else{var ex=d.exitFullscreen||d.webkitExitFullscreen;if(ex)ex.call(d);LS.set('fs',0);}}
// If the user had fullscreen on, re-enter on the first tap after navigating to a new page
document.addEventListener('click',function once(){if(LS.get('fs',0)&&!isFSnow()){var el=document.documentElement;var rq=el.requestFullscreen||el.webkitRequestFullscreen;if(rq){try{rq.call(el);}catch(e){}}}document.removeEventListener('click',once);},{once:true});

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


// Exact counts (no row cap) for statistics
function dbCount(table){return sb.from(table).select('*',{count:'exact',head:true}).then(function(r){return r.count||0;});}
function dbCountProjects(){return sb.from('projects').select('*',{count:'exact',head:true}).then(function(r){return r.count||0;});}

// ====== SHARED HEADER ======
// opts: {title, role:'user'|'admin', activeTab, lang:true/false, showLang}
function buildHeader(opts){
  opts=opts||{};
  var s=getSession();var initial=s?(s.fullname||s.username)[0].toUpperCase():'?';
  var roleLabel=s&&s.role==='admin'?'Administrator':'Utilisateur';
  var langBtn=opts.showLang?'<button class="hdr-btn" onclick="toggleLang&&toggleLang()" id="lang-app-btn">🇫🇷</button>':'';
  // order (after the avatar): language, dark, fullscreen, refresh
  var html=''+
  '<div class="hdr">'+
    '<span class="hdr-title" id="hdr-title">'+esc(opts.title||'L7ssab.ma')+'</span>'+
    '<div class="hdr-right">'+
      '<button class="hdr-btn" onclick="location.reload()" title="Rafraîchir">↻</button>'+
      '<button class="hdr-btn" onclick="toggleFS()" title="Plein écran">⛶</button>'+
      '<button class="hdr-btn theme-btn" onclick="toggleTheme()" title="Mode nuit">🌙</button>'+
      langBtn+
      '<div class="hdr-av" id="hdr-av" onclick="toggleAvMenu()">'+initial+'</div>'+
      '<div class="av-menu" id="av-menu">'+
        '<div class="av-head"><div class="n">'+esc(s?(s.fullname||s.username):'—')+'</div><div class="r">'+roleLabel+'</div></div>'+
        (opts.role==='admin'?'<button onclick="location.href=\'profile.html\'">👤 My profile</button>':'<button onclick="location.href=\'profile.html\'">👤 '+t('myProfile')+'</button>')+
        '<button onclick="doInstall()" class="install-btn hidden" style="color:#1a7a4a">📲 '+(opts.role==='admin'?'Install':t('installApp'))+'</button>'+
        '<button onclick="logout()">🚪 '+(opts.role==='admin'?'Logout':t('logoutTxt'))+'</button>'+
      '</div>'+
    '</div>'+
  '</div>';
  if(opts.role==='admin'){
    html+='<div class="tabbar">'+
      '<button class="'+(opts.activeTab==='statistics'?'active':'')+'" onclick="location.href=\'statistics.html\'">📊 Stats</button>'+
      '<button class="'+(opts.activeTab==='database'?'active':'')+'" onclick="location.href=\'database.html\'">🗄️ Database</button>'+
      '<button class="'+(opts.activeTab==='users'?'active':'')+'" onclick="location.href=\'users.html\'">👥 Users</button>'+
      '<button class="'+(opts.activeTab==='projects'?'active':'')+'" onclick="location.href=\'projects.html\'">📁 Projects</button>'+
      '<button class="'+(opts.activeTab==='backup'?'active':'')+'" onclick="location.href=\'backup.html\'">💾 Backup</button>'+
    '</div>';
  }
  var holder=G('app-header');if(holder)holder.innerHTML=html;
  applyTheme();
  if(opts.role!=='admin'){applyDir();setLangBtn();}
}
function toggleAvMenu(){var m=G('av-menu');if(m)m.classList.toggle('show');}
document.addEventListener('click',function(e){var m=G('av-menu');if(m&&m.classList.contains('show')){if(!e.target.closest('#av-menu')&&!e.target.closest('#hdr-av'))m.classList.remove('show');}});

// ====== SHARED PDF (used by user recap + admin projects) ======
function generatePDF(project,items,adjs,authorName,lang){
  lang=lang||'fr';
  var jsPDFLib=(window.jspdf&&window.jspdf.jsPDF)?window.jspdf.jsPDF:(window.jsPDF||null);
  if(!jsPDFLib){showToast('jsPDF non charge');return;}
  var L={
    fr:{prod:'PRODUITS',adjs:'AJUSTEMENTS',gen:'Genere le',by:'par',pname:'Produit',price:'Prix',qte:'Qte',total:'Total DH',subP:'Sous-total produits',subA:'Sous-total ajustements',desc:'Description',type:'Type',amount:'Montant',grand:'TOTAL GENERAL',signR:'Signature responsable',signC:'Signature controleur'},
    ar:{prod:'المنتجات',adjs:'التسويات',gen:'حرر في',by:'بواسطة',pname:'المنتج',price:'السعر',qte:'الكمية',total:'المجموع',subP:'مجموع المنتجات',subA:'مجموع التسويات',desc:'الوصف',type:'النوع',amount:'المبلغ',grand:'المجموع الكلي',signR:'توقيع المسؤول',signC:'توقيع المراقب'}
  }[lang]||L.fr;
  var tP=items.reduce(function(s,p){return s+(parseFloat(p.price)||0)*(parseFloat(p.quantity)||0);},0);
  var tA=adjs.reduce(function(s,a){return s+(a.type==='+'?1:-1)*(parseFloat(a.amount)||0);},0);
  var grand=tP+tA,now=new Date().toLocaleDateString('fr-MA');
  var doc=new jsPDFLib({orientation:'portrait',unit:'mm',format:'a4'});var W=210,M=15,y=36;
  var FONT='helvetica';
  if(lang==='ar'&&typeof loadArabicFont==='function'&&loadArabicFont(doc)){FONT='Amiri';}
  function F(style){try{doc.setFont(FONT,style||'normal');}catch(e){doc.setFont('helvetica',style||'normal');}}
  doc.setFillColor(26,122,74);doc.rect(0,0,W,28,'F');doc.setTextColor(255,255,255);doc.setFontSize(18);F('bold');doc.text('L7ssab.ma',M,12);
  doc.setFontSize(11);F('normal');doc.text((project?project.name:'Rapport'),M,20);
  doc.setFontSize(9);doc.text(L.gen+' '+now+' | '+L.by+' '+(authorName||'-'),M,26);
  doc.setTextColor(26,122,74);doc.setFontSize(11);F('bold');doc.text(L.prod+' ('+items.length+')',M,y);y+=6;
  doc.setDrawColor(26,122,74);doc.line(M,y,W-M,y);y+=4;doc.setFillColor(26,122,74);doc.rect(M,y,W-2*M,7,'F');doc.setTextColor(255,255,255);doc.setFontSize(8.5);F('bold');
  doc.text('N',M+2,y+5);doc.text(L.pname,M+12,y+5);doc.text(L.price,M+108,y+5,{align:'right'});doc.text(L.qte,M+124,y+5,{align:'right'});doc.text(L.total,W-M-2,y+5,{align:'right'});y+=7;
  F('normal');doc.setFontSize(8);doc.setTextColor(30,30,30);
  items.forEach(function(p,i){var pr=parseFloat(p.price)||0,q=parseFloat(p.quantity)||0;if(i%2===1){doc.setFillColor(240,250,244);doc.rect(M,y,W-2*M,6,'F');}doc.text(String(i+1),M+2,y+4.5);doc.text((p.name||'-').substring(0,40),M+12,y+4.5);doc.text(pr.toFixed(2),M+108,y+4.5,{align:'right'});doc.text(String(q),M+124,y+4.5,{align:'right'});doc.text((pr*q).toFixed(2),W-M-2,y+4.5,{align:'right'});y+=6;if(y>270){doc.addPage();y=15;}});
  doc.setFillColor(232,245,238);doc.rect(M,y,W-2*M,7,'F');F('bold');doc.setTextColor(15,81,50);doc.text(L.subP,M+2,y+5);doc.text(tP.toFixed(2)+' DH',W-M-2,y+5,{align:'right'});y+=10;
  if(adjs.length>0){doc.setTextColor(26,122,74);doc.setFontSize(11);doc.text(L.adjs+' ('+adjs.length+')',M,y);y+=6;doc.setDrawColor(26,122,74);doc.line(M,y,W-M,y);y+=4;doc.setFillColor(26,122,74);doc.rect(M,y,W-2*M,7,'F');doc.setTextColor(255,255,255);doc.setFontSize(8.5);doc.text(L.desc,M+2,y+5);doc.text(L.type,M+118,y+5);doc.text(L.amount,W-M-2,y+5,{align:'right'});y+=7;F('normal');doc.setFontSize(8);adjs.forEach(function(a,i){var ap=parseFloat(a.amount)||0,col=a.type==='+'?[26,122,74]:[214,48,49];if(i%2===1){doc.setFillColor(240,250,244);doc.rect(M,y,W-2*M,6,'F');}doc.setTextColor(30,30,30);doc.text((a.description||'-').substring(0,46),M+2,y+4.5);doc.setTextColor(col[0],col[1],col[2]);doc.text(a.type,M+118,y+4.5);doc.text((a.type==='+'?'+':'-')+ap.toFixed(2)+' DH',W-M-2,y+4.5,{align:'right'});y+=6;});doc.setFillColor(232,245,238);doc.rect(M,y,W-2*M,7,'F');F('bold');doc.setTextColor(15,81,50);doc.text(L.subA,M+2,y+5);doc.text((tA>=0?'+':'')+tA.toFixed(2)+' DH',W-M-2,y+5,{align:'right'});y+=12;}
  if(y>240){doc.addPage();y=15;}doc.setFillColor(26,122,74);doc.rect(M,y,W-2*M,14,'F');doc.setTextColor(255,255,255);doc.setFontSize(13);F('bold');doc.text(L.grand,M+4,y+9);doc.text(grand.toFixed(2)+' DH',W-M-4,y+9,{align:'right'});y+=20;
  if(y>250){doc.addPage();y=15;}doc.setTextColor(100,100,100);doc.setFontSize(9);F('normal');var sw=(W-2*M)/2-5;doc.line(M,y+12,M+sw,y+12);doc.line(M+sw+10,y+12,W-M,y+12);doc.text(L.signR,M+sw/2,y+17,{align:'center'});doc.text(L.signC,M+sw+10+sw/2,y+17,{align:'center'});
  doc.setFontSize(8);doc.setTextColor(180,180,180);doc.text('L7ssab.ma (c) '+new Date().getFullYear(),W/2,290,{align:'center'});
  doc.save('rapport-'+(project?project.name:'inv').replace(/\s+/g,'-')+'-'+new Date().toISOString().slice(0,10)+'.pdf');
}
function pdfForProjectId(pid,projName,authorName,lang){Promise.all([dbGetItems(pid),dbGetAdjs(pid)]).then(function(r){generatePDF({id:pid,name:projName},r[0],r[1],authorName,lang);});}

// ====== SHARED LANGUAGE ENGINE (FR / AR) for user pages ======
var LANG=LS.get('lang','fr');
function isAr(){return LANG==='ar';}
var T={
fr:{newProj:'Nouveau projet',cProj:'Créer le projet →',sProj:'Projets sauvegardés',aProd:'Ajouter un produit',srch:'Rechercher',price:'Prix (DH)',qty:'Quantité',add:'+ Ajouter',eProd:'Produit',of:'sur',runT:'Total provisoire',back:'← Retour',next:'Suivant →',adj:'Ajustements',adjD:'Ajoutez frais, remises ou corrections.',addL:'+ Ajouter une ligne',recap:'Récapitulatif',prods:'Produits',tP:'Total produits',tA:'Total ajustements',grand:'TOTAL GÉNÉRAL',dlPDF:'Télécharger PDF',nInv:'🔄 Nouvel inventaire',nInvQ:'Recommencer ?',prof:'Mon profil',ld:'Charger',pd:'PDF',chn:'Changer le nom',chp:'Changer le PIN',upd:'Mettre à jour',tap:'Appuyer',ok:'Confirmer ✓',can:'Annuler',fd:'Trouvé dans la base',nf:'Inconnu — saisie manuelle',onl:'Pas dans la base — recherche en ligne…',apiF:'Trouvé en ligne (API)',mProf:'Mon profil',out2:'Déconnexion',rUsr:'Utilisateur',rAdm:'Administrateur',noProj:'Aucun projet',projName:'Nom du projet…',prodName:'Nom du produit',scanPH:'Scannez ou tapez le code-barres…',type:'Type',amount:'Montant',desc:'Description',num:'N°',total:'Total',signR:'Signature responsable',signC:'Signature contrôleur',sumP:'Sous-total',del:'Supprimer',renamed:'Renommé',added:'Ajouté',deleted:'Supprimé',enterName:'Entrez le nom',installApp:'Installer',myProfile:'Mon profil',logoutTxt:'Déconnexion',scanner:'Scanner',notDetected:'Non détecté',connect:'Connecter'},
ar:{newProj:'مشروع جديد',cProj:'إنشاء المشروع ←',sProj:'المشاريع المحفوظة',aProd:'إضافة منتج',srch:'بحث',price:'السعر (درهم)',qty:'الكمية',add:'+ إضافة',eProd:'المنتج',of:'من',runT:'المجموع المؤقت',back:'→ رجوع',next:'التالي ←',adj:'التسويات',adjD:'أضف رسوماً أو خصومات أو تصحيحات.',addL:'+ إضافة سطر',recap:'الملخص',prods:'المنتجات',tP:'مجموع المنتجات',tA:'مجموع التسويات',grand:'المجموع الكلي',dlPDF:'تحميل PDF',nInv:'🔄 جرد جديد',nInvQ:'هل تريد البدء من جديد؟',prof:'ملفي',ld:'تحميل',pd:'PDF',chn:'تغيير الاسم',chp:'تغيير الرمز',upd:'تحديث',tap:'اضغط',ok:'تأكيد ✓',can:'إلغاء',fd:'موجود في قاعدة البيانات',nf:'غير معروف — إدخال يدوي',onl:'غير موجود — البحث على الإنترنت…',apiF:'تم العثور عليه عبر الإنترنت',mProf:'ملفي الشخصي',out2:'تسجيل الخروج',rUsr:'مستخدم',rAdm:'مدير',noProj:'لا توجد مشاريع',projName:'اسم المشروع…',prodName:'اسم المنتج',scanPH:'امسح أو اكتب الرمز الشريطي…',type:'النوع',amount:'المبلغ',desc:'الوصف',num:'رقم',total:'المجموع',signR:'توقيع المسؤول',signC:'توقيع المراقب',sumP:'المجموع الفرعي',del:'حذف',renamed:'تم التغيير',added:'تمت الإضافة',deleted:'تم الحذف',enterName:'أدخل الاسم',installApp:'تثبيت التطبيق',myProfile:'ملفي الشخصي',logoutTxt:'تسجيل الخروج',scanner:'الماسح',notDetected:'غير متصل',connect:'ربط'}
};
function t(k){var L=T[LANG]||T.fr;return L[k]!=null?L[k]:(T.fr[k]||k);}
function setLangBtn(){var b=G('lang-app-btn');if(b)b.textContent=LANG==='fr'?'🇫🇷':'🇲🇦';}
function applyDir(){document.documentElement.lang=LANG;document.documentElement.dir=LANG==='ar'?'rtl':'ltr';}
// pages provide their own applyTR() to translate their specific elements
function toggleLang(){LANG=LANG==='fr'?'ar':'fr';LS.set('lang',LANG);applyDir();setLangBtn();if(typeof applyTR==='function')applyTR();}

// ====== IN-APP MODAL SYSTEM ======
// openModal({title, fields:[{key,label,value,type,maxlength}], confirmText, onConfirm(values)})
function openModal(opts){
  closeModal();
  var ov=document.createElement('div');ov.className='modal-ov';ov.id='app-modal';
  var fieldsHtml='';
  (opts.fields||[]).forEach(function(f){
    var type=f.type||'text';
    if(type==='select'){
      var optsH='';(f.options||[]).forEach(function(o){optsH+='<option value="'+esc(o.value)+'"'+(o.value===f.value?' selected':'')+'>'+esc(o.label)+'</option>';});
      fieldsHtml+='<div class="ml">'+esc(f.label)+'</div><select class="inp" id="modal-'+f.key+'">'+optsH+'</select>';
    } else {
      fieldsHtml+='<div class="ml">'+esc(f.label)+'</div><input class="inp" id="modal-'+f.key+'" type="'+type+'" value="'+esc(f.value!=null?String(f.value):'')+'"'+(f.maxlength?' maxlength="'+f.maxlength+'"':'')+(f.placeholder?' placeholder="'+esc(f.placeholder)+'"':'')+'/>';
    }
  });
  ov.innerHTML='<div class="modal-box">'+
    '<div class="modal-head"><span>'+esc(opts.title||'')+'</span><button class="x" onclick="closeModal()">×</button></div>'+
    '<div class="modal-body">'+fieldsHtml+(opts.bodyHtml||'')+'</div>'+
    '<div class="modal-foot"><button class="btn-g" onclick="closeModal()">'+esc(opts.cancelText||'Annuler')+'</button>'+
    '<button class="btn-p" style="margin-top:0" id="modal-ok">'+esc(opts.confirmText||'OK')+'</button></div>'+
  '</div>';
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)closeModal();});
  G('modal-ok').onclick=function(){
    var vals={};(opts.fields||[]).forEach(function(f){var el=G('modal-'+f.key);vals[f.key]=el?el.value:'';});
    if(opts.onConfirm)opts.onConfirm(vals);
  };
  var first=ov.querySelector('input,select');if(first)setTimeout(function(){first.focus();},60);
}
function closeModal(){var m=G('app-modal');if(m&&m.parentNode)m.parentNode.removeChild(m);}
// confirmation modal
function confirmModal(title,msg,onYes,yesText){
  closeModal();
  var ov=document.createElement('div');ov.className='modal-ov';ov.id='app-modal';
  ov.innerHTML='<div class="modal-box"><div class="modal-head"><span>'+esc(title||'')+'</span><button class="x" onclick="closeModal()">×</button></div>'+
    '<div class="modal-body"><p style="font-size:14px;color:#444">'+esc(msg||'')+'</p></div>'+
    '<div class="modal-foot"><button class="btn-g" onclick="closeModal()">Annuler</button>'+
    '<button class="btn-r" style="margin-top:0" id="modal-yes">'+esc(yesText||'Supprimer')+'</button></div></div>';
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)closeModal();});
  G('modal-yes').onclick=function(){closeModal();if(onYes)onYes();};
}
