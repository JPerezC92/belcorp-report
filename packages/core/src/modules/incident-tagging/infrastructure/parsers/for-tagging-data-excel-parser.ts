import ExcelJS from "exceljs";
import type {
	ForTaggingData,
	ForTaggingDataExcelParseResult,
	ForTaggingDataExcelSheet,
	ForTaggingDataExcelParser as IForTaggingDataExcelParser,
} from "../../domain/for-tagging-data-excel-parser.js";
import { forTaggingDataDtoToDomain } from "../adapters/forTaggingDataDtoToDomain.adapter.js";
import { forTaggingDataExcelSchema } from "../dtos/for-tagging-data-excel.dto.js";
import {
	extractCellValueAndLink,
	extractHeaderValue,
	isLinkColumn,
	validateHeaders,
} from "../utils/excel-parsing.utils.js";

export class ForTaggingDataExcelParser implements IForTaggingDataExcelParser {
	private readonly targetSheetName = "ManageEngine Report Framework";
	private readonly columnLetters = [
		"B",
		"C",
		"D",
		"E",
		"F",
		"G",
		"H",
	] as const;

	private readonly headerLabels = {
		technician: "Technician",
		requestId: "Request ID",
		createdTime: "Created Time",
		module: "Modulo.",
		subject: "Subject",
		problemId: "Problem ID",
		linkedRequestId: "Linked Request Id",
	} as const;

	headerOrder = [
		this.headerLabels.technician,
		this.headerLabels.requestId,
		this.headerLabels.createdTime,
		this.headerLabels.module,
		this.headerLabels.subject,
		this.headerLabels.problemId,
		this.headerLabels.linkedRequestId,
	];

	private isLinkColumn(header: string): boolean {
		const linkHeaders = [
			this.headerLabels.requestId,
			this.headerLabels.subject,
			this.headerLabels.problemId,
			this.headerLabels.linkedRequestId,
		] as const;

		return isLinkColumn(header, linkHeaders);
	}

	async parseExcel(
		fileBuffer: ArrayBuffer,
		fileName: string
	): Promise<ForTaggingDataExcelParseResult> {
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

			const sheet: ForTaggingDataExcelSheet = {
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
		const headers = this.columnLetters.map((col) => {
			const cell = worksheet.getCell(`${col}1`);
			return extractHeaderValue(cell, col);
		});

		// Validate headers with some flexibility
		validateHeaders(headers, this.headerOrder, this.headerOrder.length);

		return headers;
	}

	private extractRows(
		worksheet: ExcelJS.Worksheet,
		headers: string[]
	): ForTaggingData[] {
		const rows: ForTaggingData[] = [];
		let currentCategory = "";

		worksheet.eachRow((row, rowNumber: number) => {
			if (rowNumber === 1) return; // Skip header row

			// Check if this is a category row
			const firstCell = row.getCell("B");
			const firstCellText = String(firstCell.text || "").trim();

			// Category detection: check if this looks like a category name
			// Categories typically contain keywords like "Error", "Bug", "Informativa", etc.
			const categoryKeywords = [
				"Error",
				"Bug",
				"Informativa",
				"Inquiries",
				"Data Source",
				"Alcance",
				"codificación",
				"usuario",
				"Informativa",
			];
			const isCategoryRow =
				categoryKeywords.some((keyword) =>
					firstCellText.toLowerCase().includes(keyword.toLowerCase())
				) && firstCellText.length > 0;

			// If it looks like a category, treat it as such regardless of other columns
			if (isCategoryRow) {
				// This is a category row
				currentCategory = firstCellText;
				return; // Skip category rows
			}

			// This is a data row
			const rowObject: Record<string, unknown> = {};

			this.columnLetters.forEach((col, index) => {
				const header = headers[index];
				if (!header) return;

				const cell = row.getCell(col);
				const { value: cellValue, link: cellLink } =
					extractCellValueAndLink(cell);

				rowObject[header] = this.isLinkColumn(header)
					? {
							value: cellValue,
							link: cellLink,
					  }
					: cellValue;
			});

			// Add category to the row
			rowObject["Category"] = currentCategory;

			// Skip rows without a category
			if (!currentCategory || currentCategory.trim() === "") {
				return;
			}

			// Validate the complete row data with Zod schema
			const validatedRow = forTaggingDataExcelSchema.parse(rowObject);

			// Create domain object from validated data using adapter
			const forTaggingData = forTaggingDataDtoToDomain(validatedRow);

			rows.push(forTaggingData);
		});

		return rows;
	}
}
