import { initDatabase, getDatabase, TABLE_NAMES } from "@app/database";

async function testBugCategorizationQuery(): Promise<void> {
	try {
		console.log("🧪 Testing Bug Categorization Query");
		console.log("━".repeat(80));
		console.log("");

		// Initialize database
		console.log("📦 Initializing database...");
		await initDatabase();
		const db = getDatabase();
		console.log("✅ Database initialized");
		console.log("");

		// TEST 1: Check if we have any records with "Error de codificación (Bug)" categorization
		console.log("TEST 1: Check Bug Categorization Records");
		console.log("─".repeat(80));

		const bugRecordsQuery = db.exec(`
			SELECT
				requestId,
				categorization,
				linkedRequestId,
				informacionAdicionalReporte,
				enlaces
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			WHERE categorization = 'Error de codificación (Bug)'
			LIMIT 10
		`);

		if (bugRecordsQuery[0] && bugRecordsQuery[0].values.length > 0) {
			console.log(`✅ Found ${bugRecordsQuery[0].values.length} bug categorization records (showing max 10)`);
			console.log("\nSample bug records:");
			bugRecordsQuery[0].values.forEach((row, idx) => {
				console.log(`  [${idx + 1}] RequestID: ${row[0]}, LinkedRequestID: ${row[2] || 'NULL'}, Enlaces: ${row[4]}`);
			});
		} else {
			console.log("❌ No records found with categorization = 'Error de codificación (Bug)'");
			console.log("\nChecking all distinct categorization values:");
			const allCategorizations = db.exec(`
				SELECT DISTINCT categorization
				FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
				WHERE categorization IS NOT NULL
				ORDER BY categorization
			`);
			if (allCategorizations[0]) {
				console.log("Available categorizations:");
				allCategorizations[0].values.forEach(row => {
					console.log(`  - "${row[0]}"`);
				});
			}
		}
		console.log("");

		// TEST 2: Check corrective maintenance records
		console.log("TEST 2: Check Corrective Maintenance Records");
		console.log("─".repeat(80));

		const correctiveRecordsQuery = db.exec(`
			SELECT
				requestId,
				requestIdLink,
				requestStatus,
				priority
			FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}
			LIMIT 10
		`);

		if (correctiveRecordsQuery[0] && correctiveRecordsQuery[0].values.length > 0) {
			console.log(`✅ Found ${correctiveRecordsQuery[0].values.length} corrective maintenance records (showing max 10)`);
			console.log("\nSample corrective records:");
			correctiveRecordsQuery[0].values.forEach((row, idx) => {
				console.log(`  [${idx + 1}] RequestID: ${row[0]}, Status: ${row[2]}`);
			});
		} else {
			console.log("❌ No corrective maintenance records found");
		}
		console.log("");

		// TEST 3: Test WRONG JOIN (current implementation)
		console.log("TEST 3: Test WRONG JOIN (m.linkedRequestId = c.requestIdLink)");
		console.log("─".repeat(80));

		const wrongJoinQuery = db.exec(`
			SELECT
				m.requestId as monthly_requestId,
				m.linkedRequestId,
				c.requestId as corrective_requestId,
				c.requestIdLink,
				m.categorization
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			INNER JOIN ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} c
				ON m.linkedRequestId = c.requestIdLink
			WHERE m.categorization = 'Error de codificación (Bug)'
			LIMIT 5
		`);

		if (wrongJoinQuery[0] && wrongJoinQuery[0].values.length > 0) {
			console.log(`✅ Found ${wrongJoinQuery[0].values.length} matches with WRONG join`);
			wrongJoinQuery[0].values.forEach((row, idx) => {
				console.log(`  [${idx + 1}] Monthly.linkedRequestId: ${row[1]} = Corrective.requestIdLink: ${row[3]}`);
			});
		} else {
			console.log("❌ No matches with WRONG join (m.linkedRequestId = c.requestIdLink)");
			console.log("   This is expected because we're comparing values with URLs");
		}
		console.log("");

		// TEST 4: Test CORRECT JOIN (fixed implementation)
		console.log("TEST 4: Test CORRECT JOIN (m.linkedRequestId = c.requestId)");
		console.log("─".repeat(80));

		const correctJoinQuery = db.exec(`
			SELECT
				m.requestId as monthly_requestId,
				m.linkedRequestId,
				c.requestId as corrective_requestId,
				m.categorization,
				m.informacionAdicionalReporte,
				m.enlaces,
				c.createdTime,
				c.requestStatus,
				c.eta,
				c.priority
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			INNER JOIN ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} c
				ON m.linkedRequestId = c.requestId
			WHERE m.categorization = 'Error de codificación (Bug)'
			LIMIT 5
		`);

		if (correctJoinQuery[0] && correctJoinQuery[0].values.length > 0) {
			console.log(`✅ Found ${correctJoinQuery[0].values.length} matches with CORRECT join`);
			console.log("\nSample matched records:");
			correctJoinQuery[0].values.forEach((row, idx) => {
				console.log(`\n  [${idx + 1}] Match:`);
				console.log(`      Monthly RequestID: ${row[0]}`);
				console.log(`      Linked RequestID: ${row[1]}`);
				console.log(`      Corrective RequestID: ${row[2]}`);
				console.log(`      Status: ${row[7]}`);
				console.log(`      Priority: ${row[9]}`);
			});
		} else {
			console.log("❌ No matches with CORRECT join (m.linkedRequestId = c.requestId)");
			console.log("\nDiagnosing potential issues:");

			// Check if linkedRequestId values exist in corrective maintenance
			const linkedIdsQuery = db.exec(`
				SELECT DISTINCT m.linkedRequestId
				FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
				WHERE m.categorization = 'Error de codificación (Bug)'
					AND m.linkedRequestId IS NOT NULL
					AND m.linkedRequestId != ''
				LIMIT 10
			`);

			if (linkedIdsQuery[0] && linkedIdsQuery[0].values.length > 0) {
				console.log("\nBug records have these linkedRequestId values:");
				linkedIdsQuery[0].values.forEach(row => {
					console.log(`  - "${row[0]}"`);
				});

				// Check if any of these exist in corrective maintenance
				const firstLinkedId = linkedIdsQuery[0].values[0][0];
				const matchCheck = db.exec(`
					SELECT requestId
					FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}
					WHERE requestId = ?
				`, [firstLinkedId]);

				if (matchCheck[0] && matchCheck[0].values.length > 0) {
					console.log(`\n✅ Found matching requestId in corrective maintenance: ${firstLinkedId}`);
				} else {
					console.log(`\n❌ No matching requestId in corrective maintenance for: ${firstLinkedId}`);
					console.log("\nThis means bug records' linkedRequestId values don't exist in corrective_maintenance_records");
				}
			} else {
				console.log("\n❌ Bug categorization records have no valid linkedRequestId values");
			}
		}
		console.log("");

		// TEST 5: Full query with GROUP BY (as in repository method)
		console.log("TEST 5: Full Query with GROUP BY");
		console.log("─".repeat(80));

		const fullQuery = db.exec(`
			SELECT
				m.linkedRequestId,
				m.informacionAdicionalReporte,
				m.enlaces,
				COUNT(*) as recordCount,
				c.createdTime,
				c.requestStatus,
				c.eta,
				c.priority
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			INNER JOIN ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} c
				ON m.linkedRequestId = c.requestId
			WHERE m.categorization = 'Error de codificación (Bug)'
			GROUP BY m.linkedRequestId, m.informacionAdicionalReporte, m.enlaces
			ORDER BY recordCount DESC, m.linkedRequestId ASC
		`);

		if (fullQuery[0] && fullQuery[0].values.length > 0) {
			console.log(`✅ Found ${fullQuery[0].values.length} grouped records`);
			console.log("\nGrouped results:");
			fullQuery[0].values.forEach((row, idx) => {
				console.log(`\n  [${idx + 1}] Grouped Record:`);
				console.log(`      Linked RequestID: ${row[0]}`);
				console.log(`      Record Count: ${row[3]}`);
				console.log(`      Enlaces: ${row[2]}`);
				console.log(`      Status: ${row[5]}`);
				console.log(`      Priority: ${row[7]}`);
			});
		} else {
			console.log("❌ No grouped records found");
		}
		console.log("");

		// Summary
		console.log("━".repeat(80));
		console.log("📊 Test Summary:");
		const bugCount = bugRecordsQuery[0]?.values.length || 0;
		const correctiveCount = correctiveRecordsQuery[0]?.values.length || 0;
		const wrongJoinCount = wrongJoinQuery[0]?.values.length || 0;
		const correctJoinCount = correctJoinQuery[0]?.values.length || 0;
		const finalCount = fullQuery[0]?.values.length || 0;

		console.log(`  Bug categorization records: ${bugCount}`);
		console.log(`  Corrective maintenance records: ${correctiveCount}`);
		console.log(`  Wrong JOIN results: ${wrongJoinCount}`);
		console.log(`  Correct JOIN results: ${correctJoinCount}`);
		console.log(`  Final grouped results: ${finalCount}`);
		console.log("");

		if (finalCount > 0) {
			console.log("✅ Query is working correctly!");
		} else {
			console.log("⚠️  Query needs investigation - no results found");
		}

	} catch (error) {
		console.error("\n❌ Error testing bug categorization query:");
		console.error("━".repeat(80));
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

// Run the test
testBugCategorizationQuery()
	.then(() => {
		console.log("\n✅ Test completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n❌ Test failed:", error);
		process.exit(1);
	});
