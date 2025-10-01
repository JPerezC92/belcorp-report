# Weekly Report Module

This module provides functionality for generating and managing weekly reports, starting with loading REP02 parent-child relationship data from Excel files.

## Architecture

The module follows clean architecture principles:

- **Domain Layer**: Defines interfaces, business entities, and repository contracts
- **Application Layer**: Contains use cases and service containers (WeeklyReportService)
- **Infrastructure Layer**: Contains concrete implementations (parsers, adapters, schemas, models)

## Current Phase

**Phase 1**: Load REP02 parent-child data from Excel and store in database.

## Expected Excel Format

- **Sheet**: "ManageEngine Report Framework"
- **Columns**:
  - 'Request ID' (with hyperlink)
  - 'Linked Request Id' (with hyperlink)
- **Data**: Request IDs representing parent-child relationships</content>
<parameter name="filePath">d:\projects-tismart\belcorp-report\packages\core\src\modules\weekly-report\README.md
