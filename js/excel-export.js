// excel-export.js
window.exportToExcel = function(jsonData, filename = 'export.xlsx') {
  const ws = XLSX.utils.json_to_sheet(jsonData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename);
};
