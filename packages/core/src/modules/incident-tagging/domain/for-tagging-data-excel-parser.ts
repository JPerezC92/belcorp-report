import type { Tag } from "./tag.js";

// Shared types
export interface RequestIdWithLink {
	requestId: string;
	link?: string;
}

export interface ForTaggingDataExcelSheet {
	name: string;
	headers: string[];
	rows: ForTaggingData[];
}

export interface ForTaggingDataExcelParseResult {
	success: boolean;
	fileName: string;
	sheet: ForTaggingDataExcelSheet | null;
	error?: string;
}

export interface ForTaggingDataExcelParser {
	parseExcel(
		fileBuffer: ArrayBuffer,
		fileName: string
	): Promise<ForTaggingDataExcelParseResult>;
}

// Domain entity for ForTaggingData
export class ForTaggingData {
	constructor(
		public readonly technician: string,
		public readonly requestId: string,
		public readonly requestIdLink: string | undefined,
		public readonly createdTime: string,
		public readonly module: string,
		public readonly subject: string,
		public readonly subjectLink: string | undefined,
		public readonly problemId: string,
		public readonly problemIdLink: string | undefined,
		public readonly linkedRequestId: string,
		public readonly linkedRequestIdLink: string | undefined,
		public readonly category: string
	) {}

	static create(data: {
		technician: string;
		requestId: string;
		requestIdLink?: string;
		createdTime: string;
		module: string;
		subject: string;
		subjectLink?: string;
		problemId: string;
		problemIdLink?: string;
		linkedRequestId: string;
		linkedRequestIdLink?: string;
		category: string;
	}): ForTaggingData {
		return new ForTaggingData(
			data.technician,
			data.requestId,
			data.requestIdLink,
			data.createdTime,
			data.module,
			data.subject,
			data.subjectLink,
			data.problemId,
			data.problemIdLink,
			data.linkedRequestId,
			data.linkedRequestIdLink,
			data.category
		);
	}
}

// Repository interface for ForTaggingData
export interface ForTaggingDataRepository {
	saveBatch(data: ForTaggingData[]): Promise<void>;
	getAll(): Promise<ForTaggingData[]>;
	drop(): Promise<void>;
}

// Enriched ForTaggingData with additional information from Tag
export class EnrichedForTaggingData {
	constructor(
		public readonly requestId: string,
		public readonly requestIdLink: string | undefined,
		public readonly technician: string,
		public readonly createdTime: string,
		public readonly module: string,
		public readonly subject: string,
		public readonly subjectLink: string | undefined,
		public readonly problemId: string,
		public readonly problemIdLink: string | undefined,
		public readonly linkedRequestId: string,
		public readonly linkedRequestIdLink: string | undefined,
		public readonly category: string,
		public readonly additionalInfo: string[],
		public readonly additionalInfoToRequestIds: Map<
			string,
			RequestIdWithLink[]
		>
	) {}

	static create(
		forTaggingData: ForTaggingData,
		tags?: Tag[]
	): EnrichedForTaggingData {
		if (!tags || tags.length === 0) {
			return new EnrichedForTaggingData(
				forTaggingData.requestId,
				forTaggingData.requestIdLink,
				forTaggingData.technician,
				forTaggingData.createdTime,
				forTaggingData.module,
				forTaggingData.subject,
				forTaggingData.subjectLink,
				forTaggingData.problemId,
				forTaggingData.problemIdLink,
				forTaggingData.linkedRequestId,
				forTaggingData.linkedRequestIdLink,
				forTaggingData.category,
				[],
				new Map<string, RequestIdWithLink[]>()
			);
		}

		// Collect additional information from ALL matching tags as an array (deduplicated)
		const allAdditionalInfo = [
			...new Set(
				tags
					.map((tag) => tag.additionalInfo)
					.filter((info) => info && info.trim() !== "")
			),
		];

		// Create mapping of additional info to request IDs (for this record)
		const additionalInfoToRequestIds = new Map<
			string,
			RequestIdWithLink[]
		>();
		allAdditionalInfo.forEach((info) => {
			const requestIdWithLink: RequestIdWithLink = {
				requestId: forTaggingData.requestId,
			};
			if (forTaggingData.requestIdLink) {
				requestIdWithLink.link = forTaggingData.requestIdLink;
			}
			additionalInfoToRequestIds.set(info, [requestIdWithLink]);
		});

		return new EnrichedForTaggingData(
			forTaggingData.requestId,
			forTaggingData.requestIdLink,
			forTaggingData.technician,
			forTaggingData.createdTime,
			forTaggingData.module,
			forTaggingData.subject,
			forTaggingData.subjectLink,
			forTaggingData.problemId,
			forTaggingData.problemIdLink,
			forTaggingData.linkedRequestId,
			forTaggingData.linkedRequestIdLink,
			forTaggingData.category,
			allAdditionalInfo,
			additionalInfoToRequestIds
		);
	}
}
