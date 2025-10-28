import type { SBRelease } from "./release.entity.js";

/**
 * Repository interface for SB Operational Stability Releases
 */
export interface SBReleaseRepository {
	/**
	 * Save a single release
	 */
	save(release: SBRelease): Promise<SBRelease> | SBRelease;

	/**
	 * Save multiple releases in batch
	 */
	saveMany(releases: SBRelease[]): Promise<SBRelease[]> | SBRelease[];

	/**
	 * Find all releases
	 */
	findAll(): Promise<SBRelease[]> | SBRelease[];

	/**
	 * Find releases by date range
	 */
	findByDateRange(
		startDate: string,
		endDate: string,
	): Promise<SBRelease[]> | SBRelease[];

	/**
	 * Find releases by application
	 */
	findByApplication(application: string): Promise<SBRelease[]> | SBRelease[];

	/**
	 * Find release by ID
	 */
	findById(id: number): Promise<SBRelease | null> | SBRelease | null;

	/**
	 * Delete all releases
	 */
	deleteAll(): Promise<void> | void;

	/**
	 * Count total releases
	 */
	count(): Promise<number> | number;
}
