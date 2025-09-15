import { z } from 'zod';

// Schema for hyperlink data
export const HyperlinkSchema = z.object({
  text: z.union([
    z.string(),
    z.array(z.object({
      text: z.string()
    })),
    z.object({
      text: z.string()
    })
  ]).optional(),
  target: z.string().url().optional(),
  tooltip: z.string().optional(),
}).nullable();

// Schema for cell data
export const CellDataSchema = z.object({
  value: z.any(),
  type: z.string(),
  address: z.string().regex(/^[A-Z]+\d+$/, "Invalid cell address format"),
  hyperlink: HyperlinkSchema,
  isHyperlink: z.boolean(),
});

// Schema for row data
export const RowDataSchema = z.object({
  rowNumber: z.number().positive(),
  cells: z.array(CellDataSchema),
  values: z.array(z.any()),
});

// Schema for worksheet data
export const WorksheetDataSchema = z.object({
  name: z.string().min(1, "Worksheet name cannot be empty"),
  id: z.number(),
  rowCount: z.number().nonnegative(),
  columnCount: z.number().nonnegative(),
  data: z.array(RowDataSchema),
});

// Schema for workbook info
export const WorkbookInfoSchema = z.object({
  creator: z.string().optional(),
  lastModifiedBy: z.string().optional(),
  created: z.date().optional(),
  modified: z.date().optional(),
  worksheetCount: z.number().nonnegative(),
});

// Main Excel data schema
export const ExcelDataSchema = z.object({
  success: z.boolean(),
  fileName: z.string().min(1, "File name cannot be empty"),
  worksheets: z.array(WorksheetDataSchema),
  workbookInfo: WorkbookInfoSchema,
  error: z.string().optional(),
});

// Enhanced schema for processed data with statistics
export const ProcessedExcelDataSchema = ExcelDataSchema.extend({
  validationErrors: z.array(z.string()).optional(),
  statistics: z.object({
    totalRows: z.number().nonnegative(),
    validHyperlinks: z.number().nonnegative(),
    invalidCells: z.number().nonnegative(),
    duplicateEntries: z.number().nonnegative(),
    emptyColumns: z.array(z.string()),
  }).optional(),
});

// Validation functions
export function validateExcelData(data: unknown) {
  return ExcelDataSchema.safeParse(data);
}

export function validateProcessedExcelData(data: unknown) {
  return ProcessedExcelDataSchema.safeParse(data);
}

export function validateWorksheet(data: unknown) {
  return WorksheetDataSchema.safeParse(data);
}

export function validateCellData(data: unknown) {
  return CellDataSchema.safeParse(data);
}

// Helper function to extract validation errors as readable messages
export function formatValidationErrors(result: { success: boolean; error?: z.ZodError; data?: any }): string[] {
  if (result.success) return [];

  if (!result.error) return [];

  return result.error.issues.map((error: z.ZodIssue) => {
    const path = error.path.length > 0 ? ` at ${error.path.join('.')}` : '';
    return `${error.message}${path}`;
  });
}

// Type exports
export type ExcelData = z.infer<typeof ExcelDataSchema>;
export type ProcessedExcelData = z.infer<typeof ProcessedExcelDataSchema>;
export type WorksheetData = z.infer<typeof WorksheetDataSchema>;
export type CellData = z.infer<typeof CellDataSchema>;
export type RowData = z.infer<typeof RowDataSchema>;
export type WorkbookInfo = z.infer<typeof WorkbookInfoSchema>;
export type Hyperlink = z.infer<typeof HyperlinkSchema>;
