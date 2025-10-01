import {
	ExcelMonthlyReportParserImpl,
	MonthlyReportFinder,
	MonthlyReportStatusUpdater,
	ProcessMonthlyReportBatchCreator,
	SemanalDateRange,
} from "@app/core";
import { ipcMain } from "electron";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { SqlJsMonthlyReportRecordRepository } from "../repositories/SqlJsMonthlyReportRecordRepository.js";
import { SqlJsSemanalDateRangeRepository } from "../repositories/SqlJsSemanalDateRangeRepository.js";
import { ServiceRegistry } from "../services/ServiceRegistry.js";

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
					const semanalDateRangeRepository =
						new SqlJsSemanalDateRangeRepository();
					const parser = new ExcelMonthlyReportParserImpl();

					// Get status mapping service from registry and inject into parser
					const statusMappingService = ServiceRegistry.getMonthlyReportStatusMappingService();
					if (statusMappingService) {
						parser.setStatusMapper(async (status: string) => {
							return await statusMappingService.mapStatus(status);
						});
					}

					const batchCreator = new ProcessMonthlyReportBatchCreator(
						parser,
						repository,
						semanalDateRangeRepository
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
					console.error(
						"[MonthlyReportModule] Process Excel error:",
						error
					);
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
					inDateRange: record.inDateRange,
					rep: record.rep,
					dia: record.dia,
					week: record.week,
					requestStatusReporte: record.requestStatusReporte,
					informacionAdicionalReporte:
						record.informacionAdicionalReporte,
					enlaces: record.enlaces,
					mensaje: record.mensaje,
					statusModifiedByUser: record.statusModifiedByUser,
				}));

				return {
					success: true,
					data: dtos,
				};
			} catch (error) {
				console.error(
					"[MonthlyReportModule] Get reports error:",
					error
				);
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

					const records = await finder.findByBusinessUnit(
						businessUnit
					);

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
						inDateRange: record.inDateRange,
						rep: record.rep,
						dia: record.dia,
						week: record.week,
						requestStatusReporte: record.requestStatusReporte,
						informacionAdicionalReporte:
							record.informacionAdicionalReporte,
						enlaces: record.enlaces,
						mensaje: record.mensaje,
						statusModifiedByUser: record.statusModifiedByUser,
					}));

					return {
						success: true,
						data: dtos,
					};
				} catch (error) {
					console.error(
						"[MonthlyReportModule] Get by business unit error:",
						error
					);
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

					const result = await updater.updateStatus(
						requestId,
						newStatus
					);

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
					console.error(
						"[MonthlyReportModule] Update status error:",
						error
					);
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
						inDateRange: record.inDateRange,
						rep: record.rep,
						dia: record.dia,
						week: record.week,
						requestStatusReporte: record.requestStatusReporte,
						informacionAdicionalReporte:
							record.informacionAdicionalReporte,
						enlaces: record.enlaces,
						mensaje: record.mensaje,
						statusModifiedByUser: record.statusModifiedByUser,
					};

					return {
						success: true,
						data: dto,
					};
				} catch (error) {
					console.error(
						"[MonthlyReportModule] Find by request ID error:",
						error
					);
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

		// Get current active semanal date range
		ipcMain.handle("getSemanalDateRange", async () => {
			try {
				const repository = new SqlJsSemanalDateRangeRepository();
				const activeRange = await repository.getActive();

				if (!activeRange) {
					// Create default range if none exists
					const defaultRange = SemanalDateRange.createDefaultRange();
					const savedRange = await repository.save(defaultRange);

					return {
						success: true,
						data: {
							id: savedRange.id,
							fromDate: savedRange.fromDate,
							toDate: savedRange.toDate,
							description: savedRange.description,
							isActive: savedRange.isActive,
						},
					};
				}

				return {
					success: true,
					data: {
						id: activeRange.id,
						fromDate: activeRange.fromDate,
						toDate: activeRange.toDate,
						description: activeRange.description,
						isActive: activeRange.isActive,
					},
				};
			} catch (error) {
				console.error(
					"[MonthlyReportModule] Get semanal date range error:",
					error
				);
				return {
					success: false,
					error:
						error instanceof Error
							? error.message
							: "Unknown error",
				};
			}
		});

		// Save new semanal date range
		ipcMain.handle(
			"saveSemanalDateRange",
			async (
				_event,
				data: {
					fromDate: string;
					toDate: string;
					description: string;
				}
			) => {
				try {
					const repository = new SqlJsSemanalDateRangeRepository();
					const newRange = SemanalDateRange.create(data);
					const savedRange = await repository.save(newRange);

					return {
						success: true,
						data: {
							id: savedRange.id,
							fromDate: savedRange.fromDate,
							toDate: savedRange.toDate,
							description: savedRange.description,
							isActive: savedRange.isActive,
							message:
								"Date range updated. Please reload Excel file to apply changes.",
						},
					};
				} catch (error) {
					console.error(
						"[MonthlyReportModule] Save semanal date range error:",
						error
					);
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

		// Get default semanal date range (Friday to Thursday)
		ipcMain.handle("getDefaultSemanalDateRange", async () => {
			try {
				const defaultRange = SemanalDateRange.createDefaultRange();

				return {
					success: true,
					data: {
						fromDate: defaultRange.fromDate,
						toDate: defaultRange.toDate,
						description: defaultRange.description,
					},
				};
			} catch (error) {
				console.error(
					"[MonthlyReportModule] Get default semanal date range error:",
					error
				);
				return {
					success: false,
					error:
						error instanceof Error
							? error.message
							: "Unknown error",
				};
			}
		});

		// Get distinct request status reporte values
		ipcMain.handle("getDistinctMonthlyRequestStatusReporte", async () => {
			try {
				const repository = new SqlJsMonthlyReportRecordRepository();
				const statuses = await repository.getDistinctRequestStatusReporte();
				return statuses;
			} catch (error) {
				console.error(
					"[MonthlyReportModule] Get distinct request status reporte error:",
					error
				);
				throw error;
			}
		});
	}
}

export function createMonthlyReportModule(): MonthlyReportModule {
	return new MonthlyReportModule();
}
