import { ipcMain } from 'electron';
import ExcelJS from 'exceljs';

interface CellData {
  value: any;
  type: ExcelJS.ValueType;
  address: string;
  hyperlink?: {
    text: string;
    target: string;
    tooltip?: string;
  } | null;
  isHyperlink: boolean;
}

interface RowData {
  rowNumber: number;
  cells: CellData[];
  values: any[];
}

interface SheetData {
  name: string;
  id: number;
  rowCount: number;
  columnCount: number;
  data: RowData[];
}


class LabelsReport {
  readonly headers = [
    'Created Time',
    'Request ID',
    'Información Adicional',
    'Modulo.',
    'Problem ID',
    'Linked Request Id',
    'Jira',
    'Categorización',
    'Technician'
  ];

  readonly headerMap: Map<string, number>;

  constructor() {
    this.headerMap = new Map<string, number>();
    this.headers.forEach((header, index) => {
      this.headerMap.set(header, index);
    });
  }

  getHeaderIndex(header: string): number | undefined {
    return this.headerMap.get(header);
  }

  /**
   * Check if a cell value represents "No asignado" (no assignment)
   */
  isNoAssignment(cellData: CellData): boolean {
    if (!cellData) return true;
    const value = cellData.value?.toString().toLowerCase().trim();
    return value === 'no asignado' || value === '' || value === null || value === undefined;
  }

  /**
   * Check if a cell has a valid hyperlink (not "No asignado")
   */
  hasValidHyperlink(cellData: CellData): boolean {
    return cellData.isHyperlink && !this.isNoAssignment(cellData) && Boolean(cellData.hyperlink?.target);
  }

  /**
   * Get display text for a cell, handling hyperlinks appropriately
   */
  getCellDisplayText(cellData: CellData): string {
    if (!cellData) return '';

    if (this.hasValidHyperlink(cellData)) {
      return cellData.hyperlink?.text || cellData.value?.toString() || '';
    }

    return cellData.value?.toString() || '';
  }

  /**
   * Get hyperlink URL for a cell if it has a valid link
   */
  getCellHyperlink(cellData: CellData): string | null {
    if (this.hasValidHyperlink(cellData)) {
      return cellData.hyperlink?.target || null;
    }
    return null;
  }
}

// Helper function to extract display text from Excel cell values
function extractCellDisplayValue(cellValue: any): any {
  if (cellValue === null || cellValue === undefined) return null;

  // Handle rich text format
  if (typeof cellValue === 'object' && cellValue.richText && Array.isArray(cellValue.richText)) {
    return cellValue.richText.map((segment: any) => segment.text || '').join('');
  }

  // Handle formula results
  if (typeof cellValue === 'object' && cellValue.result !== undefined) {
    return cellValue.result;
  }

  // Handle text property
  if (typeof cellValue === 'object' && cellValue.text) {
    return cellValue.text;
  }

  // Handle hyperlink objects
  if (typeof cellValue === 'object' && cellValue.hyperlink) {
    return cellValue.text || cellValue.hyperlink;
  }

  // For simple values, return as-is
  if (typeof cellValue !== 'object') {
    return cellValue;
  }

  // For complex objects that we haven't handled, try to extract text
  if (cellValue.toString && typeof cellValue.toString === 'function') {
    const stringValue = cellValue.toString();
    if (stringValue !== '[object Object]') {
      return stringValue;
    }
  }

  return cellValue; // Return original if we can't simplify it
}

export function initExcelHandlers() {
  // Handle Excel file processing
  ipcMain.handle('excel:process-file', async (_event: any, fileBuffer: ArrayBuffer, fileName: string) => {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(Buffer.from(fileBuffer) as any);

      const worksheets: SheetData[] = [];

      workbook.eachSheet((worksheet: any, sheetId: any) => {
        // First, detect empty columns by checking all rows
        const maxRows = Math.min(worksheet.rowCount, 1000);
        const columnHasData = new Map<number, boolean>();

        // Check all rows to identify which columns have data
        for (let rowNumber = 1; rowNumber <= maxRows; rowNumber++) {
          const row = worksheet.getRow(rowNumber);
          row.eachCell({ includeEmpty: false }, (cell: any, colNumber: any) => {
            if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
              columnHasData.set(colNumber, true);
            }
          });
        }

        const sheetData: SheetData = {
          name: worksheet.name,
          id: sheetId,
          rowCount: worksheet.rowCount,
          columnCount: worksheet.columnCount,
          data: []
        };

        // Read all rows (limit to first 1000 rows for performance)
        for (let rowNumber = 1; rowNumber <= maxRows; rowNumber++) {
          const row = worksheet.getRow(rowNumber);
          const rowData: CellData[] = [];

          // Get all values from the row, but skip empty columns
          row.eachCell({ includeEmpty: true }, (cell: any, colNumber: any) => {
            // Skip columns that are entirely empty (especially column A if empty)
            if (columnHasData.get(colNumber) || colNumber === 1) {
              // Only include column 1 (A) if it has data somewhere in the sheet
              if (colNumber === 1 && !columnHasData.get(1)) {
                return; // Skip empty column A
              }

              const adjustedIndex = Array.from(columnHasData.keys())
                .filter(col => col <= colNumber && (col !== 1 || columnHasData.get(1)))
                .length - 1;

              if (adjustedIndex >= 0) {
                // Check if cell has hyperlink
                const hasHyperlink = cell.hyperlink !== null && cell.hyperlink !== undefined;
                let hyperlinkData = null;

                // Extract the display value from the cell
                const displayValue = extractCellDisplayValue(cell.value);

                if (hasHyperlink) {
                  // Extract hyperlink information
                  if (typeof cell.hyperlink === 'string') {
                    hyperlinkData = {
                      text: cell.text || displayValue?.toString() || cell.hyperlink,
                      target: cell.hyperlink,
                      tooltip: undefined
                    };
                  } else if (typeof cell.hyperlink === 'object') {
                    // Get the display text - try multiple sources
                    let linkText = '';
                    if (cell.hyperlink.text) {
                      linkText = String(cell.hyperlink.text);
                    } else if (cell.text) {
                      linkText = String(cell.text);
                    } else if (displayValue) {
                      linkText = String(displayValue);
                    } else if (cell.value) {
                      linkText = String(cell.value);
                    }

                    hyperlinkData = {
                      text: linkText,
                      target: cell.hyperlink.target || cell.hyperlink.hyperlink || '',
                      tooltip: cell.hyperlink.tooltip
                    };
                  }
                }

                rowData[adjustedIndex] = {
                  value: displayValue, // Use the extracted display value
                  type: cell.type,
                  address: cell.address,
                  hyperlink: hyperlinkData,
                  isHyperlink: hasHyperlink
                };
              }
            }
          });

          sheetData.data.push({
            rowNumber,
            cells: rowData,
            values: rowData.map(cell => cell?.value || '')
          });
        }

        worksheets.push(sheetData);
      });

      return {
        success: true,
        fileName,
        worksheets,
        workbookInfo: {
          creator: workbook.creator,
          lastModifiedBy: workbook.lastModifiedBy,
          created: workbook.created,
          modified: workbook.modified,
          worksheetCount: workbook.worksheets.length
        }
      };
    } catch (error) {
      console.error('Error processing Excel file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fileName
      };
    }
  });

  // Handle Excel file validation
  ipcMain.handle('excel:validate-file', async (_event: any, fileBuffer: ArrayBuffer) => {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(Buffer.from(fileBuffer) as any);

      return {
        success: true,
        isValid: true,
        worksheetCount: workbook.worksheets.length,
        worksheetNames: workbook.worksheets.map((ws: any) => ws.name)
      };
    } catch (error) {
      return {
        success: true,
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid Excel file'
      };
    }
  });

  // Handle hyperlink analysis
  ipcMain.handle('excel:analyze-hyperlinks', async (_event: any, worksheetData: SheetData) => {
    try {
      const labelsReport = new LabelsReport();
      const hyperlinkAnalysis = {
        totalCells: 0,
        hyperlinkCells: 0,
        validHyperlinks: 0,
        noAssignmentCells: 0,
        hyperlinkedColumns: new Set<number>(),
        sampleHyperlinks: [] as Array<{
          address: string;
          text: string;
          url: string;
          rowNumber: number;
          columnIndex: number;
        }>
      };

      worksheetData.data.forEach((row) => {
        row.cells.forEach((cell, columnIndex) => {
          if (!cell) return;

          hyperlinkAnalysis.totalCells++;

          if (cell.isHyperlink) {
            hyperlinkAnalysis.hyperlinkCells++;
            hyperlinkAnalysis.hyperlinkedColumns.add(columnIndex);

            if (labelsReport.hasValidHyperlink(cell)) {
              hyperlinkAnalysis.validHyperlinks++;

              // Add to samples (limit to first 10)
              if (hyperlinkAnalysis.sampleHyperlinks.length < 10) {
                hyperlinkAnalysis.sampleHyperlinks.push({
                  address: cell.address,
                  text: labelsReport.getCellDisplayText(cell),
                  url: labelsReport.getCellHyperlink(cell) || '',
                  rowNumber: row.rowNumber,
                  columnIndex
                });
              }
            } else if (labelsReport.isNoAssignment(cell)) {
              hyperlinkAnalysis.noAssignmentCells++;
            }
          }
        });
      });

      return {
        success: true,
        analysis: {
          ...hyperlinkAnalysis,
          hyperlinkedColumns: Array.from(hyperlinkAnalysis.hyperlinkedColumns)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error analyzing hyperlinks'
      };
    }
  });
}
