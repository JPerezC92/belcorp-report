import { ForTaggingDataExcelService } from "@app/core";
import { ipcMain } from "electron";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { SqlJsForTaggingDataRepository } from "../repositories/SqlJsForTaggingDataRepository.js";

export class ForTaggingDataExcelModule implements AppModule {
	async enable(_context: ModuleContext): Promise<void> {
		ipcMain.handle(
			"for-tagging-data:parseExcel",
			async (_event, fileBuffer: ArrayBuffer, fileName: string) => {
				const repository = new SqlJsForTaggingDataRepository();
				const service = new ForTaggingDataExcelService({ repository });
				const result = await service.parseExcel({
					fileBuffer,
					fileName,
				});
				return result;
			}
		);

		ipcMain.handle(
			"for-tagging-data:parseAndSaveExcel",
			async (_event, fileBuffer: ArrayBuffer, fileName: string) => {
				const repository = new SqlJsForTaggingDataRepository();
				const service = new ForTaggingDataExcelService({ repository });
				const result = await service.parseAndSaveExcel({
					fileBuffer,
					fileName,
				});
				return result;
			}
		);

		ipcMain.handle("for-tagging-data:getAll", async () => {
			try {
				console.log("IPC Handler: Fetching all for tagging data...");

				const repository = new SqlJsForTaggingDataRepository();
				const data = await repository.getAll();
				console.log(
					`IPC Handler: Found ${data.length} for tagging data records`
				);

				return data;
			} catch (error) {
				console.error("Error fetching for tagging data:", error);
				throw error;
			}
		});
	}
}

export function createForTaggingDataExcelModule(): ForTaggingDataExcelModule {
	return new ForTaggingDataExcelModule();
}
