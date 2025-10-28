import type { LevelMappingRepository } from "@app/core";

export class LevelMappingService {
	private mappings: Map<string, string> = new Map();

	constructor(private repository: LevelMappingRepository) {}

	async loadMappings(): Promise<void> {
		const allMappings = await this.repository.findAll();
		this.mappings.clear();
		for (const mapping of allMappings) {
			this.mappings.set(mapping.requestStatusReporte, mapping.level);
		}
	}

	async mapLevel(requestStatusReporte: string): Promise<string> {
		// Load mappings if not loaded
		if (this.mappings.size === 0) {
			await this.loadMappings();
		}

		return this.mappings.get(requestStatusReporte) || "Unknown";
	}
}
