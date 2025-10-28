import type { LevelMapping } from "../../domain/level-mapping.entity.js";
import type { LevelMappingDto } from "../dtos/level-mapping.dto.js";

export function levelMappingDomainToDto(mapping: LevelMapping): LevelMappingDto {
	return {
		requestStatusReporte: mapping.requestStatusReporte,
		level: mapping.level as "L2" | "L3" | "Unknown",
		createdAt: mapping.createdAt.toISOString(),
		updatedAt: mapping.updatedAt.toISOString(),
	};
}
