# Semanal to InDateRange Rename Specification

**Date**: 2025-10-02
**Purpose**: Standardize naming convention from legacy "Semanal" to "InDateRange" throughout the project

## Overview

The project currently uses "Semanal" (Spanish for "weekly") as the naming convention for date range filtering functionality. This needs to be standardized to "InDateRange" to match the `inDateRange` field in the database and improve code clarity.

---

## 1. File Renames (4 files)

### Core Domain Files

| Current Path | New Path | Reason |
|-------------|----------|---------|
| `packages/core/src/modules/weekly-report/domain/semanal-date-range.ts` | `date-range-config.ts` | Core domain entity |
| `packages/core/src/modules/weekly-report/domain/semanal-date-range-repository.ts` | `date-range-config-repository.ts` | Repository interface |
| `packages/core/src/modules/weekly-report/infrastructure/models/semanal-date-range-db.model.ts` | `date-range-config-db.model.ts` | Database model |
| `packages/core/src/modules/weekly-report/infrastructure/adapters/semanal-date-range-db-model-to-domain.adapter.ts` | `date-range-config-db-model-to-domain.adapter.ts` | Adapter |

### Main Process Files

| Current Path | New Path | Reason |
|-------------|----------|---------|
| `packages/main/src/repositories/SqlJsSemanalDateRangeRepository.ts` | `SqlJsDateRangeConfigRepository.ts` | Repository implementation |

### Renderer Files

| Current Path | New Path | Reason |
|-------------|----------|---------|
| `packages/renderer/src/components/SemanalDateRangeSettings.tsx` | `DateRangeConfigSettings.tsx` | Settings component |
| `packages/renderer/src/components/SemanalFilter.tsx` | `InDateRangeFilter.tsx` | Filter component |

---

## 2. Class and Type Renames

### Core Domain (`packages/core`)

**File: `domain/semanal-date-range.ts` (→ `date-range-config.ts`)**
```typescript
// OLD
export class SemanalDateRange {
    static createDefaultRange(): SemanalDateRange
    ...
}

// NEW
export class DateRangeConfig {
    static createDefaultRange(): DateRangeConfig
    ...
}
```

**File: `domain/semanal-date-range-repository.ts` (→ `date-range-config-repository.ts`)**
```typescript
// OLD
export interface SemanalDateRangeRepository {
    save(range: SemanalDateRange): Promise<SemanalDateRange>;
    getActive(): Promise<SemanalDateRange | null>;
    ...
}

// NEW
export interface DateRangeConfigRepository {
    save(range: DateRangeConfig): Promise<DateRangeConfig>;
    getActive(): Promise<DateRangeConfig | null>;
    ...
}
```

**File: `infrastructure/models/semanal-date-range-db.model.ts`**
```typescript
// OLD
export interface SemanalDateRangeDbModel { ... }
export const semanalDateRangeDbSchema = z.object({ ... });

// NEW
export interface DateRangeConfigDbModel { ... }
export const dateRangeConfigDbSchema = z.object({ ... });
```

**File: `infrastructure/adapters/semanal-date-range-db-model-to-domain.adapter.ts`**
```typescript
// OLD
export function semanalDateRangeDbModelToDomain(dbModel: SemanalDateRangeDbModel): SemanalDateRange
export function semanalDateRangeDomainToDbModel(domain: SemanalDateRange): SemanalDateRangeDbModel

// NEW
export function dateRangeConfigDbModelToDomain(dbModel: DateRangeConfigDbModel): DateRangeConfig
export function dateRangeConfigDomainToDbModel(domain: DateRangeConfig): DateRangeConfigDbModel
```

### Main Process (`packages/main`)

**File: `repositories/SqlJsSemanalDateRangeRepository.ts`**
```typescript
// OLD
export class SqlJsSemanalDateRangeRepository implements SemanalDateRangeRepository {
    async save(range: SemanalDateRange): Promise<SemanalDateRange>
    async getActive(): Promise<SemanalDateRange | null>
    ...
}

// NEW
export class SqlJsDateRangeConfigRepository implements DateRangeConfigRepository {
    async save(range: DateRangeConfig): Promise<DateRangeConfig>
    async getActive(): Promise<DateRangeConfig | null>
    ...
}
```

### Renderer (`packages/renderer`)

**File: `components/SemanalDateRangeSettings.tsx`**
```typescript
// OLD
interface SemanalDateRange { ... }
interface SemanalDateRangeSettingsProps { ... }
const SemanalDateRangeSettings: React.FC<...>
export default SemanalDateRangeSettings;

// NEW
interface DateRangeConfig { ... }
interface DateRangeConfigSettingsProps { ... }
const DateRangeConfigSettings: React.FC<...>
export default DateRangeConfigSettings;
```

**File: `components/SemanalFilter.tsx`**
```typescript
// OLD
interface SemanalFilterProps { ... }
const SemanalFilter: React.FC<SemanalFilterProps>
export default SemanalFilter;

// NEW
interface InDateRangeFilterProps { ... }
const InDateRangeFilter: React.FC<InDateRangeFilterProps>
export default InDateRangeFilter;
```

---

## 3. Function and Variable Renames

### Renderer (`packages/renderer/src/routes/weekly-report.tsx`)

**Imports:**
```typescript
// OLD
import SemanalDateRangeSettings from "@/components/SemanalDateRangeSettings";
import SemanalFilter from "@/components/SemanalFilter";

// NEW
import DateRangeConfigSettings from "@/components/DateRangeConfigSettings";
import InDateRangeFilter from "@/components/InDateRangeFilter";
```

**State Variables:**
```typescript
// OLD
const [semanalRangeChangedMessage, setSemanalRangeChangedMessage] = useState<string | null>(null);
const [semanalFilterMode, setSemanalFilterMode] = useState<"inRange" | "outOfRange" | "showAll">("inRange");
const [correctiveSemanalFilterMode, setCorrectiveSemanalFilterMode] = useState<...>;
const [correctiveSemanalRangeChangedMessage, setCorrectiveSemanalRangeChangedMessage] = useState<...>;

// NEW
const [dateRangeChangedMessage, setDateRangeChangedMessage] = useState<string | null>(null);
const [inDateRangeFilterMode, setInDateRangeFilterMode] = useState<"inRange" | "outOfRange" | "showAll">("inRange");
const [correctiveInDateRangeFilterMode, setCorrectiveInDateRangeFilterMode] = useState<...>;
const [correctiveDateRangeChangedMessage, setCorrectiveDateRangeChangedMessage] = useState<...>;
```

**Computed Values:**
```typescript
// OLD
const semanalCounts = useMemo(() => { ... });
const correctiveSemanalCounts = useMemo(() => { ... });

// NEW
const inDateRangeCounts = useMemo(() => { ... });
const correctiveInDateRangeCounts = useMemo(() => { ... });
```

**Comments:**
```typescript
// OLD
// State for tracking semanal date range changes
// State for semanal filtering - default to 'inRange' to show only records within the semanal range
// Apply semanal filter on top of request status filter
// Calculate counts for the semanal filter component

// NEW
// State for tracking date range configuration changes
// State for inDateRange filtering - default to 'inRange' to show only records within the date range
// Apply inDateRange filter on top of request status filter
// Calculate counts for the inDateRange filter component
```

### Preload (`packages/preload/src/index.ts`)

**Functions:**
```typescript
// OLD
async function getSemanalDateRange() { ... }
async function saveSemanalDateRange(data: { ... }) { ... }
async function getDefaultSemanalDateRange() { ... }

// NEW
async function getDateRangeConfig() { ... }
async function saveDateRangeConfig(data: { ... }) { ... }
async function getDefaultDateRangeConfig() { ... }
```

**Exports:**
```typescript
// OLD
export {
    getSemanalDateRange,
    saveSemanalDateRange,
    getDefaultSemanalDateRange,
    ...
};

// NEW
export {
    getDateRangeConfig,
    saveDateRangeConfig,
    getDefaultDateRangeConfig,
    ...
};
```

**Comments:**
```typescript
// OLD
// Semanal date range operations

// NEW
// Date range configuration operations
```

### Preload API Keys (`packages/renderer/src/constants/preloadApiKeys.ts`)

```typescript
// OLD
getSemanalDateRange: btoa("getSemanalDateRange") as keyof Window,
saveSemanalDateRange: btoa("saveSemanalDateRange") as keyof Window,
getDefaultSemanalDateRange: btoa("getDefaultSemanalDateRange") as keyof Window,

// NEW
getDateRangeConfig: btoa("getDateRangeConfig") as keyof Window,
saveDateRangeConfig: btoa("saveDateRangeConfig") as keyof Window,
getDefaultDateRangeConfig: btoa("getDefaultDateRangeConfig") as keyof Window,
```

---

## 4. IPC Channel Names

### Main Process (`packages/main/src/modules/MonthlyReportModule.ts`)

```typescript
// OLD
ipcMain.handle("getSemanalDateRange", async () => { ... });
ipcMain.handle("saveSemanalDateRange", async (_event, data) => { ... });
ipcMain.handle("getDefaultSemanalDateRange", async () => { ... });

// NEW
ipcMain.handle("getDateRangeConfig", async () => { ... });
ipcMain.handle("saveDateRangeConfig", async (_event, data) => { ... });
ipcMain.handle("getDefaultDateRangeConfig", async () => { ... });
```

### Preload (`packages/preload/src/index.ts`)

```typescript
// OLD
return ipcRenderer.invoke("getSemanalDateRange");
return ipcRenderer.invoke("saveSemanalDateRange", data);
return ipcRenderer.invoke("getDefaultSemanalDateRange");

// NEW
return ipcRenderer.invoke("getDateRangeConfig");
return ipcRenderer.invoke("saveDateRangeConfig", data);
return ipcRenderer.invoke("getDefaultDateRangeConfig");
```

---

## 5. Database Changes

### Table Name (`packages/database/src/table-names.ts`)

```typescript
// OLD
export const TABLE_NAMES = {
    ...
    SEMANAL_DATE_RANGES: "semanal_date_ranges",
    ...
};

// NEW
export const TABLE_NAMES = {
    ...
    DATE_RANGE_CONFIGS: "date_range_configs",
    ...
};
```

### Migration (`packages/database/src/migrations.ts`)

**New Migration to Rename Table:**
```typescript
{
    id: "009_rename_semanal_to_date_range_config",
    description: "Rename semanal_date_ranges table to date_range_configs",
    dependencies: ["006_create_semanal_date_ranges"],
    up: (db) => {
        // Rename table
        db.run(`ALTER TABLE semanal_date_ranges RENAME TO date_range_configs`);

        // Recreate indexes with new table name
        db.run(`DROP INDEX IF EXISTS idx_semanal_date_ranges_active`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_date_range_configs_active ON date_range_configs(isActive)`);

        console.log("✅ Renamed semanal_date_ranges to date_range_configs");
    },
    down: (db) => {
        // Revert table name
        db.run(`ALTER TABLE date_range_configs RENAME TO semanal_date_ranges`);

        // Recreate original indexes
        db.run(`DROP INDEX IF EXISTS idx_date_range_configs_active`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_semanal_date_ranges_active ON semanal_date_ranges(isActive)`);
    }
}
```

**Update Existing References in Migrations:**
- Migration 006: Comments and descriptions should reference "date range config" instead of "semanal"
- Migration 007 rollback: Update table reference

---

## 6. UI Text Changes

### Component Text (`packages/renderer/src/components/DateRangeConfigSettings.tsx`)

```typescript
// OLD
<h3>Semanal Date Range</h3>
<p>Configure the date range for Semanal calculations</p>
"Failed to load semanal date range settings"
"Failed to save semanal date range"

// NEW
<h3>Date Range Configuration</h3>
<p>Configure the date range for filtering records by date</p>
"Failed to load date range configuration"
"Failed to save date range configuration"
```

### Filter Text (`packages/renderer/src/components/InDateRangeFilter.tsx`)

```typescript
// OLD
<h4>Semanal Date Range Filter</h4>
<p>Filter records based on whether they fall within the configured semanal date range</p>
"Showing records within semanal range"
"Showing records outside semanal range"

// NEW
<h4>Date Range Filter</h4>
<p>Filter records based on whether they fall within the configured date range</p>
"Showing records within date range"
"Showing records outside date range"
```

### Page Text (`packages/renderer/src/routes/weekly-report.tsx`)

```typescript
// OLD
{/* Semanal Date Range Settings */}
{/* Warning message when semanal range has been changed */}
"to reflect the new Semanal calculation"
{/* Semanal Range Filter */}

// NEW
{/* Date Range Configuration Settings */}
{/* Warning message when date range has been changed */}
"to reflect the new date range configuration"
{/* Date Range Filter */}
```

---

## 7. Core Exports (`packages/core/src/index.ts`)

```typescript
// OLD
// Semanal Date Range Exports
export * from "./modules/weekly-report/domain/semanal-date-range.js";
export * from "./modules/weekly-report/domain/semanal-date-range-repository.js";
export * from "./modules/weekly-report/infrastructure/adapters/semanal-date-range-db-model-to-domain.adapter.js";
export * from "./modules/weekly-report/infrastructure/models/semanal-date-range-db.model.js";

// NEW
// Date Range Configuration Exports
export * from "./modules/weekly-report/domain/date-range-config.js";
export * from "./modules/weekly-report/domain/date-range-config-repository.js";
export * from "./modules/weekly-report/infrastructure/adapters/date-range-config-db-model-to-domain.adapter.js";
export * from "./modules/weekly-report/infrastructure/models/date-range-config-db.model.js";
```

---

## 8. Parser and Service References

### Parsers

**`corrective-maintenance-excel-parser.ts`:**
```typescript
// OLD
constructor(
    private readonly businessUnitDetector?: (applications: string) => string,
    private readonly semanalDateRange?: SemanalDateRange
) {}

// NEW
constructor(
    private readonly businessUnitDetector?: (applications: string) => string,
    private readonly dateRangeConfig?: DateRangeConfig
) {}
```

**`excel-monthly-report-parser.ts`:**
```typescript
// OLD
private semanalDateRange?: SemanalDateRange;

// NEW
private dateRangeConfig?: DateRangeConfig;
```

### Services

**`WeeklyReportService.ts`:**
```typescript
// OLD
async parseCorrectiveMaintenanceExcel(params: {
    ...
    semanalDateRange: SemanalDateRange | null;
}): Promise<...>

// NEW
async parseCorrectiveMaintenanceExcel(params: {
    ...
    dateRangeConfig: DateRangeConfig | null;
}): Promise<...>
```

---

## 9. Scripts to Update

### Test Scripts

1. **`scripts/test-monthly-report-parser.ts`**
2. **`scripts/check-database-columns.ts`**
3. **`scripts/debug-monthly-indaterange.ts`**
4. **`scripts/query-semanal-module-counts.ts`** → Rename to `query-indaterange-module-counts.ts`
5. **`scripts/test-corrective-maintenance-parser.ts`**

---

## 10. Module References

### WeeklyReportModule (`packages/main/src/modules/WeeklyReportModule.ts`)

```typescript
// OLD
import { SqlJsSemanalDateRangeRepository } from "../repositories/SqlJsSemanalDateRangeRepository.js";
const semanalRepo = new SqlJsSemanalDateRangeRepository();
const semanalDateRange = await semanalRepo.getCurrent();

// NEW
import { SqlJsDateRangeConfigRepository } from "../repositories/SqlJsDateRangeConfigRepository.js";
const dateRangeConfigRepo = new SqlJsDateRangeConfigRepository();
const dateRangeConfig = await dateRangeConfigRepo.getCurrent();
```

### MonthlyReportModule (`packages/main/src/modules/MonthlyReportModule.ts`)

```typescript
// OLD
const semanalRepo = new SqlJsSemanalDateRangeRepository();

// NEW
const dateRangeConfigRepo = new SqlJsDateRangeConfigRepository();
```

---

## 11. Documentation Updates

### Files to Update

1. **`CLAUDE.md`** - Update all references to "semanal"
2. **`WeeklyReportPlan.md`** - Update terminology
3. **`excel-structure-analysis.md`** - Update field descriptions
4. **`SCRIPTS.md`** - Update script names and descriptions
5. **`INCIDENT_OVERVIEW_SPECIFICATION.md`** - Update terminology

---

## 12. Implementation Checklist

- [ ] **Phase 1: Create Specification Document** ✅ (This document)
- [ ] **Phase 2: Database Layer**
  - [ ] Update `table-names.ts`
  - [ ] Create migration 009 to rename table
  - [ ] Update all queries in repositories
- [ ] **Phase 3: Core Domain**
  - [ ] Rename 4 core files
  - [ ] Update class/type/interface names
  - [ ] Update function names
  - [ ] Update exports in `index.ts`
- [ ] **Phase 4: Main Process**
  - [ ] Rename repository file
  - [ ] Update repository implementation
  - [ ] Update IPC handler names in MonthlyReportModule
  - [ ] Update IPC handler names in WeeklyReportModule
- [ ] **Phase 5: Preload Bridge**
  - [ ] Update function names
  - [ ] Update IPC channel names
  - [ ] Update exports
  - [ ] Update preloadApiKeys.ts
- [ ] **Phase 6: Renderer/UI**
  - [ ] Rename component files
  - [ ] Update component names and exports
  - [ ] Update imports in weekly-report.tsx
  - [ ] Update all state variable names
  - [ ] Update all function names
  - [ ] Update all UI text
- [ ] **Phase 7: Scripts**
  - [ ] Update test scripts
  - [ ] Rename query-semanal-module-counts.ts
- [ ] **Phase 8: Documentation**
  - [ ] Update CLAUDE.md
  - [ ] Update WeeklyReportPlan.md
  - [ ] Update other documentation
- [ ] **Phase 9: Build & Test**
  - [ ] Build all packages
  - [ ] Run migrations
  - [ ] Test all affected functionality
  - [ ] Verify no broken references

---

## 13. Risk Assessment

### High Risk
- **Database migration**: Could cause data loss if not tested properly
- **IPC channel renames**: Will break existing functionality if not updated everywhere

### Medium Risk
- **File renames**: Git history might be harder to track
- **Import paths**: Must be updated everywhere

### Low Risk
- **Variable/function renames**: Caught by TypeScript compiler
- **UI text changes**: No functional impact

---

## 14. Testing Strategy

1. **Unit Tests**: Verify renamed classes still work
2. **Integration Tests**: Verify IPC communication works
3. **Database Tests**: Verify migration works and data is preserved
4. **UI Tests**: Verify components render correctly
5. **E2E Tests**: Verify full user workflows

---

## Notes

- **Why "DateRangeConfig" instead of "DateRange"?**
  - More descriptive: It's a configuration object, not just a date range
  - Avoids confusion with native Date objects
  - Matches the pattern of other config objects in the codebase

- **Why "InDateRangeFilter" instead of "DateRangeFilter"?**
  - Directly relates to the `inDateRange` field
  - Clarifies it's filtering based on the boolean flag
  - Consistent with existing `inDateRange` terminology

- **Legacy References to Keep**:
  - Database column name `inDateRange` (already correct, no change needed)
  - Comments explaining the old "semanal" terminology for historical context

---

**End of Specification**
