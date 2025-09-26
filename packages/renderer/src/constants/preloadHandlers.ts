import type {
	EnrichmentResult,
	ForTaggingData,
	TagResponseArrayDto,
} from "@app/core";
import { preloadApiKeys } from "./preloadApiKeys";

export interface PreloadHandlers {
	getAllTags: () => Promise<TagResponseArrayDto>;
	parseTagReport: (
		fileBuffer: ArrayBuffer,
		fileName: string
	) => Promise<unknown>;
	openExternal: (url: string) => Promise<void>;
	parseForTaggingDataExcel: (
		fileBuffer: ArrayBuffer,
		fileName: string
	) => Promise<unknown>;
	parseAndSaveForTaggingDataExcel: (
		fileBuffer: ArrayBuffer,
		fileName: string
	) => Promise<unknown>;
	getAllForTaggingData: () => Promise<ForTaggingData[]>;
	getEnrichedForTaggingData: () => Promise<EnrichmentResult>;
}

export function getPreloadHandler<K extends keyof PreloadHandlers>(
	key: K
): PreloadHandlers[K] {
	return window[preloadApiKeys[key]] as PreloadHandlers[K];
}
