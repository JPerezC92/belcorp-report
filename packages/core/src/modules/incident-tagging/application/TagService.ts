import type { TagRepository } from "../domain/tag.repository.js";
import { tagDomainToResponse } from "../infrastructure/adapters/excelTagDtoToDomain.adapter.js";
import type { TagResponseDto } from "../infrastructure/dtos/tag-response.dto.js";
import { ExcelTagReportParser } from "../infrastructure/parsers/excel-tag-report-parser.js";
import { ProcessTagBatchCreator } from "./ProcessTagBatchCreator.js";
import { TagFinder } from "./TagFinder.js";

/**
 * Tag Service Container - Dependency Injection Container for Tag module
 * This class manages the creation and configuration of use cases with their dependencies
 */
export class TagService {
	/**
	 * Use case: Find all tags
	 */
	async findAllTags(tagRepository: TagRepository): Promise<TagResponseDto[]> {
		return new TagFinder({
			tagRepository,
			adapter: tagDomainToResponse,
		}).execute();
	}

	async parseTagReport(deps: {
		fileBuffer: ArrayBuffer;
		fileName: string;
		repository: TagRepository;
	}) {
		const processTagBatchCreator = new ProcessTagBatchCreator({
			tagReportParser: new ExcelTagReportParser(),
			tagRepository: deps.repository,
		});

		const result = await processTagBatchCreator.execute({
			fileBuffer: deps.fileBuffer,
			fileName: deps.fileName,
		});

		return result;
	}

	// Expose raw use cases if needed for advanced scenarios
}

/**
 * Factory function to create a configured TagService instance
 * This follows the Dependency Injection pattern while providing a simple API
 */
export function createTagService(): TagService {
	return new TagService();
}
