# New Feature: Enrich For Tagging Data with Additional Information

## Overview
For Tagging data records that lack additional information values but have a `linkedRequestId` should be enriched by searching Tag data for matching `linkedRequestId` and extracting all available additional information. The enriched data will be displayed in a new tab in the front-end UI.

## Requirements
- Identify ForTaggingData records with missing additional information but present `linkedRequestId`
- Query Tag data using `linkedRequestId` to find matching records
- Extract all additional information from Tag records (e.g., requestIdLink, subjectLink, problemIdLink, linkedRequestIdLink, etc.)
- Merge the extracted information into the ForTaggingData records
- Provide an IPC handler to retrieve the enriched data
- Create a new tab in the UI (tagging-v3 route) to display the enriched For Tagging data
- Ensure the enriched data includes all possible additional information values

## Implementation Plan

### 1. Create Enrichment Service
- Implement `ForTaggingDataEnrichmentService` in `packages/core/src/modules/incident-tagging/application/`
- Service should:
  - Accept ForTaggingData records
  - For each record with `linkedRequestId` but missing additional info, query Tag repository
  - Extract and merge additional information from matching Tag records
  - Return enriched ForTaggingData with all possible additional information

### 2. Update Core Exports
- Add export for `ForTaggingDataEnrichmentService` in `packages/core/src/index.ts`

### 3. Add IPC Handler for Enrichment
- In `ForTaggingDataExcelModule`, add new IPC handler (e.g., `for-tagging-data:getEnriched`)
- Handler should:
  - Fetch all ForTaggingData records
  - Use the enrichment service to enrich them
  - Return the enriched data

### 4. Update Preload API
- Expose the new IPC handler via preload script with base64-encoded key
- Update `preloadApiKeys.ts` and `preloadHandlers.ts` if needed

### 5. Create New UI Tab
- In `packages/renderer/src/routes/tagging-v3.tsx`, add a new tab for "Enriched Data"
- Tab should display the enriched For Tagging data in a table format
- Show all columns including the additional information fields
- Use existing UI patterns for consistency

### 6. Integrate with Existing UI
- Ensure the new tab fits within the existing layout
- Add navigation or button to trigger data fetching
- Handle loading states and errors appropriately

### 7. Testing
- Add unit tests for the enrichment service
- Test IPC handler functionality
- Verify UI displays enriched data correctly
- Ensure no regression in existing features

## Data Flow
1. User accesses tagging-v3 route
2. Front-end calls IPC handler to get enriched data
3. Main process fetches ForTaggingData, enriches via service, returns result
4. UI displays enriched data in new tab

## Dependencies
- Existing Tag and ForTaggingData repositories
- Existing IPC infrastructure
- Existing UI components and routing
