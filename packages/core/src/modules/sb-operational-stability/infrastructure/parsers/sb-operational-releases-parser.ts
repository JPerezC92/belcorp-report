import ExcelJS from "exceljs";
import type { SBReleaseDto } from "../dtos/release.dto.js";
import { cellValueSchema, cellWithLinkSchema } from "../../../../shared/schemas/excel-cell-validation.schema.js";

/**
 * Expected sheet name for SB Operational Releases data
 */
const EXPECTED_SHEET_NAME = "Hoja3";

/**
 * Expected column headers (case-insensitive matching)
 */
const EXPECTED_HEADERS = {
	SEMANA: "SEMANA",
	APLICACIÓN: "APLICACIÓN",
	FECHA: "FECHA",
	RELEASE: "RELEASE",
	TICKETS_COLUMN: "tickets ",
	NUM_TICKETS: "# TICKETS",
};

/**
 * Parse result for SB Operational Releases Excel file
 */
export interface SBReleasesParseResult {
	success: boolean;
	releases: SBReleaseDto[];
	errors: Array<{
		row: number;
		field?: string;
		message: string;
		value?: unknown;
	}>;
	warnings: string[];
	totalRows: number;
	successfulRows: number;
}

/**
 * Parse SB Operational Releases Excel file (Sheet 3 "Hoja3")
 *
 * @param fileBuffer - ArrayBuffer containing the Excel file
 * @returns Parse result with releases data and any errors/warnings
 */
export async function parseSBOperationalReleasesExcel(
	fileBuffer: ArrayBuffer,
): Promise<SBReleasesParseResult> {
	const errors: SBReleasesParseResult["errors"] = [];
	const warnings: string[] = [];
	const releases: SBReleaseDto[] = [];

	try {
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(fileBuffer);

		// Find Sheet 3 "Hoja3"
		const worksheet = workbook.getWorksheet(EXPECTED_SHEET_NAME);
		if (!worksheet) {
			return {
				success: false,
				releases: [],
				errors: [
					{
						row: 0,
						message: `Sheet "${EXPECTED_SHEET_NAME}" not found in workbook. Available sheets: ${workbook.worksheets.map((ws) => ws.name).join(", ")}`,
					},
				],
				warnings: [],
				totalRows: 0,
				successfulRows: 0,
			};
		}

		// Validate headers (row 1)
		const headerRow = worksheet.getRow(1);
		const headers: string[] = [];

		headerRow.eachCell((cell, colNumber) => {
			const headerValue = cellValueSchema.parse(cell.value).trim();
			headers[colNumber - 1] = headerValue;
		});

		// Find column indices
		const colIndices = {
			semana: headers.findIndex((h) =>
				h.toUpperCase() === EXPECTED_HEADERS.SEMANA
			),
			aplicacion: headers.findIndex((h) =>
				h.toUpperCase() === EXPECTED_HEADERS.APLICACIÓN
			),
			fecha: headers.findIndex((h) =>
				h.toUpperCase() === EXPECTED_HEADERS.FECHA
			),
			release: headers.findIndex((h) =>
				h.toUpperCase() === EXPECTED_HEADERS.RELEASE
			),
			numTickets: headers.findIndex((h) =>
				h === EXPECTED_HEADERS.NUM_TICKETS
			),
		};

		// Validate required columns exist
		if (colIndices.aplicacion === -1 || colIndices.fecha === -1 || colIndices.release === -1) {
			return {
				success: false,
				releases: [],
				errors: [
					{
						row: 1,
						message: `Missing required headers. Found: ${headers.join(", ")}`,
					},
				],
				warnings: [],
				totalRows: 0,
				successfulRows: 0,
			};
		}

		// Parse data rows (starting from row 2)
		const totalRows = worksheet.rowCount - 1; // Exclude header

		for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
			const row = worksheet.getRow(rowIndex);

			// Skip empty rows
			if (!row.hasValues) {
				continue;
			}

			try {
				// Extract SEMANA (week) - handle [object Object] issue
				let week: number | null = null;
				if (colIndices.semana !== -1) {
					const semanaCell = row.getCell(colIndices.semana + 1);
					const semanaValue = semanaCell.value;

					if (typeof semanaValue === "number") {
						week = semanaValue;
					} else if (typeof semanaValue === "string") {
						const parsed = Number.parseInt(semanaValue, 10);
						if (!Number.isNaN(parsed)) {
							week = parsed;
						}
					}
					// If it's [object Object] or other types, leave as null
				}

				// Extract APLICACIÓN
				const applicationCell = row.getCell(colIndices.aplicacion + 1);
				const application = cellValueSchema.parse(applicationCell.value).trim();

				if (!application) {
					errors.push({
						row: rowIndex,
						field: "APLICACIÓN",
						message: "Application is required",
					});
					continue;
				}

				// Extract FECHA (date)
				const fechaCell = row.getCell(colIndices.fecha + 1);
				const fechaValue = fechaCell.value;

				let date: string;
				if (fechaValue instanceof Date) {
					date = fechaValue.toISOString();
				} else if (typeof fechaValue === "string") {
					// Try to parse string date
					const parsedDate = new Date(fechaValue);
					if (!Number.isNaN(parsedDate.getTime())) {
						date = parsedDate.toISOString();
					} else {
						errors.push({
							row: rowIndex,
							field: "FECHA",
							message: "Invalid date format",
							value: fechaValue,
						});
						continue;
					}
				} else {
					errors.push({
						row: rowIndex,
						field: "FECHA",
						message: "Date is required",
						value: fechaValue,
					});
					continue;
				}

				// Extract RELEASE (with link)
				const releaseCell = row.getCell(colIndices.release + 1);
				const { value: releaseVersion, link: releaseLink } =
					cellWithLinkSchema.parse(releaseCell.value);

				if (!releaseVersion || releaseVersion.trim() === "") {
					errors.push({
						row: rowIndex,
						field: "RELEASE",
						message: "Release version is required",
					});
					continue;
				}

				// Extract # TICKETS (with link)
				let tickets: string | null = null;
				if (colIndices.numTickets !== -1) {
					const ticketsCell = row.getCell(colIndices.numTickets + 1);
					const { value: ticketsValue } = cellWithLinkSchema.parse(
						ticketsCell.value,
					);
					tickets = ticketsValue && ticketsValue.trim() !== "" ? ticketsValue : null;
				}

				// Create release DTO
				const release: SBReleaseDto = {
					week,
					application,
					date,
					releaseVersion: releaseVersion.trim(),
					releaseLink: releaseLink || null,
					tickets,
				};

				releases.push(release);
			} catch (error) {
				errors.push({
					row: rowIndex,
					message:
						error instanceof Error ? error.message : String(error),
				});
			}
		}

		return {
			success: errors.length === 0 || releases.length > 0,
			releases,
			errors,
			warnings,
			totalRows,
			successfulRows: releases.length,
		};
	} catch (error) {
		return {
			success: false,
			releases: [],
			errors: [
				{
					row: 0,
					message:
						error instanceof Error
							? `Failed to parse Excel file: ${error.message}`
							: "Failed to parse Excel file",
				},
			],
			warnings: [],
			totalRows: 0,
			successfulRows: 0,
		};
	}
}
