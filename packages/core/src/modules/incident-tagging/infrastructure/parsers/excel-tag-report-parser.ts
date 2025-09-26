import type { Tag } from "@core/modules/incident-tagging/domain/tag.js";
import type {
	TagReportParseResult,
	TagReportParser,
	TagReportSheet,
} from "@core/modules/incident-tagging/domain/tag-report-parser.js";
import { excelTagDtoToDomain } from "@core/modules/incident-tagging/infrastructure/adapters/excelTagDtoToDomain.adapter.js";
import { excelTagSchema } from "@core/modules/incident-tagging/infrastructure/dtos/excel-tag.dto.js";
import {
	extractCellValueAndLink,
	extractHeaderValue,
	isLinkColumn,
	validateHeaders,
} from "@core/modules/incident-tagging/infrastructure/utils/excel-parsing.utils.js";
import ExcelJS from "exceljs";

export class ExcelTagReportParser implements TagReportParser {
	private readonly targetSheetName = "ManageEngine Report Framework";
	private readonly columnLetters = [
		"A",
		"B",
		"C",
		"D",
		"E",
		"F",
		"G",
		"H",
		"I",
	] as const;

	private readonly headerLabels = {
		createdTime: "Created Time",
		requestId: "Request ID",
		additionalInfo: "Información Adicional",
		module: "Modulo.",
		problemId: "Problem ID",
		linkedRequestId: "Linked Request Id",
		jira: "Jira",
		categorization: "Categorización",
		technician: "Technician",
	} as const;

	headerOrder = [
		this.headerLabels.createdTime,
		this.headerLabels.requestId,
		this.headerLabels.additionalInfo,
		this.headerLabels.module,
		this.headerLabels.problemId,
		this.headerLabels.linkedRequestId,
		this.headerLabels.jira,
		this.headerLabels.categorization,
		this.headerLabels.technician,
	];

	async parseExcel(
		fileBuffer: ArrayBuffer,
		fileName: string
	): Promise<TagReportParseResult> {
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

			// Remove first column thats empty
			worksheet.spliceColumns(1, 1);

			const headers = this.extractHeaders(worksheet);
			const rows = this.extractRows(worksheet, headers);

			const sheet: TagReportSheet = {
				name: worksheet.name,
				headers,
				headerOrder: this.headerOrder,
				rows,
			};

			return {
				success: true,
				fileName,
				sheet: sheet,
				metadata: {
					creator: workbook.creator,
					modified: workbook.modified,
					totalSheets: workbook.worksheets.length,
				},
			};
		} catch (error) {
			console.error("Error parsing Excel file:", error);

			throw error;
		}
	}

	private extractHeaders(worksheet: ExcelJS.Worksheet): string[] {
		const headers = this.columnLetters.map((col) => {
			const cell = worksheet.getCell(`${col}1`);
			return extractHeaderValue(cell, col);
		});

		validateHeaders(headers, this.headerOrder, this.headerOrder.length);
		return headers;
	}

	private extractRows(
		worksheet: ExcelJS.Worksheet,
		headers: string[]
	): Tag[] {
		const rowDataList: Tag[] = [];

		worksheet.eachRow((row, rowNumber: number) => {
			if (rowNumber === 1) return; // Skip header row

			const rowObject = this.columnLetters
				.map((col, index) => {
					const header = headers[index];
					if (!header) return {};

					const cell = row.getCell(col);
					const { value: cellValue, link: cellLink } =
						extractCellValueAndLink(cell);

					return {
						[header]: isLinkColumn(header, [
							this.headerLabels.requestId,
							this.headerLabels.problemId,
							this.headerLabels.linkedRequestId,
						])
							? {
									value: cellValue,
									link: cellLink,
							  }
							: cellValue,
					};
				})
				.reduce((acc, curr) => ({ ...acc, ...curr }), {});

			const parsed = excelTagSchema.parse(rowObject);

			// Create Tag domain object from parsed data using adapter
			const tag = excelTagDtoToDomain(parsed);

			rowDataList.push(tag);
		});

		return rowDataList;
	}
}
