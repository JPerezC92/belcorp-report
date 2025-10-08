import { getDatabase, TABLE_NAMES } from "@app/database";

export type RuleType = 'module' | 'categorization';
export type PatternType = 'exact' | 'contains' | 'regex';

export interface ModuleCategorizationDisplayRule {
	id: number;
	ruleType: RuleType;
	sourceValue: string;
	displayValue: string;
	patternType: PatternType;
	priority: number;
	active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export class SqlJsModuleCategorizationDisplayRuleRepository {
	async findAll(): Promise<ModuleCategorizationDisplayRule[]> {
		const db = getDatabase();
		const results = db.exec(`
			SELECT id, rule_type, source_value, display_value, pattern_type, priority, active, created_at, updated_at
			FROM ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES}
			ORDER BY priority ASC, rule_type ASC
		`);

		return this.mapResults(results);
	}

	async findActive(): Promise<ModuleCategorizationDisplayRule[]> {
		const db = getDatabase();
		const results = db.exec(`
			SELECT id, rule_type, source_value, display_value, pattern_type, priority, active, created_at, updated_at
			FROM ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES}
			WHERE active = 1
			ORDER BY priority ASC, rule_type ASC
		`);

		return this.mapResults(results);
	}

	async findById(id: number): Promise<ModuleCategorizationDisplayRule | null> {
		const db = getDatabase();
		const results = db.exec(`
			SELECT id, rule_type, source_value, display_value, pattern_type, priority, active, created_at, updated_at
			FROM ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES}
			WHERE id = ?
		`, [id]);

		const mapped = this.mapResults(results);
		return mapped.length > 0 ? mapped[0] : null;
	}

	async create(ruleData: {
		ruleType: RuleType;
		sourceValue: string;
		displayValue: string;
		patternType: PatternType;
		priority: number;
		active: boolean;
	}): Promise<ModuleCategorizationDisplayRule> {
		const db = getDatabase();

		// Insert the new rule
		db.run(`
			INSERT INTO ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES}
			(rule_type, source_value, display_value, pattern_type, priority, active, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`, [
			ruleData.ruleType,
			ruleData.sourceValue,
			ruleData.displayValue,
			ruleData.patternType,
			ruleData.priority,
			ruleData.active ? 1 : 0
		]);

		// Get the inserted rule with its new ID
		const results = db.exec('SELECT last_insert_rowid() as id');
		const newId = results[0]?.values[0]?.[0] as number;

		const newRule = await this.findById(newId);
		if (!newRule) {
			throw new Error('Failed to retrieve created module/categorization display rule');
		}

		return newRule;
	}

	async update(id: number, updates: Partial<ModuleCategorizationDisplayRule>): Promise<ModuleCategorizationDisplayRule> {
		const db = getDatabase();

		// Build dynamic update query
		const updateFields: string[] = [];
		const updateValues: any[] = [];

		if (updates.ruleType !== undefined) {
			updateFields.push('rule_type = ?');
			updateValues.push(updates.ruleType);
		}
		if (updates.sourceValue !== undefined) {
			updateFields.push('source_value = ?');
			updateValues.push(updates.sourceValue);
		}
		if (updates.displayValue !== undefined) {
			updateFields.push('display_value = ?');
			updateValues.push(updates.displayValue);
		}
		if (updates.patternType !== undefined) {
			updateFields.push('pattern_type = ?');
			updateValues.push(updates.patternType);
		}
		if (updates.priority !== undefined) {
			updateFields.push('priority = ?');
			updateValues.push(updates.priority);
		}
		if (updates.active !== undefined) {
			updateFields.push('active = ?');
			updateValues.push(updates.active ? 1 : 0);
		}

		if (updateFields.length === 0) {
			// No updates to apply, just return the existing rule
			const existing = await this.findById(id);
			if (!existing) {
				throw new Error(`Module/categorization display rule with ID ${id} not found`);
			}
			return existing;
		}

		// Always update the updated_at timestamp
		updateFields.push('updated_at = CURRENT_TIMESTAMP');
		updateValues.push(id); // Add the WHERE clause parameter

		const updateQuery = `
			UPDATE ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES}
			SET ${updateFields.join(', ')}
			WHERE id = ?
		`;

		db.run(updateQuery, updateValues);

		// Return the updated rule
		const updatedRule = await this.findById(id);
		if (!updatedRule) {
			throw new Error(`Module/categorization display rule with ID ${id} not found after update`);
		}

		return updatedRule;
	}

	async delete(id: number): Promise<void> {
		const db = getDatabase();
		db.run(`DELETE FROM ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES} WHERE id = ?`, [id]);
	}

	testPattern(pattern: string, text: string, patternType: PatternType): boolean {
		const normalizedText = text.toLowerCase();
		const normalizedPattern = pattern.toLowerCase();

		switch (patternType) {
			case 'exact':
				return normalizedText === normalizedPattern;
			case 'regex':
				try {
					return new RegExp(pattern, 'i').test(text);
				} catch (error) {
					console.warn(`Invalid regex pattern: ${pattern}`, error);
					return false;
				}
			case 'contains':
			default:
				return normalizedText.includes(normalizedPattern);
		}
	}

	private mapResults(results: any[]): ModuleCategorizationDisplayRule[] {
		if (!results[0] || !results[0].values) {
			return [];
		}

		return results[0].values.map((row: any[]) => {
			const [id, ruleType, sourceValue, displayValue, patternType, priority, active, createdAt, updatedAt] = row;

			return {
				id: id as number,
				ruleType: ruleType as RuleType,
				sourceValue: sourceValue as string,
				displayValue: displayValue as string,
				patternType: patternType as PatternType,
				priority: priority as number,
				active: Boolean(active),
				createdAt: new Date(createdAt as string),
				updatedAt: new Date(updatedAt as string),
			};
		});
	}
}
