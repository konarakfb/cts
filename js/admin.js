// admin.js (basic)
document.addEventListener('DOMContentLoaded', ()=>{ if (location.pathname.endsWith('admin.html')) initAdminPage(); });
async function initAdminPage(){
  document.getElementById('logoutBtn').addEventListener('click', ()=>auth.signOut());
  document.getElementById('navData').addEventListener('click', ()=>switchSection('sectionData'));
  document.getElementById('navNodes').addEventListener('click', ()=>switchSection('sectionNodes'));
  document.getElementById('navUsers').addEventListener('click', ()=>switchSection('sectionUsers'));
  document.getElementById('btnFilter').addEventListener('click', loadFilteredEntries);
  document.getElementById('createBuildingBtn').addEventListener('click', createBuilding);
  document.getElementById('createFloorBtn').addEventListener('click', createFloor);
  document.getElementById('createCounterBtn').addEventListener('click', createCounter);
  document.getElementById('createUserBtn').addEventListener('click', createUser);
  await loadNodesToUI();
  await renderUsersList();
}
function switchSection(id){
  ['sectionData','sectionNodes','sectionUsers'].forEach(s=>document.getElementById(s).classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}
async function loadNodesToUI(){
  const bSel = document.getElementById('selectBuilding'); const fSel = document.getElementById('selectFloor'); const cSel = document.getElementById('selectCounter');
  [bSel,fSel,cSel].forEach(s=>{ if(s) s.innerHTML=''; });
  bSel && bSel.appendChild(new Option('All','all'));
  fSel && fSel.appendChild(new Option('All','all'));
  cSel && cSel.appendChild(new Option('All','all'));
  const floors = await db.collection('floors').orderBy('name').get();
  floors.forEach(d=>{ const name=d.data().name; fSel && fSel.appendChild(new Option(name,name)); });
  const counters = await db.collection('counters').orderBy('floor').orderBy('name').get();
  counters.forEach(d=>{ const data=d.data(); cSel && cSel.appendChild(new Option(data.name+' ('+data.floor+')', data.floor+'|||'+data.name)); });
  // node creation selects
  ['selBuildingForFloor','selBuildingForCounter','selFloorForCounter','newUserBuilding','newUserFloor','newUserCounter'].forEach(id=>{
    const el = document.getElementById(id); if(!el) return; el.innerHTML=''; floors.forEach(f=>el.appendChild(new Option(f.data && f.data().name?f.data().name:f.data().name)));
  });
}
async function loadFilteredEntries(){
  const floor = document.getElementById('selectFloor').value; const counterComp = document.getElementById('selectCounter').value;
  let q = db.collection('entries').orderBy('timestamp','desc');
  if(floor && floor!=='all') q = q.where('floor','==',floor);
  if(counterComp && counterComp!=='all'){ const parts=counterComp.split('|||'); if(parts.length===2 && parts[0]===floor) q = q.where('counter','==',parts[1]); }
  const snap = await q.get(); const rows=[];
  snap.forEach(d=>{ const data=d.data(); (data.rows||[]).forEach(r=>rows.push({date:data.date,floor:data.floor,counter:data.counter,item:r.item,batch:r.batch,receiving:r.receivingDate,mfg:r.mfgDate,expiry:r.expiryDate,shelf:r.shelfLife,qty:r.qty,remarks:r.remarks})); });
  const container = document.getElementById('dataTable'); container.innerHTML=''; const cols=[{key:'date',label:'Date'},{key:'floor',label:'Floor'},{key:'counter',label:'Counter'},{key:'item',label:'Item'},{key:'batch',label:'Batch'},{key:'receiving',label:'Receiving'},{key:'mfg',label:'Mfg'},{key:'expiry',label:'Expiry'},{key:'shelf',label:'Shelf'},{key:'qty',label:'Qty'},{key:'remarks',label:'Remarks'}];
  container.appendChild(createTableFromArray(cols,rows));
}
async function createBuilding(){ const name=document.getElementById('newBuildingName').value.trim(); if(!name) return alert('enter name'); await db.collection('buildings').add({name}); alert('created'); }
async function createFloor(){ const building=document.getElementById('selBuildingForFloor').value; const name=document.getElementById('newFloorName').value.trim(); if(!name||!building) return alert('fill'); await db.collection('floors').add({name,building}); alert('floor created'); }
async function createCounter(){ const building=document.getElementById('selBuildingForCounter').value; const floor=document.getElementById('selFloorForCounter').value; const name=document.getElementById('newCounterName').value.trim(); if(!name||!floor) return alert('fill'); await db.collection('counters').add({name,floor,building}); alert('counter created'); }
async function createUser(){ const email=document.getElementById('newEmail').value.trim(); const pwd=document.getElementById('newPassword').value.trim(); const role=document.getElementById('newUserRole').value; const building=document.getElementById('newUserBuilding').value; const floor=document.getElementById('newUserFloor').value; const counter=document.getElementById('newUserCounter').value; if(!email||!pwd) return alert('fill'); // create auth user via REST
  const apiKey = firebaseConfig.apiKey;
  const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({email,pwd,returnSecureToken:true})});
  alert('User created - refresh list');
}
async function renderUsersList(){ const list=document.getElementById('usersList'); list.innerHTML=''; const snap=await db.collection('users').orderBy('role').get(); snap.forEach(d=>{ const u=d.data(); const card=document.createElement('div'); card.className='card'; card.innerHTML=`<strong>${u.email}</strong><div>Role:${u.role}</div><div>${u.building||''} ${u.floor||''} ${u.counter||''}</div>`; list.appendChild(card); }); }