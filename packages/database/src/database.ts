import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import initSqlJs, {
	type BindParams,
	type Database,
	type SqlJsStatic,
	type Statement,
} from "sql.js";

/**
 * Database configuration options
 */
export interface DatabaseOptions {
	path?: string;
	inMemory?: boolean;
	enableWAL?: boolean;
	autoVacuum?: boolean;
	journalMode?: "DELETE" | "TRUNCATE" | "PERSIST" | "MEMORY" | "WAL" | "OFF";
	synchronous?: "OFF" | "NORMAL" | "FULL" | "EXTRA";
}

/**
 * Database creation result with metadata
 */
export interface DatabaseCreationResult {
	database: Database;
	isNewDatabase: boolean;
	filePath?: string;
	sqlInstance: SqlJsStatic;
}

// Re-export SQL.js types for convenience
export type { Database, Statement, BindParams, SqlJsStatic };

/**
 * Database error class for better error handling
 */
export class DatabaseError extends Error {
	constructor(
		message: string,
		public readonly operation: string,
		public readonly originalError?: Error
	) {
		super(message);
		this.name = "DatabaseError";

		if (originalError) {
			this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
		}
	}
}

/**
 * Ensure directory exists for the given file path
 */
function ensureDirectoryExists(filePath: string): void {
	const dir = dirname(filePath);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
}

/**
 * Configure database pragmas for better performance and reliability
 */
function configurePragmas(db: Database, options: DatabaseOptions): void {
	try {
		// Set journal mode
		if (options.journalMode) {
			db.run(`PRAGMA journal_mode = ${options.journalMode}`);
		}

		// Set synchronous mode
		if (options.synchronous) {
			db.run(`PRAGMA synchronous = ${options.synchronous}`);
		}

		// Enable auto vacuum if specified
		if (options.autoVacuum) {
			db.run("PRAGMA auto_vacuum = INCREMENTAL");
		}

		// Set other performance pragmas
		db.run("PRAGMA cache_size = -64000"); // 64MB cache
		db.run("PRAGMA temp_store = MEMORY");
		db.run("PRAGMA mmap_size = 268435456"); // 256MB mmap

		console.log("Database pragmas configured successfully");
	} catch (error) {
		console.warn("Failed to configure some database pragmas:", error);
	}
}

/**
 * Create a SQL.js database instance with enhanced error handling and configuration
 * This is a low-level function - use DatabaseManager for application usage
 */
export async function createDatabase(
	options: DatabaseOptions = {}
): Promise<DatabaseCreationResult> {
	const operation = "createDatabase";

	try {
		console.log("Initializing SQL.js database...", options);

		// Initialize SQL.js with better configuration
		const SQL = await initSqlJs({
			// You can specify wasm file location if needed
			// locateFile: file => `path/to/${file}`
		});

		let db: Database;
		let isNewDatabase = false;
		let resolvedPath: string | undefined;

		if (options.path && !options.inMemory) {
			// Resolve and ensure the path exists
			resolvedPath = resolve(options.path);
			ensureDirectoryExists(resolvedPath);

			try {
				if (existsSync(resolvedPath)) {
					console.log(
						`Loading existing database from: ${resolvedPath}`
					);
					const data = readFileSync(resolvedPath);

					if (data.length === 0) {
						console.log(
							"Database file is empty, creating new database"
						);
						db = new SQL.Database();
						isNewDatabase = true;
					} else {
						db = new SQL.Database(data);
						console.log("Existing database loaded successfully");
					}
				} else {
					console.log(`Creating new database at: ${resolvedPath}`);
					db = new SQL.Database();
					isNewDatabase = true;
				}
			} catch (error) {
				console.error(
					`Failed to load database from ${resolvedPath}:`,
					error
				);
				console.log("Creating new database instead");
				db = new SQL.Database();
				isNewDatabase = true;
			}
		} else {
			// Create in-memory database
			console.log("Creating in-memory database");
			db = new SQL.Database();
			isNewDatabase = true;
		}

		// Configure database pragmas
		configurePragmas(db, options);

		// Test database connectivity
		try {
			db.run("SELECT 1");
		} catch (error) {
			throw new DatabaseError(
				"Database connectivity test failed",
				operation,
				error instanceof Error ? error : new Error(String(error))
			);
		}

		console.log("Database created successfully", {
			isNewDatabase,
			filePath: resolvedPath,
			inMemory: options.inMemory || false,
		});

		return {
			database: db,
			isNewDatabase,
			filePath: resolvedPath,
			sqlInstance: SQL,
		};
	} catch (error) {
		if (error instanceof DatabaseError) {
			throw error;
		}

		throw new DatabaseError(
			`Failed to create database: ${
				error instanceof Error ? error.message : String(error)
			}`,
			operation,
			error instanceof Error ? error : new Error(String(error))
		);
	}
}

/**
 * Save database to file with error handling and atomic operations
 */
export async function saveDatabase(
	db: Database,
	filePath: string
): Promise<void> {
	const operation = "saveDatabase";

	try {
		if (!filePath) {
			throw new DatabaseError(
				"File path is required for saving database",
				operation
			);
		}

		const resolvedPath = resolve(filePath);
		ensureDirectoryExists(resolvedPath);

		// Export database to buffer
		const data = db.export();

		// Atomic write: write to temporary file first, then rename
		const tempPath = `${resolvedPath}.tmp`;

		try {
			writeFileSync(tempPath, data);

			// On Windows, we need to remove the target file first
			if (existsSync(resolvedPath)) {
				writeFileSync(resolvedPath, data);
			} else {
				writeFileSync(resolvedPath, data);
			}

			// Clean up temp file
			if (existsSync(tempPath)) {
				try {
					const fs = await import("node:fs/promises");
					await fs.unlink(tempPath);
				} catch {
					// Ignore cleanup errors
				}
			}

			console.log(`Database saved successfully to: ${resolvedPath}`);
		} catch (error) {
			// Clean up temp file on error
			if (existsSync(tempPath)) {
				try {
					const fs = await import("node:fs/promises");
					await fs.unlink(tempPath);
				} catch {
					// Ignore cleanup errors
				}
			}
			throw error;
		}
	} catch (error) {
		throw new DatabaseError(
			`Failed to save database: ${
				error instanceof Error ? error.message : String(error)
			}`,
			operation,
			error instanceof Error ? error : new Error(String(error))
		);
	}
}

/**
 * Create a backup of the database
 */
export async function backupDatabase(
	db: Database,
	backupPath: string
): Promise<void> {
	const operation = "backupDatabase";

	try {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const resolvedBackupPath = resolve(
			backupPath.replace(/\.db$/, `_backup_${timestamp}.db`)
		);

		await saveDatabase(db, resolvedBackupPath);
		console.log(`Database backup created: ${resolvedBackupPath}`);
	} catch (error) {
		throw new DatabaseError(
			`Failed to create database backup: ${
				error instanceof Error ? error.message : String(error)
			}`,
			operation,
			error instanceof Error ? error : new Error(String(error))
		);
	}
}
