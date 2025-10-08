import { promises as fs } from "fs";
import ExcelJS from "exceljs";
import path from "path";

async function debugWarRoomCells(): Promise<void> {
	const filePath = path.join(process.cwd(), "files", "EDWarRooms2025.xlsx");
	const fileBuffer = await fs.readFile(filePath);

	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(fileBuffer.buffer);

	const worksheet = workbook.getWorksheet("Warrooms");
	if (!worksheet) {
		console.error("Sheet 'Warrooms' not found");
		return;
	}

	// Check first data row (row 2)
	const row = worksheet.getRow(2);
	const columns = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];

	console.log("Inspecting Row 2 cells:\n");

	columns.forEach((col) => {
		const cell = row.getCell(col);
		console.log(`Column ${col}:`);
		console.log(`  Type: ${typeof cell.value}`);
		console.log(`  Value:`, JSON.stringify(cell.value, null, 2));
		console.log();
	});
}

debugWarRoomCells();
