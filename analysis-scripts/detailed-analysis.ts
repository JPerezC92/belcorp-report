import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

const EXCEL_FILE = "XD 2025 DATA INFORME MENSUAL - Current Month.xlsx";

async function detailedMonthlyReportAnalysis() {
	console.log("🔬 DETAILED Monthly Report Excel Analysis for Parsing");
	console.log("===================================================");

	try {
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.readFile(EXCEL_FILE);

		const mainSheet = workbook.worksheets[0];
		console.log(`📊 File: ${EXCEL_FILE}`);
		console.log(`📄 Sheet: "${mainSheet.name}"`);
		console.log(`📈 Total Rows: ${mainSheet.rowCount}`);
		console.log(`📊 Total Columns: ${mainSheet.columnCount}`);
		console.log("");

		// Get headers
		const headerRow = mainSheet.getRow(1);
		const headers: string[] = [];

		headerRow.eachCell((cell, colNumber) => {
			let headerValue = "";

			if (cell.value !== null && cell.value !== undefined) {
				if (
					typeof cell.value === "object" &&
					"richText" in cell.value
				) {
					const richText = (cell.value as any).richText;
					if (Array.isArray(richText)) {
						headerValue = richText
							.map((rt: any) => rt.text)
							.join("");
					}
				} else if (
					typeof cell.value === "object" &&
					"text" in cell.value
				) {
					headerValue = (cell.value as any).text || "";
				} else {
					headerValue = String(cell.value);
				}
			}

			headers.push(headerValue);
		});

		console.log("📋 COLUMN HEADERS (Spanish → English Mapping):");
		console.log("==============================================");
		const columnMappings = [
			{ spanish: "Aplicativos", english: "Applications" },
			{ spanish: "Categorización", english: "Categorization" },
			{ spanish: "Request ID", english: "RequestId" },
			{ spanish: "Created Time", english: "CreatedTime" },
			{ spanish: "Request Status", english: "RequestStatus" },
			{ spanish: "Modulo.", english: "Module" },
			{ spanish: "Subject", english: "Subject" },
			{ spanish: "Priority", english: "Priority" },
			{ spanish: "ETA", english: "ETA" },
			{ spanish: "Información Adicional", english: "AdditionalInfo" },
			{ spanish: "Resolved Time", english: "ResolvedTime" },
			{ spanish: "Países Afectados", english: "AffectedCountries" },
			{ spanish: "Recurrencia", english: "Recurrence" },
			{ spanish: "Technician", english: "Technician" },
			{ spanish: "Jira", english: "Jira" },
			{ spanish: "Problem ID", english: "ProblemId" },
			{ spanish: "Linked Request Id", english: "LinkedRequestId" },
			{ spanish: "Request OLA Status", english: "RequestOLAStatus" },
			{ spanish: "Grupo Escalamiento", english: "EscalationGroup" },
			{
				spanish: "Aplicactivos Afectados",
				english: "AffectedApplications",
			},
			{
				spanish: "¿Este Incidente se debió Resolver en Nivel 1?",
				english: "ShouldResolveLevel1",
			},
			{ spanish: "Campaña", english: "Campaign" },
			{ spanish: "CUV_1", english: "CUV1" },
			{ spanish: "Release", english: "Release" },
			{ spanish: "RCA", english: "RCA" },
		];

		columnMappings.forEach((mapping, index) => {
			console.log(
				`   ${index + 1}. "${mapping.spanish}" → ${mapping.english}`
			);
		});
		console.log("");

		// Analyze data patterns and validation rules
		console.log("🔍 DATA VALIDATION & PARSING REQUIREMENTS:");
		console.log("==========================================");

		// Check for hyperlinks in specific columns
		const hyperlinkColumns = [
			"Request ID",
			"Subject",
			"Problem ID",
			"Linked Request Id",
		];
		console.log("🔗 Hyperlink Columns:");
		hyperlinkColumns.forEach((col) => {
			const colIndex = headers.indexOf(col);
			if (colIndex >= 0) {
				console.log(
					`   - ${col}: Column ${
						colIndex + 1
					} (rich text hyperlinks expected)`
				);
			}
		});
		console.log("");

		// Check date columns
		const dateColumns = ["Created Time", "Resolved Time"];
		console.log("📅 Date Columns (Format: dd/MM/yyyy HH:mm):");
		dateColumns.forEach((col) => {
			const colIndex = headers.indexOf(col);
			if (colIndex >= 0) {
				console.log(`   - ${col}: Column ${colIndex + 1}`);

				// Sample date values
				let sampleDates: string[] = [];
				for (
					let row = 2;
					row <= Math.min(6, mainSheet.rowCount);
					row++
				) {
					const cell = mainSheet.getRow(row).getCell(colIndex + 1);
					if (cell.value) {
						let dateValue = "";
						if (
							typeof cell.value === "object" &&
							"text" in cell.value
						) {
							dateValue = (cell.value as any).text || "";
						} else {
							dateValue = String(cell.value);
						}
						if (dateValue && dateValue !== "No asignado") {
							sampleDates.push(dateValue);
						}
					}
				}
				console.log(
					`     Sample values: [${sampleDates
						.slice(0, 3)
						.join(", ")}]`
				);
			}
		});
		console.log("");

		// Check priority values
		const priorityColIndex = headers.indexOf("Priority");
		if (priorityColIndex >= 0) {
			console.log("🎯 Priority Values Mapping:");
			const priorities = new Set<string>();
			for (let row = 2; row <= mainSheet.rowCount; row++) {
				const cell = mainSheet
					.getRow(row)
					.getCell(priorityColIndex + 1);
				if (cell.value) {
					let priorityValue = "";
					if (
						typeof cell.value === "object" &&
						"text" in cell.value
					) {
						priorityValue = (cell.value as any).text || "";
					} else {
						priorityValue = String(cell.value);
					}
					if (priorityValue) priorities.add(priorityValue);
				}
			}
			console.log(
				`   Found values: [${Array.from(priorities).join(", ")}]`
			);
			console.log(
				"   Mapping: Alta → High, Media → Medium, Baja → Low, Crítica → Critical"
			);
		}
		console.log("");

		// Check status values
		const statusColIndex = headers.indexOf("Request Status");
		if (statusColIndex >= 0) {
			console.log("📊 Request Status Values:");
			const statuses = new Set<string>();
			for (let row = 2; row <= mainSheet.rowCount; row++) {
				const cell = mainSheet.getRow(row).getCell(statusColIndex + 1);
				if (cell.value) {
					let statusValue = "";
					if (
						typeof cell.value === "object" &&
						"richText" in cell.value
					) {
						const richText = (cell.value as any).richText;
						if (Array.isArray(richText)) {
							statusValue = richText
								.map((rt: any) => rt.text)
								.join("");
						}
					} else if (
						typeof cell.value === "object" &&
						"text" in cell.value
					) {
						statusValue = (cell.value as any).text || "";
					} else {
						statusValue = String(cell.value);
					}
					if (statusValue) statuses.add(statusValue);
				}
			}
			console.log(
				`   Found values: [${Array.from(statuses).join(", ")}]`
			);
		}
		console.log("");

		// Business unit assignment logic
		const appsColIndex = headers.indexOf("Aplicativos");
		if (appsColIndex >= 0) {
			console.log("🏢 Business Unit Assignment Logic:");
			const applications = new Set<string>();
			for (let row = 2; row <= mainSheet.rowCount; row++) {
				const cell = mainSheet.getRow(row).getCell(appsColIndex + 1);
				if (cell.value) {
					let appValue = "";
					if (
						typeof cell.value === "object" &&
						"richText" in cell.value
					) {
						const richText = (cell.value as any).richText;
						if (Array.isArray(richText)) {
							appValue = richText
								.map((rt: any) => rt.text)
								.join("");
						}
					} else {
						appValue = String(cell.value);
					}
					if (appValue) applications.add(appValue);
				}
			}
			console.log(
				`   Found Applications: [${Array.from(applications).join(
					", "
				)}]`
			);
			console.log("   Assignment Rules:");
			console.log('   - "Unete 2.0" → UN-2');
			console.log('   - "Unete 3.0" → UB-3');
			console.log('   - "Somos Belcorp 2.0" → SB');
			console.log("   - Other patterns → FFVV");
		}
		console.log("");

		// Check for null/empty values
		console.log("🔍 NULL/EMPTY VALUE ANALYSIS:");
		console.log("=============================");
		const nullCounts: { [key: string]: number } = {};
		headers.forEach((header) => {
			nullCounts[header] = 0;
		});

		for (let row = 2; row <= mainSheet.rowCount; row++) {
			headers.forEach((header, colIndex) => {
				const cell = mainSheet.getRow(row).getCell(colIndex + 1);
				if (
					!cell.value ||
					(typeof cell.value === "object" &&
						"text" in cell.value &&
						!(cell.value as any).text)
				) {
					nullCounts[header]++;
				}
			});
		}

		headers.forEach((header) => {
			const nullPercent = (
				(nullCounts[header] / (mainSheet.rowCount - 1)) *
				100
			).toFixed(1);
			console.log(
				`   ${header}: ${nullCounts[header]} nulls (${nullPercent}%)`
			);
		});

		console.log("");
		console.log("✅ PARSING REQUIREMENTS SUMMARY:");
		console.log("===============================");
		console.log(
			"✓ Rich text hyperlink extraction for Request ID, Subject, Problem ID, Linked Request Id"
		);
		console.log(
			"✓ European date parsing (dd/MM/yyyy HH:mm) for Created Time, Resolved Time"
		);
		console.log(
			"✓ Priority value mapping (Alta→High, Media→Medium, Baja→Low, Crítica→Critical)"
		);
		console.log(
			"✓ Business unit assignment based on Applications patterns"
		);
		console.log('✓ Handle "No asignado" as null/undefined values');
		console.log("✓ All columns use rich text format");
		console.log(
			"✓ Hyperlink URL pattern: https://sdp.belcorp.biz/WorkOrder.do?PORTALID=1&woMode=viewWO&woID={workOrderId}"
		);
	} catch (error) {
		console.error("❌ Error in detailed analysis:", error);
	}
}

// Run the detailed analysis
detailedMonthlyReportAnalysis().catch(console.error);
