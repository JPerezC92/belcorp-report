import { getDatabase, initializeDatabase, TABLE_NAMES } from "./packages/database/dist/index.js";

async function testTableSchema() {
	console.log("\n=== Checking monthly_report_records Table Schema ===\n");

	try {
		await initializeDatabase();
		const db = getDatabase();

		// Get table schema
		const schemaResult = db.exec(`PRAGMA table_info(${TABLE_NAMES.MONTHLY_REPORT_RECORDS})`);

		if (!schemaResult[0]) {
			console.log("❌ Table does not exist!\n");
			return;
		}

		const columns = schemaResult[0].values;
		console.log(`✅ Table exists with ${columns.length} columns:\n`);

		// Display all columns
		columns.forEach((col, index) => {
			const [cid, name, type, notnull, dflt_value, pk] = col;
			console.log(`${index + 1}. ${name}`);
			console.log(`   Type: ${type}`);
			console.log(`   Nullable: ${notnull === 0 ? "Yes" : "No"}`);
			if (dflt_value !== null) {
				console.log(`   Default: ${dflt_value}`);
			}
			if (pk === 1) {
				console.log(`   PRIMARY KEY`);
			}
			console.log();
		});

		// Check for computed_level specifically
		const hasComputedLevel = columns.some(col => col[1] === "computed_level");

		if (hasComputedLevel) {
			console.log("✅ computed_level column EXISTS in the table schema!");
		} else {
			console.log("❌ computed_level column NOT FOUND in the table schema!");
			console.log("   The migration may not have run correctly.");
		}
		console.log();

		// Check level mapping table
		console.log("Checking monthly_report_level_mapping table:");
		const levelMappingSchema = db.exec(`PRAGMA table_info(${TABLE_NAMES.MONTHLY_REPORT_LEVEL_MAPPING})`);

		if (!levelMappingSchema[0]) {
			console.log("❌ Level mapping table does not exist!\n");
		} else {
			console.log(`✅ Level mapping table exists with ${levelMappingSchema[0].values.length} columns`);

			// Check if it has default data
			const defaultData = db.exec(`SELECT COUNT(*) FROM ${TABLE_NAMES.MONTHLY_REPORT_LEVEL_MAPPING}`);
			const count = defaultData[0]?.values[0]?.[0];
			console.log(`   Contains ${count} mapping rules\n`);

			if (count > 0) {
				const mappings = db.exec(`SELECT requestStatusReporte, level FROM ${TABLE_NAMES.MONTHLY_REPORT_LEVEL_MAPPING}`);
				console.log("   Default mappings:");
				mappings[0]?.values.forEach(row => {
					console.log(`   - "${row[0]}" → ${row[1]}`);
				});
			}
		}

	} catch (error) {
		console.error("❌ Error:", error.message);
	}
}

testTableSchema()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
