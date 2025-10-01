import { getDatabase, TABLE_NAMES, initializeDatabase } from "@app/database";

interface ModuleCount {
	module: string;
	"UN-2": number;
	Total: number;
}

interface QueryResult {
	module: string;
	businessUnit: string;
	count: number;
}

async function querySemanalModuleCounts(): Promise<void> {
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
		console.log("🔍 Querying semanal module counts...\n");

		const db = getDatabase();

		// SQL query to count records by module and business unit within date range
		// Filtered for UN-2 business unit only
		const query = `
			SELECT
				COALESCE(module, 'Unknown') as module,
				COALESCE(businessUnit, 'Unknown') as businessUnit,
				COUNT(*) as count
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			WHERE inDateRange = 1 AND businessUnit = 'UN-2'
			GROUP BY module, businessUnit
			ORDER BY module, businessUnit
		`;

		console.log("📊 Executing query:", query.replace(/\s+/g, ' ').trim());
		console.log("");

		const result = db.exec(query);

		if (!result || result.length === 0) {
			console.log("❌ No data found or query returned empty result");

			// Check if table exists and has any data
			const countQuery = `SELECT COUNT(*) as total FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}`;
			const countResult = db.exec(countQuery);

			if (countResult && countResult.length > 0) {
				const totalRecords = countResult[0].values[0][0];
				console.log(`📊 Total records in monthly_report_records table: ${totalRecords}`);

				if (Number(totalRecords) > 0) {
					// Check inDateRange values
					const dateRangeQuery = `SELECT inDateRange, COUNT(*) as count FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} GROUP BY inDateRange`;
					const dateRangeResult = db.exec(dateRangeQuery);

					if (dateRangeResult && dateRangeResult.length > 0) {
						console.log("🔍 Date range value distribution:");
						dateRangeResult[0].values.forEach((row: any[]) => {
							console.log(`  - inDateRange = ${row[0]}: ${row[1]} records`);
						});
					}
				}
			} else {
				console.log("📋 Monthly report records table is empty");
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
				module: recordObj.module || 'Unknown',
				businessUnit: recordObj.businessUnit || 'Unknown',
				count: Number(recordObj.count) || 0
			};
		});

		// Get unique modules and business units (filtered for UN-2 only)
		const modules = [...new Set(queryResults.map(r => r.module))].sort();
		const businessUnits = ['UN-2']; // Only UN-2 since we filtered for it

		// Build the result table
		const moduleData: ModuleCount[] = [];
		let grandTotal = 0;

		for (const module of modules) {
			const moduleRow: ModuleCount = {
				module,
				"UN-2": 0,
				Total: 0
			};

			// Fill in counts for each business unit
			for (const bu of businessUnits) {
				const found = queryResults.find(r => r.module === module && r.businessUnit === bu);
				const count = found ? found.count : 0;
				(moduleRow as any)[bu] = count;
				moduleRow.Total += count;
			}

			// Handle any business units not in our standard list
			const otherBUs = queryResults
				.filter(r => r.module === module && !businessUnits.includes(r.businessUnit))
				.reduce((sum, r) => sum + r.count, 0);

			moduleRow.Total += otherBUs;
			grandTotal += moduleRow.Total;
			moduleData.push(moduleRow);
		}

		// Add total row
		const totalRow: ModuleCount = {
			module: 'Total general',
			"UN-2": 0,
			Total: grandTotal
		};

		// Calculate totals for each business unit
		for (const bu of businessUnits) {
			(totalRow as any)[bu] = moduleData.reduce((sum, row) => sum + (row as any)[bu], 0);
		}

		moduleData.push(totalRow);

		// Display results
		console.log("📋 Semanal Module Counts Report (UN-2 Business Unit Only)");
		console.log("=" .repeat(60));
		console.log("");

		// Print header
		const headerRow = [
			"Etiquetas de fila".padEnd(40),
			...businessUnits.map(bu => bu.padStart(8)),
			"Total".padStart(8)
		].join(" | ");

		console.log(headerRow);
		console.log("-".repeat(headerRow.length));

		// Print data rows
		for (const row of moduleData) {
			const dataRow = [
				row.module.padEnd(40),
				...businessUnits.map(bu => ((row as any)[bu]).toString().padStart(8)),
				row.Total.toString().padStart(8)
			].join(" | ");

			console.log(dataRow);
		}

		console.log("");
		console.log(`📊 Total records in semanal range: ${grandTotal}`);

		// Additional summary
		const activeRangeQuery = `
			SELECT fromDate, toDate, description
			FROM ${TABLE_NAMES.SEMANAL_DATE_RANGES}
			WHERE isActive = 1
			LIMIT 1
		`;

		const rangeResult = db.exec(activeRangeQuery);
		if (rangeResult && rangeResult.length > 0 && rangeResult[0].values.length > 0) {
			const [fromDate, toDate, description] = rangeResult[0].values[0];
			console.log(`📅 Active semanal range: ${fromDate} to ${toDate} (${description})`);
		}

	} catch (error) {
		console.error("❌ Error querying semanal module counts:", error);
		process.exit(1);
	}
}

// Run the query
querySemanalModuleCounts()
	.then(() => {
		console.log("\n✅ Query completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Script failed:", error);
		process.exit(1);
	});