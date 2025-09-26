import {
	EnrichedForTaggingData,
	type ForTaggingData,
	type RequestIdWithLink,
} from "../domain/for-tagging-data-excel-parser.js";
import type { TagRepository } from "../domain/tag.repository.js";

export interface EnrichmentResult {
	enrichedData: EnrichedForTaggingData[];
	additionalInfoToRequestIds: Map<string, RequestIdWithLink[]>;
}

export class ForTaggingDataEnrichmentService {
	constructor(
		private readonly deps: {
			tagRepository: TagRepository;
		}
	) {}

	async enrich(forTaggingData: ForTaggingData[]): Promise<EnrichmentResult> {
		const enrichedData: EnrichedForTaggingData[] = [];
		const additionalInfoToRequestIds = new Map<
			string,
			RequestIdWithLink[]
		>();

		console.log(
			`🔍 Starting enrichment for ${forTaggingData.length} records`
		);

		for (const data of forTaggingData) {
			if (
				data.linkedRequestId &&
				data.linkedRequestId !== "No asignado"
			) {
				console.log(
					`📋 Processing record with linkedRequestId: ${data.linkedRequestId}`
				);

				// Find matching Tag records by linkedRequestId
				const matchingTags =
					await this.deps.tagRepository.findByLinkedRequestId(
						data.linkedRequestId
					);

				console.log(
					`🔗 Found ${matchingTags.length} matching tags for linkedRequestId: ${data.linkedRequestId}`
				);

				if (matchingTags.length > 0) {
					// Log the additionalInfo from each tag
					matchingTags.forEach((tag, index) => {
						console.log(
							`📝 Tag ${index + 1} additionalInfo: "${
								tag.additionalInfo
							}"`
						);
					});

					// Create enriched ForTaggingData with all matching tags
					const enriched = EnrichedForTaggingData.create(
						data,
						matchingTags
					);
					enrichedData.push(enriched);

					// Build global mapping of additional info to request IDs
					enriched.additionalInfo.forEach((info) => {
						if (!additionalInfoToRequestIds.has(info)) {
							additionalInfoToRequestIds.set(info, []);
						}
						const requestIdWithLinks =
							additionalInfoToRequestIds.get(info);
						if (requestIdWithLinks) {
							// Find all Tag records that have this additionalInfo and add their requestIds with links
							matchingTags
								.filter((tag) => tag.additionalInfo === info)
								.forEach((tag) => {
									const existing = requestIdWithLinks.find(
										(r) => r.requestId === tag.requestId
									);
									if (!existing) {
										const requestIdWithLink: RequestIdWithLink =
											{
												requestId: tag.requestId,
											};
										if (tag.requestIdLink) {
											requestIdWithLink.link =
												tag.requestIdLink;
										}
										requestIdWithLinks.push(
											requestIdWithLink
										);
									}
								});
						}
					});

					console.log(
						`✅ Enriched record with ${enriched.additionalInfo.length} additionalInfo items`
					);
				} else {
					// No matching tag found, keep original
					console.log(
						`❌ No matching tags found for linkedRequestId: ${data.linkedRequestId}`
					);
					const enriched = EnrichedForTaggingData.create(data);
					enrichedData.push(enriched);
				}
			} else {
				// No linkedRequestId or "No asignado", keep original
				const reason = !data.linkedRequestId
					? "no linkedRequestId"
					: "linkedRequestId is 'No asignado'";
				console.log(
					`⏭️ Skipping record (Request ID: ${data.requestId}) - ${reason}`
				);
				enrichedData.push(EnrichedForTaggingData.create(data));
			}
		}

		console.log(
			`📊 Enrichment complete: ${enrichedData.length} records processed`
		);
		console.log(
			`📋 Additional info mapping: ${additionalInfoToRequestIds.size} unique additional info items`
		);

		return {
			enrichedData,
			additionalInfoToRequestIds,
		};
	}
}
