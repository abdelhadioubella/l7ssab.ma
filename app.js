// ====== APP (simple user) ======
var CU=requireUser(); // redirects if not logged in as user
var CP=null,dP=0,dQ=0,eI=0,npT=null,npV='',npD=true,btDev=null,lang='fr',pinV='';
var CACHE={products:[],items:[],adjs:[]};var _scanInputTimer=null,_scanFocusTimer=null;
function isAr(){return lang==='ar';}
var TR={fr:{pin:'Entrez votre PIN',newProj:'Nouveau projet',cProj:'Créer le projet →',sProj:'Projets sauvegardés',aProd:'Ajouter un produit',srch:'Rechercher',price:'Prix (DH)',qty:'Quantité',add:'+ Ajouter',eProd:'Produit',of:'sur',runT:'Total provisoire',back:'← Retour',next:'Suivant →',adj:'Ajustements',adjD:'Ajoutez frais, remises ou corrections.',addL:'+ Ajouter une ligne',recap:'Récapitulatif',tP:'Total produits',tA:'Total ajustements',grand:'TOTAL GÉNÉRAL',dlPDF:'Télécharger PDF',nInv:'🔄 Nouvel inventaire',nInvQ:'Recommencer ?',prof:'Mon profil',ld:'Charger',pd:'PDF',chn:'Changer le nom',chp:'Changer le PIN',upd:'Mettre à jour',tap:'Appuyer',ok:'Confirmer ✓',can:'Annuler',fd:'Trouvé',nf:'Inconnu — saisie manuelle',onl:'Recherche en ligne…',mProf:'Mon profil',out2:'Déconnexion',rUsr:'Utilisateur',rAdm:'Administrateur'},
ar:{pin:'أدخل رمز PIN',newProj:'مشروع جديد',cProj:'إنشاء المشروع ←',sProj:'المشاريع المحفوظة',aProd:'إضافة منتج',srch:'بحث',price:'السعر (درهم)',qty:'الكمية',add:'+ إضافة',eProd:'المنتج',of:'من',runT:'المجموع المؤقت',back:'→ رجوع',next:'التالي →',adj:'التسويات',adjD:'أضف رسوماً أو خصومات.',addL:'+ إضافة سطر',recap:'الملخص',tP:'مجموع المنتجات',tA:'مجموع التسويات',grand:'المجموع الكلي',dlPDF:'تحميل PDF',nInv:'🔄 جرد جديد',nInvQ:'هل تريد البدء من جديد؟',prof:'ملفي',ld:'تحميل',pd:'PDF',chn:'تغيير الاسم',chp:'تغيير PIN',upd:'تحديث',tap:'اضغط',ok:'تأكيد ✓',can:'إلغاء',fd:'تم العثور عليه',nf:'غير معروف — إدخال يدوي',onl:'البحث على الإنترنت…',mProf:'ملفي',out2:'خروج',rUsr:'مستخدم',rAdm:'مدير'}};
function t(k){var L=TR[lang]||TR.fr;return L[k]!=null?L[k]:(TR.fr[k]||k);}
function toggleLang(){lang=lang==='fr'?'ar':'fr';document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';var ab=G('lang-app-btn');if(ab)ab.textContent=lang==='fr'?'🇫🇷':'🇲🇦';applyTR();}
function applyTR(){if(G('t-pin'))G('t-pin').textContent=t('pin');var m={'t-newproj':'newProj','t-createproj':'cProj','t-savedproj':'sProj','t-addprod':'aProd','t-search':'srch','t-price':'price','t-qty':'qty','t-addbtn':'add','t-runtotal':'runT','t-adjdesc':'adjD','t-addline':'addL','t-prods-title':'aProd','t-adjs-title':'adj','t-totalp':'tP','t-totala':'tA','t-summp':'tP','t-summa':'tA','t-grand':'grand','t-dlpdf':'dlPDF','t-newinv':'nInv','t-chgname':'chn','t-chgpin':'chp','t-update1':'upd','t-update2':'upd','t-cancel':'can','t-ok':'ok','t-myprof':'mProf','t-logout2':'out2'};for(var id in m){var el=G(id);if(el)el.textContent=t(m[id]);}['t-back1','t-back2','t-back3'].forEach(function(id){if(G(id))G(id).textContent=t('back');});['t-next1','t-next2'].forEach(function(id){if(G(id))G(id).textContent=t('next');});}
function setAvatar(){var av=G('hdr-av');if(av)av.textContent=(CU.fullname||CU.username)[0].toUpperCase();setText('av-name',CU.fullname||CU.username);setText('av-role',t('rUsr'));}
function toggleAvMenu(){G('av-menu').classList.toggle('show');}
function goProf(){G('av-menu').classList.remove('show');showPage('profile');}
document.addEventListener('click',function(e){var m=G('av-menu');if(m&&m.classList.contains('show')){if(!e.target.closest('#av-menu')&&!e.target.closest('#hdr-av'))m.classList.remove('show');}});
function loadProducts(){return dbGetProducts().then(function(p){CACHE.products=p;return p;});}
function showPage(name){var pages=['inventory','products','adjustments','recap','profile'];pages.forEach(function(p){var el=G('pg-'+p);if(el){if(p===name)el.classList.add('active');else el.classList.remove('active');}});var titles={inventory:'📦 L7ssab.ma',products:'📦 '+(CP?CP.name:''),adjustments:t('adj'),recap:t('recap'),profile:t('prof')};setText('hdr-title',titles[name]||name);var bc=G('back-to-app-card');if(bc){if(name==='profile')bc.classList.remove('hidden');else bc.classList.add('hidden');}if(name==='inventory')refreshProjs();if(name==='products'){refreshEdit();updateRT();updateNFs();setTimeout(focusScan,100);}if(name==='adjustments')refreshAdjs();if(name==='recap')refreshRecap();if(name==='profile')refreshProfile();}
function backToApp(){showPage('inventory');}
// ====== SCANNER ======
function focusScan(){var s=G('scan-inp');if(s){try{s.focus();}catch(e){}}}
var _scanFocusTimer=null;
function startScanGuard(){
  if(_scanFocusTimer)return;
  _scanFocusTimer=setInterval(function(){var pg=G('pg-products');if(!pg||!pg.classList.contains('active'))return;if(G('np-ov')&&!G('np-ov').classList.contains('hidden'))return;var a=document.activeElement,tag=a?a.tagName:'';if(tag!=='INPUT'&&tag!=='SELECT'&&tag!=='TEXTAREA')focusScan();},250);
  document.addEventListener('click',function(e){var pg=G('pg-products');if(!pg||!pg.classList.contains('active'))return;if(G('np-ov')&&!G('np-ov').classList.contains('hidden'))return;var tag=e.target?e.target.tagName:'';if(tag!=='INPUT'&&tag!=='SELECT'&&tag!=='TEXTAREA'&&tag!=='BUTTON')setTimeout(focusScan,50);});
}
document.addEventListener('keydown',function(e){
  var pg=G('pg-products');if(!pg||!pg.classList.contains('active'))return;if(G('np-ov')&&!G('np-ov').classList.contains('hidden'))return;
  var a=document.activeElement,tag=a?a.tagName:'';if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA')return;
  if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();markUSBconnected();doScan();return;}
  if(e.key==='Backspace'){e.preventDefault();var s=G('scan-inp');if(s)s.value=s.value.slice(0,-1);return;}
  if(e.key&&e.key.length===1){e.preventDefault();var s2=G('scan-inp');if(s2){s2.value+=e.key;clearTimeout(_scanInputTimer);_scanInputTimer=setTimeout(function(){var v=(s2.value||'').trim();if(v.length>=4){markUSBconnected();handleScan(v);}},180);}}
},true);
window.addEventListener('focus',function(){var pg=G('pg-products');if(pg&&pg.classList.contains('active'))setTimeout(focusScan,60);});
function markUSBconnected(){var dot=G('usb-mini-dot'),badge=G('usb-mini-badge');if(dot)dot.style.background='#1a7a4a';if(badge){badge.textContent=isAr()?'متصل ✅':'Connecté ✅';badge.className='badge b-ok';}}
function checkUSBDevices(){try{if(navigator.hid&&navigator.hid.getDevices){navigator.hid.getDevices().then(function(devs){if(devs&&devs.length>0)markUSBconnected();}).catch(function(){});}}catch(e){}}
function setupScanInput(){
  var s=G('scan-inp');if(!s)return;
  s.addEventListener('input',function(){
    clearTimeout(_scanInputTimer);
    if(/[\r\n\t]/.test(s.value)){var vv=s.value.replace(/[\r\n\t]/g,'').trim();s.value=vv;if(vv.length>=4){markUSBconnected();handleScan(vv);return;}}
    var val=(s.value||'').trim();
    if(val.length>=4){_scanInputTimer=setTimeout(function(){var v=(s.value||'').trim();if(v.length>=4){markUSBconnected();handleScan(v);}},180);}
  });
}
function connectBT(){if(!navigator.bluetooth){showToast('Web Bluetooth non supporté. Chrome requis.');return;}navigator.bluetooth.requestDevice({acceptAllDevices:true}).then(function(dev){btDev=dev;dev.addEventListener('gattserverdisconnected',function(){btDev=null;setBT(false,'');});setBT(true,dev.name||'BT');showToast('✅ BT: '+(dev.name||'Connecté'));}).catch(function(e){if(e.message&&e.message.indexOf('cancel')<0)showToast('⚠️ '+e.message);});}
function setBT(on,name){var d2=G('bt-mini-dot'),l2=G('bt-mini-lbl'),b2=G('bt-mini-btn');if(d2)d2.style.background=on?'#1a7a4a':'#ccc';if(l2)l2.textContent=on?(name||'Connecté'):'Scanner BT';if(b2){b2.textContent=on?'✕':'BT';b2.onclick=on?function(){if(btDev&&btDev.gatt&&btDev.gatt.connected)btDev.gatt.disconnect();btDev=null;setBT(false,'');}:connectBT;}}
function doScan(){var c=(G('scan-inp').value||'').trim();if(c)handleScan(c);}
function handleScan(code){
  var found=null;for(var i=0;i<CACHE.products.length;i++){if(CACHE.products[i].barcode===code){found=CACHE.products[i];break;}}
  if(found){
    dbGetCustomPrice(CU.id,code).then(function(cp){
      var price=cp?cp.price:found.price;
      G('pname-inp').value=found.name;dP=parseFloat(price)||0;dQ=0;updateNFs();
      setScanMsg('✅ '+t('fd')+': '+found.name,1);G('scan-inp').value='';focusScan();
    });
    return;
  }
  setScanMsg(t('onl'),2);
  fetch('https://world.openfoodfacts.org/api/v0/product/'+code+'.json').then(function(r){return r.json();}).then(function(d){
    if(d.status===1&&d.product){
      var p=d.product,name=p.product_name_fr||p.product_name_en||p.product_name||code;
      sb.from('products').insert({barcode:code,name:name,price:0}).then(function(){loadProducts();});
      G('pname-inp').value=name;dP=0;dQ=0;updateNFs();setScanMsg('✅ '+t('fd')+' (API): '+name,1);
    } else {G('pname-inp').value='';setScanMsg('⚠️ '+t('nf')+' ('+code+')',0);}
    G('scan-inp').value='';focusScan();
  }).catch(function(){setScanMsg('⚠️ '+t('nf')+' ('+code+')',0);G('scan-inp').value='';focusScan();});
}
function setScanMsg(msg,st){var el=G('scan-msg');if(!el)return;el.textContent=msg;el.classList.remove('hidden');if(st===2)el.style.cssText='background:#f5f5f5;border:1px solid #ccc;color:#666;padding:10px 12px;border-radius:12px;font-size:13px;margin-bottom:8px';else if(st===1)el.style.cssText='background:#e8f5ee;border:1px solid #1a7a4a;color:#0f5132;padding:10px 12px;border-radius:12px;font-size:13px;margin-bottom:8px';else el.style.cssText='background:#fff3cd;border:1px solid #f0a500;color:#664d03;padding:10px 12px;border-radius:12px;font-size:13px;margin-bottom:8px';}
function saveCP(bc,price){if(!bc||!CU)return;sb.from('custom_prices').upsert({user_id:CU.id,barcode:bc,price:price},{onConflict:'user_id,barcode'}).then(function(){});}
function updateNFs(){var p=G('nf-dp'),q=G('nf-dq');if(p){p.className=dP>0?'nf-val':'nf-ph';p.textContent=dP>0?dP.toFixed(2)+' DH':t('tap');}if(q){q.className=dQ>0?'nf-val':'nf-ph';q.textContent=dQ>0?String(dQ):t('tap');}}

// ====== NUMPAD ======
function openNP(target,label,decimal){npT=target;npD=(decimal!==false);npV='';setText('np-lbl',label||'');G('np-disp').textContent='0';var db=G('np-dot-btn');if(db)db.style.display=npD?'block':'none';var grid=G('np-grid');if(grid){grid.innerHTML='';['7','8','9','4','5','6','1','2','3','C','0','⌫'].forEach(function(k){var b=document.createElement('button');b.className='nk'+(k==='C'?' nk-c':'');b.textContent=k;b.onclick=function(){if(k==='C')npV='';else if(k==='⌫')npV=npV.slice(0,-1);else npV+=k;G('np-disp').textContent=npV||'0';};grid.appendChild(b);});}show('np-ov');}
function npDot(){if(npV.indexOf('.')<0){npV+='.';G('np-disp').textContent=npV||'0';}}
function closeNP(){hide('np-ov');npT=null;npV='';}
function confirmNP(){
  var v=parseFloat(npV)||0,tgt=npT;closeNP();
  if(tgt==='dP'){dP=v;updateNFs();}
  else if(tgt==='dQ'){dQ=v;updateNFs();}
  else if(tgt==='eP'){var it=CACHE.items[eI];if(it){it.price=v;sb.from('project_items').update({price:v}).eq('id',it.id).then(function(){if(it.barcode)saveCP(it.barcode,v);refreshEdit();});}}
  else if(tgt==='eQ'){var it2=CACHE.items[eI];if(it2){it2.quantity=v;sb.from('project_items').update({quantity:v}).eq('id',it2.id).then(function(){refreshEdit();});}}
  else if(tgt&&tgt.indexOf('adj_')===0){var aid=tgt.slice(4);sb.from('adjustments').update({amount:v}).eq('id',aid).then(function(){loadAdjs().then(refreshAdjs);});}
}

// ====== PROJECTS ======
function refreshProjs(){
  if(!CU)return;var list=G('proj-list');if(!list)return;list.innerHTML='<p style="font-size:13px;color:#666">…</p>';
  dbGetProjects(CU.id).then(function(projs){
    list.innerHTML='';
    if(!projs.length){list.innerHTML='<p style="font-size:13px;color:#666">'+(isAr()?'لا توجد مشاريع':'Aucun projet')+'</p>';return;}
    projs.forEach(function(p){
      var nameEl=document.createElement('p');nameEl.style.cssText='font-size:14px;font-weight:600;margin:0 0 2px';nameEl.textContent=p.name;
      var dateEl=document.createElement('p');dateEl.style.cssText='font-size:11px;color:#666;margin:0';dateEl.textContent=new Date(p.updated_at).toLocaleDateString();
      var info=document.createElement('div');info.style.flex='1';info.appendChild(nameEl);info.appendChild(dateEl);
      var btns=document.createElement('div');btns.className='proj-btns';
      var lb=document.createElement('button');lb.className='btn-b';lb.textContent='📂 '+t('ld');lb.onclick=function(){openProject(p);};
      var eb=document.createElement('button');eb.className='btn-b';eb.textContent='✏️';eb.onclick=function(){var n=prompt(isAr()?'الاسم الجديد:':'Nouveau nom:',p.name);if(n&&n.trim()){sb.from('projects').update({name:n.trim(),updated_at:new Date().toISOString()}).eq('id',p.id).then(function(){nameEl.textContent=n.trim();showToast('✅');});}};
      var pb=document.createElement('button');pb.className='btn-grn';pb.textContent='📄 '+t('pd');pb.onclick=function(){pdfForProject(p);};
      var db=document.createElement('button');db.className='btn-r';db.textContent='🗑';db.onclick=function(){if(!confirm(isAr()?'حذف؟':'Supprimer ?'))return;sb.from('projects').delete().eq('id',p.id).then(function(){if(row.parentNode)row.parentNode.removeChild(row);showToast('✅');});};
      btns.appendChild(lb);btns.appendChild(eb);btns.appendChild(pb);btns.appendChild(db);
      var left=document.createElement('div');left.style.flex='1';left.appendChild(info);left.appendChild(btns);
      var row=document.createElement('div');row.className='proj-row';row.appendChild(left);list.appendChild(row);
    });
  });
}
function createProj(){
  var inp=G('proj-inp');var name=(inp?inp.value||'':'').trim();if(!name)return;
  sb.from('projects').insert({user_id:CU.id,name:name}).select().then(function(r){
    if(r.error){showToast('❌ '+r.error.message);return;}
    CP=r.data[0];if(inp)inp.value='';CACHE.items=[];CACHE.adjs=[];dP=0;dQ=0;eI=0;showPage('products');
  });
}
function openProject(p){CP=p;dP=0;dQ=0;eI=0;loadItems().then(function(){loadAdjs().then(function(){showPage('products');});});}
function loadItems(){return dbGetItems(CP.id).then(function(it){CACHE.items=it;return it;});}
function loadAdjs(){return dbGetAdjs(CP.id).then(function(a){CACHE.adjs=a;return a;});}

// ====== PRODUCTS (items in a project) ======
function addProd(){
  var ni=G('pname-inp');var name=(ni?ni.value||'':'').trim();
  if(!name){showToast('❌ '+(isAr()?'أدخل اسم المنتج':'Entrez le nom'));return;}
  var si=G('scan-inp');var bc=(si?si.value||'':'').trim();
  sb.from('project_items').insert({project_id:CP.id,barcode:bc,name:name,price:dP,quantity:dQ}).select().then(function(r){
    if(r.error){showToast('❌ '+r.error.message);return;}
    if(bc&&dP)saveCP(bc,dP);
    sb.from('projects').update({updated_at:new Date().toISOString()}).eq('id',CP.id).then(function(){});
    if(ni)ni.value='';if(si)si.value='';dP=0;dQ=0;updateNFs();hide('scan-msg');
    loadItems().then(function(){eI=CACHE.items.length-1;refreshEdit();updateRT();focusScan();showToast('✅ '+(isAr()?'تمت الإضافة':'Ajouté')+': '+name);});
  });
}
function refreshEdit(){
  var items=CACHE.items;var card=G('edit-card');if(!card)return;
  if(!items.length){card.classList.add('hidden');G('run-total').classList.add('hidden');return;}
  card.classList.remove('hidden');if(eI>=items.length)eI=items.length-1;
  var cur=items[eI];
  setText('edit-title',t('eProd')+' '+(eI+1)+' '+t('of')+' '+items.length);
  var ni=G('edit-name');if(ni){ni.value=cur.name||'';ni.onchange=function(){cur.name=this.value;sb.from('project_items').update({name:this.value}).eq('id',cur.id).then(function(){});};}
  var pr=parseFloat(cur.price)||0,q=parseFloat(cur.quantity)||0;
  var pv=G('nf-ep'),qv=G('nf-eq');
  if(pv){pv.className=pr>0?'nf-val':'nf-ph';pv.textContent=pr>0?pr.toFixed(2)+' DH':t('tap');}
  if(qv){qv.className=q>0?'nf-val':'nf-ph';qv.textContent=q>0?String(q):t('tap');}
  var sub=G('edit-sub'),sv=G('edit-sub-val');if(sub&&sv){if(pr>0&&q>0){sub.classList.remove('hidden');sv.textContent=fmt(pr*q);}else sub.classList.add('hidden');}
}
function prevP(){if(eI>0){eI--;refreshEdit();}}
function nextP(){if(eI<CACHE.items.length-1){eI++;refreshEdit();}}
function delP(){var it=CACHE.items[eI];if(!it)return;sb.from('project_items').delete().eq('id',it.id).then(function(){loadItems().then(function(){if(eI>0&&eI>=CACHE.items.length)eI=CACHE.items.length-1;refreshEdit();updateRT();showToast('✅');});});}
function filterP(q){
  var res=G('psearch-res'),form=G('edit-form');
  if(!q||!q.trim()){if(res)res.classList.add('hidden');if(form)form.style.display='block';return;}
  var items=CACHE.items;var f=items.filter(function(p){return (p.name||'').toLowerCase().indexOf(q.toLowerCase())>=0;});
  if(res){res.classList.remove('hidden');res.innerHTML='';
    if(!f.length)res.innerHTML='<p style="font-size:13px;color:#666;padding:8px 0">—</p>';
    else f.forEach(function(p){var ri=items.indexOf(p);var d=document.createElement('div');d.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:.5px solid #e0e0e0;gap:8px;cursor:pointer';d.innerHTML='<div style="flex:1"><p style="font-size:14px;font-weight:500;margin:0 0 2px">'+esc(p.name)+'</p><p style="font-size:12px;color:#666;margin:0">'+(parseFloat(p.price)||0).toFixed(2)+' DH × '+(parseFloat(p.quantity)||0)+'</p></div><strong style="color:#1a7a4a">'+fmt((parseFloat(p.price)||0)*(parseFloat(p.quantity)||0))+'</strong>';d.onclick=function(){eI=ri;G('psearch').value='';res.classList.add('hidden');if(form)form.style.display='block';refreshEdit();};res.appendChild(d);});
  }
  if(form)form.style.display=q?'none':'block';
}
function updateRT(){var items=CACHE.items;var tot=items.reduce(function(s,p){return s+(parseFloat(p.price)||0)*(parseFloat(p.quantity)||0);},0);var bar=G('run-total'),val=G('rtval');if(items.length>0){if(bar)bar.classList.remove('hidden');if(val)val.textContent=fmt(tot);}else if(bar)bar.classList.add('hidden');}

// ====== ADJUSTMENTS ======
function addAdj(){sb.from('adjustments').insert({project_id:CP.id,description:'',type:'+',amount:0}).then(function(){loadAdjs().then(refreshAdjs);});}
function refreshAdjs(){
  var adjs=CACHE.adjs;var list=G('adj-list');if(!list)return;list.innerHTML='';
  adjs.forEach(function(a){
    var div=document.createElement('div');div.className='adj-item';
    var row=document.createElement('div');row.className='adj-row';
    var sb_=document.createElement('button');sb_.className='adj-sign';sb_.style.background=a.type==='+'?'#e8f5ee':'#ffeaea';sb_.style.color=a.type==='+'?'#1a7a4a':'#d63031';sb_.textContent=a.type;
    sb_.onclick=function(){var nt=a.type==='+'?'-':'+';sb.from('adjustments').update({type:nt}).eq('id',a.id).then(function(){a.type=nt;loadAdjs().then(refreshAdjs);});};
    var inp=document.createElement('input');inp.type='text';inp.className='inp';inp.placeholder=t('adj');inp.value=a.description||'';inp.style.cssText='flex:1;margin-bottom:0';
    inp.onchange=function(){sb.from('adjustments').update({description:this.value}).eq('id',a.id).then(function(){});};
    var db=document.createElement('button');db.style.cssText='width:34px;height:34px;background:transparent;border:none;color:#d63031;font-size:18px;flex-shrink:0;cursor:pointer';db.textContent='✕';
    db.onclick=function(){sb.from('adjustments').delete().eq('id',a.id).then(function(){loadAdjs().then(refreshAdjs);});};
    row.appendChild(sb_);row.appendChild(inp);row.appendChild(db);
    var nf=document.createElement('div');nf.className='num-field';var nl=document.createElement('span');nl.className='nf-label';nl.textContent=t('adj');var nv=document.createElement('span');var am=parseFloat(a.amount)||0;nv.className=am>0?'nf-val':'nf-ph';nv.textContent=am>0?am.toFixed(2)+' DH':t('tap');nf.appendChild(nl);nf.appendChild(nv);
    nf.onclick=function(){openNP('adj_'+a.id,t('adj'),true);};
    div.appendChild(row);div.appendChild(nf);list.appendChild(div);
  });
}
// ====== RECAP ======
function refreshRecap(){
  var items=CACHE.items,adjs=CACHE.adjs;
  var tP=items.reduce(function(s,p){return s+(parseFloat(p.price)||0)*(parseFloat(p.quantity)||0);},0);
  var tA=adjs.reduce(function(s,a){return s+(a.type==='+'?1:-1)*(parseFloat(a.amount)||0);},0);
  var grand=tP+tA;
  var pb=G('recap-ptbody');if(pb){pb.innerHTML='';items.forEach(function(p,i){var pr=parseFloat(p.price)||0,q=parseFloat(p.quantity)||0;var tr=document.createElement('tr');tr.innerHTML='<td style="text-align:center;color:#666;font-size:11px">'+(i+1)+'</td><td>'+esc(p.name||'—')+'</td><td style="text-align:right">'+pr.toFixed(2)+'</td><td style="text-align:center">'+q+'</td><td style="text-align:right;font-weight:600">'+fmt(pr*q)+'</td>';pb.appendChild(tr);});}
  setText('recap-totalp',fmt(tP));
  var ac=G('recap-acard');
  if(adjs.length>0){if(ac)ac.classList.remove('hidden');var ab=G('recap-atbody');if(ab){ab.innerHTML='';adjs.forEach(function(a){var ap=parseFloat(a.amount)||0,col=a.type==='+'?'#1a7a4a':'#d63031';var tr=document.createElement('tr');tr.innerHTML='<td>'+esc(a.description||'—')+'</td><td style="text-align:center;color:'+col+';font-weight:700">'+a.type+'</td><td style="text-align:right;color:'+col+';font-weight:700">'+(a.type==='+'?'+':'-')+ap.toFixed(2)+' DH</td>';ab.appendChild(tr);});}setText('recap-totala',(tA>=0?'+':'')+fmt(tA));show('summ-arow');var av=G('summ-a');if(av){av.textContent=(tA>=0?'+':'')+fmt(tA);av.style.color=tA>=0?'#1a7a4a':'#d63031';}}else{if(ac)ac.classList.add('hidden');hide('summ-arow');}
  setText('summ-p',fmt(tP));setText('grand-val',fmt(grand));
}
function newInv(){if(!confirm(t('nInvQ')))return;CP=null;CACHE.items=[];CACHE.adjs=[];showPage('inventory');}
// PDF (real .pdf) — uses fullname
function pdfForProject(p){var sc=CP,si=CACHE.items,sa=CACHE.adjs;CP=p;Promise.all([dbGetItems(p.id),dbGetAdjs(p.id)]).then(function(res){CACHE.items=res[0];CACHE.adjs=res[1];genPDF();CP=sc;CACHE.items=si;CACHE.adjs=sa;});}
function genPDF(){
  var jsPDFLib=(window.jspdf&&window.jspdf.jsPDF)?window.jspdf.jsPDF:(window.jsPDF||null);
  if(!jsPDFLib){showToast('⚠️ jsPDF non chargé.');return;}
  var items=CACHE.items,adjs=CACHE.adjs;
  var tP=items.reduce(function(s,p){return s+(parseFloat(p.price)||0)*(parseFloat(p.quantity)||0);},0);
  var tA=adjs.reduce(function(s,a){return s+(a.type==='+'?1:-1)*(parseFloat(a.amount)||0);},0);
  var grand=tP+tA,now=new Date().toLocaleDateString('fr-MA');
  var doc=new jsPDFLib({orientation:'portrait',unit:'mm',format:'a4'});var W=210,M=15,y=36;
  doc.setFillColor(26,122,74);doc.rect(0,0,W,28,'F');doc.setTextColor(255,255,255);doc.setFontSize(18);doc.setFont('helvetica','bold');doc.text('L7ssab.ma',M,12);
  doc.setFontSize(11);doc.setFont('helvetica','normal');doc.text((CP?CP.name:'Rapport'),M,20);
  doc.setFontSize(9);doc.text('Genere le '+now+' | par '+(CU?(CU.fullname||CU.username):'-'),M,26);
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
  doc.save('rapport-'+(CP?CP.name:'inv').replace(/\s+/g,'-')+'-'+new Date().toISOString().slice(0,10)+'.pdf');
}

// ====== PROFILE ======
function refreshProfile(){if(!CU)return;var av=G('prof-av');if(av){av.textContent=(CU.fullname||CU.username)[0].toUpperCase();av.style.background=CU.color||'#1a7a4a';}setText('prof-name',CU.fullname||CU.username);var bd=G('prof-badge');if(bd){bd.textContent=CU.role==='admin'?t('rAdm'):t('rUsr');bd.className=CU.role==='admin'?'badge b-admin':'badge b-user';}var ni=G('prof-newname');if(ni)ni.value=CU.fullname||CU.username;}
function updateProf(type){
  if(type==='name'){var n=(G('prof-newname')?G('prof-newname').value||'':'').trim();if(!n)return;sb.from('app_users').update({fullname:n}).eq('id',CU.id).then(function(){CU.fullname=n;setAvatar();showToast('✅ '+t('upd'));refreshProfile();});}
  else{var p=(G('prof-newpin')?G('prof-newpin').value||'':'');var c=(G('prof-confpin')?G('prof-confpin').value||'':'');if(p.length!==6){showToast('❌ PIN 6');return;}if(p!==c){showToast('❌ PIN mismatch');return;}hashPIN(p).then(function(h){sb.from('app_users').update({pin_hash:h}).eq('id',CU.id).then(function(){CU.pin_hash=h;if(G('prof-newpin'))G('prof-newpin').value='';if(G('prof-confpin'))G('prof-confpin').value='';showToast('✅ PIN updated');});});}
}
// ====== INIT ======
setAvatar();applyTR();startScanGuard();setupScanInput();checkUSBDevices();
loadProducts().then(function(){showPage('inventory');});
