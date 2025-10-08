import { z } from "zod";

/**
 * War Room specific cell validation schemas
 *
 * These schemas extend the base excel-cell-validation.schema to handle
 * War Room specific cell types like Date objects and numeric Incident IDs.
 */

/**
 * Schema for extracting cell values in War Room Excel files.
 * Handles: strings, numbers, dates, null/undefined, rich text, and hyperlinks.
 */
export const warRoomCellValueSchema = z.union([
	z.string(),
	z.number().transform((num) => num.toString()),
	z.null().transform(() => ""),
	z.undefined().transform(() => ""),
	z.date().transform((date) => date.toISOString()),
	// Handle formula cells with results
	z
		.object({
			formula: z.string(),
			result: z.union([
				z.string(),
				z.number().transform((num) => num.toString()),
				z.date().transform((date) => date.toISOString()),
				z.null().transform(() => ""),
			]),
		})
		.transform((obj) => {
			if (typeof obj.result === "string") return obj.result;
			return "";
		}),
	// Handle hyperlink objects with nested rich text
	z
		.object({
			text: z
				.union([
					z.string(),
					z.number(),
					z.object({
						richText: z.array(
							z.object({
								text: z.string().optional(),
							})
						),
					}),
				])
				.optional(),
			hyperlink: z.string(),
		})
		.transform((obj) => {
			if (obj.text) {
				if (typeof obj.text === "string") {
					return obj.text;
				} else if (typeof obj.text === "number") {
					return obj.text.toString();
				} else if ("richText" in obj.text && obj.text.richText) {
					return obj.text.richText
						.map((rt) => rt.text || "")
						.join("");
				}
			}
			return "";
		}),
	// Handle direct rich text objects
	z
		.object({
			richText: z.array(
				z.object({
					text: z.string().optional(),
				})
			),
		})
		.transform((obj) => obj.richText.map((rt) => rt.text || "").join("")),
]);

/**
 * Schema for extracting both value and hyperlink from War Room Excel cells.
 * Returns { value: string, link?: string }
 */
export const warRoomCellWithLinkSchema = z.union([
	z.string().transform((value) => ({ value, link: undefined })),
	z.number().transform((num) => ({ value: num.toString(), link: undefined })),
	z.null().transform(() => ({ value: "", link: undefined })),
	z.undefined().transform(() => ({ value: "", link: undefined })),
	z.date().transform((date) => ({ value: date.toISOString(), link: undefined })),
	// Handle formula cells with results
	z
		.object({
			formula: z.string(),
			result: z.union([
				z.string(),
				z.number().transform((num) => num.toString()),
				z.date().transform((date) => date.toISOString()),
				z.null().transform(() => ""),
			]),
		})
		.transform((obj) => ({
			value: typeof obj.result === "string" ? obj.result : "",
			link: undefined,
		})),
	// Handle hyperlink objects with nested rich text
	z
		.object({
			text: z
				.union([
					z.string(),
					z.number(),
					z.object({
						richText: z.array(
							z.object({
								text: z.string().optional(),
							})
						),
					}),
				])
				.optional(),
			hyperlink: z.string(),
		})
		.transform((obj) => {
			let value = "";
			if (obj.text) {
				if (typeof obj.text === "string") {
					value = obj.text;
				} else if (typeof obj.text === "number") {
					value = obj.text.toString();
				} else if (obj.text.richText) {
					value = obj.text.richText
						.map((rt) => rt.text || "")
						.join("");
				}
			}
			return { value, link: obj.hyperlink };
		}),
	// Handle direct rich text objects
	z
		.object({
			richText: z.array(
				z.object({
					text: z.string().optional(),
				})
			),
		})
		.transform((obj) => ({
			value: obj.richText.map((rt) => rt.text || "").join(""),
			link: undefined,
		})),
]);

/**
 * Type for the result of warRoomCellWithLinkSchema
 */
export type WarRoomCellWithLink = z.infer<typeof warRoomCellWithLinkSchema>;

/**
 * Type for cell values (just strings)
 */
export type WarRoomCellValue = z.infer<typeof warRoomCellValueSchema>;
