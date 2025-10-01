import type { MonthlyReportStatusMappingRule } from "./monthly-report-status-mapping-rule.js";

export interface MonthlyReportStatusMappingRuleRepository {
	/**
	 * Get all monthly report status mapping rules (both active and inactive)
	 */
	findAll(): Promise<MonthlyReportStatusMappingRule[]>;

	/**
	 * Get only active monthly report status mapping rules, ordered by priority
	 */
	findActive(): Promise<MonthlyReportStatusMappingRule[]>;

	/**
	 * Find a monthly report status mapping rule by ID
	 */
	findById(id: number): Promise<MonthlyReportStatusMappingRule | null>;

	/**
	 * Create a new monthly report status mapping rule
	 */
	create(rule: {
		sourceStatus: string;
		targetStatus: string;
		patternType: string;
		priority: number;
		active: boolean;
	}): Promise<MonthlyReportStatusMappingRule>;

	/**
	 * Update an existing monthly report status mapping rule
	 */
	update(id: number, updates: Partial<MonthlyReportStatusMappingRule>): Promise<MonthlyReportStatusMappingRule>;

	/**
	 * Delete a monthly report status mapping rule by ID
	 */
	delete(id: number): Promise<void>;

	/**
	 * Map request status based on active rules
	 * Returns the target status of the first matching rule (by priority order)
	 * or the original status if no rules match
	 */
	mapStatus(requestStatus: string): Promise<string>;

	/**
	 * Test a pattern against status text without saving it as a rule
	 */
	testPattern(pattern: string, text: string, patternType: 'contains' | 'regex' | 'exact'): boolean;
}
