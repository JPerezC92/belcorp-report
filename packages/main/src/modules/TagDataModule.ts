import { createTagService, TagGrouper } from "@app/core";
import { ipcMain } from "electron";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { SqlJsTagRepository } from "../repositories/SqlJsTagRepository.js";

/**
 * Module to handle tag data operations via IPC
 * Uses clean architecture with service container pattern
 */
export class TagDataModule implements AppModule {
	async enable(_context: ModuleContext): Promise<void> {
		ipcMain.handle(
			"tag-data:parseReport",
			async (_event, fileBuffer: ArrayBuffer, fileName: string) => {
				const tagService = createTagService();

				const parseResult = await tagService.parseTagReport({
					fileBuffer,
					fileName,
					repository: new SqlJsTagRepository(),
				});
				return parseResult;
			}
		);

		// Register IPC handler for retrieving all tags
		ipcMain.handle("tag-data:getAll", async () => {
			try {
				console.log("IPC Handler: Fetching all tags...");

				// Create repository and service using dependency injection
				const tagRepository = new SqlJsTagRepository();
				const tagService = createTagService();

				const tags = await tagService.findAllTags(tagRepository);
				console.log(`IPC Handler: Found ${tags.length} tags`);

				// Convert domain entities to serializable format for IPC
				return tags;
			} catch (error) {
				console.error("Error fetching tags:", error);
				throw error;
			}
		});

		// Register IPC handler for getting grouped tags by linked request
		ipcMain.handle("tag-data:getGroupedByLinkedRequest", async () => {
			try {
				console.log("IPC Handler: Fetching grouped tags by linked request...");

				// Create repository and grouper service
				const tagRepository = new SqlJsTagRepository();
				const tagGrouper = new TagGrouper(tagRepository);

				const groupedResponse = await tagGrouper.groupByLinkedRequestId();
				console.log(`IPC Handler: Grouped ${groupedResponse.groupedData.length} linked requests`);

				return {
					success: true,
					data: groupedResponse,
				};
			} catch (error) {
				console.error("Error fetching grouped tags:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : "Unknown error occurred",
				};
			}
		});

		console.log("TagDataModule: IPC handlers registered");
	}
}

/**
 * Factory function to create tag data module
 */
export function createTagDataModule(): TagDataModule {
	return new TagDataModule();
}
