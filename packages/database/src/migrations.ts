import type { Database } from "sql.js";
import { TABLE_NAMES } from "./table-names.js";

/**
 * Database migration interface with enhanced features
 */
export interface Migration {
	version: string;
	description: string;
	dependencies?: string[]; // Versions this migration depends on
	up: (db: Database) => void | Promise<void>;
	down?: (db: Database) => void | Promise<void>;
	checksum?: string; // For integrity validation
	applied?: Date;
}

/**
 * Migration execution result
 */
export interface MigrationResult {
	version: string;
	success: boolean;
	error?: Error;
	executionTime: number;
}

/**
 * Migration state information
 */
export interface MigrationState {
	version: string;
	description: string;
	applied_at: string;
	checksum: string | null;
}

/**
 * Migration error class for better error handling
 */
export class MigrationError extends Error {
	constructor(
		message: string,
		public readonly version: string,
		public readonly operation: "up" | "down",
		public readonly originalError?: Error
	) {
		super(message);
		this.name = "MigrationError";

		if (originalError) {
			this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
		}
	}
}

/**
 * Generate a simple checksum for migration validation
 */
function generateChecksum(migration: Migration): string {
	const content =
		migration.up.toString() + (migration.down?.toString() || "");
	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash).toString(16);
}

/**
 * Available migrations with enhanced structure
 */
export const migrations: Migration[] = [
	{
		version: "001",
		description: "Initialize database with all tables and default data",
		up: (db: Database) => {
			// ===== TABLE 1: TAG =====
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.TAG} (
					requestId TEXT PRIMARY KEY,
					createdTime TEXT,
					requestIdLink TEXT,
					informacionAdicional TEXT,
					modulo TEXT,
					problemId TEXT,
					problemIdLink TEXT,
					linkedRequestIdValue TEXT,
					linkedRequestIdLink TEXT,
					jira TEXT,
					categorizacion TEXT,
					technician TEXT,
					processedAt TEXT DEFAULT CURRENT_TIMESTAMP
				)
			`);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_tag_createdTime ON ${TABLE_NAMES.TAG}(createdTime)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_tag_technician ON ${TABLE_NAMES.TAG}(technician)`
			);

			// ===== TABLE 2: FOR_TAGGING_DATA (with link columns from migration 006) =====
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.FOR_TAGGING_DATA} (
					requestId TEXT PRIMARY KEY,
					technician TEXT,
					createdTime TEXT,
					modulo TEXT,
					subject TEXT,
					problemId TEXT,
					linkedRequestId TEXT,
					category TEXT,
					importedAt TEXT DEFAULT CURRENT_TIMESTAMP,
					sourceFile TEXT,
					requestIdLink TEXT,
					subjectLink TEXT,
					problemIdLink TEXT,
					linkedRequestIdLink TEXT
				)
			`);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_for_tagging_data_category ON ${TABLE_NAMES.FOR_TAGGING_DATA}(category)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_for_tagging_data_technician ON ${TABLE_NAMES.FOR_TAGGING_DATA}(technician)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_for_tagging_data_createdTime ON ${TABLE_NAMES.FOR_TAGGING_DATA}(createdTime)`
			);

			// ===== TABLE 3: PARENT_CHILD_RELATIONSHIPS =====
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS} (
					parentRequestId TEXT NOT NULL,
					parentLink TEXT,
					childRequestId TEXT NOT NULL,
					childLink TEXT,
					createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
					PRIMARY KEY (parentRequestId, childRequestId)
				)
			`);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_parent_child_parentRequestId ON ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS}(parentRequestId)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_parent_child_childRequestId ON ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS}(childRequestId)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_parent_child_createdAt ON ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS}(createdAt)`
			);

			// ===== TABLE 4: CORRECTIVE_MAINTENANCE_RECORDS (with businessUnit and inDateRange) =====
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS} (
					requestId TEXT PRIMARY KEY,
					requestIdLink TEXT,
					createdTime TEXT NOT NULL,
					applications TEXT NOT NULL,
					categorization TEXT NOT NULL,
					requestStatus TEXT NOT NULL,
					module TEXT NOT NULL,
					subject TEXT NOT NULL,
					subjectLink TEXT,
					priority TEXT NOT NULL,
					eta TEXT NOT NULL,
					rca TEXT NOT NULL,
					businessUnit TEXT NOT NULL DEFAULT 'Unknown',
					inDateRange BOOLEAN DEFAULT 0,
					createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
				)
			`);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_corrective_maintenance_requestId ON ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}(requestId)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_corrective_maintenance_module ON ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}(module)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_corrective_maintenance_createdTime ON ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}(createdTime)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_corrective_maintenance_requestStatus ON ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}(requestStatus)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_corrective_maintenance_businessUnit ON ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}(businessUnit)`
			);

			// ===== TABLE 5: MONTHLY_REPORT_RECORDS (with inDateRange renamed from semanal) =====
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.MONTHLY_REPORT_RECORDS} (
					requestId TEXT PRIMARY KEY,
					applications TEXT NOT NULL,
					categorization TEXT,
					requestIdLink TEXT,
					createdTime TEXT NOT NULL,
					requestStatus TEXT NOT NULL,
					module TEXT NOT NULL,
					subject TEXT NOT NULL,
					subjectLink TEXT,
					priority TEXT,
					eta TEXT,
					additionalInfo TEXT,
					resolvedTime TEXT,
					affectedCountries TEXT,
					recurrence TEXT,
					recurrenceComputed TEXT,
					technician TEXT,
					jira TEXT,
					problemId TEXT,
					problemIdLink TEXT,
					linkedRequestId TEXT,
					linkedRequestIdLink TEXT,
					requestOLAStatus TEXT,
					escalationGroup TEXT,
					affectedApplications TEXT,
					shouldResolveLevel1 TEXT,
					campaign TEXT,
					cuv1 TEXT,
					release TEXT,
					rca TEXT,
					businessUnit TEXT NOT NULL,
					inDateRange BOOLEAN DEFAULT 0,
					rep TEXT NOT NULL,
					dia INTEGER NOT NULL,
					week INTEGER NOT NULL,
					priorityReporte TEXT,
					requestStatusReporte TEXT NOT NULL,
					informacionAdicionalReporte TEXT,
					enlaces INTEGER DEFAULT 0,
					mensaje TEXT,
					observations TEXT,
					statusModifiedByUser BOOLEAN DEFAULT 0,
					createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
					updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
				)
			`);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_monthly_report_requestId ON ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}(requestId)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_monthly_report_applications ON ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}(applications)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_monthly_report_module ON ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}(module)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_monthly_report_createdTime ON ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}(createdTime)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_monthly_report_requestStatus ON ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}(requestStatus)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_monthly_report_businessUnit ON ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}(businessUnit)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_monthly_report_rep ON ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}(rep)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_monthly_report_semanal ON ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}(inDateRange)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_monthly_report_week ON ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}(week)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_monthly_report_linkedRequestId ON ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}(linkedRequestId)`
			);

			// ===== TABLE 6: DATE_RANGE_CONFIGS (with rangeType and scope from migration 014) =====
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.DATE_RANGE_CONFIGS} (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					fromDate TEXT NOT NULL,
					toDate TEXT NOT NULL,
					description TEXT NOT NULL,
					isActive BOOLEAN DEFAULT 1,
					rangeType TEXT CHECK(rangeType IN ('weekly', 'custom', 'disabled')) DEFAULT 'disabled',
					scope TEXT CHECK(scope IN ('monthly', 'corrective', 'global')) DEFAULT 'monthly',
					createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				)
			`);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_date_range_configs_active ON ${TABLE_NAMES.DATE_RANGE_CONFIGS}(isActive)`
			);

			// Insert 3 default date range configs (all disabled)
			db.run(`
				INSERT INTO ${TABLE_NAMES.DATE_RANGE_CONFIGS}
					(fromDate, toDate, description, isActive, rangeType, scope, createdAt, updatedAt)
				VALUES
					('2025-01-01', '2025-12-31', 'Monthly Range (Disabled)', 1, 'disabled', 'monthly', datetime('now'), datetime('now')),
					('2025-01-01', '2025-12-31', 'Corrective Range (Disabled)', 1, 'disabled', 'corrective', datetime('now'), datetime('now')),
					('2025-01-01', '2025-12-31', 'Global Range (Disabled)', 1, 'disabled', 'global', datetime('now'), datetime('now'))
			`);

			// ===== TABLE 7: DATE_RANGE_SETTINGS =====
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.DATE_RANGE_SETTINGS} (
					id INTEGER PRIMARY KEY CHECK(id = 1),
					globalModeEnabled INTEGER DEFAULT 0,
					createdAt TEXT NOT NULL,
					updatedAt TEXT NOT NULL
				)
			`);
			db.run(`
				INSERT INTO ${TABLE_NAMES.DATE_RANGE_SETTINGS} (id, globalModeEnabled, createdAt, updatedAt)
				VALUES (1, 0, datetime('now'), datetime('now'))
			`);

			// ===== TABLE 8: BUSINESS_UNIT_RULES =====
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.BUSINESS_UNIT_RULES} (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					business_unit TEXT NOT NULL,
					pattern TEXT NOT NULL,
					pattern_type TEXT CHECK(pattern_type IN ('contains', 'regex', 'exact')) DEFAULT 'contains',
					priority INTEGER DEFAULT 0,
					active BOOLEAN DEFAULT 1,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				)
			`);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_business_unit_rules_business_unit ON ${TABLE_NAMES.BUSINESS_UNIT_RULES}(business_unit)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_business_unit_rules_active ON ${TABLE_NAMES.BUSINESS_UNIT_RULES}(active)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_business_unit_rules_priority ON ${TABLE_NAMES.BUSINESS_UNIT_RULES}(priority)`
			);

			// Insert default business unit rules
			const defaultRules = [
				{
					businessUnit: "FFVV",
					pattern: "APP - Gestiona tu Negocio (SE)",
					priority: 1,
				},
				{
					businessUnit: "FFVV",
					pattern: "APP - Crecer es Ganar (FFVV)",
					priority: 2,
				},
				{ businessUnit: "FFVV", pattern: "Portal FFVV", priority: 3 },
				{
					businessUnit: "SB",
					pattern: "Somos Belcorp 2.0",
					priority: 4,
				},
				{
					businessUnit: "SB",
					pattern: "APP - SOMOS BELCORP",
					priority: 5,
				},
				{ businessUnit: "UB-3", pattern: "Unete 3.0", priority: 6 },
				{ businessUnit: "UN-2", pattern: "Unete 2.0", priority: 7 },
				{
					businessUnit: "CD",
					pattern: "Catálogo Digital",
					priority: 8,
				},
				{ businessUnit: "PROL", pattern: "PROL", priority: 9 },
			];
			const insertStmt = db.prepare(`
				INSERT INTO ${TABLE_NAMES.BUSINESS_UNIT_RULES}
				(business_unit, pattern, pattern_type, priority, active, created_at, updated_at)
				VALUES (?, ?, 'contains', ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`);
			try {
				defaultRules.forEach((rule) => {
					insertStmt.run([
						rule.businessUnit,
						rule.pattern,
						rule.priority,
					]);
				});
			} finally {
				insertStmt.free();
			}

			// ===== TABLE 9: MONTHLY_REPORT_STATUS_MAPPING_RULES =====
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.MONTHLY_REPORT_STATUS_MAPPING_RULES} (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					sourceStatus TEXT NOT NULL,
					targetStatus TEXT NOT NULL,
					patternType TEXT CHECK(patternType IN ('exact', 'contains', 'regex')) DEFAULT 'exact',
					priority INTEGER NOT NULL,
					active INTEGER NOT NULL DEFAULT 1,
					createdAt TEXT NOT NULL,
					updatedAt TEXT NOT NULL
				)
			`);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_monthly_report_status_mapping_priority ON ${TABLE_NAMES.MONTHLY_REPORT_STATUS_MAPPING_RULES}(priority, active)`
			);

			// Insert default status mappings
			db.run(`
				INSERT INTO ${TABLE_NAMES.MONTHLY_REPORT_STATUS_MAPPING_RULES}
					(sourceStatus, targetStatus, patternType, priority, active, createdAt, updatedAt)
				VALUES
					('En Mantenimiento Correctivo', 'In L3 Backlog', 'exact', 10, 1, datetime('now'), datetime('now')),
					('Dev in Progress', 'In L3 Backlog', 'exact', 11, 1, datetime('now'), datetime('now')),
					('Nivel 2', 'On going in L2', 'exact', 20, 1, datetime('now'), datetime('now')),
					('Nivel 3', 'On going in L3', 'exact', 30, 1, datetime('now'), datetime('now')),
					('Validado', 'Closed', 'exact', 40, 1, datetime('now'), datetime('now')),
					('Closed', 'Closed', 'exact', 41, 1, datetime('now'), datetime('now'))
			`);

			// ===== TABLE 10: MODULE_CATEGORIZATION_DISPLAY_RULES =====
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES} (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					rule_type TEXT CHECK(rule_type IN ('module', 'categorization')),
					source_value TEXT NOT NULL,
					display_value TEXT NOT NULL,
					pattern_type TEXT CHECK(pattern_type IN ('exact', 'contains', 'regex')) DEFAULT 'exact',
					priority INTEGER DEFAULT 0,
					active BOOLEAN DEFAULT 1,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				)
			`);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_display_rules_type_active ON ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES}(rule_type, active)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_display_rules_priority ON ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES}(priority)`
			);

			// Insert default display rules
			const defaultDisplayRules = [
				// Categorization rules
				{
					ruleType: "categorization",
					sourceValue: "Error de codificación (Bug)",
					displayValue: "Bugs",
					patternType: "exact",
					priority: 1,
				},
				{
					ruleType: "categorization",
					sourceValue: "Error de Alcance",
					displayValue: "Missing Scope",
					patternType: "exact",
					priority: 2,
				},
				{
					ruleType: "categorization",
					sourceValue: "Error de usuario",
					displayValue: "User Mistake",
					patternType: "exact",
					priority: 3,
				},
				{
					ruleType: "categorization",
					sourceValue: "Error de datos (Data Source)",
					displayValue: "Data Source",
					patternType: "exact",
					priority: 4,
				},
				{
					ruleType: "categorization",
					sourceValue: "Informativa (Inquiries)",
					displayValue: "Inquiry",
					patternType: "exact",
					priority: 5,
				},
				{
					ruleType: "categorization",
					sourceValue: "Error por Cambio",
					displayValue: "Change/Release",
					patternType: "exact",
					priority: 6,
				},
				{
					ruleType: "categorization",
					sourceValue: "Error de Infraestructura",
					displayValue: "Infrastructure Error",
					patternType: "exact",
					priority: 7,
				},
				{
					ruleType: "categorization",
					sourceValue:
						"Error de interfaces (Sync Data & Integration)",
					displayValue: "Sync Data & Integration",
					patternType: "exact",
					priority: 8,
				},
				{
					ruleType: "categorization",
					sourceValue: "Error de configuración",
					displayValue: "Configuration Error",
					patternType: "exact",
					priority: 9,
				},

				// Module rules - CD (Catalog/Digital)
				{
					ruleType: "module",
					sourceValue: "CD Catalog",
					displayValue: "Catalog",
					patternType: "exact",
					priority: 100,
				},
				{
					ruleType: "module",
					sourceValue: "CD Catalogos Personalizados",
					displayValue: "Custom Catalogs",
					patternType: "exact",
					priority: 101,
				},
				{
					ruleType: "module",
					sourceValue: "CD Checkout Entrega Inmediata",
					displayValue: "Checkout Immediate Delivery",
					patternType: "exact",
					priority: 102,
				},
				{
					ruleType: "module",
					sourceValue: "CD Checkout prepedidos",
					displayValue: "Checkout Pre-orders",
					patternType: "exact",
					priority: 103,
				},
				{
					ruleType: "module",
					sourceValue: "CD Login",
					displayValue: "Login",
					patternType: "exact",
					priority: 104,
				},
				{
					ruleType: "module",
					sourceValue: "CD Pdp",
					displayValue: "PDP",
					patternType: "exact",
					priority: 105,
				},
				{
					ruleType: "module",
					sourceValue: "CD Search",
					displayValue: "Search",
					patternType: "exact",
					priority: 106,
				},

				// Module rules - FFVV
				{
					ruleType: "module",
					sourceValue: "FFVV Avance de facturación",
					displayValue: "Billing Progress",
					patternType: "exact",
					priority: 200,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Bolsa de pedidos",
					displayValue: "Order Bag",
					patternType: "exact",
					priority: 201,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Botón ciclo de nuevas",
					displayValue: "New Cycle Button",
					patternType: "exact",
					priority: 202,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Botón retención y capi",
					displayValue: "Retention & Capi Button",
					patternType: "exact",
					priority: 203,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Botón venta pedido pnmp",
					displayValue: "PNMP Order Sale Button",
					patternType: "exact",
					priority: 204,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Buscar consultora",
					displayValue: "Search Consultant",
					patternType: "exact",
					priority: 205,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Cobranzas",
					displayValue: "Collections",
					patternType: "exact",
					priority: 206,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Consulta postulante",
					displayValue: "Applicant Query",
					patternType: "exact",
					priority: 207,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Data Report (reportes de campaña)",
					displayValue: "Data Report",
					patternType: "exact",
					priority: 208,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Listado socias",
					displayValue: "Partners List",
					patternType: "exact",
					priority: 209,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Login (ingreso al app)",
					displayValue: "Login",
					patternType: "exact",
					priority: 210,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Perfil consultora",
					displayValue: "Consultant Profile",
					patternType: "exact",
					priority: 211,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Perfil socia",
					displayValue: "Partner Profile",
					patternType: "exact",
					priority: 212,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Problemas de data",
					displayValue: "Data Issues",
					patternType: "exact",
					priority: 213,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Proyección de campaña",
					displayValue: "Campaign Projection",
					patternType: "exact",
					priority: 214,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Reporte Semáforo",
					displayValue: "Traffic Light Report",
					patternType: "exact",
					priority: 215,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Ruta de desarrollo",
					displayValue: "Development Path",
					patternType: "exact",
					priority: 216,
				},
				{
					ruleType: "module",
					sourceValue: "FFVV Unete",
					displayValue: "Unete",
					patternType: "exact",
					priority: 217,
				},

				// Module rules - SB2 (Somos Belcorp 2.0)
				{
					ruleType: "module",
					sourceValue: "SB2 Actualizar Matriz",
					displayValue: "Update Matrix",
					patternType: "exact",
					priority: 300,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Bonificaciones",
					displayValue: "Bonuses",
					patternType: "exact",
					priority: 301,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Cambios y devoluciones",
					displayValue: "Changes & Returns",
					patternType: "exact",
					priority: 302,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Carrito Sugerido",
					displayValue: "Suggested Cart",
					patternType: "exact",
					priority: 303,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Catálogos y Revistas",
					displayValue: "Catalogs & Magazines",
					patternType: "exact",
					priority: 304,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 ChatBot",
					displayValue: "ChatBot",
					patternType: "exact",
					priority: 305,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Descarga de Pedidos",
					displayValue: "Order Download",
					patternType: "exact",
					priority: 306,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Entrega instantanea",
					displayValue: "Instant Delivery",
					patternType: "exact",
					priority: 307,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Festivales",
					displayValue: "Festivals",
					patternType: "exact",
					priority: 308,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Gana Refiriendo",
					displayValue: "Earn by Referring",
					patternType: "exact",
					priority: 309,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Liquidaciones",
					displayValue: "Clearance",
					patternType: "exact",
					priority: 310,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Login (cuentas de usuario)",
					displayValue: "Login",
					patternType: "exact",
					priority: 311,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Material de Redes Sociales",
					displayValue: "Social Media Material",
					patternType: "exact",
					priority: 312,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Matriz/Estrategia",
					displayValue: "Matrix/Strategy",
					patternType: "exact",
					priority: 313,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Mi Tienda Online",
					displayValue: "My Online Store",
					patternType: "exact",
					priority: 314,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Multipedido",
					displayValue: "Multi-Order",
					patternType: "exact",
					priority: 315,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 New Home",
					displayValue: "New Home",
					patternType: "exact",
					priority: 316,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Oferta Final",
					displayValue: "Final Offer",
					patternType: "exact",
					priority: 317,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Ofertas Gana+",
					displayValue: "Gana+ Offers",
					patternType: "exact",
					priority: 318,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Otros",
					displayValue: "Others",
					patternType: "exact",
					priority: 319,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Pago de Contado",
					displayValue: "Cash Payment",
					patternType: "exact",
					priority: 320,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Pago en Línea",
					displayValue: "Online Payment",
					patternType: "exact",
					priority: 321,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Pase de Pedidos",
					displayValue: "Order Placement",
					patternType: "exact",
					priority: 322,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Pedidos de Campaña",
					displayValue: "Campaign Orders",
					patternType: "exact",
					priority: 323,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Productos Sugeridos",
					displayValue: "Suggested Products",
					patternType: "exact",
					priority: 324,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Programa de Nuevas",
					displayValue: "New Consultants Program",
					patternType: "exact",
					priority: 325,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Reactivación de Pedidos",
					displayValue: "Order Reactivation",
					patternType: "exact",
					priority: 326,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Reporte Pedidos Digitados",
					displayValue: "Entered Orders Report",
					patternType: "exact",
					priority: 327,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Reserva de Pedidos",
					displayValue: "Order Reservation",
					patternType: "exact",
					priority: 328,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 RxP-Tombola",
					displayValue: "RxP-Raffle",
					patternType: "exact",
					priority: 329,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 SAC/ Contenido",
					displayValue: "SAC/Content",
					patternType: "exact",
					priority: 330,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Tracking de Pedidos",
					displayValue: "Order Tracking",
					patternType: "exact",
					priority: 331,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 VaIidación Automática",
					displayValue: "Automatic Validation",
					patternType: "exact",
					priority: 332,
				},
				{
					ruleType: "module",
					sourceValue: "SB2 Zona de Todas Ofertas",
					displayValue: "All Offers Zone",
					patternType: "exact",
					priority: 333,
				},

				// Module rules - Unete
				{
					ruleType: "module",
					sourceValue: "Unete Actualizar Información",
					displayValue: "Actualizar Información",
					patternType: "exact",
					priority: 400,
				},
				{
					ruleType: "module",
					sourceValue: "Unete Aprobación FFVV",
					displayValue: "Aprobación FFVV",
					patternType: "exact",
					priority: 401,
				},
				{
					ruleType: "module",
					sourceValue: "Unete Belcorp Validación",
					displayValue: "Belcorp Validación",
					patternType: "exact",
					priority: 402,
				},
				{
					ruleType: "module",
					sourceValue: "Unete Buro",
					displayValue: "Buro",
					patternType: "exact",
					priority: 403,
				},
				{
					ruleType: "module",
					sourceValue: "Unete Cambio de Fuente Ingreso",
					displayValue: "Cambio de Fuente Ingreso",
					patternType: "exact",
					priority: 404,
				},
				{
					ruleType: "module",
					sourceValue: "Unete Carga de documentos",
					displayValue: "Carga de documentos",
					patternType: "exact",
					priority: 405,
				},
				{
					ruleType: "module",
					sourceValue: "Unete Generación de código",
					displayValue: "Generación de código",
					patternType: "exact",
					priority: 406,
				},
				{
					ruleType: "module",
					sourceValue: "Unete Gestiona Postulante",
					displayValue: "Gestiona Postulante",
					patternType: "exact",
					priority: 407,
				},
				{
					ruleType: "module",
					sourceValue: "Unete Primer Pedido Aprobado",
					displayValue: "Primer Pedido Aprobado",
					patternType: "exact",
					priority: 408,
				},
				{
					ruleType: "module",
					sourceValue: "Unete Sesion Modo Prueba",
					displayValue: "Sesion Modo Prueba",
					patternType: "exact",
					priority: 409,
				},
				{
					ruleType: "module",
					sourceValue: "Unete Unete Validación",
					displayValue: "Unete Validación",
					patternType: "exact",
					priority: 410,
				},
				{
					ruleType: "module",
					sourceValue: "Unete Validación Identidad",
					displayValue: "Validación Identidad",
					patternType: "exact",
					priority: 411,
				},
				{
					ruleType: "module",
					sourceValue: "Unete Validación Pin",
					displayValue: "Validación Pin",
					patternType: "exact",
					priority: 412,
				},
				{
					ruleType: "module",
					sourceValue: "Unete Zonificación",
					displayValue: "Zonificación",
					patternType: "exact",
					priority: 413,
				},
			];

			const insertDisplayRuleStmt = db.prepare(`
				INSERT INTO ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES}
				(rule_type, source_value, display_value, pattern_type, priority, active, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`);

			try {
				defaultDisplayRules.forEach((rule) => {
					insertDisplayRuleStmt.run([
						rule.ruleType,
						rule.sourceValue,
						rule.displayValue,
						rule.patternType,
						rule.priority,
					]);
				});
			} finally {
				insertDisplayRuleStmt.free();
			}

			// ===== TABLE 11: WAR_ROOM_RECORDS =====
			db.run(`
				CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.WAR_ROOM_RECORDS} (
					application TEXT NOT NULL,
					date TEXT NOT NULL,
					incidentId TEXT PRIMARY KEY,
					incidentIdLink TEXT,
					summary TEXT NOT NULL,
					initialPriority TEXT NOT NULL,
					startTime TEXT NOT NULL,
					durationMinutes INTEGER NOT NULL,
					endTime TEXT NOT NULL,
					participants INTEGER NOT NULL,
					status TEXT NOT NULL,
					priorityChanged TEXT NOT NULL,
					resolutionTeamChanged TEXT NOT NULL,
					notes TEXT NOT NULL,
					rcaStatus TEXT,
					urlRca TEXT,
					createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
				)
			`);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_war_room_application ON ${TABLE_NAMES.WAR_ROOM_RECORDS}(application)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_war_room_date ON ${TABLE_NAMES.WAR_ROOM_RECORDS}(date)`
			);
			db.run(
				`CREATE INDEX IF NOT EXISTS idx_war_room_status ON ${TABLE_NAMES.WAR_ROOM_RECORDS}(status)`
			);

			console.log(
				"✅ Database initialized with all tables and default data"
			);
		},
		down: (db: Database) => {
			db.run(`DROP TABLE IF EXISTS ${TABLE_NAMES.TAG}`);
			db.run(`DROP TABLE IF EXISTS ${TABLE_NAMES.FOR_TAGGING_DATA}`);
			db.run(
				`DROP TABLE IF EXISTS ${TABLE_NAMES.PARENT_CHILD_RELATIONSHIPS}`
			);
			db.run(
				`DROP TABLE IF EXISTS ${TABLE_NAMES.CORRECTIVE_MAINTENANCE_RECORDS}`
			);
			db.run(
				`DROP TABLE IF EXISTS ${TABLE_NAMES.MONTHLY_REPORT_RECORDS}`
			);
			db.run(`DROP TABLE IF EXISTS ${TABLE_NAMES.DATE_RANGE_CONFIGS}`);
			db.run(`DROP TABLE IF EXISTS ${TABLE_NAMES.DATE_RANGE_SETTINGS}`);
			db.run(`DROP TABLE IF EXISTS ${TABLE_NAMES.BUSINESS_UNIT_RULES}`);
			db.run(
				`DROP TABLE IF EXISTS ${TABLE_NAMES.MONTHLY_REPORT_STATUS_MAPPING_RULES}`
			);
			db.run(
				`DROP TABLE IF EXISTS ${TABLE_NAMES.MODULE_CATEGORIZATION_DISPLAY_RULES}`
			);
			db.run(`DROP TABLE IF EXISTS ${TABLE_NAMES.WAR_ROOM_RECORDS}`);
		},
	},
	{
		version: "003",
		description: "Insert mock data for development",
		dependencies: ["001"],
		up: (db: Database) => {
			// Check if data already exists to avoid duplicates
			const result = db.exec(
				`SELECT COUNT(*) as count FROM ${TABLE_NAMES.TAG}`
			);
			const count = result[0]?.values[0]?.[0] as number;

			if (count > 0) {
				console.log("Mock data already exists, skipping insertion");
				return;
			}

			// Insert mock data for development/testing
			const mockData = [
				{
					createdTime: "2024-01-15T10:30:00Z",
					requestId: "REQ-001",
					requestIdLink: "https://jira.company.com/browse/REQ-001",
					informacionAdicional: "Error en módulo de facturación",
					modulo: "Facturación",
					problemId: "PROB-001",
					problemIdLink: "https://jira.company.com/browse/PROB-001",
					linkedRequestIdValue: "REQ-001",
					linkedRequestIdLink:
						"https://jira.company.com/browse/REQ-001",
					jira: "JIRA-12345",
					categorizacion: "Bug Critical",
					technician: "Juan Pérez",
				},
				{
					createdTime: "2024-01-16T14:20:00Z",
					requestId: "REQ-002",
					requestIdLink: "https://jira.company.com/browse/REQ-002",
					informacionAdicional: "Mejora en performance del dashboard",
					modulo: "Dashboard",
					problemId: "PROB-002",
					problemIdLink: "https://jira.company.com/browse/PROB-002",
					linkedRequestIdValue: "REQ-002",
					linkedRequestIdLink:
						"https://jira.company.com/browse/REQ-002",
					jira: "JIRA-12346",
					categorizacion: "Enhancement",
					technician: "María García",
				},
				{
					createdTime: "2024-01-17T09:15:00Z",
					requestId: "REQ-003",
					requestIdLink: "https://jira.company.com/browse/REQ-003",
					informacionAdicional:
						"Integración con nuevo sistema de pagos",
					modulo: "Pagos",
					problemId: "PROB-003",
					problemIdLink: "https://jira.company.com/browse/PROB-003",
					linkedRequestIdValue: "REQ-003",
					linkedRequestIdLink:
						"https://jira.company.com/browse/REQ-003",
					jira: "JIRA-12347",
					categorizacion: "Feature Request",
					technician: "Carlos Rodriguez",
				},
			];

			// Insert mock data using prepared statement for better performance
			const insertStmt = db.prepare(`
				INSERT INTO ${TABLE_NAMES.TAG} (
					requestId, createdTime, requestIdLink, informacionAdicional,
					modulo, problemId, problemIdLink, linkedRequestIdValue,
					linkedRequestIdLink, jira, categorizacion, technician, processedAt
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
			`);

			try {
				mockData.forEach((data) => {
					insertStmt.run([
						data.requestId,
						data.createdTime,
						data.requestIdLink,
						data.informacionAdicional,
						data.modulo,
						data.problemId,
						data.problemIdLink,
						data.linkedRequestIdValue,
						data.linkedRequestIdLink,
						data.jira,
						data.categorizacion,
						data.technician,
					]);
				});
			} finally {
				insertStmt.free();
			}
		},
		down: (db: Database) => {
			db.run(`DELETE FROM ${TABLE_NAMES.TAG}`);
		},
	},
];
// Add more migrations here as your schema evolves

// Generate checksums for all migrations
migrations.forEach((migration) => {
	migration.checksum = generateChecksum(migration);
});

/**
 * Validate migration dependencies
 */
function validateDependencies(migrations: Migration[]): void {
	const versions = new Set(migrations.map((m) => m.version));

	for (const migration of migrations) {
		if (migration.dependencies) {
			for (const dep of migration.dependencies) {
				if (!versions.has(dep)) {
					throw new MigrationError(
						`Migration ${migration.version} depends on non-existent migration ${dep}`,
						migration.version,
						"up"
					);
				}
			}
		}
	}
}

/**
 * Sort migrations in dependency order
 */
function sortMigrationsByDependencies(migrations: Migration[]): Migration[] {
	const sorted: Migration[] = [];
	const processing = new Set<string>();
	const processed = new Set<string>();

	function visit(migration: Migration): void {
		if (processed.has(migration.version)) {
			return;
		}

		if (processing.has(migration.version)) {
			throw new MigrationError(
				`Circular dependency detected involving migration ${migration.version}`,
				migration.version,
				"up"
			);
		}

		processing.add(migration.version);

		// Process dependencies first
		if (migration.dependencies) {
			for (const depVersion of migration.dependencies) {
				const depMigration = migrations.find(
					(m) => m.version === depVersion
				);
				if (depMigration) {
					visit(depMigration);
				}
			}
		}

		processing.delete(migration.version);
		processed.add(migration.version);
		sorted.push(migration);
	}

	for (const migration of migrations) {
		visit(migration);
	}

	return sorted;
}

/**
 * Initialize migrations table with enhanced schema
 */
function initializeMigrationsTable(db: Database): void {
	db.run(`
		CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.MIGRATIONS} (
			version TEXT PRIMARY KEY,
			description TEXT NOT NULL,
			applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
			checksum TEXT,
			execution_time INTEGER DEFAULT 0
		)
	`);
}

/**
 * Get applied migrations with full state information
 * Handles both old and new schema formats for backward compatibility
 */
function getAppliedMigrations(db: Database): MigrationState[] {
	try {
		// First, try to get the table schema to see what columns exist
		const schemaResult = db.exec(`
			PRAGMA table_info(${TABLE_NAMES.MIGRATIONS})
		`);

		const hasDescriptionColumn = schemaResult[0]?.values.some(
			(row) => row[1] === "description"
		);
		const hasChecksumColumn = schemaResult[0]?.values.some(
			(row) => row[1] === "checksum"
		);

		let query: string;
		if (hasDescriptionColumn && hasChecksumColumn) {
			// New schema with all columns
			query = `
				SELECT version, description, applied_at, checksum
				FROM ${TABLE_NAMES.MIGRATIONS}
				ORDER BY version
			`;
		} else if (hasDescriptionColumn) {
			// Has description but no checksum
			query = `
				SELECT version, description, applied_at, NULL as checksum
				FROM ${TABLE_NAMES.MIGRATIONS}
				ORDER BY version
			`;
		} else {
			// Old schema - only version and applied_at
			query = `
				SELECT version, 'Legacy Migration' as description, applied_at, NULL as checksum
				FROM ${TABLE_NAMES.MIGRATIONS}
				ORDER BY version
			`;
		}

		const result = db.exec(query);

		if (!result[0]) {
			return [];
		}

		return result[0].values.map((row) => ({
			version: row[0] as string,
			description: row[1] as string,
			applied_at: row[2] as string,
			checksum: row[3] as string | null,
		}));
	} catch (error) {
		// If table doesn't exist or any other error, return empty array
		console.log(
			"No migrations table found or error reading migrations:",
			error
		);
		return [];
	}
}

/**
 * Validate migration integrity using checksums
 */
function validateMigrationIntegrity(
	migration: Migration,
	appliedMigration: MigrationState
): void {
	if (
		appliedMigration.checksum &&
		migration.checksum !== appliedMigration.checksum
	) {
		throw new MigrationError(
			`Migration ${migration.version} has been modified since it was applied. ` +
				`Expected checksum: ${appliedMigration.checksum}, got: ${migration.checksum}`,
			migration.version,
			"up"
		);
	}
}

/**
 * Apply all pending migrations with enhanced error handling and validation
 */
export function runMigrations(db: Database): MigrationResult[] {
	const results: MigrationResult[] = [];

	try {
		// Validate migration structure
		validateDependencies(migrations);

		// Initialize migrations table
		initializeMigrationsTable(db);

		// Get applied migrations
		const appliedMigrations = getAppliedMigrations(db);
		const appliedVersions = new Set(
			appliedMigrations.map((m) => m.version)
		);

		// Sort migrations by dependencies
		const sortedMigrations = sortMigrationsByDependencies(migrations);

		// Validate integrity of applied migrations
		for (const migration of sortedMigrations) {
			const appliedMigration = appliedMigrations.find(
				(m) => m.version === migration.version
			);
			if (appliedMigration) {
				try {
					validateMigrationIntegrity(migration, appliedMigration);
				} catch (error) {
					console.warn(
						`Migration integrity check failed: ${
							error instanceof Error
								? error.message
								: String(error)
						}`
					);
				}
			}
		}

		// Apply pending migrations
		for (const migration of sortedMigrations) {
			if (!appliedVersions.has(migration.version)) {
				const startTime = Date.now();
				console.log(
					`Applying migration ${migration.version}: ${migration.description}`
				);

				try {
					// Execute migration
					migration.up(db);

					const executionTime = Date.now() - startTime;

					// Record successful migration
					db.run(
						`INSERT INTO ${TABLE_NAMES.MIGRATIONS} (version, description, checksum, execution_time)
						 VALUES (?, ?, ?, ?)`,
						[
							migration.version,
							migration.description,
							migration.checksum || null,
							executionTime,
						]
					);

					results.push({
						version: migration.version,
						success: true,
						executionTime,
					});

					console.log(
						`Migration ${migration.version} applied successfully (${executionTime}ms)`
					);
				} catch (error) {
					const migrationError = new MigrationError(
						`Failed to apply migration ${migration.version}: ${
							error instanceof Error
								? error.message
								: String(error)
						}`,
						migration.version,
						"up",
						error instanceof Error
							? error
							: new Error(String(error))
					);

					results.push({
						version: migration.version,
						success: false,
						error: migrationError,
						executionTime: Date.now() - startTime,
					});

					console.error(
						`Migration ${migration.version} failed:`,
						migrationError
					);
					throw migrationError;
				}
			}
		}

		return results;
	} catch (error) {
		console.error("Migration process failed:", error);
		throw error;
	}
}

/**
 * Rollback migrations with enhanced validation and dependency checking
 */
export function rollbackMigrations(
	db: Database,
	targetVersion?: string
): MigrationResult[] {
	const results: MigrationResult[] = [];

	try {
		const appliedMigrations = getAppliedMigrations(db);
		const sortedAppliedVersions = appliedMigrations
			.map((m) => m.version)
			.sort()
			.reverse(); // Rollback in reverse order

		for (const version of sortedAppliedVersions) {
			if (targetVersion && version <= targetVersion) {
				break;
			}

			const migration = migrations.find((m) => m.version === version);
			if (migration?.down) {
				const startTime = Date.now();
				console.log(
					`Rolling back migration ${version}: ${migration.description}`
				);

				try {
					migration.down(db);

					const executionTime = Date.now() - startTime;

					// Remove migration record
					db.run(
						`DELETE FROM ${TABLE_NAMES.MIGRATIONS} WHERE version = ?`,
						[version]
					);

					results.push({
						version,
						success: true,
						executionTime,
					});

					console.log(
						`Migration ${version} rolled back successfully (${executionTime}ms)`
					);
				} catch (error) {
					const migrationError = new MigrationError(
						`Failed to rollback migration ${version}: ${
							error instanceof Error
								? error.message
								: String(error)
						}`,
						version,
						"down",
						error instanceof Error
							? error
							: new Error(String(error))
					);

					results.push({
						version,
						success: false,
						error: migrationError,
						executionTime: Date.now() - startTime,
					});

					console.error(
						`Rollback of migration ${version} failed:`,
						migrationError
					);
					throw migrationError;
				}
			} else {
				console.warn(
					`Migration ${version} does not have a rollback function`
				);
			}
		}

		return results;
	} catch (error) {
		console.error("Rollback process failed:", error);
		throw error;
	}
}

/**
 * Get migration status information
 */
export function getMigrationStatus(db: Database): {
	availableMigrations: Migration[];
	appliedMigrations: MigrationState[];
	pendingMigrations: Migration[];
} {
	try {
		initializeMigrationsTable(db);
		const appliedMigrations = getAppliedMigrations(db);
		const appliedVersions = new Set(
			appliedMigrations.map((m) => m.version)
		);

		const pendingMigrations = migrations.filter(
			(m) => !appliedVersions.has(m.version)
		);

		return {
			availableMigrations: migrations,
			appliedMigrations,
			pendingMigrations,
		};
	} catch (error) {
		console.error("Failed to get migration status:", error);
		throw error;
	}
}
