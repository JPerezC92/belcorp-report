import { createFileRoute } from "@tanstack/react-router";
import { DateTime } from "luxon";
import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import RefreshButton from "@/components/RefreshButton";
import { getPreloadHandler } from "@/constants/preloadHandlers";

export const Route = createFileRoute("/weekly-analytics")({
	component: WeeklyAnalytics,
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

type MonthlyReportRecord = {
	requestId: string;
	computed_level: string | null;
	requestOpeningDate: string;
	createdTime: string;
	week: number;
	businessUnit: string | null;
	categorization: string | null;
	categorizationDisplayName: string | null;
	module: string | null;
	moduleDisplayName: string | null;
	priorityReporte: string | null;
	recurrenceComputed: string | null;
	[key: string]: any;
};

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

function WeeklyAnalytics() {
	const [records, setRecords] = useState<WarRoomRecord[]>([]);
	const [applications, setApplications] = useState<string[]>([]);
	const [selectedYear, setSelectedYear] = useState<string>("all");
	const [selectedMonth, setSelectedMonth] = useState<string>("all");
	const [selectedApplication, setSelectedApplication] =
		useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Monthly report state for Operational Stability Indicators
	const [monthlyReports, setMonthlyReports] = useState<MonthlyReportRecord[]>([]);
	const [operationalMonth, setOperationalMonth] = useState<string>(
		DateTime.now().toFormat("yyyy-MM")
	);
	const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>("all");
	const [monthlyLoading, setMonthlyLoading] = useState(true);
	const [monthlyError, setMonthlyError] = useState<string | null>(null);

	// Column visibility for Distribution by Category table
	const [showUnknownColumn, setShowUnknownColumn] = useState(false);
	const [showNuevoColumn, setShowNuevoColumn] = useState(false);

	// SB Releases state (only for SB business unit)
	const [sbReleases, setSbReleases] = useState<SBRelease[]>([]);
	const [sbReleasesLoading, setSbReleasesLoading] = useState(false);
	const [sbReleasesError, setSbReleasesError] = useState<string | null>(null);
	const [sbReleasesCompactView, setSbReleasesCompactView] = useState(true);
	const [selectedReleaseYear, setSelectedReleaseYear] = useState<string>(
		DateTime.now().toFormat("yyyy")
	);

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

	// Load monthly report records
	const loadMonthlyReports = useCallback(async () => {
		try {
			setMonthlyLoading(true);
			setMonthlyError(null);

			const getAllMonthlyReportRecords = getPreloadHandler("getAllMonthlyReportRecords");
			const result = await getAllMonthlyReportRecords();

			if (result.success) {
				console.log("[WeeklyAnalytics] Received monthly reports:", result.data?.length);
				console.log("[WeeklyAnalytics] Sample data (first 5):");
				console.table(
					result.data?.slice(0, 5).map((record) => ({
						requestId: record.requestId,
						requestOpeningDate: record.requestOpeningDate,
						computed_level: record.computed_level,
					}))
				);
				setMonthlyReports(result.data || []);
			} else {
				throw new Error(
					result.error || "Failed to load monthly report records",
				);
			}
		} catch (err) {
			setMonthlyError(err instanceof Error ? err.message : String(err));
		} finally {
			setMonthlyLoading(false);
		}
	}, []);

	useEffect(() => {
		loadMonthlyReports();
	}, [loadMonthlyReports]);

	// Load SB releases (only when selectedBusinessUnit is "SB")
	const loadSBReleases = useCallback(async () => {
		if (selectedBusinessUnit !== "SB") {
			setSbReleases([]);
			return;
		}

		try {
			setSbReleasesLoading(true);
			setSbReleasesError(null);

			const getSBOperationalReleases = getPreloadHandler("getSBOperationalReleases");
			const result = await getSBOperationalReleases();

			if (result.success) {
				console.log("[WeeklyAnalytics] Received SB releases:", result.data?.length);
				setSbReleases(result.data || []);
			} else {
				throw new Error(
					result.error || "Failed to load SB operational releases",
				);
			}
		} catch (err) {
			setSbReleasesError(err instanceof Error ? err.message : String(err));
		} finally {
			setSbReleasesLoading(false);
		}
	}, [selectedBusinessUnit]);

	useEffect(() => {
		loadSBReleases();
	}, [loadSBReleases]);

	// Extract unique years from records
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
	}, [records, selectedApplication, selectedStatus, selectedYear, selectedMonth]);

	// Compute summary data - one row per unique incident with aggregated info
	const summaryData = useMemo(() => {
		const grouped = new Map<string, WarRoomRecord>();

		filteredRecords.forEach((record) => {
			if (!grouped.has(record.incidentId)) {
				grouped.set(record.incidentId, record);
			}
		});

		return Array.from(grouped.values()).sort((a, b) => {
			return new Date(b.date).getTime() - new Date(a.date).getTime();
		});
	}, [filteredRecords]);

	// Open external link
	const openLink = (url: string) => {
		const openExternal = getPreloadHandler("openExternal");
		openExternal(url);
	};

	// Get unique business units
	const businessUnits = useMemo(() => {
		const units = new Set(
			monthlyReports
				.map((r) => r.businessUnit)
				.filter((bu): bu is string => bu !== null && bu !== undefined && bu !== "")
		);
		return Array.from(units).sort();
	}, [monthlyReports]);

	// Filter monthly reports by selected month and business unit
	const filteredMonthlyReports = useMemo(() => {
		const filtered = monthlyReports.filter((record) => {
			// Parse requestOpeningDate - try multiple formats
			// Format from database: "DD/MM/YYYY HH:mm:ss" or "DD/MM/YYYY HH:mm"
			let openingDate = DateTime.fromFormat(record.requestOpeningDate, "dd/MM/yyyy HH:mm:ss", { zone: "utc" });

			// Try alternative format without seconds
			if (!openingDate.isValid) {
				openingDate = DateTime.fromFormat(record.requestOpeningDate, "dd/MM/yyyy HH:mm", { zone: "utc" });
			}

			// Try ISO format as fallback
			if (!openingDate.isValid) {
				openingDate = DateTime.fromISO(record.requestOpeningDate, { zone: "utc" });
			}

			if (!openingDate.isValid) {
				console.warn("[WeeklyAnalytics] Invalid date format:", record.requestOpeningDate);
				return false;
			}

			const recordMonth = openingDate.toFormat("yyyy-MM");
			if (recordMonth !== operationalMonth) return false;

			// Filter by business unit
			if (selectedBusinessUnit !== "all" && record.businessUnit !== selectedBusinessUnit) {
				return false;
			}

			return true;
		});

		console.log("[WeeklyAnalytics] Filtered for month", operationalMonth, "and BU", selectedBusinessUnit, ":", filtered.length, "records");
		console.log("[WeeklyAnalytics] Filtered sample:");
		console.table(
			filtered.slice(0, 5).map((record) => ({
				requestId: record.requestId,
				requestOpeningDate: record.requestOpeningDate,
				computed_level: record.computed_level,
				businessUnit: record.businessUnit,
			}))
		);

		return filtered;
	}, [monthlyReports, operationalMonth, selectedBusinessUnit]);

	// Compute incidents by business unit and level (pivoted table)
	const incidentsByBusinessUnit = useMemo(() => {
		// Group by business unit and level
		const businessUnitMap = new Map<string, Map<string, number>>();

		filteredMonthlyReports.forEach((record) => {
			const businessUnit = record.businessUnit || "Unknown BU";
			const level = record.computed_level || "Unknown";

			if (!businessUnitMap.has(businessUnit)) {
				businessUnitMap.set(businessUnit, new Map());
			}

			const levelMap = businessUnitMap.get(businessUnit)!;
			levelMap.set(level, (levelMap.get(level) || 0) + 1);
		});

		// Convert to array format with L2, L3, Unknown as columns
		const rows = Array.from(businessUnitMap.entries()).map(([businessUnit, levelMap]) => {
			const L2 = levelMap.get("L2") || 0;
			const L3 = levelMap.get("L3") || 0;
			const Unknown = levelMap.get("Unknown") || 0;
			const total = L2 + L3 + Unknown;

			return { businessUnit, L2, L3, Unknown, total };
		});

		// Sort by business unit name
		rows.sort((a, b) => a.businessUnit.localeCompare(b.businessUnit));

		// Calculate totals
		const totals = {
			businessUnit: "Total",
			L2: rows.reduce((sum, row) => sum + row.L2, 0),
			L3: rows.reduce((sum, row) => sum + row.L3, 0),
			Unknown: rows.reduce((sum, row) => sum + row.Unknown, 0),
			total: rows.reduce((sum, row) => sum + row.total, 0),
		};

		console.log("[WeeklyAnalytics] Incidents by business unit:");
		console.table(rows);
		console.log("[WeeklyAnalytics] Totals:", totals);

		return { rows, totals };
	}, [filteredMonthlyReports]);

	// Compute incidents by category and recurrence (pivoted table)
	const incidentsByCategory = useMemo(() => {
		// Build map: categorization → recurrence → count
		const categoryMap = new Map<string, Map<string, number>>();

		filteredMonthlyReports.forEach((record) => {
			const category = record.categorizationDisplayName || record.categorization || "Unknown";
			const recurrence = record.recurrenceComputed || "Unknown";

			if (!categoryMap.has(category)) {
				categoryMap.set(category, new Map());
			}

			const recurrenceMap = categoryMap.get(category)!;
			recurrenceMap.set(recurrence, (recurrenceMap.get(recurrence) || 0) + 1);
		});

		// Convert to rows array with specific column order
		const rows = Array.from(categoryMap.entries()).map(([category, recurrenceMap]) => {
			const unknown = recurrenceMap.get("Unknown") || 0;
			const nuevo = recurrenceMap.get("Nuevo") || 0;
			const recurrente = recurrenceMap.get("Recurrente") || 0;

			// Unique = Unknown + Nuevo
			const unique = unknown + nuevo;

			const total = unknown + nuevo + recurrente;

			return {
				category,
				Unknown: unknown,
				Nuevo: nuevo,
				Unique: unique,
				Recurrente: recurrente,
				total,
			};
		});

		// Sort rows alphabetically by category
		rows.sort((a, b) => a.category.localeCompare(b.category));

		// Calculate totals row
		const totals = {
			category: "Total",
			Unknown: rows.reduce((sum, row) => sum + row.Unknown, 0),
			Nuevo: rows.reduce((sum, row) => sum + row.Nuevo, 0),
			Unique: rows.reduce((sum, row) => sum + row.Unique, 0),
			Recurrente: rows.reduce((sum, row) => sum + row.Recurrente, 0),
			total: rows.reduce((sum, row) => sum + row.total, 0),
		};

		console.log("[WeeklyAnalytics] Incidents by category:");
		console.table(rows);
		console.log("[WeeklyAnalytics] Category totals:", totals);

		return { rows, totals };
	}, [filteredMonthlyReports]);

	// Compute incidents by business-flow (module) and priority
	const incidentsByBusinessFlowPriority = useMemo(() => {
		// Group by priority
		const priorityGroups = new Map<string, Map<string, number>>();

		filteredMonthlyReports.forEach((record) => {
			const priority = record.priorityReporte || "Unknown";
			const module = record.moduleDisplayName || record.module || "Unknown";

			if (!priorityGroups.has(priority)) {
				priorityGroups.set(priority, new Map());
			}

			const moduleMap = priorityGroups.get(priority)!;
			moduleMap.set(module, (moduleMap.get(module) || 0) + 1);
		});

		// Convert to structured format for each priority
		const result: Record<string, Array<{ module: string; count: number }>> = {};

		const priorities = ["Critical", "High", "Low", "Medium"];

		priorities.forEach((priority) => {
			const moduleMap = priorityGroups.get(priority);
			if (moduleMap) {
				const modules = Array.from(moduleMap.entries())
					.map(([module, count]) => ({ module, count }))
					.sort((a, b) => b.count - a.count); // Sort by count descending

				result[priority] = modules;
			} else {
				result[priority] = [];
			}
		});

		console.log("[WeeklyAnalytics] Incidents by business-flow × priority:", result);

		return result;
	}, [filteredMonthlyReports]);

	// Compute incidents by priority (priorities as columns)
	const incidentsByPriority = useMemo(() => {
		const priorities = {
			Critical: 0,
			High: 0,
			Medium: 0,
			Low: 0,
		};

		filteredMonthlyReports.forEach((record) => {
			const priority = record.priorityReporte;
			if (priority && priorities.hasOwnProperty(priority)) {
				priorities[priority as keyof typeof priorities]++;
			}
		});

		const total = priorities.Critical + priorities.High + priorities.Medium + priorities.Low;

		console.log("[WeeklyAnalytics] Incidents by priority:", { ...priorities, total });

		return { ...priorities, total };
	}, [filteredMonthlyReports]);

	// Compute critical incidents (filtered by month and business unit)
	const criticalIncidents = useMemo(() => {
		const filtered = monthlyReports.filter((record) => {
			// Only include Critical priority
			if (record.priorityReporte !== "Critical") {
				return false;
			}

			// Parse requestOpeningDate - try multiple formats
			let openingDate = DateTime.fromFormat(record.requestOpeningDate, "dd/MM/yyyy HH:mm:ss", { zone: "utc" });

			// Try alternative format without seconds
			if (!openingDate.isValid) {
				openingDate = DateTime.fromFormat(record.requestOpeningDate, "dd/MM/yyyy HH:mm", { zone: "utc" });
			}

			// Try ISO format as fallback
			if (!openingDate.isValid) {
				openingDate = DateTime.fromISO(record.requestOpeningDate, { zone: "utc" });
			}

			if (!openingDate.isValid) {
				console.warn("[WeeklyAnalytics] Invalid date format:", record.requestOpeningDate);
				return false;
			}

			const recordMonth = openingDate.toFormat("yyyy-MM");
			if (recordMonth !== operationalMonth) return false;

			// Filter by business unit
			if (selectedBusinessUnit !== "all" && record.businessUnit !== selectedBusinessUnit) {
				return false;
			}

			return true;
		});

		// Sort by requestId
		return filtered.sort((a, b) => a.requestId.localeCompare(b.requestId));
	}, [monthlyReports, operationalMonth, selectedBusinessUnit]);

	// Compute incidents by day (filtered by month and business unit)
	const incidentsByDay = useMemo(() => {
		const incidentsByDayMap = new Map<number, number>();

		monthlyReports.forEach((record) => {
			// Parse createdTime - try multiple formats
			let createdDate = DateTime.fromFormat(record.createdTime, "dd/MM/yyyy HH:mm:ss", { zone: "utc" });

			// Try alternative format without seconds
			if (!createdDate.isValid) {
				createdDate = DateTime.fromFormat(record.createdTime, "dd/MM/yyyy HH:mm", { zone: "utc" });
			}

			// Try ISO format as fallback
			if (!createdDate.isValid) {
				createdDate = DateTime.fromISO(record.createdTime, { zone: "utc" });
			}

			if (!createdDate.isValid) {
				console.warn("[WeeklyAnalytics] Invalid date format for incidentsByDay:", record.createdTime);
				return;
			}

			// Filter by month
			const recordMonth = createdDate.toFormat("yyyy-MM");
			if (recordMonth !== operationalMonth) return;

			// Filter by business unit
			if (selectedBusinessUnit !== "all" && record.businessUnit !== selectedBusinessUnit) {
				return;
			}

			// Extract day of month (1-31)
			const dayOfMonth = createdDate.day;

			// Count incidents by day
			incidentsByDayMap.set(dayOfMonth, (incidentsByDayMap.get(dayOfMonth) || 0) + 1);
		});

		// Get number of days in the selected month
		const monthDate = DateTime.fromFormat(operationalMonth, "yyyy-MM", { zone: "utc" });
		const daysInMonth = monthDate.daysInMonth || 31;

		// Create complete array with all days (including 0-incident days)
		const result = [];
		for (let day = 1; day <= daysInMonth; day++) {
			result.push({
				day,
				incidents: incidentsByDayMap.get(day) || 0,
			});
		}

		return result;
	}, [monthlyReports, operationalMonth, selectedBusinessUnit]);

	// Compute incidents by week (filtered by month and business unit)
	const incidentsByWeek = useMemo(() => {
		const weekMap = new Map<number, number>();

		filteredMonthlyReports.forEach((record) => {
			const week = record.week;
			weekMap.set(week, (weekMap.get(week) || 0) + 1);
		});

		// Sort by week number and convert to array
		const weeks = Array.from(weekMap.entries())
			.map(([week, incidents]) => ({ week, incidents }))
			.sort((a, b) => a.week - b.week);

		console.log("[WeeklyAnalytics] Incidents by week:", weeks);

		return weeks;
	}, [filteredMonthlyReports]);

	// Get available years from SB releases
	const availableReleaseYears = useMemo(() => {
		if (selectedBusinessUnit !== "SB") return [];

		const years = new Set<string>();
		sbReleases.forEach((release) => {
			const releaseDate = DateTime.fromISO(release.date, { zone: "utc" });
			if (releaseDate.isValid) {
				years.add(releaseDate.toFormat("yyyy"));
			}
		});

		return Array.from(years).sort((a, b) => Number(b) - Number(a)); // Descending for dropdown
	}, [sbReleases, selectedBusinessUnit]);

	// Filter SB releases by selected year and sort by date ascending
	const filteredSBReleases = useMemo(() => {
		if (selectedBusinessUnit !== "SB") return [];

		const filtered = sbReleases.filter((release) => {
			// Only show releases for SB application
			if (release.application !== "SB") {
				return false;
			}

			const releaseDate = DateTime.fromISO(release.date, { zone: "utc" });

			if (!releaseDate.isValid) {
				console.warn("[WeeklyAnalytics] Invalid SB release date format:", release.date);
				return false;
			}

			const releaseYear = releaseDate.toFormat("yyyy");
			return releaseYear === selectedReleaseYear;
		});

		// Sort by date ascending (oldest first)
		filtered.sort((a, b) => {
			const dateA = DateTime.fromISO(a.date, { zone: "utc" });
			const dateB = DateTime.fromISO(b.date, { zone: "utc" });
			return dateA.toMillis() - dateB.toMillis();
		});

		console.log("[WeeklyAnalytics] SB releases for year", selectedReleaseYear, ":", filtered.length);

		return filtered;
	}, [sbReleases, selectedBusinessUnit, selectedReleaseYear]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-800 mb-6">
					Weekly Analytics
				</h1>

				{/* Global Business Unit Filter */}
				<div className="bg-white rounded-lg shadow-md mb-6 p-6">
					<div className="max-w-xs">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Business Unit (Global Filter)
						</label>
						<select
							value={selectedBusinessUnit}
							onChange={(e) => setSelectedBusinessUnit(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="all">All Business Units</option>
							{businessUnits.map((bu) => (
								<option key={bu} value={bu}>
									{bu}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="space-y-6">
					{/* War Room Summary Section */}
					<div className="bg-white rounded-lg shadow-md">
						<div className="px-6 py-4 border-b border-gray-200">
							<div className="flex justify-between items-center mb-4">
								<div>
									<h3 className="text-lg font-medium text-gray-900">
										War Room Summary
									</h3>
									<p className="text-sm text-gray-500">
										Aggregated view of {summaryData.length} war
										room sessions
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
						) : summaryData.length === 0 ? (
							<EmptyState message="No war room sessions found. Upload war room data to get started." />
						) : (
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
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
																target="_blank"
																rel="noopener noreferrer"
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
						)}
					</div>

					{/* Critical Incidents Section */}
					<div className="bg-white rounded-lg shadow-md">
						<div className="px-6 py-4 border-b border-gray-200">
							<div className="flex justify-between items-center mb-4">
								<div>
									<h3 className="text-lg font-medium text-gray-900">
										Critical Incidents
									</h3>
									<p className="text-sm text-gray-500">
										{criticalIncidents.length} critical priority incident
										{criticalIncidents.length !== 1 ? "s" : ""} for{" "}
										{DateTime.fromFormat(operationalMonth, "yyyy-MM").toFormat("MMMM yyyy")}
									</p>
								</div>
								<RefreshButton
									onClick={loadMonthlyReports}
									loading={monthlyLoading}
								/>
							</div>
						</div>

						{/* Table Content */}
						{monthlyLoading ? (
							<LoadingState />
						) : monthlyError ? (
							<ErrorState message={monthlyError} />
						) : criticalIncidents.length === 0 ? (
							<EmptyState message="No critical incidents found for the selected month." />
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-red-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
												Request ID
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
												Created Time
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
												Request Status
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
												Module
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
												Subject
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
												Priority
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
												Categorization
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
												RCA
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{criticalIncidents.map((record) => (
											<tr key={record.requestId} className="hover:bg-red-50">
												<td className="px-6 py-4 whitespace-nowrap text-sm">
													{record.requestIdLink ? (
														<a
															href={record.requestIdLink}
															onClick={(e) => {
																e.preventDefault();
																openLink(record.requestIdLink!);
															}}
															className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
														>
															{record.requestId}
														</a>
													) : (
														<span className="text-gray-900">
															{record.requestId}
														</span>
													)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{record.createdTime || "N/A"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{record.requestStatus || "N/A"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{record.moduleDisplayName || record.module || "N/A"}
												</td>
												<td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate" title={record.subject}>
													{record.subject || "N/A"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm">
													<span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
														{record.priorityReporte || "N/A"}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{record.categorizationDisplayName || record.categorization || "N/A"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{record.rca || "N/A"}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>

					{/* Operational Stability Indicators Section */}
					<div className="bg-white rounded-lg shadow-md">
						<div className="px-6 py-4 border-b border-gray-200">
							<div className="flex justify-between items-center mb-4">
								<div>
									<h3 className="text-lg font-medium text-gray-900">
										Operational Stability Indicators
									</h3>
									<p className="text-sm text-gray-500">
										Monthly metrics for operational stability
									</p>
								</div>
								<RefreshButton
									onClick={loadMonthlyReports}
									loading={monthlyLoading}
								/>
							</div>

							{/* Month Filter */}
							<div className="max-w-xs">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Select Month
								</label>
								<input
									type="month"
									value={operationalMonth}
									onChange={(e) => setOperationalMonth(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
						</div>

						{/* Incidents by Level Table */}
						<div className="p-6">
							<h4 className="text-md font-semibold text-gray-800 mb-4">
								Number of Incidents by Level - {DateTime.fromFormat(operationalMonth, "yyyy-MM").toFormat("MMMM yyyy")}
							</h4>

							{monthlyLoading ? (
								<LoadingState />
							) : monthlyError ? (
								<ErrorState message={monthlyError} />
							) : incidentsByBusinessUnit.totals.total === 0 ? (
								<EmptyState message="No incidents found for the selected month." />
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Business Unit
												</th>
												<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
													L2
												</th>
												<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
													L3
												</th>
												<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
													Unknown
												</th>
												<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
													Total
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{incidentsByBusinessUnit.rows.map((row) => (
												<tr key={row.businessUnit} className="hover:bg-gray-50">
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
														{row.businessUnit}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
														{row.L2}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
														{row.L3}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
														{row.Unknown}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
														{row.total}
													</td>
												</tr>
											))}
											<tr className="bg-gray-50 font-semibold">
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{incidentsByBusinessUnit.totals.businessUnit}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
													{incidentsByBusinessUnit.totals.L2}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
													{incidentsByBusinessUnit.totals.L3}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
													{incidentsByBusinessUnit.totals.Unknown}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
													{incidentsByBusinessUnit.totals.total}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							)}
						</div>

						{/* Distribution by Category Table */}
						<div className="p-6 border-t border-gray-200">
							<div className="flex justify-between items-start mb-4">
								<h4 className="text-md font-semibold text-gray-800">
									Distribution of Incidents by Category - {DateTime.fromFormat(operationalMonth, "yyyy-MM").toFormat("MMMM yyyy")}
								</h4>
								<div className="flex gap-4">
									<label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
										<input
											type="checkbox"
											checked={showUnknownColumn}
											onChange={(e) => setShowUnknownColumn(e.target.checked)}
											className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										Show Unknown
									</label>
									<label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
										<input
											type="checkbox"
											checked={showNuevoColumn}
											onChange={(e) => setShowNuevoColumn(e.target.checked)}
											className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										Show Nuevo
									</label>
								</div>
							</div>

							{monthlyLoading ? (
								<LoadingState />
							) : monthlyError ? (
								<ErrorState message={monthlyError} />
							) : incidentsByCategory.totals.total === 0 ? (
								<EmptyState message="No incidents found for the selected month." />
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Categorization
												</th>
												{showUnknownColumn && (
													<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
														Unknown
													</th>
												)}
												{showNuevoColumn && (
													<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
														Nuevo
													</th>
												)}
												<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
													Unique
												</th>
												<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
													Recurrente
												</th>
												<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
													Total
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{incidentsByCategory.rows.map((row) => (
												<tr key={row.category} className="hover:bg-gray-50">
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
														{row.category}
													</td>
													{showUnknownColumn && (
														<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
															{row.Unknown}
														</td>
													)}
													{showNuevoColumn && (
														<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
															{row.Nuevo}
														</td>
													)}
													<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
														{row.Unique}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
														{row.Recurrente}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
														{row.total}
													</td>
												</tr>
											))}
											<tr className="bg-gray-50 font-semibold">
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{incidentsByCategory.totals.category}
												</td>
												{showUnknownColumn && (
													<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
														{incidentsByCategory.totals.Unknown}
													</td>
												)}
												{showNuevoColumn && (
													<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
														{incidentsByCategory.totals.Nuevo}
													</td>
												)}
												<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
													{incidentsByCategory.totals.Unique}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
													{incidentsByCategory.totals.Recurrente}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
													{incidentsByCategory.totals.total}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							)}
						</div>

						{/* Number of Incidents by Business-Flow by Priority */}
						<div className="p-6 border-t border-gray-200">
							<h4 className="text-md font-semibold text-gray-800 mb-6">
								Number of Incidents by Business-Flow by Priority - {DateTime.fromFormat(operationalMonth, "yyyy-MM").toFormat("MMMM yyyy")}
							</h4>

							{monthlyLoading ? (
								<LoadingState />
							) : monthlyError ? (
								<ErrorState message={monthlyError} />
							) : (
								<div className="space-y-8">
									{/* Critical Priority Table */}
									<div>
										<h5 className="text-sm font-semibold text-red-700 mb-3 uppercase tracking-wide border-l-4 border-red-500 pl-3">
											Critical Priority
										</h5>
										{incidentsByBusinessFlowPriority.Critical.length === 0 ? (
											<p className="text-sm text-gray-500 italic">No critical priority incidents</p>
										) : (
											<div className="overflow-x-auto">
												<table className="min-w-full divide-y divide-gray-200">
													<thead className="bg-red-50">
														<tr>
															<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
																Business-Flow
															</th>
															<th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
																Count
															</th>
														</tr>
													</thead>
													<tbody className="bg-white divide-y divide-gray-200">
														{incidentsByBusinessFlowPriority.Critical.map((item, idx) => (
															<tr key={idx} className="hover:bg-red-50">
																<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
																	{item.module}
																</td>
																<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
																	{item.count}
																</td>
															</tr>
														))}
														<tr className="bg-red-50 font-semibold">
															<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
																Total
															</td>
															<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
																{incidentsByBusinessFlowPriority.Critical.reduce((sum, item) => sum + item.count, 0)}
															</td>
														</tr>
													</tbody>
												</table>
											</div>
										)}
									</div>

									{/* High Priority Table */}
									<div>
										<h5 className="text-sm font-semibold text-orange-700 mb-3 uppercase tracking-wide border-l-4 border-orange-500 pl-3">
											High Priority
										</h5>
										{incidentsByBusinessFlowPriority.High.length === 0 ? (
											<p className="text-sm text-gray-500 italic">No high priority incidents</p>
										) : (
											<div className="overflow-x-auto">
												<table className="min-w-full divide-y divide-gray-200">
													<thead className="bg-orange-50">
														<tr>
															<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
																Business-Flow
															</th>
															<th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
																Count
															</th>
														</tr>
													</thead>
													<tbody className="bg-white divide-y divide-gray-200">
														{incidentsByBusinessFlowPriority.High.map((item, idx) => (
															<tr key={idx} className="hover:bg-orange-50">
																<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
																	{item.module}
																</td>
																<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
																	{item.count}
																</td>
															</tr>
														))}
														<tr className="bg-orange-50 font-semibold">
															<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
																Total
															</td>
															<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
																{incidentsByBusinessFlowPriority.High.reduce((sum, item) => sum + item.count, 0)}
															</td>
														</tr>
													</tbody>
												</table>
											</div>
										)}
									</div>

									{/* Low Priority Table */}
									<div>
										<h5 className="text-sm font-semibold text-yellow-700 mb-3 uppercase tracking-wide border-l-4 border-yellow-500 pl-3">
											Low Priority
										</h5>
										{incidentsByBusinessFlowPriority.Low.length === 0 ? (
											<p className="text-sm text-gray-500 italic">No low priority incidents</p>
										) : (
											<div className="overflow-x-auto">
												<table className="min-w-full divide-y divide-gray-200">
													<thead className="bg-yellow-50">
														<tr>
															<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
																Business-Flow
															</th>
															<th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
																Count
															</th>
														</tr>
													</thead>
													<tbody className="bg-white divide-y divide-gray-200">
														{incidentsByBusinessFlowPriority.Low.map((item, idx) => (
															<tr key={idx} className="hover:bg-yellow-50">
																<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
																	{item.module}
																</td>
																<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
																	{item.count}
																</td>
															</tr>
														))}
														<tr className="bg-yellow-50 font-semibold">
															<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
																Total
															</td>
															<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
																{incidentsByBusinessFlowPriority.Low.reduce((sum, item) => sum + item.count, 0)}
															</td>
														</tr>
													</tbody>
												</table>
											</div>
										)}
									</div>

									{/* Medium Priority Table */}
									<div>
										<h5 className="text-sm font-semibold text-blue-700 mb-3 uppercase tracking-wide border-l-4 border-blue-500 pl-3">
											Medium Priority
										</h5>
										{incidentsByBusinessFlowPriority.Medium.length === 0 ? (
											<p className="text-sm text-gray-500 italic">No medium priority incidents</p>
										) : (
											<div className="overflow-x-auto">
												<table className="min-w-full divide-y divide-gray-200">
													<thead className="bg-blue-50">
														<tr>
															<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
																Business-Flow
															</th>
															<th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
																Count
															</th>
														</tr>
													</thead>
													<tbody className="bg-white divide-y divide-gray-200">
														{incidentsByBusinessFlowPriority.Medium.map((item, idx) => (
															<tr key={idx} className="hover:bg-blue-50">
																<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
																	{item.module}
																</td>
																<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
																	{item.count}
																</td>
															</tr>
														))}
														<tr className="bg-blue-50 font-semibold">
															<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
																Total
															</td>
															<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
																{incidentsByBusinessFlowPriority.Medium.reduce((sum, item) => sum + item.count, 0)}
															</td>
														</tr>
													</tbody>
												</table>
											</div>
										)}
									</div>
								</div>
							)}
						</div>

						{/* Number of Incidents by Priority Table */}
						<div className="p-6 border-t border-gray-200">
							<h4 className="text-md font-semibold text-gray-800 mb-4">
								Number of Incidents by Priority - {DateTime.fromFormat(operationalMonth, "yyyy-MM").toFormat("MMMM yyyy")}
							</h4>

							{monthlyLoading ? (
								<LoadingState />
							) : monthlyError ? (
								<ErrorState message={monthlyError} />
							) : incidentsByPriority.total === 0 ? (
								<EmptyState message="No incidents found for the selected month." />
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Metric
												</th>
												<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
													Critical
												</th>
												<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
													High
												</th>
												<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
													Medium
												</th>
												<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
													Low
												</th>
												<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
													Total
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											<tr className="hover:bg-gray-50">
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
													Number of Incidents
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
													{incidentsByPriority.Critical}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
													{incidentsByPriority.High}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
													{incidentsByPriority.Medium}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
													{incidentsByPriority.Low}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
													{incidentsByPriority.total}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							)}
						</div>

						{/* Number of Incidents by Week Table */}
						<div className="p-6 border-t border-gray-200">
							<h4 className="text-md font-semibold text-gray-800 mb-4">
								Number of Incidents by Week - {DateTime.fromFormat(operationalMonth, "yyyy-MM").toFormat("MMMM yyyy")}
							</h4>

							{monthlyLoading ? (
								<LoadingState />
							) : monthlyError ? (
								<ErrorState message={monthlyError} />
							) : incidentsByWeek.length === 0 ? (
								<EmptyState message="No incidents found for the selected month." />
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Week
												</th>
												<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
													Incidents
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{incidentsByWeek.map((row) => (
												<tr key={row.week} className="hover:bg-gray-50">
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
														Week {row.week}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
														{row.incidents}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>

						{/* SB Releases Table (only visible when selectedBusinessUnit === "SB") */}
						{selectedBusinessUnit === "SB" && (
							<div className="p-6 border-t border-gray-200">
								<div className="flex justify-between items-center mb-4">
									<div className="flex items-center gap-4">
										<h4 className="text-md font-semibold text-gray-800">
											Releases
										</h4>
										<div className="flex items-center gap-2">
											<label className="text-sm font-medium text-gray-700">
												Year:
											</label>
											<select
												value={selectedReleaseYear}
												onChange={(e) => setSelectedReleaseYear(e.target.value)}
												className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
											>
												{availableReleaseYears.length > 0 ? (
													availableReleaseYears.map((year) => (
														<option key={year} value={year}>
															{year}
														</option>
													))
												) : (
													<option value={DateTime.now().toFormat("yyyy")}>
														{DateTime.now().toFormat("yyyy")}
													</option>
												)}
											</select>
										</div>
									</div>
									<button
										onClick={() => setSbReleasesCompactView(!sbReleasesCompactView)}
										className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
									>
										{sbReleasesCompactView ? "Show Full View" : "Show Compact View"}
									</button>
								</div>

								{sbReleasesLoading ? (
									<LoadingState />
								) : sbReleasesError ? (
									<ErrorState message={sbReleasesError} />
								) : filteredSBReleases.length === 0 ? (
									<EmptyState message="No releases found. Upload SB operational data to get started." />
								) : (
									<div className="overflow-x-auto">
										<table className="min-w-full divide-y divide-gray-200">
											<thead className="bg-gray-50">
												<tr>
													{!sbReleasesCompactView && (
														<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
															Week
														</th>
													)}
													{!sbReleasesCompactView && (
														<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
															Application
														</th>
													)}
													<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
														Date
													</th>
													<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
														Release
													</th>
													{!sbReleasesCompactView && (
														<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
															Tickets
														</th>
													)}
												</tr>
											</thead>
											<tbody className="bg-white divide-y divide-gray-200">
												{filteredSBReleases.map((release) => {
													const releaseDate = DateTime.fromISO(release.date, { zone: "utc" });
													return (
														<tr key={release.id} className="hover:bg-gray-50">
															{!sbReleasesCompactView && (
																<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
																	{release.week ?? "N/A"}
																</td>
															)}
															{!sbReleasesCompactView && (
																<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
																	{release.application}
																</td>
															)}
															<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
																{releaseDate.isValid ? releaseDate.toFormat("dd-MMM") : "Invalid Date"}
															</td>
															<td className="px-6 py-4 whitespace-nowrap text-sm">
																{release.releaseLink ? (
																	<button
																		type="button"
																		onClick={() => openLink(release.releaseLink!)}
																		className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
																	>
																		{release.releaseVersion}
																	</button>
																) : (
																	<span className="text-gray-900">
																		{release.releaseVersion}
																	</span>
																)}
															</td>
															{!sbReleasesCompactView && (
																<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
																	{release.tickets || "-"}
																</td>
															)}
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Weekly Evolution of Incidents Section */}
					<div className="bg-white rounded-lg shadow-md">
						<div className="px-6 py-4 border-b border-gray-200">
							<div className="flex justify-between items-center">
								<div>
									<h3 className="text-lg font-medium text-gray-900">
										Weekly evolution of incidents
									</h3>
									<p className="text-sm text-gray-500">
										{incidentsByDay.reduce((sum, d) => sum + d.incidents, 0)} total incident
										{incidentsByDay.reduce((sum, d) => sum + d.incidents, 0) !== 1 ? "s" : ""} in{" "}
										{DateTime.fromFormat(operationalMonth, "yyyy-MM").toFormat("MMMM yyyy")}
									</p>
								</div>
								<RefreshButton
									onClick={loadMonthlyReports}
									loading={monthlyLoading}
								/>
							</div>
						</div>

						<div className="p-4">
							<h4 className="text-sm font-semibold text-gray-800 mb-2">
								Number of incidents by day - {DateTime.fromFormat(operationalMonth, "yyyy-MM").toFormat("MMMM yyyy")}
							</h4>

							{monthlyLoading ? (
								<LoadingState />
							) : monthlyError ? (
								<ErrorState message={monthlyError} />
							) : incidentsByDay.reduce((sum, d) => sum + d.incidents, 0) === 0 ? (
								<EmptyState message="No incidents found for the selected month." />
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200 text-xs">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
													Day
												</th>
												<th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
													Incidents
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-100">
											{incidentsByDay.map((row) => (
												<tr key={row.day} className="hover:bg-gray-50">
													<td className="px-2 py-0.5 whitespace-nowrap text-xs text-gray-900">
														Day {row.day}
													</td>
													<td className="px-2 py-0.5 whitespace-nowrap text-center text-xs text-gray-900">
														{row.incidents}
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
		</div>
	);
}
