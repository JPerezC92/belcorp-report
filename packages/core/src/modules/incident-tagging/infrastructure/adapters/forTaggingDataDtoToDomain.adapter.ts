import { ForTaggingData } from "../../domain/for-tagging-data-excel-parser.js";
import type { ForTaggingDataExcelDto } from "../dtos/for-tagging-data-excel.dto.js";

export function forTaggingDataDtoToDomain(
	dto: ForTaggingDataExcelDto
): ForTaggingData {
	return ForTaggingData.create({
		technician: dto.technician,
		requestId: dto.requestId,
		requestIdLink: dto.requestIdLink,
		createdTime: dto.createdTime,
		module: dto.module,
		subject: dto.subject,
		subjectLink: dto.subjectLink,
		problemId: dto.problemId,
		problemIdLink: dto.problemIdLink,
		linkedRequestId: dto.linkedRequestId,
		linkedRequestIdLink: dto.linkedRequestIdLink,
		category: dto.category,
	});
}
