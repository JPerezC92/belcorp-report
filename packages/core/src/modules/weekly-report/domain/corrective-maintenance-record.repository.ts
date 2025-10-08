import type { CorrectiveMaintenanceRecord } from "./corrective-maintenance-record.js";

export interface CorrectiveMaintenanceRecordRepository {
	saveBatch(records: CorrectiveMaintenanceRecord[]): Promise<void>;
	getAll(): Promise<CorrectiveMaintenanceRecord[]>;
	getByBusinessUnit(
		businessUnit: string
	): Promise<CorrectiveMaintenanceRecord[]>;
	getByBusinessUnitAndRequestStatus(
		businessUnit: string,
		requestStatus?: string
	): Promise<CorrectiveMaintenanceRecord[]>;
	getDistinctRequestStatuses(): Promise<string[]>;
	getDistinctBusinessUnits(): Promise<string[]>;
	drop(): Promise<void>;
	findByRequestId(requestId: string): Promise<CorrectiveMaintenanceRecord[]>;
	findByModule(module: string): Promise<CorrectiveMaintenanceRecord[]>;
}
