import {
	type AggregatedRelationship,
	type ParentChildRelationship,
	type ParentChildRelationshipRepository,
	parentChildRelationshipDbModelToDomain,
	parentChildRelationshipDbSchema,
} from "@app/core";
import {
	type QueryResult,
	query,
	TABLE_NAMES,
	transaction,
} from "@app/database";

export class SqlJsParentChildRelationshipRepository
	implements ParentChildRelationshipRepository
{
	async saveBatch(relationships: ParentChildRelationship[]): Promise<void> {
		// Use transaction for batch insert with automatic rollback on error
		await transaction(async (db) => {
			const insertStmt = db.prepare(`
				INSERT OR REPLACE INTO ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} (
					parentRequestId, parentLink, childRequestId, childLink, createdAt, updatedAt
				) VALUES (?, ?, ?, ?, ?, ?)
			`);

			try {
				for (const relationship of relationships) {
					insertStmt.run([
						relationship.parentRequestId,
						relationship.parentLink || null,
						relationship.childRequestId,
						relationship.childLink || null,
						relationship.createdAt.toISOString(),
						relationship.updatedAt.toISOString(),
					]);
				}
			} finally {
				insertStmt.free();
			}
		});
	}

	async getAll(): Promise<ParentChildRelationship[]> {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} ORDER BY createdAt DESC`
		);

		// Map database columns to schema fields
		const mappedResults = results.map((row) => ({
			parentRequestId: row.parentRequestId,
			parentLink: row.parentLink,
			childRequestId: row.childRequestId,
			childLink: row.childLink,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		}));

		const relationships = mappedResults.map((row) =>
			parentChildRelationshipDbSchema.parse(row)
		);

		return relationships.map((data) =>
			parentChildRelationshipDbModelToDomain(data)
		);
	}

	async drop(): Promise<void> {
		query(`DELETE FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS}`);
	}

	async findByParentRequestId(
		parentRequestId: string
	): Promise<ParentChildRelationship[]> {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} WHERE parentRequestId = ? ORDER BY createdAt DESC`,
			[parentRequestId]
		);

		const mappedResults = results.map((row) => ({
			parentRequestId: row.parentRequestId,
			parentLink: row.parentLink,
			childRequestId: row.childRequestId,
			childLink: row.childLink,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		}));

		const relationships = mappedResults.map((row) =>
			parentChildRelationshipDbSchema.parse(row)
		);

		return relationships.map((data) =>
			parentChildRelationshipDbModelToDomain(data)
		);
	}

	async findByChildRequestId(
		childRequestId: string
	): Promise<ParentChildRelationship[]> {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} WHERE childRequestId = ? ORDER BY createdAt DESC`,
			[childRequestId]
		);

		const mappedResults = results.map((row) => ({
			parentRequestId: row.parentRequestId,
			parentLink: row.parentLink,
			childRequestId: row.childRequestId,
			childLink: row.childLink,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		}));

		const relationships = mappedResults.map((row) =>
			parentChildRelationshipDbSchema.parse(row)
		);

		return relationships.map((data) =>
			parentChildRelationshipDbModelToDomain(data)
		);
	}

	async getAggregatedByLinkedRequestId(): Promise<AggregatedRelationship[]> {
		const results: QueryResult[] = query(`
			SELECT
				childRequestId as linkedRequestId,
				COUNT(*) as requestCount,
				GROUP_CONCAT(parentRequestId) as parentRequestIds
			FROM ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS}
			GROUP BY childRequestId
			ORDER BY requestCount DESC, linkedRequestId ASC
		`);

		const aggregatedResults: AggregatedRelationship[] = [];

		for (const result of results) {
			const linkedRequestId = result.linkedRequestId as string;
			const requestCount = result.requestCount as number;

			// Get all relationships for this linked request ID
			const relationships = await this.findByChildRequestId(
				linkedRequestId
			);

			aggregatedResults.push({
				linkedRequestId,
				requestCount,
				relationships,
			});
		}

		return aggregatedResults;
	}
}
