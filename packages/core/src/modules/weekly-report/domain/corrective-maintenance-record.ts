// Domain Entity for Corrective Maintenance Records
export class CorrectiveMaintenanceRecord {
	constructor(
		public readonly requestId: string,
		public readonly requestIdLink: string | undefined,
		public readonly createdTime: string,
		public readonly applications: string,
		public readonly categorization: string,
		public readonly requestStatus: string,
		public readonly module: string,
		public readonly subject: string,
		public readonly subjectLink: string | undefined,
		public readonly priority: string,
		public readonly enlaces: number,
		public readonly eta: string,
		public readonly rca: string,
		public readonly businessUnit: string,
		public readonly createdAt: Date,
		public readonly updatedAt: Date
	) {}

	static create(data: {
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
	}): CorrectiveMaintenanceRecord {
		const now = new Date();
		return new CorrectiveMaintenanceRecord(
			data.requestId,
			data.requestIdLink,
			data.createdTime,
			data.applications,
			data.categorization,
			data.requestStatus,
			data.module,
			data.subject,
			data.subjectLink,
			data.priority,
			data.enlaces || 0,
			data.eta,
			data.rca,
			data.businessUnit,
			now,
			now
		);
	}
}
