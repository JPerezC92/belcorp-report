import type { TagRepository } from "@core/modules/incident-tagging/domain/tag.repository.js";
import type { TagReportParser } from "@core/modules/incident-tagging/domain/tag-report-parser.js";

type Input = {
	fileBuffer: ArrayBuffer;
	fileName: string;
};

export class ProcessTagBatchCreator {
	constructor(
		private readonly deps: {
			tagRepository: TagRepository;
			tagReportParser: TagReportParser;
		}
	) {}

	async execute(input: Input) {
		await this.deps.tagRepository.drop();

		// Optionally parse the file to validate or log (not strictly necessary here)
		const result = await this.deps.tagReportParser.parseExcel(
			input.fileBuffer,
			input.fileName
		);

		// Save the batch of tags to the repository
		await this.deps.tagRepository.saveBatch(result.sheet?.rows);

		return result;
	}
}
