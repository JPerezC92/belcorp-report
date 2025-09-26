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
};
