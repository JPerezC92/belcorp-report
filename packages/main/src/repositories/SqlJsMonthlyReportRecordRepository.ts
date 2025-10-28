import type {
	MonthlyReportRecord,
	MonthlyReportRecordDbModel,
	MonthlyReportRepository,
} from "@app/core";
import {
	monthlyReportDbModelToDomain,
	monthlyReportRecordDbSchema,
} from "@app/core";
import { getDatabase, saveDatabaseToDisk, TABLE_NAMES } from "@app/database";

export class SqlJsMonthlyReportRecordRepository
	implements MonthlyReportRepository
{
	constructor() {}

	async save(records: MonthlyReportRecord[]): Promise<void> {
		const db = getDatabase();

		try {
			// Begin transaction
			db.run("BEGIN TRANSACTION");

			// Prepare insert statement - use INSERT OR REPLACE to handle duplicates
			const stmt = db.prepare(`
				INSERT OR REPLACE INTO ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} (
					requestId, applications, categorization, requestIdLink,
					createdTime, requestStatus, module, subject, subjectLink,
					priority, eta, additionalInfo, resolvedTime, affectedCountries,
					recurrence, recurrenceComputed, technician, jira, problemId, problemIdLink,
					linkedRequestId, linkedRequestIdLink, requestOLAStatus,
					escalationGroup, affectedApplications, shouldResolveLevel1,
					campaign, cuv1, release, rca,
					businessUnit, inDateRange, rep, dia, week, priorityReporte,
					requestStatusReporte, informacionAdicionalReporte,
					enlaces, mensaje, observations, statusModifiedByUser, computed_level,
					createdAt, updatedAt
				) VALUES (
					?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
					?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
					CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
				)
			`);

			for (const record of records) {
				stmt.run([
					record.requestId,
					record.applications,
					record.categorization,
					record.requestIdLink,
					record.createdTime,
					record.requestStatus,
					record.module,
					record.subject,
					record.subjectLink,
					record.priority,
					record.eta,
					record.additionalInfo,
					record.resolvedTime,
					record.affectedCountries,
					record.recurrence,
					record.recurrenceComputed,
					record.technician,
					record.jira,
					record.problemId,
					record.problemIdLink,
					record.linkedRequestId,
					record.linkedRequestIdLink,
					record.requestOLAStatus,
					record.escalationGroup,
					record.affectedApplications,
					record.shouldResolveLevel1,
					record.campaign,
					record.cuv1,
					record.release,
					record.rca,
					record.businessUnit,
					record.inDateRange ? 1 : 0,
					record.rep,
					record.dia,
					record.week,
					record.priorityReporte,
					record.requestStatusReporte,
					record.informacionAdicionalReporte,
					record.enlaces,
					record.mensaje,
					record.observations,
					record.statusModifiedByUser ? 1 : 0,
					record.computedLevel,
				]);
			}

			stmt.free();
			db.run("COMMIT");

			// Save database to persistent storage
			await saveDatabaseToDisk();

			console.log(
				`[SqlJsMonthlyReportRecordRepository] Saved ${records.length} records`
			);
		} catch (error) {
			db.run("ROLLBACK");
			console.error(
				"[SqlJsMonthlyReportRecordRepository] Save error:",
				error
			);
			throw error;
		}
	}

	async findAll(): Promise<MonthlyReportRecord[]> {
		const db = getDatabase();

		const result = db.exec(`
			SELECT * FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			ORDER BY createdTime DESC
		`);

		if (!result[0]) {
			return [];
		}

		return this.mapResultToRecords(result[0]);
	}

	async findByBusinessUnit(
		businessUnit: string
	): Promise<MonthlyReportRecord[]> {
		const db = getDatabase();

		console.log(
			`[SqlJsMonthlyReportRecordRepository] Executing findByBusinessUnit for: ${businessUnit}`
		);

		const stmt = db.prepare(`
			SELECT
				m.*,
				COALESCE((SELECT COUNT(*)
				 FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} p
				 WHERE p.childRequestId = m.linkedRequestId), 0) as enlaces
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			WHERE m.businessUnit = ?
			ORDER BY m.createdTime DESC
		`);

		const records: MonthlyReportRecord[] = [];

		try {
			stmt.bind([businessUnit]);
			while (stmt.step()) {
				const row = stmt.getAsObject() as MonthlyReportRecordDbModel;

				console.log(
					`[SqlJsMonthlyReportRecordRepository] Raw enlaces value for ${row.requestId}:`,
					row.enlaces,
					typeof row.enlaces
				);

				// Update enlaces count from the query
				row.enlaces = Number(row.enlaces) || 0;
				// Update mensaje with the actual count
				row.mensaje = `${row.linkedRequestId || "N/A"} --> ${
					row.enlaces
				} Linked tickets`;

				console.log(
					`[SqlJsMonthlyReportRecordRepository] Processed enlaces value for ${row.requestId}:`,
					row.enlaces
				);

				const validatedRow = monthlyReportRecordDbSchema.parse(row);
				records.push(monthlyReportDbModelToDomain(validatedRow));
			}
		} finally {
			stmt.free();
		}

		console.log(
			`[SqlJsMonthlyReportRecordRepository] Found ${records.length} records for businessUnit: ${businessUnit}`
		);
		console.log(
			"[SqlJsMonthlyReportRecordRepository] Sample enlaces distribution:",
			records
				.slice(0, 5)
				.map((r) => ({ requestId: r.requestId, enlaces: r.enlaces }))
		);

		return records;
	}

	async findAllWithDisplayNames(): Promise<MonthlyReportRecord[]> {
		const db = getDatabase();

		const stmt = db.prepare(`
			SELECT
				m.*,
				COALESCE((SELECT COUNT(*) FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} p
					WHERE p.childRequestId = m.linkedRequestId), 0) as enlaces,
				COALESCE(module_rules.display_value, m.module) as moduleDisplayName,
				COALESCE(cat_rules.display_value, m.categorization) as categorizationDisplayName
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			LEFT JOIN ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES} module_rules
				ON m.module = module_rules.source_value
				AND module_rules.rule_type = 'module'
				AND module_rules.active = 1
			LEFT JOIN ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES} cat_rules
				ON m.categorization = cat_rules.source_value
				AND cat_rules.rule_type = 'categorization'
				AND cat_rules.active = 1
			ORDER BY m.createdTime DESC
		`);

		const records: MonthlyReportRecord[] = [];

		try {
			while (stmt.step()) {
				const row = stmt.getAsObject() as MonthlyReportRecordDbModel;
				row.enlaces = Number(row.enlaces) || 0;
				row.mensaje = `${row.linkedRequestId || "N/A"} --> ${row.enlaces} Linked tickets`;
				const validatedRow = monthlyReportRecordDbSchema.parse(row);
				records.push(monthlyReportDbModelToDomain(validatedRow));
			}
		} finally {
			stmt.free();
		}

		console.log(`[SqlJsMonthlyReportRecordRepository] Found ${records.length} records with display names`);
		return records;
	}

	async findByBusinessUnitWithDisplayNames(businessUnit: string): Promise<MonthlyReportRecord[]> {
		const db = getDatabase();

		const stmt = db.prepare(`
			SELECT
				m.*,
				COALESCE((SELECT COUNT(*) FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} p
					WHERE p.childRequestId = m.linkedRequestId), 0) as enlaces,
				COALESCE(module_rules.display_value, m.module) as moduleDisplayName,
				COALESCE(cat_rules.display_value, m.categorization) as categorizationDisplayName
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			LEFT JOIN ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES} module_rules
				ON m.module = module_rules.source_value
				AND module_rules.rule_type = 'module'
				AND module_rules.active = 1
			LEFT JOIN ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES} cat_rules
				ON m.categorization = cat_rules.source_value
				AND cat_rules.rule_type = 'categorization'
				AND cat_rules.active = 1
			WHERE m.businessUnit = ?
			ORDER BY m.createdTime DESC
		`);

		const records: MonthlyReportRecord[] = [];

		try {
			stmt.bind([businessUnit]);
			while (stmt.step()) {
				const row = stmt.getAsObject() as MonthlyReportRecordDbModel;
				row.enlaces = Number(row.enlaces) || 0;
				row.mensaje = `${row.linkedRequestId || "N/A"} --> ${row.enlaces} Linked tickets`;
				const validatedRow = monthlyReportRecordDbSchema.parse(row);
				records.push(monthlyReportDbModelToDomain(validatedRow));
			}
		} finally {
			stmt.free();
		}

		console.log(`[SqlJsMonthlyReportRecordRepository] Found ${records.length} records with display names for businessUnit: ${businessUnit}`);
		return records;
	}

	async findByRequestId(
		requestId: string
	): Promise<MonthlyReportRecord | null> {
		const db = getDatabase();

		const stmt = db.prepare(`
			SELECT
				m.*,
				COALESCE((SELECT COUNT(*)
				 FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} p
				 WHERE p.childRequestId = m.linkedRequestId), 0) as enlaces
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			WHERE m.requestId = ?
			LIMIT 1
		`);

		try {
			stmt.bind([requestId]);
			if (stmt.step()) {
				const row = stmt.getAsObject() as MonthlyReportRecordDbModel;
				// Update enlaces count from the query
				row.enlaces = Number(row.enlaces) || 0;
				// Update mensaje with the actual count
				row.mensaje = `${row.linkedRequestId || "N/A"} --> ${
					row.enlaces
				} Linked tickets`;

				const validatedRow = monthlyReportRecordDbSchema.parse(row);
				return monthlyReportDbModelToDomain(validatedRow);
			}
			return null;
		} finally {
			stmt.free();
		}
	}

	async updateStatus(requestId: string, newStatus: string): Promise<void> {
		const db = getDatabase();

		const stmt = db.prepare(`
			UPDATE ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			SET requestStatusReporte = ?,
				statusModifiedByUser = 1,
				updatedAt = CURRENT_TIMESTAMP
			WHERE requestId = ?
		`);

		try {
			stmt.run([newStatus, requestId]);
			await saveDatabaseToDisk();
			console.log(
				`[SqlJsMonthlyReportRecordRepository] Updated status for ${requestId} to ${newStatus}`
			);
		} finally {
			stmt.free();
		}
	}

	async getWithEnlaces(): Promise<MonthlyReportRecord[]> {
		const db = getDatabase();

		console.log(
			"[SqlJsMonthlyReportRecordRepository] Executing getWithEnlaces query..."
		);

		// First, let's check what's in the parent-child relationships table
		const relationshipTest = db.exec(`
			SELECT COUNT(*) as total_relationships FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS}
		`);
		console.log(
			"[SqlJsMonthlyReportRecordRepository] Total parent-child relationships:",
			relationshipTest[0]?.values[0]?.[0]
		);

		// Check some sample relationships
		const sampleRelationships = db.exec(`
			SELECT childRequestId, COUNT(*) as count
			FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS}
			GROUP BY childRequestId
			HAVING COUNT(*) > 0
			ORDER BY COUNT(*) DESC
			LIMIT 10
		`);
		console.log(
			"[SqlJsMonthlyReportRecordRepository] Sample relationship counts:",
			sampleRelationships[0]?.values.map((row) => ({
				childRequestId: row[0],
				count: row[1],
			}))
		);

		// Check if any monthly report request IDs exist in relationships
		const monthlyRequestIds = db.exec(`
			SELECT requestId FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} LIMIT 10
		`);
		console.log(
			"[SqlJsMonthlyReportRecordRepository] Sample monthly report request IDs:",
			monthlyRequestIds[0]?.values.map((row) => row[0])
		);

		// Check direct intersection using linkedRequestId
		const intersection = db.exec(`
			SELECT m.requestId, m.linkedRequestId, COUNT(p.childRequestId) as enlaces_direct
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			LEFT JOIN ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} p ON p.childRequestId = m.linkedRequestId
			WHERE m.linkedRequestId IS NOT NULL AND m.linkedRequestId != ''
			GROUP BY m.requestId, m.linkedRequestId
			HAVING COUNT(p.childRequestId) > 0
			LIMIT 10
		`);
		console.log(
			"[SqlJsMonthlyReportRecordRepository] Monthly reports with relationships (using linkedRequestId):",
			intersection[0]?.values.map((row) => ({
				requestId: row[0],
				linkedRequestId: row[1],
				enlaces: row[2],
			}))
		);

		const result = db.exec(`
			SELECT
				m.*,
				COALESCE((SELECT COUNT(*)
				 FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} p
				 WHERE p.childRequestId = m.linkedRequestId), 0) as enlaces
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			ORDER BY m.createdTime DESC
		`);

		if (!result[0]) {
			console.log(
				"[SqlJsMonthlyReportRecordRepository] No results found"
			);
			return [];
		}

		console.log(
			`[SqlJsMonthlyReportRecordRepository] Found ${result[0].values.length} monthly report records`
		);

		const records: MonthlyReportRecord[] = [];
		const columns = result[0].columns;
		const values = result[0].values;

		// Check if enlaces column exists and its position
		const enlacesIndex = columns.indexOf("enlaces");
		console.log(
			`[SqlJsMonthlyReportRecordRepository] Enlaces column index: ${enlacesIndex}`
		);
		console.log(
			`[SqlJsMonthlyReportRecordRepository] Available columns:`,
			columns
		);

		for (const row of values) {
			const recordObj: any = {};
			columns.forEach((col, index) => {
				recordObj[col] = row[index];
			});

			console.log(
				`[SqlJsMonthlyReportRecordRepository] Raw enlaces value for ${recordObj.requestId}:`,
				recordObj.enlaces,
				typeof recordObj.enlaces
			);

			// Update enlaces count from the query
			recordObj.enlaces = Number(recordObj.enlaces) || 0;
			// Update mensaje with the actual count
			recordObj.mensaje = `${recordObj.linkedRequestId || "N/A"} --> ${
				recordObj.enlaces
			} Linked tickets`;

			console.log(
				`[SqlJsMonthlyReportRecordRepository] Processed enlaces value for ${recordObj.requestId}:`,
				recordObj.enlaces
			);

			const validatedRow = monthlyReportRecordDbSchema.parse(recordObj);
			records.push(monthlyReportDbModelToDomain(validatedRow));
		}

		// Sample a few records
		console.log(
			"[SqlJsMonthlyReportRecordRepository] Sample enlaces distribution:",
			records
				.slice(0, 5)
				.map((r) => ({ requestId: r.requestId, enlaces: r.enlaces }))
		);

		return records;
	}

	async getDistinctRequestStatusReporte(): Promise<string[]> {
		const db = getDatabase();
		const result = db.exec(`
			SELECT DISTINCT requestStatusReporte
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}
			WHERE requestStatusReporte IS NOT NULL AND requestStatusReporte != ''
			ORDER BY requestStatusReporte
		`);

		if (!result || result.length === 0 || !result[0].values) {
			return [];
		}

		return result[0].values.map((row) => row[0] as string);
	}

	async getBugCategorizedRecordsWithCorrectiveData(
		businessUnit?: string
	): Promise<
		Array<{
			linkedRequestId: string;
			linkedRequestIdLink: string | null;
			informacionAdicionalReporte: string | null;
			enlaces: number;
			recordCount: number;
			createdTime: string;
			requestStatus: string;
			eta: string;
			priority: string;
		}>
	> {
		const db = getDatabase();

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
				AND (? IS NULL OR m.businessUnit = ?)
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

		const results: Array<{
			linkedRequestId: string;
			linkedRequestIdLink: string | null;
			informacionAdicionalReporte: string | null;
			enlaces: number;
			recordCount: number;
			createdTime: string;
			requestStatus: string;
			eta: string;
			priority: string;
		}> = [];

		try {
			stmt.bind([businessUnit || null, businessUnit || null]);
			while (stmt.step()) {
				const row = stmt.getAsObject();
				results.push({
					linkedRequestId: row.linkedRequestId as string,
					linkedRequestIdLink:
						(row.linkedRequestIdLink as string) || null,
					informacionAdicionalReporte:
						(row.informacionAdicionalReporte as string) || null,
					enlaces: Number(row.enlaces) || 0,
					recordCount: Number(row.recordCount) || 0,
					createdTime: row.createdTime as string,
					requestStatus: row.requestStatus as string,
					eta: row.eta as string,
					priority: row.priority as string,
				});
			}
		} finally {
			stmt.free();
		}

		console.log(
			`[SqlJsMonthlyReportRecordRepository] Found ${results.length} bug categorized records grouped with corrective data`
		);

		return results;
	}

	async getScopeErrorCategorizedRecordsWithCorrectiveData(
		businessUnit?: string
	): Promise<
		Array<{
			linkedRequestId: string;
			linkedRequestIdLink: string | null;
			informacionAdicionalReporte: string | null;
			enlaces: number;
			recordCount: number;
			createdTime: string;
			requestStatus: string;
			eta: string;
			priority: string;
		}>
	> {
		const db = getDatabase();

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
			WHERE m.categorization = 'Error de Alcance'
				AND (? IS NULL OR m.businessUnit = ?)
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

		const results: Array<{
			linkedRequestId: string;
			linkedRequestIdLink: string | null;
			informacionAdicionalReporte: string | null;
			enlaces: number;
			recordCount: number;
			createdTime: string;
			requestStatus: string;
			eta: string;
			priority: string;
		}> = [];

		try {
			stmt.bind([businessUnit || null, businessUnit || null]);
			while (stmt.step()) {
				const row = stmt.getAsObject();
				results.push({
					linkedRequestId: row.linkedRequestId as string,
					linkedRequestIdLink:
						(row.linkedRequestIdLink as string) || null,
					informacionAdicionalReporte:
						(row.informacionAdicionalReporte as string) || null,
					enlaces: Number(row.enlaces) || 0,
					recordCount: Number(row.recordCount) || 0,
					createdTime: row.createdTime as string,
					requestStatus: row.requestStatus as string,
					eta: row.eta as string,
					priority: row.priority as string,
				});
			}
		} finally {
			stmt.free();
		}

		console.log(
			`[SqlJsMonthlyReportRecordRepository] Found ${results.length} scope error categorized records grouped with corrective data`
		);

		return results;
	}

	async deleteAll(): Promise<void> {
		const db = getDatabase();
		db.run(`DELETE FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}`);
		await saveDatabaseToDisk();
		console.log("[SqlJsMonthlyReportRecordRepository] Deleted all records");
	}

	private mapResultToRecords(result: any): MonthlyReportRecord[] {
		const columns = result.columns;
		const values = result.values;

		const records: MonthlyReportRecord[] = [];

		for (const row of values) {
			const recordObj: any = {};
			columns.forEach((col: string, index: number) => {
				recordObj[col] = row[index];
			});

			const validatedRow = monthlyReportRecordDbSchema.parse(recordObj);
			records.push(monthlyReportDbModelToDomain(validatedRow));
		}

		return records;
	}
}
