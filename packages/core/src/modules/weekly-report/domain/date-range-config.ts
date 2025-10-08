import { DateTime } from "luxon";

export type RangeType = 'weekly' | 'custom' | 'disabled';
export type Scope = 'monthly' | 'corrective' | 'global';

export class DateRangeConfig {
	constructor(
		public readonly id: number,
		public readonly fromDate: string, // ISO date string (YYYY-MM-DD)
		public readonly toDate: string,   // ISO date string (YYYY-MM-DD)
		public readonly description: string,
		public readonly isActive: boolean,
		public readonly rangeType: RangeType = 'disabled',
		public readonly scope: Scope = 'monthly',
		public readonly createdAt?: Date,
		public readonly updatedAt?: Date
	) {}

	/**
	 * Create a weekly range (auto-calculated Friday-Thursday)
	 */
	static createWeekly(scope: Scope = 'monthly'): DateRangeConfig {
		const now = DateTime.now().setZone("America/Lima");
		const dayOfWeek = now.weekday; // 1=Monday, 2=Tuesday, ..., 7=Sunday

		// Find the most recent Thursday (day 4)
		let daysToSubtract = dayOfWeek - 4; // Thursday is day 4
		if (daysToSubtract < 0) daysToSubtract += 7; // If we're before Thursday, go to previous week's Thursday

		const mostRecentThursday = now.minus({ days: daysToSubtract }).endOf('day');
		const previousFriday = mostRecentThursday.minus({ days: 6 }).startOf('day');

		return new DateRangeConfig(
			0,
			previousFriday.toISODate() || "",
			mostRecentThursday.toISODate() || "",
			`Weekly Range (${scope})`,
			true,
			'weekly',
			scope,
			new Date(),
			new Date()
		);
	}

	/**
	 * Create a custom range with manual dates
	 */
	static createCustom(data: {
		fromDate: string;
		toDate: string;
		description?: string;
		scope?: Scope;
	}): DateRangeConfig {
		// Validate dates
		this.validateCustomDateRange(data.fromDate, data.toDate);
		const description = data.description || `Custom Range (${data.scope || 'monthly'})`;
		this.validateDescription(description);

		return new DateRangeConfig(
			0, // Will be set by database
			data.fromDate,
			data.toDate,
			description,
			true,
			'custom',
			data.scope || 'monthly',
			new Date(),
			new Date()
		);
	}

	/**
	 * Create a disabled range (all records match)
	 */
	static createDisabled(scope: Scope = 'monthly'): DateRangeConfig {
		return new DateRangeConfig(
			0,
			'2025-01-01',
			'2025-12-31',
			`Disabled (${scope})`,
			true,
			'disabled',
			scope,
			new Date(),
			new Date()
		);
	}

	/**
	 * @deprecated Use createWeekly() instead
	 */
	static createDefaultRange(): DateRangeConfig {
		return DateRangeConfig.createWeekly('monthly');
	}

	/**
	 * @deprecated Use createCustom() instead
	 */
	static create(data: {
		fromDate: string;
		toDate: string;
		description: string;
	}): DateRangeConfig {
		return DateRangeConfig.createCustom({
			fromDate: data.fromDate,
			toDate: data.toDate,
			description: data.description,
			scope: 'monthly'
		});
	}

	/**
	 * Check if a given date falls within this range
	 * For disabled ranges, always returns true (all records match)
	 */
	isDateInRange(date: DateTime): boolean {
		if (this.rangeType === 'disabled') {
			return true; // All records match when disabled
		}

		const fromDateTime = DateTime.fromISO(this.fromDate, { zone: "America/Lima" }).startOf('day');
		const toDateTime = DateTime.fromISO(this.toDate, { zone: "America/Lima" }).endOf('day');

		return date >= fromDateTime && date <= toDateTime;
	}

	/**
	 * Get the range duration in days
	 */
	getDurationInDays(): number {
		const fromDate = DateTime.fromISO(this.fromDate);
		const toDate = DateTime.fromISO(this.toDate);
		return Math.floor(toDate.diff(fromDate, 'days').days) + 1; // +1 to include both start and end dates
	}

	/**
	 * Format the range for display
	 */
	getDisplayText(): string {
		const fromDate = DateTime.fromISO(this.fromDate).toFormat('dd/MM/yyyy');
		const toDate = DateTime.fromISO(this.toDate).toFormat('dd/MM/yyyy');
		return `${fromDate} - ${toDate} (${this.description})`;
	}

	/**
	 * Update the range with new values
	 */
	update(data: {
		fromDate?: string;
		toDate?: string;
		description?: string;
		rangeType?: RangeType;
	}): DateRangeConfig {
		const newFromDate = data.fromDate ?? this.fromDate;
		const newToDate = data.toDate ?? this.toDate;
		const newDescription = data.description ?? this.description;
		const newRangeType = data.rangeType ?? this.rangeType;

		// Validate new values based on range type
		if (newRangeType === 'weekly') {
			DateRangeConfig.validateWeeklyDateRange(newFromDate, newToDate);
		} else if (newRangeType === 'custom') {
			DateRangeConfig.validateCustomDateRange(newFromDate, newToDate);
		}
		DateRangeConfig.validateDescription(newDescription);

		return new DateRangeConfig(
			this.id,
			newFromDate,
			newToDate,
			newDescription,
			this.isActive,
			newRangeType,
			this.scope,
			this.createdAt,
			new Date()
		);
	}

	/**
	 * Mark this range as inactive
	 */
	deactivate(): DateRangeConfig {
		return new DateRangeConfig(
			this.id,
			this.fromDate,
			this.toDate,
			this.description,
			false,
			this.rangeType,
			this.scope,
			this.createdAt,
			new Date()
		);
	}

	/**
	 * Validate weekly date range (Friday to Thursday)
	 */
	private static validateWeeklyDateRange(fromDate: string, toDate: string): void {
		const fromDateTime = DateTime.fromISO(fromDate);
		const toDateTime = DateTime.fromISO(toDate);

		if (!fromDateTime.isValid) {
			throw new Error(`Invalid fromDate format: ${fromDate}. Expected YYYY-MM-DD`);
		}

		if (!toDateTime.isValid) {
			throw new Error(`Invalid toDate format: ${toDate}. Expected YYYY-MM-DD`);
		}

		// Validate that fromDate is before toDate
		if (fromDateTime >= toDateTime) {
			throw new Error(`fromDate (${fromDate}) must be before toDate (${toDate})`);
		}

		// Validate that fromDate is a Friday (day 5)
		if (fromDateTime.weekday !== 5) {
			throw new Error(`fromDate (${fromDate}) must be a Friday`);
		}

		// Validate that toDate is a Thursday (day 4)
		if (toDateTime.weekday !== 4) {
			throw new Error(`toDate (${toDate}) must be a Thursday`);
		}

		// Validate that the range is not too long (max 30 days)
		const diffInDays = toDateTime.diff(fromDateTime, 'days').days;
		if (diffInDays > 30) {
			throw new Error(`Date range cannot exceed 30 days. Current range: ${diffInDays} days`);
		}
	}

	/**
	 * Validate custom date range (flexible, no day-of-week restrictions)
	 */
	private static validateCustomDateRange(fromDate: string, toDate: string): void {
		const fromDateTime = DateTime.fromISO(fromDate);
		const toDateTime = DateTime.fromISO(toDate);

		if (!fromDateTime.isValid) {
			throw new Error(`Invalid fromDate format: ${fromDate}. Expected YYYY-MM-DD`);
		}

		if (!toDateTime.isValid) {
			throw new Error(`Invalid toDate format: ${toDate}. Expected YYYY-MM-DD`);
		}

		// Validate that fromDate is before toDate
		if (fromDateTime >= toDateTime) {
			throw new Error(`fromDate (${fromDate}) must be before toDate (${toDate})`);
		}
	}

	/**
	 * @deprecated Use validateWeeklyDateRange() or validateCustomDateRange()
	 */
	private static validateDateRange(fromDate: string, toDate: string): void {
		this.validateWeeklyDateRange(fromDate, toDate);
	}

	private static validateDescription(description: string): void {
		if (!description || description.trim().length === 0) {
			throw new Error("Description is required");
		}

		if (description.length > 100) {
			throw new Error("Description cannot exceed 100 characters");
		}
	}
}
