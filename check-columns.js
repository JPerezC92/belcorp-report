const ExcelJS = require('exceljs');

async function checkColumns() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('XD 2025 DATA INFORME MENSUAL - Current Month.xlsx');
  const worksheet = workbook.getWorksheet('ManageEngine Report Framework');

  const headerRow = worksheet.getRow(1);
  console.log('Excel file columns:');

  for (let i = 1; i <= 30; i++) {
    const cell = headerRow.getCell(i);
    if (cell.value) {
      const columnLetter = String.fromCharCode(64 + i);
      let text = cell.value;
      if (cell.value && cell.value.richText) {
        text = cell.value.richText.map(rt => rt.text).join('');
      }
      console.log(`Column ${columnLetter}: "${text}"`);
    }
  }
}

checkColumns().catch(console.error);