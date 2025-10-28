import initSqlJs from './packages/database/node_modules/sql.js/dist/sql-wasm.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const TABLE_NAMES = {
	MONTHLY_REPORT_RECORDS: "monthly_report_records",
};

async function findDatabaseFile() {
	const possiblePaths = [
		join(homedir(), 'AppData', 'Roaming', 'belcorp-report', 'app-database.db'),
		join(homedir(), 'AppData', 'Roaming', 'root', 'app-database.db'),
		join(homedir(), 'AppData', 'Roaming', 'electron-vite-vue', 'app-database.db'),
		join(homedir(), 'AppData', 'Roaming', 'Electron', 'app-database.db'),
		join(process.cwd(), 'app-database.db'),
		join(process.cwd(), 'dist', 'app-database.db'),
	];

	console.log("Searching for database file...\n");

	for (const path of possiblePaths) {
		if (existsSync(path)) {
			console.log(`✅ Found database at: ${path}\n`);
			return path;
		}
	}

	console.log("❌ Could not find database file!");
	console.log("Usage: node test-incidents-by-priority.mjs <path-to-app-database.db>\n");
	return null;
}

async function testIncidentsByPriority() {
	console.log("\n=== Testing Number of Incidents by Priority ===\n");

	try {
		// Get database path
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
		console.log("1. Total monthly report records:");
		const totalResult = db.exec(
			`SELECT COUNT(*) as total FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}`,
		);
		const totalRecords = totalResult[0]?.values[0]?.[0] || 0;
		console.log(`   ${totalRecords} records\n`);

		if (totalRecords === 0) {
			console.log("❌ No records found in the database!\n");
			return;
		}

		// Get unique priority values
		console.log("2. Unique priority values:");
		const priorityResult = db.exec(`
			SELECT DISTINCT COALESCE(priorityReporte, 'Unknown') as priority, COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			GROUP BY priorityReporte
			ORDER BY priority
		`);
		if (priorityResult[0]?.values) {
			console.log("\n   Priority Distribution:");
			console.table(
				priorityResult[0].values.map(row => ({
					Priority: row[0],
					Count: row[1],
				}))
			);
		}
		console.log();

		// Simple count by priority
		console.log("3. Count by Priority (Simple View):\n");
		const simpleResult = db.exec(`
			SELECT
				COALESCE(priorityReporte, 'Unknown') as priority,
				COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			GROUP BY priorityReporte
			ORDER BY
				CASE priorityReporte
					WHEN 'Critical' THEN 1
					WHEN 'High' THEN 2
					WHEN 'Medium' THEN 3
					WHEN 'Low' THEN 4
					ELSE 5
				END
		`);

		if (simpleResult[0]?.values) {
			console.table(
				simpleResult[0].values.map(row => ({
					Priority: row[0],
					Count: row[1],
				}))
			);
		}

		// Pivot table: Single row with priorities as columns
		console.log("\n4. Pivot Table (Priorities as Columns):\n");

		// Get all unique priorities
		const priorities = priorityResult[0]?.values.map(row => row[0]) || [];

		// Build CASE statements for pivot
		const caseClauses = priorities.map(priority => {
			const safeName = priority.replace(/'/g, "''");
			return `SUM(CASE WHEN COALESCE(priorityReporte, 'Unknown') = '${safeName}' THEN 1 ELSE 0 END) as "${priority}"`;
		}).join(',\n\t\t\t');

		const pivotQuery = `
			SELECT
				${caseClauses},
				COUNT(*) as Total
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
		`;

		const pivotResult = db.exec(pivotQuery);

		if (pivotResult[0]) {
			const columns = pivotResult[0].columns;
			const values = pivotResult[0].values[0]; // Single row

			console.log("   Columns: " + columns.join(" | "));
			console.log();

			// Display as table
			const tableData = {
				Metric: "Number of Incidents"
			};
			columns.forEach((col, idx) => {
				tableData[col] = values[idx];
			});

			console.table([tableData]);
		}

		// Alternative view: Ordered priorities
		console.log("\n5. Ordered View (Critical → High → Medium → Low):\n");

		const orderedPivotQuery = `
			SELECT
				SUM(CASE WHEN priorityReporte = 'Critical' THEN 1 ELSE 0 END) as Critical,
				SUM(CASE WHEN priorityReporte = 'High' THEN 1 ELSE 0 END) as High,
				SUM(CASE WHEN priorityReporte = 'Medium' THEN 1 ELSE 0 END) as Medium,
				SUM(CASE WHEN priorityReporte = 'Low' THEN 1 ELSE 0 END) as Low,
				COUNT(*) as Total
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
		`;

		const orderedResult = db.exec(orderedPivotQuery);

		if (orderedResult[0]) {
			const columns = orderedResult[0].columns;
			const values = orderedResult[0].values[0];

			const orderedData = {
				Metric: "Number of Incidents"
			};
			columns.forEach((col, idx) => {
				orderedData[col] = values[idx];
			});

			console.table([orderedData]);
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

testIncidentsByPriority();
