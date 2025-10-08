import { WarRoomRecord } from "@core/modules/war-rooms/domain/war-room-record.js";
import type { WarRoomRecordDbModel } from "@core/modules/war-rooms/infrastructure/models/war-room-record-db.model.js";

export function warRoomDbModelToDomain(
	model: WarRoomRecordDbModel
): WarRoomRecord {
	return new WarRoomRecord(
		model.application,
		model.date,
		model.incidentId,
		model.incidentIdLink,
		model.summary,
		model.initialPriority,
		model.startTime,
		model.durationMinutes,
		model.endTime,
		model.participants,
		model.status,
		model.priorityChanged,
		model.resolutionTeamChanged,
		model.notes,
		model.rcaStatus,
		model.urlRca,
		new Date(model.createdAt),
		new Date(model.updatedAt)
	);
}
