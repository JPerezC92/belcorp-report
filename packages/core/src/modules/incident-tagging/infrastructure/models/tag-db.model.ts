import z from "zod";

export const tagDbSchema = z.object({
	requestId: z.string(),
	requestIdLink: z.string().optional(),
	createdTime: z.string(),
	additionalInfo: z.string(),
	module: z.string(),
	problemId: z.string(),
	problemIdLink: z.string().optional(),
	linkedRequestIdValue: z.string(),
	linkedRequestIdLink: z.string().optional(),
	jira: z.string(),
	categorization: z.string(),
	technician: z.string(),
	processedAt: z.string().optional(),
});

export type TagDbModel = z.infer<typeof tagDbSchema>;
