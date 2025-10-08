import type { TagRepository } from "@core/modules/incident-tagging/domain/tag.repository.js";
import type { RequestIdWithLink } from "@core/modules/incident-tagging/domain/for-tagging-data-excel-parser.js";
import type {
	GroupedTagData,
	GroupedTagResponse,
} from "@core/modules/incident-tagging/infrastructure/dtos/grouped-tag-response.dto.js";

export class TagGrouper {
	constructor(private tagRepository: TagRepository) {}

	/**
	 * Groups tags by linkedRequestId and creates reverse lookup maps for
	 * categorization and additional info drill-down functionality.
	 */
	async groupByLinkedRequestId(): Promise<GroupedTagResponse> {
		const allTags = await this.tagRepository.getAll();

		// Group by linkedRequestId
		const groupMap = new Map<
			string,
			{
				linkedRequestId: { value: string; link?: string };
				categorizations: Set<string>;
				additionalInfoList: Set<string>;
			}
		>();

		// Reverse lookup maps (nested by linkedRequestId)
		const categorizationToRequestIds = new Map<string, Map<string, RequestIdWithLink[]>>();
		const additionalInfoToRequestIds = new Map<string, Map<string, RequestIdWithLink[]>>();

		for (const tag of allTags) {
			const linkedReqId = tag.linkedRequestId;
			const linkedReqLink = tag.linkedRequestIdLink;

			// Skip records with "No asignado" linkedRequestId
			if (linkedReqId === "No asignado") {
				continue;
			}

			// Initialize group if not exists
			if (!groupMap.has(linkedReqId)) {
				const linkObj: { value: string; link?: string } = { value: linkedReqId };
				if (linkedReqLink) {
					linkObj.link = linkedReqLink;
				}
				groupMap.set(linkedReqId, {
					linkedRequestId: linkObj,
					categorizations: new Set<string>(),
					additionalInfoList: new Set<string>(),
				});
			}

			const group = groupMap.get(linkedReqId)!;

			// Add categorization
			if (tag.categorization && tag.categorization.trim() !== "") {
				group.categorizations.add(tag.categorization);

				// Build reverse lookup for categorization (nested by linkedRequestId)
				if (!categorizationToRequestIds.has(linkedReqId)) {
					categorizationToRequestIds.set(linkedReqId, new Map<string, RequestIdWithLink[]>());
				}
				const categMap = categorizationToRequestIds.get(linkedReqId)!;
				if (!categMap.has(tag.categorization)) {
					categMap.set(tag.categorization, []);
				}
				const categRequestIdObj: RequestIdWithLink = {
					requestId: tag.requestId,
				};
				if (tag.requestIdLink) {
					categRequestIdObj.link = tag.requestIdLink;
				}
				categMap.get(tag.categorization)!.push(categRequestIdObj);
			}

			// Add additional info
			if (tag.additionalInfo && tag.additionalInfo.trim() !== "") {
				group.additionalInfoList.add(tag.additionalInfo);

				// Build reverse lookup for additional info (nested by linkedRequestId)
				if (!additionalInfoToRequestIds.has(linkedReqId)) {
					additionalInfoToRequestIds.set(linkedReqId, new Map<string, RequestIdWithLink[]>());
				}
				const addInfoMap = additionalInfoToRequestIds.get(linkedReqId)!;
				if (!addInfoMap.has(tag.additionalInfo)) {
					addInfoMap.set(tag.additionalInfo, []);
				}
				const additionalInfoRequestIdObj: RequestIdWithLink = {
					requestId: tag.requestId,
				};
				if (tag.requestIdLink) {
					additionalInfoRequestIdObj.link = tag.requestIdLink;
				}
				addInfoMap.get(tag.additionalInfo)!.push(additionalInfoRequestIdObj);
			}
		}

		// Convert to array format
		const groupedData: GroupedTagData[] = Array.from(groupMap.values()).map(
			(group) => ({
				linkedRequestId: group.linkedRequestId,
				categorizations: Array.from(group.categorizations),
				additionalInfoList: Array.from(group.additionalInfoList),
			}),
		);

		// Convert nested maps to plain objects for serialization
		const categorizationToRequestIdsObj: Record<
			string,
			Record<string, RequestIdWithLink[]>
		> = {};
		for (const [linkedReqId, innerMap] of categorizationToRequestIds.entries()) {
			categorizationToRequestIdsObj[linkedReqId] = {};
			for (const [categorization, requestIds] of innerMap.entries()) {
				categorizationToRequestIdsObj[linkedReqId][categorization] = requestIds;
			}
		}

		const additionalInfoToRequestIdsObj: Record<
			string,
			Record<string, RequestIdWithLink[]>
		> = {};
		for (const [linkedReqId, innerMap] of additionalInfoToRequestIds.entries()) {
			additionalInfoToRequestIdsObj[linkedReqId] = {};
			for (const [additionalInfo, requestIds] of innerMap.entries()) {
				additionalInfoToRequestIdsObj[linkedReqId][additionalInfo] = requestIds;
			}
		}

		return {
			groupedData,
			categorizationToRequestIds: categorizationToRequestIdsObj,
			additionalInfoToRequestIds: additionalInfoToRequestIdsObj,
		};
	}
}
