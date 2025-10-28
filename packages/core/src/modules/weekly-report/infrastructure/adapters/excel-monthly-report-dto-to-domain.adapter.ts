import { MonthlyReportRecord } from "../../domain/monthly-report-record.js";
import type { ExcelMonthlyReportWithLinks } from "../dtos/excel-monthly-report.dto.js";
import type { DateRangeConfig } from "../../domain/date-range-config.js";

export function excelMonthlyReportDtoToDomain(
	dto: ExcelMonthlyReportWithLinks,
	dateRangeConfig?: DateRangeConfig | null,
	requestStatusReporte?: string,
	computedLevel?: string
): MonthlyReportRecord {
	// Clean up values - handle "No asignado" and empty strings
	const cleanValue = (value: string | null | undefined): string | null => {
		if (!value || value.trim() === "" || value === "No asignado") {
			return null;
		}
		return value.trim();
	};

	// Extract the numeric ID from hyperlink if needed
	const extractIdFromLink = (link: string | undefined): string | null => {
		if (!link) return null;
		const match = link.match(/woID=(\d+)/);
		return match && match[1] ? match[1] : null;
	};

	const data = {
		requestId: dto["Request ID"],
		applications: dto["Aplicativos"],
		categorization: cleanValue(dto["Categorización"]),
		requestIdLink: dto["Request ID Link"] || null,
		createdTime: dto["Created Time"],
		requestStatus: dto["Request Status"],
		module: dto["Modulo."],
		subject: dto["Subject"],
		subjectLink: dto["Subject Link"] || null,
		priority: cleanValue(dto["Priority"]),
		eta: cleanValue(dto["ETA"]),
		additionalInfo: cleanValue(dto["Información Adicional"]),
		resolvedTime: cleanValue(dto["Resolved Time"]),
		affectedCountries: cleanValue(dto["Países Afectados"]),
		recurrence: cleanValue(dto["Recurrencia"]),
		technician: cleanValue(dto["Technician"]),
		jira: cleanValue(dto["Jira"]),
		problemId: cleanValue(dto["Problem ID"]) || extractIdFromLink(dto["Problem ID Link"]),
		problemIdLink: dto["Problem ID Link"] || null,
		linkedRequestId: cleanValue(dto["Linked Request Id"]) || extractIdFromLink(dto["Linked Request Id Link"]),
		linkedRequestIdLink: dto["Linked Request Id Link"] || null,
		requestOLAStatus: cleanValue(dto["Request OLA Status"]),
		escalationGroup: cleanValue(dto["Grupo Escalamiento"]),
		affectedApplications: cleanValue(dto["Aplicactivos Afectados"]),
		shouldResolveLevel1: cleanValue(dto["¿Este Incidente se debió Resolver en Nivel 1?"]),
		campaign: cleanValue(dto["Campaña"]),
		cuv1: cleanValue(dto["CUV_1"]),
		release: cleanValue(dto["Release"]),
		rca: cleanValue(dto["RCA"]),
		enlaces: 0, // Will be calculated later when querying
	} as const;

	// Add optional parameters only if they exist to avoid undefined assignment
	let createData: typeof data & {
		dateRangeConfig?: DateRangeConfig;
		requestStatusReporte?: string;
		computedLevel?: string;
	} = data;

	if (dateRangeConfig) {
		createData = { ...createData, dateRangeConfig };
	}

	if (requestStatusReporte) {
		createData = { ...createData, requestStatusReporte };
	}

	if (computedLevel) {
		createData = { ...createData, computedLevel };
	}

	return MonthlyReportRecord.create(createData);
}