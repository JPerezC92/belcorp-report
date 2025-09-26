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
