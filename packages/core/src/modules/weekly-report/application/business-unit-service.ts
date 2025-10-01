import type { BusinessUnitRule, PatternType } from "../domain/business-unit-rule.js";
import type { BusinessUnitRuleRepository } from "../domain/business-unit-rule.repository.js";

export interface CreateBusinessUnitRuleData {
	businessUnit: string;
	pattern: string;
	patternType?: PatternType;
	priority?: number;
	active?: boolean;
}

export interface UpdateBusinessUnitRuleData {
	businessUnit?: string;
	pattern?: string;
	patternType?: PatternType;
	priority?: number;
	active?: boolean;
}

export interface BusinessUnitDetectionResult {
	businessUnit: string;
	matchedRule?: BusinessUnitRule;
	confidence: 'high' | 'low';
}

export class BusinessUnitService {
	constructor(private readonly repository: BusinessUnitRuleRepository) {}

	/**
	 * Get all business unit rules
	 */
	async getAllRules(): Promise<BusinessUnitRule[]> {
		return this.repository.findAll();
	}

	/**
	 * Get only active business unit rules
	 */
	async getActiveRules(): Promise<BusinessUnitRule[]> {
		return this.repository.findActive();
	}

	/**
	 * Get a business unit rule by ID
	 */
	async getRuleById(id: number): Promise<BusinessUnitRule | null> {
		return this.repository.findById(id);
	}

	/**
	 * Create a new business unit rule
	 */
	async createRule(data: CreateBusinessUnitRuleData): Promise<BusinessUnitRule> {
		// Validate the pattern if it's a regex
		if (data.patternType === 'regex') {
			try {
				new RegExp(data.pattern);
			} catch (error) {
				throw new Error(`Invalid regex pattern: ${data.pattern}`);
			}
		}

		// If no priority is specified, set it to the highest current priority + 1
		let priority = data.priority;
		if (priority === undefined) {
			const existingRules = await this.repository.findAll();
			const maxPriority = Math.max(0, ...existingRules.map(rule => rule.priority));
			priority = maxPriority + 1;
		}

		return this.repository.create({
			businessUnit: data.businessUnit.trim(),
			pattern: data.pattern.trim(),
			patternType: data.patternType || 'contains',
			priority,
			active: data.active !== false
		});
	}

	/**
	 * Update an existing business unit rule
	 */
	async updateRule(id: number, updates: UpdateBusinessUnitRuleData): Promise<BusinessUnitRule> {
		// Validate regex pattern if being updated
		if (updates.patternType === 'regex' && updates.pattern) {
			try {
				new RegExp(updates.pattern);
			} catch (error) {
				throw new Error(`Invalid regex pattern: ${updates.pattern}`);
			}
		}

		// Trim string values
		const cleanUpdates = { ...updates };
		if (cleanUpdates.businessUnit) {
			cleanUpdates.businessUnit = cleanUpdates.businessUnit.trim();
		}
		if (cleanUpdates.pattern) {
			cleanUpdates.pattern = cleanUpdates.pattern.trim();
		}

		return this.repository.update(id, cleanUpdates);
	}

	/**
	 * Delete a business unit rule
	 */
	async deleteRule(id: number): Promise<void> {
		return this.repository.delete(id);
	}

	/**
	 * Detect business unit from application text with additional metadata
	 */
	async detectBusinessUnitWithDetails(applicationText: string): Promise<BusinessUnitDetectionResult> {
		const rules = await this.repository.findActive();

		// Check rules in priority order
		for (const rule of rules) {
			if (rule.matches(applicationText)) {
				return {
					businessUnit: rule.businessUnit,
					matchedRule: rule,
					confidence: rule.patternType === 'exact' ? 'high' : 'low'
				};
			}
		}

		return {
			businessUnit: 'UNKNOWN',
			confidence: 'low'
		};
	}

	/**
	 * Detect business unit from application text (simple version)
	 */
	async detectBusinessUnit(applicationText: string): Promise<string> {
		const result = await this.detectBusinessUnitWithDetails(applicationText);
		return result.businessUnit;
	}

	/**
	 * Test a pattern against text without saving it
	 */
	testPattern(pattern: string, text: string, patternType: PatternType = 'contains'): boolean {
		return this.repository.testPattern(pattern, text, patternType);
	}

	/**
	 * Reorder rules by updating their priorities
	 */
	async reorderRules(ruleOrders: Array<{ id: number; priority: number }>): Promise<BusinessUnitRule[]> {
		const updatedRules: BusinessUnitRule[] = [];

		for (const { id, priority } of ruleOrders) {
			const updatedRule = await this.repository.update(id, { priority });
			updatedRules.push(updatedRule);
		}

		return updatedRules;
	}

	/**
	 * Get business unit statistics
	 */
	async getStatistics(): Promise<{
		totalRules: number;
		activeRules: number;
		businessUnits: string[];
		rulesByBusinessUnit: Record<string, number>;
	}> {
		const allRules = await this.repository.findAll();
		const activeRules = allRules.filter(rule => rule.active);
		const businessUnits = [...new Set(allRules.map(rule => rule.businessUnit))];

		const rulesByBusinessUnit: Record<string, number> = {};
		for (const rule of allRules) {
			rulesByBusinessUnit[rule.businessUnit] = (rulesByBusinessUnit[rule.businessUnit] || 0) + 1;
		}

		return {
			totalRules: allRules.length,
			activeRules: activeRules.length,
			businessUnits,
			rulesByBusinessUnit
		};
	}
}