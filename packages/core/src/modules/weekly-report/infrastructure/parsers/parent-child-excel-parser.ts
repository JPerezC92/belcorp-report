import type {
	ParentChildRelationshipExcelParseResult,
	ParentChildRelationshipExcelParser,
	ParentChildRelationshipExcelSheet,
} from "@core/modules/weekly-report/domain/parent-child-excel-parser.js";
import type { ParentChildRelationship } from "@core/modules/weekly-report/domain/parent-child-relationship.js";
import { parentChildRelationshipDtoToDomain } from "@core/modules/weekly-report/infrastructure/adapters/parentChildRelationshipDtoToDomain.adapter.js";
import { parentChildRelationshipExcelSchema } from "@core/modules/weekly-report/infrastructure/dtos/parent-child-relationship-excel.dto.js";
import {
	cellValueSchema,
	cellWithLinkSchema,
} from "@core/shared/schemas/excel-cell-validation.schema.js";
import {
	isLinkColumn,
	validateHeaders,
} from "@core/modules/weekly-report/infrastructure/utils/excel-parsing.utils.js";
import ExcelJS from "exceljs";

export class ParentChildExcelParser
	implements ParentChildRelationshipExcelParser
{
	private readonly targetSheetName = "ManageEngine Report Framework";
	private columnLetters: string[] = ["B", "C"];

	private readonly headerLabels = {
		requestId: "Request ID",
		linkedRequestId: "Linked Request Id",
	} as const;

	headerOrder = [
		this.headerLabels.requestId,
		this.headerLabels.linkedRequestId,
	];

	private isLinkColumn(header: string): boolean {
		const linkHeaders = [
			this.headerLabels.requestId,
			this.headerLabels.linkedRequestId,
		] as const;

		return isLinkColumn(header, linkHeaders);
	}

	async parseExcel(
		fileBuffer: ArrayBuffer,
		fileName: string
	): Promise<ParentChildRelationshipExcelParseResult> {
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
			const rows = this.extractRows(worksheet, headers);

			const sheet: ParentChildRelationshipExcelSheet = {
				name: worksheet.name,
				headers,
				rows,
			};

			return {
				success: true,
				fileName,
				sheet,
			};
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
			const headerValue = cellValueSchema.parse(cell.value);
			headers.push(headerValue);
		});

		return headers;
	}

	private extractRows(
		worksheet: ExcelJS.Worksheet,
		headers: string[]
	): ParentChildRelationship[] {
		const relationships: ParentChildRelationship[] = [];

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
					cellWithLinkSchema.parse(cell.value);

				rowData[header] = this.isLinkColumn(header)
					? {
							value: cellValue,
							link: cellLink,
					  }
					: cellValue;
			});

			// Validate and transform to domain
			const validationResult =
				parentChildRelationshipExcelSchema.safeParse(rowData);
			if (validationResult.success) {
				const relationship = parentChildRelationshipDtoToDomain(
					validationResult.data
				);
				if (relationship) {
					relationships.push(relationship);
				}
				// Skip rows with empty required fields (adapter returns null)
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

		return relationships;
	}
}
