// Domain Entity
export class ParentChildRelationship {
	constructor(
		public readonly parentRequestId: string,
		public readonly parentLink: string | undefined,
		public readonly childRequestId: string,
		public readonly childLink: string | undefined,
		public readonly createdAt: Date,
		public readonly updatedAt: Date
	) {}

	static create(data: {
		parentRequestId: string;
		parentLink?: string;
		childRequestId: string;
		childLink?: string;
	}): ParentChildRelationship {
		const now = new Date();
		return new ParentChildRelationship(
			data.parentRequestId,
			data.parentLink,
			data.childRequestId,
			data.childLink,
			now,
			now
		);
	}
}
