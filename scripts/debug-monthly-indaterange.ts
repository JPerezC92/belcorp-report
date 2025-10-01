import { promises as fs } from "fs";
import { ExcelMonthlyReportParserImpl, SemanalDateRange } from "@app/core";
import { DateTime } from "luxon";
import path from "path";

async function debugMonthlyInDateRange(): Promise<void> {
	try {
		console.log("🔍 Debugging Monthly Report inDateRange Calculation");
		console.log("━".repeat(80));
		console.log("");

		// Read the Excel file
		const filePath = path.join(process.cwd(), "files", "XD 2025 DATA INFORME MENSUAL - Current Month.xlsx");
		const fileBuffer = await fs.readFile(filePath);
		console.log(`✅ File loaded: ${fileBuffer.length} bytes\n`);

		// Create the active semanal range (Sept 19-25, 2025)
		const semanalRange = new SemanalDateRange(
			1,
			"2025-09-19", // Friday
			"2025-09-25", // Thursday
			"Cut to Thursday",
			true,
			new Date(),
			new Date()
		);

		console.log("📅 Active Semanal Date Range:");
		console.log(`   From: ${semanalRange.fromDate} (Friday)`);
		console.log(`   To: ${semanalRange.toDate} (Thursday)`);
		console.log(`   Duration: ${semanalRange.getDurationInDays()} days`);
		console.log("");

		// Parse with semanalDateRange
		const parser = new ExcelMonthlyReportParserImpl();
		const result = await parser.parseExcel(
			fileBuffer.buffer,
			"XD 2025 DATA INFORME MENSUAL - Current Month.xlsx",
			semanalRange
		);

		if (!result.success || !result.records) {
			console.error("❌ Parsing failed!");
			return;
		}

		const records = result.records;
		console.log(`📊 Total records parsed: ${records.length}\n`);

		// Analyze inDateRange distribution
		const inRangeRecords = records.filter(r => r.inDateRange === true);
		const outRangeRecords = records.filter(r => r.inDateRange === false);

		console.log("📈 Distribution:");
		console.log(`   In Range: ${inRangeRecords.length} (${((inRangeRecords.length/records.length)*100).toFixed(1)}%)`);
		console.log(`   Out of Range: ${outRangeRecords.length} (${((outRangeRecords.length/records.length)*100).toFixed(1)}%)`);
		console.log("");

		// Show ALL in-range records with details
		if (inRangeRecords.length > 0) {
			console.log("✅ Records IN DATE RANGE (Sept 19-25, 2025):");
			console.log("─".repeat(80));
			inRangeRecords.forEach((record, idx) => {
				const createdDate = DateTime.fromFormat(record.createdTime, "dd/MM/yyyy HH:mm", { zone: "America/Lima" });
				console.log(`\n[${idx + 1}] Request ID: ${record.requestId}`);
				console.log(`    Created Time: ${record.createdTime}`);
				console.log(`    Parsed Date: ${createdDate.toISODate()} (${createdDate.weekdayLong})`);
				console.log(`    Business Unit: ${record.businessUnit}`);
				console.log(`    Module: ${record.module}`);
				console.log(`    Week: ${record.week}`);
				console.log(`    inDateRange: ${record.inDateRange}`);

				// Verify manually
				const fromDateTime = DateTime.fromISO("2025-09-19").startOf('day');
				const toDateTime = DateTime.fromISO("2025-09-25").endOf('day');
				const isInRange = createdDate >= fromDateTime && createdDate <= toDateTime;
				console.log(`    Manual check: ${isInRange ? '✅ YES' : '❌ NO'} (${createdDate.toISODate()} between ${fromDateTime.toISODate()} and ${toDateTime.toISODate()})`);
			});
		} else {
			console.log("⚠️  NO RECORDS IN DATE RANGE!");
			console.log("   This means all records are outside Sept 19-25, 2025");
		}

		// Sample some out-of-range records to see the dates
		console.log("\n\n❌ Sample OUT OF RANGE Records (first 10):");
		console.log("─".repeat(80));
		outRangeRecords.slice(0, 10).forEach((record, idx) => {
			const createdDate = DateTime.fromFormat(record.createdTime, "dd/MM/yyyy HH:mm", { zone: "America/Lima" });
			console.log(`[${idx + 1}] ${record.requestId} | ${record.createdTime} | ${createdDate.toISODate()} (${createdDate.weekdayLong}) | Week ${record.week}`);
		});

		// Check date range of ALL records
		const allDates = records.map(r => {
			const dt = DateTime.fromFormat(r.createdTime, "dd/MM/yyyy HH:mm", { zone: "America/Lima" });
			return dt.toISODate();
		});
		const uniqueDates = [...new Set(allDates)].sort();

		console.log("\n\n📆 Date Range of ALL Records:");
		console.log(`   Earliest: ${uniqueDates[0]}`);
		console.log(`   Latest: ${uniqueDates[uniqueDates.length - 1]}`);
		console.log(`   Total unique dates: ${uniqueDates.length}`);

		// Show dates in target range
		const datesInTargetRange = uniqueDates.filter(dateStr => {
			const dt = DateTime.fromISO(dateStr);
			const from = DateTime.fromISO("2025-09-19");
			const to = DateTime.fromISO("2025-09-25");
			return dt >= from && dt <= to;
		});

		console.log(`\n   Dates within Sept 19-25, 2025: ${datesInTargetRange.length}`);
		if (datesInTargetRange.length > 0) {
			console.log(`   ${datesInTargetRange.join(", ")}`);
		}

		console.log("\n" + "━".repeat(80));
		console.log("✅ Debug completed!");

	} catch (error) {
		console.error("\n❌ Error:", error);
		if (error instanceof Error) {
			console.error(error.stack);
		}
		process.exit(1);
	}
}

// Run
debugMonthlyInDateRange()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("❌ Failed:", error);
		process.exit(1);
	});
