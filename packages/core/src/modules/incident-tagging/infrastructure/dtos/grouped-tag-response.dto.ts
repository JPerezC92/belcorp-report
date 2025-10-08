import { z } from "zod";

// Schema for RequestIdWithLink (reusable)
export const requestIdWithLinkSchema = z.object({
	requestId: z.string(),
	link: z.string().optional(),
});

// Schema for grouped tag data
export const groupedTagDataSchema = z.object({
	linkedRequestId: z.object({
		value: z.string(),
		link: z.string().optional(),
	}),
	categorizations: z.array(z.string()),
	additionalInfoList: z.array(z.string()),
});

export type GroupedTagData = z.infer<typeof groupedTagDataSchema>;

// Schema for the full response including reverse lookup maps (nested by linkedRequestId)
export const groupedTagResponseSchema = z.object({
	groupedData: z.array(groupedTagDataSchema),
	categorizationToRequestIds: z.record(
		z.string(), // linkedRequestId
		z.record(z.string(), z.array(requestIdWithLinkSchema)) // categorization -> RequestIdWithLink[]
	),
	additionalInfoToRequestIds: z.record(
		z.string(), // linkedRequestId
		z.record(z.string(), z.array(requestIdWithLinkSchema)) // additionalInfo -> RequestIdWithLink[]
	),
});

export type GroupedTagResponse = z.infer<typeof groupedTagResponseSchema>;

// Export array schema for validation
export const groupedTagDataArraySchema = z.array(groupedTagDataSchema);
export type GroupedTagDataArray = z.infer<typeof groupedTagDataArraySchema>;
