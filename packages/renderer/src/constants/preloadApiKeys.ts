// Centralized keys for accessing preload-exposed APIs via window
// Use this object to avoid typos and keep all btoa keys in sync with preload exports

export const preloadApiKeys = {
	getAllTags: btoa("getAllTags") as keyof Window,
	parseTagReport: btoa("parseTagReport") as keyof Window,
	openExternal: btoa("openExternal") as keyof Window,
	send: btoa("send") as keyof Window,
	sha256sum: btoa("sha256sum") as keyof Window,
	versions: btoa("versions") as keyof Window,
	parseForTaggingDataExcel: btoa("parseForTaggingDataExcel") as keyof Window,
	parseAndSaveForTaggingDataExcel: btoa(
		"parseAndSaveForTaggingDataExcel"
	) as keyof Window,
	getAllForTaggingData: btoa("getAllForTaggingData") as keyof Window,
	getEnrichedForTaggingData: btoa(
		"getEnrichedForTaggingData"
	) as keyof Window,
	parseParentChildExcel: btoa("parseParentChildExcel") as keyof Window,
	getAllParentChildRelationships: btoa(
		"getAllParentChildRelationships"
	) as keyof Window,
	getAggregatedParentChildRelationships: btoa(
		"getAggregatedParentChildRelationships"
	) as keyof Window,
	parseCorrectiveMaintenanceExcel: btoa(
		"parseCorrectiveMaintenanceExcel"
	) as keyof Window,
	getAllCorrectiveMaintenanceRecords: btoa(
		"getAllCorrectiveMaintenanceRecords"
	) as keyof Window,
	getCorrectiveMaintenanceRecordsByFilters: btoa(
		"getCorrectiveMaintenanceRecordsByFilters"
	) as keyof Window,
	getDistinctRequestStatuses: btoa(
		"getDistinctRequestStatuses"
	) as keyof Window,
	getDistinctMonthlyRequestStatusReporte: btoa(
		"getDistinctMonthlyRequestStatusReporte"
	) as keyof Window,
	copyTextToClipboard: btoa("copyTextToClipboard") as keyof Window,
	copyHtmlToClipboard: btoa("copyHtmlToClipboard") as keyof Window,
	translateText: btoa("translateText") as keyof Window,
	translateAllSubjects: btoa("translateAllSubjects") as keyof Window,
	parseMonthlyReport: btoa("parseMonthlyReport") as keyof Window,
	getAllMonthlyReportRecords: btoa(
		"getAllMonthlyReportRecords"
	) as keyof Window,
	getMonthlyReportRecordsByBusinessUnit: btoa(
		"getMonthlyReportRecordsByBusinessUnit"
	) as keyof Window,
	getMonthlyReportRecordsByRequestStatus: btoa(
		"getMonthlyReportRecordsByRequestStatus"
	) as keyof Window,
	getMonthlyReportRecordsByDateRange: btoa(
		"getMonthlyReportRecordsByDateRange"
	) as keyof Window,
	getMonthlyReportRecordsByMonth: btoa(
		"getMonthlyReportRecordsByMonth"
	) as keyof Window,
	getMonthlyReportRecordsByQuarter: btoa(
		"getMonthlyReportRecordsByQuarter"
	) as keyof Window,
	updateMonthlyReportRecordStatus: btoa(
		"updateMonthlyReportRecordStatus"
	) as keyof Window,
	updateMonthlyReportEnlacesCounts: btoa(
		"updateMonthlyReportEnlacesCounts"
	) as keyof Window,
	findMonthlyReportRecordByRequestId: btoa(
		"findMonthlyReportRecordByRequestId"
	) as keyof Window,
	dropAllMonthlyReportRecords: btoa(
		"dropAllMonthlyReportRecords"
	) as keyof Window,
	getSemanalDateRange: btoa("getSemanalDateRange") as keyof Window,
	saveSemanalDateRange: btoa("saveSemanalDateRange") as keyof Window,
	getDefaultSemanalDateRange: btoa("getDefaultSemanalDateRange") as keyof Window,
	getAllBusinessUnitRules: btoa("getAllBusinessUnitRules") as keyof Window,
	getActiveBusinessUnitRules: btoa("getActiveBusinessUnitRules") as keyof Window,
	getBusinessUnitRuleById: btoa("getBusinessUnitRuleById") as keyof Window,
	createBusinessUnitRule: btoa("createBusinessUnitRule") as keyof Window,
	updateBusinessUnitRule: btoa("updateBusinessUnitRule") as keyof Window,
	deleteBusinessUnitRule: btoa("deleteBusinessUnitRule") as keyof Window,
	detectBusinessUnit: btoa("detectBusinessUnit") as keyof Window,
	testBusinessUnitPattern: btoa("testBusinessUnitPattern") as keyof Window,
	reorderBusinessUnitRules: btoa("reorderBusinessUnitRules") as keyof Window,
	getBusinessUnitStatistics: btoa("getBusinessUnitStatistics") as keyof Window,
	getAllMonthlyReportStatusMappingRules: btoa("getAllMonthlyReportStatusMappingRules") as keyof Window,
	getActiveMonthlyReportStatusMappingRules: btoa("getActiveMonthlyReportStatusMappingRules") as keyof Window,
	getMonthlyReportStatusMappingRuleById: btoa("getMonthlyReportStatusMappingRuleById") as keyof Window,
	createMonthlyReportStatusMappingRule: btoa("createMonthlyReportStatusMappingRule") as keyof Window,
	updateMonthlyReportStatusMappingRule: btoa("updateMonthlyReportStatusMappingRule") as keyof Window,
	deleteMonthlyReportStatusMappingRule: btoa("deleteMonthlyReportStatusMappingRule") as keyof Window,
	mapMonthlyReportRequestStatus: btoa("mapMonthlyReportRequestStatus") as keyof Window,
	testMonthlyReportStatusPattern: btoa("testMonthlyReportStatusPattern") as keyof Window,
	reorderMonthlyReportStatusMappingRules: btoa("reorderMonthlyReportStatusMappingRules") as keyof Window,
	getMonthlyReportStatusMappingStatistics: btoa("getMonthlyReportStatusMappingStatistics") as keyof Window,
};
