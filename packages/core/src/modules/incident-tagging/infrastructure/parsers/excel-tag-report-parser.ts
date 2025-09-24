import { Tag } from "@core/modules/incident-tagging/domain/tag.js";
import type {
	TagReportParseResult,
	TagReportParser,
	TagReportSheet,
} from "@core/modules/incident-tagging/domain/tag-report-parser.js";
import { excelTagSchema } from "@core/modules/incident-tagging/infrastructure/dtos/excel-tag.dto.js";
import ExcelJS from "exceljs";
import { z } from "zod";

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

	private readonly headerSchema = z.tuple([
		z.literal(this.headerLabels.createdTime),
		z.literal(this.headerLabels.requestId),
		z.literal(this.headerLabels.additionalInfo),
		z.literal(this.headerLabels.module),
		z.literal(this.headerLabels.problemId),
		z.literal(this.headerLabels.linkedRequestId),
		z.literal(this.headerLabels.jira),
		z.literal(this.headerLabels.categorization),
		z.literal(this.headerLabels.technician),
	]);

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

			// Remove first column as per original logic
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
			return String(cell.text || `Column${col}`);
		});

		return this.headerSchema.parse(headers);
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

					return {
						[header]: this.isLinkColumn(header)
							? {
									value: row.getCell(col).text || "",
									link: row.getCell(col).hyperlink || "",
							  }
							: row.getCell(col).text || "",
					};
				})
				.reduce((acc, curr) => ({ ...acc, ...curr }), {});

			const parsed = excelTagSchema.parse(rowObject);

			// Create Tag domain object from parsed data
			const tag = Tag.create({
				createdTime: parsed.createdTime,
				requestId: parsed.requestId.value,
				requestIdLink: parsed.requestId.link,
				informacionAdicional: parsed.informacionAdicional,
				modulo: parsed.modulo,
				problemId: parsed.problemId.value,
				problemIdLink: parsed.problemId.link,
				linkedRequestId: parsed.linkedRequestId.value,
				linkedRequestIdLink: parsed.linkedRequestId.link,
				jira: parsed.jira,
				categorizacion: parsed.categorizacion,
				technician: parsed.technician,
			});

			rowDataList.push(tag);
		});

		return rowDataList;
	}

	private isLinkColumn(header: string): boolean {
		const linkHeaders = [
			this.headerLabels.requestId,
			this.headerLabels.problemId,
			this.headerLabels.linkedRequestId,
		] as const;

		return linkHeaders.includes(header as (typeof linkHeaders)[number]);
	}
}
