import type { WarRoomRecord } from "./war-room-record.js";

export interface WarRoomExcelSheet {
	name: string;
	headers: string[];
	rows: WarRoomRecord[];
}

export interface WarRoomExcelParseResult {
	success: boolean;
	fileName: string;
	sheet: WarRoomExcelSheet | null;
	error?: string;
	warnings?: string[];
}

export interface WarRoomExcelParser {
	parseExcel(
		fileBuffer: ArrayBuffer,
		fileName: string
	): Promise<WarRoomExcelParseResult>;
}
