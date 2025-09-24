import { ipcRenderer, shell } from "electron";
import { sha256sum } from "./nodeCrypto.js";
import { versions } from "./versions.js";

function send(channel: string, message: string) {
	return ipcRenderer.invoke(channel, message);
}

async function openExternal(url: string) {
	return shell.openExternal(url);
}

// Tag data operations
async function getAllTags() {
	return ipcRenderer.invoke("tag-data:getAll");
}

async function parseTagReport(fileBuffer: ArrayBuffer, fileName: string) {
	return ipcRenderer.invoke("tag-data:parseReport", fileBuffer, fileName);
}

// Export tag service methods directly
export { getAllTags, parseTagReport, openExternal, send, sha256sum, versions };
