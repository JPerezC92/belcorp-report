import { MonthlyReportStatusMappingRule } from "../../domain/monthly-report-status-mapping-rule.js";
import type { MonthlyReportStatusMappingRuleDbModel } from "../models/monthly-report-status-mapping-rule-db.model.js";

export function monthlyReportStatusMappingRuleDbModelToDomain(
	model: MonthlyReportStatusMappingRuleDbModel
): MonthlyReportStatusMappingRule {
	return MonthlyReportStatusMappingRule.create({
		id: model.id,
		sourceStatus: model.sourceStatus,
		targetStatus: model.targetStatus,
		patternType: model.patternType,
		priority: model.priority,
		active: model.active === 1, // Convert SQLite integer to boolean
		createdAt: new Date(model.createdAt),
		updatedAt: new Date(model.updatedAt)
	});
}
