import { getDatabase, TABLE_NAMES, initializeDatabase } from "@app/database";
import path from "path";
import os from "os";

async function checkDatabaseColumns(): Promise<void> {
	try {
		console.log("🔍 Checking Database Schema");
		console.log("━".repeat(60));
		console.log("");

		// Initialize database
		const dbPath = path.join(os.homedir(), "AppData", "Roaming", "root", "app-database.db");
		console.log(`📂 Database path: ${dbPath}\n`);

		await initializeDatabase({
			path: dbPath,
			inMemory: false,
			autoSave: false,
		});

		const db = getDatabase();

		// Check corrective_maintenance_records table schema
		console.log("1️⃣ Corrective Maintenance Records Table Schema:");
		console.log("─".repeat(60));

		const correctiveSchema = db.exec(`PRAGMA table_info(${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS})`);
		if (correctiveSchema[0]) {
			console.log("Columns:");
			correctiveSchema[0].values.forEach((row: any) => {
				console.log(`  ${row[1]} (${row[2]}) ${row[3] ? 'NOT NULL' : ''} ${row[5] ? 'PRIMARY KEY' : ''}`);
			});
		}

		// Sample data from corrective_maintenance_records
		console.log("\n📊 Sample Corrective Maintenance Data (first 5 records):");
		console.log("─".repeat(60));
		const correctiveData = db.exec(`
			SELECT requestId, businessUnit, inDateRange, createdTime
			FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}
			LIMIT 5
		`);
		if (correctiveData[0]) {
			correctiveData[0].values.forEach((row: any) => {
				console.log(`  ${row[0]} | ${row[1]} | inDateRange=${row[2]} | ${row[3]}`);
			});
		}

		// Check monthly_report_records table schema
		console.log("\n\n2️⃣ Monthly Report Records Table Schema:");
		console.log("─".repeat(60));

		const monthlySchema = db.exec(`PRAGMA table_info(${TABLE_NAMES.MONTHLY_REPORT_RECORDS})`);
		if (monthlySchema[0]) {
			console.log("Columns:");
			monthlySchema[0].values.forEach((row: any) => {
				console.log(`  ${row[1]} (${row[2]}) ${row[3] ? 'NOT NULL' : ''} ${row[5] ? 'PRIMARY KEY' : ''}`);
			});
		}

		// Check if 'semanal' column still exists (it shouldn't after migration)
		const hasOldColumn = monthlySchema[0]?.values.some((row: any) => row[1] === 'semanal');
		const hasNewColumn = monthlySchema[0]?.values.some((row: any) => row[1] === 'inDateRange');

		console.log(`\n  ❌ Old 'semanal' column exists: ${hasOldColumn}`);
		console.log(`  ✅ New 'inDateRange' column exists: ${hasNewColumn}`);

		// Sample data from monthly_report_records
		console.log("\n📊 Sample Monthly Report Data (first 5 records):");
		console.log("─".repeat(60));
		const monthlyData = db.exec(`
			SELECT requestId, businessUnit, inDateRange, createdTime, week
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			LIMIT 5
		`);
		if (monthlyData[0]) {
			monthlyData[0].values.forEach((row: any) => {
				console.log(`  ${row[0]} | ${row[1]} | inDateRange=${row[2]} | Week ${row[4]} | ${row[3]}`);
			});
		}

		// Check semanal_date_ranges table
		console.log("\n\n3️⃣ Semanal Date Ranges Table:");
		console.log("─".repeat(60));

		const semanalData = db.exec(`
			SELECT * FROM ${TABLE_NAMES.SEMANAL_DATE_RANGES}
			ORDER BY id DESC
			LIMIT 5
		`);
		if (semanalData[0] && semanalData[0].values.length > 0) {
			console.log("Active Date Ranges:");
			semanalData[0].values.forEach((row: any) => {
				const isActive = row[4] === 1 ? '✅ ACTIVE' : '❌ inactive';
				console.log(`  [${row[0]}] ${row[1]} to ${row[2]} - ${row[3]} ${isActive}`);
			});
		} else {
			console.log("  ⚠️  No semanal date ranges found in database!");
			console.log("  This means the parser is using the fallback isCurrentWeek() logic");
		}

		// Check statistics
		console.log("\n\n📈 Statistics:");
		console.log("─".repeat(60));

		const correctiveStats = db.exec(`
			SELECT
				COUNT(*) as total,
				SUM(CASE WHEN inDateRange = 1 THEN 1 ELSE 0 END) as in_range,
				SUM(CASE WHEN inDateRange = 0 THEN 1 ELSE 0 END) as out_range
			FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}
		`);
		if (correctiveStats[0]) {
			const stats = correctiveStats[0].values[0];
			console.log(`Corrective Maintenance:`);
			console.log(`  Total: ${stats[0]}`);
			console.log(`  In Range: ${stats[1]} (${((Number(stats[1])/Number(stats[0]))*100).toFixed(1)}%)`);
			console.log(`  Out of Range: ${stats[2]} (${((Number(stats[2])/Number(stats[0]))*100).toFixed(1)}%)`);
		}

		const monthlyStats = db.exec(`
			SELECT
				COUNT(*) as total,
				SUM(CASE WHEN inDateRange = 1 THEN 1 ELSE 0 END) as in_range,
				SUM(CASE WHEN inDateRange = 0 THEN 1 ELSE 0 END) as out_range
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
		`);
		if (monthlyStats[0]) {
			const stats = monthlyStats[0].values[0];
			console.log(`\nMonthly Report:`);
			console.log(`  Total: ${stats[0]}`);
			console.log(`  In Range: ${stats[1]} (${((Number(stats[1])/Number(stats[0]))*100).toFixed(1)}%)`);
			console.log(`  Out of Range: ${stats[2]} (${((Number(stats[2])/Number(stats[0]))*100).toFixed(1)}%)`);
		}

		console.log("");
		console.log("━".repeat(60));
		console.log("✅ Database check completed!");

	} catch (error) {
		console.error("\n❌ Error checking database:");
		if (error instanceof Error) {
			console.error(`Message: ${error.message}`);
			console.error(`\nStack trace:`);
			console.error(error.stack);
		} else {
			console.error(String(error));
		}
		process.exit(1);
	}
}

// Run the check
checkDatabaseColumns()
	.then(() => {
		console.log("\n✅ Check completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n❌ Check failed:", error);
		process.exit(1);
	});
