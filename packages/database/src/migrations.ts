import type { Database } from "sql.js";
import { TABLE_NAMES } from "./table-names.js";

/**
 * Database migration interface with enhanced features
 */
export interface Migration {
	version: string;
	description: string;
	dependencies?: string[]; // Versions this migration depends on
	up: (db: Database) => void | Promise<void>;
	down?: (db: Database) => void | Promise<void>;
	checksum?: string; // For integrity validation
	applied?: Date;
}

/**
 * Migration execution result
 */
export interface MigrationResult {
	version: string;
	success: boolean;
	error?: Error;
	executionTime: number;
}

/**
 * Migration state information
 */
export interface MigrationState {
	version: string;
	description: string;
	applied_at: string;
	checksum: string | null;
}

/**
 * Migration error class for better error handling
 */
export class MigrationError extends Error {
	constructor(
		message: string,
		public readonly version: string,
		public readonly operation: "up" | "down",
		public readonly originalError?: Error
	) {
		super(message);
		this.name = "MigrationError";

		if (originalError) {
			this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
		}
	}
}

/**
 * Generate a simple checksum for migration validation
 */
function generateChecksum(migration: Migration): string {
	const content =
		migration.up.toString() + (migration.down?.toString() || "");
	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash).toString(16);
}

/**
 * Available migrations with enhanced structure
 */
export const migrations: Migration[] = [
	{
		version: "001",
		description: "Create tag table",
		up: (db: Database) => {
			// Create tag table with current schema
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.TAG} (
					requestId TEXT PRIMARY KEY,
					createdTime TEXT,
					requestIdLink TEXT,
					informacionAdicional TEXT,
					modulo TEXT,
					problemId TEXT,
					problemIdLink TEXT,
					linkedRequestIdValue TEXT,
					linkedRequestIdLink TEXT,
					jira TEXT,
					categorizacion TEXT,
					technician TEXT,
					processedAt TEXT DEFAULT CURRENT_TIMESTAMP
				)
			`);

			// Create indexes for better performance
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_tag_createdTime ON ${TABLE_NAMES.TAG}(createdTime)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_tag_technician ON ${TABLE_NAMES.TAG}(technician)`
			);
		},
		down: (db: Database) => {
			db.run(`DROP TABLE IF EXISTS ${TABLE_NAMES.TAG}`);
		},
	},
	{
		version: "003",
		description: "Insert mock data for development",
		dependencies: ["001"],
		up: (db: Database) => {
			// Check if data already exists to avoid duplicates
			const result = db.exec(
				`SELECT COUNT(*) as count FROM ${TABLE_NAMES.TAG}`
			);
			const count = result[0]?.values[0]?.[0] as number;

			if (count > 0) {
				console.log("Mock data already exists, skipping insertion");
				return;
			}

			// Insert mock data for development/testing
			const mockData = [
				{
					createdTime: "2024-01-15T10:30:00Z",
					requestId: "REQ-001",
					requestIdLink: "https://jira.company.com/browse/REQ-001",
					informacionAdicional: "Error en módulo de facturación",
					modulo: "Facturación",
					problemId: "PROB-001",
					problemIdLink: "https://jira.company.com/browse/PROB-001",
					linkedRequestIdValue: "REQ-001",
					linkedRequestIdLink:
						"https://jira.company.com/browse/REQ-001",
					jira: "JIRA-12345",
					categorizacion: "Bug Critical",
					technician: "Juan Pérez",
				},
				{
					createdTime: "2024-01-16T14:20:00Z",
					requestId: "REQ-002",
					requestIdLink: "https://jira.company.com/browse/REQ-002",
					informacionAdicional: "Mejora en performance del dashboard",
					modulo: "Dashboard",
					problemId: "PROB-002",
					problemIdLink: "https://jira.company.com/browse/PROB-002",
					linkedRequestIdValue: "REQ-002",
					linkedRequestIdLink:
						"https://jira.company.com/browse/REQ-002",
					jira: "JIRA-12346",
					categorizacion: "Enhancement",
					technician: "María García",
				},
				{
					createdTime: "2024-01-17T09:15:00Z",
					requestId: "REQ-003",
					requestIdLink: "https://jira.company.com/browse/REQ-003",
					informacionAdicional:
						"Integración con nuevo sistema de pagos",
					modulo: "Pagos",
					problemId: "PROB-003",
					problemIdLink: "https://jira.company.com/browse/PROB-003",
					linkedRequestIdValue: "REQ-003",
					linkedRequestIdLink:
						"https://jira.company.com/browse/REQ-003",
					jira: "JIRA-12347",
					categorizacion: "Feature Request",
					technician: "Carlos Rodriguez",
				},
			];

			// Insert mock data using prepared statement for better performance
			const insertStmt = db.prepare(`
				INSERT INTO ${TABLE_NAMES.TAG} (
					requestId, createdTime, requestIdLink, informacionAdicional,
					modulo, problemId, problemIdLink, linkedRequestIdValue,
					linkedRequestIdLink, jira, categorizacion, technician, processedAt
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
			`);

			try {
				mockData.forEach((data) => {
					insertStmt.run([
						data.requestId,
						data.createdTime,
						data.requestIdLink,
						data.informacionAdicional,
						data.modulo,
						data.problemId,
						data.problemIdLink,
						data.linkedRequestIdValue,
						data.linkedRequestIdLink,
						data.jira,
						data.categorizacion,
						data.technician,
					]);
				});
			} finally {
				insertStmt.free();
			}
		},
		down: (db: Database) => {
			db.run(`DELETE FROM ${TABLE_NAMES.TAG}`);
		},
	},
	{
		version: "004",
		description:
			"Migrate existing tag table to use requestId as primary key",
		dependencies: ["003"],
		up: (db: Database) => {
			// Check if the table has the old schema with id column
			const schemaResult = db.exec(`
				PRAGMA table_info(${TABLE_NAMES.TAG})
			`);

			const hasIdColumn = schemaResult[0]?.values.some(
				(row) => row[1] === "id"
			);

			if (hasIdColumn) {
				// Create new table with correct schema
				db.run(`
					CREATE TABLE tag_new (
						requestId TEXT PRIMARY KEY,
						createdTime TEXT,
						requestIdLink TEXT,
						informacionAdicional TEXT,
						modulo TEXT,
						problemId TEXT,
						problemIdLink TEXT,
						linkedRequestIdValue TEXT,
						linkedRequestIdLink TEXT,
						jira TEXT,
						categorizacion TEXT,
						technician TEXT,
						processedAt TEXT DEFAULT CURRENT_TIMESTAMP
					)
				`);

				// Copy data from old table to new table
				db.run(`
					INSERT INTO tag_new (
						requestId, createdTime, requestIdLink, informacionAdicional,
						modulo, problemId, problemIdLink, linkedRequestIdValue,
						linkedRequestIdLink, jira, categorizacion, technician, processedAt
					)
					SELECT
						requestId, createdTime, requestIdLink, informacionAdicional,
						modulo, problemId, problemIdLink, linkedRequestIdValue,
						linkedRequestIdLink, jira, categorizacion, technician, processedAt
					FROM ${TABLE_NAMES.TAG}
				`);

				// Drop old table and rename new table
				db.run(`DROP TABLE ${TABLE_NAMES.TAG}`);
				db.run(`ALTER TABLE tag_new RENAME TO ${TABLE_NAMES.TAG}`);

				// Recreate indexes
				db.run(
					`CREATE INDEX IF NOT EXISTS idx_tag_createdTime ON ${TABLE_NAMES.TAG}(createdTime)`
				);
				db.run(
					`CREATE INDEX IF NOT EXISTS idx_tag_technician ON ${TABLE_NAMES.TAG}(technician)`
				);

				console.log(
					"✅ Migrated tag table to use requestId as primary key"
				);
			} else {
				console.log(
					"ℹ️ tag table already uses requestId as primary key"
				);
			}
		},
		down: (_db: Database) => {
			// This migration is not easily reversible as it changes the primary key
			// In a production system, you would need to backup data and restore
			console.warn(
				"⚠️ Cannot rollback migration 004 - primary key change"
			);
		},
	},
	{
		version: "005",
		description: "Create for_tagging_data table for Excel import data",
		dependencies: ["004"],
		up: (db: Database) => {
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.FOR_TAGGING_DATA} (
					requestId TEXT PRIMARY KEY,
					technician TEXT,
					createdTime TEXT,
					modulo TEXT,
					subject TEXT,
					problemId TEXT,
					linkedRequestId TEXT,
					category TEXT,
					importedAt TEXT DEFAULT CURRENT_TIMESTAMP,
					sourceFile TEXT
				)
			`);

			// Create indexes for better query performance
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_for_tagging_data_category ON ${TABLE_NAMES.FOR_TAGGING_DATA}(category)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_for_tagging_data_technician ON ${TABLE_NAMES.FOR_TAGGING_DATA}(technician)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_for_tagging_data_createdTime ON ${TABLE_NAMES.FOR_TAGGING_DATA}(createdTime)`
			);
		},
		down: (db: Database) => {
			db.run(`DROP TABLE IF EXISTS ${TABLE_NAMES.FOR_TAGGING_DATA}`);
		},
	},
	{
		version: "006",
		description: "Add link columns to for_tagging_data table",
		dependencies: ["005"],
		up: (db: Database) => {
			// Add link columns to existing table
			db.run(
				`ALTER TABLE ${TABLE_NAMES.FOR_TAGGING_DATA} ADD COLUMN requestIdLink TEXT`
			);
			db.run(
				`ALTER TABLE ${TABLE_NAMES.FOR_TAGGING_DATA} ADD COLUMN subjectLink TEXT`
			);
			db.run(
				`ALTER TABLE ${TABLE_NAMES.FOR_TAGGING_DATA} ADD COLUMN problemIdLink TEXT`
			);
			db.run(
				`ALTER TABLE ${TABLE_NAMES.FOR_TAGGING_DATA} ADD COLUMN linkedRequestIdLink TEXT`
			);
		},
		down: (db: Database) => {
			// SQLite doesn't support dropping columns, so we recreate the table without link columns
			db.run(`
				CREATE TABLE ${TABLE_NAMES.FOR_TAGGING_DATA}_temp (
					requestId TEXT PRIMARY KEY,
					technician TEXT,
					createdTime TEXT,
					modulo TEXT,
					subject TEXT,
					problemId TEXT,
					linkedRequestId TEXT,
					category TEXT,
					importedAt TEXT DEFAULT CURRENT_TIMESTAMP,
					sourceFile TEXT
				)
			`);

			// Copy data from old table to new table (excluding link columns)
			db.run(`
				INSERT INTO ${TABLE_NAMES.FOR_TAGGING_DATA}_temp (
					requestId, technician, createdTime, modulo, subject,
					problemId, linkedRequestId, category, importedAt, sourceFile
				)
				SELECT requestId, technician, createdTime, modulo, subject,
					   problemId, linkedRequestId, category, importedAt, sourceFile
				FROM ${TABLE_NAMES.FOR_TAGGING_DATA}
			`);

			// Drop old table and rename new table
			db.run(`DROP TABLE ${TABLE_NAMES.FOR_TAGGING_DATA}`);
			db.run(
				`ALTER TABLE ${TABLE_NAMES.FOR_TAGGING_DATA}_temp RENAME TO ${TABLE_NAMES.FOR_TAGGING_DATA}`
			);

			// Recreate indexes
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_for_tagging_data_category ON ${TABLE_NAMES.FOR_TAGGING_DATA}(category)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_for_tagging_data_technician ON ${TABLE_NAMES.FOR_TAGGING_DATA}(technician)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_for_tagging_data_createdTime ON ${TABLE_NAMES.FOR_TAGGING_DATA}(createdTime)`
			);
		},
	},
	{
		version: "007",
		description:
			"Remove importedAt and sourceFile columns from for_tagging_data table",
		dependencies: ["006"],
		up: (db: Database) => {
			// Create new table without importedAt and sourceFile columns
			db.run(`
				CREATE TABLE ${TABLE_NAMES.FOR_TAGGING_DATA}_temp (
					requestId TEXT PRIMARY KEY,
					technician TEXT,
					createdTime TEXT,
					modulo TEXT,
					subject TEXT,
					problemId TEXT,
					linkedRequestId TEXT,
					category TEXT,
					requestIdLink TEXT,
					subjectLink TEXT,
					problemIdLink TEXT,
					linkedRequestIdLink TEXT
				)
			`);

			// Copy data from old table to new table (excluding importedAt and sourceFile)
			db.run(`
				INSERT INTO ${TABLE_NAMES.FOR_TAGGING_DATA}_temp (
					requestId, technician, createdTime, modulo, subject, problemId,
					linkedRequestId, category, requestIdLink, subjectLink,
					problemIdLink, linkedRequestIdLink
				)
				SELECT
					requestId, technician, createdTime, modulo, subject, problemId,
					linkedRequestId, category, requestIdLink, subjectLink,
					problemIdLink, linkedRequestIdLink
				FROM ${TABLE_NAMES.FOR_TAGGING_DATA}
			`);

			// Drop old table
			db.run(`DROP TABLE ${TABLE_NAMES.FOR_TAGGING_DATA}`);

			// Rename new table to original name
			db.run(
				`ALTER TABLE ${TABLE_NAMES.FOR_TAGGING_DATA}_temp RENAME TO ${TABLE_NAMES.FOR_TAGGING_DATA}`
			);

			// Recreate indexes
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_for_tagging_data_category ON ${TABLE_NAMES.FOR_TAGGING_DATA}(category)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_for_tagging_data_technician ON ${TABLE_NAMES.FOR_TAGGING_DATA}(technician)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_for_tagging_data_createdTime ON ${TABLE_NAMES.FOR_TAGGING_DATA}(createdTime)`
			);
		},
		down: (db: Database) => {
			// Add back the columns (reverse migration)
			db.run(
				`ALTER TABLE ${TABLE_NAMES.FOR_TAGGING_DATA} ADD COLUMN importedAt TEXT DEFAULT CURRENT_TIMESTAMP`
			);
			db.run(
				`ALTER TABLE ${TABLE_NAMES.FOR_TAGGING_DATA} ADD COLUMN sourceFile TEXT`
			);
		},
	},
	// Add more migrations here as your schema evolves
];

// Generate checksums for all migrations
migrations.forEach((migration) => {
	migration.checksum = generateChecksum(migration);
});

/**
 * Validate migration dependencies
 */
function validateDependencies(migrations: Migration[]): void {
	const versions = new Set(migrations.map((m) => m.version));

	for (const migration of migrations) {
		if (migration.dependencies) {
			for (const dep of migration.dependencies) {
				if (!versions.has(dep)) {
					throw new MigrationError(
						`Migration ${migration.version} depends on non-existent migration ${dep}`,
						migration.version,
						"up"
					);
				}
			}
		}
	}
}

/**
 * Sort migrations in dependency order
 */
function sortMigrationsByDependencies(migrations: Migration[]): Migration[] {
	const sorted: Migration[] = [];
	const processing = new Set<string>();
	const processed = new Set<string>();

	function visit(migration: Migration): void {
		if (processed.has(migration.version)) {
			return;
		}

		if (processing.has(migration.version)) {
			throw new MigrationError(
				`Circular dependency detected involving migration ${migration.version}`,
				migration.version,
				"up"
			);
		}

		processing.add(migration.version);

		// Process dependencies first
		if (migration.dependencies) {
			for (const depVersion of migration.dependencies) {
				const depMigration = migrations.find(
					(m) => m.version === depVersion
				);
				if (depMigration) {
					visit(depMigration);
				}
			}
		}

		processing.delete(migration.version);
		processed.add(migration.version);
		sorted.push(migration);
	}

	for (const migration of migrations) {
		visit(migration);
	}

	return sorted;
}

/**
 * Initialize migrations table with enhanced schema
 */
function initializeMigrationsTable(db: Database): void {
	db.run(`
		CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.MIGRATIONS} (
			version TEXT PRIMARY KEY,
			description TEXT NOT NULL,
			applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
			checksum TEXT,
			execution_time INTEGER DEFAULT 0
		)
	`);
}

/**
 * Get applied migrations with full state information
 * Handles both old and new schema formats for backward compatibility
 */
function getAppliedMigrations(db: Database): MigrationState[] {
	try {
		// First, try to get the table schema to see what columns exist
		const schemaResult = db.exec(`
			PRAGMA table_info(${TABLE_NAMES.MIGRATIONS})
		`);

		const hasDescriptionColumn = schemaResult[0]?.values.some(
			(row) => row[1] === "description"
		);
		const hasChecksumColumn = schemaResult[0]?.values.some(
			(row) => row[1] === "checksum"
		);

		let query: string;
		if (hasDescriptionColumn && hasChecksumColumn) {
			// New schema with all columns
			query = `
				SELECT version, description, applied_at, checksum
				FROM ${TABLE_NAMES.MIGRATIONS}
				ORDER BY version
			`;
		} else if (hasDescriptionColumn) {
			// Has description but no checksum
			query = `
				SELECT version, description, applied_at, NULL as checksum
				FROM ${TABLE_NAMES.MIGRATIONS}
				ORDER BY version
			`;
		} else {
			// Old schema - only version and applied_at
			query = `
				SELECT version, 'Legacy Migration' as description, applied_at, NULL as checksum
				FROM ${TABLE_NAMES.MIGRATIONS}
				ORDER BY version
			`;
		}

		const result = db.exec(query);

		if (!result[0]) {
			return [];
		}

		return result[0].values.map((row) => ({
			version: row[0] as string,
			description: row[1] as string,
			applied_at: row[2] as string,
			checksum: row[3] as string | null,
		}));
	} catch (error) {
		// If table doesn't exist or any other error, return empty array
		console.log(
			"No migrations table found or error reading migrations:",
			error
		);
		return [];
	}
}

/**
 * Validate migration integrity using checksums
 */
function validateMigrationIntegrity(
	migration: Migration,
	appliedMigration: MigrationState
): void {
	if (
		appliedMigration.checksum &&
		migration.checksum !== appliedMigration.checksum
	) {
		throw new MigrationError(
			`Migration ${migration.version} has been modified since it was applied. ` +
				`Expected checksum: ${appliedMigration.checksum}, got: ${migration.checksum}`,
			migration.version,
			"up"
		);
	}
}

/**
 * Apply all pending migrations with enhanced error handling and validation
 */
export function runMigrations(db: Database): MigrationResult[] {
	const results: MigrationResult[] = [];

	try {
		// Validate migration structure
		validateDependencies(migrations);

		// Initialize migrations table
		initializeMigrationsTable(db);

		// Get applied migrations
		const appliedMigrations = getAppliedMigrations(db);
		const appliedVersions = new Set(
			appliedMigrations.map((m) => m.version)
		);

		// Sort migrations by dependencies
		const sortedMigrations = sortMigrationsByDependencies(migrations);

		// Validate integrity of applied migrations
		for (const migration of sortedMigrations) {
			const appliedMigration = appliedMigrations.find(
				(m) => m.version === migration.version
			);
			if (appliedMigration) {
				try {
					validateMigrationIntegrity(migration, appliedMigration);
				} catch (error) {
					console.warn(
						`Migration integrity check failed: ${
							error instanceof Error
								? error.message
								: String(error)
						}`
					);
				}
			}
		}

		// Apply pending migrations
		for (const migration of sortedMigrations) {
			if (!appliedVersions.has(migration.version)) {
				const startTime = Date.now();
				console.log(
					`Applying migration ${migration.version}: ${migration.description}`
				);

				try {
					// Execute migration
					migration.up(db);

					const executionTime = Date.now() - startTime;

					// Record successful migration
					db.run(
						`INSERT INTO ${TABLE_NAMES.MIGRATIONS} (version, description, checksum, execution_time)
						 VALUES (?, ?, ?, ?)`,
						[
							migration.version,
							migration.description,
							migration.checksum || null,
							executionTime,
						]
					);

					results.push({
						version: migration.version,
						success: true,
						executionTime,
					});

					console.log(
						`Migration ${migration.version} applied successfully (${executionTime}ms)`
					);
				} catch (error) {
					const migrationError = new MigrationError(
						`Failed to apply migration ${migration.version}: ${
							error instanceof Error
								? error.message
								: String(error)
						}`,
						migration.version,
						"up",
						error instanceof Error
							? error
							: new Error(String(error))
					);

					results.push({
						version: migration.version,
						success: false,
						error: migrationError,
						executionTime: Date.now() - startTime,
					});

					console.error(
						`Migration ${migration.version} failed:`,
						migrationError
					);
					throw migrationError;
				}
			}
		}

		return results;
	} catch (error) {
		console.error("Migration process failed:", error);
		throw error;
	}
}

/**
 * Rollback migrations with enhanced validation and dependency checking
 */
export function rollbackMigrations(
	db: Database,
	targetVersion?: string
): MigrationResult[] {
	const results: MigrationResult[] = [];

	try {
		const appliedMigrations = getAppliedMigrations(db);
		const sortedAppliedVersions = appliedMigrations
			.map((m) => m.version)
			.sort()
			.reverse(); // Rollback in reverse order

		for (const version of sortedAppliedVersions) {
			if (targetVersion && version <= targetVersion) {
				break;
			}

			const migration = migrations.find((m) => m.version === version);
			if (migration?.down) {
				const startTime = Date.now();
				console.log(
					`Rolling back migration ${version}: ${migration.description}`
				);

				try {
					migration.down(db);

					const executionTime = Date.now() - startTime;

					// Remove migration record
					db.run(
						`DELETE FROM ${TABLE_NAMES.MIGRATIONS} WHERE version = ?`,
						[version]
					);

					results.push({
						version,
						success: true,
						executionTime,
					});

					console.log(
						`Migration ${version} rolled back successfully (${executionTime}ms)`
					);
				} catch (error) {
					const migrationError = new MigrationError(
						`Failed to rollback migration ${version}: ${
							error instanceof Error
								? error.message
								: String(error)
						}`,
						version,
						"down",
						error instanceof Error
							? error
							: new Error(String(error))
					);

					results.push({
						version,
						success: false,
						error: migrationError,
						executionTime: Date.now() - startTime,
					});

					console.error(
						`Rollback of migration ${version} failed:`,
						migrationError
					);
					throw migrationError;
				}
			} else {
				console.warn(
					`Migration ${version} does not have a rollback function`
				);
			}
		}

		return results;
	} catch (error) {
		console.error("Rollback process failed:", error);
		throw error;
	}
}

/**
 * Get migration status information
 */
export function getMigrationStatus(db: Database): {
	availableMigrations: Migration[];
	appliedMigrations: MigrationState[];
	pendingMigrations: Migration[];
} {
	try {
		initializeMigrationsTable(db);
		const appliedMigrations = getAppliedMigrations(db);
		const appliedVersions = new Set(
			appliedMigrations.map((m) => m.version)
		);

		const pendingMigrations = migrations.filter(
			(m) => !appliedVersions.has(m.version)
		);

		return {
			availableMigrations: migrations,
			appliedMigrations,
			pendingMigrations,
		};
	} catch (error) {
		console.error("Failed to get migration status:", error);
		throw error;
	}
}
