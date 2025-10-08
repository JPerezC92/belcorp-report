import z from "zod";

export const warRoomRecordDbSchema = z.object({
	application: z.string(),
	date: z.string(),
	incidentId: z.string(),
	incidentIdLink: z.string().nullable(),
	summary: z.string(),
	initialPriority: z.string(),
	startTime: z.string(),
	durationMinutes: z.number(),
	endTime: z.string(),
	participants: z.number(),
	status: z.string(),
	priorityChanged: z.string(),
	resolutionTeamChanged: z.string(),
	notes: z.string(),
	rcaStatus: z.string().nullable(),
	urlRca: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type WarRoomRecordDbModel = z.infer<typeof warRoomRecordDbSchema>;
