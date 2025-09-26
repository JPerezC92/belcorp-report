import type {
	ForTaggingDataExcelParseResult,
	ForTaggingDataRepository,
} from "../domain/for-tagging-data-excel-parser.js";
import { ForTaggingDataExcelParser } from "../infrastructure/parsers/for-tagging-data-excel-parser.js";

export class ForTaggingDataExcelService {
	constructor(
		private readonly deps: {
			repository: ForTaggingDataRepository;
		}
	) {}

	private readonly parser = new ForTaggingDataExcelParser();

	async parseExcel({
		fileBuffer,
		fileName,
	}: {
		fileBuffer: ArrayBuffer;
		fileName: string;
	}): Promise<ForTaggingDataExcelParseResult> {
		return await this.parser.parseExcel(fileBuffer, fileName);
	}

	async parseAndSaveExcel({
		fileBuffer,
		fileName,
	}: {
		fileBuffer: ArrayBuffer;
		fileName: string;
	}): Promise<ForTaggingDataExcelParseResult & { savedCount?: number }> {
		await this.deps.repository.drop();

		const parseResult = await this.parser.parseExcel(fileBuffer, fileName);

		if (parseResult.success && parseResult.sheet) {
			// Use the already parsed and validated ForTaggingData instances
			const allData = parseResult.sheet.rows;

			if (allData.length > 0) {
				await this.deps.repository.saveBatch(allData);
				console.log(`✅ Saved ${allData.length} records to database`);
				return {
					...parseResult,
					savedCount: allData.length,
				};
			}
		}

		return parseResult;
	}
}
