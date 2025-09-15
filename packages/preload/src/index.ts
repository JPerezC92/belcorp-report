import { sha256sum } from "./nodeCrypto.js";
import { versions } from "./versions.js";
import { ipcRenderer, shell } from "electron";

function send(channel: string, message: string) {
	return ipcRenderer.invoke(channel, message);
}

async function processExcelFile(fileBuffer: ArrayBuffer, fileName: string) {
	return ipcRenderer.invoke("excel:process-file", fileBuffer, fileName);
}

// Load TAG report Excel file
async function loadTagReport(
	fileBuffer: ArrayBuffer,
	fileName: string,
	options?: any
) {
	return ipcRenderer.invoke(
		"excel:load-tag-report",
		fileBuffer,
		fileName,
		options
	);
}

async function validateExcelFile(fileBuffer: ArrayBuffer) {
	return ipcRenderer.invoke("excel:validate-file", fileBuffer);
}

async function analyzeHyperlinks(worksheetData: any) {
	return ipcRenderer.invoke("excel:analyze-hyperlinks", worksheetData);
}

// V2 Enhanced hyperlink analysis
async function analyzeHyperlinksV2(worksheetData: any) {
	return ipcRenderer.invoke("excel:analyze-hyperlinks-v2", worksheetData);
}

// V2 Sheet statistics
async function getSheetStatisticsV2(worksheetData: any) {
	return ipcRenderer.invoke("excel:get-sheet-statistics-v2", worksheetData);
}

async function openExternal(url: string) {
	return shell.openExternal(url);
}

export {
	sha256sum,
	versions,
	send,
	processExcelFile,
	loadTagReport,
	validateExcelFile,
	analyzeHyperlinks,
	analyzeHyperlinksV2,
	getSheetStatisticsV2,
	openExternal,
};
