import { ipcMain } from "electron";
import ExcelJS from "exceljs";
import { z } from "zod";

// Frontend response interfaces - Matching Zod schema output

interface TagRow {
	createdTime: string;
	requestId: {
		value: string;
		link: string;
	};
	informacionAdicional: string;
	modulo: string;
	problemId: {
		value: string;
		link: string;
	};
	linkedRequestId: {
		value: string;
		link: string;
	};
	jira: string;
	categorizacion: string;
	technician: string;
}

interface TagSheet {
	name: string;
	headers: string[];
	headerMap: Record<string, string>;
	rows: TagRow[];
}

interface TagExcelResult {
	success: boolean;
	fileName: string;
	sheets: TagSheet[];
	info: {
		creator?: string;
		modified?: Date;
		totalSheets: number;
	};
	error?: string;
}

const columnLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;

const headerLabels = {
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

const headerMap = {
	[headerLabels.createdTime]: "createdTime",
	[headerLabels.requestId]: "requestId",
	[headerLabels.additionalInfo]: "informacionAdicional",
	[headerLabels.module]: "modulo",
	[headerLabels.problemId]: "problemId",
	[headerLabels.linkedRequestId]: "linkedRequestId",
	[headerLabels.jira]: "jira",
	[headerLabels.categorization]: "categorizacion",
	[headerLabels.technician]: "technician",
} as const;

const headerSchema = z.tuple([
	z.literal(headerLabels.createdTime),
	z.literal(headerLabels.requestId),
	z.literal(headerLabels.additionalInfo),
	z.literal(headerLabels.module),
	z.literal(headerLabels.problemId),
	z.literal(headerLabels.linkedRequestId),
	z.literal(headerLabels.jira),
	z.literal(headerLabels.categorization),
	z.literal(headerLabels.technician),
]);

const rowValidationSchema = z
	.object({
		[headerLabels.createdTime]: z.string(),
		[headerLabels.requestId]: z.object({
			value: z
				.object({ richText: z.array(z.object({ text: z.string() })) })
				.optional()
				.transform((val) => val?.richText[0]?.text || ""),
			link: z.string(),
		}),
		[headerLabels.additionalInfo]: z.string(),
		[headerLabels.module]: z.string(),
		[headerLabels.problemId]: z.object({
			value: z
				.object({ richText: z.array(z.object({ text: z.string() })) })
				.optional()
				.transform((val) => val?.richText[0]?.text || ""),
			link: z.string(),
		}),
		[headerLabels.linkedRequestId]: z.object({
			value: z
				.object({ richText: z.array(z.object({ text: z.string() })) })
				.optional()
				.transform((val) => val?.richText[0]?.text || ""),
			link: z.string(),
		}),
		[headerLabels.jira]: z.string(),
		[headerLabels.categorization]: z.string(),
		[headerLabels.technician]: z.string(),
	})
	.transform((data) => {
		return {
			createdTime: data[headerLabels.createdTime],
			requestId: {
				value: data[headerLabels.requestId].value,
				link: data[headerLabels.requestId].link,
			},
			informacionAdicional: data[headerLabels.additionalInfo],
			modulo: data[headerLabels.module],
			problemId: {
				value: data[headerLabels.problemId].value,
				link: data[headerLabels.problemId].link,
			},
			linkedRequestId: {
				value: data[headerLabels.linkedRequestId].value,
				link: data[headerLabels.linkedRequestId].link,
			},
			jira: data[headerLabels.jira],
			categorizacion: data[headerLabels.categorization],
			technician: data[headerLabels.technician],
		};
	});

const targetSheetName = "ManageEngine Report Framework";

export interface ExcelFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

export function initTagReportHandlers() {
	ipcMain.handle(
		"excel:load-tag-report",
		async (
			_event,
			fileBuffer: ArrayBuffer,
			fileName: string
		): Promise<TagExcelResult> => {
			try {
				const workbook = new ExcelJS.Workbook();
				await workbook.xlsx.load(fileBuffer);

				const sheets: TagSheet[] = [];

				const worksheet = workbook.worksheets.find(
					(s) => s.name === targetSheetName
				);
				if (!worksheet) {
					console.warn(
						`Sheet named "${targetSheetName}" not found in workbook`
					);
					return {
						success: false,
						error: `Sheet named "${targetSheetName}" not found in workbook`,
						fileName,
						sheets: [],
						info: { totalSheets: workbook.worksheets.length },
					} as TagExcelResult;
				}

				worksheet.spliceColumns(1, 1);

				const headers = headerSchema.parse(
					columnLetters.map((col) => {
						const cell = worksheet.getCell(`${col}1`);
						return String(cell.text || `Column${col}`);
					})
				);

				const rowDataList: TagRow[] = [];

				worksheet.eachRow((row, rowNumber: number) => {
					if (rowNumber === 1) return;

					const rowObject = columnLetters
						.map((col, index) => ({
							[`${headers[index]}`]: [
								"Request ID",
								"Problem ID",
								"Linked Request Id",
							].includes(headers[index])
								? {
										value: row.getCell(col).text || "",
										link: row.getCell(col).hyperlink || "",
								  }
								: row.getCell(col).text || "",
						}))
						.reduce((acc, curr) => ({ ...acc, ...curr }), {});

					const parsed = rowValidationSchema.parse(rowObject);
					rowDataList.push(parsed);
				});

				sheets.push({
					name: worksheet.name,
					headers,
					headerMap,
					rows: rowDataList,
				});

				return {
					success: true,
					fileName,
					sheets: sheets,
					info: {
						creator: workbook.creator,
						modified: workbook.modified,
						totalSheets: workbook.worksheets.length,
					},
				};
			} catch (error) {
				console.error("Error processing TAG report Excel file:", error);
				return {
					success: false,
					error:
						error instanceof Error
							? error.message
							: "Unknown error occurred",
					fileName,
					sheets: [],
					info: {
						totalSheets: 0,
					},
				};
			}
		}
	);
}

// Exported function for preload/renderer bridge
export async function loadTagReport(
	fileBuffer: ArrayBuffer,
	fileName: string
): Promise<TagExcelResult> {
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(fileBuffer);
	const sheets: TagSheet[] = [];
	const worksheet = workbook.worksheets.find(
		(s) => s.name === targetSheetName
	);
	if (!worksheet) {
		return {
			success: false,
			error: `Sheet named "${targetSheetName}" not found in workbook`,
			fileName,
			sheets: [],
			info: { totalSheets: workbook.worksheets.length },
		};
	}
	worksheet.spliceColumns(1, 1);
	const headers = headerSchema.parse(
		columnLetters.map((col) => {
			const cell = worksheet.getCell(`${col}1`);
			return String(cell.text || `Column${col}`);
		})
	);
	const rowDataList: TagRow[] = [];
	worksheet.eachRow((row, rowNumber: number) => {
		if (rowNumber === 1) return;
		const rowObject = columnLetters
			.map((col, index) => ({
				[`${headers[index]}`]: [
					"Request ID",
					"Problem ID",
					"Linked Request Id",
				].includes(headers[index])
					? {
							value: row.getCell(col).text || "",
							link: row.getCell(col).hyperlink || "",
					  }
					: row.getCell(col).text || "",
			}))
			.reduce((acc, curr) => ({ ...acc, ...curr }), {});
		const parsed = rowValidationSchema.parse(rowObject);
		rowDataList.push(parsed);
	});
	sheets.push({
		name: worksheet.name,
		headers,
		headerMap,
		rows: rowDataList,
	});
	return {
		success: true,
		fileName,
		sheets: sheets,
		info: {
			creator: workbook.creator,
			modified: workbook.modified,
			totalSheets: workbook.worksheets.length,
		},
	};
}
