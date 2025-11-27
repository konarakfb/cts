// utils.js - small helpers
function createTableFromArray(columns, rows) {
  const table = document.createElement('table');
  table.className = 'table';
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  columns.forEach(c => {
    const th = document.createElement('th'); th.textContent = c.label; tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach(r => {
    const tr = document.createElement('tr');
    columns.forEach(c => {
      const td = document.createElement('td'); td.textContent = (r[c.key] === undefined ? '' : r[c.key]); tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function formatDateISO(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toISOString().slice(0,10);
}
