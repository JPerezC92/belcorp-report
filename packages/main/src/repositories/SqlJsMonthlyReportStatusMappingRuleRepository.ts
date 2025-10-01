import type { MonthlyReportStatusMappingRule, PatternType } from "@app/core";
import type { MonthlyReportStatusMappingRuleRepository } from "@app/core";
import { getDatabase, TABLE_NAMES } from "@app/database";

export class SqlJsMonthlyReportStatusMappingRuleRepository implements MonthlyReportStatusMappingRuleRepository {
	async findAll(): Promise<MonthlyReportStatusMappingRule[]> {
		const db = getDatabase();
		const results = db.exec(`
			SELECT id, sourceStatus, targetStatus, patternType, priority, active, createdAt, updatedAt
			FROM ${TABLE_NAMES.MONTHLY_REPORT_STATUS_MAPPING_RULES}
			ORDER BY priority ASC, sourceStatus ASC
		`);

		return this.mapResults(results);
	}

	async findActive(): Promise<MonthlyReportStatusMappingRule[]> {
		const db = getDatabase();
		const results = db.exec(`
			SELECT id, sourceStatus, targetStatus, patternType, priority, active, createdAt, updatedAt
			FROM ${TABLE_NAMES.MONTHLY_REPORT_STATUS_MAPPING_RULES}
			WHERE active = 1
			ORDER BY priority ASC, sourceStatus ASC
		`);

		return this.mapResults(results);
	}

	async findById(id: number): Promise<MonthlyReportStatusMappingRule | null> {
		const db = getDatabase();
		const results = db.exec(`
			SELECT id, sourceStatus, targetStatus, patternType, priority, active, createdAt, updatedAt
			FROM ${TABLE_NAMES.MONTHLY_REPORT_STATUS_MAPPING_RULES}
			WHERE id = ?
		`, [id]);

		const mapped = this.mapResults(results);
		return mapped.length > 0 ? mapped[0] : null;
	}

	async create(ruleData: {
		sourceStatus: string;
		targetStatus: string;
		patternType: string;
		priority: number;
		active: boolean;
	}): Promise<MonthlyReportStatusMappingRule> {
		const db = getDatabase();

		// Insert the new rule
		db.run(`
			INSERT INTO ${TABLE_NAMES.MONTHLY_REPORT_STATUS_MAPPING_RULES}
			(sourceStatus, targetStatus, patternType, priority, active, createdAt, updatedAt)
			VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
		`, [
			ruleData.sourceStatus,
			ruleData.targetStatus,
			ruleData.patternType,
			ruleData.priority,
			ruleData.active ? 1 : 0
		]);

		// Get the inserted rule with its new ID
		const results = db.exec('SELECT last_insert_rowid() as id');
		const newId = results[0]?.values[0]?.[0] as number;

		const newRule = await this.findById(newId);
		if (!newRule) {
			throw new Error('Failed to retrieve created monthly report status mapping rule');
		}

		return newRule;
	}

	async update(id: number, updates: Partial<MonthlyReportStatusMappingRule>): Promise<MonthlyReportStatusMappingRule> {
		const db = getDatabase();

		// Build dynamic update query
		const updateFields: string[] = [];
		const updateValues: any[] = [];

		if (updates.sourceStatus !== undefined) {
			updateFields.push('sourceStatus = ?');
			updateValues.push(updates.sourceStatus);
		}
		if (updates.targetStatus !== undefined) {
			updateFields.push('targetStatus = ?');
			updateValues.push(updates.targetStatus);
		}
		if (updates.patternType !== undefined) {
			updateFields.push('patternType = ?');
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
				throw new Error(`Monthly report status mapping rule with ID ${id} not found`);
			}
			return existing;
		}

		// Always update the updatedAt timestamp
		updateFields.push(`updatedAt = datetime('now')`);
		updateValues.push(id); // Add the WHERE clause parameter

		const updateQuery = `
			UPDATE ${TABLE_NAMES.MONTHLY_REPORT_STATUS_MAPPING_RULES}
			SET ${updateFields.join(', ')}
			WHERE id = ?
		`;

		db.run(updateQuery, updateValues);

		// Return the updated rule
		const updatedRule = await this.findById(id);
		if (!updatedRule) {
			throw new Error(`Monthly report status mapping rule with ID ${id} not found after update`);
		}

		return updatedRule;
	}

	async delete(id: number): Promise<void> {
		const db = getDatabase();
		db.run(`DELETE FROM ${TABLE_NAMES.MONTHLY_REPORT_STATUS_MAPPING_RULES} WHERE id = ?`, [id]);
	}

	async mapStatus(requestStatus: string): Promise<string> {
		const activeRules = await this.findActive();

		// Check rules in priority order
		for (const rule of activeRules) {
			if (rule.matches(requestStatus)) {
				return rule.targetStatus;
			}
		}

		// No rule matched, return original status
		return requestStatus;
	}

	testPattern(pattern: string, text: string, patternType: PatternType): boolean {
		const normalizedText = text.toLowerCase().trim();
		const normalizedPattern = pattern.toLowerCase().trim();

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

	private mapResults(results: any[]): MonthlyReportStatusMappingRule[] {
		if (!results[0] || !results[0].values) {
			return [];
		}

		return results[0].values.map((row: any[]) => {
			const [id, sourceStatus, targetStatus, patternType, priority, active, createdAt, updatedAt] = row;

			return {
				id: id as number,
				sourceStatus: sourceStatus as string,
				targetStatus: targetStatus as string,
				patternType: patternType as PatternType,
				priority: priority as number,
				active: Boolean(active),
				createdAt: new Date(createdAt as string),
				updatedAt: new Date(updatedAt as string),
				matches: function(status: string): boolean {
					const normalizedStatus = status.toLowerCase().trim();
					const normalizedPattern = this.sourceStatus.toLowerCase().trim();

					if (!this.active) return false;

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
				},
				update: function(updates: any) {
					throw new Error('Use repository.update() method instead');
				},
				toJSON: function() {
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
			} as MonthlyReportStatusMappingRule;
		});
	}
}
