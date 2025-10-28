/**
 * SB Operational Stability Release Entity
 * Represents a software release/deployment from the SB operational data
 */
export class SBRelease {
	private constructor(
		public readonly id: number | null,
		public readonly week: number | null,
		public readonly application: string,
		public readonly date: string,
		public readonly releaseVersion: string,
		public readonly releaseLink: string | null,
		public readonly tickets: string | null,
		public readonly createdAt: string,
		public readonly updatedAt: string,
	) {}

	/**
	 * Factory method to create a new SBRelease instance
	 */
	static create(params: {
		id?: number | null;
		week?: number | null;
		application: string;
		date: string;
		releaseVersion: string;
		releaseLink?: string | null;
		tickets?: string | null;
		createdAt?: string;
		updatedAt?: string;
	}): SBRelease {
		const now = new Date().toISOString();

		return new SBRelease(
			params.id ?? null,
			params.week ?? null,
			params.application,
			params.date,
			params.releaseVersion,
			params.releaseLink ?? null,
			params.tickets ?? null,
			params.createdAt ?? now,
			params.updatedAt ?? now,
		);
	}

	/**
	 * Create a copy of this entity with updated fields
	 */
	update(params: Partial<{
		week: number | null;
		application: string;
		date: string;
		releaseVersion: string;
		releaseLink: string | null;
		tickets: string | null;
	}>): SBRelease {
		return new SBRelease(
			this.id,
			params.week ?? this.week,
			params.application ?? this.application,
			params.date ?? this.date,
			params.releaseVersion ?? this.releaseVersion,
			params.releaseLink ?? this.releaseLink,
			params.tickets ?? this.tickets,
			this.createdAt,
			new Date().toISOString(),
		);
	}

	/**
	 * Convert to plain object for serialization
	 */
	toObject(): {
		id: number | null;
		week: number | null;
		application: string;
		date: string;
		releaseVersion: string;
		releaseLink: string | null;
		tickets: string | null;
		createdAt: string;
		updatedAt: string;
	} {
		return {
			id: this.id,
			week: this.week,
			application: this.application,
			date: this.date,
			releaseVersion: this.releaseVersion,
			releaseLink: this.releaseLink,
			tickets: this.tickets,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}
