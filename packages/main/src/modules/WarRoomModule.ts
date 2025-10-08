import {
	type WarRoomExcelParseResult,
	WarRoomExcelParserImpl,
} from "@app/core";
import { ipcMain } from "electron";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { SqlJsWarRoomRecordRepository } from "../repositories/SqlJsWarRoomRecordRepository.js";

/**
 * Module to handle war room operations via IPC
 */
export class WarRoomModule implements AppModule {
	async enable(_context: ModuleContext): Promise<void> {
		// IPC handler for loading war room data
		ipcMain.handle(
			"loadWarRoomData",
			async (_event, buffer: ArrayBuffer, filename: string) => {
				try {
					console.log(`WarRoomModule: Loading war room data from ${filename}`);

					const repository = new SqlJsWarRoomRecordRepository();
					const parser = new WarRoomExcelParserImpl();

					// Parse Excel file
					const parseResult: WarRoomExcelParseResult = await parser.parseExcel(
						buffer,
						filename
					);

					if (!parseResult.success || !parseResult.sheet) {
						console.error("WarRoomModule: Failed to parse Excel file", parseResult.error);
						return {
							success: false,
							error: parseResult.error || "Failed to parse Excel file",
						};
					}

					const records = parseResult.sheet.rows;

					// Save to database
					await repository.saveBatch(records);

					console.log(`WarRoomModule: Successfully saved ${records.length} war room records`);

					return {
						success: true,
						recordCount: records.length,
						warnings: parseResult.warnings,
					};
				} catch (error) {
					console.error("WarRoomModule: Error loading war room data:", error);
					return {
						success: false,
						error: error instanceof Error ? error.message : String(error),
					};
				}
			}
		);

		// IPC handler for getting all war room records
		ipcMain.handle("getWarRoomRecords", async () => {
			try {
				const repository = new SqlJsWarRoomRecordRepository();
				const records = await repository.getAll();

				return {
					success: true,
					data: records,
				};
			} catch (error) {
				console.error("WarRoomModule: Error getting war room records:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		});

		// IPC handler for getting distinct applications
		ipcMain.handle("getWarRoomApplications", async () => {
			try {
				const repository = new SqlJsWarRoomRecordRepository();
				const applications = await repository.getDistinctApplications();

				return {
					success: true,
					data: applications,
				};
			} catch (error) {
				console.error("WarRoomModule: Error getting applications:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		});

		// IPC handler for dropping war room data
		ipcMain.handle("dropWarRoomData", async () => {
			try {
				const repository = new SqlJsWarRoomRecordRepository();
				await repository.drop();

				return {
					success: true,
				};
			} catch (error) {
				console.error("WarRoomModule: Error dropping war room data:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		});

		console.log("WarRoomModule: IPC handlers registered");
	}

	async disable(): Promise<void> {
		// Remove IPC handlers
		ipcMain.removeHandler("loadWarRoomData");
		ipcMain.removeHandler("getWarRoomRecords");
		ipcMain.removeHandler("getWarRoomApplications");
		ipcMain.removeHandler("dropWarRoomData");

		console.log("WarRoomModule: IPC handlers removed");
	}
}

export function createWarRoomModule(): WarRoomModule {
	return new WarRoomModule();
}
