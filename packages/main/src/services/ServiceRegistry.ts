import type { BusinessUnitService, MonthlyReportStatusMappingService } from "@app/core";
import type { LevelMappingService } from "../modules/monthly-report/LevelMappingService.js";

/**
 * Global service registry for sharing services between modules
 */
class ServiceRegistryImpl {
	private businessUnitService: BusinessUnitService | null = null;
	private monthlyReportStatusMappingService: MonthlyReportStatusMappingService | null = null;
	private levelMappingService: LevelMappingService | null = null;

	registerBusinessUnitService(service: BusinessUnitService): void {
		this.businessUnitService = service;
	}

	getBusinessUnitService(): BusinessUnitService | null {
		return this.businessUnitService;
	}

	registerMonthlyReportStatusMappingService(service: MonthlyReportStatusMappingService): void {
		this.monthlyReportStatusMappingService = service;
	}

	getMonthlyReportStatusMappingService(): MonthlyReportStatusMappingService | null {
		return this.monthlyReportStatusMappingService;
	}

	registerLevelMappingService(service: LevelMappingService): void {
		this.levelMappingService = service;
	}

	getLevelMappingService(): LevelMappingService | null {
		return this.levelMappingService;
	}
}

// Export singleton instance
export const ServiceRegistry = new ServiceRegistryImpl();