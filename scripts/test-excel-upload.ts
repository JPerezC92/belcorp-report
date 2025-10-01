import { promises as fs } from "fs";
import { ExcelMonthlyReportParserImpl } from "@app/core";

async function testExcelUpload(): Promise<void> {
	try {
		console.log("📁 Reading Excel file...\n");

		// Read the Excel file
		const filePath = "XD 2025 DATA INFORME MENSUAL - Current Month.xlsx";
		const fileBuffer = await fs.readFile(filePath);

		console.log(`📊 File size: ${fileBuffer.length} bytes`);
		console.log("🔄 Parsing Excel file...\n");

		// Parse the Excel file
		const parser = new ExcelMonthlyReportParserImpl();
		const parseResult = await parser.parseExcel(fileBuffer.buffer, filePath);

		console.log("📋 Parse Result Summary:");
		console.log(`  - Success: ${parseResult.success}`);
		console.log(`  - File: ${parseResult.fileName}`);

		if (parseResult.success) {
			console.log(`  - Records parsed: ${parseResult.records?.length || 0}`);
			console.log(`  - Sheet name: ${parseResult.sheet?.name}`);
			console.log(`  - Headers count: ${parseResult.sheet?.headers.length || 0}`);
			console.log(`  - Rows count: ${parseResult.sheet?.rows.length || 0}`);

			if (parseResult.warnings && parseResult.warnings.length > 0) {
				console.log(`  - Warnings: ${parseResult.warnings.length}`);
				parseResult.warnings.forEach((warning, index) => {
					console.log(`    ${index + 1}. ${warning}`);
				});
			}

			// Show first few headers
			if (parseResult.sheet?.headers) {
				console.log("\n📊 Headers found:");
				parseResult.sheet.headers.forEach((header, index) => {
					console.log(`  ${index + 1}. "${header}"`);
				});
			}

			// Show sample of first record
			if (parseResult.records && parseResult.records.length > 0) {
				const firstRecord = parseResult.records[0];
				console.log("\n🔍 First Record Sample:");
				console.log(`  - Request ID: ${firstRecord.requestId}`);
				console.log(`  - Module: ${firstRecord.module}`);
				console.log(`  - Business Unit: ${firstRecord.businessUnit}`);
				console.log(`  - REP: ${firstRecord.rep}`);
				console.log(`  - In Date Range: ${firstRecord.inDateRange}`);
				console.log(`  - Day: ${firstRecord.dia}`);
				console.log(`  - Week: ${firstRecord.week}`);
				console.log(`  - Created Time: ${firstRecord.createdTime}`);
				console.log(`  - Applications: ${firstRecord.applications}`);
				console.log(`  - Categorization: ${firstRecord.categorization}`);
			}

			console.log("\n✅ Excel parsing completed successfully!");

		} else {
			console.log("❌ Parse failed with errors:");
			if (parseResult.errors) {
				parseResult.errors.forEach((error, index) => {
					console.log(`  ${index + 1}. Row ${error.row}, Field: ${error.field}`);
					console.log(`     Message: ${error.message}`);
				});
			}
		}

	} catch (error) {
		console.error("❌ Error testing Excel upload:", error);
		if (error instanceof Error) {
			console.error("Error message:", error.message);
			console.error("Stack trace:", error.stack);
		}
		process.exit(1);
	}
}

// Run the test
testExcelUpload()
	.then(() => {
		console.log("\n✅ Test completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Test failed:", error);
		process.exit(1);
	});