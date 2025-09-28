import ExcelJS from "exceljs";
import { readFileSync } from "fs";

async function inspectRichText() {
	try {
		const filePath = "REP02 padre hijo.xlsx";
		const buffer = readFileSync(filePath);
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer);

		const worksheet = workbook.worksheets[0];
		console.log(`Sheet: ${worksheet.name}`);

		// Inspect the rich text structure in the first data cell
		const cellB2 = worksheet.getRow(2).getCell("B");
		console.log(
			"\nCell B2 raw value:",
			JSON.stringify(cellB2.value, null, 2),
		);
		console.log("Cell B2 text:", cellB2.text);
		console.log("Cell B2 text type:", typeof cellB2.text);

		if (cellB2.text && typeof cellB2.text === "object") {
			console.log("Cell B2 text keys:", Object.keys(cellB2.text));
			if ("richText" in cellB2.text) {
				console.log(
					"Rich text array:",
					JSON.stringify(cellB2.text.richText, null, 2),
				);
			}
		}
	} catch (error) {
		console.error("Error:", error);
	}
}

inspectRichText();
