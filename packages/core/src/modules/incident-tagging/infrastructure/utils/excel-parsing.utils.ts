import type ExcelJS from "exceljs";

/**
 * Common utilities for Excel parsing operations
 */

/**
 * Safely extracts header value from an Excel cell
 */
export function extractHeaderValue(
	cell: ExcelJS.Cell,
	columnLetter: string
): string {
	let headerValue: string;

	// Handle different cell value types
	if (cell.value === null || cell.value === undefined) {
		headerValue = `Column${columnLetter}`;
	} else if (typeof cell.value === "string") {
		headerValue = cell.value;
	} else if (
		typeof cell.value === "object" &&
		cell.value &&
		"richText" in cell.value
	) {
		// Handle rich text
		const richText = cell.value.richText;
		headerValue = Array.isArray(richText)
			? richText
					.map((rt) =>
						typeof rt.text === "string"
							? rt.text
							: String(rt.text ?? "")
					)
					.join("")
			: String(cell.value);
	} else if (Array.isArray(cell.value)) {
		// Handle array values
		headerValue = cell.value
			.map((v) => (typeof v === "string" ? v : String(v ?? "")))
			.join(" ");
	} else {
		// Handle numbers, booleans, dates, etc.
		headerValue = String(cell.value);
	}

	// Fallback to cell.text if we still don't have a good value
	if (!headerValue || headerValue.trim() === "") {
		headerValue = cell.text || `Column${columnLetter}`;
	}

	return headerValue.trim();
}

/**
 * Extracts cell value and link information from an Excel cell
 */
export function extractCellValueAndLink(cell: ExcelJS.Cell): {
	value: string;
	link: string;
} {
	let cellValue = cell.text || "";
	let cellLink = "";

	// Check if this is a hyperlink cell
	if (
		cell.value &&
		typeof cell.value === "object" &&
		"hyperlink" in cell.value
	) {
		const hyperlinkObj = cell.value as {
			text?: string;
			hyperlink: string;
			value?: unknown;
		};
		// Use cell.text for the display value, which handles rich text properly
		cellValue = cell.text || hyperlinkObj.text || "";
		cellLink = hyperlinkObj.hyperlink;
	}

	return { value: cellValue, link: cellLink };
}

/**
 * Determines if a header represents a link column
 */
export function isLinkColumn(
	header: string,
	linkHeaders: readonly string[]
): boolean {
	return linkHeaders.some((linkHeader) =>
		header.toLowerCase().includes(linkHeader.toLowerCase())
	);
}

/**
 * Validates headers against expected headers with flexible matching
 */
export function validateHeaders(
	headers: string[],
	expectedHeaders: readonly string[],
	expectedLength: number
): void {
	if (headers.length !== expectedLength) {
		throw new Error(
			`Expected ${expectedLength} headers, but found ${headers.length}`
		);
	}

	const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
	const normalizedExpected = expectedHeaders.map((h) =>
		h.toLowerCase().trim()
	);

	for (let i = 0; i < normalizedExpected.length; i++) {
		const expected = normalizedExpected[i];
		const actual = normalizedHeaders[i];
		if (expected && actual) {
			// Check if headers match when normalized (spaces and case removed)
			const expectedNormalized = expected
				.replace(/\s+/g, "")
				.toLowerCase();
			const actualNormalized = actual.replace(/\s+/g, "").toLowerCase();

			// Allow flexible matching - check if they contain the same key words
			const expectedWords = expectedNormalized
				.split(/(?=[A-Z])|[\s\-_]/)
				.filter((w) => w.length > 0);
			const actualWords = actualNormalized
				.split(/(?=[A-Z])|[\s\-_]/)
				.filter((w) => w.length > 0);

			const hasMatchingWords = expectedWords.some(
				(word) =>
					actualNormalized.includes(word) ||
					actualWords.some((actualWord) =>
						expectedNormalized.includes(actualWord)
					)
			);

			if (!hasMatchingWords && expectedNormalized !== actualNormalized) {
				console.warn(
					`Header mismatch at position ${i}: expected "${expected}" (normalized: "${expectedNormalized}"), got "${actual}" (normalized: "${actualNormalized}")`
				);
				// For now, allow the mismatch but log it - the Zod schema will handle the transformation
			}
		}
	}
}
