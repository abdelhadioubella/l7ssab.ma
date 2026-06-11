var CU=requireUser();
buildHeader({title:'📦 L7ssab.ma',role:'user',showLang:false});
function refreshProjs(){
  var list=G('proj-list');if(!list)return;list.innerHTML='<p style="font-size:13px;color:#666">…</p>';
  dbGetProjects(CU.id).then(function(projs){
    list.innerHTML='';
    if(!projs.length){list.innerHTML='<p style="font-size:13px;color:#666">Aucun projet</p>';return;}
    projs.forEach(function(p){
      var nameEl=document.createElement('p');nameEl.style.cssText='font-size:14px;font-weight:600;margin:0 0 2px';nameEl.textContent=p.name;
      var dateEl=document.createElement('p');dateEl.style.cssText='font-size:11px;color:#888;margin:0';dateEl.textContent=new Date(p.updated_at).toLocaleDateString();
      var info=document.createElement('div');info.style.flex='1';info.appendChild(nameEl);info.appendChild(dateEl);
      var btns=document.createElement('div');btns.className='proj-btns';
      var lb=document.createElement('button');lb.className='btn-b';lb.textContent='📂 Charger';lb.onclick=function(){setCurrentProject(p);location.href='products.html';};
      var eb=document.createElement('button');eb.className='btn-b';eb.textContent='✏️';eb.onclick=function(){var n=prompt('Nouveau nom:',p.name);if(n&&n.trim()){sb.from('projects').update({name:n.trim(),updated_at:new Date().toISOString()}).eq('id',p.id).then(function(){nameEl.textContent=n.trim();showToast('✅');});}};
      var pb=document.createElement('button');pb.className='btn-grn';pb.textContent='📄 PDF';pb.onclick=function(){pdfForProjectId(p.id,p.name,CU.fullname||CU.username);};
      var db=document.createElement('button');db.className='btn-r';db.textContent='🗑';db.onclick=function(){if(!confirm('Supprimer ?'))return;sb.from('projects').delete().eq('id',p.id).then(function(){if(row.parentNode)row.parentNode.removeChild(row);showToast('✅');});};
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
    setCurrentProject(r.data[0]);location.href='products.html';
  });
}
refreshProjs();
