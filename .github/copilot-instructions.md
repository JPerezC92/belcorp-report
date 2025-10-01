# Belcorp Report - AI Coding Instructions

## Project Architecture

This is a **monorepo Electron application** for processing Belcorp incident tagging reports. Built with Vite, React, TanStack Router, and TypeScript using **domain-driven design** with clean architecture principles.

### Core Package Structure
- **`packages/core/`** - Business logic with domain-driven design (entities, services, repositories)
- **`packages/database/`** - SQL.js database layer with migrations and persistence
- **`packages/main/`** - Electron main process with modular architecture
- **`packages/preload/`** - Secure IPC bridge with base64-encoded API exposure
- **`packages/renderer/`** - React UI with TanStack Router (hash history for Electron)

### Domain-Driven Architecture

**Clean Architecture Pattern** in `packages/core/src/modules/incident-tagging/`:
```
domain/           # Business entities and rules
├── tag.ts                    # Tag entity with factory method
├── tag.repository.ts         # Repository interface contracts
└── tag-report-parser.ts      # Domain services

application/     # Use cases and application services
├── TagService.ts             # Main service orchestrating domain operations
└── ForTaggingDataExcelService.ts

infrastructure/  # External concerns (DB, Excel parsing, APIs)
├── parsers/                 # Excel parsing implementations
├── repositories/            # Repository implementations
├── adapters/                # Data transformation adapters
└── schemas/                 # Zod validation schemas
```

**Key Pattern**: Services inject repository interfaces, not implementations. Always use dependency injection.

### Critical Communication Patterns

**IPC Channels** (main ↔ renderer via preload):
```typescript
// Preload exposes functions with base64 encoding for security
contextBridge.exposeInMainWorld(btoa("parseTagReport"), parseTagReport);

// Renderer accesses via centralized keys
const result = await window[preloadApiKeys.parseTagReport](buffer, filename);
```

**Module System** in main process:
```typescript
const moduleRunner = createModuleRunner()
  .init(createDatabaseModule())      // Always first - provides DB
  .init(createTagDataModule())       // IPC handlers for tag operations
  .init(createForTaggingDataExcelModule()) // Excel processing handlers
```

### Excel Processing Workflow

**Expected Format**: ManageEngine reports with sheet "ManageEngine Report Framework"
**Validation**: Zod schemas + header validation + row processing
**Error Handling**: Structured error responses, never throw exceptions to renderer

**Data Flow**:
1. Renderer sends `ArrayBuffer` + filename via IPC
2. Main process validates Excel structure and headers
3. Domain services parse rows using adapters and schemas
4. Repository saves to SQL.js database with transactions
5. Structured result returned (success/error with details)

### Database Layer

**SQL.js with Custom Manager** (`packages/database/`):
```typescript
const config: DatabaseManagerConfig = {
  path: `${app.getPath("userData")}/app-database.db`,
  autoSave: true,
  autoSaveInterval: 30000,
  enableTransactions: true,
  backupOnMigration: true
};
```

**Migration Pattern**: Versioned SQL files in `packages/database/src/migrations/`

### Development Workflow

**Multi-Stage Development**:
```bash
# Build packages individually (recommended for faster, more reliable builds)
pnpm run build:core
pnpm run build:database

# Or watch individual packages
pnpm run dev:core
pnpm run dev:database

# Start full development mode (libs + electron app together)
pnpm run dev:full

# Production build
pnpm run build && pnpm run compile
```

**Note**: Avoid `pnpm run dev:libs` (parallel builds) as they can be slow and unreliable. Build packages one by one for better performance. Use `pnpm run dev:full` for the complete development experience.

**Hot Reload**: Renderer HMR, main process restarts via custom Vite plugin

### Security Model

**Context Isolation**: Preload scripts run in browser context but can't access Node.js
**Origin Restrictions**: `allowInternalOrigins()` + `allowExternalUrls()` modules
**API Exposure**: Base64-encoded function names prevent direct access

### Key Conventions

**File Extensions**: `.ts`/`.tsx` for TypeScript, `.js` for ESM modules
**Imports**: Relative within packages, `@app/*` between packages
**Error Handling**: Domain services return structured results, never throw
**Validation**: Zod schemas for all external data (Excel rows, IPC messages)
**Repository Pattern**: Interfaces in domain, implementations in infrastructure

### Adding Features

**New Domain Logic**:
1. Add entity to `packages/core/src/modules/incident-tagging/domain/`
2. Create repository interface and service
3. Implement infrastructure adapters and repositories
4. Add IPC handler in main process module
5. Expose via preload with base64 key
6. Add to centralized `preloadApiKeys.ts`

**Database Changes**:
1. Create migration in `packages/database/src/migrations/`
2. Update table constants in `table-names.ts`
3. Add repository methods following existing patterns

**UI Features**:
1. Add route file to `packages/renderer/src/routes/`
2. Use TanStack Router with hash history
3. Call preload APIs via centralized keys
4. Handle structured error responses

### Excel Processing Specifics

**Column Mapping** (ManageEngine → Domain):
- "Created Time" → `createdTime`
- "Request ID" → `requestId` (with hyperlink)
- "Información Adicional" → `additionalInfo`
- "Categorización" → `categorization`

**Validation Rules**:
- Required columns must exist and have data
- Hyperlinks extracted from Excel cells
- Empty cells become `undefined` in domain objects
- All parsing errors collected and returned as structured response

### Testing Patterns

**E2E Tests**: Playwright launches compiled Electron app, tests real behavior
**Unit Tests**: Focus on domain logic and service orchestration
**Integration**: Repository implementations with in-memory database

### Build & Deployment

**Electron Builder**: Custom config in `electron-builder.mjs`
**Code Signing**: Disabled for development (`forceCodeSigning: false`)
**Distribution**: GitHub releases with auto-updater support
