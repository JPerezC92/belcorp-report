import z from "zod";

export const correctiveMaintenanceRecordDbSchema = z.object({
	requestId: z.string(),
	requestIdLink: z.string().optional(),
	createdTime: z.string(),
	applications: z.string(),
	categorization: z.string(),
	requestStatus: z.string(),
	module: z.string(),
	subject: z.string(),
	subjectLink: z.string().optional(),
	priority: z.string(),
	eta: z.string(),
	rca: z.string(),
	businessUnit: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type CorrectiveMaintenanceRecordDbModel = z.infer<
	typeof correctiveMaintenanceRecordDbSchema
>;
