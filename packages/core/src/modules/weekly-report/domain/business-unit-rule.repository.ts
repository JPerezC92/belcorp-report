import type { BusinessUnitRule } from "./business-unit-rule.js";

export interface BusinessUnitRuleRepository {
	/**
	 * Get all business unit rules (both active and inactive)
	 */
	findAll(): Promise<BusinessUnitRule[]>;

	/**
	 * Get only active business unit rules, ordered by priority
	 */
	findActive(): Promise<BusinessUnitRule[]>;

	/**
	 * Find a business unit rule by ID
	 */
	findById(id: number): Promise<BusinessUnitRule | null>;

	/**
	 * Create a new business unit rule
	 */
	create(rule: {
		businessUnit: string;
		pattern: string;
		patternType: string;
		priority: number;
		active: boolean;
	}): Promise<BusinessUnitRule>;

	/**
	 * Update an existing business unit rule
	 */
	update(id: number, updates: Partial<BusinessUnitRule>): Promise<BusinessUnitRule>;

	/**
	 * Delete a business unit rule by ID
	 */
	delete(id: number): Promise<void>;

	/**
	 * Detect business unit based on application text using active rules
	 * Returns the business unit of the first matching rule (by priority order)
	 */
	detectBusinessUnit(applicationText: string): Promise<string>;

	/**
	 * Test a pattern against text without saving it as a rule
	 */
	testPattern(pattern: string, text: string, patternType: 'contains' | 'regex' | 'exact'): boolean;
}