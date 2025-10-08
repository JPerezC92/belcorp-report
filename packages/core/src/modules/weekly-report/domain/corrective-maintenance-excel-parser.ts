import type { CorrectiveMaintenanceRecord } from "./corrective-maintenance-record.js";
import type { DateRangeConfig } from "./date-range-config.js";

export interface CorrectiveMaintenanceExcelSheet {
	name: string;
	headers: string[];
	rows: CorrectiveMaintenanceRecord[];
}

export interface CorrectiveMaintenanceExcelParseResult {
	success: boolean;
	fileName: string;
	sheet: CorrectiveMaintenanceExcelSheet | null;
	error?: string;
	warnings?: string[];
}

export interface CorrectiveMaintenanceExcelParser {
	parseExcel(
		fileBuffer: ArrayBuffer,
		fileName: string,
		dateRangeConfig?: DateRangeConfig | null
	): Promise<CorrectiveMaintenanceExcelParseResult>;
}
