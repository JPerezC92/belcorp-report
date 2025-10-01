import type { MonthlyReportStatusMappingRule } from "../domain/monthly-report-status-mapping-rule.js";
import type { MonthlyReportStatusMappingRuleRepository } from "../domain/monthly-report-status-mapping-rule.repository.js";
import type { PatternType } from "../domain/business-unit-rule.js";

export interface CreateMonthlyReportStatusMappingRuleData {
	sourceStatus: string;
	targetStatus: string;
	patternType?: PatternType;
	priority?: number;
	active?: boolean;
}

export interface UpdateMonthlyReportStatusMappingRuleData {
	sourceStatus?: string;
	targetStatus?: string;
	patternType?: PatternType;
	priority?: number;
	active?: boolean;
}

export class MonthlyReportStatusMappingService {
	constructor(private readonly repository: MonthlyReportStatusMappingRuleRepository) {}

	/**
	 * Get all status mapping rules
	 */
	async getAllRules(): Promise<MonthlyReportStatusMappingRule[]> {
		return this.repository.findAll();
	}

	/**
	 * Get only active status mapping rules
	 */
	async getActiveRules(): Promise<MonthlyReportStatusMappingRule[]> {
		return this.repository.findActive();
	}

	/**
	 * Get a status mapping rule by ID
	 */
	async getRuleById(id: number): Promise<MonthlyReportStatusMappingRule | null> {
		return this.repository.findById(id);
	}

	/**
	 * Create a new status mapping rule
	 */
	async createRule(data: CreateMonthlyReportStatusMappingRuleData): Promise<MonthlyReportStatusMappingRule> {
		// Validate the pattern if it's a regex
		if (data.patternType === 'regex') {
			try {
				new RegExp(data.sourceStatus);
			} catch (error) {
				throw new Error(`Invalid regex pattern: ${data.sourceStatus}`);
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
			sourceStatus: data.sourceStatus.trim(),
			targetStatus: data.targetStatus.trim(),
			patternType: data.patternType || 'exact',
			priority,
			active: data.active !== false
		});
	}

	/**
	 * Update an existing status mapping rule
	 */
	async updateRule(id: number, updates: UpdateMonthlyReportStatusMappingRuleData): Promise<MonthlyReportStatusMappingRule> {
		// Validate regex pattern if being updated
		if (updates.patternType === 'regex' && updates.sourceStatus) {
			try {
				new RegExp(updates.sourceStatus);
			} catch (error) {
				throw new Error(`Invalid regex pattern: ${updates.sourceStatus}`);
			}
		}

		// Trim string values
		const cleanUpdates = { ...updates };
		if (cleanUpdates.sourceStatus) {
			cleanUpdates.sourceStatus = cleanUpdates.sourceStatus.trim();
		}
		if (cleanUpdates.targetStatus) {
			cleanUpdates.targetStatus = cleanUpdates.targetStatus.trim();
		}

		return this.repository.update(id, cleanUpdates);
	}

	/**
	 * Delete a status mapping rule
	 */
	async deleteRule(id: number): Promise<void> {
		return this.repository.delete(id);
	}

	/**
	 * Map request status using active rules
	 * Returns the target status of the first matching rule, or original status if no match
	 */
	async mapStatus(requestStatus: string): Promise<string> {
		return this.repository.mapStatus(requestStatus);
	}

	/**
	 * Test a pattern against status text without saving it
	 */
	testPattern(pattern: string, text: string, patternType: PatternType = 'exact'): boolean {
		return this.repository.testPattern(pattern, text, patternType);
	}

	/**
	 * Reorder rules by updating their priorities
	 */
	async reorderRules(ruleOrders: Array<{ id: number; priority: number }>): Promise<MonthlyReportStatusMappingRule[]> {
		const updatedRules: MonthlyReportStatusMappingRule[] = [];

		for (const { id, priority } of ruleOrders) {
			const updatedRule = await this.repository.update(id, { priority });
			updatedRules.push(updatedRule);
		}

		return updatedRules;
	}

	/**
	 * Get statistics about status mapping rules
	 */
	async getStatistics(): Promise<{
		totalRules: number;
		activeRules: number;
		sourceStatuses: string[];
		targetStatuses: string[];
	}> {
		const allRules = await this.repository.findAll();
		const activeRules = allRules.filter(rule => rule.active);
		const sourceStatuses = [...new Set(allRules.map(rule => rule.sourceStatus))];
		const targetStatuses = [...new Set(allRules.map(rule => rule.targetStatus))];

		return {
			totalRules: allRules.length,
			activeRules: activeRules.length,
			sourceStatuses,
			targetStatuses
		};
	}
}
