import {
	type SBRelease,
	type SBReleaseRepository,
	releaseDbModelToDomain,
	sbReleaseDbModel,
} from "@app/core";
import {
	type QueryResult,
	query,
	TABLE_NAMES,
	transaction,
} from "@app/database";

export class SqlJsSBOperationalReleasesRepository
	implements SBReleaseRepository
{
	save(release: SBRelease): SBRelease {
		throw new Error("save() not implemented - use saveMany() instead");
	}

	async saveMany(releases: SBRelease[]): Promise<SBRelease[]> {
		// Use transaction for batch insert/update with automatic rollback on error
		// INSERT OR REPLACE ensures that duplicates (based on unique constraint) are updated
		await transaction(async (db) => {
			const insertStmt = db.prepare(`
				INSERT OR REPLACE INTO ${TABLE_NAMES.SB_OPERATIONAL_RELEASES} (
					week, application, date, releaseVersion, releaseLink, tickets, createdAt, updatedAt
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			`);

			try {
				for (const release of releases) {
					insertStmt.run([
						release.week,
						release.application,
						release.date,
						release.releaseVersion,
						release.releaseLink,
						release.tickets,
						release.createdAt,
						release.updatedAt,
					]);
				}
			} finally {
				insertStmt.free();
			}
		});

		console.log(
			`SqlJsSBOperationalReleasesRepository: Saved ${releases.length} releases (with upsert)`,
		);

		return releases;
	}

	findAll(): SBRelease[] {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.SB_OPERATIONAL_RELEASES} ORDER BY date DESC`,
		);

		console.log(
			`SqlJsSBOperationalReleasesRepository: Found ${results.length} releases`,
		);

		return results.map((row) => {
			const validatedRow = sbReleaseDbModel.parse(row);
			return releaseDbModelToDomain(validatedRow);
		});
	}

	findByDateRange(startDate: string, endDate: string): SBRelease[] {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.SB_OPERATIONAL_RELEASES}
			 WHERE date >= ? AND date <= ?
			 ORDER BY date DESC`,
			[startDate, endDate],
		);

		console.log(
			`SqlJsSBOperationalReleasesRepository: Found ${results.length} releases between ${startDate} and ${endDate}`,
		);

		return results.map((row) => {
			const validatedRow = sbReleaseDbModel.parse(row);
			return releaseDbModelToDomain(validatedRow);
		});
	}

	findByApplication(application: string): SBRelease[] {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.SB_OPERATIONAL_RELEASES}
			 WHERE application = ?
			 ORDER BY date DESC`,
			[application],
		);

		console.log(
			`SqlJsSBOperationalReleasesRepository: Found ${results.length} releases for application: ${application}`,
		);

		return results.map((row) => {
			const validatedRow = sbReleaseDbModel.parse(row);
			return releaseDbModelToDomain(validatedRow);
		});
	}

	findById(id: number): SBRelease | null {
		const results: QueryResult[] = query(
			`SELECT * FROM ${TABLE_NAMES.SB_OPERATIONAL_RELEASES} WHERE id = ?`,
			[id],
		);

		if (results.length === 0) {
			return null;
		}

		const validatedRow = sbReleaseDbModel.parse(results[0]);
		return releaseDbModelToDomain(validatedRow);
	}

	async deleteAll(): Promise<void> {
		await transaction(async (db) => {
			db.run(`DELETE FROM ${TABLE_NAMES.SB_OPERATIONAL_RELEASES}`);
		});

		console.log(
			"SqlJsSBOperationalReleasesRepository: Deleted all releases",
		);
	}

	count(): number {
		const results: QueryResult[] = query(
			`SELECT COUNT(*) as count FROM ${TABLE_NAMES.SB_OPERATIONAL_RELEASES}`,
		);

		return (results[0]?.count as number) || 0;
	}
}
