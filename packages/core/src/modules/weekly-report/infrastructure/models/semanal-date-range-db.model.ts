import { z } from "zod";

/**
 * Database model schema for SemanalDateRange
 */
export const semanalDateRangeDbSchema = z.object({
	id: z.number(),
	fromDate: z.string(),
	toDate: z.string(),
	description: z.string(),
	isActive: z.number(), // SQLite stores boolean as 0/1
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});

export type SemanalDateRangeDbModel = z.infer<typeof semanalDateRangeDbSchema>;