import { z } from "zod";
import { ForTaggingData } from "../../domain/for-tagging-data-excel-parser.js";

// Database schema for ForTaggingData (matches database table structure)
export const forTaggingDataDbSchema = z.object({
	requestId: z.string(),
	technician: z.string().nullable(),
	createdTime: z.string().nullable(),
	module: z.string().nullable(),
	subject: z.string().nullable(),
	problemId: z.string().nullable(),
	linkedRequestId: z.string().nullable(),
	category: z.string().nullable(),
	requestIdLink: z.string().nullable(),
	subjectLink: z.string().nullable(),
	problemIdLink: z.string().nullable(),
	linkedRequestIdLink: z.string().nullable(),
});

export type ForTaggingDataDbModel = z.infer<typeof forTaggingDataDbSchema>;

// Domain to database mapping
export function forTaggingDataDomainToDb(
	data: ForTaggingData
): ForTaggingDataDbModel {
	return {
		requestId: data.requestId,
		technician: data.technician || null,
		createdTime: data.createdTime || null,
		module: data.module || null,
		subject: data.subject || null,
		problemId: data.problemId || null,
		linkedRequestId: data.linkedRequestId || null,
		category: data.category || null,
		requestIdLink: data.requestIdLink || null,
		subjectLink: data.subjectLink || null,
		problemIdLink: data.problemIdLink || null,
		linkedRequestIdLink: data.linkedRequestIdLink || null,
	};
}

// Database to domain mapping
export function forTaggingDataDbToDomain(
	dbModel: ForTaggingDataDbModel
): ForTaggingData {
	const createData: {
		technician: string;
		requestId: string;
		createdTime: string;
		module: string;
		subject: string;
		problemId: string;
		linkedRequestId: string;
		category: string;
		requestIdLink?: string;
		subjectLink?: string;
		problemIdLink?: string;
		linkedRequestIdLink?: string;
	} = {
		technician: dbModel.technician || "",
		requestId: dbModel.requestId,
		createdTime: dbModel.createdTime || "",
		module: dbModel.module || "",
		subject: dbModel.subject || "",
		problemId: dbModel.problemId || "",
		linkedRequestId: dbModel.linkedRequestId || "",
		category: dbModel.category || "",
	};

	if (dbModel.requestIdLink !== null) {
		createData.requestIdLink = dbModel.requestIdLink;
	}

	if (dbModel.subjectLink !== null) {
		createData.subjectLink = dbModel.subjectLink;
	}

	if (dbModel.problemIdLink !== null) {
		createData.problemIdLink = dbModel.problemIdLink;
	}

	if (dbModel.linkedRequestIdLink !== null) {
		createData.linkedRequestIdLink = dbModel.linkedRequestIdLink;
	}

	return ForTaggingData.create(createData);
}
