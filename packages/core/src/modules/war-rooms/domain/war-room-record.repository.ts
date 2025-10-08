import type { WarRoomRecord } from "./war-room-record.js";

export interface WarRoomRecordRepository {
	saveBatch(records: WarRoomRecord[]): Promise<void>;
	getAll(): Promise<WarRoomRecord[]>;
	getByApplication(application: string): Promise<WarRoomRecord[]>;
	getDistinctApplications(): Promise<string[]>;
	drop(): Promise<void>;
}
