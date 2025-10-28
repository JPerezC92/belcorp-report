import {
	parseSBOperationalReleasesExcel,
	type SBReleasesParseResult,
	releaseDtosToDomain,
} from "@app/core";
import { ipcMain } from "electron";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { SqlJsSBOperationalReleasesRepository } from "../repositories/SqlJsSBOperationalReleasesRepository.js";

/**
 * Module to handle SB Operational Stability operations via IPC
 * Currently handles Releases data (Phase 1)
 * Future: Will add Daily Metrics and Weekly Summary handlers
 */
export class SBOperationalStabilityModule implements AppModule {
	async enable(_context: ModuleContext): Promise<void> {
		// IPC handler for loading SB operational stability data
		ipcMain.handle(
			"loadSBOperationalStabilityData",
			async (_event, buffer: ArrayBuffer, filename: string) => {
				try {
					console.log(
						`SBOperationalStabilityModule: Loading data from ${filename}`,
					);

					const releasesRepository =
						new SqlJsSBOperationalReleasesRepository();

					// Delete all existing releases before importing new data
			console.log(
				"SBOperationalStabilityModule: Deleting all existing releases before import",
			);
			await releasesRepository.deleteAll();

			// Parse Sheet 3 (Releases) only for Phase 1
					const parseResult: SBReleasesParseResult =
						await parseSBOperationalReleasesExcel(buffer);

					if (!parseResult.success) {
						console.error(
							"SBOperationalStabilityModule: Failed to parse releases",
							parseResult.errors,
						);
						return {
							success: false,
							error:
								parseResult.errors.length > 0
									? parseResult.errors[0].message
									: "Failed to parse releases data",
							parseErrors: parseResult.errors,
						};
					}

					// Convert DTOs to domain entities
					const releases = releaseDtosToDomain(parseResult.releases);

					// Save to database
					await releasesRepository.saveMany(releases);

					console.log(
						`SBOperationalStabilityModule: Successfully saved ${releases.length} releases`,
					);

					return {
						success: true,
						releasesCount: releases.length,
						warnings: parseResult.warnings,
						errors: parseResult.errors,
					};
				} catch (error) {
					console.error(
						"SBOperationalStabilityModule: Error loading data:",
						error,
					);
					return {
						success: false,
						error:
							error instanceof Error ? error.message : String(error),
					};
				}
			},
		);

		// IPC handler for getting all releases
		ipcMain.handle("getSBOperationalReleases", async (_event, options?: {
			startDate?: string;
			endDate?: string;
			application?: string;
		}) => {
			try {
				const repository = new SqlJsSBOperationalReleasesRepository();
				let releases;

				if (options?.startDate && options?.endDate) {
					releases = repository.findByDateRange(
						options.startDate,
						options.endDate,
					);
				} else if (options?.application) {
					releases = repository.findByApplication(options.application);
				} else {
					releases = repository.findAll();
				}

				return {
					success: true,
					data: releases.map((r) => r.toObject()),
				};
			} catch (error) {
				console.error(
					"SBOperationalStabilityModule: Error getting releases:",
					error,
				);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		});

		// IPC handler for dropping all SB operational stability data
		ipcMain.handle("dropSBOperationalStabilityData", async () => {
			try {
				const releasesRepository =
					new SqlJsSBOperationalReleasesRepository();
				await releasesRepository.deleteAll();

				return {
					success: true,
				};
			} catch (error) {
				console.error(
					"SBOperationalStabilityModule: Error dropping data:",
					error,
				);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		});

		console.log(
			"SBOperationalStabilityModule: IPC handlers registered",
		);
	}

	async disable(): Promise<void> {
		// Remove IPC handlers
		ipcMain.removeHandler("loadSBOperationalStabilityData");
		ipcMain.removeHandler("getSBOperationalReleases");
		ipcMain.removeHandler("dropSBOperationalStabilityData");

		console.log(
			"SBOperationalStabilityModule: IPC handlers removed",
		);
	}
}

export function createSBOperationalStabilityModule(): SBOperationalStabilityModule {
	return new SBOperationalStabilityModule();
}
