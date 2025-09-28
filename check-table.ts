import { query } from "@app/database";

console.log("Checking table structure...");

// Check table info
const tableInfo = query("PRAGMA table_info(corrective_maintenance_records)");
console.log("Columns in corrective_maintenance_records:");
tableInfo.forEach((col, index) => {
	console.log(
		`${index + 1}. ${col.name}: ${col.type} ${
			col.notnull ? "NOT NULL" : ""
		} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ""}`
	);
});

// Check if businessUnit exists
const hasBusinessUnit = tableInfo.some((col) => col.name === "businessUnit");
console.log(`\nbusinessUnit column exists: ${hasBusinessUnit}`);

// Try the exact failing query
if (hasBusinessUnit) {
	console.log("\nTrying the exact failing query...");
	try {
		const testResults = query(
			`SELECT cmr.*, COALESCE((SELECT COUNT(*) FROM parent_child_relationships pcr WHERE pcr.childRequestId = cmr.requestId), 0) as enlaces_count FROM corrective_maintenance_records cmr WHERE cmr.businessUnit = ? AND cmr.requestStatus = ? ORDER BY cmr.createdAt DESC`,
			["SB", "In Testing"]
		);
		console.log(`Query succeeded, returned ${testResults.length} rows`);
	} catch (error) {
		console.log(`Query failed: ${error}`);
	}
}
