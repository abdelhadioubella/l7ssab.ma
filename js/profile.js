var s=getSession();if(!s){location.href='../index.html';}
var CU=s;var isAdmin=CU&&CU.role==='admin';
buildHeader({title:isAdmin?'My profile':t('prof'),role:isAdmin?'admin':'user',activeTab:'',showLang:!isAdmin});
function L(k){ // labels: admin in English, user via t()
  if(isAdmin){var m={chguname:'Change username',chgname:'Change full name',chgpin:'Change PIN',upd:'Update',back:'← Back',unameReq:'Username required',taken:'Username already taken',pin6:'PIN must be 6 digits',mismatch:'PINs do not match',updated:'Updated',pinUpd:'PIN updated'};return m[k]||k;}
  var mm={chguname:isAr()?'تغيير اسم المستخدم':'Changer le nom d\u2019utilisateur',chgname:isAr()?'تغيير الاسم الكامل':'Changer le nom complet',chgpin:t('chp'),upd:t('upd'),back:t('back'),unameReq:isAr()?'اسم المستخدم مطلوب':'Nom d\u2019utilisateur requis',taken:isAr()?'اسم المستخدم مستعمل':'Nom d\u2019utilisateur déjà pris',pin6:isAr()?'الرمز 6 أرقام':'PIN à 6 chiffres',mismatch:isAr()?'الرمز غير متطابق':'PIN non identique',updated:isAr()?'تم التحديث':'Mis à jour',pinUpd:isAr()?'تم تحديث الرمز':'PIN mis à jour'};
  return mm[k]||k;
}
function applyTR(){
  setText('hdr-title',isAdmin?'My profile':t('prof'));
  setText('t-chguname',L('chguname'));setText('t-chgname',L('chgname'));setText('t-chgpin',L('chgpin'));
  setText('t-update0',L('upd'));setText('t-update1',L('upd'));setText('t-update2',L('upd'));
  if(G('t-backapp'))G('t-backapp').textContent=L('back');
  refreshProfile();
}
applyTR();
function backToApp(){location.href=isAdmin?'statistics.html':'inventory.html';}
function refreshProfile(){
  var av=G('prof-av');if(av){av.textContent=(CU.fullname||CU.username)[0].toUpperCase();av.style.background=CU.color||'#1a7a4a';}
  setText('prof-name',CU.fullname||CU.username);
  var bd=G('prof-badge');if(bd){bd.textContent=isAdmin?'Administrator':(isAr()?'مستخدم':'Utilisateur');bd.className=isAdmin?'badge b-admin':'badge b-user';}
  var un=G('prof-newuname');if(un)un.value=CU.username||'';
  var ni=G('prof-newname');if(ni)ni.value=CU.fullname||CU.username;
  var bc=G('back-to-app-card');if(bc)bc.classList.remove('hidden');
}
function updateProf(type){
  if(type==='username'){
    var u=(G('prof-newuname')?G('prof-newuname').value||'':'').trim();
    if(!u){showToast('❌ '+L('unameReq'));return;}
    if(u===CU.username){showToast('✅ '+L('updated'));return;}
    dbGetUserByUsername(u).then(function(ex){
      if(ex){showToast('❌ '+L('taken'));return;}
      sb.from('app_users').update({username:u}).eq('id',CU.id).then(function(r){
        if(r.error){showToast('❌ '+r.error.message);return;}
        CU.username=u;setSession(CU);
        // update remembered list entry too
        var rem=LS.get('remembered',[])||[];for(var i=0;i<rem.length;i++){if(rem[i].id===CU.id)rem[i].username=u;}LS.set('remembered',rem);
        showToast('✅ '+L('updated'));refreshProfile();
      });
    });
  }
  else if(type==='name'){
    var n=(G('prof-newname')?G('prof-newname').value||'':'').trim();if(!n)return;
    sb.from('app_users').update({fullname:n}).eq('id',CU.id).then(function(){CU.fullname=n;setSession(CU);var rem=LS.get('remembered',[])||[];for(var i=0;i<rem.length;i++){if(rem[i].id===CU.id)rem[i].fullname=n;}LS.set('remembered',rem);showToast('✅ '+L('updated'));refreshProfile();});
  }
  else{
    var p=(G('prof-newpin')?G('prof-newpin').value||'':'');var c=(G('prof-confpin')?G('prof-confpin').value||'':'');
    if(p.length!==6){showToast('❌ '+L('pin6'));return;}if(p!==c){showToast('❌ '+L('mismatch'));return;}
    hashPIN(p).then(function(h){sb.from('app_users').update({pin_hash:h}).eq('id',CU.id).then(function(){if(G('prof-newpin'))G('prof-newpin').value='';if(G('prof-confpin'))G('prof-confpin').value='';showToast('✅ '+L('pinUpd'));});});
  }
}
refreshProfile();
