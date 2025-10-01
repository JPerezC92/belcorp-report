import { CorrectiveMaintenanceRecord } from "@core/modules/weekly-report/domain/corrective-maintenance-record.js";
import type { CorrectiveMaintenanceRecordDbModel } from "@core/modules/weekly-report/infrastructure/models/corrective-maintenance-record-db.model.js";

export function correctiveMaintenanceRecordDbModelToDomain(
	model: CorrectiveMaintenanceRecordDbModel,
	enlaces: number = 0
): CorrectiveMaintenanceRecord {
	const createData: {
		requestId: string;
		requestIdLink?: string;
		createdTime: string;
		applications: string;
		categorization: string;
		requestStatus: string;
		module: string;
		subject: string;
		subjectLink?: string;
		priority: string;
		enlaces?: number;
		eta: string;
		rca: string;
		businessUnit: string;
		inDateRange: boolean;
	} = {
		requestId: model.requestId,
		createdTime: model.createdTime,
		applications: model.applications,
		categorization: model.categorization,
		requestStatus: model.requestStatus,
		module: model.module,
		subject: model.subject,
		priority: model.priority,
		enlaces: enlaces,
		eta: model.eta,
		rca: model.rca,
		businessUnit: model.businessUnit,
		inDateRange: model.inDateRange === 1, // Convert SQLite integer (0/1) to boolean
	};

	if (model.requestIdLink) {
		createData.requestIdLink = model.requestIdLink;
	}

	if (model.subjectLink) {
		createData.subjectLink = model.subjectLink;
	}

	return CorrectiveMaintenanceRecord.create(createData);
}
