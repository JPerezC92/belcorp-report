import type { PatternType } from './business-unit-rule.js';

export class MonthlyReportStatusMappingRule {
	constructor(
		public readonly id: number,
		public readonly sourceStatus: string,
		public readonly targetStatus: string,
		public readonly patternType: PatternType,
		public readonly priority: number,
		public readonly active: boolean,
		public readonly createdAt: Date,
		public readonly updatedAt: Date
	) {}

	static create(data: {
		id?: number;
		sourceStatus: string;
		targetStatus: string;
		patternType: PatternType;
		priority: number;
		active: boolean;
		createdAt?: Date;
		updatedAt?: Date;
	}): MonthlyReportStatusMappingRule {
		return new MonthlyReportStatusMappingRule(
			data.id || 0, // Will be assigned by DB
			data.sourceStatus,
			data.targetStatus,
			data.patternType || 'exact',
			data.priority || 0,
			data.active !== false,
			data.createdAt || new Date(),
			data.updatedAt || new Date()
		);
	}

	/**
	 * Test if this rule matches the given request status
	 */
	matches(status: string): boolean {
		if (!this.active) return false;

		const normalizedStatus = status.toLowerCase().trim();
		const normalizedPattern = this.sourceStatus.toLowerCase().trim();

		switch (this.patternType) {
			case 'exact':
				return normalizedStatus === normalizedPattern;
			case 'regex':
				try {
					return new RegExp(this.sourceStatus, 'i').test(status);
				} catch (error) {
					console.warn(`Invalid regex pattern in monthly report status mapping rule ${this.id}: ${this.sourceStatus}`, error);
					return false;
				}
			case 'contains':
			default:
				return normalizedStatus.includes(normalizedPattern);
		}
	}

	/**
	 * Create a copy of this rule with updated properties
	 */
	update(updates: Partial<Pick<MonthlyReportStatusMappingRule, 'sourceStatus' | 'targetStatus' | 'patternType' | 'priority' | 'active'>>): MonthlyReportStatusMappingRule {
		return new MonthlyReportStatusMappingRule(
			this.id,
			updates.sourceStatus ?? this.sourceStatus,
			updates.targetStatus ?? this.targetStatus,
			updates.patternType ?? this.patternType,
			updates.priority ?? this.priority,
			updates.active ?? this.active,
			this.createdAt,
			new Date() // Update the updatedAt timestamp
		);
	}

	/**
	 * Convert to plain object for serialization
	 */
	toJSON() {
		return {
			id: this.id,
			sourceStatus: this.sourceStatus,
			targetStatus: this.targetStatus,
			patternType: this.patternType,
			priority: this.priority,
			active: this.active,
			createdAt: this.createdAt.toISOString(),
			updatedAt: this.updatedAt.toISOString()
		};
	}
}
