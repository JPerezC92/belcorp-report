import path from "path";
import {
	databaseManager,
	TABLE_NAMES,
} from "./packages/database/dist/index.js";

const dbPath = path.join(
	process.env.APPDATA || process.env.HOME || ".",
	"root",
	"app-database.db",
);
console.log("Database path:", dbPath);

try {
	const db = databaseManager.getDatabase();

	// Check corrective maintenance records
	const records = db.exec(
		"SELECT id, subject, translated_subject FROM corrective_maintenance_records LIMIT 5",
	);
	console.log("First 5 corrective maintenance records:");
	if (records.length > 0 && records[0].values) {
		records[0].values.forEach((row, i) => {
			console.log(`Record ${i + 1}:`);
			console.log("  ID:", row[0]);
			console.log("  Subject:", row[1]);
			console.log("  Translated:", row[2]);
			console.log("---");
		});
	} else {
		console.log("No records found");
	}
} catch (error) {
	console.error("Error:", error);
}
