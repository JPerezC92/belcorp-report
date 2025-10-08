import { WarRoomRecord } from "@core/modules/war-rooms/domain/war-room-record.js";
import type { WarRoomExcelDto } from "@core/modules/war-rooms/infrastructure/dtos/war-room-excel.dto.js";

export function warRoomDtoToDomain(dto: WarRoomExcelDto): WarRoomRecord | null {
	try {
		return WarRoomRecord.create({
			application: dto.Application,
			date: dto.Date,
			incidentId: dto["Incident ID"].value,
			incidentIdLink: dto["Incident ID"].link ?? null,
			summary: dto.Summary,
			initialPriority: dto["Initial Priority"],
			startTime: dto["Start Time"],
			durationMinutes: dto["Duration (Minutes)"],
			endTime: dto["End Time"],
			participants: dto.Participants,
			status: dto.Status,
			priorityChanged: dto["Priority Changed"],
			resolutionTeamChanged: dto["Resolution team changed"],
			notes: dto.Notes,
			rcaStatus: dto["RCA Status"],
			urlRca: dto["URL RCA"],
		});
	} catch (error) {
		console.error("Error converting War Room DTO to domain:", error);
		return null;
	}
}
