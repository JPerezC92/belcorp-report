import ExcelJS from "exceljs";
import path from "path";

// We'll create a local version of cell extraction since we can't import from @app/core in a standalone script
// This is based on the cellValueSchema pattern but simplified for this analysis script
function extractCellValue(cellValue: any): string {
	if (cellValue === null || cellValue === undefined) {
		return "";
	}

	if (typeof cellValue === "string") {
		return cellValue;
	}

	if (typeof cellValue === "number") {
		return String(cellValue);
	}

	if (typeof cellValue === "boolean") {
		return String(cellValue);
	}

	// Handle hyperlink objects with nested rich text
	if (typeof cellValue === "object" && "hyperlink" in cellValue) {
		const text = cellValue.text;
		if (text) {
			if (typeof text === "string") {
				return text;
			}
			if (typeof text === "object" && "richText" in text) {
				return text.richText.map((rt: any) => rt.text || "").join("");
			}
		}
		return "";
	}

	// Handle direct rich text objects
	if (typeof cellValue === "object" && "richText" in cellValue) {
		return cellValue.richText.map((rt: any) => rt.text || "").join("");
	}

	// Fallback for dates and other objects
	if (cellValue instanceof Date) {
		return cellValue.toISOString();
	}

	return String(cellValue);
}

async function analyzeSBIncidentesExcel() {
	console.log("🔍 Analyzing SB INCIDENTES ORDENES SESIONES Excel file...");
	console.log("==========================================================");
	console.log();

	try {
		const excelFile = path.join(
			process.cwd(),
			"files",
			"SB INCIDENTES ORDENES SESIONES.xlsx",
		);

		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.readFile(excelFile);

		console.log(`✅ Workbook loaded successfully`);
		console.log(`📊 Number of worksheets: ${workbook.worksheets.length}`);
		console.log();

		workbook.eachSheet((worksheet, sheetId) => {
			console.log("━".repeat(80));
			console.log(`📄 Sheet ${sheetId}: "${worksheet.name}"`);
			console.log("━".repeat(80));
			console.log(`   Rows: ${worksheet.rowCount}`);
			console.log(`   Columns: ${worksheet.columnCount}`);
			console.log();

			// Extract headers (assuming row 1)
			const headerRow = worksheet.getRow(1);
			const headers: string[] = [];

			headerRow.eachCell((cell, colNumber) => {
				const headerValue = extractCellValue(cell.value);
				headers.push(headerValue);
			});

			console.log("   📋 Column Headers:");
			headers.forEach((header, index) => {
				console.log(`      ${index + 1}. "${header}"`);
			});
			console.log();

			// Show first 5 data rows
			console.log("   📊 Sample Data (first 5 rows):");
			for (
				let rowIndex = 2;
				rowIndex <= Math.min(6, worksheet.rowCount);
				rowIndex++
			) {
				const row = worksheet.getRow(rowIndex);
				const rowData: string[] = [];

				headers.forEach((_, colIndex) => {
					const cell = row.getCell(colIndex + 1);
					const cellValue = extractCellValue(cell.value);
					rowData.push(cellValue);
				});

				console.log(`      Row ${rowIndex}:`);
				headers.forEach((header, index) => {
					const value = rowData[index];
					if (value && value.trim() !== "") {
						console.log(`         ${header}: "${value}"`);
					}
				});
				console.log();
			}

			// Analyze data types
			console.log("   🔬 Data Type Analysis (first 20 rows):");
			const dataTypeAnalysis: { [key: string]: Set<string> } = {};

			for (
				let rowIndex = 2;
				rowIndex <= Math.min(21, worksheet.rowCount);
				rowIndex++
			) {
				const row = worksheet.getRow(rowIndex);

				headers.forEach((header, colIndex) => {
					const cell = row.getCell(colIndex + 1);
					const cellValue = cell.value;
					let dataType = "empty";

					if (cellValue !== null && cellValue !== undefined) {
						if (typeof cellValue === "object" && "hyperlink" in cellValue) {
							dataType = "hyperlink";
						} else if (typeof cellValue === "object" && "richText" in cellValue) {
							dataType = "rich_text";
						} else if (typeof cellValue === "number") {
							dataType = "number";
						} else if (typeof cellValue === "boolean") {
							dataType = "boolean";
						} else if (cellValue instanceof Date) {
							dataType = "date";
						} else if (typeof cellValue === "string") {
							const stringValue = cellValue;
							// Check if it looks like a date
							if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(stringValue)) {
								dataType = "date_string";
							} else if (/^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}/.test(stringValue)) {
								dataType = "datetime_string";
							} else if (/^\d+$/.test(stringValue)) {
								dataType = "numeric_string";
							} else {
								dataType = "string";
							}
						} else {
							dataType = `unknown(${typeof cellValue})`;
						}
					}

					if (!dataTypeAnalysis[header]) {
						dataTypeAnalysis[header] = new Set();
					}
					dataTypeAnalysis[header].add(dataType);
				});
			}

			headers.forEach((header) => {
				const types = Array.from(dataTypeAnalysis[header] || []);
				console.log(`      "${header}": ${types.join(", ")}`);
			});
			console.log();
		});

		console.log("━".repeat(80));
		console.log("📈 Summary:");
		console.log("━".repeat(80));
		workbook.eachSheet((worksheet) => {
			console.log(`   📄 "${worksheet.name}"`);
			console.log(`      - Total records: ${worksheet.rowCount - 1} (excluding header)`);
			console.log(
				`      - Total columns: ${worksheet.getRow(1).cellCount}`,
			);
		});
		console.log();
		console.log("✅ Analysis complete!");
	} catch (error) {
		console.error("❌ Error analyzing Excel file:", error);
		throw error;
	}
}

// Run the analysis
analyzeSBIncidentesExcel().catch(console.error);
