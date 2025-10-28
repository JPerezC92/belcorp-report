import { LevelMapping } from "../../domain/level-mapping.entity.js";
import type { LevelMappingDto } from "../dtos/level-mapping.dto.js";

export function levelMappingDtoToDomain(dto: LevelMappingDto): LevelMapping {
	return new LevelMapping(
		dto.requestStatusReporte,
		dto.level,
		new Date(dto.createdAt),
		new Date(dto.updatedAt),
	);
}
