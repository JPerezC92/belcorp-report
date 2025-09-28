// Test script to verify external link functionality
import { getPreloadHandler } from "./packages/renderer/src/constants/preloadHandlers.js";

async function testExternalLink() {
	try {
		console.log("Testing external link functionality...");

		const openExternal = getPreloadHandler("openExternal");
		if (openExternal) {
			console.log("openExternal handler found");

			// Test with a sample URL (this should open in external browser)
			const testUrl =
				"https://sdp.belcorp.biz/WorkOrder.do?PORTALID=1&woMode=viewWO&woID=125109";
			console.log(`Attempting to open: ${testUrl}`);

			await openExternal(testUrl);
			console.log("External link opened successfully!");
		} else {
			console.error("openExternal handler not found");
		}
	} catch (error) {
		console.error("Error testing external link:", error);
	}
}

testExternalLink();
