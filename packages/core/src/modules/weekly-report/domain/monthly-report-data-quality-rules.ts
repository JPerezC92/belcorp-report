/**
 * Common field values used in monthly report records
 * Single source of truth to avoid magic strings throughout the codebase
 */
export const COMMON_FIELD_VALUES = {
	NO_ASIGNADO: "No asignado",
	ESPERANDO_EL_CLIENTE: "Esperando El Cliente",
	CLOSED: "Closed",
	ERROR_CODIFICACION_BUG: "Error de codificación (Bug)",
} as const;

/**
 * Data Quality Rules for Monthly Report Records
 *
 * These rules define validation checks for data quality issues in monthly reports.
 * Each rule has a unique value identifier and a human-readable description.
 */
export const DATA_QUALITY_RULES = {
	/**
	 * Rule: Closed requests must have informacionAdicionalReporte filled
	 * Triggered when: requestStatusReporte === "Closed" AND informacionAdicionalReporte is empty/null
	 */
	CLOSED_MISSING_ADDITIONAL_INFO: {
		value: "CLOSED_MISSING_ADDITIONAL_INFO",
		description: "Closed request must have informacionAdicionalReporte",
	},

	/**
	 * Rule: Reports should not include records with "Esperando El Cliente" status
	 * Triggered when: requestStatusReporte === "Esperando El Cliente"
	 */
	WAITING_FOR_CLIENT_IN_REPORT: {
		value: "WAITING_FOR_CLIENT_IN_REPORT",
		description: "Report should not include records with 'Esperando El Cliente' status",
	},

	/**
	 * Rule: All records must have categorization and cannot be "No asignado"
	 * Triggered when: categorization is null/empty OR categorization === "No asignado"
	 */
	MISSING_OR_UNASSIGNED_CATEGORIZATION: {
		value: "MISSING_OR_UNASSIGNED_CATEGORIZATION",
		description: "Record must have categorization and cannot be 'No asignado'",
	},
} as const;

/**
 * Type representing a data quality rule key
 */
export type DataQualityRuleKey = keyof typeof DATA_QUALITY_RULES;

/**
 * Type representing a data quality rule object
 */
export type DataQualityRule = typeof DATA_QUALITY_RULES[DataQualityRuleKey];
