import type {
	MonthlyReportRecord,
	MonthlyReportRepository,
	MonthlyReportRecordDbModel
} from "@app/core";
import {
	monthlyReportDbModelToDomain,
	monthlyReportRecordDbSchema
} from "@app/core";
import { getDatabase, saveDatabaseToDisk, TABLE_NAMES } from "@app/database";

export class SqlJsMonthlyReportRecordRepository implements MonthlyReportRepository {
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
					recurrence, technician, jira, problemId, problemIdLink,
					linkedRequestId, linkedRequestIdLink, requestOLAStatus,
					escalationGroup, affectedApplications, shouldResolveLevel1,
					campaign, cuv1, release, rca,
					businessUnit, semanal, rep, dia, week, priorityReporte,
					requestStatusReporte, informacionAdicionalReporte,
					enlaces, mensaje, statusModifiedByUser,
					createdAt, updatedAt
				) VALUES (
					?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
					?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
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
					record.semanal ? 1 : 0,
					record.rep,
					record.dia,
					record.week,
					record.priorityReporte,
					record.requestStatusReporte,
					record.informacionAdicionalReporte,
					record.enlaces,
					record.mensaje,
					record.statusModifiedByUser ? 1 : 0,
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
			console.error("[SqlJsMonthlyReportRecordRepository] Save error:", error);
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

	async findByBusinessUnit(businessUnit: string): Promise<MonthlyReportRecord[]> {
		const db = getDatabase();

		const stmt = db.prepare(`
			SELECT
				m.*,
				(SELECT COUNT(*)
				 FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} p
				 WHERE p.childRequestId = m.requestId) as enlaces
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			WHERE m.businessUnit = ?
			ORDER BY m.createdTime DESC
		`);

		const records: MonthlyReportRecord[] = [];

		try {
			stmt.bind([businessUnit]);
			while (stmt.step()) {
				const row = stmt.getAsObject() as MonthlyReportRecordDbModel;
				// Update enlaces count from the query
				row.enlaces = Number(row.enlaces) || 0;
				// Update mensaje with the actual count
				row.mensaje = `${row.linkedRequestId || "N/A"} --> ${row.enlaces} Linked tickets`;

				const validatedRow = monthlyReportRecordDbSchema.parse(row);
				records.push(monthlyReportDbModelToDomain(validatedRow));
			}
		} finally {
			stmt.free();
		}

		return records;
	}

	async findByRequestId(requestId: string): Promise<MonthlyReportRecord | null> {
		const db = getDatabase();

		const stmt = db.prepare(`
			SELECT
				m.*,
				(SELECT COUNT(*)
				 FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} p
				 WHERE p.childRequestId = m.requestId) as enlaces
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
				row.mensaje = `${row.linkedRequestId || "N/A"} --> ${row.enlaces} Linked tickets`;

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

		const result = db.exec(`
			SELECT
				m.*,
				(SELECT COUNT(*)
				 FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} p
				 WHERE p.childRequestId = m.requestId) as enlaces
			FROM ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} m
			ORDER BY m.createdTime DESC
		`);

		if (!result[0]) {
			return [];
		}

		const records: MonthlyReportRecord[] = [];
		const columns = result[0].columns;
		const values = result[0].values;

		for (const row of values) {
			const recordObj: any = {};
			columns.forEach((col, index) => {
				recordObj[col] = row[index];
			});

			// Update enlaces count from the query
			recordObj.enlaces = Number(recordObj.enlaces) || 0;
			// Update mensaje with the actual count
			recordObj.mensaje = `${recordObj.linkedRequestId || "N/A"} --> ${recordObj.enlaces} Linked tickets`;

			const validatedRow = monthlyReportRecordDbSchema.parse(recordObj);
			records.push(monthlyReportDbModelToDomain(validatedRow));
		}

		return records;
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