import { app } from "electron";
import { promises as fs } from "fs";
import path from "path";
import type { Database, SqlJsStatic } from "sql.js";
import initSqlJs from "sql.js";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";

// Transaction utility class for reusable database transactions
export class TransactionManager {
	private db: Database;
	private isInTransaction = false;

	constructor(database: Database) {
		this.db = database;
	}

	/**
	 * Execute operations within a transaction
	 * @param operation - Function that performs database operations
	 * @param transactionType - Type of transaction (DEFERRED, IMMEDIATE, EXCLUSIVE)
	 * @returns Promise with the result of the operation
	 */
	async executeInTransaction<T>(
		operation: (db: Database) => T | Promise<T>,
		transactionType: "DEFERRED" | "IMMEDIATE" | "EXCLUSIVE" = "IMMEDIATE"
	): Promise<T> {
		if (this.isInTransaction) {
			// If already in a transaction, just execute the operation
			return await operation(this.db);
		}

		this.isInTransaction = true;

		try {
			// Begin transaction
			this.db.exec(`BEGIN ${transactionType} TRANSACTION`);
			console.log(`Started ${transactionType} transaction`);

			// Execute the operation
			const result = await operation(this.db);

			// Commit transaction
			this.db.exec("COMMIT");
			console.log("Transaction committed successfully");

			return result;
		} catch (error) {
			// Rollback on error
			try {
				this.db.exec("ROLLBACK");
				console.error("Transaction rolled back due to error:", error);
			} catch (rollbackError) {
				console.error("Error during rollback:", rollbackError);
			}
			throw error;
		} finally {
			this.isInTransaction = false;
		}
	}

	/**
	 * Get the current transaction status
	 */
	isTransactionActive(): boolean {
		return this.isInTransaction;
	}
}

export class SqlJsDatabaseModule implements AppModule {
	private SQL: SqlJsStatic | null = null;
	private db: Database | null = null;
	private dbPath: string = "";
	private transactionManager: TransactionManager | null = null;

	async enable(_context: ModuleContext): Promise<void> {
		try {
			// Create database file path in userData directory
			const userDataPath = app.getPath("userData");
			this.dbPath = path.join(userDataPath, "belcorp-reports.sqlite");

			console.log("Initializing SQL.js SQLite database at:", this.dbPath);

			// Initialize SQL.js
			this.SQL = await initSqlJs();

			// Load existing database or create new one
			await this.loadOrCreateDatabase();

			// Create tables
			this.createTables();

			// Initialize transaction manager
			if (this.db) {
				this.transactionManager = new TransactionManager(this.db);
			}

			// Test connection
			this.testConnection();

			// Log current database stats
			const stats = await this.getDatabaseStats();
			console.log(
				`Database initialized with ${stats.rows} rows (${stats.dbSize})`
			);

			console.log("SQL.js SQLite database initialized successfully");
		} catch (error) {
			console.error("Failed to initialize SQL.js database:", error);
			throw error;
		}
	}

	private async loadOrCreateDatabase(): Promise<void> {
		if (!this.SQL) throw new Error("SQL.js not initialized");

		try {
			// Try to read existing database file
			const data = await fs.readFile(this.dbPath);
			this.db = new this.SQL.Database(data);
			console.log("Loaded existing database from file");
		} catch {
			// File doesn't exist, create new database
			this.db = new this.SQL.Database();
			console.log("Created new database");
		}
	}

	private createTables(): void {
		if (!this.db) throw new Error("Database not initialized");

		// Drop existing tables if they exist (for clean migration)
		try {
			this.db.run("DROP TABLE IF EXISTS tag");
			this.db.run("DROP TABLE IF EXISTS tag_sheets");
			this.db.run("DROP TABLE IF EXISTS tag_reports");
		} catch (error) {
			console.warn("Error dropping old tables:", error);
		}

		// Create tag table (simplified - no foreign keys)
		this.db.run(`
      CREATE TABLE IF NOT EXISTS tag (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        createdTime TEXT,
        requestId TEXT,
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
		this.db.run(
			"CREATE INDEX IF NOT EXISTS idx_tag_createdTime ON tag(createdTime)"
		);
		this.db.run(
			"CREATE INDEX IF NOT EXISTS idx_tag_technician ON tag(technician)"
		);

		console.log("Database tables created successfully");
	}

	private testConnection(): void {
		if (!this.db) throw new Error("Database not initialized");

		// Test basic query
		const result = this.db.exec("SELECT 1 as test");
		if (result.length > 0 && result[0].values[0][0] === 1) {
			console.log("Database connection test passed");
		} else {
			throw new Error("Database connection test failed");
		}
	}

	// Save database to file
	private async saveToFile(): Promise<void> {
		if (!this.db) throw new Error("Database not initialized");

		const data = this.db.export();
		await fs.writeFile(this.dbPath, data);
		console.log(
			`Database saved to file: ${this.dbPath} (${data.length} bytes)`
		);
	}

	// Public methods for other modules to use

	// Query methods

	public async getDatabaseStats(): Promise<{
		rows: number;
		dbSize: string;
	}> {
		if (!this.db) throw new Error("Database not initialized");

		const rowsResult = this.db.exec("SELECT COUNT(*) as count FROM tag");

		// Get database file size
		let dbSize = "0 bytes";
		try {
			const stats = await fs.stat(this.dbPath);
			dbSize = `${(stats.size / 1024).toFixed(2)} KB`;
		} catch {
			dbSize = "unknown";
		}

		return {
			rows: (rowsResult[0]?.values[0][0] as number) || 0,
			dbSize,
		};
	}

	// Force save to file
	public async forceSave(): Promise<void> {
		await this.saveToFile();
	}

	// Get the TransactionManager for transaction operations
	public getTransactionManager(): TransactionManager {
		if (!this.transactionManager)
			throw new Error("Database not initialized");
		return this.transactionManager;
	}
}

// Global instance for access from other modules
let globalDatabaseInstance: SqlJsDatabaseModule | null = null;

// Factory function for creating the module
export function createSqlJsDatabaseModule(): SqlJsDatabaseModule {
	const instance = new SqlJsDatabaseModule();
	globalDatabaseInstance = instance;
	return instance;
}

// Function to get the current database instance
export function getDatabaseInstance(): SqlJsDatabaseModule | null {
	return globalDatabaseInstance;
}
