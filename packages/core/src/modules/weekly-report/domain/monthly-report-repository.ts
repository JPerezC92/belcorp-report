import type { MonthlyReportRecord } from "./monthly-report-record.js";

export interface MonthlyReportRepository {
	save(records: MonthlyReportRecord[]): Promise<void>;
	findAll(): Promise<MonthlyReportRecord[]>;
	findByBusinessUnit(businessUnit: string): Promise<MonthlyReportRecord[]>;
	findByRequestId(requestId: string): Promise<MonthlyReportRecord | null>;
	updateStatus(requestId: string, newStatus: string): Promise<void>;
	getWithEnlaces(): Promise<MonthlyReportRecord[]>;
	deleteAll(): Promise<void>;
}