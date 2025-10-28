import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the actual production parser
const { parseSBOperationalReleasesExcel } = await import("./packages/core/dist/index.js");

async function testProductionParser() {
	const excelFilePath = join(__dirname, "files", "SB INCIDENTES ORDENES SESIONES.xlsx");
	console.log("📂 Testing production parser with file:", excelFilePath);
	console.log("═".repeat(80));

	const fileBuffer = readFileSync(excelFilePath);
	const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

	const result = await parseSBOperationalReleasesExcel(arrayBuffer);

	console.log("\n📊 PRODUCTION PARSER RESULTS:");
	console.log("═".repeat(80));
	console.log(`✅ Success: ${result.success}`);
	console.log(`📋 Total releases parsed: ${result.releases.length}`);
	console.log(`❌ Errors: ${result.errors.length}`);
	console.log(`⚠️  Warnings: ${result.warnings.length}`);
	console.log("═".repeat(80));

	if (result.errors.length > 0) {
		console.log("\n❌ ERRORS:");
		console.log("═".repeat(80));
		result.errors.forEach((err, idx) => {
			console.log(`${idx + 1}. Row ${err.row}: [${err.field || "GENERAL"}] ${err.message}`);
			if (err.value !== undefined) {
				console.log(`   Value: ${JSON.stringify(err.value)}`);
			}
		});
		console.log("═".repeat(80));
	}

	// Count releases by year
	const releasesByYear = {};
	result.releases.forEach((rel) => {
		const year = new Date(rel.date).getFullYear();
		releasesByYear[year] = (releasesByYear[year] || 0) + 1;
	});

	console.log("\n📊 RELEASES BY YEAR:");
	console.log("═".repeat(80));
	Object.entries(releasesByYear)
		.sort(([a], [b]) => Number(a) - Number(b))
		.forEach(([year, count]) => {
			console.log(`${year}: ${count} releases`);
		});
	console.log("═".repeat(80));

	// Show 2025 SB releases
	const sb2025 = result.releases.filter((rel) => {
		const year = new Date(rel.date).getFullYear();
		return year === 2025 && rel.application === "SB";
	}).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	console.log("\n📅 SB RELEASES IN 2025:");
	console.log("═".repeat(80));
	sb2025.forEach((rel, idx) => {
		const date = new Date(rel.date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric"
		});
		console.log(`${idx + 1}. ${date} - ${rel.releaseVersion} (Week ${rel.week || "N/A"})`);
	});
	console.log("═".repeat(80));
	console.log(`\n✅ Total SB releases in 2025: ${sb2025.length}`);

	if (sb2025.length !== 10) {
		console.log("\n⚠️  WARNING: Expected 10 SB releases in 2025, but found", sb2025.length);
	} else {
		console.log("\n🎉 SUCCESS: Found all 10 SB releases in 2025!");
	}
}

testProductionParser().catch((err) => {
	console.error("💥 Fatal error:", err);
	process.exit(1);
});
