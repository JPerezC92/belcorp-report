import { TABLE_NAMES } from "@app/database";

function buildFailingQuery(businessUnit: string, requestStatus?: string) {
	// Build the WHERE clause dynamically - exactly like in the repository
	let whereClause = "WHERE cmr.businessUnit = ?";
	const params: (string | undefined)[] = [businessUnit];

	if (requestStatus) {
		whereClause += " AND cmr.requestStatus = ?";
		params.push(requestStatus);
	}

	// Build the main query - exactly like in the repository
	const mainQuery = `SELECT
    cmr.*,
    COALESCE((
      SELECT COUNT(*)
      FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} pcr
      WHERE pcr.childRequestId = cmr.requestId
    ), 0) as enlaces_count
  FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} cmr
  ${whereClause}
  ORDER BY cmr.createdAt DESC`;

	console.log("=== BUILT QUERY ===");
	console.log("Main Query:");
	console.log(mainQuery);
	console.log(
		"Parameters:",
		params.filter((p) => p !== undefined)
	);
	console.log("===================");

	return { query: mainQuery, params: params.filter((p) => p !== undefined) };
}

// Test with the same parameters that are failing
console.log("Testing with businessUnit='SB' and requestStatus='In Testing':");
buildFailingQuery("SB", "In Testing");

console.log("\nTesting with businessUnit='SB' only:");
buildFailingQuery("SB");
