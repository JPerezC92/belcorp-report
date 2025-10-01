import {
	type CorrectiveMaintenanceExcelParseResult,
	CorrectiveMaintenanceExcelParserImpl,
	createWeeklyReportService,
	ParentChildExcelParser,
	type ParentChildRelationshipExcelParseResult,
} from "@app/core";
import { pipeline } from "@xenova/transformers";
import { ipcMain } from "electron";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { SqlJsCorrectiveMaintenanceRecordRepository } from "../repositories/SqlJsCorrectiveMaintenanceRecordRepository.js";
import { SqlJsParentChildRelationshipRepository } from "../repositories/SqlJsParentChildRelationshipRepository.js";
import { SqlJsSemanalDateRangeRepository } from "../repositories/SqlJsSemanalDateRangeRepository.js";
import { ServiceRegistry } from "../services/ServiceRegistry.js";

/**
 * Module to handle weekly report operations via IPC
 * Uses clean architecture with service container pattern
 */
export class WeeklyReportModule implements AppModule {
	private translator: ReturnType<typeof pipeline> | null = null;
	private translatorInitializing = false;

	constructor() {
		this.initializeTranslator();
	}

	async enable(_context: ModuleContext): Promise<void> {
		// IPC handlers for weekly report operations
		ipcMain.handle(
			"loadWeeklyReportData",
			async (_event, buffer: ArrayBuffer, filename: string) => {
				try {
					console.log(
						`WeeklyReportModule: Loading weekly report data from ${filename}`
					);

					const service = createWeeklyReportService();

					// Detect file type based on filename and parse accordingly
					let result:
						| CorrectiveMaintenanceExcelParseResult
						| ParentChildRelationshipExcelParseResult;
					if (
						filename.toLowerCase().includes("padre") ||
						filename.toLowerCase().includes("hijo")
					) {
						// Parent-child relationships file
						const parentChildRepo =
							new SqlJsParentChildRelationshipRepository();
						const parentChildParser = new ParentChildExcelParser();

						result = await service.parseParentChildExcel({
							fileBuffer: buffer,
							fileName: filename,
							repository: parentChildRepo,
							excelParser: parentChildParser,
						});
					} else if (
						filename.toLowerCase().includes("correctivo") ||
						filename.toLowerCase().includes("semanal")
					) {
						// Corrective maintenance file
						const correctiveRepo =
							new SqlJsCorrectiveMaintenanceRecordRepository();
						const correctiveParser =
							new CorrectiveMaintenanceExcelParserImpl(
								this.getBusinessUnitDetector()
							);
						const semanalRepo = new SqlJsSemanalDateRangeRepository();
						const semanalDateRange = await semanalRepo.getCurrent();

						result = await service.parseCorrectiveMaintenanceExcel({
							fileBuffer: buffer,
							fileName: filename,
							repository: correctiveRepo,
							excelParser: correctiveParser,
							semanalDateRange,
						});
					} else {
						// Unknown file type
						return {
							success: false,
							error: `Unknown file type for ${filename}. Expected 'padre hijo' or 'correctivo' in filename.`,
						};
					}

					if (result.success) {
						console.log(
							`WeeklyReportModule: Successfully loaded ${
								result.sheet?.rows?.length || 0
							} records from ${filename}`
						);
						if (result.warnings && result.warnings.length > 0) {
							console.warn(
								`WeeklyReportModule: Warnings during parsing:`,
								result.warnings
							);
						}
						return {
							success: true,
							data: result.sheet?.rows || [],
							warnings: result.warnings,
						};
					} else {
						console.error(
							"WeeklyReportModule: Failed to load weekly report data:",
							result.error
						);
						return { success: false, error: result.error };
					}
				} catch (error) {
					console.error(
						"WeeklyReportModule: Unexpected error loading weekly report data:",
						error
					);
					return {
						success: false,
						error:
							error instanceof Error
								? error.message
								: "Unknown error",
					};
				}
			}
		);

		ipcMain.handle(
			"weekly-report:translateAllSubjects",
			async (_event, subjects: string[]) => {
				try {
					console.log(
						`WeeklyReportModule: Translating ${subjects.length} subjects using OPUS model`
					);

					// Ensure translator is initialized
					await this.ensureTranslatorReady();

					const translatedSubjects: string[] = [];

					// Process subjects in batches to avoid memory issues
					const batchSize = 10;
					for (let i = 0; i < subjects.length; i += batchSize) {
						const batch = subjects.slice(i, i + batchSize);
						const batchPromises = batch.map((subject) =>
							this.translateSubject(subject)
						);
						const batchResults = await Promise.all(batchPromises);
						translatedSubjects.push(...batchResults);

						console.log(
							`WeeklyReportModule: Translated ${translatedSubjects.length}/${subjects.length} subjects`
						);
					}

					console.log(
						`WeeklyReportModule: Successfully translated ${translatedSubjects.length} subjects`
					);
					return { success: true, data: translatedSubjects };
				} catch (error) {
					console.error(
						"WeeklyReportModule: Unexpected error translating subjects:",
						error
					);
					return {
						success: false,
						error:
							error instanceof Error
								? error.message
								: "Unknown error",
					};
				}
			}
		);

		// Parent-child relationship operations
		ipcMain.handle(
			"weekly-report:parseParentChildExcel",
			async (_event, fileBuffer: ArrayBuffer, fileName: string) => {
				const weeklyReportService = createWeeklyReportService();

				const parseResult =
					await weeklyReportService.parseParentChildExcel({
						fileBuffer,
						fileName,
						repository:
							new SqlJsParentChildRelationshipRepository(),
						excelParser: new ParentChildExcelParser(),
					});
				return parseResult;
			}
		);

		ipcMain.handle("weekly-report:getAllRelationships", async () => {
			try {
				console.log(
					"WeeklyReportModule: Fetching all parent-child relationships..."
				);

				const repository = new SqlJsParentChildRelationshipRepository();
				const weeklyReportService = createWeeklyReportService();

				const relationships =
					await weeklyReportService.findAllRelationships(repository);
				console.log(
					`WeeklyReportModule: Found ${relationships.length} relationships`
				);

				return relationships;
			} catch (error) {
				console.error(
					"WeeklyReportModule: Error fetching relationships:",
					error
				);
				throw error;
			}
		});

		ipcMain.handle("weekly-report:getAggregatedRelationships", async () => {
			try {
				console.log(
					"WeeklyReportModule: Fetching aggregated parent-child relationships..."
				);

				const repository = new SqlJsParentChildRelationshipRepository();
				const weeklyReportService = createWeeklyReportService();

				const aggregatedRelationships =
					await weeklyReportService.getAggregatedRelationships(
						repository
					);
				console.log(
					`WeeklyReportModule: Found ${aggregatedRelationships.length} aggregated groups`
				);

				return aggregatedRelationships;
			} catch (error) {
				console.error(
					"WeeklyReportModule: Error fetching aggregated relationships:",
					error
				);
				throw error;
			}
		});

		// Corrective maintenance operations
		ipcMain.handle(
			"weekly-report:parseCorrectiveMaintenanceExcel",
			async (_event, fileBuffer: ArrayBuffer, fileName: string) => {
				const weeklyReportService = createWeeklyReportService();
				const semanalRepo = new SqlJsSemanalDateRangeRepository();
				const semanalDateRange = await semanalRepo.getCurrent();

				const parseResult =
					await weeklyReportService.parseCorrectiveMaintenanceExcel({
						fileBuffer,
						fileName,
						repository:
							new SqlJsCorrectiveMaintenanceRecordRepository(),
						excelParser: new CorrectiveMaintenanceExcelParserImpl(
							this.getBusinessUnitDetector()
						),
						semanalDateRange,
					});
				return parseResult;
			}
		);

		ipcMain.handle(
			"weekly-report:getAllCorrectiveMaintenanceRecords",
			async (_event, businessUnit?: string) => {
				try {
					console.log(
						`WeeklyReportModule: Fetching corrective maintenance records${
							businessUnit
								? ` for business unit: ${businessUnit}`
								: ""
						}...`
					);

					const repository =
						new SqlJsCorrectiveMaintenanceRecordRepository();
					const weeklyReportService = createWeeklyReportService();

					const records =
						await weeklyReportService.findAllCorrectiveMaintenanceRecords(
							repository,
							businessUnit
						);
					console.log(
						`WeeklyReportModule: Found ${records.length} corrective maintenance records`
					);

					return records;
				} catch (error) {
					console.error(
						"WeeklyReportModule: Error fetching corrective maintenance records:",
						error
					);
					throw error;
				}
			}
		);

		ipcMain.handle(
			"weekly-report:getCorrectiveMaintenanceRecordsByFilters",
			async (_event, businessUnit: string, requestStatus?: string) => {
				try {
					console.log(
						`WeeklyReportModule: Fetching corrective maintenance records for business unit: ${businessUnit}${
							requestStatus
								? ` and request status: ${requestStatus}`
								: ""
						}...`
					);

					const repository =
						new SqlJsCorrectiveMaintenanceRecordRepository();
					const weeklyReportService = createWeeklyReportService();

					console.log(
						`WeeklyReportModule: Calling findCorrectiveMaintenanceRecordsByFilters with businessUnit="${businessUnit}", requestStatus="${
							requestStatus || "undefined"
						}"`
					);

					// Log the SQL query that will be executed
					const whereClause = `WHERE cmr.businessUnit = ?${
						requestStatus ? " AND cmr.requestStatus = ?" : ""
					}`;
					const sqlQuery = `SELECT cmr.*, COALESCE((SELECT COUNT(*) FROM parent_child_relationships pcr WHERE pcr.childRequestId = cmr.requestId), 0) as enlaces_count FROM corrective_maintenance_records cmr ${whereClause} ORDER BY cmr.createdAt DESC`;
					console.log(`WeeklyReportModule: SQL Query: ${sqlQuery}`);
					console.log(
						`WeeklyReportModule: SQL Params: ["${businessUnit}"${
							requestStatus ? `, "${requestStatus}"` : ""
						}]`
					);

					const records =
						await weeklyReportService.findCorrectiveMaintenanceRecordsByFilters(
							repository,
							businessUnit,
							requestStatus
						);
					console.log(
						`WeeklyReportModule: Found ${records.length} filtered corrective maintenance records`
					);

					return records;
				} catch (error) {
					console.error(
						"WeeklyReportModule: Error fetching filtered corrective maintenance records:",
						error
					);
					throw error;
				}
			}
		);

		ipcMain.handle("weekly-report:getDistinctRequestStatuses", async () => {
			try {
				console.log(
					"WeeklyReportModule: Fetching distinct request status values..."
				);

				const repository =
					new SqlJsCorrectiveMaintenanceRecordRepository();
				const statuses = await repository.getDistinctRequestStatuses();
				console.log(
					`WeeklyReportModule: Found ${statuses.length} distinct request statuses:`,
					statuses
				);

				return statuses;
			} catch (error) {
				console.error(
					"WeeklyReportModule: Error fetching distinct request statuses:",
					error
				);
				throw error;
			}
		});

		// Single text translation
		ipcMain.handle(
			"weekly-report:translateText",
			async (_event, text: string) => {
				try {
					console.log(
						`WeeklyReportModule: Translating single text: "${text}"`
					);

					// Ensure translator is initialized
					await this.ensureTranslatorReady();

					const translated = await this.translateSubject(text);

					return {
						success: true,
						data: translated,
					};
				} catch (error) {
					console.error(
						"WeeklyReportModule: Error translating text:",
						error
					);
					return {
						success: false,
						error:
							error instanceof Error
								? error.message
								: "Unknown error",
					};
				}
			}
		);
	}

	async disable(): Promise<void> {
		// Clean up translator if needed
		this.translator = null;
	}

	/**
	 * Get business unit detector function from service registry
	 */
	private getBusinessUnitDetector() {
		const businessUnitService = ServiceRegistry.getBusinessUnitService();
		if (businessUnitService) {
			// Return bound method to maintain proper context
			return businessUnitService.detectBusinessUnit.bind(businessUnitService);
		}
		// Return undefined to fallback to hardcoded logic
		return undefined;
	}

	private async initializeTranslator(): Promise<void> {
		if (this.translator || this.translatorInitializing) {
			return;
		}

		this.translatorInitializing = true;

		try {
			console.log(
				"WeeklyReportModule: Initializing OPUS translation pipeline..."
			);
			this.translator = await pipeline(
				"translation",
				"Xenova/opus-mt-es-en"
			);
			console.log(
				"WeeklyReportModule: OPUS translation pipeline initialized successfully"
			);
		} catch (error) {
			console.error(
				"WeeklyReportModule: Failed to initialize OPUS translation pipeline:",
				error
			);
			this.translator = null;
		} finally {
			this.translatorInitializing = false;
		}
	}

	private async ensureTranslatorReady(): Promise<void> {
		if (this.translator) {
			return;
		}

		if (this.translatorInitializing) {
			// Wait for initialization to complete
			while (this.translatorInitializing) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			if (!this.translator) {
				throw new Error("Translator initialization failed");
			}

			return;
		}

		// Initialize if not already started
		await this.initializeTranslator();

		if (!this.translator) {
			throw new Error("Translator initialization failed");
		}
	}

	private async translateSubject(subject: string): Promise<string> {
		try {
			if (!this.translator) {
				console.warn(
					"WeeklyReportModule: Translator not initialized, returning original text"
				);
				return subject;
			}

			// Check if the text is already in English (simple heuristic)
			const isEnglish =
				/^[a-zA-Z\s.,!?;:'"()-]+$/.test(subject) &&
				!/[áéíóúüñ¿¡]/.test(subject.toLowerCase());

			if (isEnglish) {
				return subject;
			}

			// Translate using OPUS model
			const result = await this.translator(subject, {
				src_lang: "spa",
				tgt_lang: "eng",
			});

			let translated = result[0]?.translation_text || subject;

			// Preserve technical terms that shouldn't be translated
			const technicalTerms = [
				/\b\d{4,}\b/g, // Years like 2023
				/\b[A-Z]{2,}\b/g, // Acronyms like CPU, RAM
				/\b\d+\.\d+\.\d+\b/g, // Version numbers like 1.2.3
				/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, // IP addresses
			];

			for (const termRegex of technicalTerms) {
				const matches = subject.match(termRegex);
				if (matches) {
					for (const match of matches) {
						// Replace the translated version with the original if it was changed
						const translatedMatch = translated.match(termRegex);
						if (translatedMatch && translatedMatch[0] !== match) {
							translated = translated.replace(
								translatedMatch[0],
								match
							);
						}
					}
				}
			}

			return translated;
		} catch (error) {
			console.error(
				"WeeklyReportModule: Error translating subject:",
				error
			);
			return subject;
		}
	}
}

/**
 * Factory function to create weekly report module
 */
export function createWeeklyReportModule(): WeeklyReportModule {
	return new WeeklyReportModule();
}
