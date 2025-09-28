import ExcelJS from "exceljs";
import { readFileSync } from "fs";

async function inspectExcel() {
	try {
		const filePath = "REP02 padre hijo.xlsx";
		const buffer = readFileSync(filePath);
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer);

		console.log("Workbook sheets:");
		workbook.worksheets.forEach((sheet, index) => {
			console.log(`${index + 1}. ${sheet.name}`);
		});

		// Assume first sheet
		const worksheet = workbook.worksheets[0];
		console.log(`\nInspecting sheet: ${worksheet.name}`);

		// Get headers from first row
		const headers = [];
		worksheet.getRow(1).eachCell((cell, colNumber) => {
			headers.push(cell.value);
		});
		console.log("Headers:", headers);

		// Get first 5 rows
		console.log("\nFirst 5 rows:");
		for (let i = 2; i <= Math.min(6, worksheet.rowCount); i++) {
			const row = worksheet.getRow(i);
			const rowData = [];
			row.eachCell((cell) => {
				rowData.push(cell.value);
			});
			console.log(`Row ${i}:`, rowData);
		}
	} catch (error) {
		console.error("Error:", error);
	}
}

inspectExcel();
