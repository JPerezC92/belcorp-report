import { DateTime } from "luxon";
import type { DateRangeConfig } from "./date-range-config.js";

// Domain Entity for Corrective Maintenance Records
export class CorrectiveMaintenanceRecord {
	constructor(
		public readonly requestId: string,
		public readonly requestIdLink: string | undefined,
		public readonly createdTime: string,
		public readonly applications: string,
		public readonly categorization: string,
		public readonly requestStatus: string,
		public readonly module: string,
		public readonly subject: string,
		public readonly subjectLink: string | undefined,
		public readonly priority: string,
		public readonly enlaces: number,
		public readonly eta: string,
		public readonly rca: string,
		public readonly businessUnit: string,
		public readonly inDateRange: boolean,
		public readonly createdAt: Date,
		public readonly updatedAt: Date
	) {}

	static create(data: {
		requestId: string;
		requestIdLink?: string;
		createdTime: string;
		applications: string;
		categorization: string;
		requestStatus: string;
		module: string;
		subject: string;
		subjectLink?: string;
		priority: string;
		enlaces?: number;
		eta: string;
		rca: string;
		businessUnit: string;
		inDateRange?: boolean; // Optional pre-calculated value from database
		dateRangeConfig?: DateRangeConfig; // Optional custom date range for inDateRange calculation
	}): CorrectiveMaintenanceRecord {
		// Use provided inDateRange if available, otherwise calculate it
		let inDateRange: boolean;
		if (data.inDateRange !== undefined) {
			// Use pre-calculated value from database
			inDateRange = data.inDateRange;
		} else {
			// Calculate based on date range or fallback to current week
			const dateTime = this.parseDateTime(data.createdTime);
			inDateRange = data.dateRangeConfig
				? data.dateRangeConfig.isDateInRange(dateTime)
				: this.isCurrentWeek(dateTime);
		}

		const now = new Date();
		return new CorrectiveMaintenanceRecord(
			data.requestId,
			data.requestIdLink,
			data.createdTime,
			data.applications,
			data.categorization,
			data.requestStatus,
			data.module,
			data.subject,
			data.subjectLink,
			data.priority,
			data.enlaces || 0,
			data.eta,
			data.rca,
			data.businessUnit,
			inDateRange,
			now,
			now
		);
	}

	private static parseDateTime(dateTimeStr: string): DateTime {
		// Parse European format: "dd/MM/yyyy HH:mm"
		const dt = DateTime.fromFormat(dateTimeStr, "dd/MM/yyyy HH:mm", {
			zone: "America/Lima", // Belcorp timezone
		});

		if (!dt.isValid) {
			throw new Error(`Invalid date format: ${dateTimeStr}. Expected dd/MM/yyyy HH:mm`);
		}

		return dt;
	}

	private static isCurrentWeek(dateTime: DateTime): boolean {
		const now = DateTime.now().setZone("America/Lima");
		const startOfWeek = now.startOf("week");
		const endOfWeek = now.endOf("week");

		return dateTime >= startOfWeek && dateTime <= endOfWeek;
	}
}
