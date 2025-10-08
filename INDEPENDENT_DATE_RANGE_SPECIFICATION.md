# Independent Date Range Configuration with Global Mode - Specification

## Executive Summary

This specification defines a flexible date range filtering system that allows:
- **Independent date ranges** for Monthly Report and Corrective Maintenance tabs
- **Global Mode** to synchronize both tabs when needed
- **Three range types**: Weekly (auto-calculated), Custom (manual dates), Disabled (all records)
- **Clear visual indicators** showing which mode/range is active
- **Smart warnings** that appear on affected tabs when ranges change

---

## Requirements

### A. Default Behavior
- Global Mode is **OFF** by default
- Each tab starts with **Weekly** range type (Friday-Thursday, auto-calculated)
- When enabling Global Mode: Show confirmation warning about re-uploading Excel files

### B. Range Type Options
Three distinct range types:
1. **Weekly**: Auto-calculated Friday-Thursday (7 days), standard validation
2. **Custom**: User picks any dates, minimal restrictions, can span months
3. **Disabled**: No date filtering, all records have `inDateRange = true`

### C. Migration Strategy
- Database will be recreated (no migration from old data needed)
- Default migration creates:
  - Weekly range for Monthly Report (active)
  - Weekly range for Corrective Maintenance (active)
  - Global Mode setting = OFF

### D. Warning Messages
- **Global Mode ON + Range Changes**: Show warning on BOTH tabs
- **Global Mode OFF + Range Changes**: Show warning only on the affected tab
- Each tab shows indicator of current active range type

---

## Database Schema Changes

### Table: `date_range_configs`

```sql
CREATE TABLE date_range_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rangeType TEXT NOT NULL CHECK(rangeType IN ('weekly', 'custom', 'disabled')),
    scope TEXT NOT NULL CHECK(scope IN ('monthly', 'corrective', 'global')),
    fromDate TEXT,  -- Nullable (NULL for 'disabled' type)
    toDate TEXT,    -- Nullable (NULL for 'disabled' type)
    description TEXT NOT NULL,
    isActive BOOLEAN DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_date_range_configs_scope ON date_range_configs(scope, isActive);
```

### Table: `date_range_settings` (NEW)

```sql
CREATE TABLE date_range_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Singleton table
    globalModeEnabled BOOLEAN DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO date_range_settings (globalModeEnabled) VALUES (0);
```

### Default Data Migration

```sql
-- Calculate most recent Friday-Thursday range
-- Insert for Monthly Report scope
INSERT INTO date_range_configs
(rangeType, scope, fromDate, toDate, description, isActive)
VALUES ('weekly', 'monthly', '2025-09-19', '2025-09-25', 'Weekly Range (Auto)', 1);

-- Insert for Corrective Maintenance scope
INSERT INTO date_range_configs
(rangeType, scope, fromDate, toDate, description, isActive)
VALUES ('weekly', 'corrective', '2025-09-19', '2025-09-25', 'Weekly Range (Auto)', 1);
```

---

## Domain Layer Changes

### Updated `DateRangeConfig` Entity

**File**: `packages/core/src/modules/weekly-report/domain/date-range-config.ts`

```typescript
export type RangeType = 'weekly' | 'custom' | 'disabled';
export type RangeScope = 'monthly' | 'corrective' | 'global';

export class DateRangeConfig {
    constructor(
        public readonly id: number,
        public readonly rangeType: RangeType,
        public readonly scope: RangeScope,
        public readonly fromDate: string | null,  // Nullable for disabled
        public readonly toDate: string | null,    // Nullable for disabled
        public readonly description: string,
        public readonly isActive: boolean,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date
    ) {}

    // Factory method for weekly range
    static createWeeklyRange(scope: RangeScope): DateRangeConfig {
        // Auto-calculate Friday-Thursday
        // Validate Friday start, Thursday end
    }

    // Factory method for custom range
    static createCustomRange(
        scope: RangeScope,
        fromDate: string,
        toDate: string,
        description: string
    ): DateRangeConfig {
        // Minimal validation (just valid dates, fromDate < toDate)
        // No day-of-week restrictions
        // No maximum duration limit
    }

    // Factory method for disabled range
    static createDisabledRange(scope: RangeScope): DateRangeConfig {
        return new DateRangeConfig(
            0, 'disabled', scope, null, null,
            'All Records (No Filtering)', true
        );
    }

    isDisabled(): boolean {
        return this.rangeType === 'disabled';
    }

    isDateInRange(date: DateTime): boolean {
        if (this.isDisabled()) return true;  // All records match
        if (!this.fromDate || !this.toDate) return false;
        // Standard range check
    }
}
```

### New Domain Entity: `DateRangeSettings`

```typescript
export class DateRangeSettings {
    constructor(
        public readonly id: number,
        public readonly globalModeEnabled: boolean,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date
    ) {}

    enableGlobalMode(): DateRangeSettings {
        return new DateRangeSettings(
            this.id, true, this.createdAt, new Date()
        );
    }

    disableGlobalMode(): DateRangeSettings {
        return new DateRangeSettings(
            this.id, false, this.createdAt, new Date()
        );
    }
}
```

---

## Backend API Changes

### New Repository: `DateRangeSettingsRepository`

**File**: `packages/core/src/modules/weekly-report/domain/DateRangeSettingsRepository.ts`

```typescript
export interface DateRangeSettingsRepository {
    getSettings(): Promise<DateRangeSettings>;
    updateSettings(settings: DateRangeSettings): Promise<void>;
}
```

### Updated Repository: `DateRangeConfigRepository`

Add new methods:
```typescript
export interface DateRangeConfigRepository {
    // Existing
    getCurrent(): Promise<DateRangeConfig | null>;
    save(config: DateRangeConfig): Promise<DateRangeConfig>;

    // NEW methods
    getByScope(scope: RangeScope): Promise<DateRangeConfig | null>;
    saveForScope(config: DateRangeConfig): Promise<DateRangeConfig>;
    deactivateAllForScope(scope: RangeScope): Promise<void>;
}
```

### New IPC Handlers

**File**: `packages/main/src/modules/WeeklyReportModule.ts`

```typescript
// Get config for specific scope
ipcMain.handle('date-range:getByScope', async (_event, scope: RangeScope) => {
    const repo = new SqlJsDateRangeConfigRepository();
    const config = await repo.getByScope(scope);
    return { success: true, data: config };
});

// Update config for specific scope
ipcMain.handle('date-range:updateForScope', async (_event, scope: RangeScope, configData) => {
    const repo = new SqlJsDateRangeConfigRepository();
    // Deactivate all for this scope
    await repo.deactivateAllForScope(scope);
    // Save new config
    const config = await repo.saveForScope(configData);
    return { success: true, data: config };
});

// Get global mode status
ipcMain.handle('date-range:getGlobalMode', async () => {
    const repo = new SqlJsDateRangeSettingsRepository();
    const settings = await repo.getSettings();
    return { success: true, data: settings.globalModeEnabled };
});

// Set global mode status
ipcMain.handle('date-range:setGlobalMode', async (_event, enabled: boolean) => {
    const repo = new SqlJsDateRangeSettingsRepository();
    const settings = await repo.getSettings();
    const updated = enabled ? settings.enableGlobalMode() : settings.disableGlobalMode();
    await repo.updateSettings(updated);
    return { success: true, data: updated.globalModeEnabled };
});
```

### Parser Updates

When `rangeType === 'disabled'`:
- Set all records `inDateRange = true` regardless of date
- Skip date range validation entirely

---

## Frontend Changes

### New Component: `GlobalModeToggle`

**File**: `packages/renderer/src/components/GlobalModeToggle.tsx`

```typescript
interface GlobalModeToggleProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
}

const GlobalModeToggle: React.FC<GlobalModeToggleProps> = ({ enabled, onToggle }) => {
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleToggle = () => {
        if (!enabled) {
            // Enabling - show warning
            setShowConfirmation(true);
        } else {
            // Disabling - direct action
            onToggle(false);
        }
    };

    return (
        <>
            {/* Toggle Switch */}
            <div className="flex items-center gap-3">
                <Switch checked={enabled} onChange={handleToggle} />
                <div>
                    <label>Global Date Range Mode</label>
                    <p className="text-xs text-gray-500">
                        {enabled
                            ? "Both tabs use the same date range"
                            : "Each tab has independent date ranges"}
                    </p>
                </div>
                {enabled && (
                    <span className="badge">Global Active</span>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <ConfirmationModal
                    title="Enable Global Date Range Mode?"
                    message="This will synchronize date ranges across Monthly Report and Corrective Maintenance tabs. You will need to re-upload Excel files for both tabs."
                    onConfirm={() => {
                        onToggle(true);
                        setShowConfirmation(false);
                    }}
                    onCancel={() => setShowConfirmation(false)}
                />
            )}
        </>
    );
};
```

### Updated Component: `DateRangeConfigSettings`

**File**: `packages/renderer/src/components/DateRangeConfigSettings.tsx`

Add `scope` prop and range type selector:

```typescript
interface DateRangeConfigSettingsProps {
    scope: 'monthly' | 'corrective';  // NEW
    onSettingsChange?: (message: string) => void;
    disabled?: boolean;  // When global mode is on, other tab is disabled
}

const DateRangeConfigSettings: React.FC<DateRangeConfigSettingsProps> = ({
    scope,
    onSettingsChange,
    disabled = false
}) => {
    const [rangeType, setRangeType] = useState<'weekly' | 'custom' | 'disabled'>('weekly');
    const [currentRange, setCurrentRange] = useState<DateRangeConfig | null>(null);

    // Load config for this specific scope
    useEffect(() => {
        loadSettingsForScope(scope);
    }, [scope]);

    return (
        <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
            {/* Range Type Selector */}
            <div className="mb-4">
                <label>Date Range Type</label>
                <select value={rangeType} onChange={(e) => setRangeType(e.target.value)}>
                    <option value="weekly">Weekly (Auto: Friday-Thursday)</option>
                    <option value="custom">Custom Range</option>
                    <option value="disabled">Disabled (All Records)</option>
                </select>
            </div>

            {/* Conditional UI based on range type */}
            {rangeType === 'weekly' && (
                <WeeklyRangeDisplay range={currentRange} />
            )}

            {rangeType === 'custom' && (
                <CustomRangePicker
                    fromDate={formData.fromDate}
                    toDate={formData.toDate}
                    onChange={(from, to) => setFormData({ fromDate: from, toDate: to })}
                />
            )}

            {rangeType === 'disabled' && (
                <div className="alert alert-info">
                    All records will be included (no date filtering)
                </div>
            )}

            {/* Active Range Indicator */}
            <div className="mt-4 p-3 bg-blue-50 rounded">
                <strong>Currently Active:</strong> {getCurrentRangeDescription()}
            </div>
        </div>
    );
};
```

### Updated: `weekly-report.tsx`

**File**: `packages/renderer/src/routes/weekly-report.tsx`

Add new state management:

```typescript
// Global mode state
const [globalModeEnabled, setGlobalModeEnabled] = useState(false);

// Independent configs per tab
const [monthlyRangeConfig, setMonthlyRangeConfig] = useState<DateRangeConfig | null>(null);
const [correctiveRangeConfig, setCorrectiveRangeConfig] = useState<DateRangeConfig | null>(null);

// Warning messages
const [monthlyDateRangeConfigChangedMessage, setMonthlyDateRangeConfigChangedMessage] = useState<string | null>(null);
const [correctiveDateRangeConfigChangedMessage, setCorrectiveDateRangeConfigChangedMessage] = useState<string | null>(null);

// Load global mode status on mount
useEffect(() => {
    loadGlobalModeStatus();
    loadMonthlyRangeConfig();
    loadCorrectiveRangeConfig();
}, []);

// Handle global mode toggle
const handleGlobalModeToggle = async (enabled: boolean) => {
    await updateGlobalMode(enabled);
    setGlobalModeEnabled(enabled);

    if (enabled) {
        // When enabling, sync corrective to monthly
        await syncCorrectiveToMonthly();
        // Show warnings on BOTH tabs
        setMonthlyDateRangeConfigChangedMessage("Global mode enabled. Please re-upload Excel files.");
        setCorrectiveDateRangeConfigChangedMessage("Global mode enabled. Please re-upload Excel files.");
    }
};

// Handle settings change for Monthly tab
const handleMonthlySettingsChange = (message: string) => {
    setMonthlyDateRangeConfigChangedMessage(message);

    if (globalModeEnabled) {
        // Also update corrective
        setCorrectiveDateRangeConfigChangedMessage(message);
    }
};

// Handle settings change for Corrective tab
const handleCorrectiveSettingsChange = (message: string) => {
    setCorrectiveDateRangeConfigChangedMessage(message);

    if (globalModeEnabled) {
        // Also update monthly
        setMonthlyDateRangeConfigChangedMessage(message);
    }
};
```

### UI Layout Changes

Add GlobalModeToggle at the top of the page:

```tsx
<div className="container mx-auto px-4 py-8">
    <h1>Weekly Report</h1>

    {/* Global Mode Toggle - Always visible */}
    <div className="mb-6">
        <GlobalModeToggle
            enabled={globalModeEnabled}
            onToggle={handleGlobalModeToggle}
        />
    </div>

    {/* Tab Navigation */}
    <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

    {/* Tab Content */}
    {activeTab === 'monthly-report-data' && (
        <div>
            {/* Date Range Settings for Monthly */}
            <DateRangeConfigSettings
                scope="monthly"
                onSettingsChange={handleMonthlySettingsChange}
                disabled={globalModeEnabled}  // Disabled if global mode is on
            />

            {/* Active Range Indicator */}
            <RangeIndicator config={monthlyRangeConfig} />

            {/* Warning */}
            {monthlyDateRangeConfigChangedMessage && (
                <WarningBanner message={monthlyDateRangeConfigChangedMessage} />
            )}

            {/* Rest of Monthly UI */}
        </div>
    )}

    {activeTab === 'corrective-maintenance' && (
        <div>
            {/* Date Range Settings for Corrective */}
            <DateRangeConfigSettings
                scope="corrective"
                onSettingsChange={handleCorrectiveSettingsChange}
                disabled={globalModeEnabled}  // Disabled if global mode is on
            />

            {/* Active Range Indicator */}
            <RangeIndicator config={correctiveRangeConfig} />

            {/* Warning */}
            {correctiveDateRangeConfigChangedMessage && (
                <WarningBanner message={correctiveDateRangeConfigChangedMessage} />
            )}

            {/* Rest of Corrective UI */}
        </div>
    )}
</div>
```

### New Component: `RangeIndicator`

Shows current active range type with visual badge:

```typescript
const RangeIndicator: React.FC<{ config: DateRangeConfig | null }> = ({ config }) => {
    if (!config) return null;

    const getBadgeColor = () => {
        switch (config.rangeType) {
            case 'weekly': return 'bg-blue-100 text-blue-800';
            case 'custom': return 'bg-purple-100 text-purple-800';
            case 'disabled': return 'bg-gray-100 text-gray-800';
        }
    };

    const getDisplayText = () => {
        if (config.rangeType === 'disabled') {
            return 'All Records (No Filtering)';
        }
        return `${config.rangeType === 'weekly' ? 'Weekly' : 'Custom'}: ${config.getDisplayText()}`;
    };

    return (
        <div className={`inline-flex items-center px-3 py-1 rounded-full ${getBadgeColor()}`}>
            <span className="text-sm font-medium">{getDisplayText()}</span>
        </div>
    );
};
```

---

## Implementation Phases

### Phase 1: Database & Migration (Day 1)
- [ ] Update `date_range_configs` table schema
- [ ] Create `date_range_settings` table
- [ ] Write migration 013 with default data
- [ ] Test migration creates correct default records

### Phase 2: Domain Layer (Day 1-2)
- [ ] Update `DateRangeConfig` entity with rangeType/scope
- [ ] Create `DateRangeSettings` entity
- [ ] Add factory methods for each range type
- [ ] Update validation logic (relax for custom, skip for disabled)
- [ ] Create `DateRangeSettingsRepository` interface

### Phase 3: Backend Repositories & Services (Day 2-3)
- [ ] Implement `SqlJsDateRangeConfigRepository` updates (getByScope, saveForScope)
- [ ] Implement `SqlJsDateRangeSettingsRepository`
- [ ] Add new IPC handlers in `WeeklyReportModule`
- [ ] Update parsers to handle disabled mode
- [ ] Test all backend APIs

### Phase 4: Frontend Components (Day 3-4)
- [ ] Create `GlobalModeToggle` component
- [ ] Create `RangeIndicator` component
- [ ] Update `DateRangeConfigSettings` with scope prop and range type selector
- [ ] Create confirmation modal for global mode
- [ ] Test component interactions

### Phase 5: State Management Integration (Day 4-5)
- [ ] Add global mode state to `weekly-report.tsx`
- [ ] Add independent config states per tab
- [ ] Implement sync logic when global mode is enabled
- [ ] Update warning message handling
- [ ] Wire up all event handlers

### Phase 6: Testing & Polish (Day 5-6)
- [ ] Test all range type combinations
- [ ] Test global mode ON/OFF scenarios
- [ ] Test warning message behavior
- [ ] Test Excel re-upload with different ranges
- [ ] Verify `inDateRange` calculations for all modes
- [ ] UI/UX polish and responsiveness

---

## User Workflows

### Workflow 1: Independent Ranges (Global Mode OFF)

1. User is on Monthly Report tab
2. Sees "Global Date Range Mode: OFF"
3. Sets Monthly to "Custom" range (Sept 1-30)
4. Warning appears: "Please re-upload Monthly Excel file"
5. Switches to Corrective Maintenance tab
6. Sees different settings (Weekly range active)
7. Sets Corrective to "Disabled" mode
8. Warning appears: "Please re-upload Corrective Excel file"
9. Both tabs work independently with different filtering

### Workflow 2: Synchronized Ranges (Global Mode ON)

1. User toggles "Global Date Range Mode: ON"
2. Confirmation modal: "This will sync both tabs. Re-upload Excel files required."
3. User confirms
4. Both tabs now show SAME range settings
5. Monthly tab shows "Using Weekly Range (Global)" indicator
6. Corrective tab shows "Using Weekly Range (Global)" indicator
7. User changes range on Monthly tab to Custom
8. Warning appears on BOTH tabs
9. Corrective tab settings automatically update to match
10. User must re-upload BOTH Excel files

### Workflow 3: Monthly Report Only (Disabled Mode)

1. User on Monthly Report tab, Global Mode OFF
2. Sets range type to "Disabled (All Records)"
3. Uploads Excel file
4. All records show `inDateRange = true`
5. Filter counts show: "In Range: 245, Out of Range: 0, Total: 245"
6. User can still use filter buttons but all records are "in range"

---

## Benefits

✅ **Flexibility**: Each tab can have completely different date ranges
✅ **Simplicity**: Global mode provides easy synchronization when needed
✅ **Clarity**: Visual indicators show exactly what mode/range is active
✅ **Safety**: Confirmation modals and warnings prevent data confusion
✅ **Power**: Custom ranges and disabled mode cover all use cases
✅ **Maintainability**: Clean separation of concerns, independent state management

---

## Technical Notes

### Database Constraints
- `scope` can only be 'monthly', 'corrective', or 'global'
- `rangeType` can only be 'weekly', 'custom', or 'disabled'
- Only one active config per scope at a time
- `fromDate`/`toDate` are nullable (NULL for disabled mode)

### Validation Rules
- **Weekly**: Must be Friday-Thursday, max 30 days, auto-calculated
- **Custom**: fromDate < toDate, valid ISO dates, no day-of-week restriction, no max duration
- **Disabled**: No validation, fromDate/toDate are NULL

### Parser Behavior
```typescript
if (dateRangeConfig.isDisabled()) {
    record.inDateRange = true;  // All records match
} else {
    record.inDateRange = dateRangeConfig.isDateInRange(recordDate);
}
```

### Global Mode Sync Logic
When global mode is enabled:
1. Take Monthly tab's current config
2. Copy it to Corrective tab (change scope to 'corrective')
3. Deactivate old Corrective config
4. Show warnings on BOTH tabs

When global mode is disabled:
1. Each tab keeps its current config
2. They become independent again
3. No automatic sync

---

## File Structure

```
packages/
├── database/
│   └── src/
│       ├── migrations.ts (Update migration 013)
│       └── table-names.ts (Already has DATE_RANGE_CONFIGS)
├── core/
│   └── src/modules/weekly-report/
│       ├── domain/
│       │   ├── date-range-config.ts (Update entity)
│       │   ├── date-range-settings.ts (NEW)
│       │   ├── DateRangeConfigRepository.ts (Update interface)
│       │   └── DateRangeSettingsRepository.ts (NEW)
│       └── application/
│           └── WeeklyReportService.ts (Update parsing logic)
├── main/
│   └── src/
│       ├── modules/
│       │   └── WeeklyReportModule.ts (Add IPC handlers)
│       └── repositories/
│           ├── SqlJsDateRangeConfigRepository.ts (Update implementation)
│           └── SqlJsDateRangeSettingsRepository.ts (NEW)
└── renderer/
    └── src/
        ├── components/
        │   ├── DateRangeConfigSettings.tsx (Update with scope)
        │   ├── GlobalModeToggle.tsx (NEW)
        │   └── RangeIndicator.tsx (NEW)
        └── routes/
            └── weekly-report.tsx (Update state management)
```

---

## Migration Path

Since database will be recreated:

1. **Drop old tables** (if they exist)
2. **Create new schema** with updated columns
3. **Insert default data**:
   - Weekly range for 'monthly' scope (auto-calculated Friday-Thursday)
   - Weekly range for 'corrective' scope (same dates)
   - Global mode setting = OFF
4. **No data migration needed** (fresh start)

---

## End of Specification
