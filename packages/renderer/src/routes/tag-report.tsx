import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef } from 'react'

export const Route = createFileRoute('/tag-report')({
  component: TagReport,
})

// Declare global types for preload functions
declare global {
  interface Window {
    [key: string]: any;
  }
}

// Simplified interfaces for V2 - Matching Zod schema output
interface TagRow {
  createdTime: string;
  requestId: {
    value: string;
    link: string;
  };
  informacionAdicional: string;
  modulo: string;
  problemId: {
    value: string;
    link: string;
  };
  linkedRequestId: {
    value: string;
    link: string;
  };
  jira: string;
  categorizacion: string;
  technician: string;
}

interface TagSheet {
  name: string;
  headers: string[];
  headerMap: Record<string, string>;
  rows: TagRow[];
}

interface TagExcelResult {
  success: boolean;
  fileName: string;
  sheets: TagSheet[];
  info: {
    creator?: string;
    modified?: Date;
    totalSheets: number;
  };
  error?: string;
}

interface FilterOptions {
  searchTerm: string;
}

function TagReport() {
  const [excelData, setExcelData] = useState<TagExcelResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchTerm: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  console.log(excelData);
  const processExcelFile = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Get the encoded function name for loadTagReport
      const loadTagReportKey = btoa('loadTagReport');

      if (window[loadTagReportKey]) {
        const result = await window[loadTagReportKey](arrayBuffer, file.name);

        if (result.success) {
          setExcelData(result);
        } else {
          setError(result.error || 'Failed to load TAG report');
        }
      } else {
        setError('TAG report loading not available');
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

  // Simplified cell content rendering for the new structure
  const renderCellContent = (value: string | { value: string; link: string } | undefined) => {
    if (!value) return '';

    // Handle hyperlink objects with {value, link} structure
    if (typeof value === 'object' && 'link' in value && value.link) {
      return (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            // Use the same dynamic approach as V1
            const openExternalKey = btoa('openExternal');
            if (window[openExternalKey]) {
              window[openExternalKey](value.link);
            }
          }}
          className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
          title={value.link}
        >
          {value.value}
        </a>
      );
    }

    // Regular text content
    return String(value);
  };

  // Filter worksheets based on filter options
  const getFilteredWorksheets = () => {
    if (!excelData?.sheets) return [];

    return excelData.sheets.map(sheet => {
      let filteredRows = sheet.rows;

      // Apply search filter
      if (filterOptions.searchTerm) {
        filteredRows = filteredRows.filter(row => {
          // Search across all column values in the row
          const searchableValues = [
            row.createdTime,
            row.requestId?.value,
            row.informacionAdicional,
            row.modulo,
            row.problemId?.value,
            row.linkedRequestId?.value,
            row.jira,
            row.categorizacion,
            row.technician
          ];

          return searchableValues.some(value => {
            if (!value) return false;
            const searchText = String(value);
            return searchText.toLowerCase().includes(filterOptions.searchTerm.toLowerCase());
          });
        });
      }

      return {
        ...sheet,
        rows: filteredRows,
      };
    });
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const filteredWorksheets = getFilteredWorksheets();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">TAG Report</h1>
          <p className="text-gray-600">TAG Excel reporting with validation and filtering capabilities</p>
        </div>

        {/* File Upload Section */}
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
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <strong>Success!</strong> Loaded {excelData.fileName} with {excelData.sheets?.length || 0} sheet(s)
            </div>
          )}
        </div>

        {/* Filter Controls */}
        {excelData && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Filters & Options</h2>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search in data..."
                  value={filterOptions.searchTerm}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Excel Data Display */}
        {excelData && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Excel Data Preview</h2>

            {filteredWorksheets.map((worksheet) => (
              <div key={worksheet.name} className="mb-6">
                <h4 className="text-lg font-medium text-gray-700 mb-2">
                  Sheet: {worksheet.name} ({worksheet.rows.length} rows shown)
                </h4>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-2 py-1 text-xs font-medium">#</th>
                        {worksheet.headers.map((header, headerIndex) => (
                          <th key={headerIndex} className="border border-gray-300 px-2 py-1 text-sm font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {worksheet.rows.slice(0, 20).map((row: TagRow, rowIndex: number) => (
                        <tr key={rowIndex}>
                          <td className="border border-gray-300 px-2 py-1 text-xs font-medium bg-gray-100">
                            {rowIndex + 1}
                          </td>
                          {worksheet.headers.map((header, cellIndex) => {
                            const cellValue = row[worksheet.headerMap[header] as keyof TagRow];
                            return (
                              <td key={cellIndex} className="border border-gray-300 px-2 py-1 text-sm">
                                {renderCellContent(cellValue)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {worksheet.rows.length > 20 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Showing first 20 rows of {worksheet.rows.length} filtered rows
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

