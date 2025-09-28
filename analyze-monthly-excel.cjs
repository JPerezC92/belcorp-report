const ExcelJS = require('exceljs');

async function analyzeExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('XD 2025 DATA INFORME MENSUAL - Current Month.xlsx');

  console.log('=== EXCEL FILE ANALYSIS ===');
  console.log('Total sheets:', workbook.worksheets.length);
  console.log('');

  workbook.worksheets.forEach((sheet) => {
    console.log('Sheet Name:', sheet.name);
    console.log('Row count:', sheet.rowCount);
    console.log('Column count:', sheet.columnCount);
    console.log('');

    // Get headers from first row
    const headerRow = sheet.getRow(1);
    if (headerRow) {
      console.log('Headers:');
      headerRow.eachCell({ includeEmpty: false }, (cell, colNum) => {
        const value = cell.value;
        let displayValue = value;
        if (value && typeof value === 'object') {
          if (value.richText) {
            displayValue = value.richText.map(rt => rt.text).join('');
          } else if (value.text) {
            displayValue = value.text;
          }
        }
        console.log(`  Column ${colNum}: "${displayValue}"`);
      });
    }

    console.log('');
    console.log('First 5 data rows sample:');
    for (let i = 2; i <= Math.min(6, sheet.rowCount); i++) {
      const row = sheet.getRow(i);
      console.log(`Row ${i}:`);

      // Show first few columns of data
      for (let col = 1; col <= Math.min(5, sheet.columnCount); col++) {
        const cell = row.getCell(col);
        const headerCell = headerRow.getCell(col);
        let header = headerCell.value;
        if (header && typeof header === 'object' && header.richText) {
          header = header.richText.map(rt => rt.text).join('');
        }

        let value = cell.value;
        let type = typeof value;
        let displayValue = value;

        if (value && typeof value === 'object') {
          if (value.hyperlink) {
            type = 'hyperlink';
            displayValue = `${value.text || value} -> ${value.hyperlink}`;
          } else if (value.richText) {
            type = 'richText';
            displayValue = value.richText.map(rt => rt.text).join('');
          } else if (value instanceof Date) {
            type = 'date';
            displayValue = value.toISOString();
          }
        }

        console.log(`  ${header}: ${displayValue} (${type})`);
      }
    }

    // Check for hyperlinks
    console.log('');
    console.log('Checking for hyperlinks in data:');
    for (let rowNum = 2; rowNum <= Math.min(5, sheet.rowCount); rowNum++) {
      const row = sheet.getRow(rowNum);
      row.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (cell.value && cell.value.hyperlink) {
          const headerCell = headerRow.getCell(colNum);
          let header = headerCell.value;
          if (header && typeof header === 'object' && header.richText) {
            header = header.richText.map(rt => rt.text).join('');
          }
          console.log(`  Row ${rowNum}, Column "${header}": ${cell.value.hyperlink}`);
        }
      });
    }
  });
}

analyzeExcel().catch(console.error);