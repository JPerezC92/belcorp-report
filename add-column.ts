import { execute, initializeDatabase, query } from "@app/database";

async function addBusinessUnitColumn() {
	console.log(
		"Adding businessUnit column to corrective_maintenance_records table..."
	);

	try {
		// Initialize database manager
		const db = await initializeDatabase({
			path: "C:\\Users\\dexm7\\AppData\\Roaming\\root\\app-database.db",
			autoSave: false, // Don't auto-save during migration
			enableTransactions: true,
			backupOnMigration: false, // Don't create backup for manual operation
		});

		// Check if column already exists
		const tableInfo = query(
			"PRAGMA table_info(corrective_maintenance_records)"
		);
		const hasBusinessUnit = tableInfo.some(
			(col) => (col as { name: string }).name === "businessUnit"
		);

		if (hasBusinessUnit) {
			console.log("businessUnit column already exists!");
			return;
		}

		// Add the column
		execute(`
      ALTER TABLE corrective_maintenance_records
      ADD COLUMN businessUnit TEXT NOT NULL DEFAULT 'Unknown'
    `);

		console.log("Successfully added businessUnit column!");

		// Update existing records with a default business unit
		// You might want to set this to something more meaningful based on your data
		execute(`
      UPDATE corrective_maintenance_records
      SET businessUnit = 'SB'
      WHERE businessUnit = 'Unknown'
    `);

		console.log("Updated existing records with default business unit");
	} catch (error) {
		console.error("Error adding businessUnit column:", error);
	}
}

addBusinessUnitColumn().catch(console.error);
