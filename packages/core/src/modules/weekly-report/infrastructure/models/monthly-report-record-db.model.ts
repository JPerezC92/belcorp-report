import { z } from "zod";

export const monthlyReportRecordDbSchema = z.object({
	// Primary key
	requestId: z.string(),

	// Excel columns
	applications: z.string(),
	categorization: z.string().nullable(),
	requestIdLink: z.string().nullable(),
	createdTime: z.string(),
	requestStatus: z.string(),
	module: z.string(),
	subject: z.string(),
	subjectLink: z.string().nullable(),
	priority: z.string().nullable(),
	eta: z.string().nullable(),
	additionalInfo: z.string().nullable(),
	resolvedTime: z.string().nullable(),
	affectedCountries: z.string().nullable(),
	recurrence: z.string().nullable(),
	technician: z.string().nullable(),
	jira: z.string().nullable(),
	problemId: z.string().nullable(),
	problemIdLink: z.string().nullable(),
	linkedRequestId: z.string().nullable(),
	linkedRequestIdLink: z.string().nullable(),
	requestOLAStatus: z.string().nullable(),
	escalationGroup: z.string().nullable(),
	affectedApplications: z.string().nullable(),
	shouldResolveLevel1: z.string().nullable(),
	campaign: z.string().nullable(),
	cuv1: z.string().nullable(),
	release: z.string().nullable(),
	rca: z.string().nullable(),

	// Computed columns
	businessUnit: z.string(),
	semanal: z.number(), // SQLite stores boolean as 0/1
	rep: z.string(),
	dia: z.number(),
	week: z.number(),
	priorityReporte: z.string().nullable(),
	requestStatusReporte: z.string(),
	informacionAdicionalReporte: z.string().nullable(),
	enlaces: z.number(),
	mensaje: z.string(),
	statusModifiedByUser: z.number(), // SQLite stores boolean as 0/1

	// Metadata
	createdAt: z.string().nullable(),
	updatedAt: z.string().nullable(),
});

export type MonthlyReportRecordDbModel = z.infer<typeof monthlyReportRecordDbSchema>;