# PowerShell script to rename Semanal to InDateRange throughout the project
# Run this from the project root directory

Write-Host "Starting Semanal to InDateRange rename process..." -ForegroundColor Green
Write-Host ""

$projectRoot = "D:\projects-tismart\belcorp-report"
Set-Location $projectRoot

# Track progress
$totalSteps = 7
$currentStep = 0

function Show-Progress {
    param($message)
    $script:currentStep++
    Write-Host "[$script:currentStep/$totalSteps] $message" -ForegroundColor Cyan
}

# Step 1: Rename core domain files
Show-Progress "Renaming core domain files..."
$coreBasePath = "packages\core\src\modules\weekly-report"

# Rename domain files
if (Test-Path "$coreBasePath\domain\semanal-date-range.ts") {
    Rename-Item -Path "$coreBasePath\domain\semanal-date-range.ts" -NewName "date-range-config.ts"
    Write-Host "  ✓ Renamed semanal-date-range.ts to date-range-config.ts"
}

if (Test-Path "$coreBasePath\domain\semanal-date-range-repository.ts") {
    Rename-Item -Path "$coreBasePath\domain\semanal-date-range-repository.ts" -NewName "date-range-config-repository.ts"
    Write-Host "  ✓ Renamed semanal-date-range-repository.ts to date-range-config-repository.ts"
}

# Rename infrastructure files
if (Test-Path "$coreBasePath\infrastructure\models\semanal-date-range-db.model.ts") {
    Rename-Item -Path "$coreBasePath\infrastructure\models\semanal-date-range-db.model.ts" -NewName "date-range-config-db.model.ts"
    Write-Host "  ✓ Renamed semanal-date-range-db.model.ts to date-range-config-db.model.ts"
}

if (Test-Path "$coreBasePath\infrastructure\adapters\semanal-date-range-db-model-to-domain.adapter.ts") {
    Rename-Item -Path "$coreBasePath\infrastructure\adapters\semanal-date-range-db-model-to-domain.adapter.ts" -NewName "date-range-config-db-model-to-domain.adapter.ts"
    Write-Host "  ✓ Renamed semanal-date-range-db-model-to-domain.adapter.ts to date-range-config-db-model-to-domain.adapter.ts"
}

# Step 2: Rename main process repository
Show-Progress "Renaming main process repository..."
if (Test-Path "packages\main\src\repositories\SqlJsSemanalDateRangeRepository.ts") {
    Rename-Item -Path "packages\main\src\repositories\SqlJsSemanalDateRangeRepository.ts" -NewName "SqlJsDateRangeConfigRepository.ts"
    Write-Host "  ✓ Renamed SqlJsSemanalDateRangeRepository.ts to SqlJsDateRangeConfigRepository.ts"
}

# Step 3: Rename renderer components
Show-Progress "Renaming renderer components..."
if (Test-Path "packages\renderer\src\components\SemanalDateRangeSettings.tsx") {
    Rename-Item -Path "packages\renderer\src\components\SemanalDateRangeSettings.tsx" -NewName "DateRangeConfigSettings.tsx"
    Write-Host "  ✓ Renamed SemanalDateRangeSettings.tsx to DateRangeConfigSettings.tsx"
}

if (Test-Path "packages\renderer\src\components\SemanalFilter.tsx") {
    Rename-Item -Path "packages\renderer\src\components\SemanalFilter.tsx" -NewName "InDateRangeFilter.tsx"
    Write-Host "  ✓ Renamed SemanalFilter.tsx to InDateRangeFilter.tsx"
}

# Step 4: Rename script file
Show-Progress "Renaming script files..."
if (Test-Path "scripts\query-semanal-module-counts.ts") {
    Rename-Item -Path "scripts\query-semanal-module-counts.ts" -NewName "query-indaterange-module-counts.ts"
    Write-Host "  ✓ Renamed query-semanal-module-counts.ts to query-indaterange-module-counts.ts"
}

# Step 5: Update git to track renames
Show-Progress "Updating git to track file renames..."
git add -A
Write-Host "  ✓ Git tracking updated"

Write-Host ""
Write-Host "File renames completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Review the renamed files"
Write-Host "2. Run the content replacement script to update imports and references"
Write-Host "3. Build the project: pnpm run build"
Write-Host "4. Test the changes"
Write-Host ""
