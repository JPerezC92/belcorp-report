import type { Tag } from "./tag.js";

export interface TagReportSheet {
	name: string;
	headers: string[];
	headerOrder: string[];
	rows: Tag[];
}

export interface TagReportParseResult {
	success: boolean;
	fileName: string;
	sheet: TagReportSheet;
	metadata: {
		creator?: string;
		modified?: Date;
		totalSheets: number;
	};
	error?: string;
}

export interface TagReportParser {
	parseExcel(
		fileBuffer: ArrayBuffer,
		fileName: string
	): Promise<TagReportParseResult>;
}
