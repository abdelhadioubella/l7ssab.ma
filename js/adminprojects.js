var CU=requireAdmin();var ALLP=[];
buildHeader({title:'Projects',role:'admin',activeTab:'projects'});
function loadAll(){
  // join projects with user fullname
  sb.from('projects').select('*, app_users(username,fullname)').order('updated_at',{ascending:false}).then(function(r){
    if(r.error){G('admin-proj-list').innerHTML='<p style="color:#d63031">'+r.error.message+'</p>';return;}
    ALLP=r.data||[];render(ALLP);
  });
}
function render(list){
  var c=G('admin-proj-list');if(!c)return;c.innerHTML='';
  if(!list.length){c.innerHTML='<p style="font-size:13px;color:#888">No projects</p>';return;}
  list.forEach(function(p){
    var owner=p.app_users?(p.app_users.fullname||p.app_users.username):'—';
    var row=document.createElement('div');row.className='proj-row';
    var info=document.createElement('div');info.style.flex='1';
    info.innerHTML='<p style="font-size:14px;font-weight:600;margin:0 0 2px">'+esc(p.name)+'</p><p style="font-size:11px;color:#888;margin:0">👤 '+esc(owner)+' · '+new Date(p.updated_at).toLocaleDateString()+'</p>';
    var pb=document.createElement('button');pb.className='btn-grn';pb.textContent='📄 PDF';pb.style.flexShrink='0';
    pb.onclick=function(){pdfForProjectId(p.id,p.name,owner);};
    row.appendChild(info);row.appendChild(pb);c.appendChild(row);
  });
}
function filterProjects(q){if(!q||!q.trim()){render(ALLP);return;}var f=ALLP.filter(function(p){return (p.name||'').toLowerCase().indexOf(q.toLowerCase())>=0;});render(f);}
loadAll();
