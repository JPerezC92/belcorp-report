import { DatabaseManager } from "../packages/database/src/database-manager.js";
import { TABLE_NAMES } from "../packages/database/src/table-names.js";

async function testBusinessUnitFiltering() {
	try {
		console.log("Testing business unit filtering fix...");
		const dbManager = DatabaseManager.getInstance();

		// Test the fixed query directly
		const testQuery = `
			SELECT requestId FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} cmr
			WHERE cmr.businessUnit = ? AND cmr.requestStatus = ? LIMIT 5
		`;

		console.log("Testing fixed query:", testQuery);
		const results = await dbManager.query(testQuery, [
			"SB",
			"PRD Deployment",
		]);

		console.log("Query executed successfully!");
		console.log("Results:", results);
	} catch (error) {
		console.error("Query failed:", error);
	} finally {
		process.exit(0);
	}
}

testBusinessUnitFiltering();
