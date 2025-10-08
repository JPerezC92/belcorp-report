import z from "zod";

// Excel row schema for War Room records
export const warRoomExcelSchema = z.object({
	Application: z.string(),
	Date: z.string(),
	"Incident ID": z.object({
		value: z.string(),
		link: z.string().optional(),
	}),
	Summary: z.string(),
	"Initial Priority": z.string(),
	"Start Time": z.string(),
	"Duration (Minutes)": z.union([z.number(), z.string().transform((s) => Number.parseInt(s, 10))]),
	"End Time": z.string(),
	Participants: z.union([z.number(), z.string().transform((s) => Number.parseInt(s, 10))]),
	Status: z.string(),
	"Priority Changed": z.string(),
	"Resolution team changed": z.string(),
	Notes: z.string(),
	"RCA Status": z.string().nullable(),
	"URL RCA": z.string().nullable(),
});

export type WarRoomExcelDto = z.infer<typeof warRoomExcelSchema>;
