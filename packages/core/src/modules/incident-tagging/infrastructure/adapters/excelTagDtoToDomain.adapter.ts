import { Tag } from "@core/modules/incident-tagging/domain/tag.js";
import type { ExcelTagDto } from "@core/modules/incident-tagging/infrastructure/dtos/excel-tag.dto.js";
import type { TagResponseDto } from "@core/modules/incident-tagging/infrastructure/dtos/tag-response.dto.js";

export function excelTagDtoToDomain(dto: ExcelTagDto): Tag {
	return Tag.create({
		createdTime: dto.createdTime,
		requestId: dto.requestId.value,
		requestIdLink: dto.requestId.link,
		informacionAdicional: dto.informacionAdicional,
		modulo: dto.modulo,
		problemId: dto.problemId.value,
		problemIdLink: dto.problemId.link,
		linkedRequestId: dto.linkedRequestId.value,
		linkedRequestIdLink: dto.linkedRequestId.link,
		jira: dto.jira,
		categorizacion: dto.categorizacion,
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
		informacionAdicional: tag.informacionAdicional,
		modulo: tag.modulo,
		problemId: {
			value: tag.problemId,
			link: tag.problemIdLink,
		},
		linkedRequestId: {
			value: tag.linkedRequestId,
			link: tag.linkedRequestIdLink,
		},
		jira: tag.jira,
		categorizacion: tag.categorizacion,
		technician: tag.technician,
	};
}
