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
		join(homedir(), 'AppData', 'Roaming', 'electron-vite-vue', 'app-database.db'),
		join(homedir(), 'AppData', 'Roaming', 'Electron', 'app-database.db'),
		join(homedir(), 'AppData', 'Roaming', 'root', 'app-database.db'),
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
	console.log("Usage: node test-category-distribution.mjs <path-to-app-database.db>\n");
	return null;
}

async function testCategoryDistribution() {
	console.log("\n=== Testing Category Distribution (Categorization × Recurrence) ===\n");

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

		// Get unique categorization values
		console.log("2. Unique categorization values:");
		const categorizationResult = db.exec(`
			SELECT DISTINCT COALESCE(categorization, 'NULL') as cat
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			ORDER BY cat
		`);
		if (categorizationResult[0]?.values) {
			categorizationResult[0].values.forEach(row => {
				console.log(`   - "${row[0]}"`);
			});
		}
		console.log();

		// Get unique recurrenceComputed values
		console.log("3. Unique recurrenceComputed values:");
		const recurrenceResult = db.exec(`
			SELECT DISTINCT COALESCE(recurrenceComputed, 'NULL') as rec
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			ORDER BY rec
		`);
		if (recurrenceResult[0]?.values) {
			recurrenceResult[0].values.forEach(row => {
				console.log(`   - "${row[0]}"`);
			});
		}
		console.log();

		// Query: Group by categorization and recurrenceComputed
		console.log("4. Distribution by Category × Recurrence:");
		const distributionResult = db.exec(`
			SELECT
				COALESCE(categorization, 'Unknown') as categorization,
				COALESCE(recurrenceComputed, 'Unknown') as recurrence,
				COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			GROUP BY categorization, recurrenceComputed
			ORDER BY categorization, recurrence
		`);

		if (distributionResult[0]?.values && distributionResult[0].values.length > 0) {
			console.log("\n   Categorization × Recurrence Distribution:");
			console.table(
				distributionResult[0].values.map(row => ({
					Categorization: row[0],
					Recurrence: row[1],
					Count: row[2],
				}))
			);
		} else {
			console.log("   No distribution data found!\n");
		}

		// Pivot table query: Categorization as rows, Recurrence as columns
		console.log("\n5. Pivot Table (Categorization × Recurrence):");

		// First, get all unique recurrence values to build dynamic SQL
		const recurrenceValues = recurrenceResult[0]?.values.map(row => row[0]) || [];

		// Build CASE statements for each recurrence value
		const caseClauses = recurrenceValues.map(rec => {
			const safeName = rec.replace(/'/g, "''");
			return `SUM(CASE WHEN COALESCE(recurrenceComputed, 'NULL') = '${safeName}' THEN 1 ELSE 0 END) as "${rec}"`;
		}).join(',\n\t\t\t');

		const pivotQuery = `
			SELECT
				COALESCE(categorization, 'Unknown') as Categorization,
				${caseClauses},
				COUNT(*) as Total
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			GROUP BY categorization
			ORDER BY categorization
		`;

		const pivotResult = db.exec(pivotQuery);

		if (pivotResult[0]) {
			const columns = pivotResult[0].columns;
			const values = pivotResult[0].values;

			console.log("\n   Pivot Table:");
			console.log(`   Columns: ${columns.join(' | ')}`);
			console.log();

			// Display as table
			const tableData = values.map(row => {
				const obj = {};
				columns.forEach((col, idx) => {
					obj[col] = row[idx];
				});
				return obj;
			});

			console.table(tableData);

			// Calculate totals row
			const totals = { Categorization: 'TOTAL' };
			columns.slice(1).forEach((col, idx) => {
				totals[col] = values.reduce((sum, row) => sum + (row[idx + 1] || 0), 0);
			});

			console.log("\n   Totals:");
			console.table([totals]);
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

testCategoryDistribution();
