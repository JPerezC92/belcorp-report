import { app } from "electron";
import { createModuleRunner } from "./src/ModuleRunner.js";
import { createDatabaseModule } from "./src/modules/DatabaseModule.js";
import { createWeeklyReportModule } from "./src/modules/WeeklyReportModule.js";

// Test the failing IPC call
async function testFailingQuery() {
	console.log("Testing the failing query...");

	try {
		// Initialize modules
		const moduleRunner = createModuleRunner()
			.init(createDatabaseModule())
			.init(createWeeklyReportModule());

		// Wait for app to be ready
		await new Promise((resolve) => {
			if (app.isReady()) {
				resolve(void 0);
			} else {
				app.once("ready", resolve);
			}
		});

		await moduleRunner.enable();

		console.log("Modules initialized, calling IPC handler...");

		// Call the failing IPC handler
		const result = await global.ipcMain.emit(
			"weekly-report:getCorrectiveMaintenanceRecordsByFilters",
			null,
			"SB",
			"In Testing",
		);

		console.log("Result:", result);
	} catch (error) {
		console.error("Test failed:", error);
	}
}

testFailingQuery();
