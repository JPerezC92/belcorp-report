import { readFileSync } from "fs";
import { ExcelMonthlyReportParser } from "./packages/core/dist/index.js";

async function testMonthlyParser() {
	const parser = new ExcelMonthlyReportParser();
	const buffer = readFileSync(
		"./XD 2025 DATA INFORME MENSUAL - Current Month.xlsx",
	);

	try {
		const result = await parser.parse({
			fileBuffer: buffer.buffer.slice(
				buffer.byteOffset,
				buffer.byteOffset + buffer.byteLength,
			),
			fileName: "XD 2025 DATA INFORME MENSUAL - Current Month.xlsx",
		});
		console.log("Parse result:", result.success ? "SUCCESS" : "FAILED");
		if (!result.success) {
			console.log("Errors:", result.errors);
		} else {
			console.log("Parsed", result.data?.length || 0, "rows");
		}
	} catch (error) {
		console.error("Parse error:", error);
	}
}

testMonthlyParser();
