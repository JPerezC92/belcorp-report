import { SBRelease } from "../../domain/release.entity.js";
import type { SBReleaseDbModel } from "../dtos/release.dto.js";

/**
 * Adapter to convert SBReleaseDbModel to SBRelease domain entity
 */
export function releaseDbModelToDomain(dbModel: SBReleaseDbModel): SBRelease {
	return SBRelease.create({
		id: dbModel.id,
		week: dbModel.week,
		application: dbModel.application,
		date: dbModel.date,
		releaseVersion: dbModel.releaseVersion,
		releaseLink: dbModel.releaseLink,
		tickets: dbModel.tickets,
		createdAt: dbModel.createdAt,
		updatedAt: dbModel.updatedAt,
	});
}

/**
 * Adapter to convert multiple SBReleaseDbModel to SBRelease domain entities
 */
export function releaseDbModelsToDomain(
	dbModels: SBReleaseDbModel[],
): SBRelease[] {
	return dbModels.map(releaseDbModelToDomain);
}
