import { initializeDatabase, getDatabase, TABLE_NAMES } from "@app/database";
import * as path from "path";

async function verifyRecordCount() {
	console.log("=".repeat(80));
	console.log("VERIFYING RECORD COUNT FOR LINKED REQUEST ID: 91315");
	console.log("=".repeat(80));

	// Initialize database - use the actual Electron app database location
	const dbPath = "C:\\Users\\dexm7\\AppData\\Roaming\\root\\app-database.db";
	console.log(`\nInitializing database from: ${dbPath}\n`);

	try {
		await initializeDatabase({ path: dbPath });
		const db = getDatabase();

		// Query 1: Simple count of records with linkedRequestId = '91315'
		console.log("1. SIMPLE COUNT QUERY");
		console.log("-".repeat(80));
		const simpleCount = db.exec(`
			SELECT COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			WHERE linkedRequestId = '91315'
		`);
		console.log("Total records with linkedRequestId = '91315':", simpleCount[0]?.values[0]?.[0]);

		// Query 2: Count with Bug categorization filter
		console.log("\n2. COUNT WITH BUG CATEGORIZATION FILTER");
		console.log("-".repeat(80));
		const bugCount = db.exec(`
			SELECT COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			WHERE linkedRequestId = '91315'
			AND categorization = 'Error de codificación (Bug)'
		`);
		console.log("Records with linkedRequestId = '91315' AND categorization = 'Bug':", bugCount[0]?.values[0]?.[0]);

		// Query 3: Show all requestIds with linkedRequestId = '91315'
		console.log("\n3. ALL REQUEST IDs WITH LINKED REQUEST ID = '91315'");
		console.log("-".repeat(80));
		const allRecords = db.exec(`
			SELECT requestId, categorization, informacionAdicionalReporte, linkedRequestId
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			WHERE linkedRequestId = '91315'
			ORDER BY requestId
		`);

		if (allRecords[0]) {
			console.log("Total rows:", allRecords[0].values.length);
			console.log("\nFirst 25 records:");
			allRecords[0].values.slice(0, 25).forEach((row, idx) => {
				console.log(`  ${idx + 1}. ${row[0]} | ${row[1]} | ${row[2]?.substring(0, 50) || 'NULL'}`);
			});

			if (allRecords[0].values.length > 25) {
				console.log(`\n  ... and ${allRecords[0].values.length - 25} more records`);
			}
		}

		// Query 4: Group by informacionAdicionalReporte (like the actual query does)
		console.log("\n4. GROUPED BY INFORMACIÓN ADICIONAL (MATCHING ACTUAL QUERY LOGIC)");
		console.log("-".repeat(80));
		const groupedQuery = db.exec(`
			SELECT
				m.linkedRequestId,
				m.informacionAdicionalReporte,
				COUNT(*) as recordCount
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			WHERE m.categorization = 'Error de codificación (Bug)'
				AND m.linkedRequestId = '91315'
			GROUP BY
				m.linkedRequestId,
				m.informacionAdicionalReporte
			ORDER BY recordCount DESC
		`);

		if (groupedQuery[0]) {
			console.log(`Found ${groupedQuery[0].values.length} group(s):`);
			groupedQuery[0].values.forEach((row, idx) => {
				console.log(`  Group ${idx + 1}:`);
				console.log(`    linkedRequestId: ${row[0]}`);
				console.log(`    informacionAdicionalReporte: ${row[1]}`);
				console.log(`    recordCount: ${row[2]}`);
				console.log("");
			});

			const totalFromGroups = groupedQuery[0].values.reduce((sum, row) => sum + (row[2] as number), 0);
			console.log(`Total recordCount from all groups: ${totalFromGroups}`);
		}

		// Query 5: The exact query from getBugCategorizedRecordsWithCorrectiveData
		console.log("\n5. EXACT QUERY FROM getBugCategorizedRecordsWithCorrectiveData");
		console.log("-".repeat(80));
		const stmt = db.prepare(`
			SELECT
				CASE
					WHEN m.linkedRequestId IS NULL OR m.linkedRequestId = ''
					THEN NULL
					ELSE m.linkedRequestId
				END as linkedRequestId,
				CASE
					WHEN m.linkedRequestId IS NULL OR m.linkedRequestId = ''
					THEN NULL
					ELSE m.linkedRequestIdLink
				END as linkedRequestIdLink,
				CASE
					WHEN m.linkedRequestId IS NULL OR m.linkedRequestId = ''
					THEN 'To Be evaluated'
					ELSE m.informacionAdicionalReporte
				END as informacionAdicionalReporte,
				CASE
					WHEN m.linkedRequestId IS NULL OR m.linkedRequestId = ''
					THEN 0
					ELSE COALESCE((SELECT COUNT(*)
						FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} p
						WHERE p.childRequestId = m.linkedRequestId), 0)
				END as enlaces,
				COUNT(*) as recordCount,
				CASE
					WHEN m.linkedRequestId IS NULL OR m.linkedRequestId = ''
					THEN NULL
					ELSE c.createdTime
				END as createdTime,
				CASE
					WHEN m.linkedRequestId IS NULL OR m.linkedRequestId = ''
					THEN NULL
					ELSE c.requestStatus
				END as requestStatus,
				CASE
					WHEN m.linkedRequestId IS NULL OR m.linkedRequestId = ''
					THEN NULL
					ELSE c.eta
				END as eta,
				CASE
					WHEN m.linkedRequestId IS NULL OR m.linkedRequestId = ''
					THEN NULL
					ELSE c.priority
				END as priority
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			LEFT JOIN ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} c
				ON m.linkedRequestId = c.requestId
			WHERE m.categorization = 'Error de codificación (Bug)'
				AND m.linkedRequestId = '91315'
			GROUP BY
				CASE
					WHEN m.linkedRequestId IS NULL OR m.linkedRequestId = ''
					THEN 'NO_LINKED_REQUEST_GROUP'
					ELSE m.linkedRequestId
				END,
				CASE
					WHEN m.linkedRequestId IS NULL OR m.linkedRequestId = ''
					THEN 'To Be evaluated'
					ELSE m.informacionAdicionalReporte
				END
			ORDER BY enlaces DESC, recordCount DESC, linkedRequestId ASC
		`);

		const results: any[] = [];
		try {
			while (stmt.step()) {
				const row = stmt.getAsObject();
				results.push(row);
			}
		} finally {
			stmt.free();
		}

		console.log(`Found ${results.length} group(s) for linkedRequestId '91315':`);
		results.forEach((row, idx) => {
			console.log(`\n  Group ${idx + 1}:`);
			console.log(`    linkedRequestId: ${row.linkedRequestId}`);
			console.log(`    informacionAdicionalReporte: ${row.informacionAdicionalReporte}`);
			console.log(`    enlaces: ${row.enlaces}`);
			console.log(`    recordCount: ${row.recordCount}`);
			console.log(`    createdTime: ${row.createdTime}`);
			console.log(`    requestStatus: ${row.requestStatus}`);
			console.log(`    eta: ${row.eta}`);
			console.log(`    priority: ${row.priority}`);
		});

		const totalRecordCount = results.reduce((sum, row) => sum + Number(row.recordCount), 0);
		console.log(`\n  Total recordCount shown in frontend: ${totalRecordCount}`);

		// Query 6: Check for any differences in informacionAdicionalReporte
		console.log("\n6. DISTINCT INFORMACIÓN ADICIONAL VALUES FOR 91315");
		console.log("-".repeat(80));
		const distinctInfo = db.exec(`
			SELECT DISTINCT informacionAdicionalReporte, COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			WHERE linkedRequestId = '91315'
				AND categorization = 'Error de codificación (Bug)'
			GROUP BY informacionAdicionalReporte
		`);

		if (distinctInfo[0]) {
			console.log(`Found ${distinctInfo[0].values.length} distinct informacionAdicionalReporte value(s):`);
			distinctInfo[0].values.forEach((row, idx) => {
				console.log(`  ${idx + 1}. "${row[0]}" - Count: ${row[1]}`);
			});
		}

		console.log("\n" + "=".repeat(80));
		console.log("ANALYSIS COMPLETE");
		console.log("=".repeat(80));

	} catch (error) {
		console.error("Error:", error);
		throw error;
	}
}

verifyRecordCount().catch(console.error);
