import z from "zod";

export const tagResponseSchema = z.object({
	id: z.string(),
	createdTime: z.string(),
	requestId: z.object({
		value: z.string(),
		link: z.string().optional(),
	}),
	informacionAdicional: z.string(),
	modulo: z.string(),
	problemId: z.object({
		value: z.string(),
		link: z.string().optional(),
	}),
	linkedRequestId: z.object({
		value: z.string(),
		link: z.string().optional(),
	}),
	jira: z.string(),
	categorizacion: z.string(),
	technician: z.string(),
});

export type TagResponseDto = z.infer<typeof tagResponseSchema>;

export const tagResponseArraySchema = z.array(tagResponseSchema);
export type TagResponseArrayDto = z.infer<typeof tagResponseArraySchema>;
