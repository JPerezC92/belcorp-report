import { z } from "zod";

export const parentChildRelationshipExcelSchema = z.object({
	"Request ID": z.object({
		value: z.string(),
		link: z.string().optional(),
	}),
	"Linked Request Id": z.object({
		value: z.string(),
		link: z.string().optional(),
	}),
});

export type ParentChildRelationshipExcelDto = z.infer<
	typeof parentChildRelationshipExcelSchema
>;
