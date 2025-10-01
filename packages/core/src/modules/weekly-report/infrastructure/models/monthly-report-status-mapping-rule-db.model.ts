import { z } from "zod";

export const monthlyReportStatusMappingRuleDbSchema = z.object({
	id: z.number(),
	sourceStatus: z.string(),
	targetStatus: z.string(),
	patternType: z.enum(['exact', 'contains', 'regex']),
	priority: z.number(),
	active: z.number(), // SQLite stores booleans as 0/1
	createdAt: z.string(),
	updatedAt: z.string()
});

export type MonthlyReportStatusMappingRuleDbModel = z.infer<typeof monthlyReportStatusMappingRuleDbSchema>;
