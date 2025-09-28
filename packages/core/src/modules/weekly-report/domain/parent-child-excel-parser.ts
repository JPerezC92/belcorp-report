import type { ParentChildRelationship } from "./parent-child-relationship.js";

export interface ParentChildRelationshipExcelSheet {
	name: string;
	headers: string[];
	rows: ParentChildRelationship[];
}

export interface ParentChildRelationshipExcelParseResult {
	success: boolean;
	fileName: string;
	sheet: ParentChildRelationshipExcelSheet | null;
	error?: string;
	warnings?: string[];
}

export interface ParentChildRelationshipExcelParser {
	parseExcel(
		fileBuffer: ArrayBuffer,
		fileName: string
	): Promise<ParentChildRelationshipExcelParseResult>;
}
