import type { DateRangeConfig } from "./date-range-config.js";
import type { Scope } from "./date-range-config.js";

export interface DateRangeConfigRepository {
	/**
	 * Get the currently active date range for a specific scope
	 */
	getByScope(scope: Scope): Promise<DateRangeConfig | null>;

	/**
	 * Save or update a date range for a specific scope
	 * Updates the existing record for this scope rather than creating new ones
	 */
	saveForScope(scope: Scope, range: DateRangeConfig): Promise<DateRangeConfig>;

	/**
	 * Get all date ranges (for history)
	 */
	getAll(): Promise<DateRangeConfig[]>;

	/**
	 * Get a specific date range by ID
	 */
	getById(id: number): Promise<DateRangeConfig | null>;

	// ===== Legacy methods (for backward compatibility) =====

	/**
	 * @deprecated Use getByScope('monthly') instead
	 */
	getActive(): Promise<DateRangeConfig | null>;

	/**
	 * @deprecated Use saveForScope() instead
	 */
	save(range: DateRangeConfig): Promise<DateRangeConfig>;

	/**
	 * @deprecated Use saveForScope() with rangeType='disabled' instead
	 */
	deactivateCurrent(): Promise<void>;

	/**
	 * @deprecated Use saveForScope() instead
	 */
	setActive(id: number): Promise<void>;

	/**
	 * Delete all date ranges (for testing/cleanup)
	 */
	deleteAll(): Promise<void>;
}
