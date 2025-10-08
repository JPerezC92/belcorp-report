// Domain Entity for War Room Records
export class WarRoomRecord {
	constructor(
		public readonly application: string,
		public readonly date: string,
		public readonly incidentId: string,
		public readonly incidentIdLink: string | null,
		public readonly summary: string,
		public readonly initialPriority: string,
		public readonly startTime: string,
		public readonly durationMinutes: number,
		public readonly endTime: string,
		public readonly participants: number,
		public readonly status: string,
		public readonly priorityChanged: string,
		public readonly resolutionTeamChanged: string,
		public readonly notes: string,
		public readonly rcaStatus: string | null,
		public readonly urlRca: string | null,
		public readonly createdAt: Date,
		public readonly updatedAt: Date
	) {}

	static create(data: {
		application: string;
		date: string;
		incidentId: string;
		incidentIdLink: string | null;
		summary: string;
		initialPriority: string;
		startTime: string;
		durationMinutes: number;
		endTime: string;
		participants: number;
		status: string;
		priorityChanged: string;
		resolutionTeamChanged: string;
		notes: string;
		rcaStatus: string | null;
		urlRca: string | null;
	}): WarRoomRecord {
		const now = new Date();
		return new WarRoomRecord(
			data.application,
			data.date,
			data.incidentId,
			data.incidentIdLink,
			data.summary,
			data.initialPriority,
			data.startTime,
			data.durationMinutes,
			data.endTime,
			data.participants,
			data.status,
			data.priorityChanged,
			data.resolutionTeamChanged,
			data.notes,
			data.rcaStatus,
			data.urlRca,
			now,
			now
		);
	}
}
