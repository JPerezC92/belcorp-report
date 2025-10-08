import type {
	WarRoomExcelParseResult,
	WarRoomExcelParser,
	WarRoomExcelSheet,
} from "@core/modules/war-rooms/domain/war-room-excel-parser.js";
import type { WarRoomRecord } from "@core/modules/war-rooms/domain/war-room-record.js";
import { warRoomDtoToDomain } from "@core/modules/war-rooms/infrastructure/adapters/warRoomDtoToDomain.adapter.js";
import { warRoomExcelSchema } from "@core/modules/war-rooms/infrastructure/dtos/war-room-excel.dto.js";
import {
	warRoomCellValueSchema,
	warRoomCellWithLinkSchema,
} from "@core/modules/war-rooms/infrastructure/schemas/war-room-cell-validation.schema.js";
import ExcelJS from "exceljs";

export class WarRoomExcelParserImpl implements WarRoomExcelParser {
	private readonly targetSheetName = "Warrooms";
	private columnLetters: string[] = [
		"A", // Application
		"B", // Date
		"C", // Incident ID (with link)
		"D", // Summary
		"E", // Initial Priority
		"F", // Start Time
		"G", // Duration (Minutes)
		"H", // End Time
		"I", // Participants
		"J", // Status
		"K", // Priority Changed
		"L", // Resolution team changed
		"M", // Notes
		"N", // RCA Status
		"O", // URL RCA
	];

	private readonly headerLabels = {
		application: "Application",
		date: "Date",
		incidentId: "Incident ID",
		summary: "Summary",
		initialPriority: "Initial Priority",
		startTime: "Start Time",
		durationMinutes: "Duration (Minutes)",
		endTime: "End Time",
		participants: "Participants",
		status: "Status",
		priorityChanged: "Priority Changed",
		resolutionTeamChanged: "Resolution team changed",
		notes: "Notes",
		rcaStatus: "RCA Status",
		urlRca: "URL RCA",
	} as const;

	headerOrder = [
		this.headerLabels.application,
		this.headerLabels.date,
		this.headerLabels.incidentId,
		this.headerLabels.summary,
		this.headerLabels.initialPriority,
		this.headerLabels.startTime,
		this.headerLabels.durationMinutes,
		this.headerLabels.endTime,
		this.headerLabels.participants,
		this.headerLabels.status,
		this.headerLabels.priorityChanged,
		this.headerLabels.resolutionTeamChanged,
		this.headerLabels.notes,
		this.headerLabels.rcaStatus,
		this.headerLabels.urlRca,
	];

	async parseExcel(
		fileBuffer: ArrayBuffer,
		fileName: string
	): Promise<WarRoomExcelParseResult> {
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

			const sheet: WarRoomExcelSheet = {
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
			const headerValue = warRoomCellValueSchema.parse(cell.value);
			headers.push(headerValue);
		});

		return headers;
	}

	private extractRows(
		worksheet: ExcelJS.Worksheet,
		headers: string[]
	): WarRoomRecord[] {
		const records: WarRoomRecord[] = [];

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

				// Special handling for Incident ID column (has links)
				if (header === this.headerLabels.incidentId) {
					const { value: cellValue, link: cellLink } =
						warRoomCellWithLinkSchema.parse(cell.value);
					rowData[header] = {
						value: cellValue,
						link: cellLink,
					};
				} else {
					// For other columns, just extract the value
					const cellValue = warRoomCellValueSchema.parse(cell.value);
					rowData[header] = cellValue;
				}
			});

			// Validate and transform to domain
			const validationResult = warRoomExcelSchema.safeParse(rowData);
			if (validationResult.success) {
				const record = warRoomDtoToDomain(validationResult.data);
				if (record) {
					records.push(record);
				}
			} else {
				throw new Error(
					`Invalid data in row ${rowIndex}: ${validationResult.error.issues
						.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
						.join(", ")}`
				);
			}
		}

		return records;
	}
}
