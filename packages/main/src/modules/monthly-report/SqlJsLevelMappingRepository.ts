import {
	LevelMapping,
	type LevelMappingRepository,
	levelMappingSchema,
	levelMappingDtoToDomain,
} from "@app/core";
import { TABLE_NAMES, getDatabase } from "@app/database";

export class SqlJsLevelMappingRepository implements LevelMappingRepository {
	async findAll(): Promise<LevelMapping[]> {
		const db = getDatabase();
		const result = db.exec(`
			SELECT requestStatusReporte, level, createdAt, updatedAt
			FROM ${TABLE_NAMES.MONTHLY_REPORT_LEVEL_MAPPING}
			ORDER BY requestStatusReporte ASC
		`);

		if (!result.length || !result[0].values.length) {
			return [];
		}

		return result[0].values.map((row) => {
			const dto = levelMappingSchema.parse({
				requestStatusReporte: row[0],
				level: row[1],
				createdAt: row[2],
				updatedAt: row[3],
			});
			return levelMappingDtoToDomain(dto);
		});
	}

	async findByRequestStatus(
		requestStatusReporte: string,
	): Promise<LevelMapping | null> {
		const db = getDatabase();
		const stmt = db.prepare(`
			SELECT requestStatusReporte, level, createdAt, updatedAt
			FROM ${TABLE_NAMES.MONTHLY_REPORT_LEVEL_MAPPING}
			WHERE requestStatusReporte = ?
		`);

		stmt.bind([requestStatusReporte]);

		if (!stmt.step()) {
			stmt.free();
			return null;
		}

		const row = stmt.get();
		stmt.free();

		const dto = levelMappingSchema.parse({
			requestStatusReporte: row[0],
			level: row[1],
			createdAt: row[2],
			updatedAt: row[3],
		});

		return levelMappingDtoToDomain(dto);
	}

	async create(mapping: LevelMapping): Promise<void> {
		const db = getDatabase();
		const stmt = db.prepare(`
			INSERT INTO ${TABLE_NAMES.MONTHLY_REPORT_LEVEL_MAPPING}
				(requestStatusReporte, level, createdAt, updatedAt)
			VALUES (?, ?, ?, ?)
		`);

		stmt.run([
			mapping.requestStatusReporte,
			mapping.level,
			mapping.createdAt.toISOString(),
			mapping.updatedAt.toISOString(),
		]);

		stmt.free();
	}

	async update(mapping: LevelMapping): Promise<void> {
		const db = getDatabase();
		const stmt = db.prepare(`
			UPDATE ${TABLE_NAMES.MONTHLY_REPORT_LEVEL_MAPPING}
			SET level = ?, updatedAt = ?
			WHERE requestStatusReporte = ?
		`);

		stmt.run([
			mapping.level,
			mapping.updatedAt.toISOString(),
			mapping.requestStatusReporte,
		]);

		stmt.free();
	}

	async delete(requestStatusReporte: string): Promise<void> {
		const db = getDatabase();
		const stmt = db.prepare(`
			DELETE FROM ${TABLE_NAMES.MONTHLY_REPORT_LEVEL_MAPPING}
			WHERE requestStatusReporte = ?
		`);

		stmt.run([requestStatusReporte]);
		stmt.free();
	}
}
