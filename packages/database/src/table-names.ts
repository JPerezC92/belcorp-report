/**
 * Database table names constants
 * Centralizes all table names to avoid raw strings in queries
 */
export const TABLE_NAMES = {
	TAG: "tag",
	MIGRATIONS: "_migrations",
} as const;

export type TableName = (typeof TABLE_NAMES)[keyof typeof TABLE_NAMES];
