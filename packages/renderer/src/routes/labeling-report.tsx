import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef } from 'react'

export const Route = createFileRoute('/labeling-report')({
  component: LabelingReport,
})

// Declare global types for preload functions
declare global {
  interface Window {
    [key: string]: any;
    electronAPI?: {
      openExternal: (url: string) => void;
    };
  }
}

interface CellData {
  value: any;
  type: string;
  address: string;
  hyperlink?: {
    text: string;
    target: string;
    tooltip?: string;
  } | null;
  isHyperlink: boolean;
}

interface WorksheetData {
  name: string;
  id: number;
  rowCount: number;
  columnCount: number;
  data: Array<{
    rowNumber: number;
    cells: CellData[];
    values: any[];
  }>;
}

interface ExcelData {
  success: boolean;
  fileName: string;
  worksheets: WorksheetData[];
  workbookInfo: {
    creator?: string;
    lastModifiedBy?: string;
    created?: Date;
    modified?: Date;
    worksheetCount: number;
  };
  error?: string;
}

function LabelingReport() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [hyperlinkAnalysis, setHyperlinkAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processExcelFile = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Get the encoded function name for processExcelFile
      const processExcelKey = btoa('processExcelFile');

      if (window[processExcelKey]) {
        const result = await window[processExcelKey](arrayBuffer, file.name);

        if (result.success) {
          setExcelData(result);

          // Analyze hyperlinks for the first worksheet
          if (result.worksheets.length > 0) {
            const analyzeHyperlinksKey = btoa('analyzeHyperlinks');
            if (window[analyzeHyperlinksKey]) {
              try {
                const hyperlinkResult = await window[analyzeHyperlinksKey](result.worksheets[0]);
                if (hyperlinkResult.success) {
                  setHyperlinkAnalysis(hyperlinkResult.analysis);
                }
              } catch (hyperlinkError) {
                console.warn('Failed to analyze hyperlinks:', hyperlinkError);
              }
            }
          }
        } else {
          setError(result.error || 'Failed to process Excel file');
        }
      } else {
        setError('Excel processing not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
      ];

      if (validTypes.includes(file.type)) {
        processExcelFile(file);
      } else {
        setError('Please select a valid Excel file (.xlsx or .xls)');
      }
    }
  };
  // Helper function to render cell content with hyperlink support
  const renderCellContent = (cell: CellData | undefined) => {
    if (!cell) return '';

    // Check if it's a hyperlink with a valid target
    if (cell.isHyperlink && cell.hyperlink?.target && cell.hyperlink.target.trim() !== '') {
      // Get display text with improved extraction logic
      let displayText = '';

      // Primary method: Extract directly from cell.value.richText[0].text
      if (cell.value && typeof cell.value === 'object' && cell.value.richText && Array.isArray(cell.value.richText) && cell.value.richText.length > 0) {
        const firstRichText = cell.value.richText[0];
        if (firstRichText && firstRichText.text) {
          displayText = String(firstRichText.text);
        }
      }

      // Fallback 1: Handle the case where hyperlink.text is an array
      if (!displayText && cell.hyperlink.text) {
        if (Array.isArray(cell.hyperlink.text)) {
          // Extract text from array of text objects
          displayText = cell.hyperlink.text.map((item: any) => {
            if (typeof item === 'object' && item.text) {
              return item.text;
            }
            return String(item);
          }).join('');
        } else if (typeof cell.hyperlink.text === 'string' && cell.hyperlink.text !== '[object Object]') {
          displayText = cell.hyperlink.text;
        } else {
          // Handle case where hyperlink.text is an object
          const textObj = cell.hyperlink.text as any;
          if (textObj && typeof textObj === 'object' && textObj.text) {
            displayText = String(textObj.text);
          }
        }
      }

      // Fallback 2: Try all richText segments if first one didn't work
      if (!displayText && cell.value && typeof cell.value === 'object' && cell.value.richText && Array.isArray(cell.value.richText)) {
        displayText = cell.value.richText.map((segment: any) => segment.text || '').join('');
      }

      // Fallback 3: Try other cell.value properties
      if (!displayText && cell.value) {
        if (typeof cell.value === 'object') {
          if (cell.value.text) {
            displayText = String(cell.value.text);
          } else if (cell.value.result !== undefined) {
            displayText = String(cell.value.result);
          } else {
            // Try to extract any meaningful content from the object
            const extracted = extractTextFromObject(cell.value);
            displayText = extracted || '';
          }
        } else {
          displayText = String(cell.value);
        }
      }

      // Final fallback: try to extract from the URL if it contains the ID
      if (!displayText || displayText === '[object Object]' || displayText === 'Link') {
        const urlMatch = cell.hyperlink.target.match(/sys_id=([a-f0-9]+)/);
        if (urlMatch) {
          // Look for request ID patterns in the URL
          const reqMatch = cell.hyperlink.target.match(/(\d{6})/); // Look for 6-digit numbers like 120876
          if (reqMatch) {
            displayText = reqMatch[1];
          } else {
            displayText = 'Link'; // Final fallback
          }
        } else {
          displayText = 'Link'; // Final fallback
        }
      }

      // Check if the text is "No asignado" - don't render as link
      if (displayText.toLowerCase().includes('no asignado')) {
        return (
          <span className="text-blue-600">
            {displayText}
          </span>
        );
      }

      // Render as clickable hyperlink that opens in browser
      return (
        <a
          href={cell.hyperlink.target}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
          title={`Open ${displayText} in browser - ${cell.hyperlink.target}`}
          onClick={(e) => {
            // Ensure it opens in the system browser
            e.preventDefault();
            if (cell.hyperlink?.target) {
              const openExternalKey = btoa('openExternal');
              if (window[openExternalKey]) {
                window[openExternalKey](cell.hyperlink.target);
              } else {
                window.open(cell.hyperlink.target, '_blank');
              }
            }
          }}
        >
          {displayText}
        </a>
      );
    }

    // Regular cell content
    const value = cell.value;
    if (value === null || value === undefined) return '';

    // Handle different value types
    if (typeof value === 'object') {
      // Handle Excel rich text format
      if (value.richText && Array.isArray(value.richText)) {
        return value.richText.map((segment: any) => segment.text || '').join('');
      }

      // Handle formula results
      if (value.result !== undefined) return String(value.result);

      // Handle text property
      if (value.text) return String(value.text);

      // Handle hyperlink text
      if (value.hyperlink) return String(value.hyperlink);

      // Handle date objects
      if (value instanceof Date) return value.toLocaleDateString();

      // Handle arrays
      if (Array.isArray(value)) {
        return value.map(item => {
          if (typeof item === 'object' && item.text) return item.text;
          return String(item);
        }).join('');
      }

      // Last resort - try to extract any text content
      const textContent = extractTextFromObject(value);
      if (textContent) return textContent;

      // If all else fails, stringify but make it readable
      return '[Complex Data]';
    }

    return String(value);
  };

  // Helper function to extract text from complex objects
  const extractTextFromObject = (obj: any): string => {
    if (!obj || typeof obj !== 'object') return '';

    // Primary method: Check for richText[0].text path
    if (obj.richText && Array.isArray(obj.richText) && obj.richText.length > 0) {
      const firstRichText = obj.richText[0];
      if (firstRichText && firstRichText.text) {
        return String(firstRichText.text);
      }
    }

    // Look for common text properties
    const textProps = ['text', 'value', 'result', 'displayText', 'content'];
    for (const prop of textProps) {
      if (obj[prop] !== undefined && obj[prop] !== null) {
        if (typeof obj[prop] === 'string') return obj[prop];
        if (typeof obj[prop] === 'number') return String(obj[prop]);
      }
    }

    // Fallback: Look for richText array and join all segments
    if (obj.richText && Array.isArray(obj.richText)) {
      return obj.richText.map((segment: any) => segment.text || '').join('');
    }

    return '';
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Labeling Report</h1>

        {/* Excel File Upload Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Import Excel File</h2>

          <div className="flex items-center gap-4 mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={triggerFileSelect}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  📁 Load Excel File
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          {excelData && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              <strong>Success!</strong> Loaded {excelData.fileName} with {excelData.workbookInfo.worksheetCount} worksheet(s)
              {hyperlinkAnalysis && (
                <div className="mt-2 text-sm">
                  <strong>Hyperlinks:</strong> {hyperlinkAnalysis.validHyperlinks} valid links, {hyperlinkAnalysis.noAssignmentCells} "No asignado" entries
                </div>
              )}
            </div>
          )}
        </div>

        {/* Excel Data Display */}
        {excelData && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Excel Data Preview</h2>

            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-600 mb-2">File Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><strong>File:</strong> {excelData.fileName}</div>
                <div><strong>Worksheets:</strong> {excelData.workbookInfo.worksheetCount}</div>
                <div><strong>Creator:</strong> {excelData.workbookInfo.creator || 'Unknown'}</div>
                <div><strong>Modified:</strong> {excelData.workbookInfo.modified ? new Date(excelData.workbookInfo.modified).toLocaleDateString() : 'Unknown'}</div>
              </div>
            </div>

            {excelData.worksheets.map((worksheet) => (
              <div key={worksheet.id} className="mb-6">
                <h4 className="text-lg font-medium text-gray-700 mb-2">
                  Sheet: {worksheet.name} ({worksheet.rowCount} rows, {worksheet.columnCount} columns)
                </h4>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <tbody>
                      {worksheet.data.slice(0, 10).map((row, rowIndex) => (
                        <tr key={row.rowNumber} className={rowIndex === 0 ? 'bg-gray-50' : ''}>
                          <td className="border border-gray-300 px-2 py-1 text-xs font-medium">
                            {row.rowNumber}
                          </td>
                          {row.cells.slice(0, 10).map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-300 px-2 py-1 text-sm">
                              {renderCellContent(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {worksheet.data.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Showing first 10 rows of {worksheet.data.length} total rows
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Report Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Total Labels</h3>
              <p className="text-2xl font-bold text-blue-600">
                {excelData ? excelData.worksheets.reduce((sum, ws) => sum + ws.rowCount, 0) : '1,234'}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-medium text-green-800 mb-2">Processed</h3>
              <p className="text-2xl font-bold text-green-600">
                {excelData ? Math.floor(excelData.worksheets.reduce((sum, ws) => sum + ws.rowCount, 0) * 0.94) : '1,156'}
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="text-lg font-medium text-orange-800 mb-2">Pending</h3>
              <p className="text-2xl font-bold text-orange-600">
                {excelData ? Math.ceil(excelData.worksheets.reduce((sum, ws) => sum + ws.rowCount, 0) * 0.06) : '78'}
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Label batch #L2024-001 processed</span>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Quality check completed for batch #L2024-002</span>
                <span className="text-sm text-gray-500">4 hours ago</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-700">New labeling requirements updated</span>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Generate Report
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
              Export Data
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
