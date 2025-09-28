import type { MonthlyReportRecord } from "../domain/monthly-report-record.js";
import type { MonthlyReportRepository } from "../domain/monthly-report-repository.js";

export class MonthlyReportFinder {
	constructor(private readonly repository: MonthlyReportRepository) {}

	async findAll(): Promise<MonthlyReportRecord[]> {
		return this.repository.getWithEnlaces();
	}

	async findByBusinessUnit(businessUnit: string): Promise<MonthlyReportRecord[]> {
		const records = await this.repository.findByBusinessUnit(businessUnit);
		// Enlaces are already calculated in the repository
		return records;
	}

	async findByRequestId(requestId: string): Promise<MonthlyReportRecord | null> {
		return this.repository.findByRequestId(requestId);
	}
}