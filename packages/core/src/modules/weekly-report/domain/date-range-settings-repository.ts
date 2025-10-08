import type { DateRangeSettings } from "./date-range-settings.js";

export interface DateRangeSettingsRepository {
	/**
	 * Get the current settings (singleton - always returns the one record)
	 */
	getSettings(): Promise<DateRangeSettings>;

	/**
	 * Update global mode enabled state
	 */
	updateGlobalMode(enabled: boolean): Promise<DateRangeSettings>;
}
