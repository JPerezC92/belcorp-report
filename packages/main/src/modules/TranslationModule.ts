import { pipeline } from "@xenova/transformers";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";

/**
 * Module to handle translation operations using @xenova/transformers
 * Runs translation tasks in the main process for better performance
 */
export class TranslationModule implements AppModule {
	private translator: any = null;

	async enable(_context: ModuleContext): Promise<void> {
		console.log("TranslationModule: Initializing translation pipeline...");

		try {
			// Initialize the translation pipeline on module startup
			this.translator = await pipeline(
				"translation",
				"Xenova/opus-mt-es-en"
			);
			console.log(
				"TranslationModule: Translation pipeline initialized successfully"
			);
		} catch (error) {
			console.error(
				"TranslationModule: Failed to initialize translation pipeline:",
				error
			);
			// Continue without translation if initialization fails
		}
	}

	/**
	 * Translate Spanish text to English
	 */
	async translateSubject(subject: string): Promise<string> {
		try {
			if (!this.translator) {
				console.warn(
					"TranslationModule: Translator not initialized, returning original text"
				);
				return subject;
			}

			console.log(
				`[Translation] Starting translation for subject: "${subject}"`
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
					`[Translation] Skipping translation - subject appears to be already in English (${englishWordCount}/${words.length} English words detected)`
				);
				return subject;
			}

			console.log(
				`[Translation] Using @xenova/transformers for Spanish → English translation`
			);

			// Translate the subject
			const result = await this.translator(subject);
			const translatedResult = Array.isArray(result)
				? (result[0] as { translation_text: string }).translation_text
				: (result as { translation_text: string }).translation_text;

			console.log(`[Translation] Original: "${subject}"`);
			console.log(`[Translation] Translated: "${translatedResult}"`);

			// Preserve technical terms and acronyms in the translated result
			let finalSubject = translatedResult;

			// Find and preserve original technical terms
			const technicalTerms: string[] = [];
			subject.split(/\s+/).forEach((word) => {
				if (englishPatterns.some((pattern) => pattern.test(word))) {
					technicalTerms.push(word);
				}
			});

			console.log(
				`[Translation] Found ${technicalTerms.length} technical terms to preserve:`,
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
							`[Translation] Preserving technical term "${term}" by replacing "${match[0]}"`
						);
						finalSubject = finalSubject.replace(match[0], term);
					}
				}
			});

			if (finalSubject !== translatedResult) {
				console.log(
					`[Translation] Final result after term preservation: "${finalSubject}"`
				);
			}

			console.log(`[Translation] Translation completed successfully`);
			return finalSubject;
		} catch (error) {
			console.error(
				"[Translation] Translation failed, keeping original subject:",
				error
			);
			return subject;
		}
	}
}

/**
 * Factory function to create translation module
 */
export function createTranslationModule(): TranslationModule {
	return new TranslationModule();
}
