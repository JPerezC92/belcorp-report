# Incident Overview by Category - Technical Specification

**Version:** 1.1
**Date:** 2025-10-02
**Status:** In Development

---

## 1. Overview

This specification defines 5 statistical tables to be added to the **Monthly Report Data** tab, positioned below the "Weekly Evolution of Incidents" table. These tables provide categorized analysis of incident data from **two database tables**:
- **Tables 1-4:** `monthly_report_records`
- **Table 5:** `corrective_maintenance_records`

**Section Title:** "Incident Overview by Category"

**Visual Reference:** See design mockup image showing treemap-style visualization with 5 sections

---

## 2. Location & Context

- **Tab:** Monthly Report Data (activeTab === "monthly-report-data")
- **Position:** After WeeklyEvolutionTable component (line ~1446 in weekly-report.tsx)
- **Data Source:** `monthly_report_records` table, pre-filtered by:
  - Business Unit filter (if selected)
  - Request Status filter (if selected)
  - Semanal Date Range filter mode

---

## 3. Global Filter Dependencies

### Tables 1-4 Filter Logic (Monthly Report Records)
All tables 1-4 use the same base filtered dataset from `monthly_report_records`:
- ✅ `inDateRange === true` (always required)
- ✅ Respect Business Unit filter from UI
- ✅ Respect Request Status filter from UI
- ✅ Respect Semanal filter mode (inRange/outOfRange/showAll)

Each table then applies additional status-specific filters (see below).

### Table 5 Filter Logic (Corrective Maintenance Records)
Table 5 uses a **different data source** with **independent filters**:
- ✅ Data Source: `corrective_maintenance_records` table
- ✅ `inDateRange === false` (records outside current semanal range)
- ✅ Independent Business Unit filter (from `corrective_maintenance_records.businessUnit`)
- ✅ Does NOT respect UI Request Status filter (not applicable to corrective data)

**Key Difference:** Table 5 operates on historical corrective maintenance data, while Tables 1-4 analyze current week monthly report data.

---

## 4. Table Specifications

### 4.1 Table #1: "Resolved in L2"

**Title:** "Resolved in L2"
**Subtitle:** "Distribution by category"
**Description:** "Incidents resolved by Level 2 support team during the current week, grouped by incident category"

#### Filter Criteria
```typescript
record.inDateRange === true
  AND record.requestStatusReporte === 'Closed'
```

#### Data Processing
- **Group By:** `categorization` field
- **Aggregation:** COUNT(*) per categorization
- **Sort:** By count descending

#### Display Columns
| Column | Description |
|--------|-------------|
| Categorization | The categorization name (e.g., "Bug", "Missing Scope", "User Mistake") |
| Count | Number of records in this categorization |

#### Footer Format
```
{totalCount} Resolved tickets of the Week
```

#### Example Output
```
Bug: 7
Missing Scope: 2
User Mistake: 1
─────────────────
10 Resolved tickets of the Week
```

---

### 4.2 Table #2: "Pending"

**Title:** "Pending"
**Subtitle:** "Distribution by category"
**Description:** "Incidents currently being handled by Level 2 support team, pending resolution"

#### Filter Criteria
```typescript
record.inDateRange === true
  AND record.requestStatusReporte === 'On going in L2'
```

#### Data Processing
- **Group By:** `categorization` field
- **Aggregation:** COUNT(*) per categorization
- **Sort:** By count descending

#### Display Columns
| Column | Description |
|--------|-------------|
| Categorization | The categorization name |
| Count | Number of records in this categorization |

#### Footer Format
```
{totalCount} pending tickets of the Week
```

#### Example Output
```
(empty - no records)
─────────────────
0 pending tickets of the Week
```

---

### 4.3 Table #3: "Recurrent in L2 & L3"

**Title:** "Recurrent in L2 & L3"
**Subtitle:** "Distribution by recurrency"
**Description:** "Analysis of incident recurrence patterns to identify unique vs recurring issues"

#### Filter Criteria
```typescript
record.inDateRange === true
// No additional status filter
```

#### Data Processing
- **Group By:** `recurrence` field
- **Aggregation:** COUNT(*) per recurrence type
- **Sort:** By count descending

#### Display Columns
| Column | Description |
|--------|-------------|
| Recurrence Type | The recurrence value (e.g., "Recurrent", "Unique") |
| Count | Number of records of this type |

#### Footer Format
```
{totalCount} tickets of the Week
```

#### Example Output
```
Recurrent: 8
Unique: 5
─────────────────
13 tickets of the Week
```

---

### 4.4 Table #4: "Assigned to L3 Backlog"

**Title:** "Assigned to L3 Backlog"
**Subtitle:** "Distribution by Categorie"
**Description:** "Incidents escalated to Level 3 support or currently in the backlog awaiting assignment"

#### Filter Criteria
```typescript
record.inDateRange === true
  AND (
    record.requestStatusReporte === 'In L3 Backlog'
    OR record.requestStatusReporte === 'On going in L3'
  )
```

#### Data Processing
- **Group By:** `categorization` field
- **Aggregation:** COUNT(*) per categorization
- **Sort:** By count descending

#### Display Columns
| Column | Description |
|--------|-------------|
| Categorization | The categorization name |
| Count | Number of records in this categorization |

#### Footer Format
```
{totalCount} pending tickets of the Week
```

#### Example Output
```
Bug: 3
─────────────────
3 pending tickets of the Week
```

---

### 4.5 Table #5: "L3 Status"

**Title:** "L3 Status"
**Subtitle:** "Distribution by Status"
**Description:** "Level 3 incident status distribution from previous periods, showing backlog evolution over time"

**⚠️ IMPORTANT:** This table uses a **different data source** than Tables 1-4.

#### Data Source
- **Table:** `corrective_maintenance_records`
- **Reason:** Provides historical L3 status tracking

#### Filter Criteria
```typescript
// From corrective_maintenance_records table
record.inDateRange === false
  AND (optional: record.businessUnit === selectedBusinessUnit)
```

#### Data Processing
- **Group By:** `requestStatus` field (from corrective_maintenance_records)
- **Aggregation:** COUNT(*) per status
- **Sort:** By count descending

#### Display Columns
| Column | Description |
|--------|-------------|
| Status | The request status (e.g., "Backlog", "In testing", "PRD Dcpt", "Dev") |
| Count | Number of records with this status |

#### Footer Format
```
{totalCount} tickets previous week
```

#### Example Output
```
Backlog: 21
In testing: 15
PRD Dcpt: 3
Dev: various
─────────────────
50 tickets previous week
```

#### Implementation Notes
- Query `corrective_maintenance_records` table (separate from Tables 1-4)
- Business Unit filter is independent (uses corrective table's businessUnit field)
- Does not respect UI Request Status filter (different context)
- Shows historical data outside current semanal range

---

## 5. Component Architecture

### 5.1 Component Structure

```
IncidentOverviewSection (Container)
├── Section Title: "5. Incident Overview by Category"
├── Date Range Display: "Data analyzed from {fromDate} to {toDate}"
├── Total Count: "Total Incidents: {count} registered tickets"
├── Grid Layout (5 tables)
│   ├── IncidentOverviewTable (Table 1)
│   ├── IncidentOverviewTable (Table 2)
│   ├── IncidentOverviewTable (Table 3)
│   ├── IncidentOverviewTable (Table 4)
│   └── IncidentOverviewTable (Table 5 - Placeholder)
```

### 5.2 IncidentOverviewTable Component

#### Props Interface
```typescript
interface IncidentOverviewTableProps {
  title: string;
  subtitle: string;
  description: string; // Descriptive text displayed below subtitle
  data: Array<{ label: string; count: number }>;
  footerText: string;
  colorScheme?: 'blue' | 'orange' | 'gray' | 'yellow';
  isPlaceholder?: boolean;
}
```

#### Visual Features
- Treemap-style bar visualization (proportional to count)
- Color coding by category/type
- Hover states showing exact counts
- Responsive grid layout
- Match styling from reference image

### 5.3 IncidentOverviewSection Component

#### Props Interface
```typescript
interface IncidentOverviewSectionProps {
  monthlyRecords: MonthlyReportRecord[]; // For Tables 1-4
  correctiveRecords: CorrectiveMaintenanceRecord[]; // For Table 5
  businessUnit?: string;
  dateRange?: {
    fromDate: string;
    toDate: string;
  };
}
```

#### Responsibilities
1. Calculate datasets for Tables 1-4 from filtered monthly records
2. Calculate dataset for Table 5 from corrective maintenance records
3. Render section header with metadata
4. Layout 5 tables in responsive grid
5. Handle empty states gracefully
6. Apply independent filters to each data source

---

## 6. Data Flow

```
weekly-report.tsx
  ├── filteredMonthlyRecords (filtered by BU + Status + Semanal)
  │    └── For Tables 1-4 (monthly_report_records with inDateRange=true)
  │
  └── filteredCorrectiveRecords (filtered by BU + Semanal)
       └── For Table 5 (corrective_maintenance_records with inDateRange=false)

       ↓

  IncidentOverviewSection
       ├── Calculate Table 1 data (filter: Closed)
       ├── Calculate Table 2 data (filter: On going in L2)
       ├── Calculate Table 3 data (group by recurrence)
       ├── Calculate Table 4 data (filter: L3 Backlog/Ongoing)
       └── Calculate Table 5 data (group by requestStatus from corrective)
```

---

## 7. Database Fields Used

### From `monthly_report_records` (Tables 1-4)

| Field | Type | Usage |
|-------|------|-------|
| `inDateRange` | boolean | Primary filter (must be true) |
| `requestStatusReporte` | string | Status categorization for filtering |
| `categorization` | string | Incident category grouping |
| `recurrence` | string | Recurrence type (Table 3) |
| `businessUnit` | string | Business unit filter |

### From `corrective_maintenance_records` (Table 5)

| Field | Type | Usage |
|-------|------|-------|
| `inDateRange` | boolean | Primary filter (must be false) |
| `requestStatus` | string | Status grouping for L3 analysis |
| `businessUnit` | string | Independent business unit filter |

**Note:** The two tables use different field names for status (`requestStatusReporte` vs `requestStatus`) due to their different data models.

---

## 8. Implementation Checklist

### Phase 1: Documentation & Validation
- [x] Create this specification document
- [ ] Create test script `scripts/test-incident-overview-tables.ts`
- [ ] Validate data queries in console
- [ ] Verify filter logic correctness

### Phase 2: Component Development
- [ ] Create `IncidentOverviewTable.tsx` component
- [ ] Create `IncidentOverviewSection.tsx` component
- [ ] Add TypeScript interfaces
- [ ] Implement responsive styling

### Phase 3: Integration
- [ ] Import components in `weekly-report.tsx`
- [ ] Add section after WeeklyEvolutionTable
- [ ] Pass filtered data as props
- [ ] Test with different filter combinations

### Phase 4: Testing & Verification
- [ ] Test Business Unit filter
- [ ] Test Request Status filter
- [ ] Test Semanal Date Range modes
- [ ] Verify empty states
- [ ] Build without errors
- [ ] Visual QA against reference image

---

## 9. Known Issues & Future Work

### Visual Design Refinements
- Exact color schemes to be finalized (currently using default colors)
- Treemap sizing algorithm details (proportional vs fixed sizing)
- Responsive breakpoints for mobile/tablet views
- Animation/transition effects for data updates

### Performance Considerations
- Large datasets may require pagination or virtualization
- Consider caching calculated datasets
- Optimize re-renders when filters change

---

## 10. References

- **Design Mockup:** See uploaded image "5. Incident Overview by Category"
- **Related Components:**
  - `WeeklyEvolutionTable.tsx` (similar table structure)
  - `L3SummaryTable.tsx` (existing summary table)
  - `SemanalFilter.tsx` (filter component)
- **Database Schema:** `packages/database/src/table-names.ts`
- **Repository:** `SqlJsMonthlyReportRecordRepository.ts`

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-01 | Initial specification (Tables 1-4 only) | Claude Code |
| 1.1 | 2025-10-02 | Added Table 5 complete specification, added descriptions to all tables, documented dual data source architecture | Claude Code |

---

**Status:** ✅ Ready for full implementation (All 5 tables)
**Next Steps:** Create test script to validate data queries from both tables
