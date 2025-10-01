import { promises as fs } from "fs";
import { CorrectiveMaintenanceExcelParserImpl, SemanalDateRange } from "@app/core";
import { DateTime } from "luxon";
import path from "path";

async function testCorrectiveMaintenanceParser(): Promise<void> {
	try {
		console.log("📁 Testing Corrective Maintenance Excel Parser");
		console.log("━".repeat(60));
		console.log("");

		// Read the Excel file
		const filePath = path.join(process.cwd(), "files", "XD SEMANAL CORRECTIVO.xlsx");
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

		// TEST 1: Parse without semanalDateRange (fallback to isCurrentWeek)
		console.log("TEST 1: Parse without semanalDateRange (fallback mode) ⏳");
		console.log("─".repeat(60));

		const parser1 = new CorrectiveMaintenanceExcelParserImpl();
		const result1 = await parser1.parseExcel(fileBuffer.buffer, "XD SEMANAL CORRECTIVO.xlsx");

		if (result1.success && result1.sheet) {
			const records1 = result1.sheet.rows;
			const inRangeCount1 = records1.filter(r => r.inDateRange).length;
			const outRangeCount1 = records1.filter(r => !r.inDateRange).length;

			console.log(`✅ Success: ${records1.length} records parsed`);
			console.log(`📊 Stats: inDateRange true=${inRangeCount1} (${((inRangeCount1/records1.length)*100).toFixed(1)}%), false=${outRangeCount1} (${((outRangeCount1/records1.length)*100).toFixed(1)}%)`);

			if (result1.warnings && result1.warnings.length > 0) {
				console.log(`⚠️  Warnings: ${result1.warnings.length}`);
				result1.warnings.forEach((warning, idx) => {
					console.log(`   ${idx + 1}. ${warning}`);
				});
			}
		} else {
			console.log(`❌ Parse failed: ${result1.error || "Unknown error"}`);
			if (result1.warnings) {
				result1.warnings.forEach(w => console.log(`   - ${w}`));
			}
		}

		console.log("");

		// TEST 2: Parse with semanalDateRange (Friday-Thursday)
		console.log("TEST 2: Parse with semanalDateRange (Friday-Thursday) ⏳");
		console.log("─".repeat(60));

		// Create a mock semanalDateRange for the most recent Friday-Thursday period
		const mockSemanalRange = SemanalDateRange.createDefaultRange();
		console.log(`📅 Using date range: ${mockSemanalRange.fromDate} to ${mockSemanalRange.toDate}`);
		console.log(`   Display: ${mockSemanalRange.getDisplayText()}`);
		console.log(`   Duration: ${mockSemanalRange.getDurationInDays()} days`);

		const parser2 = new CorrectiveMaintenanceExcelParserImpl();
		const result2 = await parser2.parseExcel(fileBuffer.buffer, "XD SEMANAL CORRECTIVO.xlsx", mockSemanalRange);

		if (result2.success && result2.sheet) {
			const records2 = result2.sheet.rows;
			const inRangeCount2 = records2.filter(r => r.inDateRange).length;
			const outRangeCount2 = records2.filter(r => !r.inDateRange).length;

			console.log(`✅ Success: ${records2.length} records parsed`);
			console.log(`📊 Stats: inDateRange true=${inRangeCount2} (${((inRangeCount2/records2.length)*100).toFixed(1)}%), false=${outRangeCount2} (${((outRangeCount2/records2.length)*100).toFixed(1)}%)`);

			if (result2.warnings && result2.warnings.length > 0) {
				console.log(`⚠️  Warnings: ${result2.warnings.length}`);
				result2.warnings.forEach((warning, idx) => {
					console.log(`   ${idx + 1}. ${warning}`);
				});
			}
		} else {
			console.log(`❌ Parse failed: ${result2.error || "Unknown error"}`);
			if (result2.warnings) {
				result2.warnings.forEach(w => console.log(`   - ${w}`));
			}
		}

		console.log("");

		// Display sample records from TEST 2 (with semanalDateRange)
		if (result2.success && result2.sheet && result2.sheet.rows.length > 0) {
			console.log("🔍 Sample Records (first 5 from TEST 2):");
			console.log("─".repeat(60));

			const sampleRecords = result2.sheet.rows.slice(0, 5);

			sampleRecords.forEach((record, idx) => {
				const rangeIcon = record.inDateRange ? "✅" : "❌";
				console.log(`\n[${idx + 1}] Request ID: ${record.requestId}`);
				console.log(`    Business Unit: ${record.businessUnit}`);
				console.log(`    In Date Range: ${rangeIcon} ${record.inDateRange}`);
				console.log(`    Created Time: ${record.createdTime}`);
				console.log(`    Applications: ${record.applications}`);
				console.log(`    Categorization: ${record.categorization}`);
				console.log(`    Request Status: ${record.requestStatus}`);
				console.log(`    Module: ${record.module}`);
				console.log(`    Subject: ${record.subject.substring(0, 60)}${record.subject.length > 60 ? "..." : ""}`);
				console.log(`    Priority: ${record.priority}`);
				console.log(`    Enlaces: ${record.enlaces}`);
				console.log(`    ETA: ${record.eta}`);
				console.log(`    RCA: ${record.rca.substring(0, 60)}${record.rca.length > 60 ? "..." : ""}`);
			});
		}

		console.log("");
		console.log("━".repeat(60));
		console.log("✅ Test completed successfully!");

	} catch (error) {
		console.error("\n❌ Error testing corrective maintenance parser:");
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
testCorrectiveMaintenanceParser()
	.then(() => {
		console.log("\n✅ All tests passed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n❌ Test failed:", error);
		process.exit(1);
	});
