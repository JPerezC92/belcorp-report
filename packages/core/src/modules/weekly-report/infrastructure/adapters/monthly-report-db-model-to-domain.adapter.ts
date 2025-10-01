import { MonthlyReportRecord } from "../../domain/monthly-report-record.js";
import type { MonthlyReportRecordDbModel } from "../models/monthly-report-record-db.model.js";

export function monthlyReportDbModelToDomain(
	model: MonthlyReportRecordDbModel
): MonthlyReportRecord {
	return new MonthlyReportRecord(
		model.requestId,
		model.applications,
		model.categorization,
		model.requestIdLink,
		model.createdTime,
		model.requestStatus,
		model.module,
		model.subject,
		model.subjectLink,
		model.priority,
		model.priorityReporte,
		model.eta,
		model.additionalInfo,
		model.resolvedTime,
		model.affectedCountries,
		model.recurrence,
		model.technician,
		model.jira,
		model.problemId,
		model.problemIdLink,
		model.linkedRequestId,
		model.linkedRequestIdLink,
		model.requestOLAStatus,
		model.escalationGroup,
		model.affectedApplications,
		model.shouldResolveLevel1,
		model.campaign,
		model.cuv1,
		model.release,
		model.rca,
		model.businessUnit,
		model.inDateRange === 1, // Convert SQLite integer to boolean
		model.rep,
		model.dia,
		model.week,
		model.requestStatusReporte,
		model.informacionAdicionalReporte,
		model.enlaces,
		model.mensaje,
		model.statusModifiedByUser === 1, // Convert SQLite integer to boolean
		model.createdAt ? new Date(model.createdAt) : undefined,
		model.updatedAt ? new Date(model.updatedAt) : undefined
	);
}