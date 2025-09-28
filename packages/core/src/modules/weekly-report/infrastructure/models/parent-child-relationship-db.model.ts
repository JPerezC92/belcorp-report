import z from "zod";

export const parentChildRelationshipDbSchema = z.object({
	parentRequestId: z.string(),
	parentLink: z.string().optional(),
	childRequestId: z.string(),
	childLink: z.string().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type ParentChildRelationshipDbModel = z.infer<
	typeof parentChildRelationshipDbSchema
>;
