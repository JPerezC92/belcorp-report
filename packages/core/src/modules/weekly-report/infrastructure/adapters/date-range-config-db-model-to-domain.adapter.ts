import { DateRangeConfig } from "../../domain/date-range-config.js";
import type { DateRangeConfigDbModel } from "../models/date-range-config-db.model.js";

/**
 * Adapter to convert database model to domain entity
 */
export function dateRangeConfigDbModelToDomain(
	model: DateRangeConfigDbModel
): DateRangeConfig {
	return new DateRangeConfig(
		model.id,
		model.fromDate,
		model.toDate,
		model.description,
		model.isActive === 1, // Convert SQLite integer to boolean
		model.rangeType,
		model.scope,
		model.createdAt ? new Date(model.createdAt) : undefined,
		model.updatedAt ? new Date(model.updatedAt) : undefined
	);
}

/**
 * Adapter to convert domain entity to database model (for insert/update)
 */
export function dateRangeConfigDomainToDbModel(
	domain: DateRangeConfig
): Omit<DateRangeConfigDbModel, 'id'> {
	return {
		fromDate: domain.fromDate,
		toDate: domain.toDate,
		description: domain.description,
		isActive: domain.isActive ? 1 : 0, // Convert boolean to SQLite integer
		rangeType: domain.rangeType,
		scope: domain.scope,
		createdAt: domain.createdAt?.toISOString(),
		updatedAt: domain.updatedAt?.toISOString(),
	};
}
