import ExcelJS from "exceljs";
import { readFileSync } from "fs";

async function inspectCorrectiveExcel() {
	try {
		const filePath = "XD SEMANAL CORRECTIVO.xlsx";
		const buffer = readFileSync(filePath);
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer);

		console.log("=== XD SEMANAL CORRECTIVO.xlsx Analysis ===");
		console.log("Workbook sheets:");
		workbook.worksheets.forEach((sheet, index) => {
			console.log(`${index + 1}. ${sheet.name}`);
		});

		// Inspect each sheet
		for (const worksheet of workbook.worksheets) {
			console.log(`\n=== Inspecting sheet: ${worksheet.name} ===`);
			console.log(`Total rows: ${worksheet.rowCount}`);
			console.log(`Total columns: ${worksheet.columnCount}`);

			// Get headers from first row
			const headers = [];
			worksheet.getRow(1).eachCell((cell, colNumber) => {
				headers.push(cell.value);
			});
			console.log("Headers:", headers);

			// Get first 3 rows of data
			console.log("\nFirst 3 data rows:");
			for (let i = 2; i <= Math.min(4, worksheet.rowCount); i++) {
				const row = worksheet.getRow(i);
				const rowData = [];
				row.eachCell((cell) => {
					rowData.push(cell.value);
				});
				console.log(`Row ${i}:`, rowData);
			}

			// Check for hyperlinks in first few rows
			console.log("\nChecking for hyperlinks in first 3 rows:");
			for (let i = 1; i <= Math.min(4, worksheet.rowCount); i++) {
				const row = worksheet.getRow(i);
				row.eachCell((cell, colNumber) => {
					if (
						cell.value &&
						typeof cell.value === "object" &&
						cell.value.richText
					) {
						console.log(
							`Row ${i}, Col ${colNumber}: Rich text found - ${cell.value.richText.map((rt) => rt.text).join("")}`,
						);
					}
					if (cell.hyperlink) {
						console.log(
							`Row ${i}, Col ${colNumber}: Hyperlink found - ${cell.hyperlink}`,
						);
					}
				});
			}
		}
	} catch (error) {
		console.error("Error:", error);
	}
}

inspectCorrectiveExcel();
