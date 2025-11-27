// js/manager.js
document.addEventListener('DOMContentLoaded', ()=>{ if (location.pathname.endsWith('manager.html')) initManager(); });

async function initManager(){
  document.getElementById('logoutBtn').addEventListener('click', ()=>auth.signOut());
  auth.onAuthStateChanged(async user => {
    if (!user) return window.location = 'index.html';
    const metaDoc = await db.collection('users').doc(user.uid).get();
    if(!metaDoc.exists) return alert('User meta missing');
    const meta = metaDoc.data();
    document.getElementById('managerInfo').textContent = `${user.email} — ${meta.building || ''} ${meta.floor || ''}`;
    const snap = await db.collection('entries').where('floor','==',meta.floor).orderBy('timestamp','desc').get();
    const rows = [];
    snap.forEach(d => {
      const data = d.data();
      (data.rows||[]).forEach(r => rows.push({Date: data.date, Counter: data.counter, Item: r.item, Qty: r.qty}));
    });
    const container = document.getElementById('mgrData'); container.innerHTML = '';
    if (rows.length) container.appendChild(createTableFromArray([
      {key:'Date',label:'Date'},{key:'Counter',label:'Counter'},{key:'Item',label:'Item'},{key:'Qty',label:'Qty'}
    ], rows)); else container.textContent = 'No entries';
  });
}
