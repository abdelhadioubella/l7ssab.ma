// ============ L7ssab — SINGLE-PAGE USER APP ============
var CU=requireUser();
var CP=null; // current project (loaded when entering a project)
var dP=0,dQ=0,eI=0,npT=null,npV='',npD=true,btDev=null,_scanInputTimer=null,_scanFocusTimer=null;
var CACHE={products:[],items:[],adjs:[]};
var CURSEC='inventory';

buildHeader({title:'📦 L7ssab.ma',role:'user',showLang:true});

// ---- SECTION ROUTER (replaces page navigation) ----
function showSection(name){
  // guard: product/adjustments/recap need a current project
  if((name==='products'||name==='adjustments'||name==='recap')&&!CP){name='inventory';}
  CURSEC=name;
  var secs=['inventory','products','adjustments','recap','profile'];
  secs.forEach(function(s){var el=G('sec-'+s);if(el){if(s===name)el.classList.add('active');else el.classList.remove('active');}});
  var titles={inventory:'📦 L7ssab.ma',products:'📦 '+(CP?CP.name:''),adjustments:t('adj'),recap:t('recap'),profile:t('prof')};
  setText('hdr-title',titles[name]||name);
  applyTR();
  if(name==='inventory')refreshProjs();
  else if(name==='products'){refreshEdit();updateRT();updateNFs();setTimeout(focusScan,120);}
  else if(name==='adjustments')refreshAdjs();
  else if(name==='recap')refreshRecap();
  else if(name==='profile')refreshProfile();
  window.scrollTo(0,0);
}
function backToApp(){showSection('inventory');}

// ---- TRANSLATIONS for all sections ----
function applyTR(){
  // inventory
  setText('t-newproj',t('newProj'));setText('t-createproj',t('cProj'));setText('t-savedproj',t('sProj'));
  var pi=G('proj-inp');if(pi)pi.placeholder=t('projName');
  // products
  setText('t-addprod',t('aProd'));setText('t-search',t('srch'));setText('t-price',t('price'));setText('t-qty',t('qty'));setText('t-addbtn',t('add'));setText('t-runtotal',t('runT'));
  if(G('t-back1'))G('t-back1').textContent=t('back');if(G('t-next1'))G('t-next1').textContent=t('next');
  var sp=G('scan-inp');if(sp)sp.placeholder=t('scanPH');var pn=G('pname-inp');if(pn)pn.placeholder=t('prodName');
  if(G('t-scanner'))G('t-scanner').textContent=t('scanner');
  var ub=G('usb-mini-badge');if(ub&&ub.className.indexOf('b-off')>=0)ub.textContent=t('notDetected');
  var bb=G('bt-mini-btn');if(bb&&!(btDev&&btDev.gatt&&btDev.gatt.connected))bb.textContent=t('connect');
  // adjustments
  setText('t-adjdesc',t('adjD'));setText('t-addline',t('addL'));
  if(G('t-back2'))G('t-back2').textContent=t('back');if(G('t-next2'))G('t-next2').textContent=t('next');
  // recap
  setText('t-prods-title',t('prods'));setText('t-adjs-title',t('adj'));setText('t-totalp',t('tP'));setText('t-totala',t('tA'));setText('t-summp',t('tP'));setText('t-summa',t('tA'));setText('t-grand',t('grand'));setText('t-dlpdf',t('dlPDF'));setText('t-newinv',t('nInv'));
  if(G('t-back3'))G('t-back3').textContent=t('back');
  // profile
  setText('t-chguname',isAr()?'تغيير اسم المستخدم':'Changer le nom d\u2019utilisateur');
  setText('t-chgname',isAr()?'تغيير الاسم الكامل':'Changer le nom complet');
  setText('t-chgpin',t('chp'));setText('t-update0',t('upd'));setText('t-update1',t('upd'));setText('t-update2',t('upd'));
  if(G('t-backapp'))G('t-backapp').textContent=t('back');
}

function loadProducts(){return dbGetProducts().then(function(p){CACHE.products=p;return p;});}
function loadItems(){return CP?dbGetItems(CP.id).then(function(it){CACHE.items=it;return it;}):Promise.resolve([]);}
function loadAdjs(){return CP?dbGetAdjs(CP.id).then(function(a){CACHE.adjs=a;return a;}):Promise.resolve([]);}

// ===== INVENTORY =====
function refreshProjs(){
  var list=G('proj-list');if(!list)return;list.innerHTML='<p style="font-size:13px;color:#666">…</p>';
  dbGetProjects(CU.id).then(function(projs){
    list.innerHTML='';
    if(!projs.length){list.innerHTML='<p style="font-size:13px;color:#888">'+t('noProj')+'</p>';return;}
    projs.forEach(function(p){
      var nameEl=document.createElement('p');nameEl.style.cssText='font-size:14px;font-weight:600;margin:0 0 2px';nameEl.textContent=p.name;
      var dateEl=document.createElement('p');dateEl.style.cssText='font-size:11px;color:#888;margin:0';dateEl.textContent=new Date(p.updated_at).toLocaleDateString();
      var info=document.createElement('div');info.style.flex='1';info.appendChild(nameEl);info.appendChild(dateEl);
      var btns=document.createElement('div');btns.className='proj-btns';
      var lb=document.createElement('button');lb.className='btn-b';lb.textContent='📂 '+t('ld');lb.onclick=function(){CP=p;setCurrentProject(p);dP=0;dQ=0;eI=0;loadItems().then(function(){loadAdjs().then(function(){showSection('products');});});};
      var eb=document.createElement('button');eb.className='btn-b';eb.textContent='✏️';eb.onclick=function(){openModal({title:t('chn'),confirmText:t('upd'),cancelText:t('can'),fields:[{key:'name',label:t('projName'),value:p.name}],onConfirm:function(v){if(!v.name.trim())return;sb.from('projects').update({name:v.name.trim(),updated_at:new Date().toISOString()}).eq('id',p.id).then(function(){closeModal();nameEl.textContent=v.name.trim();showToast('✅ '+t('renamed'));});}});};
      var pb=document.createElement('button');pb.className='btn-grn';pb.textContent='📄 '+t('pd');pb.onclick=function(){pdfForProjectId(p.id,p.name,CU.fullname||CU.username);};
      var db=document.createElement('button');db.className='btn-r';db.textContent='🗑';db.onclick=function(){confirmModal(t('del'),'"'+p.name+'" ?',function(){sb.from('projects').delete().eq('id',p.id).then(function(){if(row.parentNode)row.parentNode.removeChild(row);showToast('✅ '+t('deleted'));});},t('del'));};
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
    CP=r.data[0];setCurrentProject(CP);CACHE.items=[];CACHE.adjs=[];dP=0;dQ=0;eI=0;showSection('products');
  });
}
// ===== PRODUCTS / SCANNER =====



// ===== SCANNER (trust the field, block only navigation side-effects) =====
// The browser already writes the correct barcode into the focused field.
// Our ONLY jobs are: (1) keep the field focused, (2) prevent the parasitic
// Arrow/Clear/Insert keys (NumLock-off numpad) from navigating/moving the page,
// and (3) read the field value when the scan ends (Enter).
function focusScan(){var s=G('scan-inp');if(s){try{s.focus();}catch(e){}}}
function startScanGuard(){
  if(_scanFocusTimer)return;
  _scanFocusTimer=setInterval(function(){
    if(G('np-ov')&&!G('np-ov').classList.contains('hidden'))return;
    var a=document.activeElement,tag=a?a.tagName:'';
    if(tag!=='INPUT'&&tag!=='SELECT'&&tag!=='TEXTAREA')focusScan();
  },400);
}
function endScan(){
  var code=(G('scan-inp')&&G('scan-inp').value||'').trim();
  if(code.length>=3){markUSBconnected();handleScan(code);}
  else if(code.length>0){doSearch();}
}
// Keys that a NumLock-off numpad scanner emits as navigation "noise".
// We must swallow them so they can't move the cursor or navigate the page,
// but we must NOT add anything to the field (the digit characters arrive separately).
function isNavNoise(e){
  if(e.code&&/^Numpad[0-9]$/.test(e.code)){
    // Numpad key with NumLock off → e.key is Arrow/Clear/etc (not a digit).
    // If e.key is already a real digit (NumLock on), let it type normally.
    return !(e.key&&e.key.length===1&&e.key>='0'&&e.key<='9');
  }
  var bad={ArrowLeft:1,ArrowRight:1,ArrowUp:1,ArrowDown:1,Home:1,End:1,PageUp:1,PageDown:1,Insert:1,Delete:1,Clear:1};
  return !!bad[e.key];
}
document.addEventListener('keydown',function(e){
  if(G('np-ov')&&!G('np-ov').classList.contains('hidden'))return;
  var a=document.activeElement,tag=a?a.tagName:'';
  var inScan=(a&&a.id==='scan-inp');
  var inOther=(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA')&&!inScan;
  if(inOther)return; // user typing elsewhere -> leave alone

  // End of scan
  if(e.key==='Enter'||e.code==='NumpadEnter'||e.key==='Tab'){
    e.preventDefault();e.stopPropagation();
    endScan();
    return false;
  }
  // Swallow navigation-noise keys so the page never moves (do NOT modify the field)
  if(isNavNoise(e)){e.preventDefault();e.stopPropagation();return false;}
  // Backspace must not navigate "back" when not in the field
  if(e.key==='Backspace'&&!inScan){e.preventDefault();return;}
  // Make sure scanned digits land in the scan field: if focus drifted, redirect it there
  if(!inScan&&e.key&&e.key.length===1&&e.key>='0'&&e.key<='9'){
    var s=G('scan-inp');if(s){s.focus();}
  }
},true);
function setupScanInput(){
  var s=G('scan-inp');if(!s)return;
  s.addEventListener('input',function(){
    // some scanners append a newline/tab into the value -> treat as end of scan
    if(/[\r\n\t]/.test(s.value)){var vv=s.value.replace(/[\r\n\t]/g,'').trim();s.value=vv;if(vv.length>=3){markUSBconnected();handleScan(vv);return;}}
    onScanInput(s.value); // live suggestions
  });
}
window.addEventListener('focus',function(){setTimeout(focusScan,60);});
function markUSBconnected(){var dot=G('usb-mini-dot'),badge=G('usb-mini-badge');if(dot)dot.style.background='#1a7a4a';if(badge){badge.textContent=(isAr()?'متصل':'Connecté')+' ✅';badge.className='badge b-ok';}}
function checkUSBDevices(){try{if(navigator.hid&&navigator.hid.getDevices){navigator.hid.getDevices().then(function(devs){if(devs&&devs.length>0)markUSBconnected();}).catch(function(){});}}catch(e){}}
function connectBT(){if(!navigator.bluetooth){showToast('Web Bluetooth non supporté.');return;}navigator.bluetooth.requestDevice({acceptAllDevices:true}).then(function(dev){btDev=dev;dev.addEventListener('gattserverdisconnected',function(){btDev=null;setBT(false,'');});setBT(true,dev.name||'BT');showToast('✅ BT');}).catch(function(){});}
function setBT(on,name){var d2=G('bt-mini-dot'),l2=G('bt-mini-lbl'),b2=G('bt-mini-btn');if(d2)d2.style.background=on?'#1a7a4a':'#ccc';if(l2)l2.textContent=on?('Bluetooth · '+(name||(isAr()?'متصل':'Connecté'))):'Bluetooth';if(b2){b2.textContent=on?(isAr()?'قطع':'Déconnecter'):(isAr()?'ربط':'Connecter');b2.onclick=on?function(){if(btDev&&btDev.gatt&&btDev.gatt.connected)btDev.gatt.disconnect();btDev=null;setBT(false,'');}:connectBT;}}
function doScan(){var c=(G('scan-inp').value||'').trim();if(c)handleScan(c);}

// ===== SEARCH BUTTON + LIVE SUGGESTIONS (by name OR barcode, from database) =====
function onScanInput(val){
  val=(val||'').trim();
  if(val.length<1){hideSuggest();return;}
  showSuggest(val);
}
function hideSuggest(){var b=G('scan-suggest');if(b){b.classList.add('hidden');b.innerHTML='';}}
function showSuggest(q){
  var b=G('scan-suggest');if(!b)return;
  var ql=q.toLowerCase();
  var matches=CACHE.products.filter(function(p){
    return ((p.name||'').toLowerCase().indexOf(ql)>=0)||((p.barcode||'').indexOf(q)>=0);
  }).slice(0,8);
  if(!matches.length){hideSuggest();return;}
  b.innerHTML='';
  matches.forEach(function(p){
    var it=document.createElement('div');it.className='suggest-item';
    it.innerHTML='<div style="flex:1;min-width:0"><p class="si-name">'+esc(p.name)+'</p><p class="si-bc">'+esc(p.barcode||'—')+'</p></div><span class="si-price">'+(parseFloat(p.price)||0).toFixed(2)+' DH</span>';
    it.onclick=function(){pickProduct(p);};
    b.appendChild(it);
  });
  b.classList.remove('hidden');
}
// pick a suggestion: fill name + price directly (uses the user's custom price if set)
function pickProduct(p){
  hideSuggest();
  dbGetCustomPrice(CU.id,p.barcode).then(function(cp){
    var price=cp?cp.price:p.price;
    G('pname-inp').value=p.name;dP=parseFloat(price)||0;dQ=0;updateNFs();
    setScanMsg('✅ '+t('fd')+': '+p.name,1);
    var si=G('scan-inp');if(si)si.value=p.barcode||'';  // keep barcode shown
  });
}
// "Rechercher" button: if exact barcode match or single result -> fill; else show list
function doSearch(){
  var q=(G('scan-inp').value||'').trim();if(!q)return;
  // exact barcode first
  for(var i=0;i<CACHE.products.length;i++){if(CACHE.products[i].barcode===q){pickProduct(CACHE.products[i]);return;}}
  var ql=q.toLowerCase();
  var matches=CACHE.products.filter(function(p){return ((p.name||'').toLowerCase().indexOf(ql)>=0)||((p.barcode||'').indexOf(q)>=0);});
  if(matches.length===1){pickProduct(matches[0]);return;}
  if(matches.length>1){showSuggest(q);return;}
  // nothing locally -> treat as a scan/lookup (database miss -> API)
  handleScan(q);
}
function handleScan(code){
  hideSuggest&&hideSuggest();
  // Always WRITE the scanned barcode into the field and keep it there.
  var si=G('scan-inp');if(si)si.value=code;
  var found=null;for(var i=0;i<CACHE.products.length;i++){if(CACHE.products[i].barcode===code){found=CACHE.products[i];break;}}
  if(found){
    dbGetCustomPrice(CU.id,code).then(function(cp){
      var price=cp?cp.price:found.price;
      G('pname-inp').value=found.name;dP=parseFloat(price)||0;dQ=0;updateNFs();
      setScanMsg('✅ '+t('fd')+': '+found.name,1);
      // keep barcode shown; do not clear
    });
    return;
  }
  setScanMsg('🔎 '+t('onl'),2);
  fetch('https://world.openfoodfacts.org/api/v0/product/'+code+'.json').then(function(r){return r.json();}).then(function(d){
    if(d.status===1&&d.product){
      var p=d.product,name=p.product_name_fr||p.product_name_en||p.product_name||code;
      sb.from('products').insert({barcode:code,name:name,price:0}).then(function(){loadProducts();});
      G('pname-inp').value=name;dP=0;dQ=0;updateNFs();setScanMsg('✅ '+t('apiF')+': '+name,1);
    } else {
      G('pname-inp').value='';setScanMsg('⚠️ '+t('nf')+' ('+code+')',0);
    }
    // keep barcode shown
  }).catch(function(){setScanMsg('⚠️ Pas de connexion ('+code+')',0);});
}
function setScanMsg(msg,st){var el=G('scan-msg');if(!el)return;el.textContent=msg;el.classList.remove('hidden');if(st===2)el.style.cssText='background:#f5f5f5;border:1px solid #ccc;color:#666;padding:10px 12px;border-radius:12px;font-size:13px;margin-bottom:8px';else if(st===1)el.style.cssText='background:#e8f5ee;border:1px solid #1a7a4a;color:#0f5132;padding:10px 12px;border-radius:12px;font-size:13px;margin-bottom:8px';else el.style.cssText='background:#fff3cd;border:1px solid #f0a500;color:#664d03;padding:10px 12px;border-radius:12px;font-size:13px;margin-bottom:8px';}
function saveCP(bc,price){if(!bc)return;sb.from('custom_prices').upsert({user_id:CU.id,barcode:bc,price:price},{onConflict:'user_id,barcode'}).then(function(){});}
function updateNFs(){var p=G('nf-dp'),q=G('nf-dq');if(p){p.className=dP>0?'nf-val':'nf-ph';p.textContent=dP>0?dP.toFixed(2)+' DH':t('tap');}if(q){q.className=dQ>0?'nf-val':'nf-ph';q.textContent=dQ>0?String(dQ):t('tap');}}
// numpad
function openNP(target,label,decimal){npT=target;npD=(decimal!==false);npV='';setText('np-lbl',label||'');G('np-disp').textContent='0';var db=G('np-dot-btn');if(db)db.style.display=npD?'block':'none';var grid=G('np-grid');if(grid){grid.innerHTML='';['7','8','9','4','5','6','1','2','3','C','0','⌫'].forEach(function(k){var b=document.createElement('button');b.className='nk'+(k==='C'?' nk-c':'');b.textContent=k;b.onclick=function(){if(k==='C')npV='';else if(k==='⌫')npV=npV.slice(0,-1);else npV+=k;G('np-disp').textContent=npV||'0';};grid.appendChild(b);});}show('np-ov');}
function npDot(){if(npV.indexOf('.')<0){npV+='.';G('np-disp').textContent=npV||'0';}}
function closeNP(){hide('np-ov');npT=null;npV='';}
function confirmNP(){var v=parseFloat(npV)||0,tgt=npT;closeNP();if(tgt==='dP'){dP=v;updateNFs();}else if(tgt==='dQ'){dQ=v;updateNFs();}else if(tgt==='eP'){var it=CACHE.items[eI];if(it){it.price=v;sb.from('project_items').update({price:v}).eq('id',it.id).then(function(){if(it.barcode)saveCP(it.barcode,v);refreshEdit();});}}else if(tgt==='eQ'){var it2=CACHE.items[eI];if(it2){it2.quantity=v;sb.from('project_items').update({quantity:v}).eq('id',it2.id).then(function(){refreshEdit();});}}}
// items
function addProd(){var ni=G('pname-inp');var name=(ni?ni.value||'':'').trim();if(!name){showToast('❌ '+t('enterName'));return;}var si=G('scan-inp');var bc=(si?si.value||'':'').trim();sb.from('project_items').insert({project_id:CP.id,barcode:bc,name:name,price:dP,quantity:dQ}).select().then(function(r){if(r.error){showToast('❌ '+r.error.message);return;}if(bc&&dP)saveCP(bc,dP);sb.from('projects').update({updated_at:new Date().toISOString()}).eq('id',CP.id).then(function(){});if(ni)ni.value='';if(si)si.value='';dP=0;dQ=0;updateNFs();hide('scan-msg');hideSuggest();loadItems().then(function(){eI=CACHE.items.length-1;refreshEdit();updateRT();focusScan();showToast('✅ '+t('added')+': '+name);});});}
function refreshEdit(){var items=CACHE.items;var card=G('edit-card');if(!card)return;if(!items.length){card.classList.add('hidden');G('run-total').classList.add('hidden');return;}card.classList.remove('hidden');if(eI>=items.length)eI=items.length-1;var cur=items[eI];setText('edit-title',t('eProd')+' '+(eI+1)+' '+t('of')+' '+items.length);var ni=G('edit-name');if(ni){ni.value=cur.name||'';ni.onchange=function(){cur.name=this.value;sb.from('project_items').update({name:this.value}).eq('id',cur.id).then(function(){});};}var pr=parseFloat(cur.price)||0,q=parseFloat(cur.quantity)||0;var pv=G('nf-ep'),qv=G('nf-eq');if(pv){pv.className=pr>0?'nf-val':'nf-ph';pv.textContent=pr>0?pr.toFixed(2)+' DH':t('tap');}if(qv){qv.className=q>0?'nf-val':'nf-ph';qv.textContent=q>0?String(q):t('tap');}var sub=G('edit-sub'),sv=G('edit-sub-val');if(sub&&sv){if(pr>0&&q>0){sub.classList.remove('hidden');sv.textContent=fmt(pr*q);}else sub.classList.add('hidden');}}
function prevP(){if(eI>0){eI--;refreshEdit();}}
function nextP(){if(eI<CACHE.items.length-1){eI++;refreshEdit();}}
function delP(){var it=CACHE.items[eI];if(!it)return;sb.from('project_items').delete().eq('id',it.id).then(function(){loadItems().then(function(){if(eI>0&&eI>=CACHE.items.length)eI=CACHE.items.length-1;refreshEdit();updateRT();showToast('✅');});});}
function filterP(q){var res=G('psearch-res'),form=G('edit-form');if(!q||!q.trim()){if(res)res.classList.add('hidden');if(form)form.style.display='block';return;}var items=CACHE.items;var f=items.filter(function(p){return (p.name||'').toLowerCase().indexOf(q.toLowerCase())>=0;});if(res){res.classList.remove('hidden');res.innerHTML='';if(!f.length)res.innerHTML='<p style="font-size:13px;color:#666;padding:8px 0">—</p>';else f.forEach(function(p){var ri=items.indexOf(p);var d=document.createElement('div');d.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:.5px solid #e0e0e0;gap:8px;cursor:pointer';d.innerHTML='<div style="flex:1"><p style="font-size:14px;font-weight:500;margin:0 0 2px">'+esc(p.name)+'</p><p style="font-size:12px;color:#888;margin:0">'+(parseFloat(p.price)||0).toFixed(2)+' DH × '+(parseFloat(p.quantity)||0)+'</p></div><strong style="color:#1a7a4a">'+fmt((parseFloat(p.price)||0)*(parseFloat(p.quantity)||0))+'</strong>';d.onclick=function(){eI=ri;G('psearch').value='';res.classList.add('hidden');if(form)form.style.display='block';refreshEdit();};res.appendChild(d);});}if(form)form.style.display=q?'none':'block';}
function updateRT(){var items=CACHE.items;var tot=items.reduce(function(s,p){return s+(parseFloat(p.price)||0)*(parseFloat(p.quantity)||0);},0);var bar=G('run-total'),val=G('rtval');if(items.length>0){if(bar)bar.classList.remove('hidden');if(val)val.textContent=fmt(tot);}else if(bar)bar.classList.add('hidden');}
// init
document.addEventListener('click',function(e){var b=G('scan-suggest');if(!b||b.classList.contains('hidden'))return;if(!e.target.closest('#scan-suggest')&&e.target.id!=='scan-inp')hideSuggest();}); // click outside suggest
// ===== ADJUSTMENTS =====
function addAdj(){sb.from('adjustments').insert({project_id:CP.id,description:'',type:'+',amount:0}).then(function(){loadAdjs().then(refreshAdjs);});}
function refreshAdjs(){var adjs=CACHE.adjs;var list=G('adj-list');if(!list)return;list.innerHTML='';adjs.forEach(function(a){var div=document.createElement('div');div.className='adj-item';var row=document.createElement('div');row.className='adj-row';var sg=document.createElement('button');sg.className='adj-sign';sg.style.background=a.type==='+'?'#e8f5ee':'#ffeaea';sg.style.color=a.type==='+'?'#1a7a4a':'#d63031';sg.textContent=a.type;sg.onclick=function(){var nt=a.type==='+'?'-':'+';sb.from('adjustments').update({type:nt}).eq('id',a.id).then(function(){a.type=nt;loadAdjs().then(refreshAdjs);});};var inp=document.createElement('input');inp.type='text';inp.className='inp';inp.placeholder=t('adj');inp.value=a.description||'';inp.style.cssText='flex:1;margin-bottom:0';inp.onchange=function(){sb.from('adjustments').update({description:this.value}).eq('id',a.id).then(function(){});};var db=document.createElement('button');db.style.cssText='width:34px;height:34px;background:transparent;border:none;color:#d63031;font-size:18px;flex-shrink:0;cursor:pointer';db.textContent='✕';db.onclick=function(){sb.from('adjustments').delete().eq('id',a.id).then(function(){loadAdjs().then(refreshAdjs);});};row.appendChild(sg);row.appendChild(inp);row.appendChild(db);var nf=document.createElement('div');nf.className='num-field';var nl=document.createElement('span');nl.className='nf-label';nl.textContent=t('adj');var nv=document.createElement('span');var am=parseFloat(a.amount)||0;nv.className=am>0?'nf-val':'nf-ph';nv.textContent=am>0?am.toFixed(2)+' DH':t('tap');nf.appendChild(nl);nf.appendChild(nv);nf.onclick=function(){openNP('adj_'+a.id,t('adj'),true);};div.appendChild(row);div.appendChild(nf);list.appendChild(div);});}
function openNP(target,label,decimal){npT=target;npD=(decimal!==false);npV='';setText('np-lbl',label||'');G('np-disp').textContent='0';var db=G('np-dot-btn');if(db)db.style.display=npD?'block':'none';var grid=G('np-grid');if(grid){grid.innerHTML='';['7','8','9','4','5','6','1','2','3','C','0','⌫'].forEach(function(k){var b=document.createElement('button');b.className='nk'+(k==='C'?' nk-c':'');b.textContent=k;b.onclick=function(){if(k==='C')npV='';else if(k==='⌫')npV=npV.slice(0,-1);else npV+=k;G('np-disp').textContent=npV||'0';};grid.appendChild(b);});}show('np-ov');}
function npDot(){if(npV.indexOf('.')<0){npV+='.';G('np-disp').textContent=npV||'0';}}
function closeNP(){hide('np-ov');npT=null;npV='';}
function confirmNP(){var v=parseFloat(npV)||0,tgt=npT;closeNP();if(tgt&&tgt.indexOf('adj_')===0){var aid=tgt.slice(4);sb.from('adjustments').update({amount:v}).eq('id',aid).then(function(){loadAdjs().then(refreshAdjs);});}}
loadAdjs().then(refreshAdjs);
// ===== RECAP =====
function refreshRecap(){var items=CACHE.items,adjs=CACHE.adjs;var tP=items.reduce(function(s,p){return s+(parseFloat(p.price)||0)*(parseFloat(p.quantity)||0);},0);var tA=adjs.reduce(function(s,a){return s+(a.type==='+'?1:-1)*(parseFloat(a.amount)||0);},0);var grand=tP+tA;var pb=G('recap-ptbody');if(pb){pb.innerHTML='';items.forEach(function(p,i){var pr=parseFloat(p.price)||0,q=parseFloat(p.quantity)||0;var tr=document.createElement('tr');tr.innerHTML='<td style="text-align:center;color:#888;font-size:11px">'+(i+1)+'</td><td>'+esc(p.name||'—')+'</td><td style="text-align:right">'+pr.toFixed(2)+'</td><td style="text-align:center">'+q+'</td><td style="text-align:right;font-weight:600">'+fmt(pr*q)+'</td>';pb.appendChild(tr);});}setText('recap-totalp',fmt(tP));var ac=G('recap-acard');if(adjs.length>0){if(ac)ac.classList.remove('hidden');var ab=G('recap-atbody');if(ab){ab.innerHTML='';adjs.forEach(function(a){var ap=parseFloat(a.amount)||0,col=a.type==='+'?'#1a7a4a':'#d63031';var tr=document.createElement('tr');tr.innerHTML='<td>'+esc(a.description||'—')+'</td><td style="text-align:center;color:'+col+';font-weight:700">'+a.type+'</td><td style="text-align:right;color:'+col+';font-weight:700">'+(a.type==='+'?'+':'-')+ap.toFixed(2)+' DH</td>';ab.appendChild(tr);});}setText('recap-totala',(tA>=0?'+':'')+fmt(tA));show('summ-arow');var av=G('summ-a');if(av){av.textContent=(tA>=0?'+':'')+fmt(tA);av.style.color=tA>=0?'#1a7a4a':'#d63031';}}else{if(ac)ac.classList.add('hidden');hide('summ-arow');}setText('summ-p',fmt(tP));setText('grand-val',fmt(grand));}
function genPDF(){generatePDF(CP,CACHE.items,CACHE.adjs,CU.fullname||CU.username,LANG);}
function newInv(){confirmModal(t('nInv'),t('nInvQ'),function(){clearCurrentProject();location.href='inventory.html';},t('ok'));}
function genPDF(){generatePDF(CP,CACHE.items,CACHE.adjs,CU.fullname||CU.username,LANG);}
function newInv(){confirmModal(t('nInv'),t('nInvQ'),function(){CP=null;clearCurrentProject();CACHE.items=[];CACHE.adjs=[];showSection('inventory');},t('ok'));}
// ===== PROFILE =====
var isAdmin=false;
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

// ===== INIT =====
document.addEventListener('click',function(e){var b=G('scan-suggest');if(!b||b.classList.contains('hidden'))return;if(!e.target.closest('#scan-suggest')&&e.target.id!=='scan-inp')hideSuggest();});
startScanGuard();setupScanInput();checkUSBDevices();
loadProducts().then(function(){
  // resume a project if one was active, else show inventory
  var cp=getCurrentProject();
  if(cp){CP=cp;loadItems().then(function(){loadAdjs().then(function(){showSection('inventory');});});}
  else{showSection('inventory');}
});
