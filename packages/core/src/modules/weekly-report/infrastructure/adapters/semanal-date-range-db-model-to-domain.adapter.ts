import { SemanalDateRange } from "../../domain/semanal-date-range.js";
import type { SemanalDateRangeDbModel } from "../models/semanal-date-range-db.model.js";

/**
 * Adapter to convert database model to domain entity
 */
export function semanalDateRangeDbModelToDomain(
	model: SemanalDateRangeDbModel
): SemanalDateRange {
	return new SemanalDateRange(
		model.id,
		model.fromDate,
		model.toDate,
		model.description,
		model.isActive === 1, // Convert SQLite integer to boolean
		model.createdAt ? new Date(model.createdAt) : undefined,
		model.updatedAt ? new Date(model.updatedAt) : undefined
	);
}

/**
 * Adapter to convert domain entity to database model (for insert/update)
 */
export function semanalDateRangeDomainToDbModel(
	domain: SemanalDateRange
): Omit<SemanalDateRangeDbModel, 'id'> {
	return {
		fromDate: domain.fromDate,
		toDate: domain.toDate,
		description: domain.description,
		isActive: domain.isActive ? 1 : 0, // Convert boolean to SQLite integer
		createdAt: domain.createdAt?.toISOString(),
		updatedAt: domain.updatedAt?.toISOString(),
	};
}