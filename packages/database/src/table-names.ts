/**
 * Database table names constants
 * Centralizes all table names to avoid raw strings in queries
 */
export const TABLE_NAMES = {
	TAG: "tag",
	FOR_TAGGING_DATA: "for_tagging_data",
	PARENT_CHILD_RELATIONSHIPS: "parent_child_relationships",
	CORRECTIVE_MAINTENANCE_RECORDS: "corrective_maintenance_records",
	MONTHLY_REPORT_RECORDS: "monthly_report_records",
	SEMANAL_DATE_RANGES: "semanal_date_ranges",
	BUSINESS_UNIT_RULES: "business_unit_rules",
	MONTHLY_REPORT_STATUS_MAPPING_RULES: "monthly_report_status_mapping_rules",
	MIGRATIONS: "_migrations",
} as const;

export type TableName = (typeof TABLE_NAMES)[keyof typeof TABLE_NAMES];
