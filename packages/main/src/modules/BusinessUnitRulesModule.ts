import { ipcMain } from "electron";
import type {
	BusinessUnitService,
	CreateBusinessUnitRuleData,
	UpdateBusinessUnitRuleData
} from "@app/core";
import { SqlJsBusinessUnitRuleRepository } from "../repositories/SqlJsBusinessUnitRuleRepository.js";
import { ServiceRegistry } from "../services/ServiceRegistry.js";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";

export interface BusinessUnitRulesModuleContext {
	businessUnitService: BusinessUnitService;
}

export class BusinessUnitRulesModule implements AppModule {
	private businessUnitService: BusinessUnitService | null = null;

	async enable(_context: ModuleContext): Promise<void> {
		console.log("🔧 Initializing Business Unit Rules Module");

		// Create repository and service
		const repository = new SqlJsBusinessUnitRuleRepository();

		// Import service dynamically to avoid circular dependency issues
		const { BusinessUnitService } = await import("@app/core");
		this.businessUnitService = new BusinessUnitService(repository);

		// Register service in global registry for use by other modules
		ServiceRegistry.registerBusinessUnitService(this.businessUnitService);

		console.log("✅ Business Unit Service initialized and registered");

		// IPC Handlers for Business Unit Rules Management

		/**
		 * Get all business unit rules
		 */
		ipcMain.handle("business-unit-rules:get-all", async () => {
			try {
				if (!this.businessUnitService) {
					throw new Error("Business unit service not initialized");
				}
				const rules = await this.businessUnitService.getAllRules();
				return { success: true, data: rules.map(rule => rule.toJSON()) };
			} catch (error) {
				console.error("Failed to get all business unit rules:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Get active business unit rules
		 */
		ipcMain.handle("business-unit-rules:get-active", async () => {
			try {
				if (!this.businessUnitService) {
					throw new Error("Business unit service not initialized");
				}
				const rules = await this.businessUnitService.getActiveRules();
				return { success: true, data: rules.map(rule => rule.toJSON()) };
			} catch (error) {
				console.error("Failed to get active business unit rules:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Get business unit rule by ID
		 */
		ipcMain.handle("business-unit-rules:get-by-id", async (_, id: number) => {
			try {
				if (!this.businessUnitService) {
					throw new Error("Business unit service not initialized");
				}
				const rule = await this.businessUnitService.getRuleById(id);
				return {
					success: true,
					data: rule ? rule.toJSON() : null
				};
			} catch (error) {
				console.error(`Failed to get business unit rule ${id}:`, error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Create new business unit rule
		 */
		ipcMain.handle("business-unit-rules:create", async (_, data: CreateBusinessUnitRuleData) => {
			try {
				if (!this.businessUnitService) {
					throw new Error("Business unit service not initialized");
				}
				const rule = await this.businessUnitService.createRule(data);
				return { success: true, data: rule.toJSON() };
			} catch (error) {
				console.error("Failed to create business unit rule:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Update business unit rule
		 */
		ipcMain.handle("business-unit-rules:update", async (_, id: number, updates: UpdateBusinessUnitRuleData) => {
			try {
				if (!this.businessUnitService) {
					throw new Error("Business unit service not initialized");
				}
				const rule = await this.businessUnitService.updateRule(id, updates);
				return { success: true, data: rule.toJSON() };
			} catch (error) {
				console.error(`Failed to update business unit rule ${id}:`, error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Delete business unit rule
		 */
		ipcMain.handle("business-unit-rules:delete", async (_, id: number) => {
			try {
				if (!this.businessUnitService) {
					throw new Error("Business unit service not initialized");
				}
				await this.businessUnitService.deleteRule(id);
				return { success: true };
			} catch (error) {
				console.error(`Failed to delete business unit rule ${id}:`, error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Detect business unit from application text
		 */
		ipcMain.handle("business-unit-rules:detect", async (_, applicationText: string) => {
			try {
				if (!this.businessUnitService) {
					throw new Error("Business unit service not initialized");
				}
				const result = await this.businessUnitService.detectBusinessUnitWithDetails(applicationText);
				return {
					success: true,
					data: {
						...result,
						matchedRule: result.matchedRule?.toJSON()
					}
				};
			} catch (error) {
				console.error("Failed to detect business unit:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Test pattern against text
		 */
		ipcMain.handle("business-unit-rules:test-pattern", async (_, pattern: string, text: string, patternType: 'contains' | 'regex' | 'exact') => {
			try {
				if (!this.businessUnitService) {
					throw new Error("Business unit service not initialized");
				}
				const matches = this.businessUnitService.testPattern(pattern, text, patternType);
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
		ipcMain.handle("business-unit-rules:reorder", async (_, ruleOrders: Array<{ id: number; priority: number }>) => {
			try {
				if (!this.businessUnitService) {
					throw new Error("Business unit service not initialized");
				}
				const rules = await this.businessUnitService.reorderRules(ruleOrders);
				return { success: true, data: rules.map(rule => rule.toJSON()) };
			} catch (error) {
				console.error("Failed to reorder business unit rules:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Get business unit statistics
		 */
		ipcMain.handle("business-unit-rules:get-statistics", async () => {
			try {
				if (!this.businessUnitService) {
					throw new Error("Business unit service not initialized");
				}
				const stats = await this.businessUnitService.getStatistics();
				return { success: true, data: stats };
			} catch (error) {
				console.error("Failed to get business unit statistics:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		console.log("✅ Business Unit Rules Module initialized");
	}
}

export function createBusinessUnitRulesModule(): BusinessUnitRulesModule {
	return new BusinessUnitRulesModule();
}