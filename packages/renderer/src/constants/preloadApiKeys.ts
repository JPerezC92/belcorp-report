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
};
