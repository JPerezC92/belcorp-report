import { z } from "zod";

// Schema for the Excel file with Spanish column names
export const excelMonthlyReportSchema = z.object({
	"Aplicativos": z.string(),
	"Categorización": z.string().nullable().optional(),
	"Request ID": z.string(),
	"Created Time": z.string(),
	"Request Status": z.string(),
	"Modulo.": z.string(),
	"Subject": z.string(),
	"Priority": z.string().nullable().optional(),
	"ETA": z.string().nullable().optional(),
	"Información Adicional": z.string().nullable().optional(),
	"Resolved Time": z.string().nullable().optional(),
	"Países Afectados": z.string().nullable().optional(),
	"Recurrencia": z.string().nullable().optional(),
	"Technician": z.string().nullable().optional(),
	"Jira": z.string().nullable().optional(),
	"Problem ID": z.string().nullable().optional(),
	"Linked Request Id": z.string().nullable().optional(),
	"Request OLA Status": z.string().nullable().optional(),
	"Grupo Escalamiento": z.string().nullable().optional(),
	"Aplicactivos Afectados": z.string().nullable().optional(),
	"¿Este Incidente se debió Resolver en Nivel 1?": z.string().nullable().optional(),
	"Campaña": z.string().nullable().optional(),
	"CUV_1": z.string().nullable().optional(),
	"Release": z.string().nullable().optional(),
	"RCA": z.string().nullable().optional(),
});

export type ExcelMonthlyReportDto = z.infer<typeof excelMonthlyReportSchema>;

// Extended DTO with hyperlinks
export interface ExcelMonthlyReportWithLinks extends ExcelMonthlyReportDto {
	"Request ID Link"?: string;
	"Subject Link"?: string;
	"Problem ID Link"?: string;
	"Linked Request Id Link"?: string;
}