import { Tag } from "@core/modules/incident-tagging/domain/tag.js";
import type { TagDbModel } from "@core/modules/incident-tagging/infrastructure/models/tag-db.model.js";

export function tagDbModelToDomain(model: TagDbModel): Tag {
	return new Tag(
		model.requestId,
		model.createdTime,
		model.requestIdLink,
		model.additionalInfo,
		model.module,
		model.problemId,
		model.problemIdLink,
		model.linkedRequestIdValue,
		model.linkedRequestIdLink,
		model.jira,
		model.categorization,
		model.technician,
		new Date(model.processedAt || ""),
		new Date(model.processedAt || "")
	);
}
