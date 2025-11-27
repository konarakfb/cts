// pdf-export.js placeholder - uses html2canvas + jsPDF
window.generatePdfFromRows = async function(rows){
  const node = document.createElement('div');
  node.style.width = '1122px';
  node.style.padding = '18px';
  node.style.background = '#fff';
  node.style.position = 'fixed';
  node.style.left = '-9999px';
  node.innerHTML = '<div style="font-weight:700">Dry Store Stock Record</div>';
  node.innerHTML += '<table style="width:100%;border-collapse:collapse"><thead><tr><th>S.No</th><th>Item</th><th>Batch</th><th>Receiving</th><th>Mfg</th><th>Expiry</th><th>Shelf</th><th>Qty</th><th>Remarks</th></tr></thead><tbody>';
  rows.forEach((r,i)=>{ node.innerHTML += `<tr><td>${i+1}</td><td>${r.Item||r.item||''}</td><td>${r['Batch No']||r.batch||''}</td><td>${r['Receiving Date']||r.receiving||''}</td><td>${r['Mfg Date']||r.mfg||''}</td><td>${r['Expiry Date']||r.expiry||''}</td><td>${r['Shelf Life']||r.shelf||''}</td><td>${r['Qty']||r.qty||''}</td><td>${r['Remarks']||r.remarks||''}</td></tr>`; });
  node.innerHTML += '</tbody></table>';
  document.body.appendChild(node);
  const canvas = await html2canvas(node, { scale:2 });
  const img = canvas.toDataURL('image/png');
  const pdf = new window.jspdf.jsPDF({orientation:'landscape', unit:'pt', format:'a4'});
  const w = pdf.internal.pageSize.getWidth(); const h = pdf.internal.pageSize.getHeight();
  pdf.addImage(img,'PNG',0,0,w,h);
  pdf.save('DryStore.pdf');
  document.body.removeChild(node);
};