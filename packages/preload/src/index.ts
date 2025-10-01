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

// Semanal date range operations
async function getSemanalDateRange() {
	return ipcRenderer.invoke("getSemanalDateRange");
}

async function saveSemanalDateRange(data: {
	fromDate: string;
	toDate: string;
	description: string;
}) {
	return ipcRenderer.invoke("saveSemanalDateRange", data);
}

async function getDefaultSemanalDateRange() {
	return ipcRenderer.invoke("getDefaultSemanalDateRange");
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

// Export service methods directly
export {
	getAllTags,
	parseTagReport,
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
	getSemanalDateRange,
	saveSemanalDateRange,
	getDefaultSemanalDateRange,
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
	openExternal,
	copyTextToClipboard,
	copyHtmlToClipboard,
	send,
	sha256sum,
	versions,
};
