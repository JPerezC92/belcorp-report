# Excel Analysis Scripts

This folder contains scripts for analyzing Excel files used in the Belcorp Report application.

## Files

- `analyze-monthly-report.ts` - Analyzes the "XD 2025 DATA INFORME MENSUAL - Current Month.xlsx" file structure
- `run-analysis.js` - Runner script to execute the analysis

## Usage

```bash
# Run the monthly report analysis
node analysis-scripts/run-analysis.js
```

## Analysis Output

The analysis script will provide:
- Workbook structure (number of sheets, rows, columns)
- Column headers and their Spanish names
- Data type analysis for each column
- Sample data from first few rows
- Summary statistics

## Dependencies

- `exceljs` - For Excel file parsing
- `tsx` - For running TypeScript files directly
