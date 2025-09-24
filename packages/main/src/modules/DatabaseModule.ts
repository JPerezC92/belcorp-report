import {
	closeDatabase,
	type DatabaseManagerConfig,
	initializeDatabase,
	isDatabaseReady,
} from "@app/database";
import { app } from "electron";
import type { Database } from "sql.js";
import type { AppModule } from "src/AppModule.js";
import type { ModuleContext } from "src/ModuleContext.js";

/**
 * Enhanced database initialization module using DatabaseManager
 * Provides better error handling, transactions, and persistence
 */
export class DatabaseModule implements AppModule {
	private isInitialized = false;
	private database: Database | null = null;
	private userDataPath = app.getPath("userData");
	private dbPath = `${this.userDataPath}/app-database.db`;

	async enable(_context: ModuleContext): Promise<void> {
		console.log(
			"Enabling DatabaseModule with enhanced DatabaseManager...",
			this.dbPath
		);

		if (this.isInitialized) {
			console.log("Database already initialized");
			return;
		}

		try {
			// Enhanced database configuration
			const config: DatabaseManagerConfig = {
				path: this.dbPath,
				inMemory: false,
				autoSave: true,
				autoSaveInterval: 30000, // 30 seconds
				maxRetries: 3,
				backupOnMigration: true,
				enableTransactions: true,
				journalMode: "WAL",
				synchronous: "NORMAL",
				autoVacuum: true,
			};

			// Initialize database with enhanced manager
			this.database = await initializeDatabase(config);

			// Expose database instance globally for other modules (temporary solution)
			// TODO: Replace with proper dependency injection
			(globalThis as Record<string, unknown>).__database_instance =
				this.database;

			this.isInitialized = true;

			console.log(
				`Enhanced DatabaseManager initialized successfully at: ${this.dbPath}`
			);
			console.log(
				"Features enabled: transactions, auto-save, backups, migrations"
			);
		} catch (error) {
			console.error("Failed to initialize enhanced database:", error);
			throw error;
		}
	}

	/**
	 * Get the database instance
	 */
	getDatabase(): Database | null {
		return this.database;
	}

	/**
	 * Check if database is ready
	 */
	isReady(): boolean {
		return this.isInitialized && isDatabaseReady();
	}

	/**
	 * Gracefully close the database
	 */
	async disable(): Promise<void> {
		if (this.isInitialized) {
			console.log("Closing database connection...");
			try {
				await closeDatabase();
				this.database = null;
				this.isInitialized = false;
				console.log("Database closed successfully");
			} catch (error) {
				console.error("Error closing database:", error);
			}
		}
	}
}

/**
 * Factory function to create enhanced database module
 */
export function createDatabaseModule(): DatabaseModule {
	return new DatabaseModule();
}
