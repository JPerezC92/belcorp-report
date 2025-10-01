import { z } from "zod";

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

export type ExcelTagDto = z.infer<typeof excelTagSchema>;

// Schema expects data already processed by parser (cellWithLinkSchema already applied)
export const excelTagSchema = z
	.object({
		[headerLabels.createdTime]: z.string(),
		[headerLabels.requestId]: z.object({
			value: z.string(),
			link: z.string().optional(),
		}),
		[headerLabels.additionalInfo]: z.string(),
		[headerLabels.module]: z.string(),
		[headerLabels.problemId]: z.object({
			value: z.string(),
			link: z.string().optional(),
		}),
		[headerLabels.linkedRequestId]: z.object({
			value: z.string(),
			link: z.string().optional(),
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
			additionalInfo: data[headerLabels.additionalInfo],
			module: data[headerLabels.module],
			problemId: {
				value: data[headerLabels.problemId].value,
				link: data[headerLabels.problemId].link,
			},
			linkedRequestId: {
				value: data[headerLabels.linkedRequestId].value,
				link: data[headerLabels.linkedRequestId].link,
			},
			jira: data[headerLabels.jira],
			categorization: data[headerLabels.categorization],
			technician: data[headerLabels.technician],
		};
	});
