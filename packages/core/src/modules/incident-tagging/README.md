# Incident Tagging Module

This module provides a clean, domain-driven architecture for parsing Excel tag reports and managing incident tagging data in the Belcorp Report application.

## Architecture

The module follows clean architecture principles:

- **Domain Layer**: Defines interfaces, business entities, and repository contracts
- **Application Layer**: Contains use cases and service containers (TagService)
- **Infrastructure Layer**: Contains concrete implementations (parsers, adapters, schemas, models)

## Usage

### Using TagService

```typescript
import { createTagService } from "@app/core";

const tagService = createTagService();

// Find all tags
const tags = await tagService.findAllTags(tagRepository);

// Parse tag report
const result = await tagService.parseTagReport({
  fileBuffer,
  fileName: "report.xlsx",
  repository: tagRepository
});
```

### Using Individual Use Cases

```typescript
import { TagFinder, ProcessTagBatchCreator } from "@app/core";

// Find tags with custom adapter
const finder = new TagFinder({ tagRepository, adapter: customAdapter });
const tags = await finder.execute();

// Process tag batch
const processor = new ProcessTagBatchCreator({
  tagReportParser: new ExcelTagReportParser(),
  tagRepository
});
const result = await processor.execute({ fileBuffer, fileName });
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

### Tag Entity

```typescript
class Tag {
  constructor(
    public readonly requestId: string,
    public readonly createdTime: string,
    public readonly requestIdLink?: string,
    public readonly informacionAdicional: string,
    public readonly modulo: string,
    public readonly problemId: string,
    public readonly problemIdLink?: string,
    public readonly linkedRequestId: string,
    public readonly linkedRequestIdLink?: string,
    public readonly jira: string,
    public readonly categorizacion: string,
    public readonly technician: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
```

### TagReportParseResult

```typescript
interface TagReportParseResult {
  success: boolean;
  fileName: string;
  sheet: TagReportSheet;
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
