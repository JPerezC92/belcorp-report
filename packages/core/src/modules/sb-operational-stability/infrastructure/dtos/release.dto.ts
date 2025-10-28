import { z } from "zod";

/**
 * DTO schema for SB Operational Release data from Excel
 */
export const sbReleaseDto = z.object({
	week: z.number().nullable(),
	application: z.string(),
	date: z.string(), // ISO date string
	releaseVersion: z.string(),
	releaseLink: z.string().nullable(),
	tickets: z.string().nullable(),
});

export type SBReleaseDto = z.infer<typeof sbReleaseDto>;

/**
 * Database model schema for SB Operational Release
 */
export const sbReleaseDbModel = z.object({
	id: z.number(),
	week: z.number().nullable(),
	application: z.string(),
	date: z.string(),
	releaseVersion: z.string(),
	releaseLink: z.string().nullable(),
	tickets: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type SBReleaseDbModel = z.infer<typeof sbReleaseDbModel>;
