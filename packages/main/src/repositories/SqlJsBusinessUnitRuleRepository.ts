import type { BusinessUnitRule, PatternType } from "@app/core";
import type { BusinessUnitRuleRepository } from "@app/core";
import { getDatabase } from "@app/database";

export class SqlJsBusinessUnitRuleRepository implements BusinessUnitRuleRepository {
	async findAll(): Promise<BusinessUnitRule[]> {
		const db = getDatabase();
		const results = db.exec(`
			SELECT id, business_unit, pattern, pattern_type, priority, active, created_at, updated_at
			FROM business_unit_rules
			ORDER BY priority ASC, business_unit ASC
		`);

		return this.mapResults(results);
	}

	async findActive(): Promise<BusinessUnitRule[]> {
		const db = getDatabase();
		const results = db.exec(`
			SELECT id, business_unit, pattern, pattern_type, priority, active, created_at, updated_at
			FROM business_unit_rules
			WHERE active = 1
			ORDER BY priority ASC, business_unit ASC
		`);

		return this.mapResults(results);
	}

	async findById(id: number): Promise<BusinessUnitRule | null> {
		const db = getDatabase();
		const results = db.exec(`
			SELECT id, business_unit, pattern, pattern_type, priority, active, created_at, updated_at
			FROM business_unit_rules
			WHERE id = ?
		`, [id]);

		const mapped = this.mapResults(results);
		return mapped.length > 0 ? mapped[0] : null;
	}

	async create(ruleData: {
		businessUnit: string;
		pattern: string;
		patternType: string;
		priority: number;
		active: boolean;
	}): Promise<BusinessUnitRule> {
		const db = getDatabase();

		// Insert the new rule
		db.run(`
			INSERT INTO business_unit_rules
			(business_unit, pattern, pattern_type, priority, active, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`, [
			ruleData.businessUnit,
			ruleData.pattern,
			ruleData.patternType,
			ruleData.priority,
			ruleData.active ? 1 : 0
		]);

		// Get the inserted rule with its new ID
		const results = db.exec('SELECT last_insert_rowid() as id');
		const newId = results[0]?.values[0]?.[0] as number;

		const newRule = await this.findById(newId);
		if (!newRule) {
			throw new Error('Failed to retrieve created business unit rule');
		}

		return newRule;
	}

	async update(id: number, updates: Partial<BusinessUnitRule>): Promise<BusinessUnitRule> {
		const db = getDatabase();

		// Build dynamic update query
		const updateFields: string[] = [];
		const updateValues: any[] = [];

		if (updates.businessUnit !== undefined) {
			updateFields.push('business_unit = ?');
			updateValues.push(updates.businessUnit);
		}
		if (updates.pattern !== undefined) {
			updateFields.push('pattern = ?');
			updateValues.push(updates.pattern);
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
				throw new Error(`Business unit rule with ID ${id} not found`);
			}
			return existing;
		}

		// Always update the updated_at timestamp
		updateFields.push('updated_at = CURRENT_TIMESTAMP');
		updateValues.push(id); // Add the WHERE clause parameter

		const updateQuery = `
			UPDATE business_unit_rules
			SET ${updateFields.join(', ')}
			WHERE id = ?
		`;

		db.run(updateQuery, updateValues);

		// Return the updated rule
		const updatedRule = await this.findById(id);
		if (!updatedRule) {
			throw new Error(`Business unit rule with ID ${id} not found after update`);
		}

		return updatedRule;
	}

	async delete(id: number): Promise<void> {
		const db = getDatabase();
		db.run('DELETE FROM business_unit_rules WHERE id = ?', [id]);
	}

	async detectBusinessUnit(applicationText: string): Promise<string> {
		const activeRules = await this.findActive();

		// Check rules in priority order
		for (const rule of activeRules) {
			if (rule.matches(applicationText)) {
				return rule.businessUnit;
			}
		}

		return 'UNKNOWN';
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

	private mapResults(results: any[]): BusinessUnitRule[] {
		if (!results[0] || !results[0].values) {
			return [];
		}

		return results[0].values.map((row: any[]) => {
			const [id, businessUnit, pattern, patternType, priority, active, createdAt, updatedAt] = row;

			// Import the class dynamically to avoid circular dependencies
			return {
				id: id as number,
				businessUnit: businessUnit as string,
				pattern: pattern as string,
				patternType: patternType as PatternType,
				priority: priority as number,
				active: Boolean(active),
				createdAt: new Date(createdAt as string),
				updatedAt: new Date(updatedAt as string),
				matches: function(text: string): boolean {
					const normalizedText = text.toLowerCase();
					const normalizedPattern = this.pattern.toLowerCase();

					if (!this.active) return false;

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
				},
				update: function(updates: any) {
					throw new Error('Use repository.update() method instead');
				},
				toJSON: function() {
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
			} as BusinessUnitRule;
		});
	}
}