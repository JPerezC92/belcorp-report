import { createFileRoute } from "@tanstack/react-router";
import { DateTime } from "luxon";
import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import FileUploadSection from "@/components/FileUploadSection";
import LoadingState from "@/components/LoadingState";
import RefreshButton from "@/components/RefreshButton";
import { getPreloadHandler } from "@/constants/preloadHandlers";

export const Route = createFileRoute("/war-rooms")({
	component: WarRooms,
});

type WarRoomRecord = {
	application: string;
	date: string;
	incidentId: string;
	incidentIdLink?: string;
	summary: string;
	initialPriority: string;
	startTime: string;
	durationMinutes: number;
	endTime: string;
	participants: number;
	status: string;
	priorityChanged: string;
	resolutionTeamChanged: string;
	notes: string;
	rcaStatus: string | null;
	urlRca: string | null;
	createdAt: string;
	updatedAt: string;
};

function WarRooms() {
	const [records, setRecords] = useState<WarRoomRecord[]>([]);
	const [applications, setApplications] = useState<string[]>([]);
	const [selectedApplication, setSelectedApplication] =
		useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [selectedYear, setSelectedYear] = useState<string>("all");
	const [selectedMonth, setSelectedMonth] = useState<string>("all");
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

			const getWarRoomRecords = getPreloadHandler("getWarRoomRecords");
			const getWarRoomApplications = getPreloadHandler(
				"getWarRoomApplications",
			);

			const [recordsResult, appsResult] = await Promise.all([
				getWarRoomRecords(),
				getWarRoomApplications(),
			]);

			if (recordsResult.success) {
				setRecords(recordsResult.data || []);
			} else {
				throw new Error(
					recordsResult.error || "Failed to load war room records",
				);
			}

			if (appsResult.success) {
				setApplications(appsResult.data || []);
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

	// Extract unique years and months from records
	const availableYears = useMemo(() => {
		const years = new Set(
			records.map((r) => new Date(r.date).getFullYear().toString()),
		);
		return Array.from(years).sort((a, b) => Number(b) - Number(a));
	}, [records]);

	const availableMonths = useMemo(() => {
		return [
			{ value: "1", label: "January" },
			{ value: "2", label: "February" },
			{ value: "3", label: "March" },
			{ value: "4", label: "April" },
			{ value: "5", label: "May" },
			{ value: "6", label: "June" },
			{ value: "7", label: "July" },
			{ value: "8", label: "August" },
			{ value: "9", label: "September" },
			{ value: "10", label: "October" },
			{ value: "11", label: "November" },
			{ value: "12", label: "December" },
		];
	}, []);

	// Get unique statuses
	const statuses = useMemo(
		() => Array.from(new Set(records.map((r) => r.status))),
		[records],
	);

	// Filter records based on selected filters
	const filteredRecords = useMemo(() => {
		return records.filter((record) => {
			const recordDate = new Date(record.date);
			const recordYear = recordDate.getFullYear().toString();
			const recordMonth = (recordDate.getMonth() + 1).toString();

			if (
				selectedApplication !== "all" &&
				record.application !== selectedApplication
			) {
				return false;
			}

			if (selectedStatus !== "all" && record.status !== selectedStatus) {
				return false;
			}

			if (selectedYear !== "all" && recordYear !== selectedYear) {
				return false;
			}

			if (selectedMonth !== "all" && recordMonth !== selectedMonth) {
				return false;
			}

			return true;
		});
	}, [
		records,
		selectedApplication,
		selectedStatus,
		selectedYear,
		selectedMonth,
	]);

	// Compute summary data - one row per unique incident with aggregated info
	const summaryData = useMemo(() => {
		// Group by incident ID and date to create summary rows
		const grouped = new Map<string, WarRoomRecord>();

		filteredRecords.forEach((record) => {
			// Use incident ID as key since each incident represents a war room session
			if (!grouped.has(record.incidentId)) {
				grouped.set(record.incidentId, record);
			}
		});

		return Array.from(grouped.values()).sort((a, b) => {
			// Sort by date descending (newest first)
			return new Date(b.date).getTime() - new Date(a.date).getTime();
		});
	}, [filteredRecords]);

	// Handle file upload
	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setUploadStatus({ loading: true, error: null, success: null });

		try {
			const loadWarRoomData = getPreloadHandler("loadWarRoomData");
			const fileBuffer = await file.arrayBuffer();
			const result = await loadWarRoomData(fileBuffer, file.name);

			if (!result.success) {
				throw new Error(
					result.error || "Failed to upload war room data",
				);
			}

			setUploadStatus({
				loading: false,
				error: null,
				success: `Successfully uploaded ${result.recordCount} war room records`,
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
		if (!confirm("Are you sure you want to delete all war room data?"))
			return;

		try {
			const dropWarRoomData = getPreloadHandler("dropWarRoomData");
			const result = await dropWarRoomData();

			if (!result.success) {
				throw new Error(result.error || "Failed to drop war room data");
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
				<h1 className="text-3xl font-bold text-gray-800 mb-6">
					War Rooms
				</h1>

				<div className="space-y-6">
					{/* File Upload Section */}
					<FileUploadSection
						title="Upload War Room Data"
						description="Upload an Excel file containing war room incident records"
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
								disabled={loading || records.length === 0}
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

					{/* Main Content */}
					<div className="bg-white rounded-lg shadow-md">
						<div className="px-6 py-4 border-b border-gray-200">
							<div className="flex justify-between items-center mb-4">
								<div>
									<h3 className="text-lg font-medium text-gray-900">
										War Room Records
									</h3>
									<p className="text-sm text-gray-500">
										Showing {filteredRecords.length} of{" "}
										{records.length} records
									</p>
								</div>
								<RefreshButton
									onClick={loadData}
									loading={loading}
								/>
							</div>

							{/* Filters */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Year
									</label>
									<select
										value={selectedYear}
										onChange={(e) =>
											setSelectedYear(e.target.value)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
									>
										<option value="all">All Years</option>
										{availableYears.map((year) => (
											<option key={year} value={year}>
												{year}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Month
									</label>
									<select
										value={selectedMonth}
										onChange={(e) =>
											setSelectedMonth(e.target.value)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
									>
										<option value="all">All Months</option>
										{availableMonths.map((month) => (
											<option
												key={month.value}
												value={month.value}
											>
												{month.label}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Application
									</label>
									<select
										value={selectedApplication}
										onChange={(e) =>
											setSelectedApplication(
												e.target.value,
											)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
									>
										<option value="all">
											All Applications
										</option>
										{applications.map((app) => (
											<option key={app} value={app}>
												{app}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Status
									</label>
									<select
										value={selectedStatus}
										onChange={(e) =>
											setSelectedStatus(e.target.value)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
									>
										<option value="all">
											All Statuses
										</option>
										{statuses.map((status) => (
											<option key={status} value={status}>
												{status}
											</option>
										))}
									</select>
								</div>
							</div>
						</div>

						{/* Table Content */}
						{loading ? (
							<LoadingState />
						) : error ? (
							<ErrorState message={error} />
						) : filteredRecords.length === 0 ? (
							<EmptyState message="No war room records found. Upload an Excel file to get started." />
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Date
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Incident ID
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Application
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Summary
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Initial Priority
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Start Time
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Duration (Min)
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												End Time
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Participants
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Status
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Priority Changed
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Resolution Team Changed
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Notes
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												RCA Status
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												URL RCA
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{filteredRecords.map((record) => (
											<tr
												key={record.incidentId}
												className="hover:bg-gray-50"
											>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{DateTime.fromISO(
														record.date,
														{ zone: "utc" },
													).toFormat("dd/MM/yyyy")}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm">
													{record.incidentIdLink ? (
														<button
															type="button"
															onClick={() =>
																openLink(
																	record.incidentIdLink!,
																)
															}
															className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
														>
															{record.incidentId}
														</button>
													) : (
														<span className="text-gray-900">
															{record.incidentId}
														</span>
													)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{record.application}
												</td>
												<td
													className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate"
													title={record.summary}
												>
													{record.summary}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm">
													<span
														className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
															record.initialPriority ===
															"CRITICAL"
																? "bg-red-100 text-red-800"
																: record.initialPriority ===
																		"HIGH"
																	? "bg-orange-100 text-orange-800"
																	: "bg-yellow-100 text-yellow-800"
														}`}
													>
														{record.initialPriority}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{DateTime.fromISO(
														record.startTime,
														{ zone: "utc" },
													).toFormat("HH:mm:ss")}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{record.durationMinutes}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{DateTime.fromISO(
														record.endTime,
														{ zone: "utc" },
													).toFormat("HH:mm:ss")}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{record.participants}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm">
													<span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
														{record.status}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{record.priorityChanged}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{
														record.resolutionTeamChanged
													}
												</td>
												<td
													className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate"
													title={record.notes}
												>
													{record.notes}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{record.rcaStatus || "N/A"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm">
													{record.urlRca ? (
														<button
															type="button"
															onClick={() =>
																openLink(
																	record.urlRca!,
																)
															}
															className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
														>
															Link
														</button>
													) : (
														<span className="text-gray-400">
															-
														</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>

					{/* Summary Table */}
					{!loading && !error && summaryData.length > 0 && (
						<div className="bg-white rounded-lg shadow-md mt-6">
							<div className="px-6 py-4 border-b border-gray-200">
								<h3 className="text-lg font-medium text-gray-900">
									War Room Summary
								</h3>
								<p className="text-sm text-gray-500">
									Aggregated view of {summaryData.length} war
									room sessions
								</p>
							</div>

							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Participants
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Session Date & Time
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Duration
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Incident ID
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Summary
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Status
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Resolution Notes
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												RCA Status
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{summaryData.map((record) => {
											const sessionDate =
												DateTime.fromISO(record.date, {
													zone: "utc",
												});
											const startTime = DateTime.fromISO(
												record.startTime,
												{ zone: "utc" },
											);
											const endTime = DateTime.fromISO(
												record.endTime,
												{ zone: "utc" },
											);
											const dateTimeRange = `${sessionDate.toFormat("dd MMM")} from ${startTime.toFormat("HH'h'mm")} to ${endTime.toFormat("HH'h'mm")}`;

											return (
												<tr
													key={record.incidentId}
													className="hover:bg-gray-50"
												>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
														{record.participants}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														{dateTimeRange}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														{record.durationMinutes}
														min
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														{record.incidentIdLink ? (
															<a
																href={record.incidentIdLink}
																target="_blank"
																rel="noopener noreferrer"
																onClick={(e) => {
																	e.preventDefault();
																	openLink(
																		record.incidentIdLink!,
																	);
																}}
																className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
															>
																{
																	record.incidentId
																}
															</a>
														) : (
															<span className="text-gray-900">
																{
																	record.incidentId
																}
															</span>
														)}
													</td>
													<td
														className="px-6 py-4 text-sm text-gray-900 max-w-md truncate"
														title={record.summary}
													>
														{record.summary}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														<span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
															{record.status}
														</span>
													</td>
													<td
														className="px-6 py-4 text-sm text-gray-900 max-w-md truncate"
														title={record.notes}
													>
														{record.notes}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														{record.urlRca ? (
															<a
																href={
																	record.urlRca
																}
																onClick={(
																	e,
																) => {
																	e.preventDefault();
																	openLink(
																		record.urlRca!,
																	);
																}}
																className={`cursor-pointer hover:opacity-80 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
																	record.rcaStatus ===
																	"ready"
																		? "bg-green-100 text-green-800"
																		: record.rcaStatus ===
																				"Pending"
																			? "bg-yellow-100 text-yellow-800"
																			: "bg-gray-100 text-gray-800"
																}`}
															>
																{record.rcaStatus ||
																	"N/A"}
															</a>
														) : (
															<span
																className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
																	record.rcaStatus ===
																	"ready"
																		? "bg-green-100 text-green-800"
																		: record.rcaStatus ===
																				"Pending"
																			? "bg-yellow-100 text-yellow-800"
																			: "bg-gray-100 text-gray-800"
																}`}
															>
																{record.rcaStatus ||
																	"N/A"}
															</span>
														)}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
