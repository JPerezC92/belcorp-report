import type { MonthlyReportRecord } from "@app/core";

/**
 * Frontend DTO for monthly report records
 * Uses snake_case to match frontend conventions
 */
export interface MonthlyReportFrontendDto {
	requestId: string;
	applications: string;
	categorization: string;
	categorizationDisplayName: string | null;
	requestIdLink: string | null;
	createdTime: string;
	requestStatus: string;
	module: string;
	moduleDisplayName: string | null;
	subject: string;
	subjectLink: string | null;
	priority: string;
	priorityReporte: string | null;
	eta: string;
	additionalInfo: string | null;
	resolvedTime: string | null;
	affectedCountries: string | null;
	recurrence: string | null;
	recurrenceComputed: string | null;
	technician: string;
	jira: string | null;
	problemId: string | null;
	problemIdLink: string | null;
	linkedRequestId: string | null;
	linkedRequestIdLink: string | null;
	requestOLAStatus: string | null;
	escalationGroup: string | null;
	affectedApplications: string | null;
	shouldResolveLevel1: string | null;
	campaign: string | null;
	cuv1: string | null;
	release: string | null;
	rca: string | null;
	businessUnit: string | null;
	inDateRange: boolean;
	rep: string | null;
	dia: string | null;
	week: string | null;
	requestStatusReporte: string | null;
	informacionAdicionalReporte: string | null;
	enlaces: number;
	mensaje: string | null;
	observations: string | null;
	statusModifiedByUser: boolean;
	// Snake_case fields for frontend compatibility
	computed_level: string | null;
	requestOpeningDate: string;
}

/**
 * Converts a MonthlyReportRecord domain entity to a frontend-compatible DTO
 * Maps camelCase domain properties to snake_case frontend properties where needed
 */
export function monthlyReportToFrontendDto(
	record: MonthlyReportRecord,
): MonthlyReportFrontendDto {
	return {
		requestId: record.requestId,
		applications: record.applications,
		categorization: record.categorization,
		categorizationDisplayName: record.categorizationDisplayName ?? null,
		requestIdLink: record.requestIdLink,
		createdTime: record.createdTime,
		requestStatus: record.requestStatus,
		module: record.module,
		moduleDisplayName: record.moduleDisplayName ?? null,
		subject: record.subject,
		subjectLink: record.subjectLink,
		priority: record.priority,
		priorityReporte: record.priorityReporte,
		eta: record.eta,
		additionalInfo: record.additionalInfo,
		resolvedTime: record.resolvedTime,
		affectedCountries: record.affectedCountries,
		recurrence: record.recurrence,
		recurrenceComputed: record.recurrenceComputed,
		technician: record.technician,
		jira: record.jira,
		problemId: record.problemId,
		problemIdLink: record.problemIdLink,
		linkedRequestId: record.linkedRequestId,
		linkedRequestIdLink: record.linkedRequestIdLink,
		requestOLAStatus: record.requestOLAStatus,
		escalationGroup: record.escalationGroup,
		affectedApplications: record.affectedApplications,
		shouldResolveLevel1: record.shouldResolveLevel1,
		campaign: record.campaign,
		cuv1: record.cuv1,
		release: record.release,
		rca: record.rca,
		businessUnit: record.businessUnit,
		inDateRange: record.inDateRange,
		rep: record.rep,
		dia: record.dia,
		week: record.week,
		requestStatusReporte: record.requestStatusReporte,
		informacionAdicionalReporte: record.informacionAdicionalReporte,
		enlaces: record.enlaces,
		mensaje: record.mensaje,
		observations: record.observations,
		statusModifiedByUser: record.statusModifiedByUser,
		// Map camelCase to snake_case for frontend
		computed_level: record.computedLevel,
		requestOpeningDate: record.createdTime, // Frontend needs this for month filtering
	};
}
