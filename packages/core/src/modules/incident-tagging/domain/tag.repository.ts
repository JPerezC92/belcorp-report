import type { Tag } from "@core/modules/incident-tagging/domain/tag.js";

export interface TagRepository {
	saveBatch(tags: Tag[]): Promise<void>;
	getAll(): Promise<Tag[]>;
	drop(): Promise<void>;
	findByLinkedRequestId(linkedRequestId: string): Promise<Tag[]>;
}
