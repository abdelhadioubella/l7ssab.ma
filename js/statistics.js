var CU=requireAdmin();
buildHeader({title:'Statistics',role:'admin',activeTab:'statistics'});
function setBoth(id1,id2,v){setText(id1,String(v));setText(id2,String(v));}
dbCount('products').then(function(n){setBoth('st-prod','st-prod2',n);});
dbCount('projects').then(function(n){setBoth('st-proj','st-proj2',n);});
dbCount('app_users').then(function(n){setBoth('st-users','st-users2',n);});
dbCount('project_items').then(function(n){setText('st-items2',String(n));});
