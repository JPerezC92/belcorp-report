import type {
	CorrectiveMaintenanceExcelParseResult,
	CorrectiveMaintenanceExcelParser,
} from "@core/modules/weekly-report/domain/corrective-maintenance-excel-parser.js";
import type { CorrectiveMaintenanceRecord } from "@core/modules/weekly-report/domain/corrective-maintenance-record.js";
import type { CorrectiveMaintenanceRecordRepository } from "@core/modules/weekly-report/domain/corrective-maintenance-record.repository.js";
import type {
	ParentChildRelationshipExcelParseResult,
	ParentChildRelationshipExcelParser,
} from "@core/modules/weekly-report/domain/parent-child-excel-parser.js";
import type { ParentChildRelationship } from "@core/modules/weekly-report/domain/parent-child-relationship.js";
import type {
	AggregatedRelationship,
	ParentChildRelationshipRepository,
} from "@core/modules/weekly-report/domain/parent-child-relationship.repository.js";
import {
	ParentChildRelationshipFinder,
	ProcessCorrectiveMaintenanceBatchCreator,
	ProcessParentChildBatchCreator,
} from "./ProcessParentChildBatchCreator.js";

/**
 * Weekly Report Service Container - Dependency Injection Container for Weekly Report module
 * This class manages the creation and configuration of use cases with their dependencies
 */
export class WeeklyReportService {
	/**
	 * Use case: Find all parent-child relationships
	 */
	async findAllRelationships(
		repository: ParentChildRelationshipRepository
	): Promise<ParentChildRelationship[]> {
		return new ParentChildRelationshipFinder(repository).execute();
	}

	/**
	 * Use case: Get aggregated relationships grouped by linked request ID
	 */
	async getAggregatedRelationships(
		repository: ParentChildRelationshipRepository
	): Promise<AggregatedRelationship[]> {
		return repository.getAggregatedByLinkedRequestId();
	}

	/**
	 * Use case: Parse parent-child Excel file and save relationships
	 */
	async parseParentChildExcel(deps: {
		fileBuffer: ArrayBuffer;
		fileName: string;
		repository: ParentChildRelationshipRepository;
		excelParser: ParentChildRelationshipExcelParser;
	}): Promise<ParentChildRelationshipExcelParseResult> {
		const processParentChildBatchCreator =
			new ProcessParentChildBatchCreator(
				deps.excelParser,
				deps.repository
			);

		const result = await processParentChildBatchCreator.execute({
			fileBuffer: deps.fileBuffer,
			fileName: deps.fileName,
		});

		return result;
	}

	/**
	 * Use case: Parse corrective maintenance Excel file and save records
	 */
	async parseCorrectiveMaintenanceExcel(deps: {
		fileBuffer: ArrayBuffer;
		fileName: string;
		repository: CorrectiveMaintenanceRecordRepository;
		excelParser: CorrectiveMaintenanceExcelParser;
	}): Promise<CorrectiveMaintenanceExcelParseResult> {
		const processCorrectiveMaintenanceBatchCreator =
			new ProcessCorrectiveMaintenanceBatchCreator(
				deps.excelParser,
				deps.repository
			);

		const result = await processCorrectiveMaintenanceBatchCreator.execute({
			fileBuffer: deps.fileBuffer,
			fileName: deps.fileName,
		});

		return result;
	}

	/**
	 * Use case: Find all corrective maintenance records
	 */
	async findAllCorrectiveMaintenanceRecords(
		repository: CorrectiveMaintenanceRecordRepository,
		businessUnit?: string
	): Promise<CorrectiveMaintenanceRecord[]> {
		if (businessUnit) {
			return repository.getByBusinessUnit(businessUnit);
		}
		return repository.getAll();
	}

	/**
	 * Use case: Find corrective maintenance records by filters
	 */
	async findCorrectiveMaintenanceRecordsByFilters(
		repository: CorrectiveMaintenanceRecordRepository,
		businessUnit: string,
		requestStatus?: string
	): Promise<CorrectiveMaintenanceRecord[]> {
		console.log(
			`WeeklyReportService: findCorrectiveMaintenanceRecordsByFilters called with businessUnit="${businessUnit}", requestStatus="${
				requestStatus || "undefined"
			}"`
		);
		return repository.getByBusinessUnitAndRequestStatus(
			businessUnit,
			requestStatus
		);
	}
}

/**
 * Factory function to create a configured WeeklyReportService instance
 * This follows the Dependency Injection pattern while providing a simple API
 */
export function createWeeklyReportService(): WeeklyReportService {
	return new WeeklyReportService();
}
