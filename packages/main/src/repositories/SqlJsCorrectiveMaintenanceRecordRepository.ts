import {
	type CorrectiveMaintenanceRecord,
	type CorrectiveMaintenanceRecordRepository,
	correctiveMaintenanceRecordDbModelToDomain,
	correctiveMaintenanceRecordDbSchema,
} from "@app/core";
import {
	type QueryResult,
	query,
	TABLE_NAMES,
	transaction,
} from "@app/database";

export class SqlJsCorrectiveMaintenanceRecordRepository
	implements CorrectiveMaintenanceRecordRepository
{
	async saveBatch(records: CorrectiveMaintenanceRecord[]): Promise<void> {
		// Use transaction for batch insert with automatic rollback on error
		await transaction(async (db) => {
			const insertStmt = db.prepare(`
				INSERT OR REPLACE INTO ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} (
					requestId, requestIdLink, createdTime, applications, categorization,
					requestStatus, module, subject, subjectLink, priority, eta, rca, businessUnit,
					inDateRange, createdAt, updatedAt
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`);

			try {
				for (const record of records) {
					insertStmt.run([
						record.requestId,
						record.requestIdLink || null,
						record.createdTime,
						record.applications,
						record.categorization,
						record.requestStatus,
						record.module,
						record.subject,
						record.subjectLink || null,
						record.priority,
						record.eta,
						record.rca,
						record.businessUnit,
						record.inDateRange ? 1 : 0,
						record.createdAt.toISOString(),
						record.updatedAt.toISOString(),
					]);
				}
			} finally {
				insertStmt.free();
			}
		});
	}

	async getAll(): Promise<CorrectiveMaintenanceRecord[]> {
		// First, let's check what parent-child relationships exist
		const parentChildResults = query(
			`SELECT * FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} LIMIT 10`
		);
		console.log(
			"Sample parent-child relationships:",
			parentChildResults.map((r) => ({
				parentRequestId: r.parentRequestId,
				childRequestId: r.childRequestId,
			}))
		);

		// Check what corrective maintenance records exist
		const cmrResults = query(
			`SELECT requestId FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} LIMIT 10`
		);
		console.log(
			"Sample corrective maintenance requestIds:",
			cmrResults.map((r) => r.requestId)
		);

		const results: QueryResult[] = query(
			`SELECT
				cmr.*,
				COALESCE((
					SELECT COUNT(*)
					FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} pcr
					WHERE pcr.childRequestId = cmr.requestId
				), 0) as enlaces_count
			FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} cmr
			ORDER BY cmr.createdAt DESC`
		);

		console.log(
			`SqlJsCorrectiveMaintenanceRecordRepository: Found ${results.length} corrective maintenance records`
		);
		console.log(
			"Sample results with enlaces_count:",
			results.slice(0, 5).map((r) => ({
				requestId: r.requestId,
				enlaces_count: r.enlaces_count,
			}))
		);

		// Map database columns to schema fields
		const mappedResults = results.map((row) => ({
			requestId: row.requestId,
			requestIdLink: row.requestIdLink,
			createdTime: row.createdTime,
			applications: row.applications,
			categorization: row.categorization,
			requestStatus: row.requestStatus,
			module: row.module,
			subject: row.subject,
			subjectLink: row.subjectLink,
			priority: row.priority,
			eta: row.eta,
			rca: row.rca,
			businessUnit: row.businessUnit,
			inDateRange: row.inDateRange,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			enlaces: (row.enlaces_count as number) || 0,
		}));

		console.log(
			"Mapped results enlaces distribution:",
			mappedResults.reduce((acc, r) => {
				acc[r.enlaces] = (acc[r.enlaces] || 0) + 1;
				return acc;
			}, {} as Record<number, number>)
		);

		// Check specifically for request ID 91315
		const specificRecord = mappedResults.find(
			(r) => r.requestId === "91315"
		);
		if (specificRecord) {
			console.log(
				`Found specific record for 91315: enlaces = ${specificRecord.enlaces}`
			);
		} else {
			console.log("No corrective maintenance record found for 91315");
		}

		const records = mappedResults.map((row) =>
			correctiveMaintenanceRecordDbSchema.parse(row)
		);

		return records.map((data, index) =>
			correctiveMaintenanceRecordDbModelToDomain(
				data,
				mappedResults[index].enlaces
			)
		);
	}

	async getByBusinessUnit(
		businessUnit: string
	): Promise<CorrectiveMaintenanceRecord[]> {
		console.log(
			`SqlJsCorrectiveMaintenanceRecordRepository: getByBusinessUnit called with businessUnit="${businessUnit}"`
		);

		// First, let's check what parent-child relationships exist
		const parentChildResults = query(
			`SELECT * FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} LIMIT 10`
		);
		console.log(
			"Sample parent-child relationships:",
			parentChildResults.map((r) => ({
				parentRequestId: r.parentRequestId,
				childRequestId: r.childRequestId,
			}))
		);

		// Check what corrective maintenance records exist for this business unit
		const cmrResults = query(
			`SELECT requestId FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} WHERE businessUnit = ? LIMIT 10`,
			[businessUnit]
		);
		console.log(
			`Sample corrective maintenance requestIds for businessUnit "${businessUnit}":`,
			cmrResults.map((r) => r.requestId)
		);

		const results: QueryResult[] = query(
			`SELECT
				cmr.*,
				COALESCE((
					SELECT COUNT(*)
					FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} pcr
					WHERE pcr.childRequestId = cmr.requestId
				), 0) as enlaces_count
			FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} cmr
			WHERE cmr.businessUnit = ?
			ORDER BY cmr.createdAt DESC`,
			[businessUnit]
		);

		console.log(
			`SqlJsCorrectiveMaintenanceRecordRepository: Found ${results.length} corrective maintenance records for businessUnit "${businessUnit}"`
		);
		console.log(
			"Sample results with enlaces_count:",
			results.slice(0, 5).map((r) => ({
				requestId: r.requestId,
				enlaces_count: r.enlaces_count,
			}))
		);

		// Map database columns to schema fields
		const mappedResults = results.map((row) => ({
			requestId: row.requestId,
			requestIdLink: row.requestIdLink,
			createdTime: row.createdTime,
			applications: row.applications,
			categorization: row.categorization,
			requestStatus: row.requestStatus,
			module: row.module,
			subject: row.subject,
			subjectLink: row.subjectLink,
			priority: row.priority,
			eta: row.eta,
			rca: row.rca,
			businessUnit: row.businessUnit,
			inDateRange: row.inDateRange,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			enlaces: (row.enlaces_count as number) || 0,
		}));

		console.log(
			`Mapped results enlaces distribution for businessUnit "${businessUnit}":`,
			mappedResults.reduce((acc, r) => {
				acc[r.enlaces] = (acc[r.enlaces] || 0) + 1;
				return acc;
			}, {} as Record<number, number>)
		);

		// Check specifically for request ID 91315
		const specificRecord = mappedResults.find(
			(r) => r.requestId === "91315"
		);
		if (specificRecord) {
			console.log(
				`Found specific record for 91315: enlaces = ${specificRecord.enlaces}`
			);
		} else {
			console.log("No corrective maintenance record found for 91315");
		}

		const records = mappedResults.map((row) =>
			correctiveMaintenanceRecordDbSchema.parse(row)
		);

		return records.map((data, index) =>
			correctiveMaintenanceRecordDbModelToDomain(
				data,
				mappedResults[index].enlaces
			)
		);
	}

	async getByBusinessUnitAndRequestStatus(
		businessUnit: string,
		requestStatus?: string
	): Promise<CorrectiveMaintenanceRecord[]> {
		console.log(
			`SqlJsCorrectiveMaintenanceRecordRepository: getByBusinessUnitAndRequestStatus called with businessUnit="${businessUnit}", requestStatus="${
				requestStatus || "not specified"
			}"`
		);

		// First, let's check what parent-child relationships exist
		const parentChildResults = query(
			`SELECT * FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} LIMIT 10`
		);
		console.log(
			"Sample parent-child relationships:",
			parentChildResults.map((r) => ({
				parentRequestId: r.parentRequestId,
				childRequestId: r.childRequestId,
			}))
		);

		// Build the WHERE clause dynamically
		let whereClause = "WHERE cmr.businessUnit = ?";
		const params: (string | undefined)[] = [businessUnit];

		if (requestStatus) {
			whereClause += " AND cmr.requestStatus = ?";
			params.push(requestStatus);
		}

		// Check what corrective maintenance records exist for this business unit and request status
		const cmrQuery = `SELECT requestId FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} cmr ${whereClause} LIMIT 10`;
		const filteredParams = params.filter(
			(p): p is string => p !== undefined
		);
		console.log(
			`Executing CM query: ${cmrQuery} with params:`,
			filteredParams
		);
		const cmrResults = query(cmrQuery, filteredParams);
		console.log(
			`Sample corrective maintenance requestIds for businessUnit "${businessUnit}"${
				requestStatus ? ` and requestStatus "${requestStatus}"` : ""
			}:`,
			cmrResults.map((r) => r.requestId)
		);

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
		console.log(
			`Executing main query: ${mainQuery} with params:`,
			filteredParams
		);
		const results: QueryResult[] = query(mainQuery, filteredParams);

		console.log(
			`SqlJsCorrectiveMaintenanceRecordRepository: Found ${
				results.length
			} corrective maintenance records for businessUnit "${businessUnit}"${
				requestStatus ? ` and requestStatus "${requestStatus}"` : ""
			}`
		);
		console.log(
			"Sample results with enlaces_count:",
			results.slice(0, 5).map((r) => ({
				requestId: r.requestId,
				enlaces_count: r.enlaces_count,
			}))
		);

		// Map database columns to schema fields
		const mappedResults = results.map((row) => ({
			requestId: row.requestId,
			requestIdLink: row.requestIdLink,
			createdTime: row.createdTime,
			applications: row.applications,
			categorization: row.categorization,
			requestStatus: row.requestStatus,
			module: row.module,
			subject: row.subject,
			subjectLink: row.subjectLink,
			priority: row.priority,
			eta: row.eta,
			rca: row.rca,
			businessUnit: row.businessUnit,
			inDateRange: row.inDateRange,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			enlaces: (row.enlaces_count as number) || 0,
		}));

		console.log(
			`Mapped results enlaces distribution for businessUnit "${businessUnit}"${
				requestStatus ? ` and requestStatus "${requestStatus}"` : ""
			}:`,
			mappedResults.reduce((acc, r) => {
				acc[r.enlaces] = (acc[r.enlaces] || 0) + 1;
				return acc;
			}, {} as Record<number, number>)
		);

		// Check specifically for request ID 91315
		const specificRecord = mappedResults.find(
			(r) => r.requestId === "91315"
		);
		if (specificRecord) {
			console.log(
				`Found specific record for 91315: enlaces = ${specificRecord.enlaces}`
			);
		} else {
			console.log("No corrective maintenance record found for 91315");
		}

		const records = mappedResults.map((row) =>
			correctiveMaintenanceRecordDbSchema.parse(row)
		);

		return records.map((data, index) =>
			correctiveMaintenanceRecordDbModelToDomain(
				data,
				mappedResults[index].enlaces
			)
		);
	}

	async drop(): Promise<void> {
		query(`DELETE FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}`);
	}

	async findByRequestId(
		requestId: string
	): Promise<CorrectiveMaintenanceRecord[]> {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} WHERE requestId = ? ORDER BY createdAt DESC`,
			[requestId]
		);

		const mappedResults = results.map((row) => ({
			requestId: row.requestId,
			requestIdLink: row.requestIdLink,
			createdTime: row.createdTime,
			applications: row.applications,
			categorization: row.categorization,
			requestStatus: row.requestStatus,
			module: row.module,
			subject: row.subject,
			subjectLink: row.subjectLink,
			priority: row.priority,
			eta: row.eta,
			rca: row.rca,
			businessUnit: row.businessUnit,
			inDateRange: row.inDateRange,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		}));

		const records = mappedResults.map((row) =>
			correctiveMaintenanceRecordDbSchema.parse(row)
		);

		return records.map((data) =>
			correctiveMaintenanceRecordDbModelToDomain(data)
		);
	}

	async findByModule(module: string): Promise<CorrectiveMaintenanceRecord[]> {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} WHERE module = ? ORDER BY createdAt DESC`,
			[module]
		);

		const mappedResults = results.map((row) => ({
			requestId: row.requestId,
			requestIdLink: row.requestIdLink,
			createdTime: row.createdTime,
			applications: row.applications,
			categorization: row.categorization,
			requestStatus: row.requestStatus,
			module: row.module,
			subject: row.subject,
			subjectLink: row.subjectLink,
			priority: row.priority,
			eta: row.eta,
			rca: row.rca,
			businessUnit: row.businessUnit,
			inDateRange: row.inDateRange,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		}));

		const records = mappedResults.map((row) =>
			correctiveMaintenanceRecordDbSchema.parse(row)
		);

		return records.map((data) =>
			correctiveMaintenanceRecordDbModelToDomain(data)
		);
	}

	async getDistinctRequestStatuses(): Promise<string[]> {
		const results = await query(`
			SELECT DISTINCT requestStatus
			FROM ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}
			WHERE requestStatus IS NOT NULL AND requestStatus != ''
			ORDER BY requestStatus
		`);

		return results.map((row) => row.requestStatus as string);
	}
}
