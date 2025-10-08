import { z } from "zod";

/**
 * Database model schema for DateRangeSettings
 */
export const dateRangeSettingsDbSchema = z.object({
	id: z.number(),
	globalModeEnabled: z.number(), // SQLite stores boolean as 0/1
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});

export type DateRangeSettingsDbModel = z.infer<typeof dateRangeSettingsDbSchema>;
