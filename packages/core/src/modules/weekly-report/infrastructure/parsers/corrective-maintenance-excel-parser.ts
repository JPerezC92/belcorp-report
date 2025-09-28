import type {
	CorrectiveMaintenanceExcelParseResult,
	CorrectiveMaintenanceExcelParser,
	CorrectiveMaintenanceExcelSheet,
} from "@core/modules/weekly-report/domain/corrective-maintenance-excel-parser.js";
import type { CorrectiveMaintenanceRecord } from "@core/modules/weekly-report/domain/corrective-maintenance-record.js";
import { correctiveMaintenanceDtoToDomain } from "@core/modules/weekly-report/infrastructure/adapters/correctiveMaintenanceDtoToDomain.adapter.js";
import { correctiveMaintenanceExcelSchema } from "@core/modules/weekly-report/infrastructure/dtos/corrective-maintenance-excel.dto.js";
import {
	extractCellValueAndLink,
	extractHeaderValue,
	isLinkColumn,
	validateHeaders,
} from "@core/modules/weekly-report/infrastructure/utils/excel-parsing.utils.js";
import ExcelJS from "exceljs";

export class CorrectiveMaintenanceExcelParserImpl
	implements CorrectiveMaintenanceExcelParser
{
	private readonly targetSheetName = "ManageEngine Report Framework";
	private columnLetters: string[] = [
		"B",
		"C",
		"D",
		"E",
		"F",
		"G",
		"H",
		"I",
		"J",
		"K",
	];

	private readonly headerLabels = {
		requestId: "Request ID",
		createdTime: "Created Time",
		applications: "Aplicativos",
		categorization: "Categorización",
		requestStatus: "Request Status",
		module: "Modulo.",
		subject: "Subject",
		priority: "Priority",
		eta: "ETA",
		rca: "RCA",
	} as const;

	headerOrder = [
		this.headerLabels.applications,
		this.headerLabels.categorization,
		this.headerLabels.requestId,
		this.headerLabels.createdTime,
		this.headerLabels.requestStatus,
		this.headerLabels.module,
		this.headerLabels.subject,
		this.headerLabels.priority,
		this.headerLabels.eta,
		this.headerLabels.rca,
	];

	private isLinkColumn(header: string): boolean {
		const linkHeaders = [
			this.headerLabels.requestId,
			this.headerLabels.subject,
		] as const;

		return isLinkColumn(header, linkHeaders);
	}

	async parseExcel(
		fileBuffer: ArrayBuffer,
		fileName: string
	): Promise<CorrectiveMaintenanceExcelParseResult> {
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

			const sheet: CorrectiveMaintenanceExcelSheet = {
				name: worksheet.name,
				headers,
				rows,
			};

			const result: CorrectiveMaintenanceExcelParseResult = {
				success: true,
				fileName,
				sheet,
			};

			if (warnings.length > 0) {
				result.warnings = warnings;
			}

			return result;
		} catch (error) {
			return {
				success: false,
				fileName,
				sheet: null,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	private extractHeaders(worksheet: ExcelJS.Worksheet): string[] {
		const headers: string[] = [];
		const headerRow = worksheet.getRow(1);

		this.columnLetters.forEach((colLetter) => {
			const cell = headerRow.getCell(colLetter);
			const headerValue = extractHeaderValue(cell, colLetter);
			headers.push(headerValue);
		});

		return headers;
	}

	private extractRows(
		worksheet: ExcelJS.Worksheet,
		headers: string[],
		warnings: string[]
	): CorrectiveMaintenanceRecord[] {
		const records: CorrectiveMaintenanceRecord[] = [];

		// Validate headers
		validateHeaders(headers, this.headerOrder, this.headerOrder.length);

		// Process data rows (starting from row 2)
		for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
			const row = worksheet.getRow(rowIndex);

			// Check if row has data
			const hasData = this.columnLetters.some((colLetter) => {
				const cell = row.getCell(colLetter);
				return cell.value !== null && cell.value !== undefined;
			});

			if (!hasData) continue;

			const rowData: Record<string, unknown> = {};

			this.columnLetters.forEach((colLetter, index) => {
				const header = headers[index];
				if (!header) return;

				const cell = row.getCell(colLetter);
				const { value: cellValue, link: cellLink } =
					extractCellValueAndLink(cell);

				rowData[header] = this.isLinkColumn(header)
					? {
							value: cellValue,
							link: cellLink,
					  }
					: cellValue;
			});

			// Validate and transform to domain
			const validationResult =
				correctiveMaintenanceExcelSchema.safeParse(rowData);
			if (validationResult.success) {
				const record = correctiveMaintenanceDtoToDomain(
					validationResult.data
				);
				if (record) {
					records.push(record);
				} else {
					// Record was skipped - add warning
					const requestIdValue = rowData["Request ID"];
					const requestId =
						typeof requestIdValue === "object" &&
						requestIdValue &&
						"value" in requestIdValue
							? String(requestIdValue.value)
							: `Row ${rowIndex}`;
					warnings.push(
						`Skipped record ${requestId}: Unable to determine business unit or missing required fields`
					);
				}
			} else {
				throw new Error(
					`Invalid data in row ${rowIndex}: ${validationResult.error.issues
						.map(
							(issue) =>
								`${issue.path.join(".")}: ${issue.message}`
						)
						.join(", ")}`
				);
			}
		}

		return records;
	}
}
