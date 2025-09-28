import { DateTime } from "luxon";

// Test date parsing
console.log("\n=== Testing Date Parsing ===");
const testDate = "22/09/2025 09:49";
const parsed = DateTime.fromFormat(testDate, "dd/MM/yyyy HH:mm", {
	locale: "en",
});
console.log(`Parsing "${testDate}" with "dd/MM/yyyy HH:mm":`, {
	valid: parsed.isValid,
	value: parsed.toISO(),
	weekday: parsed.weekday,
	weekNumber: parsed.weekNumber,
});

const now = DateTime.now();
console.log("Current date:", now.toISO());
console.log("Current week start (Monday):", now.startOf("week").toISO());
console.log("Current week end (Sunday):", now.endOf("week").toISO());

const isCurrent = parsed >= now.startOf("week") && parsed <= now.endOf("week");
console.log("Is current week:", isCurrent);

function extractCellValueAndLink(cell) {
	let cellValue = "";
	let cellLink = "";

	console.log("Processing cell:", {
		value: cell.value,
		text: cell.text,
		textType: typeof cell.text,
	});

	// Extract cell value, handling different types including rich text
	if (cell.value === null || cell.value === undefined) {
		console.log("Case: null/undefined");
		cellValue = "";
	} else if (typeof cell.value === "string") {
		console.log("Case: string");
		cellValue = cell.value;
	} else if (
		typeof cell.value === "object" &&
		cell.value &&
		"text" in cell.value &&
		typeof cell.value.text === "object" &&
		cell.value.text &&
		"richText" in cell.value.text
	) {
		console.log("Case: hyperlink rich text");
		// Handle hyperlink cells with rich text in value.text.richText
		const richText = cell.value.text.richText;
		console.log("Rich text array:", richText);
		cellValue = Array.isArray(richText)
			? richText
					.map((rt) => {
						const text = rt.text;
						console.log("Rich text item:", rt, "text:", text);
						return typeof text === "string"
							? text
							: String(text ?? "");
					})
					.join("")
			: String(cell.value.text);
		console.log("Extracted value:", cellValue);
	} else if (
		typeof cell.value === "object" &&
		cell.value &&
		"richText" in cell.value
	) {
		console.log("Case: direct rich text");
		// Handle rich text directly in cell.value
		const richText = cell.value.richText;
		cellValue = Array.isArray(richText)
			? richText
					.map((rt) =>
						typeof rt.text === "string"
							? rt.text
							: String(rt.text ?? ""),
					)
					.join("")
			: String(cell.value);
	} else if (Array.isArray(cell.value)) {
		console.log("Case: array");
		// Handle array values
		cellValue = cell.value
			.map((v) => (typeof v === "string" ? v : String(v ?? "")))
			.join(" ");
	} else {
		console.log("Case: other type");
		// Handle numbers, booleans, dates, etc.
		cellValue = String(cell.value);
	}

	// Fallback to cell.text if we still don't have a good value
	if (!cellValue || cellValue.trim() === "") {
		console.log("Using fallback to cell.text");
		if (typeof cell.text === "string") {
			cellValue = cell.text;
		} else if (
			cell.text &&
			typeof cell.text === "object" &&
			cell.text !== null &&
			"richText" in cell.text
		) {
			// Handle rich text in cell.text
			const richText = cell.text.richText;
			cellValue = Array.isArray(richText)
				? richText
						.map((rt) => {
							const text = rt.text;
							return typeof text === "string"
								? text
								: String(text ?? "");
						})
						.join("")
				: String(cell.text);
		}
	}

	// Check if this is a hyperlink cell
	if (
		cell.value &&
		typeof cell.value === "object" &&
		"hyperlink" in cell.value
	) {
		const hyperlinkObj = cell.value;
		cellLink = hyperlinkObj.hyperlink;
	}

	console.log("Final result:", { value: cellValue.trim(), link: cellLink });
	return { value: cellValue.trim(), link: cellLink };
}

async function inspectData() {
	try {
		const filePath = "XD SEMANAL CORRECTIVO.xlsx";
		const buffer = readFileSync(filePath);
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer);

		const worksheet = workbook.worksheets[0];
		console.log(`Sheet: ${worksheet.name}`);

		// Inspect headers
		console.log("\nHeaders:");
		const headerRow = worksheet.getRow(1);
		["B", "C", "D", "E", "F", "G", "H"].forEach((col) => {
			const cell = headerRow.getCell(col);
			console.log(`${col}1: "${cell.text}"`);
		});

		// Inspect first data row
		console.log("\nData row (columns B and C):");
		const row = worksheet.getRow(2);
		const cellB = row.getCell("B");
		const cellC = row.getCell("C");
		const cellD = row.getCell("D");
		const cellE = row.getCell("E");

		console.log("\n=== Processing Cell B ===");
		const dataB = extractCellValueAndLink(cellB);
		console.log("Cell B result:", dataB);

		console.log("\n=== Processing Cell C ===");
		const dataC = extractCellValueAndLink(cellC);
		console.log("Cell C result:", dataC);

		console.log("\n=== Processing Cell D ===");
		const dataD = extractCellValueAndLink(cellD);
		console.log("Cell D result:", dataD);

		console.log("\n=== Processing Cell E (Created Time) ===");
		const dataE = extractCellValueAndLink(cellE);
		console.log("Cell E result:", dataE);
	} catch (error) {
		console.error("Error:", error);
	}
}

inspectData();
