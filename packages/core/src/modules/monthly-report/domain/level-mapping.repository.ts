import type { LevelMapping } from "./level-mapping.entity.js";

export interface LevelMappingRepository {
	findAll(): Promise<LevelMapping[]>;
	findByRequestStatus(requestStatusReporte: string): Promise<LevelMapping | null>;
	create(mapping: LevelMapping): Promise<void>;
	update(mapping: LevelMapping): Promise<void>;
	delete(requestStatusReporte: string): Promise<void>;
}
