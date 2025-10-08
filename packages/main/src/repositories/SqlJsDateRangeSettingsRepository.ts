import type {
	DateRangeSettingsRepository,
	DateRangeSettingsDbModel
} from "@app/core";
import {
	DateRangeSettings,
	dateRangeSettingsDbModelToDomain,
	dateRangeSettingsDomainToDbModel,
	dateRangeSettingsDbSchema
} from "@app/core";
import { getDatabase, saveDatabaseToDisk, TABLE_NAMES } from "@app/database";

export class SqlJsDateRangeSettingsRepository implements DateRangeSettingsRepository {
	constructor() {
		this.ensureTableExists();
	}

	private ensureTableExists(): void {
		try {
			const db = getDatabase();

			// Ensure the date_range_settings table exists
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.DATE_RANGE_SETTINGS} (
					id INTEGER PRIMARY KEY CHECK(id = 1),
					globalModeEnabled INTEGER DEFAULT 0,
					createdAt TEXT NOT NULL,
					updatedAt TEXT NOT NULL
				)
			`);

			// Insert default settings if not exists
			const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${TABLE_NAMES.DATE_RANGE_SETTINGS}`);
			stmt.bind([]);
			if (stmt.step()) {
				const count = stmt.getAsObject().count as number;
				if (count === 0) {
					db.run(`
						INSERT INTO ${TABLE_NAMES.DATE_RANGE_SETTINGS} (id, globalModeEnabled, createdAt, updatedAt)
						VALUES (1, 0, datetime('now'), datetime('now'))
					`);
					console.log('[SqlJsDateRangeSettingsRepository] Inserted default settings: Global Mode OFF');
				}
			}
			stmt.free();

			console.log(`[SqlJsDateRangeSettingsRepository] Table ${TABLE_NAMES.DATE_RANGE_SETTINGS} ensured`);

		} catch (error) {
			console.error("[SqlJsDateRangeSettingsRepository] Failed to ensure table exists:", error);
		}
	}

	async getSettings(): Promise<DateRangeSettings> {
		const db = getDatabase();

		const stmt = db.prepare(`
			SELECT * FROM ${TABLE_NAMES.DATE_RANGE_SETTINGS}
			WHERE id = 1
			LIMIT 1
		`);

		try {
			stmt.bind([]);
			if (stmt.step()) {
				const row = stmt.getAsObject() as DateRangeSettingsDbModel;
				const validatedRow = dateRangeSettingsDbSchema.parse(row);
				return dateRangeSettingsDbModelToDomain(validatedRow);
			}

			// If no settings exist (shouldn't happen), create default
			console.warn('[SqlJsDateRangeSettingsRepository] No settings found, creating default');
			return DateRangeSettings.createWithGlobalModeDisabled();
		} finally {
			stmt.free();
		}
	}

	async updateGlobalMode(enabled: boolean): Promise<DateRangeSettings> {
		const db = getDatabase();

		try {
			// Begin transaction
			db.run("BEGIN TRANSACTION");

			// Update settings
			const stmt = db.prepare(`
				UPDATE ${TABLE_NAMES.DATE_RANGE_SETTINGS}
				SET globalModeEnabled = ?, updatedAt = datetime('now')
				WHERE id = 1
			`);

			stmt.run([enabled ? 1 : 0]);
			stmt.free();

			db.run("COMMIT");

			// Save database to persistent storage
			await saveDatabaseToDisk();

			console.log(`[SqlJsDateRangeSettingsRepository] Updated global mode to: ${enabled ? 'ON' : 'OFF'}`);

			// Return updated settings
			return await this.getSettings();

		} catch (error) {
			db.run("ROLLBACK");
			console.error("[SqlJsDateRangeSettingsRepository] UpdateGlobalMode error:", error);
			throw error;
		}
	}
}
