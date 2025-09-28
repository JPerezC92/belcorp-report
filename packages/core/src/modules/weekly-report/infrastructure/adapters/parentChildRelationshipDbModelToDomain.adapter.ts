import { ParentChildRelationship } from "@core/modules/weekly-report/domain/parent-child-relationship.js";
import type { ParentChildRelationshipDbModel } from "@core/modules/weekly-report/infrastructure/models/parent-child-relationship-db.model.js";

export function parentChildRelationshipDbModelToDomain(
	model: ParentChildRelationshipDbModel
): ParentChildRelationship {
	const createData: {
		parentRequestId: string;
		parentLink?: string;
		childRequestId: string;
		childLink?: string;
	} = {
		parentRequestId: model.parentRequestId,
		childRequestId: model.childRequestId,
	};

	if (model.parentLink) {
		createData.parentLink = model.parentLink;
	}

	if (model.childLink) {
		createData.childLink = model.childLink;
	}

	return ParentChildRelationship.create(createData);
}
