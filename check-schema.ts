import { query } from "@app/database";

console.log("Checking database schema...");

// Check table structure
const tableInfo = query("PRAGMA table_info(corrective_maintenance_records)");
console.log("Table structure:");
tableInfo.forEach((col) => {
	console.log(`  ${col.name}: ${col.type}`);
});

// Check if businessUnit column exists
const hasBusinessUnit = tableInfo.some(
	(col) => (col as { name: string }).name === "businessUnit"
);
console.log(`businessUnit column exists: ${hasBusinessUnit}`);

// Try a simple query with the column
if (hasBusinessUnit) {
	try {
		const testQuery = query(
			"SELECT businessUnit FROM corrective_maintenance_records LIMIT 1"
		);
		console.log("Test query successful:", testQuery);
	} catch (error) {
		console.log("Test query failed:", error);
	}
}
