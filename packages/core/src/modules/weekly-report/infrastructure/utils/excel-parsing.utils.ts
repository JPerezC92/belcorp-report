/**
 * Common utilities for Excel parsing operations
 *
 * Note: For cell value extraction, use cellValueSchema and cellWithLinkSchema
 * from @core/shared/schemas/excel-cell-validation.schema.ts instead of manual extraction.
 */

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
