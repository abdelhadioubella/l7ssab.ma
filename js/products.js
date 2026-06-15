var CU=requireUser();
var CP=requireProject();
var dP=0,dQ=0,eI=0,npT=null,npV='',npD=true,btDev=null,_scanInputTimer=null,_scanFocusTimer=null;
var CACHE={products:[],items:[]};
buildHeader({title:'📦 '+CP.name,role:'user',showLang:true});
function applyTR(){
  setText('t-addprod',t('aProd'));setText('t-search',t('srch'));setText('t-price',t('price'));setText('t-qty',t('qty'));setText('t-addbtn',t('add'));setText('t-runtotal',t('runT'));
  if(G('t-back1'))G('t-back1').textContent=t('back');if(G('t-next1'))G('t-next1').textContent=t('next');
  var sp=G('scan-inp');if(sp)sp.placeholder=t('scanPH');var pn=G('pname-inp');if(pn)pn.placeholder=t('prodName');
  if(G('t-scanner'))G('t-scanner').textContent=t('scanner');
  var ub=G('usb-mini-badge');if(ub&&ub.className.indexOf('b-off')>=0)ub.textContent=t('notDetected');
  var bb=G('bt-mini-btn');if(bb&&!(btDev&&btDev.gatt&&btDev.gatt.connected))bb.textContent=t('connect');
  updateNFs();refreshEdit();
}
applyTR();

function loadProducts(){return dbGetProducts().then(function(p){CACHE.products=p;return p;});}
function loadItems(){return dbGetItems(CP.id).then(function(it){CACHE.items=it;return it;});}

// ===== SCANNER (simple & reliable) =====
// The scan input behaves like Notepad: the scanner types into it naturally.
// We keep the field focused, detect Enter (end of scan) and validate.
function focusScan(){var s=G('scan-inp');if(s){try{s.focus();}catch(e){}}}
function startScanGuard(){
  if(_scanFocusTimer)return;
  // keep the scan field focused whenever nothing else is being edited
  _scanFocusTimer=setInterval(function(){
    if(G('np-ov')&&!G('np-ov').classList.contains('hidden'))return;
    var a=document.activeElement,tag=a?a.tagName:'';
    if(tag!=='INPUT'&&tag!=='SELECT'&&tag!=='TEXTAREA')focusScan();
  },400);
}
function setupScanInput(){
  var s=G('scan-inp');if(!s)return;
  // Enter inside the field = end of scan
  s.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key==='Tab'){
      e.preventDefault();
      var code=(s.value||'').trim();
      if(code.length>=3){markUSBconnected();handleScan(code);}
      else if(code.length>0){doSearch();}
    }
  });
  // some scanners send the terminator as a newline character in the value
  s.addEventListener('input',function(){
    if(/[\r\n\t]/.test(s.value)){
      var vv=s.value.replace(/[\r\n\t]/g,'').trim();s.value=vv;
      if(vv.length>=3){markUSBconnected();handleScan(vv);return;}
    }
    onScanInput(s.value);
  });
}
// Block Backspace/Enter from navigating the browser "back" only when NOT in a text field
document.addEventListener('keydown',function(e){
  var a=document.activeElement,tag=a?a.tagName:'';
  var editable=(tag==='INPUT'||tag==='TEXTAREA'||(a&&a.isContentEditable));
  if(!editable&&(e.key==='Backspace')){e.preventDefault();}
});
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
startScanGuard();setupScanInput();checkUSBDevices();
loadProducts().then(function(){loadItems().then(function(){eI=Math.max(0,CACHE.items.length-1);refreshEdit();updateRT();updateNFs();setTimeout(focusScan,150);});});
