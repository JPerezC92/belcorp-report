import { MonthlyReportRecord } from "../../domain/monthly-report-record.js";
import type { MonthlyReportRecordDbModel } from "../models/monthly-report-record-db.model.js";

export function monthlyReportDbModelToDomain(
	model: MonthlyReportRecordDbModel
): MonthlyReportRecord {
	// Use the fromDatabase() factory method to trust all pre-computed values from the database
	// This preserves recurrenceComputed and all other computed fields as they were stored

	// Build the base data object
	const data: Parameters<typeof MonthlyReportRecord.fromDatabase>[0] = {
		requestId: model.requestId,
		applications: model.applications,
		categorization: model.categorization,
		requestIdLink: model.requestIdLink,
		createdTime: model.createdTime,
		requestStatus: model.requestStatus,
		module: model.module,
		subject: model.subject,
		subjectLink: model.subjectLink,
		priority: model.priority,
		eta: model.eta,
		additionalInfo: model.additionalInfo,
		resolvedTime: model.resolvedTime,
		affectedCountries: model.affectedCountries,
		recurrence: model.recurrence,
		recurrenceComputed: model.recurrenceComputed,
		technician: model.technician,
		jira: model.jira,
		problemId: model.problemId,
		problemIdLink: model.problemIdLink,
		linkedRequestId: model.linkedRequestId,
		linkedRequestIdLink: model.linkedRequestIdLink,
		requestOLAStatus: model.requestOLAStatus,
		escalationGroup: model.escalationGroup,
		affectedApplications: model.affectedApplications,
		shouldResolveLevel1: model.shouldResolveLevel1,
		campaign: model.campaign,
		cuv1: model.cuv1,
		release: model.release,
		rca: model.rca,
		businessUnit: model.businessUnit,
		inDateRange: model.inDateRange === 1,
		rep: model.rep,
		dia: model.dia,
		week: model.week,
		priorityReporte: model.priorityReporte,
		requestStatusReporte: model.requestStatusReporte,
		informacionAdicionalReporte: model.informacionAdicionalReporte,
		enlaces: model.enlaces,
		mensaje: model.mensaje,
		observations: model.observations,
		statusModifiedByUser: model.statusModifiedByUser === 1,
		computedLevel: model.computed_level,
	};

	// Only add display names if they're not undefined (exactOptionalPropertyTypes compliance)
	if (model.moduleDisplayName !== undefined) {
		data.moduleDisplayName = model.moduleDisplayName;
	}
	if (model.categorizationDisplayName !== undefined) {
		data.categorizationDisplayName = model.categorizationDisplayName;
	}

	return MonthlyReportRecord.fromDatabase(data);
}
