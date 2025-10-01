import { promises as fs } from "fs";
import { ExcelTagReportParser } from "@app/core";

/**
 * Test script for REP01 XD TAG parser validation
 *
 * This script validates the correct parsing of REP01 XD TAG 2025.xlsx file
 * Expected structure: ManageEngine Report Framework sheet with columns:
 * - Created Time
 * - Request ID (with hyperlink)
 * - Información Adicional
 * - Modulo.
 * - Problem ID (with hyperlink)
 * - Linked Request Id (with hyperlink)
 * - Jira
 * - Categorización
 * - Technician
 */
async function testTagParser(): Promise<void> {
	try {
		console.log("📁 Reading REP01 XD TAG Excel file...\n");

		// Read the Excel file
		const filePath = "files/REP01 XD TAG 2025.xlsx";
		const fileBuffer = await fs.readFile(filePath);

		console.log(`📊 File size: ${fileBuffer.length} bytes`);
		console.log("🔄 Parsing Excel file...\n");

		// Parse the Excel file
		const parser = new ExcelTagReportParser();
		const parseResult = await parser.parseExcel(fileBuffer.buffer, filePath);

		console.log("📋 Parse Result Summary:");
		console.log(`  - Success: ${parseResult.success}`);
		console.log(`  - File: ${parseResult.fileName}`);

		if (parseResult.success && parseResult.sheet) {
			console.log(`  - Sheet name: ${parseResult.sheet.name}`);
			console.log(`  - Headers count: ${parseResult.sheet.headers.length}`);
			console.log(`  - Records parsed: ${parseResult.sheet.rows.length}`);

			// Show headers
			console.log("\n📊 Headers found:");
			parseResult.sheet.headers.forEach((header, index) => {
				console.log(`  ${index + 1}. "${header}"`);
			});

			// Show first 3 records with details
			if (parseResult.sheet.rows.length > 0) {
				console.log("\n🔍 First 3 Records Sample:\n");

				parseResult.sheet.rows.slice(0, 3).forEach((tag, index) => {
					console.log(`--- Record ${index + 1} ---`);
					console.log(`  Request ID: ${tag.requestId} (${tag.requestIdLink ? "has link" : "no link"})`);
					console.log(`  Created Time: ${tag.createdTime}`);
					console.log(`  Additional Info: ${tag.additionalInfo.substring(0, 50)}${tag.additionalInfo.length > 50 ? "..." : ""}`);
					console.log(`  Module: ${tag.module}`);
					console.log(`  Problem ID: ${tag.problemId} (${tag.problemIdLink ? "has link" : "no link"})`);
					console.log(`  Linked Request: ${tag.linkedRequestId} (${tag.linkedRequestIdLink ? "has link" : "no link"})`);
					console.log(`  Technician: ${tag.technician}`);
					console.log(`  Categorization: ${tag.categorization}`);
					console.log(`  Jira: ${tag.jira || "(empty)"}`);
					console.log();
				});
			}

			// Validation checks
			console.log("✅ Validation Checks:");

			const recordsWithLinks = parseResult.sheet.rows.filter(
				(tag) => tag.requestIdLink
			);
			console.log(`  - Records with Request ID links: ${recordsWithLinks.length}/${parseResult.sheet.rows.length}`);

			const recordsWithProblemLinks = parseResult.sheet.rows.filter(
				(tag) => tag.problemIdLink
			);
			console.log(`  - Records with Problem ID links: ${recordsWithProblemLinks.length}/${parseResult.sheet.rows.length}`);

			const recordsWithLinkedRequestLinks = parseResult.sheet.rows.filter(
				(tag) => tag.linkedRequestIdLink
			);
			console.log(`  - Records with Linked Request links: ${recordsWithLinkedRequestLinks.length}/${parseResult.sheet.rows.length}`);

			const recordsWithTechnician = parseResult.sheet.rows.filter(
				(tag) => tag.technician && tag.technician.trim() !== ""
			);
			console.log(`  - Records with Technician: ${recordsWithTechnician.length}/${parseResult.sheet.rows.length}`);

			console.log("\n✅ REP01 XD TAG parsing completed successfully!");

		} else {
			console.log("❌ Parse failed");
			if (!parseResult.success) {
				console.log("  - Parser returned success: false");
			}
		}

	} catch (error) {
		console.error("❌ Error testing TAG parser:", error);
		if (error instanceof Error) {
			console.error("Error message:", error.message);
			console.error("Stack trace:", error.stack);
		}
		process.exit(1);
	}
}

// Run the test
testTagParser()
	.then(() => {
		console.log("\n✅ Test completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Test failed:", error);
		process.exit(1);
	});