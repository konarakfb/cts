// admin.js - admin actions: nodes (buildings/floors/counters), users, filter/export
document.addEventListener('DOMContentLoaded', ()=>{ if (location.pathname.endsWith('admin.html')) initAdminPage(); });

async function initAdminPage(){
  document.getElementById('logoutBtn').addEventListener('click', ()=>auth.signOut());
  document.getElementById('navData').addEventListener('click', ()=>switchSection('sectionData'));
  document.getElementById('navNodes').addEventListener('click', ()=>switchSection('sectionNodes'));
  document.getElementById('navUsers').addEventListener('click', ()=>switchSection('sectionUsers'));
  document.getElementById('navHome').addEventListener('click', ()=>switchSection('sectionHome'));
  document.getElementById('btnFilter').addEventListener('click', loadFilteredEntries);
  document.getElementById('btnExportPdf').addEventListener('click', exportFilteredPdf);
  document.getElementById('btnExportXlsx').addEventListener('click', exportFilteredExcel);

  document.getElementById('createBuildingBtn').addEventListener('click', createBuilding);
  document.getElementById('createFloorBtn').addEventListener('click', createFloor);
  document.getElementById('createCounterBtn').addEventListener('click', createCounter);
  document.getElementById('createUserBtn').addEventListener('click', createUser);

  auth.onAuthStateChanged(async user => {
    if (!user) return window.location = 'index.html';
    const meta = (await db.collection('users').doc(user.uid).get()).data() || {};
    document.getElementById('who').textContent = user.email + ' — ' + (meta.role || 'admin');
  });

  await loadNodesToUI();
  await renderUsersList();
  await renderLeftCounters();
  updateHomeStats();
}

function switchSection(id){
  ['sectionHome','sectionData','sectionNodes','sectionUsers'].forEach(s=>document.getElementById(s).classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

async function loadNodesToUI(){
  // populate selects with buildings, floors, counters
  const bSel = document.getElementById('selectBuilding');
  const fSel = document.getElementById('selectFloor');
  const cSel = document.getElementById('selectCounter');
  [bSel,fSel,cSel].forEach(s=>{ if(s) s.innerHTML=''; });
  if(bSel) bSel.appendChild(new Option('All','all'));
  if(fSel) fSel.appendChild(new Option('All','all'));
  if(cSel) cSel.appendChild(new Option('All','all'));

  const bSnap = await db.collection('buildings').orderBy('name').get();
  const fSnap = await db.collection('floors').orderBy('name').get();
  const cSnap = await db.collection('counters').orderBy('floor').orderBy('name').get();

  bSnap.forEach(d => {
    if (bSel) bSel.appendChild(new Option(d.data().name, d.data().name));
  });
  fSnap.forEach(d => {
    if (fSel) fSel.appendChild(new Option(d.data().name, d.data().name));
  });
  cSnap.forEach(d => {
    const data = d.data();
    if (cSel) cSel.appendChild(new Option(`${data.name} (${data.floor})`, `${data.floor}|||${data.name}`));
  });

  // node creation selects
  const selIds = ['selBuildingForFloor','selBuildingForCounter','selFloorForCounter','newUserBuilding','newUserFloor','newUserCounter'];
  selIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">--</option>';
    bSnap.forEach(b => el.appendChild(new Option(b.data().name,b.data().name)));
    fSnap.forEach(f => el.appendChild(new Option(f.data().name,f.data().name)));
  });
}

async function createBuilding(){
  const name = document.getElementById('newBuildingName').value.trim();
  if(!name) return alert('Enter building name');
  await db.collection('buildings').add({name, createdAt: firebase.firestore.FieldValue.serverTimestamp()});
  alert('Building created');
  document.getElementById('newBuildingName').value = '';
  await loadNodesToUI(); await renderLeftCounters(); updateHomeStats();
}

async function createFloor(){
  const building = document.getElementById('selBuildingForFloor').value;
  const name = document.getElementById('newFloorName').value.trim();
  if(!building || !name) return alert('Select building and enter floor name');
  await db.collection('floors').add({name, building, createdAt: firebase.firestore.FieldValue.serverTimestamp()});
  alert('Floor created');
  document.getElementById('newFloorName').value = '';
  await loadNodesToUI(); await renderLeftCounters(); updateHomeStats();
}

async function createCounter(){
  const building = document.getElementById('selBuildingForCounter').value;
  const floor = document.getElementById('selFloorForCounter').value;
  const name = document.getElementById('newCounterName').value.trim();
  if(!floor || !name) return alert('Select floor and enter counter name');
  await db.collection('counters').add({name, floor, building, createdAt: firebase.firestore.FieldValue.serverTimestamp()});
  alert('Counter created');
  document.getElementById('newCounterName').value = '';
  await loadNodesToUI(); await renderLeftCounters(); updateHomeStats();
}

async function createUser(){
  const email = document.getElementById('newEmail').value.trim();
  const pwd = document.getElementById('newPassword').value.trim();
  const role = document.getElementById('newUserRole').value;
  const building = document.getElementById('newUserBuilding').value;
  const floor = document.getElementById('newUserFloor').value;
  const counter = document.getElementById('newUserCounter').value;
  if(!email || !pwd) return alert('Enter email & password');

  // create auth user via REST (requires apiKey)
  const apiKey = firebaseConfig.apiKey;
  const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({email, password: pwd, returnSecureToken:true})
  });
  const data = await resp.json();
  if (data.error) return alert('Auth create failed: ' + JSON.stringify(data.error));
  // create users doc
  await db.collection('users').doc(data.localId).set({
    email, role, building, floor, counter, createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  alert('User created: ' + email);
  document.getElementById('newEmail').value=''; document.getElementById('newPassword').value='';
  await renderUsersList();
}

async function renderUsersList(){
  const list = document.getElementById('usersList'); list.innerHTML='';
  const snap = await db.collection('users').orderBy('role').get();
  snap.forEach(d => {
    const u = d.data();
    const card = document.createElement('div'); card.className = 'node-card';
    card.innerHTML = `<div><strong>${u.email}</strong><div>Role: ${u.role}</div><div>${u.building||''} ${u.floor||''} ${u.counter||''}</div></div>
      <div><button data-uid="${d.id}" class="delUserBtn danger">Delete</button></div>`;
    list.appendChild(card);
  });
  document.querySelectorAll('.delUserBtn').forEach(b => b.addEventListener('click', async ev => {
    if(!confirm('Delete user doc?')) return;
    const uid = ev.currentTarget.dataset.uid;
    await db.collection('users').doc(uid).delete();
    await renderUsersList();
  }));
}

async function renderLeftCounters(){
  const container = document.getElementById('leftCounters'); container.innerHTML='';
  const snap = await db.collection('counters').orderBy('floor').orderBy('name').get();
  let currentFloor = null;
  snap.forEach(d => {
    const c = d.data();
    const node = document.createElement('button');
    node.className = 'nav-btn';
    node.textContent = `${c.floor} — ${c.name}`;
    node.addEventListener('click', async ()=> {
      // set filters to this floor+counter and show data
      document.getElementById('selectFloor').value = c.floor;
      document.getElementById('selectCounter').value = `${c.floor}|||${c.name}`;
      switchSection('sectionData');
      await loadFilteredEntries();
    });
    container.appendChild(node);
  });
}

async function loadFilteredEntries(){
  const floor = document.getElementById('selectFloor').value;
  const counterComp = document.getElementById('selectCounter').value;
  const from = document.getElementById('fromDate').value;
  const to = document.getElementById('toDate').value;
  // base query
  let q = db.collection('entries').orderBy('timestamp','desc');
  if (floor && floor !== 'all') q = q.where('floor','==',floor);
  if (counterComp && counterComp !== 'all') {
    const parts = counterComp.split('|||');
    if (parts.length === 2) q = q.where('counter','==',parts[1]);
  }
  const snap = await q.get();
  const rows = [];
  snap.forEach(d => {
    const data = d.data();
    if (from && data.date < from) return;
    if (to && data.date > to) return;
    (data.rows||[]).forEach(r => rows.push({
      date: data.date, floor: data.floor, counter: data.counter,
      item: r.item, batch: r.batch, receiving: r.receivingDate,
      mfg: r.mfgDate, expiry: r.expiryDate, shelf: r.shelfLife,
      qty: r.qty, remarks: r.remarks
    }));
  });

  const container = document.getElementById('dataTable');
  container.innerHTML = '';
  const cols = [
    {key:'date',label:'Date'},
    {key:'floor',label:'Floor'},
    {key:'counter',label:'Counter'},
    {key:'item',label:'Item'},
    {key:'batch',label:'Batch No'},
    {key:'receiving',label:'Receiving Date'},
    {key:'mfg',label:'Mfg Date'},
    {key:'expiry',label:'Expiry Date'},
    {key:'shelf',label:'Shelf Life'},
    {key:'qty',label:'Stock Qty'},
    {key:'remarks',label:'Remarks'}
  ];
  if (rows.length) container.appendChild(createTableFromArray(cols, rows));
  else container.textContent = 'No records found';
}

async function exportFilteredPdf(){
  // reuse loadFilteredEntries logic but return rows
  const rows = await collectFilteredRows();
  if (!rows.length) return alert('No data to export');
  window.generatePdfFromRows(rows);
}

async function exportFilteredExcel(){
  const rows = await collectFilteredRows();
  if (!rows.length) return alert('No data to export');
  window.exportToExcel(rows, 'DryStoreExport.xlsx');
}

async function collectFilteredRows(){
  const floor = document.getElementById('selectFloor').value;
  const counterComp = document.getElementById('selectCounter').value;
  const from = document.getElementById('fromDate').value;
  const to = document.getElementById('toDate').value;
  let q = db.collection('entries').orderBy('timestamp','desc');
  if (floor && floor !== 'all') q = q.where('floor','==',floor);
  if (counterComp && counterComp !== 'all') {
    const parts = counterComp.split('|||');
    if (parts.length === 2) q = q.where('counter','==',parts[1]);
  }
  const snap = await q.get();
  const rows = [];
  snap.forEach(d => {
    const data = d.data();
    if (from && data.date < from) return;
    if (to && data.date > to) return;
    (data.rows||[]).forEach(r => rows.push({
      Date: data.date,
      Building: data.building || '',
      Floor: data.floor,
      Counter: data.counter,
      Item: r.item,
      Batch: r.batch,
      'Receiving Date': r.receivingDate,
      'Mfg Date': r.mfgDate,
      'Expiry Date': r.expiryDate,
      'Shelf Life': r.shelfLife,
      'Stock Qty': r.qty,
      Remarks: r.remarks
    }));
  });
  return rows;
}

async function updateHomeStats(){
  const totalEntriesSnap = await db.collection('entries').get();
  const totalEntries = totalEntriesSnap.size;
  const floorsSnap = await db.collection('floors').get();
  const countersSnap = await db.collection('counters').get();
  document.getElementById('homeStats').innerHTML = `<div>Total entries: ${totalEntries}</div><div>Floors: ${floorsSnap.size}</div><div>Counters: ${countersSnap.size}</div>`;
}
