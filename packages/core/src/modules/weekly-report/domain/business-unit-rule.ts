export type PatternType = 'contains' | 'regex' | 'exact';

export class BusinessUnitRule {
	constructor(
		public readonly id: number,
		public readonly businessUnit: string,
		public readonly pattern: string,
		public readonly patternType: PatternType,
		public readonly priority: number,
		public readonly active: boolean,
		public readonly createdAt: Date,
		public readonly updatedAt: Date
	) {}

	static create(data: Omit<BusinessUnitRule, 'id' | 'createdAt' | 'updatedAt'> & {
		id?: number;
		createdAt?: Date;
		updatedAt?: Date;
	}): BusinessUnitRule {
		return new BusinessUnitRule(
			data.id || 0, // Will be assigned by DB
			data.businessUnit,
			data.pattern,
			data.patternType || 'contains',
			data.priority || 0,
			data.active !== false,
			data.createdAt || new Date(),
			data.updatedAt || new Date()
		);
	}

	/**
	 * Test if this rule matches the given text
	 */
	matches(text: string): boolean {
		if (!this.active) return false;

		const normalizedText = text.toLowerCase();
		const normalizedPattern = this.pattern.toLowerCase();

		switch (this.patternType) {
			case 'exact':
				return normalizedText === normalizedPattern;
			case 'regex':
				try {
					return new RegExp(this.pattern, 'i').test(text);
				} catch (error) {
					console.warn(`Invalid regex pattern in business unit rule ${this.id}: ${this.pattern}`, error);
					return false;
				}
			case 'contains':
			default:
				return normalizedText.includes(normalizedPattern);
		}
	}

	/**
	 * Create a copy of this rule with updated properties
	 */
	update(updates: Partial<Pick<BusinessUnitRule, 'businessUnit' | 'pattern' | 'patternType' | 'priority' | 'active'>>): BusinessUnitRule {
		return new BusinessUnitRule(
			this.id,
			updates.businessUnit ?? this.businessUnit,
			updates.pattern ?? this.pattern,
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
			businessUnit: this.businessUnit,
			pattern: this.pattern,
			patternType: this.patternType,
			priority: this.priority,
			active: this.active,
			createdAt: this.createdAt.toISOString(),
			updatedAt: this.updatedAt.toISOString()
		};
	}
}