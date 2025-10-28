import { clipboard, ipcRenderer, shell } from "electron";
import { sha256sum } from "./nodeCrypto.js";
import { versions } from "./versions.js";

function send(channel: string, message: string) {
	return ipcRenderer.invoke(channel, message);
}

async function openExternal(url: string) {
	return shell.openExternal(url);
}

function copyTextToClipboard(text: string) {
	clipboard.writeText(text);
}

function copyHtmlToClipboard(html: string, text?: string) {
	clipboard.writeHTML(html);
	if (text) {
		clipboard.writeText(text);
	}
}

// ForTaggingData Excel operations
async function parseForTaggingDataExcel(
	fileBuffer: ArrayBuffer,
	fileName: string
) {
	return ipcRenderer.invoke(
		"for-tagging-data:parseExcel",
		fileBuffer,
		fileName
	);
}

async function parseAndSaveForTaggingDataExcel(
	fileBuffer: ArrayBuffer,
	fileName: string
) {
	return ipcRenderer.invoke(
		"for-tagging-data:parseAndSaveExcel",
		fileBuffer,
		fileName
	);
}

async function getAllForTaggingData() {
	return ipcRenderer.invoke("for-tagging-data:getAll");
}

async function getEnrichedForTaggingData() {
	return ipcRenderer.invoke("for-tagging-data:getEnriched");
}

// Tag data operations
async function getAllTags() {
	return ipcRenderer.invoke("tag-data:getAll");
}

async function parseTagReport(fileBuffer: ArrayBuffer, fileName: string) {
	return ipcRenderer.invoke("tag-data:parseReport", fileBuffer, fileName);
}

async function getGroupedTagsByLinkedRequest() {
	return ipcRenderer.invoke("tag-data:getGroupedByLinkedRequest");
}

// Weekly report operations
async function parseParentChildExcel(
	fileBuffer: ArrayBuffer,
	fileName: string
) {
	return ipcRenderer.invoke(
		"weekly-report:parseParentChildExcel",
		fileBuffer,
		fileName
	);
}

async function getAllParentChildRelationships() {
	return ipcRenderer.invoke("weekly-report:getAllRelationships");
}

async function getAggregatedParentChildRelationships() {
	return ipcRenderer.invoke("weekly-report:getAggregatedRelationships");
}

// Corrective maintenance operations
async function parseCorrectiveMaintenanceExcel(
	fileBuffer: ArrayBuffer,
	fileName: string
) {
	return ipcRenderer.invoke(
		"weekly-report:parseCorrectiveMaintenanceExcel",
		fileBuffer,
		fileName
	);
}

async function getAllCorrectiveMaintenanceRecords(businessUnit?: string) {
	return ipcRenderer.invoke(
		"weekly-report:getAllCorrectiveMaintenanceRecords",
		businessUnit
	);
}

async function getCorrectiveMaintenanceRecordsByFilters(
	businessUnit: string,
	requestStatus?: string
) {
	return ipcRenderer.invoke(
		"weekly-report:getCorrectiveMaintenanceRecordsByFilters",
		businessUnit,
		requestStatus
	);
}

async function getDistinctRequestStatuses() {
	return ipcRenderer.invoke("weekly-report:getDistinctRequestStatuses");
}

async function getDistinctCorrectiveBusinessUnits() {
	return ipcRenderer.invoke("weekly-report:getDistinctCorrectiveBusinessUnits");
}

async function getDistinctMonthlyRequestStatusReporte() {
	return ipcRenderer.invoke("getDistinctMonthlyRequestStatusReporte");
}

// Translation operations
async function translateText(text: string) {
	return ipcRenderer.invoke("weekly-report:translateText", text);
}

async function translateAllSubjects(subjects: string[]) {
	return ipcRenderer.invoke("weekly-report:translateAllSubjects", subjects);
}

// Monthly report operations
async function parseMonthlyReport(fileBuffer: ArrayBuffer, fileName: string) {
	return ipcRenderer.invoke("processMonthlyReportExcel", fileBuffer, fileName);
}

async function getAllMonthlyReportRecords() {
	return ipcRenderer.invoke("getMonthlyReports");
}

async function getMonthlyReportRecordsByBusinessUnit(businessUnit: string) {
	return ipcRenderer.invoke(
		"getMonthlyReportsByBusinessUnit",
		businessUnit
	);
}

async function getMonthlyReportRecordsByRequestStatus(requestStatus: string) {
	return ipcRenderer.invoke(
		"getMonthlyReportRecordsByRequestStatus",
		requestStatus
	);
}

async function getMonthlyReportRecordsByDateRange(
	startDate: string,
	endDate: string
) {
	return ipcRenderer.invoke(
		"getMonthlyReportRecordsByDateRange",
		startDate,
		endDate
	);
}

async function getMonthlyReportRecordsByMonth(month: string) {
	return ipcRenderer.invoke("getMonthlyReportRecordsByMonth", month);
}

async function getMonthlyReportRecordsByQuarter(quarter: string) {
	return ipcRenderer.invoke("getMonthlyReportRecordsByQuarter", quarter);
}

async function updateMonthlyReportRecordStatus(
	requestId: string,
	newStatus: string
) {
	return ipcRenderer.invoke(
		"updateMonthlyReportStatus",
		requestId,
		newStatus
	);
}

async function updateMonthlyReportEnlacesCounts(
	requestId: string,
	enlacesCount: number
) {
	return ipcRenderer.invoke(
		"updateMonthlyReportEnlacesCounts",
		requestId,
		enlacesCount
	);
}

async function findMonthlyReportRecordByRequestId(requestId: string) {
	return ipcRenderer.invoke("findMonthlyReportByRequestId", requestId);
}

async function dropAllMonthlyReportRecords() {
	return ipcRenderer.invoke("deleteAllMonthlyReports");
}

async function getBugCategorizedRecords(businessUnit?: string) {
	return ipcRenderer.invoke("getBugCategorizedRecords", businessUnit);
}

async function getScopeErrorCategorizedRecords(businessUnit?: string) {
	return ipcRenderer.invoke("getScopeErrorCategorizedRecords", businessUnit);
}

async function getMonthlyReportsWithDisplayNames() {
	return ipcRenderer.invoke("getMonthlyReportsWithDisplayNames");
}

async function getMonthlyReportsByBusinessUnitWithDisplayNames(businessUnit: string) {
	return ipcRenderer.invoke("getMonthlyReportsByBusinessUnitWithDisplayNames", businessUnit);
}

// Date range config operations
async function getDateRangeConfig() {
	return ipcRenderer.invoke("getDateRangeConfig");
}

async function saveDateRangeConfig(data: {
	fromDate: string;
	toDate: string;
	description: string;
}) {
	return ipcRenderer.invoke("saveDateRangeConfig", data);
}

async function getDefaultDateRangeConfig() {
	return ipcRenderer.invoke("getDefaultDateRangeConfig");
}

// New scope-based date range config operations
async function getDateRangeConfigByScope(scope: 'monthly' | 'corrective' | 'global') {
	return ipcRenderer.invoke("getDateRangeConfigByScope", scope);
}

async function saveMonthlyDateRangeConfig(data: {
	fromDate: string;
	toDate: string;
	description?: string;
	rangeType: 'weekly' | 'custom' | 'disabled';
}) {
	return ipcRenderer.invoke("saveMonthlyDateRangeConfig", data);
}

async function saveCorrectiveDateRangeConfig(data: {
	fromDate: string;
	toDate: string;
	description?: string;
	rangeType: 'weekly' | 'custom' | 'disabled';
}) {
	return ipcRenderer.invoke("saveCorrectiveDateRangeConfig", data);
}

async function getDateRangeSettings() {
	return ipcRenderer.invoke("getDateRangeSettings");
}

async function updateGlobalMode(enabled: boolean) {
	return ipcRenderer.invoke("updateGlobalMode", enabled);
}

// Business Unit Rules operations
async function getAllBusinessUnitRules() {
	return ipcRenderer.invoke("business-unit-rules:get-all");
}

async function getActiveBusinessUnitRules() {
	return ipcRenderer.invoke("business-unit-rules:get-active");
}

async function getBusinessUnitRuleById(id: number) {
	return ipcRenderer.invoke("business-unit-rules:get-by-id", id);
}

async function createBusinessUnitRule(data: {
	businessUnit: string;
	pattern: string;
	patternType?: 'contains' | 'regex' | 'exact';
	priority?: number;
	active?: boolean;
}) {
	return ipcRenderer.invoke("business-unit-rules:create", data);
}

async function updateBusinessUnitRule(id: number, updates: {
	businessUnit?: string;
	pattern?: string;
	patternType?: 'contains' | 'regex' | 'exact';
	priority?: number;
	active?: boolean;
}) {
	return ipcRenderer.invoke("business-unit-rules:update", id, updates);
}

async function deleteBusinessUnitRule(id: number) {
	return ipcRenderer.invoke("business-unit-rules:delete", id);
}

async function detectBusinessUnit(applicationText: string) {
	return ipcRenderer.invoke("business-unit-rules:detect", applicationText);
}

async function testBusinessUnitPattern(pattern: string, text: string, patternType: 'contains' | 'regex' | 'exact') {
	return ipcRenderer.invoke("business-unit-rules:test-pattern", pattern, text, patternType);
}

async function reorderBusinessUnitRules(ruleOrders: Array<{ id: number; priority: number }>) {
	return ipcRenderer.invoke("business-unit-rules:reorder", ruleOrders);
}

async function getBusinessUnitStatistics() {
	return ipcRenderer.invoke("business-unit-rules:get-statistics");
}

// Monthly Report Status Mapping operations
async function getAllMonthlyReportStatusMappingRules() {
	return ipcRenderer.invoke("monthly-report-status-mapping:get-all");
}

async function getActiveMonthlyReportStatusMappingRules() {
	return ipcRenderer.invoke("monthly-report-status-mapping:get-active");
}

async function getMonthlyReportStatusMappingRuleById(id: number) {
	return ipcRenderer.invoke("monthly-report-status-mapping:get-by-id", id);
}

async function createMonthlyReportStatusMappingRule(data: {
	sourceStatus: string;
	targetStatus: string;
	patternType?: 'exact' | 'contains' | 'regex';
	priority?: number;
	active?: boolean;
}) {
	return ipcRenderer.invoke("monthly-report-status-mapping:create", data);
}

async function updateMonthlyReportStatusMappingRule(id: number, updates: {
	sourceStatus?: string;
	targetStatus?: string;
	patternType?: 'exact' | 'contains' | 'regex';
	priority?: number;
	active?: boolean;
}) {
	return ipcRenderer.invoke("monthly-report-status-mapping:update", id, updates);
}

async function deleteMonthlyReportStatusMappingRule(id: number) {
	return ipcRenderer.invoke("monthly-report-status-mapping:delete", id);
}

async function mapMonthlyReportRequestStatus(requestStatus: string) {
	return ipcRenderer.invoke("monthly-report-status-mapping:map-status", requestStatus);
}

async function testMonthlyReportStatusPattern(pattern: string, text: string, patternType: 'contains' | 'regex' | 'exact') {
	return ipcRenderer.invoke("monthly-report-status-mapping:test-pattern", pattern, text, patternType);
}

async function reorderMonthlyReportStatusMappingRules(ruleOrders: Array<{ id: number; priority: number }>) {
	return ipcRenderer.invoke("monthly-report-status-mapping:reorder", ruleOrders);
}

async function getMonthlyReportStatusMappingStatistics() {
	return ipcRenderer.invoke("monthly-report-status-mapping:get-statistics");
}

// Module/Categorization Display Rules operations
async function getAllModuleCategorizationDisplayRules() {
	return ipcRenderer.invoke("module-categorization-display-rules:get-all");
}

async function getActiveModuleCategorizationDisplayRules() {
	return ipcRenderer.invoke("module-categorization-display-rules:get-active");
}

async function getModuleCategorizationDisplayRuleById(id: number) {
	return ipcRenderer.invoke("module-categorization-display-rules:get-by-id", id);
}

async function createModuleCategorizationDisplayRule(data: {
	ruleType: 'module' | 'categorization';
	sourceValue: string;
	displayValue: string;
	patternType?: 'exact' | 'contains' | 'regex';
	priority?: number;
	active?: boolean;
}) {
	return ipcRenderer.invoke("module-categorization-display-rules:create", data);
}

async function updateModuleCategorizationDisplayRule(id: number, updates: {
	ruleType?: 'module' | 'categorization';
	sourceValue?: string;
	displayValue?: string;
	patternType?: 'exact' | 'contains' | 'regex';
	priority?: number;
	active?: boolean;
}) {
	return ipcRenderer.invoke("module-categorization-display-rules:update", id, updates);
}

async function deleteModuleCategorizationDisplayRule(id: number) {
	return ipcRenderer.invoke("module-categorization-display-rules:delete", id);
}

async function testModuleCategorizationDisplayPattern(pattern: string, text: string, patternType: 'contains' | 'regex' | 'exact') {
	return ipcRenderer.invoke("module-categorization-display-rules:test-pattern", pattern, text, patternType);
}

async function reorderModuleCategorizationDisplayRules(ruleOrders: Array<{ id: number; priority: number }>) {
	return ipcRenderer.invoke("module-categorization-display-rules:reorder", ruleOrders);
}

// SB Operational Stability functions
async function loadSBOperationalStabilityData(buffer: ArrayBuffer, filename: string) {
	return ipcRenderer.invoke("loadSBOperationalStabilityData", buffer, filename);
}

async function getSBOperationalReleases(options?: {
	startDate?: string;
	endDate?: string;
	application?: string;
}) {
	return ipcRenderer.invoke("getSBOperationalReleases", options);
}

async function dropSBOperationalStabilityData() {
	return ipcRenderer.invoke("dropSBOperationalStabilityData");
}

// War Room functions
async function loadWarRoomData(buffer: ArrayBuffer, filename: string) {
	return ipcRenderer.invoke("loadWarRoomData", buffer, filename);
}

async function getWarRoomRecords() {
	return ipcRenderer.invoke("getWarRoomRecords");
}

async function getWarRoomApplications() {
	return ipcRenderer.invoke("getWarRoomApplications");
}

async function dropWarRoomData() {
	return ipcRenderer.invoke("dropWarRoomData");
}

// Level Mapping functions
async function getLevelMappings() {
	return ipcRenderer.invoke("getLevelMappings");
}

async function createLevelMapping(requestStatusReporte: string, level: string) {
	return ipcRenderer.invoke("createLevelMapping", requestStatusReporte, level);
}

async function updateLevelMapping(requestStatusReporte: string, level: string) {
	return ipcRenderer.invoke("updateLevelMapping", requestStatusReporte, level);
}

async function deleteLevelMapping(requestStatusReporte: string) {
	return ipcRenderer.invoke("deleteLevelMapping", requestStatusReporte);
}

// Export service methods directly
export {
	getAllTags,
	parseTagReport,
	getGroupedTagsByLinkedRequest,
	parseForTaggingDataExcel,
	parseAndSaveForTaggingDataExcel,
	getAllForTaggingData,
	getEnrichedForTaggingData,
	parseParentChildExcel,
	getAllParentChildRelationships,
	getAggregatedParentChildRelationships,
	parseCorrectiveMaintenanceExcel,
	getAllCorrectiveMaintenanceRecords,
	getCorrectiveMaintenanceRecordsByFilters,
	getDistinctRequestStatuses,
	getDistinctCorrectiveBusinessUnits,
	getDistinctMonthlyRequestStatusReporte,
	translateText,
	translateAllSubjects,
	parseMonthlyReport,
	getAllMonthlyReportRecords,
	getMonthlyReportRecordsByBusinessUnit,
	getMonthlyReportRecordsByRequestStatus,
	getMonthlyReportRecordsByDateRange,
	getMonthlyReportRecordsByMonth,
	getMonthlyReportRecordsByQuarter,
	updateMonthlyReportRecordStatus,
	updateMonthlyReportEnlacesCounts,
	findMonthlyReportRecordByRequestId,
	dropAllMonthlyReportRecords,
	getDateRangeConfig,
	saveDateRangeConfig,
	getDefaultDateRangeConfig,
	getDateRangeConfigByScope,
	saveMonthlyDateRangeConfig,
	saveCorrectiveDateRangeConfig,
	getDateRangeSettings,
	updateGlobalMode,
	getAllBusinessUnitRules,
	getActiveBusinessUnitRules,
	getBusinessUnitRuleById,
	createBusinessUnitRule,
	updateBusinessUnitRule,
	deleteBusinessUnitRule,
	detectBusinessUnit,
	testBusinessUnitPattern,
	reorderBusinessUnitRules,
	getBusinessUnitStatistics,
	getAllMonthlyReportStatusMappingRules,
	getActiveMonthlyReportStatusMappingRules,
	getMonthlyReportStatusMappingRuleById,
	createMonthlyReportStatusMappingRule,
	updateMonthlyReportStatusMappingRule,
	deleteMonthlyReportStatusMappingRule,
	mapMonthlyReportRequestStatus,
	testMonthlyReportStatusPattern,
	reorderMonthlyReportStatusMappingRules,
	getMonthlyReportStatusMappingStatistics,
	getBugCategorizedRecords,
	getScopeErrorCategorizedRecords,
	getMonthlyReportsWithDisplayNames,
	getMonthlyReportsByBusinessUnitWithDisplayNames,
	getAllModuleCategorizationDisplayRules,
	getActiveModuleCategorizationDisplayRules,
	getModuleCategorizationDisplayRuleById,
	createModuleCategorizationDisplayRule,
	updateModuleCategorizationDisplayRule,
	deleteModuleCategorizationDisplayRule,
	testModuleCategorizationDisplayPattern,
	reorderModuleCategorizationDisplayRules,
	loadSBOperationalStabilityData,
	getSBOperationalReleases,
	dropSBOperationalStabilityData,
	loadWarRoomData,
	getWarRoomRecords,
	getWarRoomApplications,
	dropWarRoomData,
	getLevelMappings,
	createLevelMapping,
	updateLevelMapping,
	deleteLevelMapping,
	openExternal,
	copyTextToClipboard,
	copyHtmlToClipboard,
	send,
	sha256sum,
	versions,
};
