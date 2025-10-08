import { promises as fs } from "fs";
import ExcelJS from "exceljs";
import path from "path";

async function debugAllDates(): Promise<void> {
	const filePath = path.join(process.cwd(), "files", "EDWarRooms2025.xlsx");
	const fileBuffer = await fs.readFile(filePath);

	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(fileBuffer.buffer);

	const worksheet = workbook.getWorksheet("Warrooms");
	if (!worksheet) {
		console.error("Sheet 'Warrooms' not found");
		return;
	}

	console.log("First 10 dates from Excel:\n");

	for (let i = 2; i <= Math.min(11, worksheet.rowCount); i++) {
		const row = worksheet.getRow(i);
		const dateCell = row.getCell("B");
		const incidentCell = row.getCell("C");

		console.log(`Row ${i}:`);
		console.log(`  Date cell value: ${JSON.stringify(dateCell.value)}`);
		console.log(`  Date cell text: ${dateCell.text}`);
		console.log(`  Incident: ${typeof incidentCell.value === 'object' && incidentCell.value !== null ? (incidentCell.value as any).text : incidentCell.value}`);
		console.log();
	}
}

debugAllDates();
