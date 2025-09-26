import {
	ForTaggingDataEnrichmentService,
	ForTaggingDataExcelService,
} from "@app/core";
import { ipcMain } from "electron";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { SqlJsForTaggingDataRepository } from "../repositories/SqlJsForTaggingDataRepository.js";
import { SqlJsTagRepository } from "../repositories/SqlJsTagRepository.js";

export class ForTaggingDataExcelModule implements AppModule {
	async enable(_context: ModuleContext): Promise<void> {
		ipcMain.handle(
			"for-tagging-data:parseExcel",
			async (_event, fileBuffer: ArrayBuffer, fileName: string) => {
				try {
					const repository = new SqlJsForTaggingDataRepository();
					const service = new ForTaggingDataExcelService({
						repository,
					});
					const result = await service.parseExcel({
						fileBuffer,
						fileName,
					});
					return result;
				} catch (error) {
					console.error("Error parsing Excel file:", error);
					throw error;
				}
			}
		);

		ipcMain.handle(
			"for-tagging-data:parseAndSaveExcel",
			async (_event, fileBuffer: ArrayBuffer, fileName: string) => {
				try {
					const repository = new SqlJsForTaggingDataRepository();
					const service = new ForTaggingDataExcelService({
						repository,
					});
					const result = await service.parseAndSaveExcel({
						fileBuffer,
						fileName,
					});
					return result;
				} catch (error) {
					console.error(
						"Error parsing and saving Excel file:",
						error
					);
					throw error;
				}
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

		ipcMain.handle("for-tagging-data:getEnriched", async () => {
			try {
				console.log(
					"IPC Handler: Fetching and enriching for tagging data..."
				);

				const forTaggingRepository =
					new SqlJsForTaggingDataRepository();
				const tagRepository = new SqlJsTagRepository();
				const enrichmentService = new ForTaggingDataEnrichmentService({
					tagRepository,
				});

				const data = await forTaggingRepository.getAll();
				const enrichmentResult = await enrichmentService.enrich(data);

				console.log(
					`IPC Handler: Enriched ${enrichmentResult.enrichedData.length} for tagging data records`
				);
				console.log(
					`IPC Handler: Created mapping for ${enrichmentResult.additionalInfoToRequestIds.size} additional info items`
				);

				return enrichmentResult;
			} catch (error) {
				console.error(
					"Error fetching enriched for tagging data:",
					error
				);
				throw error;
			}
		});
	}
}

export function createForTaggingDataExcelModule(): ForTaggingDataExcelModule {
	return new ForTaggingDataExcelModule();
}
