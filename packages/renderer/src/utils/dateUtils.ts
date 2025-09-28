import { DateTime } from "luxon";

/**
 * Formats an ETA date string for display
 * @param etaDate - The ETA date string (e.g., "27/10/2025 17:42")
 * @returns Object with formatted display value and original value for tooltip
 */
export function formatEtaDate(etaDate: string | undefined | null): {
	display: string;
	original: string;
} {
	if (!etaDate || etaDate.trim() === "") {
		return { display: "TBD", original: "" };
	}

	try {
		// Parse the date using Luxon with the expected format "dd/MM/yyyy HH:mm"
		const dateTime = DateTime.fromFormat(etaDate, "dd/MM/yyyy HH:mm");

		if (!dateTime.isValid) {
			// Try alternative formats if the primary one fails
			const alternativeFormats = [
				"dd/MM/yyyy",
				"MM/dd/yyyy HH:mm",
				"MM/dd/yyyy",
				"yyyy-MM-dd HH:mm",
				"yyyy-MM-dd",
			];

			let parsedDate = null;
			for (const format of alternativeFormats) {
				parsedDate = DateTime.fromFormat(etaDate, format);
				if (parsedDate.isValid) break;
			}

			if (!parsedDate?.isValid) {
				return { display: "TBD", original: etaDate };
			}

			// Format as "9-Sep" (day-month without year)
			const formatted = parsedDate.toFormat("d-MMM");
			return { display: formatted, original: etaDate };
		}

		// Format as "9-Sep" (day-month without year)
		const formatted = dateTime.toFormat("d-MMM");
		return { display: formatted, original: etaDate };
	} catch (error) {
		console.warn("Error formatting ETA date:", error);
		return { display: "TBD", original: etaDate || "" };
	}
}
