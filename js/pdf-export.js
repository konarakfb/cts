// pdf-export.js - exports rows array to A4 landscape PDF using html2canvas + jsPDF
window.generatePdfFromRows = async function(rows){
  // render a printable layout identical to your CTS format (approx)
  const node = document.createElement('div');
  node.style.width = '1122px';
  node.style.padding = '18px';
  node.style.background = '#fff';
  node.style.position = 'fixed';
  node.style.left = '-9999px';

  node.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      <img src="assets/logo.png" style="height:50px" />
      <div>
        <div style="font-weight:700;font-size:16px">Dry Store Stock Record</div>
        <div style="font-size:11px;color:#666">Konarak F&B — Dry Store</div>
      </div>
    </div>
    <div style="border:1px solid #999;padding:8px;margin-bottom:8px">
      <div style="display:flex;gap:8px">
        <div style="flex:1">Date: ____________________</div>
        <div style="flex:2">Vendor Name: ____________________________</div>
        <div style="flex:1">Vendor Supervisor Name: __________________</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr>
        <th style="border:1px solid #222;padding:6px">S.No</th>
        <th style="border:1px solid #222;padding:6px">Items</th>
        <th style="border:1px solid #222;padding:6px">Batch No.</th>
        <th style="border:1px solid #222;padding:6px">Receiving Date</th>
        <th style="border:1px solid #222;padding:6px">Manufacturing Date</th>
        <th style="border:1px solid #222;padding:6px">Expiry Date</th>
        <th style="border:1px solid #222;padding:6px">Shelf Life</th>
        <th style="border:1px solid #222;padding:6px">Stock Quantity</th>
        <th style="border:1px solid #222;padding:6px">Remarks</th>
      </tr></thead>
      <tbody>
        ${rows.map((r,idx)=>`<tr>
          <td style="border:1px solid #bbb;padding:6px">${idx+1}</td>
          <td style="border:1px solid #bbb;padding:6px">${(r.Item||r.item||'')}</td>
          <td style="border:1px solid #bbb;padding:6px">${(r['Batch No']||r.batch||'')}</td>
          <td style="border:1px solid #bbb;padding:6px">${(r['Receiving Date']||r.receiving||'')}</td>
          <td style="border:1px solid #bbb;padding:6px">${(r['Mfg Date']||r.mfg||'')}</td>
          <td style="border:1px solid #bbb;padding:6px">${(r['Expiry Date']||r.expiry||'')}</td>
          <td style="border:1px solid #bbb;padding:6px">${(r['Shelf Life']||r.shelf||'')}</td>
          <td style="border:1px solid #bbb;padding:6px">${(r['Stock Qty']||r.qty||'')}</td>
          <td style="border:1px solid #bbb;padding:6px">${(r['Remarks']||r.remarks||'')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div style="margin-top:12px;display:flex;justify-content:space-between">
      <div>Vendor PoC : ___________________</div>
      <div>Verified by F&B team : ___________________</div>
    </div>
  `;
  document.body.appendChild(node);
  const canvas = await html2canvas(node, { scale: 2, useCORS: true });
  const img = canvas.toDataURL('image/png');
  const pdf = new window.jspdf.jsPDF({ orientation:'landscape', unit:'pt', format:'a4' });
  const w = pdf.internal.pageSize.getWidth(); const h = pdf.internal.pageSize.getHeight();
  pdf.addImage(img, 'PNG', 0, 0, w, h);
  pdf.save('DryStore_Record.pdf');
  document.body.removeChild(node);
};
