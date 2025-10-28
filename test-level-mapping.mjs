import { getDatabase, initializeDatabase, TABLE_NAMES } from "./packages/database/dist/index.js";

async function testLevelMappingQuery() {
	console.log("\n=== Testing Monthly Report Level Mapping (Using Repository Logic) ===\n");

	try {
		// Initialize database
		await initializeDatabase();
		const db = getDatabase();

		// Check total records
		console.log("1. Checking total records...");
		const totalResult = db.exec(
			`SELECT COUNT(*) as total FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}`,
		);
		if (totalResult.length > 0 && totalResult[0].values.length > 0) {
			console.log(`   Total records: ${totalResult[0].values[0][0]}\n`);
		} else {
			console.log("   No records found!\n");
		}

		// Use THE EXACT SAME QUERY as SqlJsMonthlyReportRecordRepository.getWithEnlaces()
		console.log("2. Using repository query (getWithEnlaces):");
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

		if (!result[0]) {
			console.log("   ❌ No results found!\n");
			console.log("   This means the monthly_report_records table is empty.");
			console.log("   You need to upload a monthly report Excel file first.\n");
			return;
		}

		const columns = result[0].columns;
		const values = result[0].values;

		console.log(`   ✅ Found ${values.length} records`);
		console.log(`   Total columns: ${columns.length}`);
		console.log(`   Column names:`, columns.join(", "));
		console.log();

		// Find computed_level column index
		const computedLevelIndex = columns.indexOf("computed_level");
		const requestIdIndex = columns.indexOf("requestId");
		const createdTimeIndex = columns.indexOf("createdTime");
		const requestStatusReporteIndex = columns.indexOf("requestStatusReporte");

		console.log("   Column positions:");
		console.log(`   - requestId: ${requestIdIndex}`);
		console.log(`   - createdTime: ${createdTimeIndex}`);
		console.log(`   - requestStatusReporte: ${requestStatusReporteIndex}`);
		console.log(`   - computed_level: ${computedLevelIndex} ${computedLevelIndex < 0 ? "⚠️ COLUMN NOT FOUND!" : "✅"}`);
		console.log();

		// Show sample records with computed_level
		console.log("3. Sample records:");
		values.forEach((row, index) => {
			console.log(`   [${index + 1}]`, {
				requestId: row[requestIdIndex],
				createdTime: row[createdTimeIndex]?.substring(0, 10),
				requestStatusReporte: row[requestStatusReporteIndex],
				computed_level: computedLevelIndex >= 0 ? row[computedLevelIndex] : "⚠️ COLUMN NOT FOUND",
			});
		});
		console.log();

		// Group by level
		console.log("4. Counts by computed_level:");
		const groupedResult = db.exec(`
			SELECT
				COALESCE(computed_level, 'NULL') as level,
				COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			GROUP BY computed_level
			ORDER BY count DESC
		`);

		if (groupedResult.length > 0 && groupedResult[0].values.length > 0) {
			groupedResult[0].values.forEach((row) => {
				const level = row[0];
				const count = row[1];
				console.log(`   ${level}: ${count} records`);
			});
			console.log();
		} else {
			console.log("   No data found!\n");
		}

		// Check level mapping table
		console.log("5. Level mapping rules:");
		const mappingsResult = db.exec(`
			SELECT requestStatusReporte, level, createdAt
			FROM ${TABLE_NAMES.MONTHLY_REPORT_LEVEL_MAPPING}
			ORDER BY requestStatusReporte
		`);

		if (mappingsResult.length > 0 && mappingsResult[0].values.length > 0) {
			mappingsResult[0].values.forEach((row) => {
				console.log(`   "${row[0]}" → ${row[1]}`);
			});
			console.log();
		} else {
			console.log("   ⚠️  No level mappings found in database!\n");
			console.log("   Expected default mappings:");
			console.log("   - Closed → L2");
			console.log("   - On going in L2 → L2");
			console.log("   - In L3 Backlog → L3");
			console.log("   - On going in L3 → L3\n");
		}

		console.log("=== Test Complete ===\n");

		// Summary
		if (computedLevelIndex < 0) {
			console.log("⚠️  ISSUE FOUND: computed_level column does not exist in the table!");
			console.log("   The database migration may not have run correctly.");
			console.log("   Try deleting the database file and restarting the app.\n");
		} else if (groupedResult[0]?.values.every(row => row[0] === "NULL")) {
			console.log("⚠️  ISSUE FOUND: All computed_level values are NULL!");
			console.log("   This means:");
			console.log("   1. Level mapping is not working during Excel upload, OR");
			console.log("   2. Data was uploaded before level mapping was implemented\n");
			console.log("   Solution: Upload a new monthly report Excel file.\n");
		} else {
			console.log("✅ Everything looks good! computed_level column exists and has data.\n");
		}

	} catch (error) {
		console.error("❌ Error running test:", error);
		if (error instanceof Error) {
			console.error("Message:", error.message);
			console.error("Stack:", error.stack);
		}
		process.exit(1);
	}
}

testLevelMappingQuery()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
