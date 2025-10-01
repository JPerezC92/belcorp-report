import type { BusinessUnitService, MonthlyReportStatusMappingService } from "@app/core";

/**
 * Global service registry for sharing services between modules
 */
class ServiceRegistryImpl {
	private businessUnitService: BusinessUnitService | null = null;
	private monthlyReportStatusMappingService: MonthlyReportStatusMappingService | null = null;

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
}

// Export singleton instance
export const ServiceRegistry = new ServiceRegistryImpl();