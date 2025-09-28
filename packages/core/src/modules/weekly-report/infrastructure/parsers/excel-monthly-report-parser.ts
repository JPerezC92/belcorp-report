import type {
	MonthlyReportExcelParseResult,
	MonthlyReportExcelParser,
	MonthlyReportExcelSheet,
} from "@core/modules/weekly-report/domain/monthly-report-parser.js";
import type { MonthlyReportRecord } from "@core/modules/weekly-report/domain/monthly-report-record.js";
import { excelMonthlyReportDtoToDomain } from "@core/modules/weekly-report/infrastructure/adapters/excel-monthly-report-dto-to-domain.adapter.js";
import {
	excelMonthlyReportSchema,
	type ExcelMonthlyReportWithLinks,
} from "@core/modules/weekly-report/infrastructure/dtos/excel-monthly-report.dto.js";
import {
	extractCellValueAndLink,
	extractHeaderValue,
} from "@core/modules/weekly-report/infrastructure/utils/excel-parsing.utils.js";
import ExcelJS from "exceljs";

export class ExcelMonthlyReportParserImpl implements MonthlyReportExcelParser {
	private readonly targetSheetName = "ManageEngine Report Framework";

	// Expected Spanish headers in order (columns B through Z, 25 total)
	private readonly expectedHeaders = [
		"Aplicativos",
		"Categorización",
		"Request ID",
		"Created Time",
		"Request Status",
		"Modulo.",
		"Subject",
		"Priority",
		"ETA",
		"Información Adicional",
		"Resolved Time",
		"Países Afectados",
		"Recurrencia",
		"Technician",
		"Jira",
		"Problem ID",
		"Linked Request Id",
		"Request OLA Status",
		"Grupo Escalamiento",
		"Aplicactivos Afectados",
		"¿Este Incidente se debió Resolver en Nivel 1?",
		"Campaña",
		"CUV_1",
		"Release",
		"RCA",
	];

	async parseExcel(
		fileBuffer: ArrayBuffer,
		fileName: string
	): Promise<MonthlyReportExcelParseResult> {
		try {
			const workbook = new ExcelJS.Workbook();
			await workbook.xlsx.load(fileBuffer);

			const worksheet = workbook.worksheets.find(
				(s) => s.name === this.targetSheetName
			);

			if (!worksheet) {
				throw new Error(
					`Sheet named "${this.targetSheetName}" not found in workbook`
				);
			}

			const headers = this.extractHeaders(worksheet);
			const warnings: string[] = [];
			const rows = this.extractRows(worksheet, headers, warnings);

			const sheet: MonthlyReportExcelSheet = {
				name: worksheet.name,
				headers,
				rows,
			};

			// Convert rows to domain records
			const records: MonthlyReportRecord[] = [];
			const errors: Array<{ row: number; field: string; message: string }> = [];

			for (let i = 0; i < rows.length; i++) {
				const rowNum = i + 2; // Excel rows start at 1, plus header
				try {
					const rowData = rows[i];
					if (rowData) {
						const record = excelMonthlyReportDtoToDomain(
							rowData as unknown as ExcelMonthlyReportWithLinks
						);
						records.push(record);
					}
				} catch (error) {
					errors.push({
						row: rowNum,
						field: "general",
						message: error instanceof Error ? error.message : String(error),
					});
				}
			}

			if (errors.length > 0) {
				const result: MonthlyReportExcelParseResult = {
					success: false,
					fileName,
					sheet,
					errors,
				};
				if (warnings.length > 0) {
					result.warnings = warnings;
				}
				return result;
			}

			const result: MonthlyReportExcelParseResult = {
				success: true,
				fileName,
				sheet,
				records,
			};
			if (warnings.length > 0) {
				result.warnings = warnings;
			}
			return result;
		} catch (error) {
			return {
				success: false,
				fileName,
				errors: [
					{
						row: 0,
						field: "file",
						message: error instanceof Error ? error.message : String(error),
					},
				],
			};
		}
	}

	private extractHeaders(worksheet: ExcelJS.Worksheet): string[] {
		const headerRow = worksheet.getRow(1);
		const headers: string[] = [];

		// Start from column B (index 2), go through Z (25 columns total)
		for (let colIndex = 2; colIndex <= 26; colIndex++) {
			const cell = headerRow.getCell(colIndex);
			const columnLetter = String.fromCharCode(64 + colIndex); // B, C, D...
			const headerValue = extractHeaderValue(cell, columnLetter);
			headers.push(headerValue);
		}

		return headers;
	}

	private extractRows(
		worksheet: ExcelJS.Worksheet,
		headers: string[],
		warnings: string[]
	): Record<string, unknown>[] {
		const rows: Record<string, unknown>[] = [];
		const linkColumns = ["Request ID", "Subject", "Problem ID", "Linked Request Id"];

		// Process data rows (starting from row 2)
		for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
			const row = worksheet.getRow(rowIndex);

			// Check if row is empty
			let hasData = false;
			for (let colIndex = 2; colIndex <= 26; colIndex++) {
				const cell = row.getCell(colIndex);
				if (cell.value !== null && cell.value !== undefined) {
					hasData = true;
					break;
				}
			}

			if (!hasData) {
				continue;
			}

			const rowData: Record<string, unknown> = {};

			// Extract data for each column
			for (let colIndex = 2; colIndex <= 26; colIndex++) {
				const headerIndex = colIndex - 2; // Adjust for starting at B
				const header = headers[headerIndex];
				if (!header) continue;

				const cell = row.getCell(colIndex);

				// Extract value and link if applicable
				const { value, link } = extractCellValueAndLink(cell);

				// Store the value
				rowData[header] = value || null;

				// Store link separately if it's a link column
				if (linkColumns.includes(header) && link) {
					rowData[`${header} Link`] = link;
				}
			}

			// Validate the row data
			try {
				excelMonthlyReportSchema.parse(rowData);
				rows.push(rowData);
			} catch (error) {
				warnings.push(
					`Row ${rowIndex}: Validation warning - ${
						error instanceof Error ? error.message : String(error)
					}`
				);
				// Still add the row even if validation fails (partial data)
				rows.push(rowData);
			}
		}

		console.log(`[MonthlyReportParser] Extracted ${rows.length} data rows`);
		return rows;
	}
}