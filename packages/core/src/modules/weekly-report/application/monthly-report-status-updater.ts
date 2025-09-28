import type { MonthlyReportRepository } from "../domain/monthly-report-repository.js";

export interface UpdateStatusResult {
	success: boolean;
	error?: string;
}

export class MonthlyReportStatusUpdater {
	constructor(private readonly repository: MonthlyReportRepository) {}

	async updateStatus(
		requestId: string,
		newStatus: string
	): Promise<UpdateStatusResult> {
		try {
			// First, get the record to validate
			const record = await this.repository.findByRequestId(requestId);

			if (!record) {
				return {
					success: false,
					error: `Record with requestId ${requestId} not found`,
				};
			}

			// Check if status can be modified
			if (record.requestStatus.toLowerCase() !== "esperando el cliente") {
				return {
					success: false,
					error: "Only 'Esperando El Cliente' status can be modified",
				};
			}

			// Check if already modified by user
			if (record.statusModifiedByUser) {
				return {
					success: false,
					error: "This status has already been modified by a user and is locked",
				};
			}

			// Update the status
			await this.repository.updateStatus(requestId, newStatus);

			return {
				success: true,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}
}