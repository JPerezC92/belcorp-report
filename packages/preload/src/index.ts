import {sha256sum} from './nodeCrypto.js';
import {versions} from './versions.js';
import {ipcRenderer, shell} from 'electron';

function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

async function processExcelFile(fileBuffer: ArrayBuffer, fileName: string) {
  return ipcRenderer.invoke('excel:process-file', fileBuffer, fileName);
}

async function validateExcelFile(fileBuffer: ArrayBuffer) {
  return ipcRenderer.invoke('excel:validate-file', fileBuffer);
}

async function analyzeHyperlinks(worksheetData: any) {
  return ipcRenderer.invoke('excel:analyze-hyperlinks', worksheetData);
}

async function openExternal(url: string) {
  return shell.openExternal(url);
}

export {sha256sum, versions, send, processExcelFile, validateExcelFile, analyzeHyperlinks, openExternal};
