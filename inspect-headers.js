import ExcelJS from "exceljs";
import { readFileSync } from "fs";

async function inspectHeaders() {
	try {
		const filePath = "REP02 padre hijo.xlsx";
		const buffer = readFileSync(filePath);
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer);

		const worksheet = workbook.worksheets[0];
		console.log(`Sheet: ${worksheet.name}`);

		// Get headers from first row
		const headerRow = worksheet.getRow(1);
		console.log("Raw header values:");
		headerRow.eachCell((cell, colNumber) => {
			console.log(
				`Column ${colNumber} (${String.fromCharCode(64 + colNumber)}):`,
				{
					value: cell.value,
					text: cell.text,
					type: typeof cell.value,
				},
			);
		});

		// Try to extract text from rich text
		console.log("\nExtracted header texts:");
		headerRow.eachCell((cell, colNumber) => {
			let headerText = "";
			if (
				cell.value &&
				typeof cell.value === "object" &&
				"richText" in cell.value
			) {
				const richText = cell.value.richText;
				if (Array.isArray(richText)) {
					headerText = richText.map((rt) => rt.text || "").join("");
				}
			} else if (typeof cell.value === "string") {
				headerText = cell.value;
			} else if (cell.text) {
				headerText = cell.text;
			}
			console.log(`Column ${colNumber}: "${headerText}"`);
		});
	} catch (error) {
		console.error("Error:", error);
	}
}

inspectHeaders();
