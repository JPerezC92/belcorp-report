import type { Tag } from "@core/modules/incident-tagging/domain/tag.js";
import type { TagRepository } from "@core/modules/incident-tagging/domain/tag.repository.js";

export class TagFinder<T> {
	constructor(
		private readonly deps: {
			tagRepository: TagRepository;
			adapter: (tag: Tag) => T;
		}
	) {}

	async execute(): Promise<T[]> {
		const tags = await this.deps.tagRepository.getAll();

		return tags.map(this.deps.adapter);
	}
}
