import type { MonthlyReportExcelParser } from "../domain/monthly-report-parser.js";
import type { MonthlyReportRepository } from "../domain/monthly-report-repository.js";
import type { DateRangeConfigRepository } from "../domain/date-range-config-repository.js";
import type { DateRangeSettingsRepository } from "../domain/date-range-settings-repository.js";

export interface ProcessMonthlyReportBatchResult {
	success: boolean;
	recordsProcessed?: number;
	errors?: Array<{ row: number; field: string; message: string }>;
	warnings?: string[];
}

export class ProcessMonthlyReportBatchCreator {
	constructor(
		private readonly parser: MonthlyReportExcelParser,
		private readonly repository: MonthlyReportRepository,
		private readonly dateRangeConfigRepository: DateRangeConfigRepository,
		private readonly dateRangeSettingsRepository: DateRangeSettingsRepository
	) {}

	async execute(
		fileBuffer: ArrayBuffer,
		fileName: string
	): Promise<ProcessMonthlyReportBatchResult> {
		try {
			console.log(`[ProcessMonthlyReportBatch] Processing file: ${fileName}`);

			// Check if global mode is enabled
			const settings = await this.dateRangeSettingsRepository.getSettings();

			// Use global scope if global mode enabled, otherwise use monthly scope
			const scope = settings.globalModeEnabled ? 'global' : 'monthly';
			const activeDateRange = await this.dateRangeConfigRepository.getByScope(scope);
			console.log(`[ProcessMonthlyReportBatch] Using date range (scope: ${scope}): ${activeDateRange?.getDisplayText() || 'default current week'}`);

			// Parse the Excel file with the date range
			const parseResult = await this.parser.parseExcel(fileBuffer, fileName, activeDateRange);

			if (!parseResult.success || !parseResult.records) {
				return {
					success: false,
					errors: parseResult.errors || [],
					warnings: parseResult.warnings || [],
				};
			}

			console.log(
				`[ProcessMonthlyReportBatch] Parsed ${parseResult.records.length} records`
			);

			// Clear existing records (fresh import)
			await this.repository.deleteAll();
			console.log("[ProcessMonthlyReportBatch] Cleared existing records");

			// Save the new records
			await this.repository.save(parseResult.records);
			console.log(
				`[ProcessMonthlyReportBatch] Saved ${parseResult.records.length} records to database`
			);

			return {
				success: true,
				recordsProcessed: parseResult.records.length,
				warnings: parseResult.warnings || [],
			};
		} catch (error) {
			console.error("[ProcessMonthlyReportBatch] Error:", error);
			return {
				success: false,
				errors: [
					{
						row: 0,
						field: "general",
						message: error instanceof Error ? error.message : String(error),
					},
				],
			};
		}
	}
}