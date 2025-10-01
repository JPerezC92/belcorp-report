# Weekly Report Feature Plan

This document outlines the plan for implementing the new weekly report feature in the Belcorp Report application.

## **Phase 3 (Multi-Excel File Processing) - COMPLETE ✅**

**Objective**: Extend the weekly report system to## Implementation Notes

- Follow the existing domain-driven design pattern used in the incident-ta- **Business Unit Filtering**: Add checkboxes for each business unit in the Corrective Maintenance tab
  - Each business_unit (FFVV, SB, UB-3, UN-2, CD) should have a checkbox
  - When a checkbox is activated, retrieve and display records for that respective business_unit
  - Default state: SB business_unit checkbox active on page load
  - Selection behavior: Only one checkbox can be active at a time, or all can be unchecked (allowing view of all records when none selected)
  - **Status**: ✅ IMPLEMENTED - Backend filtering added, frontend checkboxes with state management module.
- Ensure all new code adheres to the project's clean architecture principles.
- Use dependency injection for services and repositories.
- Validate all external data with Zod schemas.
- Handle errors with structured responses, never throwing exceptions to the renderer.
- Update IPC channels securely via preload with base64-encoded keys.
- Test thoroughly with unit, integration, and E2E tests.
- **Excel Parsing**: Handle rich text objects from ExcelJS properly - hyperlinks are stored as nested objects with text.richText arrays
- **Electron Links**: Use button elements with onClick handlers calling shell.openExternal() instead of HTML anchor tags for external URLs
- **UI Design**: Attach links directly to data values rather than separate columns for cleaner, more intuitive interfaces
- **Translation**: Currently implemented as direct main-process execution using OPUS model; worker-based implementation planned for future enhancementiple Excel file types and provide enhanced data processing capabilities, starting with the "XD SEMANAL CORRECTIVO" corrective maintenance report.

**Requirements**:
- Support for loading "XD SEMANAL CORRECTIVO" Excel reports (Spanish)
- File type detection and appropriate parsing logic for corrective maintenance data
- Enhanced data validation and error reporting for maintenance records
- Integration with existing parent-child relationship system
- Progress indicators for large file processing
- File history and management interface

**Key Features Implemented**:
- ✅ Added third tab "Corrective Maintenance" to existing tabbed interface
- ✅ File upload component for corrective maintenance Excel files
- ✅ Automatic business unit assignment based on Applications column patterns
- ✅ PAW (Pending Actual Week) column showing current week status with Yes/No indicators
- ✅ Clickable hyperlinks in Request ID and Subject columns
- ✅ Hyperlink preservation through manual select-and-copy functionality
- ✅ Proper loading states and error handling
- ✅ Spanish column name handling and data processing- [x] Define the new feature requirements and plan steps
  - Gather all details from the user to build out the todo list.
- [x] Create weekly-report module structure in core
  - Create a new 'weekly--report' module in packages/core/src/modules/ following the domain-driven design pattern (with domain/, application/, and infrastructure/ subdirectories).
- [x] Implement parent-child Excel data loading
  - Implement Excel data loading for parent-child report (translate column names to English in code, keep data in Spanish for now, translate later when saving to DB).
- [x] Define domain entities for weekly reports
  - Define ParentChildRelationship entity and related domain objects (e.g., report data structures, validation schemas).
- [x] Create repository interfaces in domain layer
  - Create repository interfaces for parent-child relationship data access and persistence.
- [x] Implement application services for report generation
  - Implement WeeklyReportService and other application services to orchestrate report generation logic.
- [x] Implement infrastructure layer (repositories and exporters)
  - Implement repository classes, Excel parsers, and data adapters following existing patterns.
- [x] Add database schema and migrations if needed
  - Add parent_child_relationships table and migration for storing parent-child data.
- [x] Inspect existing implementations for reference
  - Inspected existing incident-tagging implementations for reference on Excel parsing, domain objects, repositories, and database storage patterns.
- [x] Create parent-child database table
  - Created 'parent_child_relationships' table with migration.
- [x] Create main process module for weekly report IPC handlers
  - Created WeeklyReportModule in packages/main/src/modules/ for IPC handlers.
- [x] Update preload to expose weekly report APIs
  - Exposed new weekly report APIs in packages/preload/ with base64-encoded keys.
- [x] Add renderer routes and UI components for weekly reports
  - Added weekly-report route and React component for viewing relationships.
- [x] Update configuration files and constants
  - Updated preloadApiKeys.ts and other configs.
- [x] Fix Excel parsing for rich text hyperlinks
  - Fixed extractCellValueAndLink function to properly handle ExcelJS rich text objects containing hyperlinks
  - [x] Update UI to attach links to values instead of separate columns
  - Removed separate "Parent Link" and "Child Link" columns, made Request IDs directly clickable
- [x] Fix external link functionality for Electron
  - Replaced HTML anchor tags with button elements using Electron's shell.openExternal() API
- [x] Validate parsing with real Excel data
  - Successfully parsed 6,704 parent-child relationships from REP02 Excel file
- [x] Implement Phase 2: Aggregated Data Analysis
  - Added tabbed interface with Raw Data and Aggregated Data views
  - Implemented database aggregation queries with GROUP BY and COUNT
  - Added clickable hyperlinks with clipboard functionality for link preservation
  - Completed UI with proper loading states and error handling
- [ ] Plan Phase 3: Multi-Excel File Processing
  - Define requirements for handling multiple Excel file types
  - Design file type detection and parsing logic
  - Plan batch processing and data merging capabilities
- [x] Analyze "XD SEMANAL CORRECTIVO" Excel file structure
- [x] Design corrective maintenance data model
- [x] Implement Spanish column name handling
- [x] Create CorrectiveMaintenance entity and domain objects
- [x] Add corrective_maintenance database table
- [x] Implement Excel parsing for corrective maintenance data
- [x] Add IPC handlers for corrective maintenance processing
- [x] Add corrective maintenance tab to UI
- [x] Implement corrective maintenance data loading and display
- [x] Implement PAW (Pending Actual Week) column functionality
  - Add PAW column as second column showing current week status
  - Implement date parsing for "dd/MM/yyyy HH:mm" format (e.g., "22/09/2025 09:49")
  - Use Luxon for reliable week boundary calculations
  - Display Yes/No indicators for current week tickets## Current Status

**Phase 1 (Parent-Child Data Load) - COMPLETE ✅**

**Phase 2 (Aggregated Data Analysis) - COMPLETE ✅**

**Phase 3 (Multi-Excel File Processing & Corrective Maintenance) - COMPLETE ✅**

**Translation Implementation - COMPLETE ✅**

The application now successfully:
- Loads parent-child relationship data from "REP02 padre hijo" Excel files
- Stores data in the database with proper migrations
- Displays relationships in a user-friendly table with clickable hyperlinks
- Includes file upload functionality for processing new Excel files
- Provides aggregated data analysis with tabbed interface
- Supports hyperlink preservation through manual select-and-copy
- Builds and runs without errors in development mode
- **NEW**: Loads corrective maintenance data from "XD SEMANAL CORRECTIVO" Excel files
- **NEW**: Displays corrective maintenance records with PAW (Pending Actual Week) column
- **NEW**: Automatically assigns business units based on Applications column values
- **NEW**: Shows current week status for maintenance tickets with Yes/No indicators
- **NEW**: ETA column with formatted display ("27-Oct") and tooltip showing original date ("27/10/2025 17:42")
- **NEW**: Translation functionality using OPUS model (Xenova/opus-mt-es-en) for Spanish to English translation
- **NEW**: Manual translation trigger via button (not automatic)
- **NEW**: Technical term preservation during translation
- **NEW**: Batch translation processing with progress tracking

**Key Technical Challenges Resolved:**
- **Rich Text Hyperlink Parsing**: Fixed ExcelJS rich text object handling to extract work order IDs and URLs from complex hyperlink structures
- **UI Link Attachment**: Redesigned table to attach links directly to Request ID values instead of separate columns for cleaner UX
- **Electron External Links**: Implemented proper external link handling using Electron's shell.openExternal() API instead of HTML anchor tags
- **Data Aggregation**: Implemented database aggregation queries with GROUP BY and COUNT operations
- **Hyperlink Preservation**: Added clipboard functionality to preserve hyperlinks when manually selecting and copying
- **Data Validation**: Successfully parsed and validated 6,704 parent-child relationships from real Excel data
- **Spanish Column Handling**: Extended Excel parsing to handle Spanish column names and data in corrective maintenance reports
- **Business Unit Assignment**: Implemented automatic business unit assignment based on Applications column patterns
- **PAW Date Parsing**: Implemented Luxon-based date parsing for European format "dd/MM/yyyy HH:mm" with current week detection
- **ETA Formatting**: Implemented frontend date formatting for ETA column with tooltip showing original values

**Technical Implementation:**
- Domain-driven architecture with clean separation of concerns
- Excel parsing with hyperlink extraction using ExcelJS (handles rich text objects)
- SQL.js database with transactional operations and aggregation queries
- Secure IPC communication with base64-encoded API exposure
- React UI with TanStack Router for navigation and tabbed interfaces
- TypeScript throughout with proper error handling and clipboard integration
- **NEW**: Multi-file Excel processing supporting both parent-child and corrective maintenance formats
- **NEW**: Spanish language support for column names and data processing
- **NEW**: Automatic business unit assignment with pattern matching
- **NEW**: PAW (Pending Actual Week) column with Luxon date parsing and week boundary calculations
- **NEW**: ETA column formatting with tooltip showing original date values
- **NEW**: Translation system using @xenova/transformers OPUS model (Xenova/opus-mt-es-en)
- **NEW**: Manual translation trigger via UI button (not automatic execution)
- **NEW**: Technical term preservation during translation process
- **NEW**: Batch translation processing with progress tracking and error handling

**Phase 3 (Multi-Excel File Processing) - COMPLETE ✅**

**Objective**: Extend the weekly report system to handle multiple Excel file types and provide enhanced data processing capabilities, starting with the "XD SEMANAL CORRECTIVO" corrective maintenance report.

**Requirements**:
- Support for loading "XD SEMANAL CORRECTIVO" Excel reports (Spanish)
- File type detection and appropriate parsing logic for corrective maintenance data
- Enhanced data validation and error reporting for maintenance records
- Integration with existing parent-child relationship system
- Progress indicators for large file processing
- File history and management interface

**Specific Excel File: "XD SEMANAL CORRECTIVO"**
- **Language**: Spanish column names and data
- **Purpose**: Weekly corrective maintenance report
- **Expected Structure**: To be analyzed and documented
- **Integration**: Link with existing parent-child relationship data
- **Data Types**: Maintenance records, work orders, corrective actions

**Technical Implementation**:
- Extend Excel parsing infrastructure to handle Spanish column names
- Add file type detection based on sheet names and column structures
- Implement data validation pipelines with detailed error reporting
- Create maintenance record domain entities and services
- Add database tables for corrective maintenance data
- Implement data correlation between corrective reports and existing relationships

**Technical Implementation**:
- Extend Excel parsing infrastructure to handle multiple file formats
- Add file type detection based on sheet names and column structures
- Implement data validation pipelines with detailed error reporting
- Create batch processing queue system
- Add file metadata storage and tracking
- Implement data merging strategies for overlapping records
- Add progress tracking and cancellation support

**Database Changes**:
- Add file processing history table
- Extend parent_child_relationships table with source file metadata
- Add data quality and validation status tracking
- Consider partitioning strategies for large datasets

**UI/UX for Corrective Maintenance Tab**:
- Add third tab "Corrective Maintenance" to existing tabbed interface
- Add new tab "Monthly Report Data" before "Corrective Maintenance"
- Follow same design pattern as Raw Data and Aggregated Data tabs
- **File Upload Button**: Include file input component similar to ParentChildExcelImport for loading corrective maintenance Excel files
- Table columns: **Business Unit**, Request ID (with hyperlink), Created Time, Applications, Categorization, Request Status, Module, Subject (with hyperlink), Priority, ETA, RCA
- **Business Unit Assignment**: Automatically assign business unit based on Applications column values:
  - If Applications contains "APP - Gestiona tu Negocio (SE)" or "APP - Crecer es Ganar (FFVV)" or "Portal FFVV" → assign "FFVV"
  - If Applications contains "Somos Belcorp 2.0" or "APP - SOMOS BELCORP" → assign "SB"
  - If Applications contains "Unete 3.0" → assign "UB-3"
  - If Applications contains "Unete 2.0" → assign "UN-2"
  - If Applications contains "Catálogo Digital" → assign "CD"
  - **Required Field**: Throw error if no matching condition found (business_unit must have a value)
- Clickable hyperlinks in Request ID and Subject columns using button elements with shell.openExternal()
- **Hyperlink Copy Preservation**: Implement table copy event handler (like handleTableCopy) to preserve hyperlinks when manually selecting and copying table data
- Loading states and error handling consistent with existing tabs
- File upload component for corrective maintenance Excel files
- Manual select-and-copy hyperlink preservation functionality
- **Business Unit Filtering**: Add checkboxes for each business unit in the Corrective Maintenance tab
  - Each business_unit (FFVV, SB, UB-3, UN-2, CD) should have a checkbox
  - When a checkbox is activated, retrieve and display all records for that respective business_unit
  - Default state: SB business_unit checkbox active on page load
  - Selection behavior: Only one checkbox can be active at a time, or all can be unchecked (allowing view of all records when none selected)
- **Enlaces Column**: Add new column "Enlaces" (Spanish for "Links") next to Priority column in Corrective Maintenance tab
  - Display aggregate count of parent-child relationships for each corrective maintenance record
  - Values represent the number of child requests linked to each parent request
  - Implement database query to count related parent-child relationships
  - Show "0" when no relationships exist for a given request ID

**Monthly Report Data Tab**:
- Add new tab "Monthly Report Data" before "Corrective Maintenance" tab
- Load data from "XD 2025 DATA INFORME MENSUAL - Current Month.xlsx" Excel file
- **Sheet**: "ManageEngine Report Framework"
- **Total Records**: 245 data rows (246 total including header)
- **Language**: Spanish (all column names and data in Spanish)
- **Purpose**: Monthly incident management report with comprehensive incident tracking
- **Columns** (Spanish → English mapping):
  - `Aplicativos` → `Applications`
  - `Categorización` → `Categorization`
  - `Request ID` → `RequestId` (with hyperlink)
  - `Created Time` → `CreatedTime` (format: "dd/MM/yyyy HH:mm" e.g., "01/09/2025 10:07")
  - `Request Status` → `RequestStatus`
  - `Modulo.` → `Module`
  - `Subject` → `Subject` (with hyperlink)
  - `Priority` → `Priority`
  - `ETA` → `ETA`
  - `Información Adicional` → `AdditionalInfo`
  - `Resolved Time` → `ResolvedTime` (format: "dd/MM/yyyy HH:mm" e.g., "03/09/2025 11:11")
  - `Países Afectados` → `AffectedCountries`
  - `Recurrencia` → `Recurrence`
  - `Technician` → `Technician`
  - `Jira` → `Jira`
  - `Problem ID` → `ProblemId` (with hyperlink)
  - `Linked Request Id` → `LinkedRequestId` (with hyperlink)
  - `Request OLA Status` → `RequestOLAStatus`
  - `Grupo Escalamiento` → `EscalationGroup`
  - `Aplicactivos Afectados` → `AffectedApplications`
  - `¿Este Incidente se debió Resolver en Nivel 1?` → `ShouldResolveLevel1`
  - `Campaña` → `Campaign`
  - `CUV_1` → `CUV1`
  - `Release` → `Release`
  - `RCA` → `RCA`
- **Data Types**: All cells use rich text format, hyperlinks in Request ID, Subject, Problem ID, and Linked Request Id columns
- **Hyperlink Pattern**: `https://sdp.belcorp.biz/WorkOrder.do?PORTALID=1&woMode=viewWO&woID={workOrderId}`
- **Status Values**: "Closed", "En Mantenimiento Correctivo", etc.
- **Priority Values**: "Alta" (High), "Media" (Medium), "Baja" (Low), "Crítica" (Critical)
- **Business Unit Assignment**: Automatic assignment based on Applications patterns (same as corrective maintenance)
- **Date Formats**: European format "dd/MM/yyyy HH:mm" for Created Time and Resolved Time
- **UI Features**: Clickable hyperlinks, table with all columns, loading states, error handling
- **Hyperlink Copy Preservation**: Implement table copy event handler for manual select-and-copy functionality

**Monthly Report Parsing Requirements**:
- **File Structure**: Single sheet workbook with "ManageEngine Report Framework" as sheet name
- **Header Validation**: All 25 columns must be present and in correct order
- **Data Extraction**: Use `extractCellValueAndLink` utility for hyperlink columns (Request ID, Subject, Problem ID, Linked Request Id)
- **Date Parsing**: European format "dd/MM/yyyy HH:mm" using Luxon DateTime parsing
- **Null Handling**: "No asignado" values should be treated as null/undefined
- **Priority Mapping**: 
  - "Alta" → "High"
  - "Media" → "Medium" 
  - "Baja" → "Low"
  - "Crítica" → "Critical"
- **Business Unit Logic**: Same assignment rules as corrective maintenance
- **Validation Schema**: Create Zod schema similar to `correctiveMaintenanceExcelSchema` but with all 25 columns
- **Domain Entity**: Create `MonthlyReportRecord` entity with all required fields
- **Database Table**: Create `monthly_report_records` table with appropriate columns and indexes
- **Repository Pattern**: Implement repository interface and infrastructure implementation
- **IPC Integration**: Add main process handlers with base64-encoded API keys
- **Error Handling**: Structured error responses with detailed validation messages
- **Translation Support**: Consider adding translation capability for Subject field (similar to corrective maintenance)

**Additional Computed Columns** (not in original Excel):
- **semanal** (weekly): Boolean field indicating if the record is from the current week based on Created Time
  - Use Luxon DateTime to compare Created Time with current week boundaries
  - Display as Yes/No in UI
- **rep** (representative/business unit): Mapped value from Aplicativos column using same business unit assignment logic
  - "Unete 2.0" → "UN-2"
  - "Unete 3.0" → "UB-3"
  - "Somos Belcorp 2.0" → "SB"
  - Other patterns → "FFVV"
- **dia** (day): Day of the month extracted from Created Time
  - Since Excel contains only current month records, extract day number (1-31)
  - Format: integer representing the day
- **week**: Week number of the year extracted from Created Time
  - Use Luxon to get ISO week number
  - Format: integer (1-52)
- **Request Status reporte** (report status): Mapped version of Request Status with business rules
  - "En Mantenimiento Correctivo", "Dev in Progress" → "In L3 Backlog"
  - "Esperando El Cliente" → Keep original value but allow frontend updates with lock mechanism
  - "Nivel 2" → "On going in L2"
  - "Nivel 3" → "On going in L3"
  - "Validado" → "Closed"
  - **Frontend Update**: Add ability to modify "Esperando El Cliente" status from UI
  - **Lock Mechanism**: Once user modifies status, mark as user-modified and prevent further changes
  - **Audit Trail**: Track original vs modified status values
- **Información Adicional reporte** (additional info report): Copy of Información Adicional with validation
  - Copy original Información Adicional value
  - **Validation Rule**: If Request Status reporte maps to "In L3 Backlog", validate that original Información Adicional equals "No asignado"
  - **Error Handling**: Throw validation error if validation fails
- **Enlaces** (links): Count of parent-child relationships for this record
  - Query: `SELECT COUNT(*) FROM parent_child_relationships WHERE childRequestId = monthly_report.requestId`
  - Default: 0 if no relationships found
  - Same implementation as Corrective Maintenance enlaces field
- **Mensaje** (message): Concatenated string for display
  - Format: `{Linked Request Id} --> {Enlaces} Linked tickets`
  - Example: "REQ001 --> 3 Linked tickets"
  - Use Linked Request Id value and Enlaces count
  - Display as read-only informational field
