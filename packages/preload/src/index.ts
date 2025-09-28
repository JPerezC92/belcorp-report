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
	openExternal,
	copyTextToClipboard,
	copyHtmlToClipboard,
	send,
	sha256sum,
	versions,
};
