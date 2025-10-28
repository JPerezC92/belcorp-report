import { TABLE_NAMES } from "./packages/database/dist/index.js";
import { DateTime } from "luxon";
import initSqlJs from "./node_modules/.pnpm/sql.js@1.13.0/node_modules/sql.js/dist/sql-wasm.js";
import { readFileSync } from "fs";

async function testIncidentsByDay() {
	console.log("\n=== Testing Incidents by Day Query ===\n");

	try {
		// Load database directly with sql.js
		const dbPath = "C:\\Users\\dexm7\\AppData\\Roaming\\root\\app-database.db";
		console.log(`Loading database: ${dbPath}\n`);

		const SQL = await initSqlJs();
		const buffer = readFileSync(dbPath);
		const db = new SQL.Database(buffer);

		console.log(`✅ Database loaded successfully!\n`);

		// Test parameters
		const testMonth = "2025-10"; // Change this to test different months
		const testBusinessUnit = "all"; // Change to specific BU or "all"

		// Check what months are available in the database
		console.log("1. Checking available months in database...");
		const monthsQuery = `
			SELECT DISTINCT
				substr(createdTime, 7, 4) || '-' || substr(createdTime, 4, 2) as month,
				COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			GROUP BY month
			ORDER BY month DESC
		`;
		const monthsResult = db.exec(monthsQuery);
		if (monthsResult.length > 0 && monthsResult[0].values.length > 0) {
			console.log("   Available months:");
			monthsResult[0].values.forEach(([month, count]) => {
				console.log(`   - ${month}: ${count} records`);
			});
		}
		console.log();

		// Check total records
		console.log("2. Checking total records in database...");
		const totalResult = db.exec(
			`SELECT COUNT(*) as total FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}`,
		);
		if (totalResult.length > 0 && totalResult[0].values.length > 0) {
			console.log(`   Total records: ${totalResult[0].values[0][0]}\n`);
		} else {
			console.log("   No records found!\n");
		}

		console.log(`3. Test Parameters:`);
		console.log(`   Month: ${testMonth}`);
		console.log(`   Business Unit: ${testBusinessUnit}\n`);

		// Query to get all monthly report records for the month
		console.log("4. Querying monthly report records...");
		let query = `
			SELECT
				requestId,
				createdTime,
				businessUnit,
				priorityReporte,
				computed_level
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
		`;

		const results = db.exec(query);

		if (!results || results.length === 0) {
			console.log("   ❌ No records found in monthly_report_records table");
			console.log("   This means the table is empty.");
			console.log("   You need to upload a monthly report Excel file first.\n");
			return;
		}

		const columns = results[0].columns;
		const rows = results[0].values;

		console.log(`Total records in database: ${rows.length}\n`);

		// Process records - filter by month and business unit
		const incidentsByDayMap = new Map();
		let filteredCount = 0;
		let invalidDateCount = 0;

		rows.forEach((row) => {
			const record = {
				requestId: row[0],
				createdTime: row[1],
				businessUnit: row[2],
				priorityReporte: row[3],
				computedLevel: row[4],
			};

			// Parse date - try multiple formats
			let openingDate = DateTime.fromFormat(record.createdTime, "dd/MM/yyyy HH:mm:ss", { zone: "utc" });

			if (!openingDate.isValid) {
				openingDate = DateTime.fromFormat(record.createdTime, "dd/MM/yyyy HH:mm", { zone: "utc" });
			}

			if (!openingDate.isValid) {
				openingDate = DateTime.fromISO(record.createdTime, { zone: "utc" });
			}

			if (!openingDate.isValid) {
				invalidDateCount++;
				return;
			}

			// Filter by month
			const recordMonth = openingDate.toFormat("yyyy-MM");
			if (recordMonth !== testMonth) {
				return;
			}

			// Filter by business unit
			if (testBusinessUnit !== "all" && record.businessUnit !== testBusinessUnit) {
				return;
			}

			// Extract day of month
			const dayOfMonth = openingDate.day; // 1-31

			// Count incidents by day
			incidentsByDayMap.set(dayOfMonth, (incidentsByDayMap.get(dayOfMonth) || 0) + 1);
			filteredCount++;
		});

		console.log(`Records matching filters: ${filteredCount}`);
		console.log(`Invalid dates skipped: ${invalidDateCount}\n`);

		// Get number of days in the selected month
		const monthDate = DateTime.fromFormat(testMonth, "yyyy-MM", { zone: "utc" });
		const daysInMonth = monthDate.daysInMonth;

		console.log(`Days in ${monthDate.toFormat("MMMM yyyy")}: ${daysInMonth}\n`);

		// Create complete array with all days (including 0-incident days)
		const incidentsByDay = [];
		for (let day = 1; day <= daysInMonth; day++) {
			incidentsByDay.push({
				day,
				incidents: incidentsByDayMap.get(day) || 0,
			});
		}

		// Display results as table
		console.log("=== Number of Incidents by Day ===\n");
		console.log("Day | Incidents");
		console.log("----|----------");
		incidentsByDay.forEach((row) => {
			console.log(`${String(row.day).padStart(3)} | ${String(row.incidents).padStart(9)}`);
		});

		console.log("----|----------");
		const totalIncidents = incidentsByDay.reduce((sum, row) => sum + row.incidents, 0);
		console.log(`Total: ${totalIncidents} incidents`);

		// Show some statistics
		console.log("\n=== Statistics ===");
		console.log(`Max incidents in a day: ${Math.max(...incidentsByDay.map(r => r.incidents))}`);
		console.log(`Min incidents in a day: ${Math.min(...incidentsByDay.map(r => r.incidents))}`);
		console.log(`Average per day: ${(totalIncidents / daysInMonth).toFixed(2)}`);
		console.log(`Days with 0 incidents: ${incidentsByDay.filter(r => r.incidents === 0).length}`);
		console.log(`Days with incidents: ${incidentsByDay.filter(r => r.incidents > 0).length}`);

		// Show sample of actual records
		console.log("\n=== Sample Records (first 10) ===");
		const sampleRecords = [];
		let sampleCount = 0;

		rows.forEach((row) => {
			if (sampleCount >= 10) return;

			const record = {
				requestId: row[0],
				createdTime: row[1],
				businessUnit: row[2],
			};

			let openingDate = DateTime.fromFormat(record.createdTime, "dd/MM/yyyy HH:mm:ss", { zone: "utc" });
			if (!openingDate.isValid) {
				openingDate = DateTime.fromFormat(record.createdTime, "dd/MM/yyyy HH:mm", { zone: "utc" });
			}
			if (!openingDate.isValid) {
				openingDate = DateTime.fromISO(record.createdTime, { zone: "utc" });
			}

			if (!openingDate.isValid) return;

			const recordMonth = openingDate.toFormat("yyyy-MM");
			if (recordMonth !== testMonth) return;

			if (testBusinessUnit !== "all" && record.businessUnit !== testBusinessUnit) return;

			sampleRecords.push({
				"Request ID": record.requestId,
				"Date": record.createdTime,
				"Day": openingDate.day,
				"BU": record.businessUnit || "N/A",
			});

			sampleCount++;
		});

		console.table(sampleRecords);

		// Close database
		db.close();

	} catch (error) {
		console.error("❌ Error running test:", error);
		if (error instanceof Error) {
			console.error("Message:", error.message);
			console.error("Stack:", error.stack);
		}
		process.exit(1);
	}
}

testIncidentsByDay()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
