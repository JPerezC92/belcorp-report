import { z } from "zod";

export const levelMappingSchema = z.object({
	requestStatusReporte: z.string().min(1),
	level: z.enum(["L2", "L3", "Unknown"]),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type LevelMappingDto = z.infer<typeof levelMappingSchema>;
