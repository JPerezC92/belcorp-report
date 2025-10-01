import type { SemanalDateRange } from "./semanal-date-range.js";

export interface SemanalDateRangeRepository {
	/**
	 * Save a new date range and deactivate any previously active ranges
	 */
	save(range: SemanalDateRange): Promise<SemanalDateRange>;

	/**
	 * Get the currently active date range
	 */
	getActive(): Promise<SemanalDateRange | null>;

	/**
	 * Get all date ranges (for history)
	 */
	getAll(): Promise<SemanalDateRange[]>;

	/**
	 * Get a specific date range by ID
	 */
	getById(id: number): Promise<SemanalDateRange | null>;

	/**
	 * Deactivate the currently active range
	 */
	deactivateCurrent(): Promise<void>;

	/**
	 * Set a specific range as active (deactivates all others)
	 */
	setActive(id: number): Promise<void>;

	/**
	 * Delete all date ranges (for testing/cleanup)
	 */
	deleteAll(): Promise<void>;
}