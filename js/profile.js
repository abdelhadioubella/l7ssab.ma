var s=getSession();if(!s){location.href='../index.html';}
var CU=s;var isAdmin=CU&&CU.role==='admin';
buildHeader({title:isAdmin?'My profile':'Mon profil',role:isAdmin?'admin':'user',activeTab:'',showLang:false});
function backToApp(){location.href=isAdmin?'database.html':'inventory.html';}
function refreshProfile(){var av=G('prof-av');if(av){av.textContent=(CU.fullname||CU.username)[0].toUpperCase();av.style.background=CU.color||'#1a7a4a';}setText('prof-name',CU.fullname||CU.username);var bd=G('prof-badge');if(bd){bd.textContent=isAdmin?'Administrator':'Utilisateur';bd.className=isAdmin?'badge b-admin':'badge b-user';}var ni=G('prof-newname');if(ni)ni.value=CU.fullname||CU.username;var bc=G('back-to-app-card');if(bc)bc.classList.remove('hidden');}
function updateProf(type){
  if(type==='name'){var n=(G('prof-newname')?G('prof-newname').value||'':'').trim();if(!n)return;sb.from('app_users').update({fullname:n}).eq('id',CU.id).then(function(){CU.fullname=n;setSession(CU);showToast('✅');refreshProfile();});}
  else{var p=(G('prof-newpin')?G('prof-newpin').value||'':'');var c=(G('prof-confpin')?G('prof-confpin').value||'':'');if(p.length!==6){showToast('❌ PIN 6');return;}if(p!==c){showToast('❌ PIN mismatch');return;}hashPIN(p).then(function(h){sb.from('app_users').update({pin_hash:h}).eq('id',CU.id).then(function(){if(G('prof-newpin'))G('prof-newpin').value='';if(G('prof-confpin'))G('prof-confpin').value='';showToast('✅ PIN updated');});});}
}
refreshProfile();
