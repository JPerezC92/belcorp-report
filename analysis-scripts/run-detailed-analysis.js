import { execSync } from 'child_process';

console.log('🔬 Running Detailed Monthly Report Excel Analysis...');
console.log('===================================================');

try {
    // Run the detailed TypeScript analysis script
    execSync('npx tsx analysis-scripts/detailed-analysis.ts', {
        stdio: 'inherit',
        cwd: process.cwd()
    });
} catch (error) {
    console.error('❌ Error running detailed analysis:', error);
    process.exit(1);
}

console.log('✅ Detailed analysis completed successfully!');
