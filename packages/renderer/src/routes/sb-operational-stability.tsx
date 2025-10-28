import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { DateTime } from "luxon";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import FileUploadSection from "@/components/FileUploadSection";
import LoadingState from "@/components/LoadingState";
import RefreshButton from "@/components/RefreshButton";
import { getPreloadHandler } from "@/constants/preloadHandlers";

export const Route = createFileRoute("/sb-operational-stability")({
	component: SBOperationalStability,
});

type SBRelease = {
	id: number;
	week: number | null;
	application: string;
	date: string;
	releaseVersion: string;
	releaseLink: string | null;
	tickets: string | null;
	createdAt: string;
	updatedAt: string;
};

function SBOperationalStability() {
	const [releases, setReleases] = useState<SBRelease[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [uploadStatus, setUploadStatus] = useState<{
		loading: boolean;
		error: string | null;
		success: string | null;
	}>({
		loading: false,
		error: null,
		success: null,
	});

	// Load data on component mount
	const loadData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const getSBOperationalReleases = getPreloadHandler(
				"getSBOperationalReleases",
			);

			const releasesResult = await getSBOperationalReleases();

			if (releasesResult.success) {
				setReleases(releasesResult.data || []);
			} else {
				throw new Error(
					releasesResult.error || "Failed to load releases",
				);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// Handle file upload
	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setUploadStatus({ loading: true, error: null, success: null });

		try {
			const loadSBOperationalStabilityData = getPreloadHandler(
				"loadSBOperationalStabilityData",
			);
			const fileBuffer = await file.arrayBuffer();
			const result = await loadSBOperationalStabilityData(
				fileBuffer,
				file.name,
			);

			if (!result.success) {
				throw new Error(
					result.error || "Failed to upload SB operational data",
				);
			}

			setUploadStatus({
				loading: false,
				error: null,
				success: `Successfully uploaded ${result.releasesCount} releases`,
			});

			// Reload data
			await loadData();

			// Clear file input
			event.target.value = "";
		} catch (err) {
			setUploadStatus({
				loading: false,
				error: err instanceof Error ? err.message : String(err),
				success: null,
			});
		}
	};

	// Handle drop data
	const handleDropData = async () => {
		if (
			!confirm(
				"Are you sure you want to delete all SB operational stability data?",
			)
		)
			return;

		try {
			const dropSBOperationalStabilityData = getPreloadHandler(
				"dropSBOperationalStabilityData",
			);
			const result = await dropSBOperationalStabilityData();

			if (!result.success) {
				throw new Error(
					result.error || "Failed to drop SB operational data",
				);
			}

			await loadData();
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		}
	};

	// Open external link
	const openLink = (url: string) => {
		const openExternal = getPreloadHandler("openExternal");
		openExternal(url);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-800 mb-2">
					SB Operational Stability
				</h1>
				<p className="text-gray-600 mb-6">
					Upload and manage SB operational stability data (incidents,
					sessions, orders, releases)
				</p>

				<div className="space-y-6">
					{/* File Upload Section */}
					<FileUploadSection
						title="Upload SB Operational Data"
						description='Upload the "SB INCIDENTES ORDENES SESIONES.xlsx" file'
					>
						<div className="flex gap-4">
							<label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
								<input
									type="file"
									accept=".xlsx"
									onChange={handleFileUpload}
									disabled={uploadStatus.loading}
									className="hidden"
								/>
								{uploadStatus.loading
									? "Uploading..."
									: "Choose Excel File"}
							</label>
							<button
								onClick={handleDropData}
								className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
								disabled={loading || releases.length === 0}
							>
								Clear All Data
							</button>
						</div>

						{uploadStatus.error && (
							<div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
								{uploadStatus.error}
							</div>
						)}
						{uploadStatus.success && (
							<div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
								{uploadStatus.success}
							</div>
						)}
					</FileUploadSection>

					{/* Data Summary */}
					<div className="bg-white rounded-lg shadow-md p-6">
						<h3 className="text-lg font-semibold text-gray-800 mb-4">
							Data Summary
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="p-4 bg-blue-50 rounded-lg">
								<div className="text-sm text-gray-600">
									Releases
								</div>
								<div className="text-2xl font-bold text-blue-600">
									{releases.length}
								</div>
								<div className="text-xs text-gray-500 mt-1">
									records
								</div>
							</div>
							<div className="p-4 bg-gray-50 rounded-lg">
								<div className="text-sm text-gray-600">
									Daily Metrics
								</div>
								<div className="text-2xl font-bold text-gray-400">
									0
								</div>
								<div className="text-xs text-gray-500 mt-1">
									Not yet imported (Phase 2)
								</div>
							</div>
							<div className="p-4 bg-gray-50 rounded-lg">
								<div className="text-sm text-gray-600">
									Weekly Summary
								</div>
								<div className="text-2xl font-bold text-gray-400">
									0
								</div>
								<div className="text-xs text-gray-500 mt-1">
									Not yet imported (Phase 3)
								</div>
							</div>
						</div>
					</div>

					{/* Releases Table */}
					<div className="bg-white rounded-lg shadow-md">
						<div className="px-6 py-4 border-b border-gray-200">
							<div className="flex justify-between items-center">
								<div>
									<h3 className="text-lg font-medium text-gray-900">
										Releases
									</h3>
									<p className="text-sm text-gray-500">
										Showing {releases.length} releases
									</p>
								</div>
								<RefreshButton
									onClick={loadData}
									loading={loading}
								/>
							</div>
						</div>

						{/* Table Content */}
						{loading ? (
							<LoadingState />
						) : error ? (
							<ErrorState message={error} />
						) : releases.length === 0 ? (
							<EmptyState message="No releases found. Upload an Excel file to get started." />
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Week
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Application
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Date
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Release Version
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Tickets
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{releases.map((release) => (
											<tr
												key={release.id}
												className="hover:bg-gray-50"
											>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{release.week ?? "N/A"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{release.application}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{DateTime.fromISO(
														release.date,
													).toFormat("dd-MMM")}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm">
													{release.releaseLink ? (
														<button
															type="button"
															onClick={() =>
																openLink(
																	release.releaseLink!,
																)
															}
															className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
														>
															{
																release.releaseVersion
															}
														</button>
													) : (
														<span className="text-gray-900">
															{
																release.releaseVersion
															}
														</span>
													)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{release.tickets || "-"}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
