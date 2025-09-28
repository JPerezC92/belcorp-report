import type { BindParams, Database } from "sql.js";
import {
	backupDatabase,
	createDatabase,
	type DatabaseCreationResult,
	DatabaseError,
	type DatabaseOptions,
	saveDatabase as saveDatabaseToFile,
} from "./database.js";
import { runMigrations } from "./migrations.js";

/**
 * Transaction callback function type
 */
export type TransactionCallback<T = unknown> = (db: Database) => T | Promise<T>;

/**
 * Query result type for better type safety
 */
export type QueryResult = Record<string, unknown>;

/**
 * Database manager configuration
 */
export interface DatabaseManagerConfig extends DatabaseOptions {
	autoSave?: boolean;
	autoSaveInterval?: number; // milliseconds
	maxRetries?: number;
	backupOnMigration?: boolean;
	enableTransactions?: boolean;
}

/**
 * Transaction state management
 */
interface TransactionState {
	id: string;
	startTime: number;
	savepoint?: string;
}

/**
 * Database instance manager with enhanced features
 * Provides a singleton pattern for database access across the application
 * Includes transactional support, auto-save, and backup functionality
 */
class DatabaseManager {
	private static instance: DatabaseManager | null = null;
	private database: Database | null = null;
	private isInitialized = false;
	private config: DatabaseManagerConfig = {};
	private autoSaveTimer: NodeJS.Timeout | null = null;
	private savePromise: Promise<void> | null = null;
	private transactionStack: TransactionState[] = [];
	private retryCount = 0;

	private constructor() {}

	/**
	 * Get the singleton instance
	 */
	static getInstance(): DatabaseManager {
		if (!DatabaseManager.instance) {
			DatabaseManager.instance = new DatabaseManager();
		}
		return DatabaseManager.instance;
	}

	/**
	 * Initialize the database with enhanced configuration and migrations
	 */
	async initialize(config: DatabaseManagerConfig = {}): Promise<Database> {
		if (this.isInitialized && this.database) {
			console.log("Database already initialized");
			return this.database;
		}

		this.config = {
			autoSave: true,
			autoSaveInterval: 30000, // 30 seconds
			maxRetries: 3,
			backupOnMigration: true,
			enableTransactions: true,
			journalMode: "WAL",
			synchronous: "NORMAL",
			...config,
		};

		try {
			console.log(
				"Initializing DatabaseManager with config:",
				this.config
			);

			// Create database instance with enhanced error handling
			const result: DatabaseCreationResult = await createDatabase(
				this.config
			);
			this.database = result.database;

			// Create backup before migrations if enabled and database exists
			if (
				this.config.backupOnMigration &&
				!result.isNewDatabase &&
				this.config.path
			) {
				try {
					await backupDatabase(this.database, this.config.path);
				} catch (error) {
					console.warn(
						"Failed to create pre-migration backup:",
						error
					);
				}
			}

			// Run migrations to create/update tables
			await this.runMigrationsWithRetry();

			// Set as initialized before calling other methods that depend on it
			this.isInitialized = true;
			this.retryCount = 0;

			// Save database after migrations if file-based
			if (this.config.path && !this.config.inMemory) {
				await this.saveToDisk();
			}

			// Setup auto-save if enabled
			if (
				this.config.autoSave &&
				this.config.autoSaveInterval &&
				this.config.path
			) {
				this.setupAutoSave();
			}

			console.log("DatabaseManager initialized successfully", {
				isNewDatabase: result.isNewDatabase,
				filePath: result.filePath,
				autoSave: this.config.autoSave,
				transactionsEnabled: this.config.enableTransactions,
			});

			if (!this.database) {
				throw new DatabaseError(
					"Database initialization failed: database is null",
					"initialize"
				);
			}

			return this.database;
		} catch (error) {
			console.error("Failed to initialize DatabaseManager:", error);

			// Retry logic for initialization
			if (this.retryCount < (this.config.maxRetries || 3)) {
				this.retryCount++;
				console.log(
					`Retrying database initialization (attempt ${this.retryCount})`
				);
				await new Promise((resolve) =>
					setTimeout(resolve, 1000 * this.retryCount)
				);
				return this.initialize(config);
			}

			throw new DatabaseError(
				"Failed to initialize database after multiple attempts",
				"initialize",
				error instanceof Error ? error : new Error(String(error))
			);
		}
	}

	/**
	 * Get the current database instance
	 * Throws error if not initialized
	 */
	getDatabase(): Database {
		if (!this.database || !this.isInitialized) {
			throw new DatabaseError(
				"Database not initialized. Call initialize() first.",
				"getDatabase"
			);
		}
		return this.database;
	}

	/**
	 * Execute a function within a database transaction
	 * Provides rollback on error and proper transaction management
	 */
	async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
		if (!this.config.enableTransactions) {
			// If transactions are disabled, just execute the callback
			return callback(this.getDatabase());
		}

		const db = this.getDatabase();
		const transactionId = `tx_${Date.now()}_${Math.random()
			.toString(36)
			.substr(2, 9)}`;
		const transaction: TransactionState = {
			id: transactionId,
			startTime: Date.now(),
		};

		try {
			// Begin transaction
			if (this.transactionStack.length === 0) {
				db.run("BEGIN TRANSACTION");
				console.log(`Started transaction: ${transactionId}`);
			} else {
				// Nested transaction - use savepoint
				const savepoint = `sp_${this.transactionStack.length}`;
				db.run(`SAVEPOINT ${savepoint}`);
				transaction.savepoint = savepoint;
				console.log(
					`Created savepoint: ${savepoint} for transaction: ${transactionId}`
				);
			}

			this.transactionStack.push(transaction);

			// Execute the callback
			console.log(`Executing transaction callback: ${transactionId}`);
			const result = await callback(db);
			console.log(
				`Transaction callback completed successfully: ${transactionId}`
			);

			// Commit transaction
			if (transaction.savepoint) {
				db.run(`RELEASE SAVEPOINT ${transaction.savepoint}`);
				console.log(`Released savepoint: ${transaction.savepoint}`);
			} else {
				const duration = Date.now() - transaction.startTime;
				db.run("COMMIT");
				console.log(
					`Committed transaction: ${transactionId} (duration: ${duration}ms)`
				);

				// Auto-save after successful transaction if enabled
				if (this.config.autoSave && this.config.path) {
					this.debouncedSave();
				}
			}

			this.transactionStack.pop();
			return result;
		} catch (error) {
			// Log the error that caused the rollback
			const duration = Date.now() - transaction.startTime;
			console.error(
				`Transaction callback failed after ${duration}ms: ${transactionId}`,
				{
					error:
						error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
				}
			);

			// Rollback transaction
			try {
				if (transaction.savepoint) {
					db.run(`ROLLBACK TO SAVEPOINT ${transaction.savepoint}`);
					console.log(
						`Rolled back to savepoint: ${transaction.savepoint}`
					);
				} else {
					db.run("ROLLBACK");
					const duration = Date.now() - transaction.startTime;
					console.log(
						`Rolled back transaction: ${transactionId} (duration: ${duration}ms)`
					);
				}
			} catch (rollbackError) {
				console.error("Failed to rollback transaction:", rollbackError);
			}

			this.transactionStack.pop();

			throw new DatabaseError(
				`Transaction failed: ${
					error instanceof Error ? error.message : String(error)
				}`,
				"transaction",
				error instanceof Error ? error : new Error(String(error))
			);
		}
	}

	/**
	 * Execute a prepared statement with parameter binding
	 */
	execute(sql: string, params?: BindParams): QueryResult[] {
		const db = this.getDatabase();

		try {
			const stmt = db.prepare(sql);
			const result: QueryResult[] = [];

			if (params) {
				stmt.bind(params);
			}

			while (stmt.step()) {
				result.push(stmt.getAsObject());
			}

			stmt.free();
			return result;
		} catch (error) {
			throw new DatabaseError(
				`Failed to execute SQL: ${
					error instanceof Error ? error.message : String(error)
				}`,
				"execute",
				error instanceof Error ? error : new Error(String(error))
			);
		}
	}

	/**
	 * Execute a simple SQL statement (without parameters)
	 */
	run(sql: string): void {
		const db = this.getDatabase();

		try {
			db.run(sql);
		} catch (error) {
			throw new DatabaseError(
				`Failed to run SQL: ${
					error instanceof Error ? error.message : String(error)
				}`,
				"run",
				error instanceof Error ? error : new Error(String(error))
			);
		}
	}

	/**
	 * Get query results as objects
	 */
	query(sql: string, params?: BindParams): QueryResult[] {
		return this.execute(sql, params);
	}

	/**
	 * Check if database is initialized and ready
	 */
	isReady(): boolean {
		return this.isInitialized && this.database !== null;
	}

	/**
	 * Save database to disk immediately
	 */
	async saveToDisk(): Promise<void> {
		if (!this.config.path || this.config.inMemory) {
			return;
		}

		if (this.savePromise) {
			return this.savePromise;
		}

		this.savePromise = (async () => {
			try {
				const db = this.getDatabase();
				if (this.config.path) {
					await saveDatabaseToFile(db, this.config.path);
				}
			} catch (error) {
				console.error("Failed to save database:", error);
				throw error;
			} finally {
				this.savePromise = null;
			}
		})();

		return this.savePromise;
	}

	/**
	 * Create a backup of the database
	 */
	async createBackup(backupPath?: string): Promise<void> {
		const db = this.getDatabase();
		const path = backupPath || this.config.path;

		if (!path) {
			throw new DatabaseError(
				"No path specified for backup",
				"createBackup"
			);
		}

		await backupDatabase(db, path);
	}

	/**
	 * Close the database connection and cleanup resources
	 */
	async close(): Promise<void> {
		try {
			// Clear auto-save timer
			if (this.autoSaveTimer) {
				clearInterval(this.autoSaveTimer);
				this.autoSaveTimer = null;
			}

			// Wait for any pending save operations
			if (this.savePromise) {
				await this.savePromise;
			}

			// Save final state if file-based
			if (this.config.path && !this.config.inMemory && this.database) {
				await this.saveToDisk();
			}

			// Close database
			if (this.database) {
				this.database.close();
				this.database = null;
			}

			this.isInitialized = false;
			this.transactionStack = [];
			console.log("Database connection closed successfully");
		} catch (error) {
			console.error("Error during database closure:", error);
			throw new DatabaseError(
				"Failed to close database properly",
				"close",
				error instanceof Error ? error : new Error(String(error))
			);
		}
	}

	/**
	 * Reset the instance (useful for testing)
	 */
	static reset(): void {
		if (DatabaseManager.instance?.database) {
			DatabaseManager.instance.database.close();
		}
		DatabaseManager.instance = null;
	}

	/**
	 * Run migrations with retry logic
	 */
	private async runMigrationsWithRetry(): Promise<void> {
		try {
			// Use this.database directly since it's already created but not marked as initialized yet
			if (!this.database) {
				throw new DatabaseError(
					"Database instance not available for migrations",
					"runMigrationsWithRetry"
				);
			}
			runMigrations(this.database);
		} catch (error) {
			if (this.retryCount < (this.config.maxRetries || 3)) {
				this.retryCount++;
				console.log(`Retrying migrations (attempt ${this.retryCount})`);
				await new Promise((resolve) => setTimeout(resolve, 1000));
				return this.runMigrationsWithRetry();
			}
			throw error;
		}
	}

	/**
	 * Setup auto-save timer
	 */
	private setupAutoSave(): void {
		if (this.autoSaveTimer) {
			clearInterval(this.autoSaveTimer);
		}

		const interval = this.config.autoSaveInterval;
		if (!interval) {
			return;
		}

		this.autoSaveTimer = setInterval(() => {
			this.debouncedSave().catch((error) => {
				console.error("Auto-save failed:", error);
			});
		}, interval);

		console.log(`Auto-save enabled with interval: ${interval}ms`);
	}

	/**
	 * Debounced save to avoid too frequent saves
	 */
	private async debouncedSave(): Promise<void> {
		if (!this.savePromise) {
			await this.saveToDisk();
		}
	}
}

// Export convenience functions
export const databaseManager = DatabaseManager.getInstance();

/**
 * Initialize the database with enhanced configuration
 */
export async function initializeDatabase(
	config: DatabaseManagerConfig = {}
): Promise<Database> {
	return databaseManager.initialize(config);
}

/**
 * Get the database instance (use this in your repositories)
 */
export function getDatabase(): Database {
	return databaseManager.getDatabase();
}

/**
 * Execute a transaction with automatic rollback on error
 */
export async function transaction<T>(
	callback: TransactionCallback<T>
): Promise<T> {
	return databaseManager.transaction(callback);
}

/**
 * Execute a query and return results
 */
export function query(sql: string, params?: BindParams): QueryResult[] {
	return databaseManager.query(sql, params);
}

/**
 * Execute a prepared statement
 */
export function execute(sql: string, params?: BindParams): QueryResult[] {
	return databaseManager.execute(sql, params);
}

/**
 * Run a simple SQL statement
 */
export function run(sql: string): void {
	databaseManager.run(sql);
}

/**
 * Check if database is ready
 */
export function isDatabaseReady(): boolean {
	return databaseManager.isReady();
}

/**
 * Save database to disk
 */
export async function saveDatabaseToDisk(): Promise<void> {
	return databaseManager.saveToDisk();
}

/**
 * Create a backup of the database
 */
export async function createBackup(backupPath?: string): Promise<void> {
	return databaseManager.createBackup(backupPath);
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
	return databaseManager.close();
}
