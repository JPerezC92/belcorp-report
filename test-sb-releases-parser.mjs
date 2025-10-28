import ExcelJS from "exceljs";
import { DateTime } from "luxon";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXPECTED_SHEET_NAME = "Hoja3";
const EXPECTED_HEADERS = {
	SEMANA: "SEMANA",
	APLICACIÓN: "APLICACIÓN",
	FECHA: "FECHA",
	RELEASE: "RELEASE",
	NUM_TICKETS: "# TICKETS",
};

/**
 * Extract cell value safely (handles rich text, hyperlinks, etc.)
 */
function extractCellValue(cellValue) {
	if (cellValue === null || cellValue === undefined) {
		return "";
	}

	// Handle rich text format
	if (cellValue.richText && Array.isArray(cellValue.richText)) {
		return cellValue.richText.map((t) => t.text).join("");
	}

	// Handle hyperlink format with nested rich text
	if (cellValue.text && typeof cellValue.text === "object" && cellValue.text.richText) {
		return cellValue.text.richText.map((t) => t.text).join("");
	}

	// Handle simple hyperlink format
	if (cellValue.text) {
		return cellValue.text;
	}

	// Handle primitive values
	return String(cellValue);
}

/**
 * Extract hyperlink from cell
 */
function extractHyperlink(cellValue) {
	if (cellValue && typeof cellValue === "object" && cellValue.hyperlink) {
		return cellValue.hyperlink;
	}
	return null;
}

/**
 * Parse SB Operational Releases from Excel file
 */
async function parseSBReleases() {
	const excelFilePath = join(__dirname, "files", "SB INCIDENTES ORDENES SESIONES.xlsx");
	console.log("📂 Reading Excel file:", excelFilePath);
	console.log("═".repeat(80));

	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.readFile(excelFilePath);

	// Find Sheet 3 "Hoja3"
	const worksheet = workbook.getWorksheet(EXPECTED_SHEET_NAME);
	if (!worksheet) {
		console.error(`❌ Sheet "${EXPECTED_SHEET_NAME}" not found!`);
		console.log("Available sheets:", workbook.worksheets.map((ws) => ws.name));
		return;
	}

	console.log(`✅ Found sheet: "${EXPECTED_SHEET_NAME}"`);
	console.log(`📊 Total rows: ${worksheet.rowCount}`);
	console.log("═".repeat(80));

	// Read headers
	const headerRow = worksheet.getRow(1);
	const headers = [];

	headerRow.eachCell((cell, colNumber) => {
		const headerValue = extractCellValue(cell.value).trim();
		headers[colNumber - 1] = headerValue;
	});

	console.log("📋 Headers found:", headers.join(" | "));
	console.log("═".repeat(80));

	// Find column indices
	const colIndices = {
		semana: headers.findIndex((h) => h.toUpperCase() === EXPECTED_HEADERS.SEMANA),
		aplicacion: headers.findIndex((h) => h.toUpperCase() === EXPECTED_HEADERS.APLICACIÓN),
		fecha: headers.findIndex((h) => h.toUpperCase() === EXPECTED_HEADERS.FECHA),
		release: headers.findIndex((h) => h.toUpperCase() === EXPECTED_HEADERS.RELEASE),
		numTickets: headers.findIndex((h) => h === EXPECTED_HEADERS.NUM_TICKETS),
	};

	console.log("📍 Column indices:", colIndices);
	console.log("═".repeat(80));

	// Validate required columns
	if (colIndices.aplicacion === -1 || colIndices.fecha === -1 || colIndices.release === -1) {
		console.error("❌ Missing required columns!");
		return;
	}

	const allReleases = [];
	const releases2025 = [];
	const errors = [];
	const warnings = [];

	// Parse data rows (starting from row 2)
	for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
		const row = worksheet.getRow(rowIndex);

		// Skip empty rows
		if (!row.hasValues) {
			continue;
		}

		try {
			// Extract SEMANA (week)
			let week = null;
			if (colIndices.semana !== -1) {
				const semanaCell = row.getCell(colIndices.semana + 1);
				const semanaValue = semanaCell.value;

				if (typeof semanaValue === "number") {
					week = semanaValue;
				} else if (typeof semanaValue === "string") {
					const parsed = Number.parseInt(semanaValue, 10);
					if (!Number.isNaN(parsed)) {
						week = parsed;
					}
				}
			}

			// Extract APLICACIÓN
			const applicationCell = row.getCell(colIndices.aplicacion + 1);
			const application = extractCellValue(applicationCell.value).trim();

			if (!application) {
				errors.push({ row: rowIndex, field: "APLICACIÓN", message: "Application is required" });
				continue;
			}

			// Extract FECHA (date)
			const fechaCell = row.getCell(colIndices.fecha + 1);
			const fechaValue = fechaCell.value;

			let date;
			let dateObj;
			if (fechaValue instanceof Date) {
				dateObj = fechaValue;
				date = fechaValue.toISOString();
			} else if (typeof fechaValue === "string") {
				const parsedDate = new Date(fechaValue);
				if (!Number.isNaN(parsedDate.getTime())) {
					dateObj = parsedDate;
					date = parsedDate.toISOString();
				} else {
					errors.push({ row: rowIndex, field: "FECHA", message: "Invalid date format", value: fechaValue });
					continue;
				}
			} else {
				errors.push({ row: rowIndex, field: "FECHA", message: "Date is required", value: fechaValue });
				continue;
			}

			// Extract RELEASE (with link)
			const releaseCell = row.getCell(colIndices.release + 1);
			const releaseVersion = extractCellValue(releaseCell.value).trim();
			const releaseLink = extractHyperlink(releaseCell.value);

			if (!releaseVersion) {
				errors.push({ row: rowIndex, field: "RELEASE", message: "Release version is required" });
				continue;
			}

			// Extract # TICKETS (with link)
			let tickets = null;
			if (colIndices.numTickets !== -1) {
				const ticketsCell = row.getCell(colIndices.numTickets + 1);
				const ticketsValue = extractCellValue(ticketsCell.value).trim();
				tickets = ticketsValue || null;
			}

			const release = {
				row: rowIndex,
				week,
				application,
				date,
				dateObj,
				releaseVersion,
				releaseLink,
				tickets,
			};

			allReleases.push(release);

			// Filter for 2025
			const releaseDate = DateTime.fromJSDate(dateObj, { zone: "utc" });
			if (releaseDate.year === 2025) {
				releases2025.push(release);
			}
		} catch (error) {
			errors.push({
				row: rowIndex,
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}

	console.log("\n📊 PARSING RESULTS:");
	console.log("═".repeat(80));
	console.log(`✅ Total releases found: ${allReleases.length}`);
	console.log(`📅 Releases in 2025: ${releases2025.length}`);
	console.log(`❌ Errors: ${errors.length}`);
	console.log(`⚠️  Warnings: ${warnings.length}`);
	console.log("═".repeat(80));

	if (errors.length > 0) {
		console.log("\n❌ ERRORS:");
		console.log("═".repeat(80));
		errors.forEach((err) => {
			console.log(`Row ${err.row}: [${err.field || "GENERAL"}] ${err.message}`);
			if (err.value !== undefined) {
				console.log(`   Value: ${JSON.stringify(err.value)}`);
			}
		});
		console.log("═".repeat(80));
	}

	console.log("\n📅 RELEASES IN 2025:");
	console.log("═".repeat(80));
	console.log(`\n${"Row".padEnd(6)} | ${"Week".padEnd(6)} | ${"Application".padEnd(25)} | ${"Date".padEnd(12)} | ${"Release".padEnd(20)} | ${"Tickets".padEnd(15)}`);
	console.log("-".repeat(120));

	releases2025
		.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
		.forEach((rel) => {
			const dateStr = DateTime.fromJSDate(rel.dateObj, { zone: "utc" }).toFormat("dd MMM yyyy");
			const weekStr = rel.week !== null ? String(rel.week) : "N/A";
			const ticketsStr = rel.tickets || "-";

			console.log(
				`${String(rel.row).padEnd(6)} | ${weekStr.padEnd(6)} | ${rel.application.padEnd(25)} | ${dateStr.padEnd(12)} | ${rel.releaseVersion.padEnd(20)} | ${ticketsStr.padEnd(15)}`
			);
		});

	console.log("-".repeat(120));
	console.log(`\n✅ Total 2025 releases: ${releases2025.length}`);

	// Show unique releases (deduplicated by application + date + version)
	const uniqueKey = (rel) => `${rel.application}|${rel.date}|${rel.releaseVersion}`;
	const uniqueReleases = Array.from(
		new Map(releases2025.map((rel) => [uniqueKey(rel), rel])).values()
	);

	console.log(`🔑 Unique releases (after deduplication): ${uniqueReleases.length}`);
	console.log("═".repeat(80));

	// Show year distribution
	console.log("\n📊 YEAR DISTRIBUTION:");
	console.log("═".repeat(80));
	const yearCounts = new Map();
	allReleases.forEach((rel) => {
		const year = DateTime.fromJSDate(rel.dateObj, { zone: "utc" }).year;
		yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
	});

	Array.from(yearCounts.entries())
		.sort(([a], [b]) => a - b)
		.forEach(([year, count]) => {
			console.log(`${year}: ${count} releases`);
		});
	console.log("═".repeat(80));
}

// Run the parser
parseSBReleases().catch((err) => {
	console.error("💥 Fatal error:", err);
	process.exit(1);
});
