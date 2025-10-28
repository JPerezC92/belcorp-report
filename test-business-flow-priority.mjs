import initSqlJs from './packages/database/node_modules/sql.js/dist/sql-wasm.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const TABLE_NAMES = {
	MONTHLY_REPORT_RECORDS: "monthly_report_records",
	MODULE_CATEGORIZATION_DISPLAY_RULES: "module_categorization_display_rules",
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
	console.log("Usage: node test-business-flow-priority.mjs <path-to-app-database.db>\n");
	return null;
}

async function testBusinessFlowPriority() {
	console.log("\n=== Testing Business-Flow × Priority Distribution ===\n");

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
			SELECT DISTINCT COALESCE(priorityReporte, 'NULL') as priority, COUNT(*) as count
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

		// Get unique module values
		console.log("3. Unique module values:");
		const moduleResult = db.exec(`
			SELECT DISTINCT COALESCE(module, 'NULL') as module
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			ORDER BY module
		`);
		if (moduleResult[0]?.values) {
			moduleResult[0].values.forEach(row => {
				console.log(`   - "${row[0]}"`);
			});
		}
		console.log();

		// Check module display name mappings
		console.log("4. Module display name mappings:");
		const moduleMappingsResult = db.exec(`
			SELECT source_value, display_value
			FROM ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES}
			WHERE rule_type = 'module' AND active = 1
			ORDER BY source_value
		`);
		if (moduleMappingsResult[0]?.values && moduleMappingsResult[0].values.length > 0) {
			console.log("\n   Module Mappings:");
			console.table(
				moduleMappingsResult[0].values.map(row => ({
					'Source Value': row[0],
					'Display Value': row[1],
				}))
			);
		} else {
			console.log("   ⚠️  No module mappings found!\n");
		}

		// Main query: Group by module and priority with display names
		console.log("\n5. Distribution by Business-Flow × Priority:\n");
		const distributionResult = db.exec(`
			SELECT
				COALESCE(module_rules.display_value, m.module, 'Unknown') as module_display,
				COALESCE(m.priorityReporte, 'Unknown') as priority,
				COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			LEFT JOIN ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES} module_rules
				ON m.module = module_rules.source_value
				AND module_rules.rule_type = 'module'
				AND module_rules.active = 1
			GROUP BY m.module, m.priorityReporte, module_rules.display_value
			ORDER BY m.priorityReporte, module_display
		`);

		if (distributionResult[0]?.values && distributionResult[0].values.length > 0) {
			// Group by priority
			const priorityGroups = new Map();

			distributionResult[0].values.forEach(row => {
				const moduleDisplay = row[0];
				const priority = row[1];
				const count = row[2];

				if (!priorityGroups.has(priority)) {
					priorityGroups.set(priority, []);
				}
				priorityGroups.get(priority).push({ moduleDisplay, count });
			});

			// Sort priorities
			const sortedPriorities = Array.from(priorityGroups.keys()).sort();

			// Display separate table for each priority
			sortedPriorities.forEach(priority => {
				const modules = priorityGroups.get(priority);

				// Sort by count descending
				modules.sort((a, b) => b.count - a.count);

				console.log(`\n   ╔═══════════════════════════════════════════════════╗`);
				console.log(`   ║  ${priority.toUpperCase()} PRIORITY`.padEnd(52) + '║');
				console.log(`   ╚═══════════════════════════════════════════════════╝\n`);

				const tableData = modules.map(m => ({
					'Business-Flow': m.moduleDisplay,
					'Count': m.count,
				}));

				console.table(tableData);

				const total = modules.reduce((sum, m) => sum + m.count, 0);
				console.log(`   📊 Total for ${priority}: ${total} incidents\n`);
			});

			// Overall summary
			console.log(`\n   ╔═══════════════════════════════════════════════════╗`);
			console.log(`   ║  OVERALL SUMMARY`.padEnd(52) + '║');
			console.log(`   ╚═══════════════════════════════════════════════════╝\n`);

			const summaryByPriority = sortedPriorities.map(priority => {
				const modules = priorityGroups.get(priority);
				const total = modules.reduce((sum, m) => sum + m.count, 0);
				return { Priority: priority, Total: total };
			});
			console.table(summaryByPriority);

			const grandTotal = summaryByPriority.reduce((sum, row) => sum + row.Total, 0);
			console.log(`\n   🎯 Grand Total: ${grandTotal} incidents\n`);

		} else {
			console.log("   No distribution data found!\n");
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

testBusinessFlowPriority();
