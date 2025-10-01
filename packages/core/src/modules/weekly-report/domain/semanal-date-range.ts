import { DateTime } from "luxon";

export class SemanalDateRange {
	constructor(
		public readonly id: number,
		public readonly fromDate: string, // ISO date string (YYYY-MM-DD)
		public readonly toDate: string,   // ISO date string (YYYY-MM-DD)
		public readonly description: string,
		public readonly isActive: boolean,
		public readonly createdAt?: Date,
		public readonly updatedAt?: Date
	) {}

	static create(data: {
		fromDate: string;
		toDate: string;
		description: string;
	}): SemanalDateRange {
		// Validate dates
		this.validateDateRange(data.fromDate, data.toDate);
		this.validateDescription(data.description);

		return new SemanalDateRange(
			0, // Will be set by database
			data.fromDate,
			data.toDate,
			data.description,
			true, // New ranges are active by default
			new Date(),
			new Date()
		);
	}

	/**
	 * Calculate default Friday-Thursday range based on most recent Thursday
	 */
	static createDefaultRange(): SemanalDateRange {
		const now = DateTime.now().setZone("America/Lima");
		const dayOfWeek = now.weekday; // 1=Monday, 2=Tuesday, ..., 7=Sunday

		// Find the most recent Thursday (day 4)
		let daysToSubtract = dayOfWeek - 4; // Thursday is day 4
		if (daysToSubtract < 0) daysToSubtract += 7; // If we're before Thursday, go to previous week's Thursday

		const mostRecentThursday = now.minus({ days: daysToSubtract }).endOf('day');
		const previousFriday = mostRecentThursday.minus({ days: 6 }).startOf('day');

		return new SemanalDateRange(
			0,
			previousFriday.toISODate() || "",
			mostRecentThursday.toISODate() || "",
			"Cut to Thursday",
			true,
			new Date(),
			new Date()
		);
	}

	/**
	 * Check if a given date falls within this range
	 */
	isDateInRange(date: DateTime): boolean {
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
	}): SemanalDateRange {
		const newFromDate = data.fromDate ?? this.fromDate;
		const newToDate = data.toDate ?? this.toDate;
		const newDescription = data.description ?? this.description;

		// Validate new values
		SemanalDateRange.validateDateRange(newFromDate, newToDate);
		SemanalDateRange.validateDescription(newDescription);

		return new SemanalDateRange(
			this.id,
			newFromDate,
			newToDate,
			newDescription,
			this.isActive,
			this.createdAt,
			new Date()
		);
	}

	/**
	 * Mark this range as inactive
	 */
	deactivate(): SemanalDateRange {
		return new SemanalDateRange(
			this.id,
			this.fromDate,
			this.toDate,
			this.description,
			false,
			this.createdAt,
			new Date()
		);
	}

	private static validateDateRange(fromDate: string, toDate: string): void {
		// Validate date format
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

	private static validateDescription(description: string): void {
		if (!description || description.trim().length === 0) {
			throw new Error("Description is required");
		}

		if (description.length > 100) {
			throw new Error("Description cannot exceed 100 characters");
		}
	}
}