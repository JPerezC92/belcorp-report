import {
	type Tag,
	type TagRepository,
	tagDbModelToDomain,
	tagDbSchema,
} from "@app/core";
import {
	type QueryResult,
	query,
	TABLE_NAMES,
	transaction,
} from "@app/database";

export class SqlJsTagRepository implements TagRepository {
	async saveBatch(tags: Tag[]): Promise<void> {
		// Use transaction for batch insert with automatic rollback on error
		await transaction(async (db) => {
			const insertStmt = db.prepare(`
				INSERT INTO ${TABLE_NAMES.TAG} (
					createdTime, requestId, requestIdLink, informacionAdicional,
					modulo, problemId, problemIdLink, linkedRequestIdValue,
					linkedRequestIdLink, jira, categorizacion, technician, processedAt
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`);

			try {
				for (const tag of tags) {
					insertStmt.run([
						tag.createdTime || null,
						tag.requestId || null,
						tag.requestIdLink || null,
						tag.additionalInfo || null,
						tag.module || null,
						tag.problemId || null,
						tag.problemIdLink || null,
						tag.linkedRequestId || null,
						tag.linkedRequestIdLink || null,
						tag.jira || null,
						tag.categorization || null,
						tag.technician || null,
						new Date().toISOString(),
					]);
				}
			} finally {
				insertStmt.free();
			}
		});
	}

	async getAll(): Promise<Tag[]> {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.TAG} ORDER BY createdTime DESC`
		);

		// Map database columns (Spanish names) to schema fields (English names)
		const mappedResults = results.map((row) => ({
			requestId: row.requestId,
			requestIdLink: row.requestIdLink,
			createdTime: row.createdTime,
			additionalInfo: row.informacionAdicional,
			module: row.modulo,
			problemId: row.problemId,
			problemIdLink: row.problemIdLink,
			linkedRequestIdValue: row.linkedRequestIdValue,
			linkedRequestIdLink: row.linkedRequestIdLink,
			jira: row.jira,
			categorization: row.categorizacion,
			technician: row.technician,
			processedAt: row.processedAt,
		}));

		const tags = mappedResults.map((row) => tagDbSchema.parse(row));

		return tags.map((data) => tagDbModelToDomain(data));
	}

	async drop(): Promise<void> {
		query(`DELETE FROM ${TABLE_NAMES.TAG}`);
	}

	async findByLinkedRequestId(linkedRequestId: string): Promise<Tag[]> {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.TAG} WHERE linkedRequestIdValue = ?`,
			[linkedRequestId]
		);

		// Map database columns (Spanish names) to schema fields (English names)
		const mappedResults = results.map((row) => ({
			requestId: row.requestId,
			requestIdLink: row.requestIdLink,
			createdTime: row.createdTime,
			additionalInfo: row.informacionAdicional,
			module: row.modulo,
			problemId: row.problemId,
			problemIdLink: row.problemIdLink,
			linkedRequestIdValue: row.linkedRequestIdValue,
			linkedRequestIdLink: row.linkedRequestIdLink,
			jira: row.jira,
			categorization: row.categorizacion,
			technician: row.technician,
			processedAt: row.processedAt,
		}));

		const tags = mappedResults.map((row) => tagDbSchema.parse(row));

		return tags.map((data) => tagDbModelToDomain(data));
	}
}
