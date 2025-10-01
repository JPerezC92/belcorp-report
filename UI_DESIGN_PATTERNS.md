# UI Design Patterns - Belcorp Report Application

This document outlines the consistent UI design patterns used throughout the Belcorp Report Electron application, based on the Tagging v3 implementation.

## Layout Structure

### Main Page Container
**IMPORTANT**: All views must use this standard container structure for consistency.

```tsx
<div className="container mx-auto px-4 py-8">
  <div className="max-w-7xl mx-auto">
    {/* Page content */}
  </div>
</div>
```

**Implementation Notes**:
- ✅ Apply this pattern directly in route components OR in top-level components
- ❌ Do NOT add wrapper divs around components that already have this pattern
- ✅ All current views (tagging-v3, weekly-report, business-unit-settings, index) use this pattern

**Example Route Component**:
```tsx
// Option 1: Route component directly implements pattern
function MyRoute() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Page Title</h1>
        {/* Page content */}
      </div>
    </div>
  );
}

// Option 2: Dedicated component implements pattern, route just renders it
function MyRoute() {
  return <MyComponent />;
}

// In MyComponent.tsx
export function MyComponent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Page content */}
      </div>
    </div>
  );
}
```

### Page Title
```tsx
<h1 className="text-3xl font-bold text-gray-800 mb-6">
  Page Title
</h1>
```

### Home Page Pattern (Feature Cards)
Use this pattern for navigation/overview pages with feature cards:

```tsx
<div className="container mx-auto px-4 py-8">
  <div className="max-w-7xl mx-auto">
    <h1 className="text-3xl font-bold text-gray-800 mb-6">
      Welcome to Application Name
    </h1>

    {/* Introduction Card */}
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <p className="text-gray-700 mb-4">
        Brief description of the application.
      </p>
      <p className="text-gray-600 text-sm">
        Usage instructions or helpful tips.
      </p>
    </div>

    {/* Feature Cards Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Link to="/feature-path" className="block group">
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-3">
            <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {/* Icon SVG */}
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600">
              Feature Name
            </h2>
          </div>
          <p className="text-gray-600 text-sm">
            Feature description
          </p>
        </div>
      </Link>
      {/* More feature cards */}
    </div>
  </div>
</div>
```

**Color Coding for Feature Cards**:
- Blue (`text-blue-500`, `group-hover:text-blue-600`) - Data management/primary features
- Green (`text-green-500`, `group-hover:text-green-600`) - Reports/analytics
- Purple (`text-purple-500`, `group-hover:text-purple-600`) - Settings/configuration
- Orange/Yellow - Warnings or special actions

## Loading States

### Full Page Loading
```tsx
<div className="container mx-auto px-4 py-8">
  <div className="max-w-7xl mx-auto">
    <h1 className="text-3xl font-bold text-gray-800 mb-6">
      Page Title
    </h1>
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading message...</p>
      </div>
    </div>
  </div>
</div>
```

### Inline Loading
```tsx
<div className="flex items-center text-blue-600 mb-4">
  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
  <span className="text-sm">Loading message...</span>
</div>
```

## Error States

### Full Page Error
```tsx
<div className="container mx-auto px-4 py-8">
  <div className="max-w-7xl mx-auto">
    <h1 className="text-3xl font-bold text-gray-800 mb-6">
      Page Title
    </h1>
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-red-700 mb-2">
          Error Title
        </h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    </div>
  </div>
</div>
```

## File Upload Components

### Auto-Upload File Input (No Button)
```tsx
<div className="mb-4">
  <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
    Select Excel File
  </label>
  <input
    id="file-upload"
    type="file"
    accept=".xlsx,.xls"
    onChange={handleFileChange} // Automatically processes on selection
    disabled={loading}
    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
  />
  <p className="text-xs text-gray-500 mt-1">
    File will be processed automatically when selected
  </p>
</div>
```

### Upload Section Container
```tsx
<div className="bg-white rounded-lg shadow-md mb-6">
  <div className="px-6 py-4 border-b border-gray-200">
    <h2 className="text-xl font-semibold text-gray-800">
      Upload Section Title
    </h2>
    <p className="text-gray-600">
      Description of what the upload does
    </p>
  </div>
  <div className="p-6">
    {/* Upload form content */}
  </div>
</div>
```

### File Input
```tsx
<div className="mb-4">
  <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
    Select File Label
  </label>
  <input
    id="file-upload"
    type="file"
    accept=".xlsx,.xls"
    onChange={handleFileChange}
    disabled={loading}
    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
  />
</div>
```

### Status Messages

#### Error Message
```tsx
<div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
  <div className="flex">
    <div className="flex-shrink-0">
      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    </div>
    <div className="ml-3">
      <h3 className="text-sm font-medium text-red-800">
        Error Title
      </h3>
      <div className="mt-2 text-sm text-red-700">
        {errorMessage}
      </div>
    </div>
  </div>
</div>
```

#### Success Message
```tsx
<div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
  <div className="flex">
    <div className="flex-shrink-0">
      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    </div>
    <div className="ml-3">
      <h3 className="text-sm font-medium text-green-800">
        Success
      </h3>
      <div className="mt-2 text-sm text-green-700">
        {successMessage}
      </div>
    </div>
  </div>
</div>
```

## Tab Navigation

```tsx
<div className="mb-6">
  <div className="border-b border-gray-200">
    <nav className="-mb-px flex space-x-8">
      <button
        type="button"
        onClick={() => setActiveTab("tab1")}
        className={`py-2 px-1 border-b-2 font-medium text-sm ${
          activeTab === "tab1"
            ? "border-blue-500 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Tab 1
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("tab2")}
        className={`py-2 px-1 border-b-2 font-medium text-sm ${
          activeTab === "tab2"
            ? "border-blue-500 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Tab 2
      </button>
    </nav>
  </div>
</div>
```

## Action Buttons

### Primary Action Button
```tsx
<button
  type="button"
  onClick={handleAction}
  disabled={loading}
  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
>
  {loading ? (
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {/* Icon SVG */}
    </svg>
  )}
  Button Text
</button>
```

### Secondary Action Button
```tsx
<button
  type="button"
  onClick={handleAction}
  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
>
  Button Text
</button>
```

### Refresh Button with Loading State
```tsx
<button
  type="button"
  onClick={handleRefresh}
  disabled={loading}
  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
>
  {loading ? (
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
  ) : (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-labelledby="refresh-icon"
    >
      <title id="refresh-icon">Refresh icon</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )}
  Refresh Data
</button>
```

## Data Tables

### Table with External Links
```tsx
<td className="px-6 py-4 whitespace-nowrap">
  {item.link ? (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 hover:underline"
    >
      {item.displayValue}
    </a>
  ) : (
    <span className="text-sm text-gray-900">{item.displayValue}</span>
  )}
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
  {item.link ? (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
    >
      Link
    </a>
  ) : (
    "-"
  )}
</td>
```

### Table with Status Badges
```tsx
<td className="px-6 py-4 whitespace-nowrap">
  {/* Blue badge for modules */}
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
    {item.module}
  </span>

  {/* Green badge for categories */}
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
    {item.category}
  </span>

  {/* Purple badge for special data */}
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
    {item.specialValue}
  </span>
</td>
```

### Table Header with Record Count
```tsx
<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
  <div>
    <h3 className="text-lg font-medium text-gray-900">
      Data Table Title
    </h3>
    <p className="text-sm text-gray-500">
      {data.length} record{data.length !== 1 ? 's' : ''} found
    </p>
  </div>
  {/* Action buttons */}
</div>
```

### Basic Table Structure
```tsx
<div className="bg-white rounded-lg shadow-md">
  <div className="px-6 py-4 border-b border-gray-200">
    <h3 className="text-lg font-medium text-gray-900">
      Table Title
    </h3>
  </div>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Column Header
          </th>
          {/* More headers */}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((item, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.value}
            </td>
            {/* More cells */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

## Empty States

```tsx
<div className="text-center py-12">
  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {/* Empty state icon */}
  </svg>
  <h3 className="mt-2 text-sm font-medium text-gray-900">No data</h3>
  <p className="mt-1 text-sm text-gray-500">
    Description of what the user should do to add data.
  </p>
</div>
```

## Color Scheme

- **Primary**: Blue (`blue-500`, `blue-600`, `blue-700`)
- **Success**: Green (`green-500`, `green-600`, `green-700`)
- **Error**: Red (`red-500`, `red-600`, `red-700`)
- **Warning**: Yellow/Orange
- **Neutral**: Gray (`gray-500`, `gray-600`, `gray-700`)
- **Background**: White cards on light backgrounds

## Spacing Guidelines

- Container padding: `px-4 py-8`
- Card padding: `p-6`
- Section spacing: `mb-6`
- Element spacing: `mb-4`
- Small spacing: `mb-2`

## Typography

- Page titles: `text-3xl font-bold text-gray-800`
- Section titles: `text-xl font-semibold text-gray-800`
- Card headers: `text-lg font-medium text-gray-900`
- Body text: `text-gray-600` or `text-gray-700`
- Small text: `text-sm`
- Labels: `text-sm font-medium text-gray-700`

## Implementation Notes

1. Always use the main container structure for consistency
2. Use semantic HTML with proper ARIA labels where applicable
3. Include loading states for all async operations
4. Provide clear error messages and recovery options
5. Use consistent color coding for status messages
6. Ensure responsive design with proper overflow handling
7. Include proper focus states for accessibility
8. Use `target="_blank"` and `rel="noopener noreferrer"` for external links
9. Implement auto-upload behavior for file inputs when no manual processing is needed
10. Use status badges for categorical data in tables
11. Show record counts in table headers for user awareness
12. Include refresh buttons for data reloading functionality
13. Use proper title attributes and aria-labelledby for icons
14. **Error Handling Patterns**
### Backend Validation Errors
When parsing Excel files, validation errors should be thrown as exceptions and caught by the frontend for user display:

```typescript
// In parser - throw errors instead of logging
if (!validationResult.success) {
  throw new Error(
    `Invalid data in row ${rowIndex}: ${validationResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')}`
  );
}

// In frontend component - catch and display
try {
  const result = await parseHandler(fileBuffer, fileName);
  // Handle success
} catch (error) {
  setError(error instanceof Error ? error.message : "Processing failed");
}
```

### Error Message Display
```tsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
        <div className="mt-2 text-sm text-red-700">{error}</div>
      </div>
    </div>
  </div>
)}
```
