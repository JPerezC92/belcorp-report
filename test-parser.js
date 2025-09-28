import { readFileSync } from "fs";
import { ParentChildExcelParser } from "./packages/core/dist/index.js";

async function testParser() {
	try {
		console.log("Testing ParentChildExcelParser with REP02 Excel file...");

		// Read the Excel file
		const filePath = "REP02 padre hijo.xlsx";
		const buffer = readFileSync(filePath);
		const arrayBuffer = buffer.buffer.slice(
			buffer.byteOffset,
			buffer.byteOffset + buffer.byteLength,
		);

		// Create parser and parse
		const parser = new ParentChildExcelParser();
		const result = await parser.parseExcel(arrayBuffer, filePath);

		console.log("Parse result:", {
			success: result.success,
			fileName: result.fileName,
			error: result.error,
			sheetName: result.sheet?.name,
			headerCount: result.sheet?.headers.length,
			rowCount: result.sheet?.rows.length,
		});

		if (result.success && result.sheet) {
			console.log("\nHeaders:", result.sheet.headers);
			console.log("\nFirst 3 relationships:");
			result.sheet.rows.slice(0, 3).forEach((row, index) => {
				console.log(`Row ${index + 1}:`, {
					parentId: row.parentRequestId,
					parentLink: row.parentLink,
					childId: row.childRequestId,
					childLink: row.childLink,
				});
			});
		}
	} catch (error) {
		console.error("Test failed:", error);
	}
}

testParser();
