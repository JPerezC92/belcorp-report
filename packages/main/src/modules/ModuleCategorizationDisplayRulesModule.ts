import { ipcMain } from "electron";
import { SqlJsModuleCategorizationDisplayRuleRepository } from "../repositories/SqlJsModuleCategorizationDisplayRuleRepository.js";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import type { RuleType, PatternType } from "../repositories/SqlJsModuleCategorizationDisplayRuleRepository.js";

export class ModuleCategorizationDisplayRulesModule implements AppModule {
	private repository: SqlJsModuleCategorizationDisplayRuleRepository | null = null;

	async enable(_context: ModuleContext): Promise<void> {
		console.log("🔧 Initializing Module/Categorization Display Rules Module");

		// Create repository
		this.repository = new SqlJsModuleCategorizationDisplayRuleRepository();

		console.log("✅ Module/Categorization Display Rules Repository initialized");

		// IPC Handlers for Module/Categorization Display Rules Management

		/**
		 * Get all display rules
		 */
		ipcMain.handle("module-categorization-display-rules:get-all", async () => {
			try {
				if (!this.repository) {
					throw new Error("Repository not initialized");
				}
				const rules = await this.repository.findAll();
				return { success: true, data: rules };
			} catch (error) {
				console.error("Failed to get all display rules:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Get active display rules
		 */
		ipcMain.handle("module-categorization-display-rules:get-active", async () => {
			try {
				if (!this.repository) {
					throw new Error("Repository not initialized");
				}
				const rules = await this.repository.findActive();
				return { success: true, data: rules };
			} catch (error) {
				console.error("Failed to get active display rules:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Get display rule by ID
		 */
		ipcMain.handle("module-categorization-display-rules:get-by-id", async (_, id: number) => {
			try {
				if (!this.repository) {
					throw new Error("Repository not initialized");
				}
				const rule = await this.repository.findById(id);
				return {
					success: true,
					data: rule
				};
			} catch (error) {
				console.error(`Failed to get display rule ${id}:`, error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Create new display rule
		 */
		ipcMain.handle("module-categorization-display-rules:create", async (_, data: {
			ruleType: RuleType;
			sourceValue: string;
			displayValue: string;
			patternType: PatternType;
			priority: number;
			active: boolean;
		}) => {
			try {
				if (!this.repository) {
					throw new Error("Repository not initialized");
				}
				const rule = await this.repository.create(data);
				return { success: true, data: rule };
			} catch (error) {
				console.error("Failed to create display rule:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Update display rule
		 */
		ipcMain.handle("module-categorization-display-rules:update", async (_, id: number, updates: {
			ruleType?: RuleType;
			sourceValue?: string;
			displayValue?: string;
			patternType?: PatternType;
			priority?: number;
			active?: boolean;
		}) => {
			try {
				if (!this.repository) {
					throw new Error("Repository not initialized");
				}
				const rule = await this.repository.update(id, updates);
				return { success: true, data: rule };
			} catch (error) {
				console.error(`Failed to update display rule ${id}:`, error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Delete display rule
		 */
		ipcMain.handle("module-categorization-display-rules:delete", async (_, id: number) => {
			try {
				if (!this.repository) {
					throw new Error("Repository not initialized");
				}
				await this.repository.delete(id);
				return { success: true };
			} catch (error) {
				console.error(`Failed to delete display rule ${id}:`, error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		/**
		 * Test pattern against text
		 */
		ipcMain.handle("module-categorization-display-rules:test-pattern", async (_, pattern: string, text: string, patternType: PatternType) => {
			try {
				if (!this.repository) {
					throw new Error("Repository not initialized");
				}
				const matches = this.repository.testPattern(pattern, text, patternType);
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
		ipcMain.handle("module-categorization-display-rules:reorder", async (_, ruleOrders: Array<{ id: number; priority: number }>) => {
			try {
				if (!this.repository) {
					throw new Error("Repository not initialized");
				}
				// Update each rule's priority
				const updatedRules = [];
				for (const { id, priority } of ruleOrders) {
					const rule = await this.repository.update(id, { priority });
					updatedRules.push(rule);
				}
				return { success: true, data: updatedRules };
			} catch (error) {
				console.error("Failed to reorder display rules:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		});

		console.log("✅ Module/Categorization Display Rules Module initialized");
	}
}

export function createModuleCategorizationDisplayRulesModule(): ModuleCategorizationDisplayRulesModule {
	return new ModuleCategorizationDisplayRulesModule();
}
