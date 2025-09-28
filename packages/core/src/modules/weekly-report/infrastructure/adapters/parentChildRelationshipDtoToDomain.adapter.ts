import { ParentChildRelationship } from "@core/modules/weekly-report/domain/parent-child-relationship.js";
import type { ParentChildRelationshipExcelDto } from "@core/modules/weekly-report/infrastructure/dtos/parent-child-relationship-excel.dto.js";

export function parentChildRelationshipDtoToDomain(
	dto: ParentChildRelationshipExcelDto
): ParentChildRelationship | null {
	const parentRequestId = dto["Request ID"].value.trim();
	const childRequestId = dto["Linked Request Id"].value.trim();

	// Skip rows with empty required fields
	if (!parentRequestId || !childRequestId) {
		return null;
	}

	const createData: {
		parentRequestId: string;
		parentLink?: string;
		childRequestId: string;
		childLink?: string;
	} = {
		parentRequestId,
		childRequestId,
	};

	if (dto["Request ID"].link) {
		createData.parentLink = dto["Request ID"].link;
	}

	if (dto["Linked Request Id"].link) {
		createData.childLink = dto["Linked Request Id"].link;
	}

	return ParentChildRelationship.create(createData);
}
