import type { MonthlyReportExcelParser } from "../domain/monthly-report-parser.js";
import type { MonthlyReportRepository } from "../domain/monthly-report-repository.js";
import type { SemanalDateRangeRepository } from "../domain/semanal-date-range-repository.js";

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
		private readonly semanalDateRangeRepository: SemanalDateRangeRepository
	) {}

	async execute(
		fileBuffer: ArrayBuffer,
		fileName: string
	): Promise<ProcessMonthlyReportBatchResult> {
		try {
			console.log(`[ProcessMonthlyReportBatch] Processing file: ${fileName}`);

			// Get the active semanal date range
			const activeDateRange = await this.semanalDateRangeRepository.getActive();
			console.log(`[ProcessMonthlyReportBatch] Using date range: ${activeDateRange?.getDisplayText() || 'default current week'}`);

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