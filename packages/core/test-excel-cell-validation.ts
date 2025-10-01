import ExcelJS from "exceljs";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple cell value extraction focused on existing app patterns
interface CellExtractionResult {
	value: string;
	link?: string;
	type: 'string' | 'hyperlink' | 'richText' | 'null';
	hasHyperlink: boolean;
	isRichText: boolean;
}

// Zod schema for validating extracted cell data - only supported types
const cellSchema = z.object({
	value: z.string(),
	link: z.string().optional(),
	type: z.enum(['string', 'hyperlink', 'richText', 'null']),
	hasHyperlink: z.boolean(),
	isRichText: z.boolean(),
});

// Simple schema that directly handles cell.value from ExcelJS
const cellValueSchema = z.union([
	z.string(),
	z.null().transform(() => ""),
	z.undefined().transform(() => ""),
	// Handle hyperlink objects with nested rich text
	z.object({
		text: z.union([
			z.string(),
			z.object({
				richText: z.array(z.object({
					text: z.string().optional()
				}))
			})
		]).optional(),
		hyperlink: z.string(),
	}).transform(obj => {
		if (obj.text) {
			if (typeof obj.text === "string") {
				return obj.text;
			} else if (obj.text.richText) {
				return obj.text.richText.map(rt => rt.text || "").join("");
			}
		}
		return "";
	}),
	// Handle direct rich text objects
	z.object({
		richText: z.array(z.object({
			text: z.string().optional()
		})),
	}).transform(obj => obj.richText.map(rt => rt.text || "").join("")),
]);

// Schema for extracting both value and link
const cellWithLinkSchema = z.union([
	z.string().transform(value => ({ value, link: undefined })),
	z.null().transform(() => ({ value: "", link: undefined })),
	z.undefined().transform(() => ({ value: "", link: undefined })),
	// Handle hyperlink objects
	z.object({
		text: z.union([
			z.string(),
			z.object({
				richText: z.array(z.object({
					text: z.string().optional()
				}))
			})
		]).optional(),
		hyperlink: z.string(),
	}).transform(obj => {
		let value = "";
		if (obj.text) {
			if (typeof obj.text === "string") {
				value = obj.text;
			} else if (obj.text.richText) {
				value = obj.text.richText.map(rt => rt.text || "").join("");
			}
		}
		return { value, link: obj.hyperlink };
	}),
	// Handle direct rich text objects
	z.object({
		richText: z.array(z.object({
			text: z.string().optional()
		})),
	}).transform(obj => ({ value: obj.richText.map(rt => rt.text || "").join(""), link: undefined })),
]);

// No complex extraction function needed! Zod schemas handle everything.

/**
 * Test a single Excel file
 */
async function testExcelFile(filePath: string): Promise<void> {
	console.log(`\n📊 Testing file: ${path.basename(filePath)}`);
	console.log("=".repeat(60));

	try {
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.readFile(filePath);

		const edgeCases: string[] = [];
		const cellTypes = new Set<string>();
		let totalCells = 0;
		let processedCells = 0;
		let skippedCells = 0;
		let hyperlinkCells = 0;
		let richTextCells = 0;

		workbook.eachSheet((worksheet, sheetId) => {
			console.log(`\n📋 Sheet: ${worksheet.name}`);

			// Test first 3 rows and first 5 columns for detailed output
			worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
				if (rowNumber > 3) return; // Limit to first 3 rows for detailed parsing output

				row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
					if (colNumber > 5) return; // Limit to first 5 columns
					totalCells++;

					try {
						// Simply validate cell.value with Zod schema - no complex extraction needed!
						const extractedValue = cellValueSchema.parse(cell.value);
						const extractedWithLink = cellWithLinkSchema.parse(cell.value);

						processedCells++;

						// Determine cell type for reporting and show more detail
						if (extractedWithLink.link) {
							hyperlinkCells++;
							console.log(`  🔗 Hyperlink [${rowNumber}, ${colNumber}]:`);
							console.log(`     Value: "${extractedWithLink.value}"`);
							console.log(`     Link: ${extractedWithLink.link}`);
							console.log(`     Raw: ${JSON.stringify(cell.value).substring(0, 150)}...`);
							cellTypes.add('hyperlink');
						} else if (cell.value && typeof cell.value === 'object' && 'richText' in cell.value) {
							richTextCells++;
							console.log(`  🎨 Rich Text [${rowNumber}, ${colNumber}]:`);
							console.log(`     Value: "${extractedValue}"`);
							console.log(`     Raw: ${JSON.stringify(cell.value).substring(0, 150)}...`);
							cellTypes.add('richText');
						} else {
							console.log(`  📝 String [${rowNumber}, ${colNumber}]: "${extractedValue}"`);
							cellTypes.add('string');
						}

						// Check for potential edge cases
						if (extractedValue === "" && cell.value !== null && cell.value !== undefined) {
							edgeCases.push(`Row ${rowNumber}, Col ${colNumber}: Empty extraction from non-null value - Raw: ${JSON.stringify(cell.value).substring(0, 50)}...`);
						}

					} catch (error) {
						// Schema validation failed - unsupported cell type
						skippedCells++;
						console.log(`  ⚠️  Skipped unsupported cell [${rowNumber}, ${colNumber}]: ${typeof cell.value}`);
					}
				});
			});
		});

		// Summary
		console.log(`\n📈 Summary for ${path.basename(filePath)}:`);
		console.log(`  Total cells encountered: ${totalCells}`);
		console.log(`  Processed (supported types): ${processedCells}`);
		console.log(`  Skipped (unsupported types): ${skippedCells}`);
		console.log(`  Hyperlink cells: ${hyperlinkCells}`);
		console.log(`  Rich text cells: ${richTextCells}`);
		console.log(`  Supported cell types found: ${Array.from(cellTypes).join(", ")}`);

		if (edgeCases.length > 0) {
			console.log(`\n⚠️  Edge cases in supported types (${edgeCases.length}):`);
			edgeCases.slice(0, 5).forEach(edge => console.log(`    - ${edge}`));
			if (edgeCases.length > 5) {
				console.log(`    ... and ${edgeCases.length - 5} more`);
			}
		} else {
			console.log(`\n✅ No edge cases found in supported types!`);
		}

	} catch (error) {
		console.error(`❌ Failed to process file ${filePath}:`, error);
	}
}

/**
 * Main test function
 */
async function main() {
	console.log("🧪 Excel Cell Validation Test");
	console.log("Testing ExcelJS + Zod cell extraction and validation");
	console.log("=".repeat(60));

	const filesDir = path.join(__dirname, "../../files");

	if (!fs.existsSync(filesDir)) {
		console.error("❌ Files directory not found:", filesDir);
		return;
	}

	const excelFiles = fs.readdirSync(filesDir)
		.filter(file => file.toLowerCase().endsWith('.xlsx'))
		.map(file => path.join(filesDir, file));

	if (excelFiles.length === 0) {
		console.error("❌ No Excel files found in files directory");
		return;
	}

	console.log(`📁 Found ${excelFiles.length} Excel files to test:`);
	excelFiles.forEach(file => console.log(`  - ${path.basename(file)}`));

	// Test each file
	for (const filePath of excelFiles) {
		await testExcelFile(filePath);
	}

	console.log("\n🎉 Testing complete!");

	// Test the schema with supported cell types only
	console.log("\n🔬 Testing Focused Schema (supported types only):");
	const testValues = [
		"simple string",
		null,
		undefined,
		{ text: "hyperlink text", hyperlink: "http://example.com" },
		{ richText: [{ text: "Rich " }, { text: "Text" }] }
	];

	testValues.forEach((testValue, index) => {
		try {
			const result = cellValueSchema.parse(testValue);
			console.log(`  ✅ Test ${index + 1}: ${JSON.stringify(testValue)} -> "${result}"`);
		} catch (error) {
			console.log(`  ❌ Test ${index + 1}: ${JSON.stringify(testValue)} -> FAILED: ${error}`);
		}
	});
}

// Run the test
main().catch(console.error);