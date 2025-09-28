#!/usr/bin/env node

/**
 * Translation worker process for @xenova/transformers
 * Runs in a separate child process to avoid blocking the main Electron thread
 */

import { pipeline } from "@xenova/transformers";

let translator = null;

/**
 * Initialize the translation pipeline
 */
async function initializeTranslator() {
	try {
		console.log(
			"[Translation Worker] Initializing translation pipeline..."
		);
		translator = await pipeline("translation", "Xenova/opus-mt-es-en");
		console.log(
			"[Translation Worker] Translation pipeline initialized successfully"
		);

		// Signal that initialization is complete
		process.send?.({ type: "initialized" });
	} catch (error) {
		console.error(
			"[Translation Worker] Failed to initialize translation pipeline:",
			error
		);
		process.send?.({
			type: "error",
			error: error instanceof Error ? error.message : String(error),
		});
		process.exit(1);
	}
}

/**
 * Translate a single subject
 */
async function translateSubject(subject) {
	try {
		if (!translator) {
			console.warn(
				"[Translation Worker] Translator not initialized, returning original text"
			);
			return subject;
		}

		console.log(
			`[Translation Worker] Starting translation for subject: "${subject}"`
		);

		// Skip translation if subject appears to already be in English
		// Check for common English patterns and technical terms
		const englishPatterns = [
			/^[A-Z]{2,}/, // Acronyms like "SDP", "API", "SQL"
			/\b(error|warning|info|debug|trace)\b/i, // Common technical terms
			/\b(server|client|database|network|system|application)\b/i, // Technical terms
			/\b(failed|success|completed|pending|processing)\b/i, // Status terms
			/^\w+$/, // Single words that might be technical terms
		];

		// If subject contains mostly English words or technical terms, skip translation
		const words = subject.split(/\s+/);
		const englishWordCount = words.filter((word) => {
			return (
				englishPatterns.some((pattern) => pattern.test(word)) ||
				(/^[a-zA-Z]+$/.test(word) && word.length > 3)
			); // Longer English words
		}).length;

		// If more than 50% of words appear to be English/technical, skip translation
		if (englishWordCount / words.length > 0.5) {
			console.log(
				`[Translation Worker] Skipping translation - subject appears to be already in English (${englishWordCount}/${words.length} English words detected)`
			);
			return subject;
		}

		console.log(
			`[Translation Worker] Using @xenova/transformers for Spanish → English translation`
		);

		// Translate the subject
		const result = await translator(subject);
		const translatedResult = Array.isArray(result)
			? result[0].translation_text
			: result.translation_text;

		console.log(`[Translation Worker] Original: "${subject}"`);
		console.log(`[Translation Worker] Translated: "${translatedResult}"`);

		// Preserve technical terms and acronyms in the translated result
		let finalSubject = translatedResult;

		// Find and preserve original technical terms
		const technicalTerms = [];
		subject.split(/\s+/).forEach((word) => {
			if (englishPatterns.some((pattern) => pattern.test(word))) {
				technicalTerms.push(word);
			}
		});

		console.log(
			`[Translation Worker] Found ${technicalTerms.length} technical terms to preserve:`,
			technicalTerms
		);

		// Replace translated versions with original technical terms if they were changed
		technicalTerms.forEach((term) => {
			// Simple heuristic: if the term appears in both original and translated,
			// but was changed, replace it back
			const termLower = term.toLowerCase();
			const translatedLower = finalSubject.toLowerCase();

			// If the term doesn't appear in the translated result, add it back
			if (!translatedLower.includes(termLower)) {
				// Try to find where it should go back by looking for similar words
				const similarPattern = new RegExp(
					`\\b${termLower.replace(
						/[.*+?^${}()|[\]\\]/g,
						"\\$&"
					)}\\w*\\b`,
					"i"
				);
				const match = finalSubject.match(similarPattern);
				if (match) {
					console.log(
						`[Translation Worker] Preserving technical term "${term}" by replacing "${match[0]}"`
					);
					finalSubject = finalSubject.replace(match[0], term);
				}
			}
		});

		if (finalSubject !== translatedResult) {
			console.log(
				`[Translation Worker] Final result after term preservation: "${finalSubject}"`
			);
		}

		console.log(`[Translation Worker] Translation completed successfully`);
		return finalSubject;
	} catch (error) {
		console.error(
			"[Translation Worker] Translation failed, keeping original subject:",
			error
		);
		return subject;
	}
}

// Handle messages from the main process
process.on("message", async (message) => {
	try {
		switch (message.type) {
			case "initialize":
				await initializeTranslator();
				break;

			case "translate": {
				const translated = await translateSubject(message.subject);
				process.send?.({
					type: "translated",
					original: message.subject,
					translated,
					requestId: message.requestId,
				});
				break;
			}

			case "translate-batch": {
				const results = [];
				for (const subject of message.subjects) {
					const translated = await translateSubject(subject);
					results.push({ original: subject, translated });
				}
				process.send?.({
					type: "batch-translated",
					results,
					requestId: message.requestId,
				});
				break;
			}

			default:
				console.warn(
					`[Translation Worker] Unknown message type: ${message.type}`
				);
		}
	} catch (error) {
		console.error("[Translation Worker] Error processing message:", error);
		process.send?.({
			type: "error",
			error: error instanceof Error ? error.message : String(error),
			requestId: message.requestId,
		});
	}
});

console.log("[Translation Worker] Translation worker started");
