import {
	MonthlyReportFinder,
	MonthlyReportStatusUpdater,
	ProcessMonthlyReportBatchCreator,
	ExcelMonthlyReportParserImpl
} from "@app/core";
import { ipcMain } from "electron";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { SqlJsMonthlyReportRecordRepository } from "../repositories/SqlJsMonthlyReportRecordRepository.js";

export class MonthlyReportModule implements AppModule {
	async enable(_context: ModuleContext): Promise<void> {
		this.registerIpcHandlers();
	}

	private registerIpcHandlers(): void {
		// Process monthly report Excel file
		ipcMain.handle(
			"processMonthlyReportExcel",
			async (_event, buffer: ArrayBuffer, filename: string) => {
				try {
					const repository = new SqlJsMonthlyReportRecordRepository();
					const parser = new ExcelMonthlyReportParserImpl();
					const batchCreator = new ProcessMonthlyReportBatchCreator(
						parser,
						repository
					);

					const result = await batchCreator.execute(buffer, filename);

					if (!result.success) {
						return {
							success: false,
							errors: result.errors,
							warnings: result.warnings,
						};
					}

					return {
						success: true,
						data: {
							recordsProcessed: result.recordsProcessed,
						},
						warnings: result.warnings,
					};
				} catch (error) {
					console.error("[MonthlyReportModule] Process Excel error:", error);
					return {
						success: false,
						error:
							error instanceof Error
								? error.message
								: "Unknown error",
					};
				}
			}
		);

		// Get all monthly report records with enlaces
		ipcMain.handle("getMonthlyReports", async () => {
			try {
				const repository = new SqlJsMonthlyReportRecordRepository();
				const finder = new MonthlyReportFinder(repository);

				const records = await finder.findAll();

				// Convert to DTOs
				const dtos = records.map((record) => ({
					requestId: record.requestId,
					applications: record.applications,
					categorization: record.categorization,
					requestIdLink: record.requestIdLink,
					createdTime: record.createdTime,
					requestStatus: record.requestStatus,
					module: record.module,
					subject: record.subject,
					subjectLink: record.subjectLink,
					priority: record.priority,
					priorityReporte: record.priorityReporte,
					eta: record.eta,
					additionalInfo: record.additionalInfo,
					resolvedTime: record.resolvedTime,
					affectedCountries: record.affectedCountries,
					recurrence: record.recurrence,
					technician: record.technician,
					jira: record.jira,
					problemId: record.problemId,
					problemIdLink: record.problemIdLink,
					linkedRequestId: record.linkedRequestId,
					linkedRequestIdLink: record.linkedRequestIdLink,
					requestOLAStatus: record.requestOLAStatus,
					escalationGroup: record.escalationGroup,
					affectedApplications: record.affectedApplications,
					shouldResolveLevel1: record.shouldResolveLevel1,
					campaign: record.campaign,
					cuv1: record.cuv1,
					release: record.release,
					rca: record.rca,
					businessUnit: record.businessUnit,
					semanal: record.semanal,
					rep: record.rep,
					dia: record.dia,
					week: record.week,
					requestStatusReporte: record.requestStatusReporte,
					informacionAdicionalReporte: record.informacionAdicionalReporte,
					enlaces: record.enlaces,
					mensaje: record.mensaje,
					statusModifiedByUser: record.statusModifiedByUser,
				}));

				return {
					success: true,
					data: dtos,
				};
			} catch (error) {
				console.error("[MonthlyReportModule] Get reports error:", error);
				return {
					success: false,
					error:
						error instanceof Error
							? error.message
							: "Unknown error",
				};
			}
		});

		// Get monthly report records by business unit
		ipcMain.handle(
			"getMonthlyReportsByBusinessUnit",
			async (_event, businessUnit: string) => {
				try {
					const repository = new SqlJsMonthlyReportRecordRepository();
					const finder = new MonthlyReportFinder(repository);

					const records = await finder.findByBusinessUnit(businessUnit);

					// Convert to DTOs
					const dtos = records.map((record) => ({
						requestId: record.requestId,
						applications: record.applications,
						categorization: record.categorization,
						requestIdLink: record.requestIdLink,
						createdTime: record.createdTime,
						requestStatus: record.requestStatus,
						module: record.module,
						subject: record.subject,
						subjectLink: record.subjectLink,
						priority: record.priority,
						priorityReporte: record.priorityReporte,
						eta: record.eta,
						additionalInfo: record.additionalInfo,
						resolvedTime: record.resolvedTime,
						affectedCountries: record.affectedCountries,
						recurrence: record.recurrence,
						technician: record.technician,
						jira: record.jira,
						problemId: record.problemId,
						problemIdLink: record.problemIdLink,
						linkedRequestId: record.linkedRequestId,
						linkedRequestIdLink: record.linkedRequestIdLink,
						requestOLAStatus: record.requestOLAStatus,
						escalationGroup: record.escalationGroup,
						affectedApplications: record.affectedApplications,
						shouldResolveLevel1: record.shouldResolveLevel1,
						campaign: record.campaign,
						cuv1: record.cuv1,
						release: record.release,
						rca: record.rca,
						businessUnit: record.businessUnit,
						semanal: record.semanal,
						rep: record.rep,
						dia: record.dia,
						week: record.week,
						requestStatusReporte: record.requestStatusReporte,
						informacionAdicionalReporte: record.informacionAdicionalReporte,
						enlaces: record.enlaces,
						mensaje: record.mensaje,
						statusModifiedByUser: record.statusModifiedByUser,
					}));

					return {
						success: true,
						data: dtos,
					};
				} catch (error) {
					console.error("[MonthlyReportModule] Get by business unit error:", error);
					return {
						success: false,
						error:
							error instanceof Error
								? error.message
								: "Unknown error",
					};
				}
			}
		);

		// Update monthly report status
		ipcMain.handle(
			"updateMonthlyReportStatus",
			async (_event, requestId: string, newStatus: string) => {
				try {
					const repository = new SqlJsMonthlyReportRecordRepository();
					const updater = new MonthlyReportStatusUpdater(repository);

					const result = await updater.updateStatus(requestId, newStatus);

					if (!result.success) {
						return {
							success: false,
							error: result.error,
						};
					}

					return {
						success: true,
						data: { message: "Status updated successfully" },
					};
				} catch (error) {
					console.error("[MonthlyReportModule] Update status error:", error);
					return {
						success: false,
						error:
							error instanceof Error
								? error.message
								: "Unknown error",
					};
				}
			}
		);

		// Find monthly report by request ID
		ipcMain.handle(
			"findMonthlyReportByRequestId",
			async (_event, requestId: string) => {
				try {
					const repository = new SqlJsMonthlyReportRecordRepository();
					const finder = new MonthlyReportFinder(repository);

					const record = await finder.findByRequestId(requestId);

					if (!record) {
						return {
							success: false,
							error: "Record not found",
						};
					}

					const dto = {
						requestId: record.requestId,
						applications: record.applications,
						categorization: record.categorization,
						requestIdLink: record.requestIdLink,
						createdTime: record.createdTime,
						requestStatus: record.requestStatus,
						module: record.module,
						subject: record.subject,
						subjectLink: record.subjectLink,
						priority: record.priority,
						priorityReporte: record.priorityReporte,
						eta: record.eta,
						additionalInfo: record.additionalInfo,
						resolvedTime: record.resolvedTime,
						affectedCountries: record.affectedCountries,
						recurrence: record.recurrence,
						technician: record.technician,
						jira: record.jira,
						problemId: record.problemId,
						problemIdLink: record.problemIdLink,
						linkedRequestId: record.linkedRequestId,
						linkedRequestIdLink: record.linkedRequestIdLink,
						requestOLAStatus: record.requestOLAStatus,
						escalationGroup: record.escalationGroup,
						affectedApplications: record.affectedApplications,
						shouldResolveLevel1: record.shouldResolveLevel1,
						campaign: record.campaign,
						cuv1: record.cuv1,
						release: record.release,
						rca: record.rca,
						businessUnit: record.businessUnit,
						semanal: record.semanal,
						rep: record.rep,
						dia: record.dia,
						week: record.week,
						requestStatusReporte: record.requestStatusReporte,
						informacionAdicionalReporte: record.informacionAdicionalReporte,
						enlaces: record.enlaces,
						mensaje: record.mensaje,
						statusModifiedByUser: record.statusModifiedByUser,
					};

					return {
						success: true,
						data: dto,
					};
				} catch (error) {
					console.error("[MonthlyReportModule] Find by request ID error:", error);
					return {
						success: false,
						error:
							error instanceof Error
								? error.message
								: "Unknown error",
					};
				}
			}
		);

		// Delete all monthly report records
		ipcMain.handle("deleteAllMonthlyReports", async () => {
			try {
				const repository = new SqlJsMonthlyReportRecordRepository();
				await repository.deleteAll();

				return {
					success: true,
					data: { message: "All records deleted successfully" },
				};
			} catch (error) {
				console.error("[MonthlyReportModule] Delete all error:", error);
				return {
					success: false,
					error:
						error instanceof Error
							? error.message
							: "Unknown error",
				};
			}
		});
	}
}

export function createMonthlyReportModule(): MonthlyReportModule {
	return new MonthlyReportModule();
}