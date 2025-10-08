import type {
	AggregatedRelationship,
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
	parseParentChildExcel: (
		fileBuffer: ArrayBuffer,
		fileName: string
	) => Promise<unknown>;
	getAllParentChildRelationships: () => Promise<unknown>;
	getAggregatedParentChildRelationships: () => Promise<
		AggregatedRelationship[]
	>;
	parseCorrectiveMaintenanceExcel: (
		fileBuffer: ArrayBuffer,
		fileName: string
	) => Promise<unknown>;
	getAllCorrectiveMaintenanceRecords: (
		businessUnit?: string
	) => Promise<unknown>;
	getCorrectiveMaintenanceRecordsByFilters: (
		businessUnit: string,
		requestStatus?: string
	) => Promise<unknown>;
	getDistinctRequestStatuses: () => Promise<string[]>;
	getDistinctCorrectiveBusinessUnits: () => Promise<string[]>;
	getDistinctMonthlyRequestStatusReporte: () => Promise<string[]>;
	copyTextToClipboard: (text: string) => void;
	copyHtmlToClipboard: (html: string, text?: string) => void;
	translateText: (text: string) => Promise<string>;
	translateAllSubjects: (
		subjects: string[]
	) => Promise<{ original: string; translated: string }[]>;
	parseMonthlyReport: (
		fileBuffer: ArrayBuffer,
		fileName: string
	) => Promise<unknown>;
	getAllMonthlyReportRecords: () => Promise<unknown>;
	getMonthlyReportRecordsByBusinessUnit: (
		businessUnit: string
	) => Promise<unknown>;
	getMonthlyReportRecordsByRequestStatus: (
		requestStatus: string
	) => Promise<unknown>;
	getMonthlyReportRecordsByDateRange: (
		startDate: string,
		endDate: string
	) => Promise<unknown>;
	getMonthlyReportRecordsByMonth: (month: string) => Promise<unknown>;
	getMonthlyReportRecordsByQuarter: (quarter: string) => Promise<unknown>;
	updateMonthlyReportRecordStatus: (
		requestId: string,
		newStatus: string
	) => Promise<unknown>;
	updateMonthlyReportEnlacesCounts: (
		requestId: string,
		enlacesCount: number
	) => Promise<unknown>;
	findMonthlyReportRecordByRequestId: (requestId: string) => Promise<unknown>;
	dropAllMonthlyReportRecords: () => Promise<unknown>;
	getBugCategorizedRecords: (businessUnit?: string) => Promise<unknown>;
	getScopeErrorCategorizedRecords: (businessUnit?: string) => Promise<unknown>;
	getMonthlyReportsWithDisplayNames: () => Promise<unknown>;
	getMonthlyReportsByBusinessUnitWithDisplayNames: (businessUnit: string) => Promise<unknown>;
	getAllModuleCategorizationDisplayRules: () => Promise<unknown>;
	getActiveModuleCategorizationDisplayRules: () => Promise<unknown>;
	getModuleCategorizationDisplayRuleById: (id: number) => Promise<unknown>;
	createModuleCategorizationDisplayRule: (data: {
		ruleType: 'module' | 'categorization';
		sourceValue: string;
		displayValue: string;
		patternType?: 'exact' | 'contains' | 'regex';
		priority?: number;
		active?: boolean;
	}) => Promise<unknown>;
	updateModuleCategorizationDisplayRule: (id: number, updates: {
		ruleType?: 'module' | 'categorization';
		sourceValue?: string;
		displayValue?: string;
		patternType?: 'exact' | 'contains' | 'regex';
		priority?: number;
		active?: boolean;
	}) => Promise<unknown>;
	deleteModuleCategorizationDisplayRule: (id: number) => Promise<unknown>;
	testModuleCategorizationDisplayPattern: (pattern: string, text: string, patternType: 'contains' | 'regex' | 'exact') => Promise<unknown>;
	reorderModuleCategorizationDisplayRules: (ruleOrders: Array<{ id: number; priority: number }>) => Promise<unknown>;
	loadWarRoomData: (buffer: ArrayBuffer, filename: string) => Promise<unknown>;
	getWarRoomRecords: () => Promise<unknown>;
	getWarRoomApplications: () => Promise<unknown>;
	dropWarRoomData: () => Promise<unknown>;
}

export function getPreloadHandler<K extends keyof PreloadHandlers>(
	key: K
): PreloadHandlers[K] {
	return window[preloadApiKeys[key]] as PreloadHandlers[K];
}
