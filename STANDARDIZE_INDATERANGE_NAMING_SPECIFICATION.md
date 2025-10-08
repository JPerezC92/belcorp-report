# Standardize InDateRange Naming Specification

## Executive Summary

This document tracks all code locations that need to be updated to standardize naming for the two independent InDateRange filtering systems in the Weekly Report module.

**Problem**: Current naming is confusing and inconsistent:
- Mixing old "Semanal" terminology with new "DateRangeConfig" naming
- One system uses no prefix (`dateRangeConfigChangedMessage`), the other uses `corrective` prefix
- Not clear that these are independent systems for different tabs

**Solution**: Use consistent `monthly` and `corrective` prefixes throughout.

---

## Proposed Naming Convention

### Monthly Report Data System
| Current Name | New Name | Type |
|--------------|----------|------|
| `dateRangeConfigChangedMessage` | `monthlyDateRangeConfigChangedMessage` | State variable |
| `setDateRangeConfigChangedMessage` | `setMonthlyDateRangeConfigChangedMessage` | Setter function |
| `semanalFilterMode` | `monthlyInDateRangeFilterMode` | State variable |
| `setSemanalFilterMode` | `setMonthlyInDateRangeFilterMode` | Setter function |
| `semanalCounts` | `monthlyInDateRangeCounts` | Computed value |

### Corrective Maintenance System
| Current Name | New Name | Type |
|--------------|----------|------|
| `correctiveDateRangeConfigChangedMessage` | ✅ (already correct) | State variable |
| `setCorrectiveDateRangeConfigChangedMessage` | ✅ (already correct) | Setter function |
| `correctiveSemanalFilterMode` | `correctiveInDateRangeFilterMode` | State variable |
| `setCorrectiveSemanalFilterMode` | `setCorrectiveInDateRangeFilterMode` | Setter function |
| `correctiveSemanalCounts` | `correctiveInDateRangeCounts` | Computed value |

### Component Renames
| Current Name | New Name |
|--------------|----------|
| `SemanalFilter.tsx` | `InDateRangeFilter.tsx` |
| `SemanalFilter` (component) | `InDateRangeFilter` |
| `SemanalFilterProps` (interface) | `InDateRangeFilterProps` |

---

## Files to Modify

### 1. **packages/renderer/src/routes/weekly-report.tsx**

**Total Changes**: ~30 locations

#### State Declarations (Lines 238-253)
```typescript
// CURRENT (Lines 239-240)
const [dateRangeConfigChangedMessage, setDateRangeConfigChangedMessage] =
    useState<string | null>(null);

// NEW
const [monthlyDateRangeConfigChangedMessage, setMonthlyDateRangeConfigChangedMessage] =
    useState<string | null>(null);

// CURRENT (Lines 243-245)
const [semanalFilterMode, setSemanalFilterMode] = useState<
    "inRange" | "outOfRange" | "showAll"
>("inRange");

// NEW
const [monthlyInDateRangeFilterMode, setMonthlyInDateRangeFilterMode] = useState<
    "inRange" | "outOfRange" | "showAll"
>("inRange");

// CURRENT (Lines 248-249)
const [correctiveSemanalFilterMode, setCorrectiveSemanalFilterMode] =
    useState<"inRange" | "outOfRange" | "showAll">("inRange");

// NEW
const [correctiveInDateRangeFilterMode, setCorrectiveInDateRangeFilterMode] =
    useState<"inRange" | "outOfRange" | "showAll">("inRange");
```

#### Import Statement (Line 21)
```typescript
// CURRENT
import SemanalFilter from "@/components/SemanalFilter";

// NEW
import InDateRangeFilter from "@/components/InDateRangeFilter";
```

#### Usage Locations

| Line | Current Code | New Code | Context |
|------|-------------|----------|---------|
| 759 | `setDateRangeConfigChangedMessage(null)` | `setMonthlyDateRangeConfigChangedMessage(null)` | Clear warning after Excel reload |
| 867 | `switch (semanalFilterMode)` | `switch (monthlyInDateRangeFilterMode)` | Filter logic for monthly records |
| 883 | `[baseFilteredMonthlyRecords, semanalFilterMode]` | `[baseFilteredMonthlyRecords, monthlyInDateRangeFilterMode]` | useMemo dependency |
| 886 | `const semanalCounts = useMemo(...)` | `const monthlyInDateRangeCounts = useMemo(...)` | Count computation |
| 905 | `switch (correctiveSemanalFilterMode)` | `switch (correctiveInDateRangeFilterMode)` | Filter logic for corrective |
| 918 | `correctiveSemanalFilterMode` | `correctiveInDateRangeFilterMode` | useMemo dependency |
| 922 | `const correctiveSemanalCounts = useMemo(...)` | `const correctiveInDateRangeCounts = useMemo(...)` | Count computation |
| 951 | `switch (semanalFilterMode)` | `switch (monthlyInDateRangeFilterMode)` | Status summary filter |
| 1078 | `semanalFilterMode` | `monthlyInDateRangeFilterMode` | useMemo dependency |
| 1377 | `setDateRangeConfigChangedMessage(message)` | `setMonthlyDateRangeConfigChangedMessage(message)` | Settings change handler |
| 1382 | `{dateRangeConfigChangedMessage && (` | `{monthlyDateRangeConfigChangedMessage && (` | Warning condition |
| 1403 | `{dateRangeConfigChangedMessage}` | `{monthlyDateRangeConfigChangedMessage}` | Warning text |
| 1411 | `setDateRangeConfigChangedMessage(null)` | `setMonthlyDateRangeConfigChangedMessage(null)` | Dismiss button |
| 1499-1504 | `<SemanalFilter filterMode={semanalFilterMode} onFilterModeChange={setSemanalFilterMode} inRangeCount={semanalCounts.inRangeCount} outOfRangeCount={semanalCounts.outOfRangeCount} totalCount={semanalCounts.totalCount} />` | `<InDateRangeFilter filterMode={monthlyInDateRangeFilterMode} onFilterModeChange={setMonthlyInDateRangeFilterMode} inRangeCount={monthlyInDateRangeCounts.inRangeCount} outOfRangeCount={monthlyInDateRangeCounts.outOfRangeCount} totalCount={monthlyInDateRangeCounts.totalCount} />` | Monthly filter component |
| 1753-1760 | `<SemanalFilter filterMode={correctiveSemanalFilterMode} onFilterModeChange={setCorrectiveSemanalFilterMode} inRangeCount={correctiveSemanalCounts.inRangeCount} outOfRangeCount={correctiveSemanalCounts.outOfRangeCount} totalCount={correctiveSemanalCounts.totalCount} />` | `<InDateRangeFilter filterMode={correctiveInDateRangeFilterMode} onFilterModeChange={setCorrectiveInDateRangeFilterMode} inRangeCount={correctiveInDateRangeCounts.inRangeCount} outOfRangeCount={correctiveInDateRangeCounts.outOfRangeCount} totalCount={correctiveInDateRangeCounts.totalCount} />` | Corrective filter component |

#### Comments to Update
- Line 242: "State for semanal filtering" → "State for monthly InDateRange filtering"
- Line 247: "State for corrective maintenance semanal filtering" → "State for corrective maintenance InDateRange filtering"
- Line 1381: Already correct ("Warning message when date range config has been changed")
- Line 1498: "Semanal Range Filter" → "InDateRange Filter (Monthly)"
- Line 1752: "Semanal Range Filter" → "InDateRange Filter (Corrective)"

---

### 2. **packages/renderer/src/components/SemanalFilter.tsx**

**Action**: Rename file to `InDateRangeFilter.tsx` and update all internal references

#### Changes Required:

| Line | Current Code | New Code |
|------|-------------|----------|
| 3 | `interface SemanalFilterProps` | `interface InDateRangeFilterProps` |
| 11 | `const SemanalFilter: React.FC<SemanalFilterProps>` | `const InDateRangeFilter: React.FC<InDateRangeFilterProps>` |
| 32 | `Semanal Date Range Filter` | `InDateRange Filter` |
| 34 | `configured semanal date range` | `configured date range` |
| 75 | `within semanal range` | `within date range` |
| 76 | `outside semanal range` | `outside date range` |
| 95 | `export default SemanalFilter;` | `export default InDateRangeFilter;` |

---

## Implementation Checklist

### Phase 1: Component Rename
- [ ] Rename file: `SemanalFilter.tsx` → `InDateRangeFilter.tsx`
- [ ] Update interface name: `SemanalFilterProps` → `InDateRangeFilterProps`
- [ ] Update component name: `SemanalFilter` → `InDateRangeFilter`
- [ ] Update UI text: Remove "Semanal" references, use "InDateRange" or "Date Range"
- [ ] Update export statement

### Phase 2: Update weekly-report.tsx Imports
- [ ] Update import statement (line 21)
- [ ] Update component usage in Monthly Report section (line 1499)
- [ ] Update component usage in Corrective Maintenance section (line 1753)

### Phase 3: Update State Variables - Monthly System
- [ ] Rename state: `dateRangeConfigChangedMessage` → `monthlyDateRangeConfigChangedMessage` (line 239)
- [ ] Rename setter: `setDateRangeConfigChangedMessage` → `setMonthlyDateRangeConfigChangedMessage` (line 239)
- [ ] Update all 5 usages of setter (lines 759, 1377, 1411)
- [ ] Update all 2 usages of state value (lines 1382, 1403)
- [ ] Rename state: `semanalFilterMode` → `monthlyInDateRangeFilterMode` (line 243)
- [ ] Rename setter: `setSemanalFilterMode` → `setMonthlyInDateRangeFilterMode` (line 243)
- [ ] Update all filter mode usages (lines 867, 883, 951, 1078, 1500, 1501)
- [ ] Rename computed: `semanalCounts` → `monthlyInDateRangeCounts` (line 886)
- [ ] Update all count usages (lines 1502, 1503, 1504)

### Phase 4: Update State Variables - Corrective System
- [ ] Rename state: `correctiveSemanalFilterMode` → `correctiveInDateRangeFilterMode` (line 248)
- [ ] Rename setter: `setCorrectiveSemanalFilterMode` → `setCorrectiveInDateRangeFilterMode` (line 248)
- [ ] Update all filter mode usages (lines 905, 918, 1754, 1755)
- [ ] Rename computed: `correctiveSemanalCounts` → `correctiveInDateRangeCounts` (line 922)
- [ ] Update all count usages (lines 1756, 1758, 1760)

### Phase 5: Update Comments
- [ ] Line 242: Update comment for monthly filter mode
- [ ] Line 247: Update comment for corrective filter mode
- [ ] Line 1498: Update comment for monthly filter component
- [ ] Line 1752: Update comment for corrective filter component

### Phase 6: Git Operations
- [ ] Delete old file: `git rm packages/renderer/src/components/SemanalFilter.tsx`
- [ ] Stage new file: `git add packages/renderer/src/components/InDateRangeFilter.tsx`
- [ ] Stage weekly-report.tsx changes

### Phase 7: Build and Test
- [ ] Build renderer package: `pnpm run build` in packages/renderer
- [ ] Verify no TypeScript errors
- [ ] Test Monthly Report Data tab filtering
- [ ] Test Corrective Maintenance tab filtering
- [ ] Verify filters are independent
- [ ] Test warning messages appear and dismiss correctly

---

## Benefits

✅ **Clear Independence**: `monthly` vs `corrective` prefixes make it obvious these are separate systems
✅ **No Legacy Terminology**: All "Semanal" references replaced with "InDateRange"
✅ **Consistent Patterns**: Both systems follow identical naming conventions
✅ **Better Maintainability**: Future developers immediately understand the architecture
✅ **Improved Readability**: Code is self-documenting with descriptive names

---

## Risk Assessment

**Risk Level**: LOW

- **Breaking Changes**: None - this is internal refactoring only
- **User Impact**: None - no functional changes, UI text improvements only
- **Testing Requirements**: Standard smoke testing of filter functionality
- **Rollback Strategy**: Git revert if issues discovered

---

## Estimated Effort

- **File Changes**: 2 files
- **Total Code Changes**: ~35 locations
- **Implementation Time**: 30-45 minutes
- **Testing Time**: 15 minutes
- **Total**: 1 hour

---

## Notes

- All changes are in the renderer package only - no backend changes required
- No database schema changes
- No API contract changes
- Pure naming/terminology standardization
