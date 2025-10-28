import { SBRelease } from "../../domain/release.entity.js";
import type { SBReleaseDto } from "../dtos/release.dto.js";

/**
 * Adapter to convert SBReleaseDto to SBRelease domain entity
 */
export function releaseDtoToDomain(dto: SBReleaseDto): SBRelease {
	return SBRelease.create({
		week: dto.week,
		application: dto.application,
		date: dto.date,
		releaseVersion: dto.releaseVersion,
		releaseLink: dto.releaseLink,
		tickets: dto.tickets,
	});
}

/**
 * Adapter to convert multiple SBReleaseDto to SBRelease domain entities
 */
export function releaseDtosToDomain(dtos: SBReleaseDto[]): SBRelease[] {
	return dtos.map(releaseDtoToDomain);
}
