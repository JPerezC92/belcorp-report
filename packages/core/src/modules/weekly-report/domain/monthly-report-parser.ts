import type { MonthlyReportRecord } from "./monthly-report-record.js";
import type { DateRangeConfig } from "./date-range-config.js";

export interface MonthlyReportExcelSheet {
	name: string;
	headers: string[];
	rows: Record<string, unknown>[];
}

export interface MonthlyReportExcelParseResult {
	success: boolean;
	fileName: string;
	sheet?: MonthlyReportExcelSheet;
	records?: MonthlyReportRecord[];
	errors?: Array<{ row: number; field: string; message: string }>;
	warnings?: string[];
}

export interface MonthlyReportExcelParser {
	parseExcel(
		fileBuffer: ArrayBuffer,
		fileName: string,
		dateRangeConfig?: DateRangeConfig | null
	): Promise<MonthlyReportExcelParseResult>;
}