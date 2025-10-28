import initSqlJs from './packages/database/node_modules/sql.js/dist/sql-wasm.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const TABLE_NAMES = {
	MONTHLY_REPORT_RECORDS: "monthly_report_records",
	MONTHLY_REPORT_LEVEL_MAPPING: "monthly_report_level_mapping",
	PARENT_CHILD_RELATIONSHIPS: "parent_child_relationships",
};

async function findDatabaseFile() {
	// Common locations for Electron userData on Windows
	const possiblePaths = [
		// AppData\Roaming\<app-name>\app-database.db
		join(homedir(), 'AppData', 'Roaming', 'belcorp-report', 'app-database.db'),
		join(homedir(), 'AppData', 'Roaming', 'electron-vite-vue', 'app-database.db'),
		join(homedir(), 'AppData', 'Roaming', 'Electron', 'app-database.db'),
		// Current directory (dev mode might save here)
		join(process.cwd(), 'app-database.db'),
		join(process.cwd(), 'dist', 'app-database.db'),
	];

	console.log("Searching for database file in common locations...\n");

	for (const path of possiblePaths) {
		console.log(`Checking: ${path}`);
		if (existsSync(path)) {
			console.log(`✅ Found database at: ${path}\n`);
			return path;
		}
	}

	console.log("\n❌ Could not find database file!");
	console.log("\nPlease provide the path manually:");
	console.log("Usage: node test-real-database.mjs <path-to-app-database.db>\n");
	console.log("Common locations:");
	possiblePaths.forEach(p => console.log(`  - ${p}`));
	console.log();

	return null;
}

async function testRealDatabase() {
	console.log("\n=== Testing REAL Database File ===\n");

	try {
		// Get database path from command line or search
		let dbPath = process.argv[2];

		if (!dbPath) {
			dbPath = await findDatabaseFile();
			if (!dbPath) {
				process.exit(1);
			}
		} else {
			console.log(`Using provided path: ${dbPath}\n`);
			if (!existsSync(dbPath)) {
				console.error(`❌ File not found: ${dbPath}\n`);
				process.exit(1);
			}
		}

		// Load SQL.js
		const SQL = await initSqlJs();

		// Read the actual database file
		const buffer = readFileSync(dbPath);
		const db = new SQL.Database(buffer);

		console.log("✅ Database loaded successfully!\n");

		// Check total records
		console.log("1. Checking total monthly report records...");
		const totalResult = db.exec(
			`SELECT COUNT(*) as total FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}`,
		);
		const totalRecords = totalResult[0]?.values[0]?.[0] || 0;
		console.log(`   Total records: ${totalRecords}`);

		if (totalRecords === 0) {
			console.log("\n❌ No records found in the database!");
			console.log("   This means the Excel upload may have failed.");
			console.log("   Check the console for errors during upload.\n");
			return;
		}

		console.log(`   ✅ Found ${totalRecords} uploaded records\n`);

		// Use THE EXACT SAME QUERY as the repository
		console.log("2. Query with enlaces (same as repository):");
		const result = db.exec(`
			SELECT
				m.*,
				COALESCE((SELECT COUNT(*)
				 FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} p
				 WHERE p.childRequestId = m.linkedRequestId), 0) as enlaces
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			ORDER BY m.createdTime DESC
			LIMIT 10
		`);

		const columns = result[0].columns;
		const values = result[0].values;

		console.log(`   Columns (${columns.length}): ${columns.slice(0, 10).join(", ")}...`);

		// Find key column indices
		const computedLevelIndex = columns.indexOf("computed_level");
		const requestIdIndex = columns.indexOf("requestId");
		const createdTimeIndex = columns.indexOf("createdTime");
		const requestStatusReporteIndex = columns.indexOf("requestStatusReporte");
		const requestStatusIndex = columns.indexOf("requestStatus");

		console.log("\n   Key column positions:");
		console.log(`   - requestId: ${requestIdIndex}`);
		console.log(`   - createdTime: ${createdTimeIndex}`);
		console.log(`   - requestStatus: ${requestStatusIndex}`);
		console.log(`   - requestStatusReporte: ${requestStatusReporteIndex}`);
		console.log(`   - computed_level: ${computedLevelIndex} ${computedLevelIndex < 0 ? "⚠️ NOT FOUND!" : "✅"}`);
		console.log();

		// Show sample records
		console.log("3. Sample records from uploaded data:");
		console.log();
		values.slice(0, 5).forEach((row, index) => {
			console.log(`   Record [${index + 1}]:`);
			console.log(`     Request ID: ${row[requestIdIndex]}`);
			console.log(`     Created: ${row[createdTimeIndex]?.substring(0, 10)}`);
			console.log(`     Original Status: ${row[requestStatusIndex]}`);
			console.log(`     Mapped Status (requestStatusReporte): ${row[requestStatusReporteIndex]}`);
			console.log(`     Computed Level: ${computedLevelIndex >= 0 ? (row[computedLevelIndex] || "NULL ❌") : "COLUMN NOT FOUND ❌"}`);
			console.log();
		});

		// Group by level
		console.log("4. Count by computed_level:");
		const groupedResult = db.exec(`
			SELECT
				COALESCE(computed_level, 'NULL') as level,
				COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			GROUP BY computed_level
			ORDER BY count DESC
		`);

		groupedResult[0]?.values.forEach((row) => {
			const level = row[0];
			const count = row[1];
			const emoji = level === "NULL" ? "❌" : "✅";
			console.log(`   ${emoji} ${level}: ${count} records`);
		});
		console.log();

		// Check level mapping table
		console.log("5. Level mapping rules:");
		const mappingsResult = db.exec(`
			SELECT requestStatusReporte, level
			FROM ${TABLE_NAMES.MONTHLY_REPORT_LEVEL_MAPPING}
			ORDER BY requestStatusReporte
		`);

		if (mappingsResult[0]?.values.length > 0) {
			mappingsResult[0].values.forEach((row) => {
				console.log(`   "${row[0]}" → ${row[1]}`);
			});
			console.log();
		} else {
			console.log("   ⚠️  No mapping rules found!\n");
		}

		// Diagnosis
		console.log("=== DIAGNOSIS ===\n");

		const hasNullLevels = groupedResult[0]?.values.some(row => row[0] === "NULL" && row[1] > 0);

		if (computedLevelIndex < 0) {
			console.log("❌ ISSUE: computed_level column does not exist!");
			console.log("   → Database migration did not run correctly");
			console.log("   → Solution: Delete database file and restart app\n");
		} else if (hasNullLevels) {
			console.log("❌ ISSUE: computed_level is NULL for all/some records!");
			console.log("   → Level mapping is not working during Excel upload");
			console.log("   → Possible causes:");
			console.log("     1. Level mapper not wired up in parser");
			console.log("     2. requestStatusReporte doesn't match any mapping rules");
			console.log("     3. Errors during upload (check console)");
			console.log("\n   → Check requestStatusReporte values above vs mapping rules");
			console.log("   → If they don't match, add new mappings in UI\n");
		} else {
			console.log("✅ computed_level is populated correctly!");
			console.log("   → The issue is in the frontend/adapter");
			console.log("   → Check browser console for errors");
			console.log("   → Verify adapter is mapping computed_level → computed_level\n");
		}

		db.close();

	} catch (error) {
		console.error("\n❌ Error:", error.message);
		if (error.stack) {
			console.error("\nStack trace:");
			console.error(error.stack);
		}
		process.exit(1);
	}
}

testRealDatabase();
