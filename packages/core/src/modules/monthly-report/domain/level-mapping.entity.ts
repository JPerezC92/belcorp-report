/**
 * Level Mapping Entity
 * Maps requestStatusReporte values to incident levels (L2, L3, Unknown)
 */
export class LevelMapping {
	constructor(
		public readonly requestStatusReporte: string,
		public readonly level: string,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}

	static create(data: {
		requestStatusReporte: string;
		level: string;
	}): LevelMapping {
		const now = new Date();
		return new LevelMapping(
			data.requestStatusReporte,
			data.level,
			now,
			now,
		);
	}

	update(level: string): LevelMapping {
		return new LevelMapping(
			this.requestStatusReporte,
			level,
			this.createdAt,
			new Date(),
		);
	}
}
