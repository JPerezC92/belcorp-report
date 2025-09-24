// Value Objects
export class LinkedValue {
	constructor(
		public readonly value: string,
		public readonly link: string | undefined
	) {}

	static create(data: { value: string; link?: string }): LinkedValue {
		return new LinkedValue(data.value, data.link);
	}

	toString(): string {
		return this.value;
	}

	hasLink(): boolean {
		return this.link !== undefined && this.link !== "";
	}
}

// Domain Entity
export class Tag {
	constructor(
		public readonly requestId: string,
		public readonly createdTime: string,
		public readonly requestIdLink: string | undefined,
		public readonly informacionAdicional: string,
		public readonly modulo: string,
		public readonly problemId: string,
		public readonly problemIdLink: string | undefined,
		public readonly linkedRequestId: string,
		public readonly linkedRequestIdLink: string | undefined,
		public readonly jira: string,
		public readonly categorizacion: string,
		public readonly technician: string,
		public readonly createdAt: Date,
		public readonly updatedAt: Date
	) {}

	static create(data: {
		createdTime: string;
		requestId: string;
		requestIdLink?: string;
		informacionAdicional: string;
		modulo: string;
		problemId: string;
		problemIdLink?: string;
		linkedRequestId: string;
		linkedRequestIdLink?: string;
		jira: string;
		categorizacion: string;
		technician: string;
	}): Tag {
		const now = new Date();
		return new Tag(
			data.requestId,
			data.createdTime,
			data.requestIdLink,
			data.informacionAdicional,
			data.modulo,
			data.problemId,
			data.problemIdLink,
			data.linkedRequestId,
			data.linkedRequestIdLink,
			data.jira,
			data.categorizacion,
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
		return `${this.requestId} - ${this.modulo}`;
	}
}
