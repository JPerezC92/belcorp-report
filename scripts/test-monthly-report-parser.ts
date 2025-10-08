import { promises as fs } from "fs";
import { ExcelMonthlyReportParserImpl, DateRangeConfig } from "@app/core";
import path from "path";

async function testMonthlyReportParser(): Promise<void> {
	try {
		console.log("📁 Testing Monthly Report Excel Parser");
		console.log("━".repeat(60));
		console.log("");

		// Read the Excel file
		const filePath = path.join(process.cwd(), "files", "XD 2025 DATA INFORME MENSUAL - Current Month.xlsx");
		console.log(`📂 Loading file: ${filePath}`);

		let fileBuffer: Buffer;
		try {
			fileBuffer = await fs.readFile(filePath);
			console.log(`✅ File loaded successfully (${fileBuffer.length} bytes)`);
		} catch (error) {
			console.error(`❌ Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
			return;
		}

		console.log("");

		// TEST 1: Parse without dateRangeConfig (fallback to isDateInRange)
		console.log("TEST 1: Parse without dateRangeConfig ⏳");
		console.log("─".repeat(60));

		const parser1 = new ExcelMonthlyReportParserImpl();
		const result1 = await parser1.parseExcel(fileBuffer.buffer, "XD 2025 DATA INFORME MENSUAL - Current Month.xlsx");

		if (result1.success && result1.records) {
			const records1 = result1.records;
			const inRangeCount1 = records1.filter(r => r.inDateRange).length;
			const outRangeCount1 = records1.filter(r => !r.inDateRange).length;

			console.log(`✅ Success: ${records1.length} records parsed`);
			console.log(`📊 Stats: inDateRange true=${inRangeCount1} (${((inRangeCount1/records1.length)*100).toFixed(1)}%), false=${outRangeCount1} (${((outRangeCount1/records1.length)*100).toFixed(1)}%)`);

			if (result1.warnings && result1.warnings.length > 0) {
				console.log(`⚠️  Warnings: ${result1.warnings.length}`);
				result1.warnings.slice(0, 5).forEach((warning, idx) => {
					console.log(`   ${idx + 1}. ${warning}`);
				});
				if (result1.warnings.length > 5) {
					console.log(`   ... and ${result1.warnings.length - 5} more warnings`);
				}
			}

			if (result1.errors && result1.errors.length > 0) {
				console.log(`❌ Errors: ${result1.errors.length}`);
				result1.errors.slice(0, 5).forEach((error, idx) => {
					console.log(`   ${idx + 1}. Row ${error.row}: ${error.field} - ${error.message}`);
				});
				if (result1.errors.length > 5) {
					console.log(`   ... and ${result1.errors.length - 5} more errors`);
				}
			}
		} else {
			console.log(`❌ Parse failed: ${result1.error || "Unknown error"}`);
			if (result1.errors) {
				result1.errors.slice(0, 5).forEach((error, idx) => {
					console.log(`   ${idx + 1}. Row ${error.row}: ${error.field} - ${error.message}`);
				});
			}
		}

		console.log("");

		// TEST 2: Parse with dateRangeConfig (Friday-Thursday)
		console.log("TEST 2: Parse with dateRangeConfig (Friday-Thursday) ⏳");
		console.log("─".repeat(60));

		// Create a mock dateRangeConfig for the most recent Friday-Thursday period
		const mockDateRangeConfig = DateRangeConfig.createDefaultRange();
		console.log(`📅 Using date range: ${mockDateRangeConfig.fromDate} to ${mockDateRangeConfig.toDate}`);
		console.log(`   Display: ${mockDateRangeConfig.getDisplayText()}`);
		console.log(`   Duration: ${mockDateRangeConfig.getDurationInDays()} days`);

		const parser2 = new ExcelMonthlyReportParserImpl();
		const result2 = await parser2.parseExcel(
			fileBuffer.buffer,
			"XD 2025 DATA INFORME MENSUAL - Current Month.xlsx",
			mockSemanalRange
		);

		if (result2.success && result2.records) {
			const records2 = result2.records;
			const inRangeCount2 = records2.filter(r => r.inDateRange).length;
			const outRangeCount2 = records2.filter(r => !r.inDateRange).length;

			console.log(`✅ Success: ${records2.length} records parsed`);
			console.log(`📊 Stats: inDateRange true=${inRangeCount2} (${((inRangeCount2/records2.length)*100).toFixed(1)}%), false=${outRangeCount2} (${((outRangeCount2/records2.length)*100).toFixed(1)}%)`);

			if (result2.warnings && result2.warnings.length > 0) {
				console.log(`⚠️  Warnings: ${result2.warnings.length}`);
				result2.warnings.slice(0, 5).forEach((warning, idx) => {
					console.log(`   ${idx + 1}. ${warning}`);
				});
				if (result2.warnings.length > 5) {
					console.log(`   ... and ${result2.warnings.length - 5} more warnings`);
				}
			}
		} else {
			console.log(`❌ Parse failed: ${result2.error || "Unknown error"}`);
			if (result2.errors) {
				result2.errors.slice(0, 5).forEach((error, idx) => {
					console.log(`   ${idx + 1}. Row ${error.row}: ${error.field} - ${error.message}`);
				});
			}
		}

		console.log("");

		// Display sample records from TEST 2 (with dateRangeConfig)
		if (result2.success && result2.records && result2.records.length > 0) {
			console.log("🔍 Sample Records (first 5 from TEST 2):");
			console.log("─".repeat(60));

			const sampleRecords = result2.records.slice(0, 5);

			sampleRecords.forEach((record, idx) => {
				const rangeIcon = record.inDateRange ? "✅" : "❌";
				console.log(`\n[${idx + 1}] Request ID: ${record.requestId}`);
				console.log(`    Business Unit: ${record.businessUnit}`);
				console.log(`    In Date Range: ${rangeIcon} ${record.inDateRange}`);
				console.log(`    REP: ${record.rep}`);
				console.log(`    Week: ${record.week}`);
				console.log(`    Created Time: ${record.createdTime}`);
				console.log(`    Applications: ${record.applications}`);
				console.log(`    Module: ${record.module}`);
				console.log(`    Request Status: ${record.requestStatus}`);
				console.log(`    Request Status Reporte: ${record.requestStatusReporte}`);
				console.log(`    Priority: ${record.priority || 'N/A'}`);
				console.log(`    Priority Reporte: ${record.priorityReporte || 'N/A'}`);
			});
		}

		console.log("");
		console.log("━".repeat(60));
		console.log("✅ Test completed successfully!");

	} catch (error) {
		console.error("\n❌ Error testing monthly report parser:");
		console.error("━".repeat(60));
		if (error instanceof Error) {
			console.error(`Message: ${error.message}`);
			console.error(`\nStack trace:`);
			console.error(error.stack);
		} else {
			console.error(String(error));
		}
		process.exit(1);
	}
}

// Run the test
testMonthlyReportParser()
	.then(() => {
		console.log("\n✅ All tests passed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n❌ Test failed:", error);
		process.exit(1);
	});
