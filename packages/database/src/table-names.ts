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
	DATE_RANGE_CONFIGS: "date_range_configs",
	DATE_RANGE_SETTINGS: "date_range_settings",
	BUSINESS_UNIT_RULES: "business_unit_rules",
	MONTHLY_REPORT_STATUS_MAPPING_RULES: "monthly_report_status_mapping_rules",
	MODULE_CATEGORIZATION_DISPLAY_RULES: "module_categorization_display_rules",
	WAR_ROOM_RECORDS: "war_room_records",
	MONTHLY_REPORT_LEVEL_MAPPING: "monthly_report_level_mapping",
	SB_OPERATIONAL_RELEASES: "sb_operational_releases",
	MIGRATIONS: "_migrations",
} as const;

export type TableName = (typeof TABLE_NAMES)[keyof typeof TABLE_NAMES];
