import {
	type ForTaggingData,
	type ForTaggingDataRepository,
	forTaggingDataDbSchema,
	forTaggingDataDbToDomain,
} from "@app/core";
import {
	type QueryResult,
	query,
	TABLE_NAMES,
	transaction,
} from "@app/database";

export class SqlJsForTaggingDataRepository implements ForTaggingDataRepository {
	async saveBatch(data: ForTaggingData[]): Promise<void> {
		// Use transaction for batch insert with automatic rollback on error
		await transaction(async (db) => {
			const insertStmt = db.prepare(`
				INSERT OR REPLACE INTO ${TABLE_NAMES.FOR_TAGGING_DATA} (
					requestId, technician, createdTime, modulo, subject,
					problemId, linkedRequestId, category,
					requestIdLink, subjectLink, problemIdLink, linkedRequestIdLink
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`);

			try {
				for (const record of data) {
					insertStmt.run([
						record.requestId,
						record.technician || null,
						record.createdTime || null,
						record.module || null,
						record.subject || null,
						record.problemId || null,
						record.linkedRequestId || null,
						record.category || null,
						record.requestIdLink || null,
						record.subjectLink || null,
						record.problemIdLink || null,
						record.linkedRequestIdLink || null,
					]);
				}
			} finally {
				insertStmt.free();
			}
		});
	}

	async getAll(): Promise<ForTaggingData[]> {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.FOR_TAGGING_DATA} ORDER BY createdTime DESC`
		);

		// Map database columns (Spanish names) to schema fields (English names)
		const mappedResults = results.map((row) => ({
			requestId: row.requestId,
			technician: row.technician,
			createdTime: row.createdTime,
			module: row.modulo,
			subject: row.subject,
			problemId: row.problemId,
			linkedRequestId: row.linkedRequestId,
			category: row.category,
			requestIdLink: row.requestIdLink,
			subjectLink: row.subjectLink,
			problemIdLink: row.problemIdLink,
			linkedRequestIdLink: row.linkedRequestIdLink,
		}));

		const records = mappedResults.map((row) =>
			forTaggingDataDbSchema.parse(row)
		);

		const domainObjects = records.map((data) =>
			forTaggingDataDbToDomain(data)
		);

		return domainObjects;
	}

	async drop(): Promise<void> {
		query(`DELETE FROM ${TABLE_NAMES.FOR_TAGGING_DATA}`);
	}
}
