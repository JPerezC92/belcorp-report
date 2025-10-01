import type {
	SemanalDateRangeRepository,
	SemanalDateRangeDbModel
} from "@app/core";
import {
	SemanalDateRange,
	semanalDateRangeDbModelToDomain,
	semanalDateRangeDomainToDbModel,
	semanalDateRangeDbSchema
} from "@app/core";
import { getDatabase, saveDatabaseToDisk, TABLE_NAMES } from "@app/database";

export class SqlJsSemanalDateRangeRepository implements SemanalDateRangeRepository {
	constructor() {
		this.ensureTableExists();
	}

	private ensureTableExists(): void {
		try {
			const db = getDatabase();

			// Ensure the semanal_date_ranges table exists
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.SEMANAL_DATE_RANGES} (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					fromDate TEXT NOT NULL,
					toDate TEXT NOT NULL,
					description TEXT NOT NULL,
					isActive BOOLEAN DEFAULT 1,
					createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				)
			`);

			// Create index for faster queries
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_semanal_date_ranges_active ON ${TABLE_NAMES.SEMANAL_DATE_RANGES}(isActive)`
			);

			console.log(`[SqlJsSemanalDateRangeRepository] Table ${TABLE_NAMES.SEMANAL_DATE_RANGES} ensured`);

		} catch (error) {
			console.error("[SqlJsSemanalDateRangeRepository] Failed to ensure table exists:", error);
		}
	}

	async save(range: SemanalDateRange): Promise<SemanalDateRange> {
		const db = getDatabase();

		try {
			// Begin transaction
			db.run("BEGIN TRANSACTION");

			// Deactivate all current active ranges
			db.run(`
				UPDATE ${TABLE_NAMES.SEMANAL_DATE_RANGES}
				SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
				WHERE isActive = 1
			`);

			// Insert new range as active
			const dbModel = semanalDateRangeDomainToDbModel(range);
			const stmt = db.prepare(`
				INSERT INTO ${TABLE_NAMES.SEMANAL_DATE_RANGES}
				(fromDate, toDate, description, isActive, createdAt, updatedAt)
				VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`);

			stmt.run([
				dbModel.fromDate,
				dbModel.toDate,
				dbModel.description,
				1 // Always active for new ranges
			]);

			const insertId = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0] as number;
			stmt.free();

			db.run("COMMIT");

			// Save database to persistent storage
			await saveDatabaseToDisk();

			// Return the saved range with ID
			const savedRange = new SemanalDateRange(
				insertId,
				range.fromDate,
				range.toDate,
				range.description,
				true,
				new Date(),
				new Date()
			);

			console.log(`[SqlJsSemanalDateRangeRepository] Saved new date range: ${savedRange.getDisplayText()}`);
			return savedRange;

		} catch (error) {
			db.run("ROLLBACK");
			console.error("[SqlJsSemanalDateRangeRepository] Save error:", error);
			throw error;
		}
	}

	async getActive(): Promise<SemanalDateRange | null> {
		const db = getDatabase();

		const stmt = db.prepare(`
			SELECT * FROM ${TABLE_NAMES.SEMANAL_DATE_RANGES}
			WHERE isActive = 1
			ORDER BY id DESC
			LIMIT 1
		`);

		try {
			stmt.bind([]);
			if (stmt.step()) {
				const row = stmt.getAsObject() as SemanalDateRangeDbModel;
				const validatedRow = semanalDateRangeDbSchema.parse(row);
				return semanalDateRangeDbModelToDomain(validatedRow);
			}
			return null;
		} finally {
			stmt.free();
		}
	}

	async getCurrent(): Promise<SemanalDateRange | null> {
		return this.getActive();
	}

	async getAll(): Promise<SemanalDateRange[]> {
		const db = getDatabase();

		const result = db.exec(`
			SELECT * FROM ${TABLE_NAMES.SEMANAL_DATE_RANGES}
			ORDER BY id DESC
		`);

		if (!result[0]) {
			return [];
		}

		return this.mapResultToRanges(result[0]);
	}

	async getById(id: number): Promise<SemanalDateRange | null> {
		const db = getDatabase();

		const stmt = db.prepare(`
			SELECT * FROM ${TABLE_NAMES.SEMANAL_DATE_RANGES}
			WHERE id = ?
			LIMIT 1
		`);

		try {
			stmt.bind([id]);
			if (stmt.step()) {
				const row = stmt.getAsObject() as SemanalDateRangeDbModel;
				const validatedRow = semanalDateRangeDbSchema.parse(row);
				return semanalDateRangeDbModelToDomain(validatedRow);
			}
			return null;
		} finally {
			stmt.free();
		}
	}

	async deactivateCurrent(): Promise<void> {
		const db = getDatabase();

		db.run(`
			UPDATE ${TABLE_NAMES.SEMANAL_DATE_RANGES}
			SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
			WHERE isActive = 1
		`);

		await saveDatabaseToDisk();
		console.log("[SqlJsSemanalDateRangeRepository] Deactivated current range");
	}

	async setActive(id: number): Promise<void> {
		const db = getDatabase();

		try {
			// Begin transaction
			db.run("BEGIN TRANSACTION");

			// Deactivate all ranges
			db.run(`
				UPDATE ${TABLE_NAMES.SEMANAL_DATE_RANGES}
				SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
				WHERE isActive = 1
			`);

			// Activate the specified range
			const stmt = db.prepare(`
				UPDATE ${TABLE_NAMES.SEMANAL_DATE_RANGES}
				SET isActive = 1, updatedAt = CURRENT_TIMESTAMP
				WHERE id = ?
			`);

			stmt.run([id]);
			stmt.free();

			db.run("COMMIT");

			await saveDatabaseToDisk();
			console.log(`[SqlJsSemanalDateRangeRepository] Set range ${id} as active`);

		} catch (error) {
			db.run("ROLLBACK");
			console.error("[SqlJsSemanalDateRangeRepository] SetActive error:", error);
			throw error;
		}
	}

	async deleteAll(): Promise<void> {
		const db = getDatabase();
		db.run(`DELETE FROM ${TABLE_NAMES.SEMANAL_DATE_RANGES}`);
		await saveDatabaseToDisk();
		console.log("[SqlJsSemanalDateRangeRepository] Deleted all ranges");
	}

	private mapResultToRanges(result: any): SemanalDateRange[] {
		const columns = result.columns;
		const values = result.values;

		const ranges: SemanalDateRange[] = [];

		for (const row of values) {
			const recordObj: any = {};
			columns.forEach((col: string, index: number) => {
				recordObj[col] = row[index];
			});

			const validatedRow = semanalDateRangeDbSchema.parse(recordObj);
			ranges.push(semanalDateRangeDbModelToDomain(validatedRow));
		}

		return ranges;
	}
}