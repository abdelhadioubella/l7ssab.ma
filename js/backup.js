var CU=requireAdmin();
buildHeader({title:'Backup',role:'admin',activeTab:'backup'});
function logB(msg){var l=G('backup-log');if(l)l.textContent=msg;}
function dl(filename,text,mime){var blob=new Blob([text],{type:mime||'text/plain;charset=utf-8'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},100);}
function csvEscape(v){v=(v==null?'':String(v));if(/[",;\n]/.test(v))return '"'+v.replace(/"/g,'""')+'"';return v;}
function today(){return new Date().toISOString().slice(0,10);}

function exportProducts(fmt){
  dbGetProducts().then(function(p){
    if(fmt==='json'){dl('products-'+today()+'.json',JSON.stringify(p,null,2),'application/json');}
    else{var rows=['barcode,name,price'];p.forEach(function(x){rows.push([csvEscape(x.barcode),csvEscape(x.name),csvEscape(x.price)].join(','));});dl('products-'+today()+'.csv',rows.join('\n'),'text/csv');}
    logB('✅ '+p.length+' products exported');
  });
}
function exportUsers(fmt){
  dbGetUsers().then(function(u){
    if(fmt==='json'){dl('users-'+today()+'.json',JSON.stringify(u,null,2),'application/json');}
    else{var rows=['username,fullname,role,color'];u.forEach(function(x){rows.push([csvEscape(x.username),csvEscape(x.fullname),csvEscape(x.role),csvEscape(x.color)].join(','));});dl('users-'+today()+'.csv',rows.join('\n'),'text/csv');}
    logB('✅ '+u.length+' users exported (PIN hashes only in JSON)');
  });
}
function exportFull(){
  Promise.all([dbGetProducts(),dbGetUsers()]).then(function(r){
    // also projects/items/adjustments
    Promise.all([
      sb.from('projects').select('*').limit(100000),
      sb.from('project_items').select('*').limit(100000),
      sb.from('adjustments').select('*').limit(100000),
      sb.from('custom_prices').select('*').limit(100000)
    ]).then(function(rr){
      var backup={version:1,exported_at:new Date().toISOString(),
        products:r[0],app_users:r[1],
        projects:(rr[0].data||[]),project_items:(rr[1].data||[]),adjustments:(rr[2].data||[]),custom_prices:(rr[3].data||[])};
      dl('l7ssab-full-backup-'+today()+'.json',JSON.stringify(backup,null,2),'application/json');
      logB('✅ Full backup downloaded');
    });
  });
}
function readFile(file,cb){var r=new FileReader();r.onload=function(e){cb(e.target.result||'');};r.readAsText(file);}
function parseProductsFile(text,name){
  if(/\.json$/i.test(name)||text.trim().charAt(0)==='['){
    try{var arr=JSON.parse(text);return arr.map(function(x){return {barcode:x.barcode||'',name:x.name,price:parseFloat(x.price)||0};}).filter(function(x){return x.name;});}catch(e){return null;}
  }
  // CSV
  var lines=text.split(/\r\n|\n|\r/),out=[],start=0;
  if(lines[0]&&/barcode|code|name|nom|price|prix/i.test(lines[0]))start=1;
  for(var i=start;i<lines.length;i++){var ln=lines[i].trim();if(!ln)continue;var c=ln.split(/[,;]/);if(c.length<2)continue;var nm=(c[1]||'').replace(/^"|"$/g,'').trim();if(!nm)continue;out.push({barcode:(c[0]||'').replace(/^"|"$/g,'').trim(),name:nm,price:parseFloat((c[2]||'0').replace(/^"|"$/g,'').replace(',','.'))||0});}
  return out;
}
function importProducts(file){if(!file)return;readFile(file,function(text){var rows=parseProductsFile(text,file.name);if(!rows||!rows.length){logB('❌ File empty or invalid');return;}logB('⏳ Importing '+rows.length+'…');sb.from('products').insert(rows).then(function(r){if(r.error){logB('❌ '+r.error.message);return;}logB('✅ '+rows.length+' products imported');});G('imp-prod').value='';});}
function importUsers(file){if(!file)return;readFile(file,function(text){var arr;try{arr=JSON.parse(text);}catch(e){logB('❌ Users import must be JSON');return;}var rows=arr.map(function(x){return {username:x.username,fullname:x.fullname||x.username,role:x.role||'user',pin_hash:x.pin_hash,color:x.color||'#1a7a4a'};}).filter(function(x){return x.username&&x.pin_hash;});if(!rows.length){logB('❌ No valid users (need username + pin_hash)');return;}logB('⏳ Importing users…');sb.from('app_users').upsert(rows,{onConflict:'username'}).then(function(r){if(r.error){logB('❌ '+r.error.message);return;}logB('✅ '+rows.length+' users imported');});G('imp-users').value='';});}
function importFull(file){if(!file)return;readFile(file,function(text){var b;try{b=JSON.parse(text);}catch(e){logB('❌ Invalid JSON');return;}confirmModal('Restore full backup','This will ADD all data from the backup (existing kept). Continue?',function(){var steps=[];if(b.products&&b.products.length)steps.push(sb.from('products').upsert(b.products.map(function(x){return {id:x.id,barcode:x.barcode||'',name:x.name,price:x.price};}),{onConflict:'id'}));if(b.app_users&&b.app_users.length)steps.push(sb.from('app_users').upsert(b.app_users,{onConflict:'username'}));if(b.projects&&b.projects.length)steps.push(sb.from('projects').upsert(b.projects,{onConflict:'id'}));if(b.project_items&&b.project_items.length)steps.push(sb.from('project_items').upsert(b.project_items,{onConflict:'id'}));if(b.adjustments&&b.adjustments.length)steps.push(sb.from('adjustments').upsert(b.adjustments,{onConflict:'id'}));if(b.custom_prices&&b.custom_prices.length)steps.push(sb.from('custom_prices').upsert(b.custom_prices,{onConflict:'id'}));logB('⏳ Restoring…');Promise.all(steps).then(function(){logB('✅ Full backup restored');}).catch(function(e){logB('❌ '+(e.message||'error'));});},'Restore');G('imp-full').value='';});}
