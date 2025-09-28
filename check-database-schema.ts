import { DatabaseManager } from "../packages/database/src/database-manager.js";
import { TABLE_NAMES } from "../packages/database/src/table-names.js";

async function checkDatabaseSchema() {
	try {
		console.log("Initializing database manager...");
		const dbManager = DatabaseManager.getInstance();

		console.log("Checking monthly_report_records table schema...");
		const result = await dbManager.query(
			`PRAGMA table_info(${TABLE_NAMES.MONTHLY_REPORT_RECORDS})`
		);

		console.log("Table schema:");
		console.table(result);

		console.log(`Table has ${result.length} columns`);

		// Check migration state
		console.log("\nChecking migration state...");
		const migrations = await dbManager.query(
			`SELECT version, description, applied_at, checksum FROM migrations ORDER BY version`
		);

		console.log("Applied migrations:");
		console.table(migrations);

		// Check if migration 009 was applied
		const migration009 = migrations.find((m: any) => m.version === "009");
		console.log(`Migration 009 applied: ${!!migration009}`);
		if (migration009) {
			console.log(`Migration 009 checksum: ${migration009.checksum}`);
		}
	} catch (error) {
		console.error("Error checking database schema:", error);
	} finally {
		process.exit(0);
	}
}

checkDatabaseSchema();
