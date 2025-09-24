import type { TagResponseArrayDto } from "@app/core";
import { preloadApiKeys } from "./preloadApiKeys";

export interface PreloadHandlers {
	getAllTags: () => Promise<TagResponseArrayDto>;
	parseTagReport: (
		fileBuffer: ArrayBuffer,
		fileName: string
	) => Promise<unknown>;
	openExternal: (url: string) => Promise<void>;
	// Add other handlers here as needed
}

export function getPreloadHandler<K extends keyof PreloadHandlers>(
	key: K
): PreloadHandlers[K] {
	return window[preloadApiKeys[key]] as PreloadHandlers[K];
}
