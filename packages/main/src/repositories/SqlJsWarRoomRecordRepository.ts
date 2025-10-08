import {
	type WarRoomRecord,
	type WarRoomRecordRepository,
	warRoomDbModelToDomain,
	warRoomRecordDbSchema,
} from "@app/core";
import {
	type QueryResult,
	query,
	TABLE_NAMES,
	transaction,
} from "@app/database";

export class SqlJsWarRoomRecordRepository implements WarRoomRecordRepository {
	async saveBatch(records: WarRoomRecord[]): Promise<void> {
		// Use transaction for batch insert with automatic rollback on error
		await transaction(async (db) => {
			const insertStmt = db.prepare(`
				INSERT OR REPLACE INTO ${TABLE_NAMES.WAR_ROOM_RECORDS} (
					application, date, incidentId, incidentIdLink, summary,
					initialPriority, startTime, durationMinutes, endTime, participants,
					status, priorityChanged, resolutionTeamChanged, notes,
					rcaStatus, urlRca, createdAt, updatedAt
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`);

			try {
				for (const record of records) {
					insertStmt.run([
						record.application,
						record.date,
						record.incidentId,
						record.incidentIdLink || null,
						record.summary,
						record.initialPriority,
						record.startTime,
						record.durationMinutes,
						record.endTime,
						record.participants,
						record.status,
						record.priorityChanged,
						record.resolutionTeamChanged,
						record.notes,
						record.rcaStatus,
						record.urlRca,
						record.createdAt.toISOString(),
						record.updatedAt.toISOString(),
					]);
				}
			} finally {
				insertStmt.free();
			}
		});
	}

	async getAll(): Promise<WarRoomRecord[]> {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.WAR_ROOM_RECORDS} ORDER BY date DESC, startTime DESC`
		);

		console.log(
			`SqlJsWarRoomRecordRepository: Found ${results.length} war room records`
		);

		// Map database columns to schema fields and validate
		const records: WarRoomRecord[] = results.map((row) => {
			const validatedRow = warRoomRecordDbSchema.parse(row);
			return warRoomDbModelToDomain(validatedRow);
		});

		return records;
	}

	async getByApplication(application: string): Promise<WarRoomRecord[]> {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.WAR_ROOM_RECORDS}
			 WHERE application = ?
			 ORDER BY date DESC, startTime DESC`,
			[application]
		);

		console.log(
			`SqlJsWarRoomRecordRepository: Found ${results.length} war room records for application: ${application}`
		);

		const records: WarRoomRecord[] = results.map((row) => {
			const validatedRow = warRoomRecordDbSchema.parse(row);
			return warRoomDbModelToDomain(validatedRow);
		});

		return records;
	}

	async getDistinctApplications(): Promise<string[]> {
		const results: QueryResult[] = query(
			`SELECT DISTINCT application FROM ${TABLE_NAMES.WAR_ROOM_RECORDS} ORDER BY application`
		);

		return results.map((row) => row.application as string);
	}

	async drop(): Promise<void> {
		await transaction(async (db) => {
			db.run(`DELETE FROM ${TABLE_NAMES.WAR_ROOM_RECORDS}`);
		});
		console.log("SqlJsWarRoomRecordRepository: Dropped all war room records");
	}
}
