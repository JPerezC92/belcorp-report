import type {
	CorrectiveMaintenanceExcelParseResult,
	CorrectiveMaintenanceExcelParser,
} from "@core/modules/weekly-report/domain/corrective-maintenance-excel-parser.js";
import type { CorrectiveMaintenanceRecordRepository } from "@core/modules/weekly-report/domain/corrective-maintenance-record.repository.js";
import type {
	ParentChildRelationshipExcelParseResult,
	ParentChildRelationshipExcelParser,
} from "@core/modules/weekly-report/domain/parent-child-excel-parser.js";
import type { ParentChildRelationship } from "@core/modules/weekly-report/domain/parent-child-relationship.js";
import type { ParentChildRelationshipRepository } from "@core/modules/weekly-report/domain/parent-child-relationship.repository.js";
import type { SemanalDateRange } from "@core/modules/weekly-report/domain/semanal-date-range.js";

/**
 * Use case: Find all parent-child relationships
 */
export class ParentChildRelationshipFinder {
	constructor(
		private readonly repository: ParentChildRelationshipRepository
	) {}

	async execute(): Promise<ParentChildRelationship[]> {
		return this.repository.getAll();
	}
}

/**
 * Use case: Process parent-child Excel file and save relationships
 */
export class ProcessParentChildBatchCreator {
	constructor(
		private readonly excelParser: ParentChildRelationshipExcelParser,
		private readonly repository: ParentChildRelationshipRepository
	) {}

	async execute(deps: {
		fileBuffer: ArrayBuffer;
		fileName: string;
	}): Promise<ParentChildRelationshipExcelParseResult> {
		await this.repository.drop();

		const parseResult = await this.excelParser.parseExcel(
			deps.fileBuffer,
			deps.fileName
		);

		if (parseResult.success && parseResult.sheet) {
			await this.repository.saveBatch(parseResult.sheet.rows);
		}

		return parseResult;
	}
}

/**
 * Use case: Process corrective maintenance Excel file and save records
 */
export class ProcessCorrectiveMaintenanceBatchCreator {
	constructor(
		private readonly excelParser: CorrectiveMaintenanceExcelParser,
		private readonly repository: CorrectiveMaintenanceRecordRepository
	) {}

	async execute(deps: {
		fileBuffer: ArrayBuffer;
		fileName: string;
		semanalDateRange?: SemanalDateRange | null;
	}): Promise<CorrectiveMaintenanceExcelParseResult> {
		await this.repository.drop();

		const parseResult = await this.excelParser.parseExcel(
			deps.fileBuffer,
			deps.fileName,
			deps.semanalDateRange
		);

		if (parseResult.success && parseResult.sheet) {
			await this.repository.saveBatch(parseResult.sheet.rows);
		}

		return parseResult;
	}
}
