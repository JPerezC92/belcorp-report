import type { ParentChildRelationship } from "./parent-child-relationship.js";

export interface AggregatedRelationship {
	linkedRequestId: string;
	requestCount: number;
	relationships: ParentChildRelationship[];
}

export interface ParentChildRelationshipRepository {
	saveBatch(relationships: ParentChildRelationship[]): Promise<void>;
	getAll(): Promise<ParentChildRelationship[]>;
	drop(): Promise<void>;
	findByParentRequestId(
		parentRequestId: string
	): Promise<ParentChildRelationship[]>;
	findByChildRequestId(
		childRequestId: string
	): Promise<ParentChildRelationship[]>;
	getAggregatedByLinkedRequestId(): Promise<AggregatedRelationship[]>;
}
