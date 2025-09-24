import z from "zod";

export const tagDbSchema = z.object({
	requestId: z.string(),
	requestIdLink: z.string().optional(),
	createdTime: z.string(),
	informacionAdicional: z.string(),
	modulo: z.string(),
	problemId: z.string(),
	problemIdLink: z.string().optional(),
	linkedRequestIdValue: z.string(),
	linkedRequestIdLink: z.string().optional(),
	jira: z.string(),
	categorizacion: z.string(),
	technician: z.string(),
	processedAt: z.string().optional(),
});

export type TagDbModel = z.infer<typeof tagDbSchema>;
