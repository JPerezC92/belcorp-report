import { ipcMain } from "electron";
import type {
	MonthlyReportStatusMappingService,
	CreateMonthlyReportStatusMappingRuleData,
	UpdateMonthlyReportStatusMappingRuleData
} from "@app/core";
import { SqlJsMonthlyReportStatusMappingRuleRepository } from "../repositories/SqlJsMonthlyReportStatusMappingRuleRepository.js";
import { ServiceRegistry } from "../services/ServiceRegistry.js";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";

export class MonthlyReportStatusMappingModule implements AppModule {
	private statusMappingService: MonthlyReportStatusMappingService | null = null;

	async enable(_context: ModuleContext): Promise<void> {
		console.log("🔧 Initializing Monthly Report Status Mapping Module");

		// Create repository and service
		const repository = new SqlJsMonthlyReportStatusMappingRuleRepository();

		// Import service dynamically to avoid circular dependency issues
		const { MonthlyReportStatusMappingService } = await import("@app/core");
		this.statusMappingService = new MonthlyReportStatusMappingService(repository);

		// Register service in global registry for use by other modules
		ServiceRegistry.registerMonthlyReportStatusMappingService(this.statusMappingService);

		console.log("✅ Monthly Report Status Mapping Service initialized and registered");

		// IPC Handlers for Monthly Report Status Mapping Rules Management

		/**
		 * Get all status mapping rules
		 */
		ipcMain.handle("monthly-report-status-mapping:get-all", async () => {
			try {
				if (!this.statusMappingService) {
					throw new Error("Monthly report status mapping service not initialized");
				}
				const rules = await this.statusMappingService.getAllRules();
				return { success: true, data: rules.map(rule => rule.toJSON()) };
			} catch (error) {
				console.error("Failed to get all monthly report status mapping rules:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Get active status mapping rules
		 */
		ipcMain.handle("monthly-report-status-mapping:get-active", async () => {
			try {
				if (!this.statusMappingService) {
					throw new Error("Monthly report status mapping service not initialized");
				}
				const rules = await this.statusMappingService.getActiveRules();
				return { success: true, data: rules.map(rule => rule.toJSON()) };
			} catch (error) {
				console.error("Failed to get active monthly report status mapping rules:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Get status mapping rule by ID
		 */
		ipcMain.handle("monthly-report-status-mapping:get-by-id", async (_, id: number) => {
			try {
				if (!this.statusMappingService) {
					throw new Error("Monthly report status mapping service not initialized");
				}
				const rule = await this.statusMappingService.getRuleById(id);
				return {
					success: true,
					data: rule ? rule.toJSON() : null
				};
			} catch (error) {
				console.error(`Failed to get monthly report status mapping rule ${id}:`, error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Create new status mapping rule
		 */
		ipcMain.handle("monthly-report-status-mapping:create", async (_, data: CreateMonthlyReportStatusMappingRuleData) => {
			try {
				if (!this.statusMappingService) {
					throw new Error("Monthly report status mapping service not initialized");
				}
				const rule = await this.statusMappingService.createRule(data);
				return { success: true, data: rule.toJSON() };
			} catch (error) {
				console.error("Failed to create monthly report status mapping rule:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Update status mapping rule
		 */
		ipcMain.handle("monthly-report-status-mapping:update", async (_, id: number, updates: UpdateMonthlyReportStatusMappingRuleData) => {
			try {
				if (!this.statusMappingService) {
					throw new Error("Monthly report status mapping service not initialized");
				}
				const rule = await this.statusMappingService.updateRule(id, updates);
				return { success: true, data: rule.toJSON() };
			} catch (error) {
				console.error(`Failed to update monthly report status mapping rule ${id}:`, error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Delete status mapping rule
		 */
		ipcMain.handle("monthly-report-status-mapping:delete", async (_, id: number) => {
			try {
				if (!this.statusMappingService) {
					throw new Error("Monthly report status mapping service not initialized");
				}
				await this.statusMappingService.deleteRule(id);
				return { success: true };
			} catch (error) {
				console.error(`Failed to delete monthly report status mapping rule ${id}:`, error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Map request status using active rules
		 */
		ipcMain.handle("monthly-report-status-mapping:map-status", async (_, requestStatus: string) => {
			try {
				if (!this.statusMappingService) {
					throw new Error("Monthly report status mapping service not initialized");
				}
				const mappedStatus = await this.statusMappingService.mapStatus(requestStatus);
				return { success: true, data: mappedStatus };
			} catch (error) {
				console.error("Failed to map request status:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Test pattern against status text
		 */
		ipcMain.handle("monthly-report-status-mapping:test-pattern", async (_, pattern: string, text: string, patternType: 'contains' | 'regex' | 'exact') => {
			try {
				if (!this.statusMappingService) {
					throw new Error("Monthly report status mapping service not initialized");
				}
				const matches = this.statusMappingService.testPattern(pattern, text, patternType);
				return { success: true, data: matches };
			} catch (error) {
				console.error("Failed to test pattern:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Reorder rules by priority
		 */
		ipcMain.handle("monthly-report-status-mapping:reorder", async (_, ruleOrders: Array<{ id: number; priority: number }>) => {
			try {
				if (!this.statusMappingService) {
					throw new Error("Monthly report status mapping service not initialized");
				}
				const rules = await this.statusMappingService.reorderRules(ruleOrders);
				return { success: true, data: rules.map(rule => rule.toJSON()) };
			} catch (error) {
				console.error("Failed to reorder monthly report status mapping rules:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Get status mapping statistics
		 */
		ipcMain.handle("monthly-report-status-mapping:get-statistics", async () => {
			try {
				if (!this.statusMappingService) {
					throw new Error("Monthly report status mapping service not initialized");
				}
				const stats = await this.statusMappingService.getStatistics();
				return { success: true, data: stats };
			} catch (error) {
				console.error("Failed to get monthly report status mapping statistics:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		console.log("✅ Monthly Report Status Mapping Module initialized");
	}
}

export function createMonthlyReportStatusMappingModule(): MonthlyReportStatusMappingModule {
	return new MonthlyReportStatusMappingModule();
}
