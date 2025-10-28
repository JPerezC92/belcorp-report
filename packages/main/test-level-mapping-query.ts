import { getDatabase, initializeDatabase, TABLE_NAMES } from "@app/database";
import { monthlyReportDbModelToDomain } from "@app/core";

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
			return;
		}

		const columns = result[0].columns;
		const values = result[0].values;

		console.log(`   ✅ Found ${values.length} records`);
		console.log(`   Columns (${columns.length}):`, columns);
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
		console.log(`   - computed_level: ${computedLevelIndex}`);
		console.log();

		// Show sample records with computed_level
		console.log("3. Sample records:");
		values.forEach((row, index) => {
			const recordObj: any = {};
			columns.forEach((col, idx) => {
				recordObj[col] = row[idx];
			});

			console.log(`   [${index + 1}]`, {
				requestId: row[requestIdIndex],
				createdTime: row[createdTimeIndex],
				requestStatusReporte: row[requestStatusReporteIndex],
				computed_level: computedLevelIndex >= 0 ? row[computedLevelIndex] : "COLUMN NOT FOUND",
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
				console.log(`   ${row[0]}: ${row[1]} records`);
			});
			console.log();
		} else {
			console.log("   No data found!\n");
		}

		// Check level mapping table
		console.log("5. Level mapping rules:");
		const mappingsResult = db.exec(`
			SELECT requestStatusReporte, level
			FROM ${TABLE_NAMES.MONTHLY_REPORT_LEVEL_MAPPING}
			ORDER BY requestStatusReporte
		`);

		if (mappingsResult.length > 0 && mappingsResult[0].values.length > 0) {
			mappingsResult[0].values.forEach((row) => {
				console.log(`   "${row[0]}" → ${row[1]}`);
			});
			console.log();
		} else {
			console.log("   ⚠️  No level mappings found!\n");
		}

		// Test domain conversion
		console.log("6. Testing domain entity conversion:");
		if (values.length > 0) {
			const firstRow = values[0];
			const recordObj: any = {};
			columns.forEach((col, index) => {
				recordObj[col] = firstRow[index];
			});

			console.log("   Raw DB record keys:", Object.keys(recordObj));
			console.log("   computed_level value:", recordObj.computed_level);
			console.log();
		}

		console.log("=== Test Complete ===\n");
	} catch (error) {
		console.error("❌ Error running test:", error);
		if (error instanceof Error) {
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
