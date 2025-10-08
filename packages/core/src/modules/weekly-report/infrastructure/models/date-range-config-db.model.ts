import { z } from "zod";

/**
 * Database model schema for DateRangeConfig
 */
export const dateRangeConfigDbSchema = z.object({
	id: z.number(),
	fromDate: z.string(),
	toDate: z.string(),
	description: z.string(),
	isActive: z.number(), // SQLite stores boolean as 0/1
	rangeType: z.enum(['weekly', 'custom', 'disabled']).default('disabled'),
	scope: z.enum(['monthly', 'corrective', 'global']).default('monthly'),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});

export type DateRangeConfigDbModel = z.infer<typeof dateRangeConfigDbSchema>;
