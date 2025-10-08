import { DateRangeSettings } from "../../domain/date-range-settings.js";
import type { DateRangeSettingsDbModel } from "../models/date-range-settings-db.model.js";

/**
 * Adapter to convert database model to domain entity
 */
export function dateRangeSettingsDbModelToDomain(
	model: DateRangeSettingsDbModel
): DateRangeSettings {
	return new DateRangeSettings(
		model.id,
		model.globalModeEnabled === 1, // Convert SQLite integer to boolean
		model.createdAt ? new Date(model.createdAt) : undefined,
		model.updatedAt ? new Date(model.updatedAt) : undefined
	);
}

/**
 * Adapter to convert domain entity to database model (for insert/update)
 */
export function dateRangeSettingsDomainToDbModel(
	domain: DateRangeSettings
): Omit<DateRangeSettingsDbModel, 'id'> {
	return {
		globalModeEnabled: domain.globalModeEnabled ? 1 : 0, // Convert boolean to SQLite integer
		createdAt: domain.createdAt?.toISOString(),
		updatedAt: domain.updatedAt?.toISOString(),
	};
}
