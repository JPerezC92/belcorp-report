import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const EXCEL_FILE = 'XD 2025 DATA INFORME MENSUAL - Current Month.xlsx';

async function analyzeMonthlyReportExcel() {
    console.log('🔍 Analyzing Monthly Report Excel file...');
    console.log('==========================================');

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXCEL_FILE);

        console.log(`📊 Workbook loaded successfully`);
        console.log(`📋 Number of worksheets: ${workbook.worksheets.length}`);
        console.log('');

        workbook.eachSheet((worksheet, sheetId) => {
            console.log(`📄 Sheet ${sheetId}: "${worksheet.name}"`);
            console.log(`   - Rows: ${worksheet.rowCount}`);
            console.log(`   - Columns: ${worksheet.columnCount}`);
            console.log('');

            // Analyze first few rows to understand structure
            console.log('   📋 First 5 rows analysis:');
            for (let rowIndex = 1; rowIndex <= Math.min(5, worksheet.rowCount); rowIndex++) {
                const row = worksheet.getRow(rowIndex);
                const rowData: any[] = [];

                row.eachCell((cell, colNumber) => {
                    let cellValue = '';

                    if (cell.value !== null && cell.value !== undefined) {
                        if (typeof cell.value === 'object' && 'richText' in cell.value) {
                            // Handle rich text (hyperlinks)
                            const richText = (cell.value as any).richText;
                            if (Array.isArray(richText)) {
                                cellValue = richText.map((rt: any) => rt.text).join('');
                            }
                        } else if (typeof cell.value === 'object' && 'text' in cell.value) {
                            // Handle hyperlink objects
                            cellValue = (cell.value as any).text || '';
                        } else {
                            cellValue = String(cell.value);
                        }
                    }

                    rowData.push(cellValue);
                });

                console.log(`      Row ${rowIndex}: [${rowData.map(v => `"${v}"`).join(', ')}]`);
            }
            console.log('');
        });

        // Detailed analysis of the main sheet (assuming first sheet)
        const mainSheet = workbook.worksheets[0];
        console.log('🔬 Detailed Analysis of Main Sheet:');
        console.log('=====================================');

        // Get header row (assuming row 1 is headers)
        const headerRow = mainSheet.getRow(1);
        const headers: string[] = [];

        headerRow.eachCell((cell, colNumber) => {
            let headerValue = '';

            if (cell.value !== null && cell.value !== undefined) {
                if (typeof cell.value === 'object' && 'richText' in cell.value) {
                    const richText = (cell.value as any).richText;
                    if (Array.isArray(richText)) {
                        headerValue = richText.map((rt: any) => rt.text).join('');
                    }
                } else if (typeof cell.value === 'object' && 'text' in cell.value) {
                    headerValue = (cell.value as any).text || '';
                } else {
                    headerValue = String(cell.value);
                }
            }

            headers.push(headerValue);
        });

        console.log('📋 Column Headers:');
        headers.forEach((header, index) => {
            console.log(`   ${index + 1}. "${header}"`);
        });
        console.log('');

        // Analyze data types in each column
        console.log('📊 Data Type Analysis (first 10 rows):');
        const dataTypeAnalysis: { [key: string]: Set<string> } = {};

        for (let rowIndex = 2; rowIndex <= Math.min(11, mainSheet.rowCount); rowIndex++) {
            const row = mainSheet.getRow(rowIndex);

            headers.forEach((header, colIndex) => {
                const cell = row.getCell(colIndex + 1);
                let dataType = 'empty';

                if (cell.value !== null && cell.value !== undefined) {
                    if (typeof cell.value === 'object' && 'richText' in cell.value) {
                        dataType = 'rich_text_hyperlink';
                    } else if (typeof cell.value === 'object' && 'text' in cell.value) {
                        dataType = 'hyperlink';
                    } else if (typeof cell.value === 'number') {
                        dataType = 'number';
                    } else if (typeof cell.value === 'boolean') {
                        dataType = 'boolean';
                    } else {
                        const stringValue = String(cell.value);
                        // Check if it looks like a date
                        if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(stringValue)) {
                            dataType = 'date_dd_mm_yyyy';
                        } else if (/^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}/.test(stringValue)) {
                            dataType = 'datetime_dd_mm_yyyy_hh_mm';
                        } else {
                            dataType = 'string';
                        }
                    }
                }

                if (!dataTypeAnalysis[header]) {
                    dataTypeAnalysis[header] = new Set();
                }
                dataTypeAnalysis[header].add(dataType);
            });
        }

        headers.forEach(header => {
            const types = Array.from(dataTypeAnalysis[header] || []);
            console.log(`   "${header}": [${types.join(', ')}]`);
        });

        console.log('');
        console.log('📈 Summary:');
        console.log(`   - Total records: ${mainSheet.rowCount - 1} (excluding header)`);
        console.log(`   - Total columns: ${headers.length}`);
        console.log(`   - Language: Spanish (based on column names)`);

    } catch (error) {
        console.error('❌ Error analyzing Excel file:', error);
    }
}

// Run the analysis
analyzeMonthlyReportExcel().catch(console.error);