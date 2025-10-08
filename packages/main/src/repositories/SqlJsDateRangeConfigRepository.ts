import type {
	DateRangeConfigRepository,
	DateRangeConfigDbModel
} from "@app/core";
import {
	DateRangeConfig,
	dateRangeConfigDbModelToDomain,
	dateRangeConfigDomainToDbModel,
	dateRangeConfigDbSchema
} from "@app/core";
import { getDatabase, saveDatabaseToDisk, TABLE_NAMES } from "@app/database";

export class SqlJsDateRangeConfigRepository implements DateRangeConfigRepository {
	constructor() {
		this.ensureTableExists();
	}

	private ensureTableExists(): void {
		try {
			const db = getDatabase();

			// Ensure the date_range_configs table exists with new schema
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.DATE_RANGE_CONFIGS} (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					fromDate TEXT NOT NULL,
					toDate TEXT NOT NULL,
					description TEXT NOT NULL,
					isActive BOOLEAN DEFAULT 1,
					rangeType TEXT CHECK(rangeType IN ('weekly', 'custom', 'disabled')) DEFAULT 'disabled',
					scope TEXT CHECK(scope IN ('monthly', 'corrective', 'global')) DEFAULT 'monthly',
					createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				)
			`);

			// Create index for faster scope-based queries
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_date_range_configs_scope ON ${TABLE_NAMES.DATE_RANGE_CONFIGS}(scope, isActive)`
			);

			console.log(`[SqlJsDateRangeConfigRepository] Table ${TABLE_NAMES.DATE_RANGE_CONFIGS} ensured`);

		} catch (error) {
			console.error("[SqlJsDateRangeConfigRepository] Failed to ensure table exists:", error);
		}
	}

	async getByScope(scope: 'monthly' | 'corrective' | 'global'): Promise<DateRangeConfig | null> {
		const db = getDatabase();

		const stmt = db.prepare(`
			SELECT * FROM ${TABLE_NAMES.DATE_RANGE_CONFIGS}
			WHERE scope = ? AND isActive = 1
			LIMIT 1
		`);

		try {
			stmt.bind([scope]);
			if (stmt.step()) {
				const row = stmt.getAsObject() as DateRangeConfigDbModel;
				const validatedRow = dateRangeConfigDbSchema.parse(row);
				return dateRangeConfigDbModelToDomain(validatedRow);
			}
			return null;
		} finally {
			stmt.free();
		}
	}

	async saveForScope(scope: 'monthly' | 'corrective' | 'global', range: DateRangeConfig): Promise<DateRangeConfig> {
		const db = getDatabase();

		try {
			// Begin transaction
			db.run("BEGIN TRANSACTION");

			// Find existing record for this scope
			const existingStmt = db.prepare(`
				SELECT id FROM ${TABLE_NAMES.DATE_RANGE_CONFIGS}
				WHERE scope = ?
				LIMIT 1
			`);
			existingStmt.bind([scope]);
			const hasExisting = existingStmt.step();
			const existingId = hasExisting ? (existingStmt.getAsObject().id as number) : null;
			existingStmt.free();

			let savedId: number;

			if (existingId) {
				// Update existing record
				const dbModel = dateRangeConfigDomainToDbModel(range);
				const updateStmt = db.prepare(`
					UPDATE ${TABLE_NAMES.DATE_RANGE_CONFIGS}
					SET fromDate = ?, toDate = ?, description = ?, isActive = ?, rangeType = ?, updatedAt = CURRENT_TIMESTAMP
					WHERE id = ?
				`);
				updateStmt.run([
					dbModel.fromDate,
					dbModel.toDate,
					dbModel.description,
					1, // Always active
					dbModel.rangeType,
					existingId
				]);
				updateStmt.free();
				savedId = existingId;
			} else {
				// Insert new record
				const dbModel = dateRangeConfigDomainToDbModel(range);
				const insertStmt = db.prepare(`
					INSERT INTO ${TABLE_NAMES.DATE_RANGE_CONFIGS}
					(fromDate, toDate, description, isActive, rangeType, scope, createdAt, updatedAt)
					VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
				`);
				insertStmt.run([
					dbModel.fromDate,
					dbModel.toDate,
					dbModel.description,
					1, // Always active
					dbModel.rangeType,
					scope
				]);
				savedId = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0] as number;
				insertStmt.free();
			}

			db.run("COMMIT");

			// Save database to persistent storage
			await saveDatabaseToDisk();

			// Return the saved range with ID
			const savedRange = new DateRangeConfig(
				savedId,
				range.fromDate,
				range.toDate,
				range.description,
				true,
				range.rangeType,
				scope,
				new Date(),
				new Date()
			);

			console.log(`[SqlJsDateRangeConfigRepository] Saved date range for scope '${scope}': ${savedRange.getDisplayText()}`);
			return savedRange;

		} catch (error) {
			db.run("ROLLBACK");
			console.error("[SqlJsDateRangeConfigRepository] SaveForScope error:", error);
			throw error;
		}
	}

	async save(range: DateRangeConfig): Promise<DateRangeConfig> {
		const db = getDatabase();

		try {
			// Begin transaction
			db.run("BEGIN TRANSACTION");

			// Deactivate all current active ranges
			db.run(`
				UPDATE ${TABLE_NAMES.DATE_RANGE_CONFIGS}
				SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
				WHERE isActive = 1
			`);

			// Insert new range as active
			const dbModel = dateRangeConfigDomainToDbModel(range);
			const stmt = db.prepare(`
				INSERT INTO ${TABLE_NAMES.DATE_RANGE_CONFIGS}
				(fromDate, toDate, description, isActive, rangeType, scope, createdAt, updatedAt)
				VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`);

			stmt.run([
				dbModel.fromDate,
				dbModel.toDate,
				dbModel.description,
				1, // Always active for new ranges
				dbModel.rangeType,
				dbModel.scope
			]);

			const insertId = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0] as number;
			stmt.free();

			db.run("COMMIT");

			// Save database to persistent storage
			await saveDatabaseToDisk();

			// Return the saved range with ID
			const savedRange = new DateRangeConfig(
				insertId,
				range.fromDate,
				range.toDate,
				range.description,
				true,
				new Date(),
				new Date()
			);

			console.log(`[SqlJsDateRangeConfigRepository] Saved new date range: ${savedRange.getDisplayText()}`);
			return savedRange;

		} catch (error) {
			db.run("ROLLBACK");
			console.error("[SqlJsDateRangeConfigRepository] Save error:", error);
			throw error;
		}
	}

	async getActive(): Promise<DateRangeConfig | null> {
		const db = getDatabase();

		const stmt = db.prepare(`
			SELECT * FROM ${TABLE_NAMES.DATE_RANGE_CONFIGS}
			WHERE isActive = 1
			ORDER BY id DESC
			LIMIT 1
		`);

		try {
			stmt.bind([]);
			if (stmt.step()) {
				const row = stmt.getAsObject() as DateRangeConfigDbModel;
				const validatedRow = dateRangeConfigDbSchema.parse(row);
				return dateRangeConfigDbModelToDomain(validatedRow);
			}
			return null;
		} finally {
			stmt.free();
		}
	}

	async getCurrent(): Promise<DateRangeConfig | null> {
		return this.getActive();
	}

	async getAll(): Promise<DateRangeConfig[]> {
		const db = getDatabase();

		const result = db.exec(`
			SELECT * FROM ${TABLE_NAMES.DATE_RANGE_CONFIGS}
			ORDER BY id DESC
		`);

		if (!result[0]) {
			return [];
		}

		return this.mapResultToRanges(result[0]);
	}

	async getById(id: number): Promise<DateRangeConfig | null> {
		const db = getDatabase();

		const stmt = db.prepare(`
			SELECT * FROM ${TABLE_NAMES.DATE_RANGE_CONFIGS}
			WHERE id = ?
			LIMIT 1
		`);

		try {
			stmt.bind([id]);
			if (stmt.step()) {
				const row = stmt.getAsObject() as DateRangeConfigDbModel;
				const validatedRow = dateRangeConfigDbSchema.parse(row);
				return dateRangeConfigDbModelToDomain(validatedRow);
			}
			return null;
		} finally {
			stmt.free();
		}
	}

	async deactivateCurrent(): Promise<void> {
		const db = getDatabase();

		db.run(`
			UPDATE ${TABLE_NAMES.DATE_RANGE_CONFIGS}
			SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
			WHERE isActive = 1
		`);

		await saveDatabaseToDisk();
		console.log("[SqlJsDateRangeConfigRepository] Deactivated current range");
	}

	async setActive(id: number): Promise<void> {
		const db = getDatabase();

		try {
			// Begin transaction
			db.run("BEGIN TRANSACTION");

			// Deactivate all ranges
			db.run(`
				UPDATE ${TABLE_NAMES.DATE_RANGE_CONFIGS}
				SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
				WHERE isActive = 1
			`);

			// Activate the specified range
			const stmt = db.prepare(`
				UPDATE ${TABLE_NAMES.DATE_RANGE_CONFIGS}
				SET isActive = 1, updatedAt = CURRENT_TIMESTAMP
				WHERE id = ?
			`);

			stmt.run([id]);
			stmt.free();

			db.run("COMMIT");

			await saveDatabaseToDisk();
			console.log(`[SqlJsDateRangeConfigRepository] Set range ${id} as active`);

		} catch (error) {
			db.run("ROLLBACK");
			console.error("[SqlJsDateRangeConfigRepository] SetActive error:", error);
			throw error;
		}
	}

	async deleteAll(): Promise<void> {
		const db = getDatabase();
		db.run(`DELETE FROM ${TABLE_NAMES.DATE_RANGE_CONFIGS}`);
		await saveDatabaseToDisk();
		console.log("[SqlJsDateRangeConfigRepository] Deleted all ranges");
	}

	private mapResultToRanges(result: any): DateRangeConfig[] {
		const columns = result.columns;
		const values = result.values;

		const ranges: DateRangeConfig[] = [];

		for (const row of values) {
			const recordObj: any = {};
			columns.forEach((col: string, index: number) => {
				recordObj[col] = row[index];
			});

			const validatedRow = dateRangeConfigDbSchema.parse(recordObj);
			ranges.push(dateRangeConfigDbModelToDomain(validatedRow));
		}

		return ranges;
	}
}
