import { Tag } from "@core/modules/incident-tagging/domain/tag.js";
import type { ExcelTagDto } from "@core/modules/incident-tagging/infrastructure/dtos/excel-tag.dto.js";
import type { TagResponseDto } from "@core/modules/incident-tagging/infrastructure/dtos/tag-response.dto.js";

export function excelTagDtoToDomain(dto: ExcelTagDto): Tag {
	return Tag.create({
		createdTime: dto.createdTime,
		requestId: dto.requestId.value,
		requestIdLink: dto.requestId.link,
		additionalInfo: dto.additionalInfo,
		module: dto.module,
		problemId: dto.problemId.value,
		problemIdLink: dto.problemId.link,
		linkedRequestId: dto.linkedRequestId.value,
		linkedRequestIdLink: dto.linkedRequestId.link,
		jira: dto.jira,
		categorization: dto.categorization,
		technician: dto.technician,
	});
}

export function tagDomainToResponse(tag: Tag): TagResponseDto {
	return {
		id: tag.requestId,
		createdTime: tag.createdTime,
		requestId: {
			value: tag.requestId,
			link: tag.requestIdLink,
		},
		additionalInfo: tag.additionalInfo,
		module: tag.module,
		problemId: {
			value: tag.problemId,
			link: tag.problemIdLink,
		},
		linkedRequestId: {
			value: tag.linkedRequestId,
			link: tag.linkedRequestIdLink,
		},
		jira: tag.jira,
		categorization: tag.categorization,
		technician: tag.technician,
	};
}
