import { z } from "zod";

export const correctiveMaintenanceExcelSchema = z.object({
	"Request ID": z.object({
		value: z.string(),
		link: z.string().optional(),
	}),
	"Created Time": z.string(),
	Aplicativos: z.string(),
	Categorización: z.string(),
	"Request Status": z.string(),
	"Modulo.": z.string(),
	Subject: z.object({
		value: z.string(),
		link: z.string().optional(),
	}),
	Priority: z.string(),
	ETA: z.string(),
	RCA: z.string(),
});

export type CorrectiveMaintenanceExcelDto = z.infer<
	typeof correctiveMaintenanceExcelSchema
>;
