import { ipcRenderer, shell } from "electron";
import { sha256sum } from "./nodeCrypto.js";
import { versions } from "./versions.js";

function send(channel: string, message: string) {
	return ipcRenderer.invoke(channel, message);
}

async function openExternal(url: string) {
	return shell.openExternal(url);
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

// Tag data operations
async function getAllTags() {
	return ipcRenderer.invoke("tag-data:getAll");
}

async function parseTagReport(fileBuffer: ArrayBuffer, fileName: string) {
	return ipcRenderer.invoke("tag-data:parseReport", fileBuffer, fileName);
}

// Export service methods directly
export {
	getAllTags,
	parseTagReport,
	parseForTaggingDataExcel,
	parseAndSaveForTaggingDataExcel,
	getAllForTaggingData,
	openExternal,
	send,
	sha256sum,
	versions,
};
