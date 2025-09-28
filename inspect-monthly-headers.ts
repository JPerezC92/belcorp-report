import ExcelJS from "exceljs";
import { readFileSync } from "fs";

async function inspectMonthlyReportHeaders() {
	const filePath = "XD 2025 DATA INFORME MENSUAL - Current Month.xlsx";

	console.log("Inspecting monthly report headers...");

	const workbook = new ExcelJS.Workbook();
	const buffer = readFileSync(filePath);
	await workbook.xlsx.load(
		buffer.buffer.slice(
			buffer.byteOffset,
			buffer.byteOffset + buffer.byteLength
		)
	);

	const worksheet = workbook.getWorksheet("ManageEngine Report Framework");
	if (!worksheet) {
		console.error("Sheet not found");
		return;
	}

	const rows = worksheet.getSheetValues();
	if (!rows || rows.length < 2) {
		console.error("No data rows");
		return;
	}

	console.log("Header row raw data:");
	const headerRow = rows[1] as unknown[];
	headerRow.forEach((cellValue, index) => {
		const columnLetter = String.fromCharCode(65 + index);
		console.log(`Column ${columnLetter} (${index + 1}):`, cellValue);

		// Test the new extraction logic
		let extracted = "";
		if (typeof cellValue === "string") {
			extracted = cellValue;
		} else if (cellValue && typeof cellValue === "object") {
			const obj = cellValue as Record<string, unknown>;
			if (obj["richText"] && Array.isArray(obj["richText"])) {
				const richText = obj["richText"] as unknown[];
				extracted = richText
					.map((rt) => {
						const rtObj = rt as Record<string, unknown>;
						return typeof rtObj["text"] === "string"
							? rtObj["text"]
							: String(rtObj["text"] ?? "");
					})
					.join("");
			} else if (obj["text"] && typeof obj["text"] === "string") {
				extracted = obj["text"];
			} else if (obj["result"] && typeof obj["result"] === "string") {
				extracted = obj["result"];
			} else if (obj["value"] && typeof obj["value"] === "string") {
				extracted = obj["value"];
			} else {
				extracted = String(cellValue ?? "");
			}
		} else {
			extracted = String(cellValue ?? "");
		}

		console.log(`  -> Extracted: "${extracted}"`);
	});
}

inspectMonthlyReportHeaders().catch(console.error);
