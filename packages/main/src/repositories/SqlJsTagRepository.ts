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
		console.log(
			"🔄 SqlJsTagRepository.saveBatch called with:",
			tags.length,
			"tags"
		);

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
						tag.informacionAdicional || null,
						tag.modulo || null,
						tag.problemId || null,
						tag.problemIdLink || null,
						tag.linkedRequestId || null,
						tag.linkedRequestIdLink || null,
						tag.jira || null,
						tag.categorizacion || null,
						tag.technician || null,
						new Date().toISOString(),
					]);
				}
				console.log("✅ All tags inserted within transaction");
			} finally {
				insertStmt.free();
			}
		});

		console.log(
			"✅ saveBatch completed successfully with automatic persistence"
		);
	}

	async getAll(): Promise<Tag[]> {
		console.log("📖 Retrieving all tags from database...");

		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.TAG} ORDER BY createdTime DESC`
		);

		const tags = results.map((row) => tagDbSchema.parse(row));

		console.log(`📖 Retrieved ${tags.length} tags from database`);
		return tags.map((data) => tagDbModelToDomain(data));
	}

	async drop(): Promise<void> {
		console.log("🗑️ Dropping all tags from database...");

		query(`DELETE FROM ${TABLE_NAMES.TAG}`);

		console.log("✅ All tags dropped from database");
	}
}
