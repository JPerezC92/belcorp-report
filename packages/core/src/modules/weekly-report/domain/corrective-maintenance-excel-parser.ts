import type { CorrectiveMaintenanceRecord } from "./corrective-maintenance-record.js";

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
		fileName: string
	): Promise<CorrectiveMaintenanceExcelParseResult>;
}
