# Scripts Documentation

This document tracks all test and utility scripts scattered throughout the project.

## Location Legend
- 📁 `scripts/` - Official scripts directory
- 📦 `packages/core/` - Core package scripts (moved here due to build issues)
- 🏠 Root level - Quick utility scripts

---

## Excel Parser Validation Scripts

### 📁 `scripts/test-tag-parser.ts`
**Purpose**: Validates REP01 XD TAG (incident tagging) Excel parser

**Tests:**
- Parses `files/REP01 XD TAG 2025.xlsx`
- Validates headers match expected structure
- Checks hyperlink extraction for Request ID, Problem ID, Linked Request ID
- Shows sample records with full details

**Run:**
```bash
tsx scripts/test-tag-parser.ts
```

**Expected File Structure:**
- Sheet: "ManageEngine Report Framework"
- Columns: Created Time, Request ID, Información Adicional, Modulo., Problem ID, Linked Request Id, Jira, Categorización, Technician

---

### 📁 `scripts/test-excel-upload.ts`
**Purpose**: Validates monthly report Excel parser

**Tests:**
- Parses `XD 2025 DATA INFORME MENSUAL - Current Month.xlsx`
- Validates monthly report structure with 25 columns
- Checks computed fields (REP, Semanal, Day, Week)
- Validates business unit assignment

**Run:**
```bash
tsx scripts/test-excel-upload.ts
```

**Expected File Structure:**
- Sheet: "ManageEngine Report Framework"
- 25 columns including: Aplicativos, Categorización, Request ID, Created Time, etc.

---

### 📦 `packages/core/test-excel-cell-validation.ts`
**Purpose**: Validates the critical `cellValueSchema` and `cellWithLinkSchema` utilities

**Tests:**
- Tests 486+ real Excel cell structures from production files
- Validates handling of nested rich text with hyperlinks
- Ensures edge cases are properly handled

**Why in core package:**
- Was moved here from scripts/ due to build/import path issues
- Needs direct access to core schemas without build step

**Run:**
```bash
cd packages/core
tsx test-excel-cell-validation.ts
```

**Critical Test Cases:**
- Plain strings: `"Value"`
- Rich text: `{ richText: [{ text: "Value" }] }`
- Simple hyperlinks: `{ text: "Value", hyperlink: "URL" }`
- **Complex hyperlinks**: `{ text: { richText: [{ text: "Value" }] }, hyperlink: "URL" }` ⚠️ Most important!

---

## Database Query Scripts

### 📁 `scripts/query-semanal-module-counts.ts`
**Purpose**: Queries and displays weekly report module statistics

**Features:**
- Connects to SQL.js database
- Shows counts by Semanal (week range) and Module
- Useful for validating weekly report data

**Run:**
```bash
tsx scripts/query-semanal-module-counts.ts
```

---

## Structure Analysis Scripts

### 🏠 `inspect-monthly-headers.ts`
**Purpose**: Quick utility to inspect Excel file structure and headers

**Features:**
- Analyzes Excel file dimensions
- Lists all headers found
- Shows data patterns in first rows
- Identifies hyperlinks and cell types

**Run:**
```bash
tsx inspect-monthly-headers.ts
```

**Note:** Root-level utility for quick inspections during development.

---

## Script Organization Notes

### Why Scripts Are Scattered

1. **Build Dependencies**: Some scripts need to run before packages are built
2. **Import Paths**: Core package scripts avoid `@app/core` import issues
3. **Quick Access**: Root-level scripts for rapid development/debugging

### Future Improvements

- Consider moving all scripts to `scripts/` once import path issues are resolved
- Add npm script aliases in root `package.json` for easier access
- Create subdirectories: `scripts/parsers/`, `scripts/queries/`, `scripts/validation/`

---

## Adding New Scripts

When creating a new script:

1. **Parser validation scripts** → `scripts/test-{parser-name}.ts`
2. **Database queries** → `scripts/query-{purpose}.ts`
3. **Quick utilities** → Root level, document here
4. **Core validation** → `packages/core/test-{feature}.ts` if build issues exist

Always update this document when adding new scripts!