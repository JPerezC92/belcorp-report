import { getDatabase, TABLE_NAMES, initializeDatabase } from "@app/database";

interface L3SummaryRow {
	requestStatus: string;
	Critical: number;
	High: number;
	Medium: number;
	Low: number;
	TOTAL: number;
}

interface QueryResult {
	requestStatus: string;
	priority: string;
	count: number;
}

async function testL3SummaryQuery(): Promise<void> {
	try {
		console.log("🔍 Initializing database...");

		// Initialize the database first
		await initializeDatabase({
			path: "C:\\Users\\dexm7\\AppData\\Roaming\\root\\app-database.db",
			autoSave: true,
			enableWAL: false,
			autoVacuum: true,
		});

		console.log("✅ Database initialized successfully");
		console.log("🔍 Querying L3 summary data (Request Status × Priority)...\n");

		const db = getDatabase();

		// SQL query to count records by requestStatus and priority
		const query = `
			SELECT
				COALESCE(requestStatus, 'Unknown') as requestStatus,
				COALESCE(priority, 'Unknown') as priority,
				COUNT(*) as count
			FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}
			GROUP BY requestStatus, priority
			ORDER BY requestStatus, priority
		`;

		console.log("📊 Executing query:", query.replace(/\s+/g, ' ').trim());
		console.log("");

		const result = db.exec(query);

		if (!result || result.length === 0) {
			console.log("❌ No data found or query returned empty result");

			// Check if table exists and has any data
			const countQuery = `SELECT COUNT(*) as total FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}`;
			const countResult = db.exec(countQuery);

			if (countResult && countResult.length > 0) {
				const totalRecords = countResult[0].values[0][0];
				console.log(`📊 Total records in corrective_maintenance_records table: ${totalRecords}`);
			} else {
				console.log("📋 Corrective maintenance records table is empty");
			}

			return;
		}

		const columns = result[0].columns;
		const values = result[0].values;

		// Parse results into structured data
		const queryResults: QueryResult[] = values.map((row: any[]) => {
			const recordObj: any = {};
			columns.forEach((col: string, index: number) => {
				recordObj[col] = row[index];
			});
			return {
				requestStatus: recordObj.requestStatus || 'Unknown',
				priority: recordObj.priority || 'Unknown',
				count: Number(recordObj.count) || 0
			};
		});

		// Get unique request statuses and priorities
		const requestStatuses = [...new Set(queryResults.map(r => r.requestStatus))].sort();
		const priorities = ['Critical', 'High', 'Medium', 'Low'];

		console.log("📋 Found Request Statuses:", requestStatuses.join(", "));
		console.log("📋 Found Priorities:", [...new Set(queryResults.map(r => r.priority))].join(", "));
		console.log("");

		// Build the result table
		const summaryData: L3SummaryRow[] = [];
		let grandTotal = 0;

		for (const status of requestStatuses) {
			const statusRow: L3SummaryRow = {
				requestStatus: status,
				Critical: 0,
				High: 0,
				Medium: 0,
				Low: 0,
				TOTAL: 0
			};

			// Fill in counts for each priority
			for (const priority of priorities) {
				const found = queryResults.find(r => r.requestStatus === status && r.priority === priority);
				const count = found ? found.count : 0;
				(statusRow as any)[priority] = count;
				statusRow.TOTAL += count;
			}

			// Handle any priorities not in our standard list (e.g., "Unknown")
			const otherPriorities = queryResults
				.filter(r => r.requestStatus === status && !priorities.includes(r.priority))
				.reduce((sum, r) => sum + r.count, 0);

			if (otherPriorities > 0) {
				console.log(`⚠️  Warning: Found ${otherPriorities} records with non-standard priority for status "${status}"`);
				statusRow.TOTAL += otherPriorities;
			}

			grandTotal += statusRow.TOTAL;
			summaryData.push(statusRow);
		}

		// Add total row
		const totalRow: L3SummaryRow = {
			requestStatus: 'TOTAL',
			Critical: 0,
			High: 0,
			Medium: 0,
			Low: 0,
			TOTAL: grandTotal
		};

		// Calculate totals for each priority
		for (const priority of priorities) {
			(totalRow as any)[priority] = summaryData.reduce((sum, row) => sum + (row as any)[priority], 0);
		}

		summaryData.push(totalRow);

		// Display results in table format
		console.log("📋 L3 Summary - Pending code fixes");
		console.log("=" .repeat(90));
		console.log("");

		// Print header
		const colWidths = {
			status: 35,
			priority: 10
		};

		const headerRow = [
			"Request Status".padEnd(colWidths.status),
			"Critical".padStart(colWidths.priority),
			"High".padStart(colWidths.priority),
			"Medium".padStart(colWidths.priority),
			"Low".padStart(colWidths.priority),
			"TOTAL".padStart(colWidths.priority)
		].join(" | ");

		console.log(headerRow);
		console.log("-".repeat(headerRow.length));

		// Print data rows
		for (const row of summaryData) {
			const isTotal = row.requestStatus === 'TOTAL';
			const statusLabel = isTotal ? row.requestStatus : row.requestStatus;

			const dataRow = [
				statusLabel.padEnd(colWidths.status),
				row.Critical.toString().padStart(colWidths.priority),
				row.High.toString().padStart(colWidths.priority),
				row.Medium.toString().padStart(colWidths.priority),
				row.Low.toString().padStart(colWidths.priority),
				row.TOTAL.toString().padStart(colWidths.priority)
			].join(" | ");

			if (isTotal) {
				console.log("=".repeat(headerRow.length));
			}
			console.log(dataRow);
		}

		console.log("");
		console.log(`📊 Total corrective maintenance records: ${grandTotal}`);

		// Show breakdown by priority
		console.log("");
		console.log("📊 Priority Distribution:");
		for (const priority of priorities) {
			const count = summaryData[summaryData.length - 1][priority as keyof L3SummaryRow];
			const percentage = grandTotal > 0 ? ((count as number) / grandTotal * 100).toFixed(1) : '0.0';
			console.log(`   ${priority.padEnd(10)}: ${count.toString().padStart(5)} (${percentage}%)`);
		}

		// Show breakdown by request status
		console.log("");
		console.log("📊 Request Status Distribution:");
		for (const row of summaryData) {
			if (row.requestStatus !== 'TOTAL') {
				const percentage = grandTotal > 0 ? (row.TOTAL / grandTotal * 100).toFixed(1) : '0.0';
				console.log(`   ${row.requestStatus.padEnd(35)}: ${row.TOTAL.toString().padStart(5)} (${percentage}%)`);
			}
		}

	} catch (error) {
		console.error("❌ Error querying L3 summary data:", error);
		process.exit(1);
	}
}

// Run the query
testL3SummaryQuery()
	.then(() => {
		console.log("\n✅ Query completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Script failed:", error);
		process.exit(1);
	});
