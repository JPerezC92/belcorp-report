import { z } from "zod";

const headerLabels = {
	technician: "Technician",
	requestId: "Request ID",
	createdTime: "Created Time",
	module: "Modulo.",
	subject: "Subject",
	problemId: "Problem ID",
	linkedRequestId: "Linked Request Id",
	category: "Category",
} as const;

// Helper for handling rich text or string values
const stringOrRichText = z
	.union([
		z.string(),
		z
			.object({
				richText: z.array(z.object({ text: z.unknown() })).optional(),
			})
			.transform((val) => {
				if (!val?.richText) return "";
				return val.richText
					.map((rt) => {
						const text = rt.text;
						return typeof text === "string"
							? text
							: String(text ?? "");
					})
					.join("");
			}),
	])
	.transform((val) => {
		if (typeof val === "string") return val;
		return typeof val === "object" && val !== null ? String(val) : "";
	});

// Helper for link columns (object with value and link)
const linkColumn = z.object({
	value: z.union([
		z.string(),
		z
			.object({
				richText: z.array(z.object({ text: z.unknown() })).optional(),
			})
			.transform((val) => {
				if (!val?.richText) return "";
				return val.richText
					.map((rt) => {
						const text = rt.text;
						return typeof text === "string"
							? text
							: String(text ?? "");
					})
					.join("");
			}),
	]),
	link: z.string(),
});

export type ForTaggingDataExcelDto = z.infer<typeof forTaggingDataExcelSchema>;

export const forTaggingDataExcelSchema = z
	.object({
		[headerLabels.technician]: stringOrRichText,
		[headerLabels.requestId]: z.union([linkColumn, stringOrRichText]),
		[headerLabels.createdTime]: stringOrRichText,
		[headerLabels.module]: stringOrRichText,
		[headerLabels.subject]: z.union([linkColumn, stringOrRichText]),
		[headerLabels.problemId]: z.union([linkColumn, stringOrRichText]),
		[headerLabels.linkedRequestId]: z.union([linkColumn, stringOrRichText]),
		[headerLabels.category]: z.string(),
	})
	.transform((data) => {
		// Helper function to extract value and link from column data
		const extractValueAndLink = (columnData: unknown) => {
			if (
				typeof columnData === "object" &&
				columnData !== null &&
				"value" in columnData &&
				"link" in columnData
			) {
				const linkObj = columnData as { value: unknown; link: unknown };
				return {
					value:
						typeof linkObj.value === "string"
							? linkObj.value
							: String(linkObj.value ?? ""),
					link:
						typeof linkObj.link === "string"
							? linkObj.link
							: String(linkObj.link ?? ""),
				};
			}
			return {
				value:
					typeof columnData === "string"
						? columnData
						: String(columnData ?? ""),
				link: "",
			};
		};
		const requestIdData = extractValueAndLink(data[headerLabels.requestId]);
		const subjectData = extractValueAndLink(data[headerLabels.subject]);
		const problemIdData = extractValueAndLink(data[headerLabels.problemId]);
		const linkedRequestIdData = extractValueAndLink(
			data[headerLabels.linkedRequestId]
		);

		return {
			technician: data[headerLabels.technician],
			requestId: requestIdData.value,
			requestIdLink: requestIdData.link,
			createdTime: data[headerLabels.createdTime],
			module: data[headerLabels.module],
			subject: subjectData.value,
			subjectLink: subjectData.link,
			problemId: problemIdData.value,
			problemIdLink: problemIdData.link,
			linkedRequestId: linkedRequestIdData.value,
			linkedRequestIdLink: linkedRequestIdData.link,
			category: data[headerLabels.category],
		};
	});
