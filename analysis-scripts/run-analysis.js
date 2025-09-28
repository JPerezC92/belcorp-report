import { execSync } from 'child_process';

console.log('🚀 Running Monthly Report Excel Analysis...');
console.log('==========================================');

try {
    // Run the TypeScript analysis script
    execSync('npx tsx analysis-scripts/analyze-monthly-report.ts', {
        stdio: 'inherit',
        cwd: process.cwd()
    });
} catch (error) {
    console.error('❌ Error running analysis:', error);
    process.exit(1);
}

console.log('✅ Analysis completed successfully!');
