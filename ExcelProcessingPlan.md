# Useful Information for Excel Parsing (from provided image)

1. **Headers**: The first row contains column headers: Technician, Request ID, Created Time, Modulo, Subject, Problem ID, Linked Request Id.

2. **Categories**: Category rows (e.g., "Error de Alcance", "Error de codificación (Bug)") are visually separated, likely with formatting (bold, background color). These rows do not contain data for other columns and act as section headers for the following data rows.

3. **Data Rows**: Data rows appear below each category row and contain values for all columns. Each data row should be assigned the category from the most recent category row above it.

4. **Column Mapping**: Each data row should be parsed into an object with fields matching the headers, plus an additional "Category" field.

5. **Empty/Non-data Rows**: Category rows and any empty rows should be skipped when extracting actual data.

6. **Sheet Name**: The sheet name is "ManageEngine Report Framework" (visible in the tab).

7. **Additional Notes**: The image highlights the need to add the identified category in a new column for each data row. The columns are well-defined and consistent across the sheet.

This information should be used to:
- Detect and assign categories to each data row.
- Map columns accurately.
- Skip non-data rows.
- Add a "Category" field to the parsed output.
# Excel File Processing Todo List

- Sheet name: "ManageEngine Report Framework" (only one sheet)
- Note: Column A is empty; headers and data start at column B.
- Column mapping (from image):
	- Column B: Technician
	- Column C: Request ID
	- Column D: Created Time
	- Column E: Modulo
	- Column F: Subject
	- Column G: Problem ID
	- Column H: Linked Request Id
- Categories: Rows like "Error de Alcance", "Error de codificación (Bug)" visually separate data sections
- Data rows: Appear below category rows, must be assigned the current category
- Add a "Category" column to each parsed data row


## 2. Implement Excel file parser (Clean Architecture, ForTaggingData)
- Place parsing logic in incident-tagging module:
	- Service
	- Parser
	- Domain types
- Main process module (IPC handler: 'for-tagging-data:parseExcel')
- Expose secure API via preload script (contextBridge, base64-encoded keys)
- Build UI in and integrate with routes
- Extract headers, detect category rows, and parse data rows
- Skip category and empty rows when extracting actual data
- Map each data row to an object with all columns plus "Category"
- Ensure code is modular, testable, and maintainable

## 3. Add category identification logic
- Detect category rows by formatting or text pattern (e.g., bold, background color, or specific text)
- Track the current category and assign it to each subsequent data row until a new category row is found
- Add the category value to a new column in the output

## 4. Save parsed data to database
- Create a new table for the parsed data, matching the columns and including "Category"
- Implement logic to insert parsed rows into the new table
- Follow project database conventions and clean architecture

## 5. Prepare and visualize parsed data in v3 UI
- Format parsed and categorized data for display in the v3 UI
- Show parsed values in one tab and actual data in another tab
- Ensure clear separation and usability in the UI
- Use conventions from the existing Excel loading feature for consistency
