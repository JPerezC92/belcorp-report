# Tag Report Parser

This module provides a clean, domain-driven architecture for parsing Excel tag reports in the Belcorp Report application.

## Architecture

The parser follows clean architecture principles:

- **Domain Layer**: Defines interfaces and business entities
- **Application Layer**: Provides factory functions for creating parsers
- **Infrastructure Layer**: Contains concrete implementations (Excel parser)

## Usage

### Basic Usage

```typescript
import { createExcelTagReportParser } from "@app/core/modules/incident-tagging/application/tag-report-parser-factory";

// Create a parser instance
const parser = createExcelTagReportParser();

// Parse an Excel file
const result = await parser.parseExcel(fileBuffer, "report.xlsx");

if (result.success) {
  console.log(`Parsed ${result.sheets[0].rows.length} rows`);
  // Access parsed data
  result.sheets[0].rows.forEach(row => {
    console.log(`Request: ${row.requestId.value}, Technician: ${row.technician}`);
  });
} else {
  console.error("Parse failed:", result.error);
}
```

### Using the Factory with Type Parameter

```typescript
import { createTagReportParser } from "@app/core/modules/incident-tagging/application/tag-report-parser-factory";

// Create parser with explicit type
const parser = createTagReportParser('excel');
```

### Direct Import of Interfaces

```typescript
import type { 
  TagReportParser, 
  TagReportData, 
  TagReportParseResult 
} from "@app/core/modules/incident-tagging/domain/tag-report-parser";
```

## Expected Excel Format

The parser expects an Excel file with a sheet named "ManageEngine Report Framework" containing these columns:

1. Created Time
2. Request ID (with hyperlink)
3. Información Adicional  
4. Modulo.
5. Problem ID (with hyperlink)
6. Linked Request Id (with hyperlink)
7. Jira
8. Categorización
9. Technician

## Data Structure

### TagReportData

```typescript
interface TagReportData {
  createdTime: string;
  requestId: { value: string; link: string; };
  informacionAdicional: string;
  modulo: string;
  problemId: { value: string; link: string; };
  linkedRequestId: { value: string; link: string; };
  jira: string;
  categorizacion: string;
  technician: string;
}
```

### TagReportParseResult

```typescript
interface TagReportParseResult {
  success: boolean;
  fileName: string;
  sheets: TagReportSheet[];
  metadata: {
    creator?: string;
    modified?: Date;
    totalSheets: number;
  };
  error?: string;
}
```

## Validation

The parser includes robust validation:

- **Header validation**: Ensures all expected columns are present
- **Row validation**: Uses Zod schemas to validate and transform data
- **Type safety**: Full TypeScript support with proper type definitions

## Error Handling

The parser handles various error scenarios:

- Missing target sheet
- Invalid headers
- Malformed row data
- File parsing errors

All errors are returned as part of the `TagReportParseResult` object rather than throwing exceptions.
