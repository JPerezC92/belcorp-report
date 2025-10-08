/**
 * Domain entity for Date Range Settings
 * Controls global mode behavior for date range filtering
 */
export class DateRangeSettings {
	constructor(
		public readonly id: number,
		public readonly globalModeEnabled: boolean,
		public readonly createdAt?: Date,
		public readonly updatedAt?: Date
	) {}

	/**
	 * Create settings with global mode enabled
	 */
	static createWithGlobalModeEnabled(): DateRangeSettings {
		return new DateRangeSettings(
			1, // Singleton - always ID 1
			true,
			new Date(),
			new Date()
		);
	}

	/**
	 * Create settings with global mode disabled
	 */
	static createWithGlobalModeDisabled(): DateRangeSettings {
		return new DateRangeSettings(
			1, // Singleton - always ID 1
			false,
			new Date(),
			new Date()
		);
	}

	/**
	 * Toggle global mode
	 */
	toggleGlobalMode(): DateRangeSettings {
		return new DateRangeSettings(
			this.id,
			!this.globalModeEnabled,
			this.createdAt,
			new Date()
		);
	}

	/**
	 * Enable global mode
	 */
	enableGlobalMode(): DateRangeSettings {
		return new DateRangeSettings(
			this.id,
			true,
			this.createdAt,
			new Date()
		);
	}

	/**
	 * Disable global mode
	 */
	disableGlobalMode(): DateRangeSettings {
		return new DateRangeSettings(
			this.id,
			false,
			this.createdAt,
			new Date()
		);
	}
}
