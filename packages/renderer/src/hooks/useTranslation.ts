import { getPreloadHandler } from "@/constants/preloadHandlers";

/**
 * Custom hook for translating text using the backend translation service
 */
export function useTranslation() {
	const translateText = async (text: string): Promise<string> => {
		try {
			console.log(
				`[Frontend Translation] Requesting translation for: "${text}"`
			);

			const translateHandler = getPreloadHandler("translateText");
			if (!translateHandler) {
				console.warn(
					"[Frontend Translation] Translation handler not available, returning original text"
				);
				return text;
			}

			const translatedText = await translateHandler(text);
			console.log(
				`[Frontend Translation] Received translation: "${translatedText}"`
			);

			return translatedText;
		} catch (error) {
			console.error("[Frontend Translation] Translation failed:", error);
			// Return original text if translation fails
			return text;
		}
	};

	return { translateText };
}
