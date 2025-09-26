// Domain Entity
export class Tag {
	constructor(
		public readonly requestId: string,
		public readonly createdTime: string,
		public readonly requestIdLink: string | undefined,
		public readonly additionalInfo: string,
		public readonly module: string,
		public readonly problemId: string,
		public readonly problemIdLink: string | undefined,
		public readonly linkedRequestId: string,
		public readonly linkedRequestIdLink: string | undefined,
		public readonly jira: string,
		public readonly categorization: string,
		public readonly technician: string,
		public readonly createdAt: Date,
		public readonly updatedAt: Date
	) {}

	static create(data: {
		createdTime: string;
		requestId: string;
		requestIdLink?: string;
		additionalInfo: string;
		module: string;
		problemId: string;
		problemIdLink?: string;
		linkedRequestId: string;
		linkedRequestIdLink?: string;
		jira: string;
		categorization: string;
		technician: string;
	}): Tag {
		const now = new Date();
		return new Tag(
			data.requestId,
			data.createdTime,
			data.requestIdLink,
			data.additionalInfo,
			data.module,
			data.problemId,
			data.problemIdLink,
			data.linkedRequestId,
			data.linkedRequestIdLink,
			data.jira,
			data.categorization,
			data.technician,
			now,
			now
		);
	}

	// Business logic methods
	isAssignedToTechnician(technicianName: string): boolean {
		return this.technician.toLowerCase() === technicianName.toLowerCase();
	}

	hasJiraTicket(): boolean {
		return this.jira.trim() !== "";
	}

	isLinkedToRequest(): boolean {
		return this.linkedRequestId.trim() !== "";
	}

	getDisplayTitle(): string {
		return `${this.requestId} - ${this.module}`;
	}
}
