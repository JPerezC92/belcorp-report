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
		console.log(
			`DEBUG: Found rich text in cell.value for column ${columnLetter}:`,
			cell.value
		);
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
		console.log(`DEBUG: Extracted header value: "${headerValue}"`);
	} else if (Array.isArray(cell.value)) {
		// Handle array values
		headerValue = cell.value
			.map((v) => (typeof v === "string" ? v : String(v ?? "")))
			.join(" ");
	} else if (typeof cell.value === "object" && cell.value !== null) {
		// Handle other object types - try to extract meaningful text
		const objValue = cell.value as unknown as Record<string, unknown>;
		if (objValue["text"] && typeof objValue["text"] === "string") {
			headerValue = objValue["text"] as string;
		} else if (
			objValue["result"] &&
			typeof objValue["result"] === "string"
		) {
			headerValue = objValue["result"] as string;
		} else if (objValue["value"] && typeof objValue["value"] === "string") {
			headerValue = objValue["value"] as string;
		} else if (
			objValue["richText"] &&
			Array.isArray(objValue["richText"])
		) {
			// Handle rich text in object.value.richText
			const richText = objValue["richText"] as unknown[];
			headerValue = richText
				.map((rt) => {
					const rtObj = rt as Record<string, unknown>;
					return typeof rtObj["text"] === "string"
						? rtObj["text"]
						: String(rtObj["text"] ?? "");
				})
				.join("");
		} else {
			// Last resort - stringify and check if it's meaningful
			const stringified = String(cell.value);
			headerValue = stringified !== "[object Object]" ? stringified : "";
		}
	} else {
		// Handle numbers, booleans, dates, etc.
		headerValue = String(cell.value);
	}

	// Fallback to cell.text if we still don't have a good value
	if (
		!headerValue ||
		headerValue.trim() === "" ||
		headerValue === "[object Object]"
	) {
		console.log(
			`DEBUG: Falling back to cell.text for column ${columnLetter}. cell.text:`,
			cell.text
		);
		if (typeof cell.text === "string" && cell.text.trim() !== "") {
			headerValue = cell.text;
		} else if (typeof cell.text === "object" && cell.text !== null) {
			// Handle rich text in cell.text
			const textObj = cell.text as Record<string, unknown>;
			if (textObj["richText"] && Array.isArray(textObj["richText"])) {
				const richText = textObj["richText"] as unknown[];
				headerValue = richText
					.map((rt) => {
						const rtObj = rt as Record<string, unknown>;
						return typeof rtObj["text"] === "string"
							? rtObj["text"]
							: String(rtObj["text"] ?? "");
					})
					.join("");
			}
		} else {
			headerValue = `Column${columnLetter}`;
		}
		console.log(
			`DEBUG: Final header value for column ${columnLetter}: "${headerValue}"`
		);
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
	let cellValue = "";
	let cellLink = "";

	// Extract cell value, handling different types including rich text
	if (cell.value === null || cell.value === undefined) {
		cellValue = "";
	} else if (typeof cell.value === "string") {
		cellValue = cell.value;
	} else if (
		typeof cell.value === "object" &&
		cell.value &&
		"text" in cell.value &&
		typeof cell.value.text === "object" &&
		cell.value.text &&
		"richText" in cell.value.text
	) {
		// Handle hyperlink cells with rich text in value.text.richText
		const richText = (cell.value.text as { richText: unknown[] }).richText;
		cellValue = Array.isArray(richText)
			? richText
					.map((rt) => {
						const text = (rt as { text?: string }).text;
						return typeof text === "string"
							? text
							: String(text ?? "");
					})
					.join("")
			: String(cell.value.text);
	} else if (
		typeof cell.value === "object" &&
		cell.value &&
		"richText" in cell.value
	) {
		// Handle rich text directly in cell.value
		const richText = cell.value.richText;
		cellValue = Array.isArray(richText)
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
		cellValue = cell.value
			.map((v) => (typeof v === "string" ? v : String(v ?? "")))
			.join(" ");
	} else {
		// Handle numbers, booleans, dates, etc.
		cellValue = String(cell.value);
	}

	// Fallback to cell.text if we still don't have a good value
	if (!cellValue || cellValue.trim() === "") {
		if (typeof cell.text === "string") {
			cellValue = cell.text;
		} else if (
			cell.text &&
			typeof cell.text === "object" &&
			cell.text !== null &&
			"richText" in cell.text
		) {
			// Handle rich text in cell.text
			const richText = (cell.text as { richText: unknown[] }).richText;
			cellValue = Array.isArray(richText)
				? richText
						.map((rt) => {
							const text = (rt as { text?: string }).text;
							return typeof text === "string"
								? text
								: String(text ?? "");
						})
						.join("")
				: String(cell.text);
		}
	}

	// Check if this is a hyperlink cell
	if (
		cell.value &&
		typeof cell.value === "object" &&
		"hyperlink" in cell.value
	) {
		const hyperlinkObj = cell.value as unknown as {
			text?: string;
			hyperlink: string;
			value?: unknown;
		};
		cellLink = hyperlinkObj.hyperlink;
	}

	return { value: cellValue.trim(), link: cellLink };
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
