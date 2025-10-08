import { promises as fs } from "fs";
import { WarRoomExcelParserImpl } from "@app/core";
import path from "path";

async function testWarRoomsParser(): Promise<void> {
	try {
		console.log("📁 Testing War Rooms Excel Parser");
		console.log("━".repeat(80));
		console.log("");

		// Read the Excel file
		const filePath = path.join(process.cwd(), "files", "EDWarRooms2025.xlsx");
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

		// Parse using the real parser
		console.log("🔄 Parsing with WarRoomExcelParserImpl...");
		console.log("─".repeat(80));

		const parser = new WarRoomExcelParserImpl();
		const result = await parser.parseExcel(fileBuffer.buffer, "EDWarRooms2025.xlsx");

		if (!result.success) {
			throw new Error(result.error || "Failed to parse Excel file");
		}

		console.log(`✅ Success: Parsed ${result.sheet?.rows.length || 0} war room records`);
		console.log("");

		// Display sample records
		if (result.sheet && result.sheet.rows.length > 0) {
			const sampleSize = Math.min(5, result.sheet.rows.length);
			console.log(`🔍 Sample Records (first ${sampleSize}):`);
			console.log("─".repeat(80));

			result.sheet.rows.slice(0, sampleSize).forEach((record, idx) => {
				console.log(`\n[Record ${idx + 1}]`);
				console.log(`   Application: ${record.application}`);
				console.log(`   Date: ${record.date}`);
				console.log(`   Incident ID: ${record.incidentId}${record.incidentIdLink ? ` [Link: ${record.incidentIdLink}]` : ""}`);
				console.log(`   Summary: ${record.summary.substring(0, 60)}${record.summary.length > 60 ? "..." : ""}`);
				console.log(`   Priority: ${record.initialPriority}`);
				console.log(`   Duration: ${record.durationMinutes} minutes`);
				console.log(`   Participants: ${record.participants}`);
				console.log(`   Status: ${record.status}`);
				console.log(`   Priority Changed: ${record.priorityChanged}`);
				console.log(`   Resolution Team Changed: ${record.resolutionTeamChanged}`);
				console.log(`   Notes: ${record.notes.substring(0, 60)}${record.notes.length > 60 ? "..." : ""}`);
				console.log(`   RCA Status: ${record.rcaStatus || "N/A"}`);
			});

			console.log("");
			console.log("─".repeat(80));

			// Statistics
			console.log(`\n📊 Statistics:`);
			const applications = new Set(result.sheet.rows.map(r => r.application));
			const statuses = new Set(result.sheet.rows.map(r => r.status));
			const priorities = new Set(result.sheet.rows.map(r => r.initialPriority));

			console.log(`   Total Records: ${result.sheet.rows.length}`);
			console.log(`   Applications: ${applications.size} unique (${Array.from(applications).join(", ")})`);
			console.log(`   Statuses: ${statuses.size} unique (${Array.from(statuses).join(", ")})`);
			console.log(`   Priorities: ${priorities.size} unique (${Array.from(priorities).join(", ")})`);
			console.log(`   Records with Links: ${result.sheet.rows.filter(r => r.incidentIdLink).length}`);
			console.log(`   Average Duration: ${(result.sheet.rows.reduce((sum, r) => sum + r.durationMinutes, 0) / result.sheet.rows.length).toFixed(1)} minutes`);
		}

		console.log("═".repeat(80));
		console.log("✅ War Rooms Excel parsing completed successfully!");
		console.log("═".repeat(80));

	} catch (error) {
		console.error("\n❌ Error testing war rooms parser:");
		console.error("━".repeat(80));
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
testWarRoomsParser()
	.then(() => {
		console.log("\n✅ All tests passed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n❌ Test failed:", error);
		process.exit(1);
	});
