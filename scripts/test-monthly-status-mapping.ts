/**
 * Test script to debug Monthly Report Status Mapping
 * Tests the status mapping logic with the actual Excel file
 */

import { getDatabase, TABLE_NAMES, initializeDatabase } from "@app/database";
import ExcelJS from "exceljs";
import * as fs from "node:fs";
import * as path from "node:path";

interface StatusMappingRule {
	id: number;
	sourceStatus: string;
	targetStatus: string;
	patternType: "exact" | "contains" | "regex";
	priority: number;
	active: boolean;
}

function testPattern(
	pattern: string,
	text: string,
	patternType: "exact" | "contains" | "regex"
): boolean {
	const normalizedText = text.toLowerCase().trim();
	const normalizedPattern = pattern.toLowerCase().trim();

	switch (patternType) {
		case "exact":
			return normalizedText === normalizedPattern;
		case "regex":
			try {
				return new RegExp(pattern, "i").test(text);
			} catch (error) {
				console.warn(`Invalid regex pattern: ${pattern}`, error);
				return false;
			}
		case "contains":
		default:
			return normalizedText.includes(normalizedPattern);
	}
}

async function main() {
	console.log("=".repeat(80));
	console.log("MONTHLY REPORT STATUS MAPPING TEST");
	console.log("=".repeat(80));
	console.log("");

	// Initialize database
	console.log("🔧 Initializing database...");
	await initializeDatabase();
	console.log("✓ Database initialized");
	console.log("");

	// 1. Get active status mapping rules from database
	const db = getDatabase();
	const rulesQuery = `
		SELECT id, sourceStatus, targetStatus, patternType, priority, active
		FROM ${TABLE_NAMES.MONTHLY_REPORT_STATUS_MAPPING_RULES}
		WHERE active = 1
		ORDER BY priority ASC
	`;

	const rulesResult = db.exec(rulesQuery);
	const rules: StatusMappingRule[] = [];

	if (rulesResult[0] && rulesResult[0].values) {
		for (const row of rulesResult[0].values) {
			rules.push({
				id: row[0] as number,
				sourceStatus: row[1] as string,
				targetStatus: row[2] as string,
				patternType: row[3] as "exact" | "contains" | "regex",
				priority: row[4] as number,
				active: Boolean(row[5]),
			});
		}
	}

	console.log("📋 Active Status Mapping Rules:");
	console.log("-".repeat(80));
	if (rules.length === 0) {
		console.log("❌ No active rules found!");
	} else {
		for (const rule of rules) {
			console.log(
				`  Rule ${rule.id}: "${rule.sourceStatus}" (${rule.patternType}) -> "${rule.targetStatus}" [Priority: ${rule.priority}]`
			);
		}
	}
	console.log("");

	// 2. Read Excel file
	const excelPath = path.join(
		process.cwd(),
		"files",
		"XD 2025 DATA INFORME MENSUAL - Current Month.xlsx"
	);

	if (!fs.existsSync(excelPath)) {
		console.error(`❌ Excel file not found: ${excelPath}`);
		return;
	}

	console.log(`📂 Reading Excel file: ${excelPath}`);
	console.log("");

	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.readFile(excelPath);

	const worksheet = workbook.worksheets.find(
		(s) => s.name === "ManageEngine Report Framework"
	);

	if (!worksheet) {
		console.error('❌ Sheet "ManageEngine Report Framework" not found');
		return;
	}

	console.log(`✓ Found worksheet: ${worksheet.name}`);
	console.log("");

	// 3. First, let's see what the headers are
	console.log("📊 Excel Headers:");
	console.log("-".repeat(80));
	const headerRow = worksheet.getRow(1);
	for (let col = 1; col <= 30; col++) {
		const cell = headerRow.getCell(col);
		let value = "";
		if (cell.value && typeof cell.value === "object" && "text" in cell.value) {
			value = String(cell.value.text);
		} else if (cell.value) {
			value = String(cell.value);
		}
		if (value) {
			console.log(`  Column ${String.fromCharCode(64 + col)} (index ${col}): "${value}"`);
		}
	}
	console.log("");

	// 4. Test status mapping on first 10 rows
	console.log("🧪 Testing Status Mapping on Excel Rows:");
	console.log("=".repeat(80));

	let rowsTested = 0;
	const maxRows = 10;

	// Find the Request Status column index
	let requestStatusColIndex = 0;
	for (let col = 1; col <= 30; col++) {
		const cell = headerRow.getCell(col);
		let value = "";
		if (cell.value && typeof cell.value === "object" && "text" in cell.value) {
			value = String(cell.value.text);
		} else if (cell.value) {
			value = String(cell.value);
		}
		if (value === "Request Status") {
			requestStatusColIndex = col;
			break;
		}
	}

	if (!requestStatusColIndex) {
		console.error('❌ "Request Status" column not found!');
		return;
	}

	console.log(`✓ Found "Request Status" column at index ${requestStatusColIndex} (Column ${String.fromCharCode(64 + requestStatusColIndex)})`);
	console.log("");

	for (let rowIndex = 2; rowIndex <= worksheet.rowCount && rowsTested < maxRows; rowIndex++) {
		const row = worksheet.getRow(rowIndex);

		// Get Request Status from the correct column
		const requestStatusCell = row.getCell(requestStatusColIndex);
		let requestStatus = "";

		if (
			requestStatusCell.value &&
			typeof requestStatusCell.value === "object" &&
			"text" in requestStatusCell.value
		) {
			requestStatus = String(requestStatusCell.value.text);
		} else if (requestStatusCell.value) {
			requestStatus = String(requestStatusCell.value);
		}

		if (!requestStatus) {
			continue;
		}

		rowsTested++;

		console.log(`\nRow ${rowIndex}:`);
		console.log(`  Original Status: "${requestStatus}"`);

		// Test mapping
		let mappedStatus = requestStatus;
		let matchedRule: StatusMappingRule | null = null;

		for (const rule of rules) {
			const matches = testPattern(
				rule.sourceStatus,
				requestStatus,
				rule.patternType
			);

			console.log(`  Testing against Rule ${rule.id} ("${rule.sourceStatus}"):`);
			console.log(`    - Pattern Type: ${rule.patternType}`);
			console.log(
				`    - Normalized Status: "${requestStatus.toLowerCase().trim()}"`
			);
			console.log(
				`    - Normalized Pattern: "${rule.sourceStatus.toLowerCase().trim()}"`
			);
			console.log(`    - Match: ${matches ? "✓ YES" : "✗ NO"}`);

			if (matches) {
				mappedStatus = rule.targetStatus;
				matchedRule = rule;
				break;
			}
		}

		if (matchedRule) {
			console.log(
				`  ✓ Mapped Status: "${mappedStatus}" (Rule ${matchedRule.id})`
			);
		} else {
			console.log(`  ⚠ No rule matched - Status unchanged: "${mappedStatus}"`);
		}
	}

	console.log("");
	console.log("=".repeat(80));
	console.log(`✓ Test completed. Tested ${rowsTested} rows.`);
	console.log("=".repeat(80));
}

main().catch((error) => {
	console.error("❌ Test failed:", error);
	process.exit(1);
});
