import { getDatabase, TABLE_NAMES, initializeDatabase } from "@app/database";

interface GroupedResult {
	label: string;
	count: number;
}

/**
 * Test script for Incident Overview by Category
 * Validates data for all 5 tables before UI implementation
 */
async function testIncidentOverviewTables(): Promise<void> {
	try {
		console.log("\n" + "═".repeat(80));
		console.log("  🔍 INCIDENT OVERVIEW BY CATEGORY - DATA VALIDATION");
		console.log("═".repeat(80) + "\n");

		// Initialize the database
		console.log("📦 Initializing database...");
		await initializeDatabase({
			path: "C:\\Users\\dexm7\\AppData\\Roaming\\root\\app-database.db",
			autoSave: true,
			enableWAL: false,
			autoVacuum: true,
		});
		console.log("✅ Database initialized successfully\n");

		const db = getDatabase();

		// ═══════════════════════════════════════════════════════════════════════
		// TABLE 1: Resolved in L2
		// ═══════════════════════════════════════════════════════════════════════
		console.log("\n" + "═".repeat(80));
		console.log("  TABLE 1: Resolved in L2");
		console.log("  Filter: inDateRange=1 AND requestStatusReporte='Closed'");
		console.log("─".repeat(80));

		const table1Query = `
			SELECT
				categorization,
				COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			WHERE inDateRange = 1
			  AND requestStatusReporte = 'Closed'
			GROUP BY categorization
			ORDER BY count DESC
		`;

		const table1Result = db.exec(table1Query);
		let table1Data: GroupedResult[] = [];
		let table1Total = 0;

		if (table1Result && table1Result.length > 0) {
			table1Data = table1Result[0].values.map((row: any[]) => ({
				label: row[0] as string || "Unknown",
				count: row[1] as number || 0,
			}));
			table1Total = table1Data.reduce((sum, item) => sum + item.count, 0);
		}

		if (table1Data.length === 0) {
			console.log("  ⚠️  No data found");
		} else {
			table1Data.forEach((item) => {
				console.log(`  ${item.label.padEnd(40)} ${item.count.toString().padStart(5)}`);
			});
		}
		console.log("─".repeat(80));
		console.log(`  TOTAL: ${table1Total} Resolved tickets of the Week`);
		console.log("═".repeat(80));

		// ═══════════════════════════════════════════════════════════════════════
		// TABLE 2: Pending
		// ═══════════════════════════════════════════════════════════════════════
		console.log("\n" + "═".repeat(80));
		console.log("  TABLE 2: Pending");
		console.log("  Filter: inDateRange=1 AND requestStatusReporte='On going in L2'");
		console.log("─".repeat(80));

		const table2Query = `
			SELECT
				categorization,
				COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			WHERE inDateRange = 1
			  AND requestStatusReporte = 'On going in L2'
			GROUP BY categorization
			ORDER BY count DESC
		`;

		const table2Result = db.exec(table2Query);
		let table2Data: GroupedResult[] = [];
		let table2Total = 0;

		if (table2Result && table2Result.length > 0) {
			table2Data = table2Result[0].values.map((row: any[]) => ({
				label: row[0] as string || "Unknown",
				count: row[1] as number || 0,
			}));
			table2Total = table2Data.reduce((sum, item) => sum + item.count, 0);
		}

		if (table2Data.length === 0) {
			console.log("  ⚠️  No data found (0 pending tickets)");
		} else {
			table2Data.forEach((item) => {
				console.log(`  ${item.label.padEnd(40)} ${item.count.toString().padStart(5)}`);
			});
		}
		console.log("─".repeat(80));
		console.log(`  TOTAL: ${table2Total} pending tickets of the Week`);
		console.log("═".repeat(80));

		// ═══════════════════════════════════════════════════════════════════════
		// TABLE 3: Recurrent in L2 & L3
		// ═══════════════════════════════════════════════════════════════════════
		console.log("\n" + "═".repeat(80));
		console.log("  TABLE 3: Recurrent in L2 & L3");
		console.log("  Filter: inDateRange=1 (all records, grouped by recurrence)");
		console.log("─".repeat(80));

		const table3Query = `
			SELECT
				recurrence,
				COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			WHERE inDateRange = 1
			GROUP BY recurrence
			ORDER BY count DESC
		`;

		const table3Result = db.exec(table3Query);
		let table3Data: GroupedResult[] = [];
		let table3Total = 0;

		if (table3Result && table3Result.length > 0) {
			table3Data = table3Result[0].values.map((row: any[]) => ({
				label: row[0] as string || "Unknown",
				count: row[1] as number || 0,
			}));
			table3Total = table3Data.reduce((sum, item) => sum + item.count, 0);
		}

		if (table3Data.length === 0) {
			console.log("  ⚠️  No data found");
		} else {
			table3Data.forEach((item) => {
				console.log(`  ${item.label.padEnd(40)} ${item.count.toString().padStart(5)}`);
			});
		}
		console.log("─".repeat(80));
		console.log(`  TOTAL: ${table3Total} tickets of the Week`);
		console.log("═".repeat(80));

		// ═══════════════════════════════════════════════════════════════════════
		// TABLE 4: Assigned to L3 Backlog
		// ═══════════════════════════════════════════════════════════════════════
		console.log("\n" + "═".repeat(80));
		console.log("  TABLE 4: Assigned to L3 Backlog");
		console.log("  Filter: inDateRange=1 AND (requestStatusReporte='In L3 Backlog' OR 'On going in L3')");
		console.log("─".repeat(80));

		const table4Query = `
			SELECT
				categorization,
				COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			WHERE inDateRange = 1
			  AND (
			    requestStatusReporte = 'In L3 Backlog'
			    OR requestStatusReporte = 'On going in L3'
			  )
			GROUP BY categorization
			ORDER BY count DESC
		`;

		const table4Result = db.exec(table4Query);
		let table4Data: GroupedResult[] = [];
		let table4Total = 0;

		if (table4Result && table4Result.length > 0) {
			table4Data = table4Result[0].values.map((row: any[]) => ({
				label: row[0] as string || "Unknown",
				count: row[1] as number || 0,
			}));
			table4Total = table4Data.reduce((sum, item) => sum + item.count, 0);
		}

		if (table4Data.length === 0) {
			console.log("  ⚠️  No data found");
		} else {
			table4Data.forEach((item) => {
				console.log(`  ${item.label.padEnd(40)} ${item.count.toString().padStart(5)}`);
			});
		}
		console.log("─".repeat(80));
		console.log(`  TOTAL: ${table4Total} pending tickets of the Week`);
		console.log("═".repeat(80));

		// ═══════════════════════════════════════════════════════════════════════
		// TABLE 5: L3 Status (from corrective_maintenance_records)
		// ═══════════════════════════════════════════════════════════════════════
		console.log("\n" + "═".repeat(80));
		console.log("  TABLE 5: L3 Status");
		console.log("  Data Source: corrective_maintenance_records");
		console.log("  Filter: inDateRange=0 (historical data)");
		console.log("─".repeat(80));

		const table5Query = `
			SELECT
				requestStatus,
				COUNT(*) as count
			FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}
			WHERE inDateRange = 0
			GROUP BY requestStatus
			ORDER BY count DESC
		`;

		const table5Result = db.exec(table5Query);
		let table5Data: GroupedResult[] = [];
		let table5Total = 0;

		if (table5Result && table5Result.length > 0) {
			table5Data = table5Result[0].values.map((row: any[]) => ({
				label: row[0] as string || "Unknown",
				count: row[1] as number || 0,
			}));
			table5Total = table5Data.reduce((sum, item) => sum + item.count, 0);
		}

		if (table5Data.length === 0) {
			console.log("  ⚠️  No data found");
		} else {
			table5Data.forEach((item) => {
				console.log(`  ${item.label.padEnd(40)} ${item.count.toString().padStart(5)}`);
			});
		}
		console.log("─".repeat(80));
		console.log(`  TOTAL: ${table5Total} tickets previous week`);
		console.log("═".repeat(80));

		// ═══════════════════════════════════════════════════════════════════════
		// SUMMARY
		// ═══════════════════════════════════════════════════════════════════════
		console.log("\n" + "═".repeat(80));
		console.log("  📊 SUMMARY");
		console.log("═".repeat(80));
		console.log(`  Table 1 (Resolved in L2):        ${table1Total.toString().padStart(5)} records`);
		console.log(`  Table 2 (Pending):                ${table2Total.toString().padStart(5)} records`);
		console.log(`  Table 3 (Recurrent):              ${table3Total.toString().padStart(5)} records`);
		console.log(`  Table 4 (L3 Backlog):             ${table4Total.toString().padStart(5)} records`);
		console.log(`  Table 5 (L3 Status - Historical): ${table5Total.toString().padStart(5)} records`);
		console.log("─".repeat(80));
		console.log(`  Total (Tables 1-4):               ${(table1Total + table2Total + table3Total + table4Total).toString().padStart(5)} records`);
		console.log("═".repeat(80));

		// ═══════════════════════════════════════════════════════════════════════
		// DATA QUALITY CHECKS
		// ═══════════════════════════════════════════════════════════════════════
		console.log("\n" + "═".repeat(80));
		console.log("  ✅ DATA QUALITY CHECKS");
		console.log("═".repeat(80));

		// Check total inDateRange=true records from monthly
		const totalInRangeQuery = `
			SELECT COUNT(*) as total
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			WHERE inDateRange = 1
		`;
		const totalInRangeResult = db.exec(totalInRangeQuery);
		const totalInRange = totalInRangeResult && totalInRangeResult[0] ? totalInRangeResult[0].values[0][0] : 0;

		console.log(`  Total monthly records with inDateRange=1:  ${totalInRange}`);
		console.log(`  Sum of Tables 1+2+4 (status specific):     ${table1Total + table2Total + table4Total}`);
		console.log(`  Table 3 (all in range, by recurrence):     ${table3Total}`);

		if (table3Total === totalInRange) {
			console.log(`  ✅ Table 3 matches total inDateRange records`);
		} else {
			console.log(`  ⚠️  Table 3 count (${table3Total}) != total inDateRange (${totalInRange})`);
		}

		// Check total inDateRange=false records from corrective
		const totalOutRangeQuery = `
			SELECT COUNT(*) as total
			FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}
			WHERE inDateRange = 0
		`;
		const totalOutRangeResult = db.exec(totalOutRangeQuery);
		const totalOutRange = totalOutRangeResult && totalOutRangeResult[0] ? totalOutRangeResult[0].values[0][0] : 0;

		console.log(`\n  Total corrective records with inDateRange=0: ${totalOutRange}`);
		console.log(`  Table 5 total:                               ${table5Total}`);

		if (table5Total === totalOutRange) {
			console.log(`  ✅ Table 5 matches total corrective out-of-range records`);
		} else {
			console.log(`  ⚠️  Table 5 count (${table5Total}) != total out-of-range (${totalOutRange})`);
		}

		console.log("═".repeat(80) + "\n");

	} catch (error) {
		console.error("\n❌ Error:", error);
		if (error instanceof Error) {
			console.error(error.stack);
		}
		process.exit(1);
	}
}

// Run the test
testIncidentOverviewTables()
	.then(() => {
		console.log("✅ Test completed successfully\n");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Script failed:", error);
		process.exit(1);
	});
