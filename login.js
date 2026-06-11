// ====== LOGIN PAGE ======
var lang='fr',pinV='',pinSel=null;
function isAr(){return lang==='ar';}
function toggleLang(){lang=lang==='fr'?'ar':'fr';document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';G('lang-login-btn').textContent=lang==='fr'?'🇫🇷 FR':'🇲🇦 AR';renderRemembered();var g=G('login-greeting');}
// if already logged in, skip straight to the right app
(function(){var s=getSession();if(s){location.href=s.role==='admin'?'admin.html':'app.html';}})();

function getRemembered(){return LS.get('remembered',[])||[];}
function rememberUser(u){var r=getRemembered(),ex=false;for(var i=0;i<r.length;i++){if(r[i].id===u.id){r[i].username=u.username;r[i].fullname=u.fullname;r[i].color=u.color;ex=true;break;}}if(!ex)r.push({id:u.id,username:u.username,fullname:u.fullname||u.username,color:u.color});LS.set('remembered',r);}
function forgetUser(id){LS.set('remembered',getRemembered().filter(function(x){return x.id!==id;}));renderRemembered();}
function renderRemembered(){
  var c=G('remembered-circles');if(!c)return;c.innerHTML='';
  var r=getRemembered();
  var lbl=G('t-quicklogin');if(lbl)lbl.textContent=r.length?(isAr()?'اختر حسابك':'Choisissez votre compte'):(isAr()?'اضغط + للاتصال':'Cliquez + pour vous connecter');
  r.forEach(function(rm){
    var w=document.createElement('div');w.className='ucw';
    var circle=document.createElement('div');circle.className='uc';circle.style.background=rm.color||'#1a7a4a';circle.textContent=(rm.fullname||rm.username)[0].toUpperCase();
    var nm=document.createElement('span');nm.className='uc-name';nm.textContent=rm.fullname||rm.username;
    w.appendChild(circle);w.appendChild(nm);
    w.oncontextmenu=function(ev){ev.preventDefault();if(confirm((isAr()?'إزالة ':'Retirer ')+(rm.fullname||rm.username)+' ?'))forgetUser(rm.id);};
    w.onclick=(function(rm){return function(){dbGetUserByUsername(rm.username).then(function(found){if(!found){forgetUser(rm.id);return;}startPin(found);});};})(rm);
    c.appendChild(w);
  });
  var aw=document.createElement('div');aw.className='ucw';var ab=document.createElement('div');ab.className='add-uc';ab.textContent='+';ab.onclick=showUsernameForm;var al=document.createElement('span');al.className='uc-name';al.style.color='#1a7a4a';al.textContent=isAr()?'إضافة':'Ajouter';aw.appendChild(ab);aw.appendChild(al);c.appendChild(aw);
}
function showUsernameForm(){hide('login-step-plus');hide('login-step-pin');show('login-step-username');var el=G('login-username');if(el){el.value='';setTimeout(function(){el.focus();},80);}}
function backToPlus(){pinSel=null;pinV='';hide('login-step-username');hide('login-step-pin');show('login-step-plus');renderRemembered();}
function loginCheckUser(){var name=(G('login-username')?G('login-username').value||'':'').trim();if(!name){showToast(isAr()?'أدخل اسم المستخدم':'Entrez un nom');return;}showToast(isAr()?'جاري التحقق…':'Vérification…',1000);dbGetUserByUsername(name).then(function(found){if(!found){showToast(isAr()?'❌ المستخدم غير موجود':'❌ Utilisateur introuvable');return;}startPin(found);});}
function startPin(found){pinSel=found;pinV='';hide('login-step-username');hide('login-step-plus');show('login-step-pin');var av=G('login-av');if(av){av.textContent=(found.fullname||found.username)[0].toUpperCase();av.style.background=found.color||'#1a7a4a';}setText('login-greeting',(isAr()?'مرحباً ':'Bonjour ')+(found.fullname||found.username));buildPinKeys();updateDots();}
function buildPinKeys(){var grid=G('pkeys');if(!grid)return;grid.innerHTML='';['1','2','3','4','5','6','7','8','9','ph','0','del'].forEach(function(k){var b=document.createElement('button');if(k==='ph'){b.className='pin-key pin-ph';b.disabled=true;}else if(k==='del'){b.className='pin-key pin-del';b.textContent='⌫';b.onclick=function(){pinV=pinV.slice(0,-1);updateDots();};}else{b.className='pin-key';b.textContent=k;b.onclick=function(){if(pinV.length>=6)return;pinV+=k;updateDots();if(pinV.length===6)setTimeout(checkPin,150);};}grid.appendChild(b);});}
function updateDots(){for(var i=0;i<6;i++){var d=G('pd'+i);if(!d)continue;d.classList.remove('filled','error');if(i<pinV.length)d.classList.add('filled');}}
function checkPin(){
  if(!pinSel){pinV='';updateDots();return;}
  hashPIN(pinV).then(function(h){
    if(h===pinSel.pin_hash){
      rememberUser(pinSel);setSession(pinSel);
      location.href=pinSel.role==='admin'?'admin.html':'app.html';
    } else {for(var i=0;i<6;i++){var d=G('pd'+i);if(d)d.classList.add('error');}setTimeout(function(){pinV='';updateDots();},700);}
  });
}
renderRemembered();
