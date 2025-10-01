import type {
	AggregatedRelationship,
	ParentChildRelationship,
} from "@app/core";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ColumnVisibilityControls from "@/components/ColumnVisibilityControls";
import CorrectiveMaintenanceExcelImport from "@/components/CorrectiveMaintenanceExcelImport";
import DataTable from "@/components/DataTable";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import FileUploadSection from "@/components/FileUploadSection";
import FilterControls from "@/components/FilterControls";
import L3SummaryTable from "@/components/L3SummaryTable";
import LoadingState from "@/components/LoadingState";
import MonthlyReportTable from "@/components/MonthlyReportTable";
import ParentChildExcelImport from "@/components/ParentChildExcelImport";
import RefreshButton from "@/components/RefreshButton";
import SemanalDateRangeSettings from "@/components/SemanalDateRangeSettings";
import SemanalFilter from "@/components/SemanalFilter";
import TabNavigation from "@/components/TabNavigation";
import WeeklyEvolutionTable, {
	type AdditionalInfoStat,
	type CategorizationStat,
	type ModuleStat,
} from "@/components/WeeklyEvolutionTable";
import { getPreloadHandler } from "@/constants/preloadHandlers";
import { formatEtaDate } from "@/utils/dateUtils";

type CorrectiveMaintenanceRecord = {
	requestId: string;
	requestIdLink?: string;
	createdTime: string;
	applications: string;
	categorization: string;
	requestStatus: string;
	module: string;
	subject: string;
	subjectLink?: string;
	priority: string;
	enlaces: number;
	eta: string;
	rca: string;
	businessUnit: string;
	inDateRange: boolean;
};

type MonthlyReportRecord = {
	requestId: string;
	requestIdLink?: string;
	createdTime: string;
	subject: string;
	requestStatus: string;
	priority: string;
	requester: string;
	requesterEmail: string;
	technician: string;
	technicianEmail: string;
	createdBy: string;
	lastUpdated: string;
	dueByTime: string;
	respondedTime: string;
	completedTime: string;
	closedTime: string;
	firstCallResolution: string;
	reopenedTime: string;
	reopenedBy: string;
	resolution: string;
	timeTakenToResolve: string;
	surveySent: string;
	surveyResult: string;
	satisfactionRating: string;
	surveyComments: string;
	assets: string;
	department: string;
	category: string;
	subcategory: string;
	item: string;
	status: string;
	impact: string;
	urgency: string;
	level: string;
	service: string;
	mode: string;
	approvalStatus: string;
	approvedBy: string;
	approvedTime: string;
	rejectedBy: string;
	rejectedTime: string;
	// Computed fields
	inDateRange: boolean;
	rep: string;
	dia: string;
	week: string;
	month: string;
	year: string;
	weekOfYear: number;
	monthOfYear: number;
	quarter: string;
	requestStatusReporte: string;
	informacionAdicionalReporte: string;
	enlaces: number;
	mensaje: string;
};

export const Route = createFileRoute("/weekly-report")({
	component: WeeklyReportComponent,
});

function WeeklyReportComponent() {
	const [relationships, setRelationships] = useState<
		ParentChildRelationship[]
	>([]);
	const [aggregatedData, setAggregatedData] = useState<
		AggregatedRelationship[]
	>([]);
	const [correctiveMaintenanceData, setCorrectiveMaintenanceData] = useState<
		CorrectiveMaintenanceRecord[]
	>([]);
	const [
		translatedCorrectiveMaintenanceData,
		setTranslatedCorrectiveMaintenanceData,
	] = useState<CorrectiveMaintenanceRecord[]>([]);
	const [translationProgress, setTranslationProgress] = useState<{
		completed: number;
		total: number;
		isTranslating: boolean;
	}>({ completed: 0, total: 0, isTranslating: false });
	const [loading, setLoading] = useState(true);
	const [aggregatedLoading, setAggregatedLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<
		| "raw-data"
		| "aggregated-data"
		| "monthly-report-data"
		| "corrective-maintenance"
	>("raw-data");

	const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<
		string | undefined
	>("SB");

	const [selectedRequestStatus, setSelectedRequestStatus] = useState<
		string | undefined
	>(undefined);

	const [availableRequestStatuses, setAvailableRequestStatuses] = useState<
		string[]
	>([]);

	const [
		availableMonthlyRequestStatuses,
		setAvailableMonthlyRequestStatuses,
	] = useState<string[]>([]);

	const [visibleColumns, setVisibleColumns] = useState({
		businessUnit: true,
		inDateRange: true,
		requestId: true,
		createdTime: true,
		applications: true,
		categorization: true,
		requestStatus: true,
		module: true,
		subject: true,
		priority: true,
		enlaces: true,
		eta: true,
		rca: true,
	});

	// Monthly Report state
	const [monthlyReportRecords, setMonthlyReportRecords] = useState<
		MonthlyReportRecord[]
	>([]);
	const [monthlyReportLoading, setMonthlyReportLoading] = useState(false);
	const [monthlyReportError, setMonthlyReportError] = useState<string | null>(
		null,
	);
	const [selectedMonthlyBusinessUnit, setSelectedMonthlyBusinessUnit] =
		useState<string | undefined>(undefined);
	const [selectedMonthlyRequestStatus, setSelectedMonthlyRequestStatus] =
		useState<string>("");
	const [monthlyVisibleColumns, setMonthlyVisibleColumns] = useState<
		Set<string>
	>(
		new Set([
			"requestId",
			"applications",
			"categorization",
			"createdTime",
			"requestStatus",
			"module",
			"subject",
			"priority",
			"priorityReporte",
			"eta",
			"additionalInfo",
			"resolvedTime",
			"affectedCountries",
			"recurrence",
			"technician",
			"jira",
			"problemId",
			"linkedRequestId",
			"requestOLAStatus",
			"escalationGroup",
			"affectedApplications",
			"shouldResolveLevel1",
			"campaign",
			"cuv1",
			"release",
			"rca",
			"businessUnit",
			"inDateRange",
			"rep",
			"dia",
			"week",
			"requestStatusReporte",
			"informacionAdicionalReporte",
			"enlaces",
			"mensaje",
		]),
	);

	// State for tracking semanal date range changes
	const [semanalRangeChangedMessage, setSemanalRangeChangedMessage] =
		useState<string | null>(null);

	// State for semanal filtering - default to 'inRange' to show only records within the semanal range
	const [semanalFilterMode, setSemanalFilterMode] = useState<
		"inRange" | "outOfRange" | "showAll"
	>("inRange");

	// State for corrective maintenance semanal filtering
	const [correctiveSemanalFilterMode, setCorrectiveSemanalFilterMode] =
		useState<"inRange" | "outOfRange" | "showAll">("inRange");
	const [
		correctiveSemanalRangeChangedMessage,
		setCorrectiveSemanalRangeChangedMessage,
	] = useState<string | null>(null);

	const tableRef = useRef<HTMLTableElement>(null);
	const correctiveMaintenanceTableRef = useRef<HTMLTableElement>(null);
	const monthlyReportFileInputRef = useRef<HTMLInputElement>(null);

	// Monthly Report result type
	interface MonthlyReportResult {
		success: boolean;
		data?: MonthlyReportRecord[];
		error?: string;
	}

	const loadRelationships = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const handler = getPreloadHandler("getAllParentChildRelationships");
			const data = (await handler()) as ParentChildRelationship[];
			setRelationships(data);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to load relationships",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	const loadAggregatedData = useCallback(async () => {
		try {
			setAggregatedLoading(true);
			const handler = getPreloadHandler(
				"getAggregatedParentChildRelationships",
			);
			const data = (await handler()) as AggregatedRelationship[];
			setAggregatedData(data);
		} catch (err) {
			console.error("Failed to load aggregated data:", err);
			// Don't set main error state for aggregated data
		} finally {
			setAggregatedLoading(false);
		}
	}, []);

	const loadCorrectiveMaintenanceData = useCallback(async () => {
		try {
			let data: CorrectiveMaintenanceRecord[];

			if (selectedRequestStatus) {
				// Use filtered search when request status is selected (business unit is required by backend)
				if (!selectedBusinessUnit) {
					// If no business unit selected but request status is, don't filter
					const handler = getPreloadHandler(
						"getAllCorrectiveMaintenanceRecords",
					);
					data = (await handler(
						undefined,
					)) as CorrectiveMaintenanceRecord[];
				} else {
					const handler = getPreloadHandler(
						"getCorrectiveMaintenanceRecordsByFilters",
					);
					data = (await handler(
						selectedBusinessUnit,
						selectedRequestStatus,
					)) as CorrectiveMaintenanceRecord[];
				}
			} else {
				// Use regular search for business unit only or all records
				const handler = getPreloadHandler(
					"getAllCorrectiveMaintenanceRecords",
				);
				data = (await handler(
					selectedBusinessUnit,
				)) as CorrectiveMaintenanceRecord[];
			}

			setCorrectiveMaintenanceData(data);
			// Reset translated data when new data is loaded
			setTranslatedCorrectiveMaintenanceData([]);
			setTranslationProgress({
				completed: 0,
				total: 0,
				isTranslating: false,
			});
		} catch (err) {
			console.error("Failed to load corrective maintenance data:", err);
			// Don't set main error state for corrective maintenance data
		}
	}, [selectedBusinessUnit, selectedRequestStatus]);

	const loadDistinctRequestStatuses = useCallback(async () => {
		try {
			const handler = getPreloadHandler("getDistinctRequestStatuses");
			const statuses = (await handler()) as string[];
			setAvailableRequestStatuses(statuses);
			console.log("Loaded distinct request statuses:", statuses);
		} catch (err) {
			console.error("Failed to load distinct request statuses:", err);
			// Don't set main error state for this
		}
	}, []);

	const loadDistinctMonthlyRequestStatuses = useCallback(async () => {
		try {
			const handler = getPreloadHandler(
				"getDistinctMonthlyRequestStatusReporte",
			);
			const statuses = (await handler()) as string[];
			setAvailableMonthlyRequestStatuses(statuses);
			console.log(
				"Loaded distinct monthly request statuses reporte:",
				statuses,
			);
		} catch (err) {
			console.error(
				"Failed to load distinct monthly request statuses reporte:",
				err,
			);
			// Don't set main error state for this
		}
	}, []);

	// Load corrective maintenance data when selectedBusinessUnit or selectedRequestStatus changes
	useEffect(() => {
		if (activeTab === "corrective-maintenance") {
			loadCorrectiveMaintenanceData();
		}
	}, [activeTab, loadCorrectiveMaintenanceData]);

	// Load distinct request statuses on component mount
	useEffect(() => {
		loadDistinctRequestStatuses();
		loadDistinctMonthlyRequestStatuses();
	}, [loadDistinctRequestStatuses, loadDistinctMonthlyRequestStatuses]);

	const translateCorrectiveMaintenanceData = useCallback(async () => {
		if (correctiveMaintenanceData.length === 0) {
			return;
		}

		console.log(
			`[Translation] Starting manual translation for ${correctiveMaintenanceData.length} corrective maintenance records`,
		);

		// Initialize with untranslated data
		setTranslatedCorrectiveMaintenanceData(correctiveMaintenanceData);
		setTranslationProgress({
			completed: 0,
			total: correctiveMaintenanceData.length,
			isTranslating: true,
		});

		try {
			const subjects = correctiveMaintenanceData.map(
				(record) => record.subject,
			);
			const translateHandler = getPreloadHandler("translateAllSubjects");

			console.log(
				`[Translation] Starting batch translation of ${subjects.length} subjects...`,
			);

			const translationResults = await translateHandler(subjects);

			// Update records with translations
			const updatedRecords = correctiveMaintenanceData.map((record) => {
				const translationResult = translationResults.find(
					(result) => result.original === record.subject,
				);
				return {
					...record,
					subject: translationResult
						? translationResult.translated
						: record.subject,
				};
			});

			setTranslatedCorrectiveMaintenanceData(updatedRecords);
			setTranslationProgress({
				completed: correctiveMaintenanceData.length,
				total: correctiveMaintenanceData.length,
				isTranslating: false,
			});

			console.log(
				`[Translation] Manual translation completed for ${translationResults.length} subjects`,
			);
		} catch (error) {
			console.error("[Translation] Manual translation failed:", error);
			setTranslationProgress((prev) => ({
				...prev,
				isTranslating: false,
			}));
			// Keep untranslated data on error
		}
	}, [correctiveMaintenanceData]);

	useEffect(() => {
		loadRelationships();
		loadAggregatedData();
		loadCorrectiveMaintenanceData();
		loadDistinctRequestStatuses();
		loadDistinctMonthlyRequestStatuses();
	}, [
		loadRelationships,
		loadAggregatedData,
		loadCorrectiveMaintenanceData,
		loadDistinctRequestStatuses,
		loadDistinctMonthlyRequestStatuses,
	]);

	const handleExternalLink = async (url: string) => {
		try {
			const openExternal = getPreloadHandler("openExternal");
			if (openExternal) {
				await openExternal(url);
			}
		} catch (error) {
			console.error("Failed to open external link:", error);
		}
	};

	// Handle copy events on the table to preserve hyperlinks
	const handleTableCopy = useCallback((e: ClipboardEvent) => {
		if (!tableRef.current) return;

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		const range = selection.getRangeAt(0);
		if (!tableRef.current.contains(range.commonAncestorContainer)) return;

		// Prevent default copy and create HTML content
		e.preventDefault();

		let html = '<table border="1" style="border-collapse: collapse;">';
		let text = "";

		// Get selected table rows
		const selectedRows = Array.from(
			tableRef.current.querySelectorAll("tbody tr"),
		).filter((row) => {
			const rowRange = document.createRange();
			rowRange.selectNodeContents(row);
			return selection.containsNode(
				rowRange.commonAncestorContainer,
				true,
			);
		});

		if (selectedRows.length === 0) return;

		// Add header
		html +=
			'<thead><tr><th style="padding: 8px; background-color: #f9fafb;">Linked Request ID</th><th style="padding: 8px; background-color: #f9fafb;">Count</th></tr></thead><tbody>';
		text += "Linked Request ID\tCount\n";

		selectedRows.forEach((row) => {
			const cells = row.querySelectorAll("td");
			if (cells.length >= 2) {
				const linkElement = cells[0].querySelector("a");
				const linkHref = linkElement?.getAttribute("href") || "";
				const displayText =
					linkElement?.textContent || cells[0].textContent || "";
				const count = cells[1].textContent || "";

				if (linkHref) {
					html += `<tr><td style="padding: 8px;"><a href="${linkHref}">${displayText}</a></td><td style="padding: 8px;">${count}</td></tr>`;
				} else {
					html += `<tr><td style="padding: 8px;">${displayText}</td><td style="padding: 8px;">${count}</td></tr>`;
				}
				text += `${displayText}\t${count}\n`;
			}
		});

		html += "</tbody></table>";

		// Set clipboard data
		e.clipboardData?.setData("text/html", html);
		e.clipboardData?.setData("text/plain", text);
	}, []);

	// Handle copy events on the corrective maintenance table to preserve hyperlinks
	const handleCorrectiveMaintenanceTableCopy = useCallback(
		(e: ClipboardEvent) => {
			if (!correctiveMaintenanceTableRef.current) return;

			const selection = window.getSelection();
			if (!selection || selection.rangeCount === 0) return;

			const range = selection.getRangeAt(0);
			if (
				!correctiveMaintenanceTableRef.current.contains(
					range.commonAncestorContainer,
				)
			)
				return;

			// Prevent default copy and create HTML content
			e.preventDefault();

			let html = '<table border="1" style="border-collapse: collapse;">';
			let text = "";

			// Get selected table rows
			const selectedRows = Array.from(
				correctiveMaintenanceTableRef.current.querySelectorAll(
					"tbody tr",
				),
			).filter((row) => {
				const rowRange = document.createRange();
				rowRange.selectNodeContents(row);
				return selection.containsNode(
					rowRange.commonAncestorContainer,
					true,
				);
			});

			if (selectedRows.length === 0) return;

			// Build header based on visible columns
			html += "<thead><tr>";
			let headerText = "";
			const columnOrder = [
				{ key: "businessUnit", label: "Business Unit" },
				{ key: "inDateRange", label: "In Date Range" },
				{ key: "requestId", label: "Request ID" },
				{ key: "createdTime", label: "Created Time" },
				{ key: "applications", label: "Applications" },
				{ key: "categorization", label: "Categorization" },
				{ key: "requestStatus", label: "Request Status" },
				{ key: "module", label: "Module" },
				{ key: "subject", label: "Subject" },
				{ key: "priority", label: "Priority" },
				{ key: "enlaces", label: "Enlaces" },
				{ key: "eta", label: "ETA" },
				{ key: "rca", label: "RCA" },
			];

			columnOrder.forEach((col) => {
				if (visibleColumns[col.key as keyof typeof visibleColumns]) {
					html += `<th style="padding: 8px; background-color: #f9fafb;">${col.label}</th>`;
					headerText += col.label + "\t";
				}
			});
			html += "</tr></thead><tbody>";
			text += headerText.trim() + "\n";

			selectedRows.forEach((row) => {
				const cells = row.querySelectorAll("td");
				let cellIndex = 0;
				let rowHtml = "<tr>";
				let rowText = "";

				columnOrder.forEach((col) => {
					if (
						visibleColumns[col.key as keyof typeof visibleColumns]
					) {
						const cell = cells[cellIndex];
						if (cell) {
							const cellContent = cell.textContent || "";
							rowHtml += `<td style="padding: 8px;">${cellContent}</td>`;
							rowText += cellContent + "\t";
						}
						cellIndex++;
					}
				});

				html += rowHtml + "</tr>";
				text += rowText.trim() + "\n";
			});

			html += "</tbody></table>";

			// Set clipboard data
			e.clipboardData?.setData("text/html", html);
			e.clipboardData?.setData("text/plain", text);
		},
		[visibleColumns],
	);

	// Attach copy event listener to table
	useEffect(() => {
		const table = tableRef.current;
		if (table) {
			table.addEventListener("copy", handleTableCopy);
			return () => table.removeEventListener("copy", handleTableCopy);
		}
	}, [handleTableCopy]);

	// Attach copy event listener to corrective maintenance table
	useEffect(() => {
		const table = correctiveMaintenanceTableRef.current;
		if (table) {
			table.addEventListener(
				"copy",
				handleCorrectiveMaintenanceTableCopy,
			);
			return () =>
				table.removeEventListener(
					"copy",
					handleCorrectiveMaintenanceTableCopy,
				);
		}
	}, [handleCorrectiveMaintenanceTableCopy]);

	// Monthly Report handlers
	const loadMonthlyReportRecords = useCallback(async () => {
		setMonthlyReportLoading(true);
		setMonthlyReportError(null);

		try {
			let result: MonthlyReportResult;

			if (selectedMonthlyBusinessUnit) {
				// Use filtered search when business unit is selected
				const handler = getPreloadHandler(
					"getMonthlyReportRecordsByBusinessUnit",
				);
				result = (await handler(
					selectedMonthlyBusinessUnit,
				)) as MonthlyReportResult;
			} else {
				// Load all records when no filter is selected
				const handler = getPreloadHandler("getAllMonthlyReportRecords");
				result = (await handler()) as MonthlyReportResult;
			}

			if (result.success) {
				setMonthlyReportRecords(result.data || []);
			} else {
				setMonthlyReportError(result.error || "Failed to load records");
			}
		} catch (err) {
			setMonthlyReportError(
				err instanceof Error ? err.message : "Unknown error occurred",
			);
		} finally {
			setMonthlyReportLoading(false);
		}
	}, [selectedMonthlyBusinessUnit]);

	const handleMonthlyFileUpload = useCallback(
		async (file: File) => {
			setMonthlyReportLoading(true);
			setMonthlyReportError(null);

			try {
				const buffer = await file.arrayBuffer();
				const result = (await getPreloadHandler("parseMonthlyReport")(
					buffer,
					file.name,
				)) as MonthlyReportResult;

				if (result.success) {
					await loadMonthlyReportRecords(); // Refresh the data
					await loadDistinctMonthlyRequestStatuses(); // Refresh filter options
					setSemanalRangeChangedMessage(null); // Clear warning message after successful Excel reload
				} else {
					setMonthlyReportError(
						result.error || "Failed to parse Excel file",
					);
				}
			} catch (err) {
				setMonthlyReportError(
					err instanceof Error
						? err.message
						: "Unknown error occurred",
				);
			} finally {
				setMonthlyReportLoading(false);
			}
		},
		[loadMonthlyReportRecords, loadDistinctMonthlyRequestStatuses],
	);

	// Load monthly report data when monthly-report-data tab is active or filter changes
	useEffect(() => {
		if (activeTab === "monthly-report-data") {
			loadMonthlyReportRecords();
		}
	}, [activeTab, selectedMonthlyBusinessUnit, loadMonthlyReportRecords]);

	// Convert Set to Record for component compatibility
	// Include ALL possible columns, setting them to true/false based on Set membership
	const allMonthlyColumns = [
		"requestId",
		"applications",
		"categorization",
		"createdTime",
		"requestStatus",
		"module",
		"subject",
		"priority",
		"priorityReporte",
		"eta",
		"additionalInfo",
		"resolvedTime",
		"affectedCountries",
		"recurrence",
		"technician",
		"jira",
		"problemId",
		"linkedRequestId",
		"requestOLAStatus",
		"escalationGroup",
		"affectedApplications",
		"shouldResolveLevel1",
		"campaign",
		"cuv1",
		"release",
		"rca",
		"businessUnit",
		"inDateRange",
		"rep",
		"dia",
		"week",
		"requestStatusReporte",
		"informacionAdicionalReporte",
		"enlaces",
		"mensaje",
	];
	const monthlyVisibleColumnsRecord = allMonthlyColumns.reduce(
		(acc, col) => {
			acc[col] = monthlyVisibleColumns.has(col);
			return acc;
		},
		{} as Record<string, boolean>,
	);

	// Apply request status filter (for main table and semanal counts)
	const baseFilteredMonthlyRecords = useMemo(() => {
		let filtered = monthlyReportRecords;
		if (
			selectedMonthlyRequestStatus &&
			selectedMonthlyRequestStatus !== ""
		) {
			filtered = filtered.filter(
				(r) => r.requestStatusReporte === selectedMonthlyRequestStatus,
			);
		}
		return filtered;
	}, [monthlyReportRecords, selectedMonthlyRequestStatus]);

	// Filter monthly report records based on semanal filter mode
	const filteredMonthlyRecords = useMemo(() => {
		// Apply semanal filter on top of request status filter
		switch (semanalFilterMode) {
			case "inRange":
				return baseFilteredMonthlyRecords.filter(
					(r) => r.inDateRange === true,
				);
			case "outOfRange":
				return baseFilteredMonthlyRecords.filter(
					(r) => r.inDateRange === false,
				);
			case "showAll":
				return baseFilteredMonthlyRecords;
			default:
				return baseFilteredMonthlyRecords.filter(
					(r) => r.inDateRange === true,
				);
		}
	}, [baseFilteredMonthlyRecords, semanalFilterMode]);

	// Calculate counts for the semanal filter component
	const semanalCounts = useMemo(() => {
		const inRangeCount = baseFilteredMonthlyRecords.filter(
			(r) => r.inDateRange === true,
		).length;
		const outOfRangeCount = baseFilteredMonthlyRecords.filter(
			(r) => r.inDateRange === false,
		).length;
		const totalCount = baseFilteredMonthlyRecords.length;

		return { inRangeCount, outOfRangeCount, totalCount };
	}, [baseFilteredMonthlyRecords]);

	// Filter corrective maintenance records based on semanal filter mode
	const filteredCorrectiveRecords = useMemo(() => {
		const records =
			translatedCorrectiveMaintenanceData.length > 0
				? translatedCorrectiveMaintenanceData
				: correctiveMaintenanceData;

		switch (correctiveSemanalFilterMode) {
			case "inRange":
				return records.filter((r) => r.inDateRange === true);
			case "outOfRange":
				return records.filter((r) => r.inDateRange === false);
			case "showAll":
				return records;
			default:
				return records.filter((r) => r.inDateRange === true); // Default to in range
		}
	}, [
		correctiveMaintenanceData,
		translatedCorrectiveMaintenanceData,
		correctiveSemanalFilterMode,
	]);

	// Calculate counts for corrective maintenance semanal filter
	const correctiveSemanalCounts = useMemo(() => {
		const records =
			translatedCorrectiveMaintenanceData.length > 0
				? translatedCorrectiveMaintenanceData
				: correctiveMaintenanceData;

		const inRangeCount = records.filter(
			(r) => r.inDateRange === true,
		).length;
		const outOfRangeCount = records.filter(
			(r) => r.inDateRange === false,
		).length;
		const totalCount = records.length;

		return { inRangeCount, outOfRangeCount, totalCount };
	}, [correctiveMaintenanceData, translatedCorrectiveMaintenanceData]);

	// Calculate module statistics for Weekly Evolution of Incidents
	const moduleStats = useMemo(() => {
		// Filter by business unit and semanal mode (ignore request status)
		let filteredRecords = monthlyReportRecords;

		if (selectedMonthlyBusinessUnit) {
			filteredRecords = filteredRecords.filter(
				(r) => r.businessUnit === selectedMonthlyBusinessUnit,
			);
		}

		// Respect semanal filter mode
		switch (semanalFilterMode) {
			case "inRange":
				filteredRecords = filteredRecords.filter(
					(r) => r.inDateRange === true,
				);
				break;
			case "outOfRange":
				filteredRecords = filteredRecords.filter(
					(r) => r.inDateRange === false,
				);
				break;
			case "showAll":
				// Show all dates
				break;
			default:
				filteredRecords = filteredRecords.filter(
					(r) => r.inDateRange === true,
				);
		}

		// Group by module, categorization, and additional info
		const moduleData = new Map<
			string,
			Map<string, Map<string, { count: number; mensajes: Set<string> }>>
		>();

		filteredRecords.forEach((record) => {
			const module = record.module || "Unknown";
			const categorization = record.categorization || "Unknown";
			const additionalInfo =
				record.informacionAdicionalReporte &&
				record.informacionAdicionalReporte !== "No asignado"
					? record.informacionAdicionalReporte
					: record.requestStatusReporte || "No additional info";

			if (!moduleData.has(module)) {
				moduleData.set(
					module,
					new Map<
						string,
						Map<string, { count: number; mensajes: Set<string> }>
					>(),
				);
			}

			const categorizationMap = moduleData.get(module)!;
			if (!categorizationMap.has(categorization)) {
				categorizationMap.set(
					categorization,
					new Map<string, { count: number; mensajes: Set<string> }>(),
				);
			}

			const additionalInfoMap = categorizationMap.get(categorization)!;
			const current = additionalInfoMap.get(additionalInfo) || {
				count: 0,
				mensajes: new Set<string>(),
			};

			// Add the mensaje to the set only if we're using the original informacionAdicionalReporte (not the fallback)
			const isUsingFallback =
				!record.informacionAdicionalReporte ||
				record.informacionAdicionalReporte === "No asignado";
			if (!isUsingFallback && record.mensaje && record.mensaje.trim()) {
				current.mensajes.add(record.mensaje.trim());
			}

			additionalInfoMap.set(additionalInfo, {
				count: current.count + 1,
				mensajes: current.mensajes,
			});
		});

		// Calculate total and convert to array with percentages and categorization breakdown
		const totalCount = filteredRecords.length;
		const stats: ModuleStat[] = Array.from(moduleData.entries())
			.map(([module, categorizationMap]) => {
				const moduleCount = Array.from(
					categorizationMap.values(),
				).reduce(
					(sum, additionalInfoMap) =>
						sum +
						Array.from(additionalInfoMap.values()).reduce(
							(infoSum, data) => infoSum + data.count,
							0,
						),
					0,
				);

				const categorizations: CategorizationStat[] = Array.from(
					categorizationMap.entries(),
				)
					.map(([name, additionalInfoMap]) => {
						const categorizationCount = Array.from(
							additionalInfoMap.values(),
						).reduce((sum, data) => sum + data.count, 0);

						const additionalInfos: AdditionalInfoStat[] =
							Array.from(additionalInfoMap.entries())
								.map(([info, data]) => ({
									info,
									count: data.count,
									mensaje: Array.from(data.mensajes).join(
										", ",
									),
								}))
								.sort((a, b) => b.count - a.count); // Sort additional infos by count descending

						return {
							name,
							count: categorizationCount,
							additionalInfos,
						};
					})
					.sort((a, b) => b.count - a.count); // Sort categorizations by count descending

				return {
					module,
					count: moduleCount,
					percentage:
						totalCount > 0 ? (moduleCount / totalCount) * 100 : 0,
					categorizations,
				};
			})
			.sort((a, b) => b.count - a.count); // Sort modules by count descending

		return stats;
	}, [monthlyReportRecords, selectedMonthlyBusinessUnit, semanalFilterMode]);

	const handleMonthlyColumnVisibilityChange = useCallback(
		(columnKey: string, isVisible: boolean) => {
			setMonthlyVisibleColumns((prev) => {
				const newSet = new Set(prev);
				if (isVisible) {
					newSet.add(columnKey);
				} else {
					newSet.delete(columnKey);
				}
				return newSet;
			});
		},
		[],
	);

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-3xl font-bold text-gray-800 mb-6">
						Weekly Report
					</h1>
					<LoadingState message="Loading parent-child relationships..." />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-3xl font-bold text-gray-800 mb-6">
						Weekly Report
					</h1>
					<ErrorState
						message={error}
						onRetry={() => window.location.reload()}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-800 mb-6">
					Weekly Report
				</h1>

				{/* Tab Navigation */}
				<TabNavigation
					activeTab={activeTab}
					onTabChange={(
						tab:
							| "raw-data"
							| "aggregated-data"
							| "monthly-report-data"
							| "corrective-maintenance",
					) => setActiveTab(tab)}
					tabs={[
						{ id: "raw-data", label: "Parent-Child Relationships" },
						{ id: "aggregated-data", label: "Aggregated Data" },
						{
							id: "monthly-report-data",
							label: "Monthly Report Data",
						},
						{
							id: "corrective-maintenance",
							label: "Corrective Maintenance",
						},
					]}
				/>

				{/* Tab Content */}
				{activeTab === "raw-data" && (
					<div className="space-y-6">
						{/* File Upload Section */}
						<FileUploadSection
							title="Upload Parent-Child Report"
							description="Upload an Excel file to parse and save parent-child relationship data"
						>
							<ParentChildExcelImport
								onSuccess={() => {
									loadRelationships();
									loadAggregatedData();
								}}
							/>
						</FileUploadSection>

						<div className="bg-white rounded-lg shadow-md">
							<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
								<div>
									<h3 className="text-lg font-medium text-gray-900">
										Parent-Child Relationships
									</h3>
									<p className="text-sm text-gray-500">
										{relationships.length} relationship
										{relationships.length !== 1 ? "s" : ""}{" "}
										found
									</p>
								</div>
								<RefreshButton
									onClick={loadRelationships}
									loading={loading}
								/>
							</div>
							{relationships.length > 0 ? (
								<DataTable
									data={relationships}
									columns={[
										{
											key: "parentRequestId",
											label: "Parent Request ID",
											render: (value, row) =>
												(row as any).parentLink ? (
													<button
														type="button"
														onClick={() =>
															(row as any)
																.parentLink &&
															handleExternalLink(
																(row as any)
																	.parentLink,
															)
														}
														className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
													>
														{value as string}
													</button>
												) : (
													(value as string)
												),
										},
										{
											key: "childRequestId",
											label: "Child Request ID",
											render: (value, row) =>
												(row as any).childLink ? (
													<button
														type="button"
														onClick={() =>
															(row as any)
																.childLink &&
															handleExternalLink(
																(row as any)
																	.childLink,
															)
														}
														className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
													>
														{value as string}
													</button>
												) : (
													(value as string)
												),
										},
										{
											key: "createdAt",
											label: "Created At",
											render: (value) =>
												new Date(
													value as
														| string
														| number
														| Date,
												).toLocaleString(),
										},
										{
											key: "updatedAt",
											label: "Updated At",
											render: (value) =>
												new Date(
													value as
														| string
														| number
														| Date,
												).toLocaleString(),
										},
									]}
									getRowKey={(row, index) =>
										`${row.parentRequestId}-${row.childRequestId}-${index}`
									}
								/>
							) : (
								<EmptyState
									title="No relationships found"
									description="Upload an Excel file to get started with parent-child relationship data."
								/>
							)}
						</div>
					</div>
				)}

				{activeTab === "aggregated-data" && (
					<div className="bg-white rounded-lg shadow-md">
						<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
							<div>
								<h3 className="text-lg font-medium text-gray-900">
									Aggregated Parent-Child Relationships
								</h3>
								<p className="text-sm text-gray-500">
									{aggregatedData.length} unique parent
									{aggregatedData.length !== 1 ? "s" : ""}{" "}
									found
								</p>
							</div>
							<RefreshButton
								onClick={loadAggregatedData}
								loading={aggregatedLoading}
							>
								Refresh
							</RefreshButton>
						</div>
						<div className="overflow-x-auto">
							{aggregatedData.length > 0 ? (
								<DataTable
									data={aggregatedData}
									columns={[
										{
											key: "linkedRequestId",
											label: "Linked Request ID",
											render: (
												_value: unknown,
												row: AggregatedRelationship,
											) => {
												const link =
													row.relationships.find(
														(rel) => rel.childLink,
													)?.childLink;
												return link ? (
													<a
														href={link}
														onClick={(e) => {
															e.preventDefault();
															handleExternalLink(
																link,
															);
														}}
														className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
													>
														{row.linkedRequestId}
													</a>
												) : (
													row.linkedRequestId
												);
											},
										},
										{
											key: "requestCount",
											label: "Count",
											render: (
												_value: unknown,
												row: AggregatedRelationship,
											) => row.requestCount,
										},
									]}
									tableRef={
										tableRef as React.RefObject<HTMLTableElement>
									}
								/>
							) : (
								<EmptyState
									title="No aggregated data found"
									description="Upload an Excel file to see aggregated parent-child relationship statistics."
									icon={
										<svg
											className="mx-auto h-12 w-12 text-gray-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											aria-labelledby="empty-aggregated-icon"
										>
											<title id="empty-aggregated-icon">
												Empty aggregated data icon
											</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
											/>
										</svg>
									}
								/>
							)}
						</div>
					</div>
				)}

				{activeTab === "monthly-report-data" && (
					<div className="mt-4">
						{/* Semanal Date Range Settings */}
						<div className="mb-6">
							<SemanalDateRangeSettings
								onSettingsChange={(message) =>
									setSemanalRangeChangedMessage(message)
								}
							/>
						</div>

						{/* Warning message when semanal range has been changed */}
						{semanalRangeChangedMessage && (
							<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
								<div className="flex items-start">
									<div className="flex-shrink-0">
										<svg
											className="h-5 w-5 text-yellow-400"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<div className="ml-3">
										<h3 className="text-sm font-medium text-yellow-800">
											Excel Reload Required
										</h3>
										<p className="mt-1 text-sm text-yellow-700">
											{semanalRangeChangedMessage} Please
											upload your Excel file again to
											reflect the new Semanal calculation
											range.
										</p>
									</div>
								</div>
							</div>
						)}

						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
							<FileUploadSection
								title="Upload Monthly Report Excel File"
								description="Select an Excel file containing monthly incident report data"
							>
								<div className="space-y-4">
									<input
										type="file"
										ref={monthlyReportFileInputRef}
										accept=".xlsx,.xls"
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) {
												handleMonthlyFileUpload(file);
											}
										}}
										className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
									/>
								</div>
							</FileUploadSection>
						</div>

						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold text-gray-900">
									Monthly Report Records
								</h2>
								<div className="flex gap-2">
									<RefreshButton
										onClick={loadMonthlyReportRecords}
									/>
									<ColumnVisibilityControls
										columns={monthlyVisibleColumnsRecord}
										onColumnVisibilityChange={
											handleMonthlyColumnVisibilityChange
										}
									/>
								</div>
							</div>

							{/* Filters */}
							<FilterControls
								businessUnits={[
									"FFVV",
									"SB",
									"UB-3",
									"UN-2",
									"CD",
									"PROL",
								]}
								selectedBusinessUnit={
									selectedMonthlyBusinessUnit
								}
								onBusinessUnitChange={
									setSelectedMonthlyBusinessUnit
								}
								requestStatuses={
									availableMonthlyRequestStatuses
								}
								selectedRequestStatus={
									selectedMonthlyRequestStatus
								}
								onRequestStatusChange={
									setSelectedMonthlyRequestStatus
								}
							/>

							{/* Semanal Range Filter */}
							<SemanalFilter
								filterMode={semanalFilterMode}
								onFilterModeChange={setSemanalFilterMode}
								inRangeCount={semanalCounts.inRangeCount}
								outOfRangeCount={semanalCounts.outOfRangeCount}
								totalCount={semanalCounts.totalCount}
							/>

							{filteredMonthlyRecords.length === 0 ? (
								<EmptyState
									title="No Monthly Report Records"
									description={
										monthlyReportRecords.length === 0
											? "Upload an Excel file to get started with monthly report data processing"
											: "No records match the current filter criteria"
									}
								/>
							) : (
								<>
									<MonthlyReportTable
										records={filteredMonthlyRecords}
										visibleColumns={
											monthlyVisibleColumnsRecord
										}
										onOpenExternal={(url) => {
											const handler =
												getPreloadHandler(
													"openExternal",
												);
											handler(url);
										}}
									/>

									{/* Weekly Evolution of Incidents Table */}
									<WeeklyEvolutionTable
										moduleStats={moduleStats}
										businessUnit={
											selectedMonthlyBusinessUnit
										}
									/>
								</>
							)}
						</div>
					</div>
				)}

				{activeTab === "corrective-maintenance" && (
					<div className="mt-4">
						{/* Semanal Date Range Settings */}
						<div className="mb-6">
							<SemanalDateRangeSettings
								onSettingsChange={(message) =>
									setCorrectiveSemanalRangeChangedMessage(
										message,
									)
								}
							/>
						</div>

						{/* Warning message when semanal range has been changed */}
						{correctiveSemanalRangeChangedMessage && (
							<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
								<div className="flex items-start">
									<svg
										className="h-5 w-5 text-yellow-400 mt-0.5"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fillRule="evenodd"
											d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
											clipRule="evenodd"
										/>
									</svg>
									<div className="ml-3 flex-1">
										<h3 className="text-sm font-medium text-yellow-800">
											Excel Reload Required
										</h3>
										<p className="mt-1 text-sm text-yellow-700">
											{
												correctiveSemanalRangeChangedMessage
											}{" "}
											Please upload your Excel file again
											to reflect the new Semanal
											calculation range.
										</p>
									</div>
									<button
										type="button"
										onClick={() =>
											setCorrectiveSemanalRangeChangedMessage(
												null,
											)
										}
										className="ml-3 inline-flex text-yellow-400 hover:text-yellow-500 focus:outline-none"
									>
										<span className="sr-only">Dismiss</span>
										<svg
											className="h-5 w-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												clipRule="evenodd"
											/>
										</svg>
									</button>
								</div>
							</div>
						)}

						<div className="flex justify-between items-center mb-4">
							<div>
								<h3 className="text-lg font-medium text-gray-900">
									Corrective Maintenance Records
								</h3>
								<div className="flex items-center gap-4">
									<p className="text-sm text-gray-500">
										{translatedCorrectiveMaintenanceData.length >
										0
											? translatedCorrectiveMaintenanceData.length
											: correctiveMaintenanceData.length}{" "}
										maintenance
										{(translatedCorrectiveMaintenanceData.length >
										0
											? translatedCorrectiveMaintenanceData.length
											: correctiveMaintenanceData.length) !==
										1
											? " records"
											: " record"}{" "}
										found
									</p>
									{translationProgress.isTranslating && (
										<div className="flex items-center gap-2 text-sm text-blue-600">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
											<span>
												Translating...{" "}
												{translationProgress.completed}/
												{translationProgress.total}
											</span>
										</div>
									)}
									{!translationProgress.isTranslating &&
										translationProgress.total > 0 &&
										translationProgress.completed ===
											translationProgress.total && (
											<div className="flex items-center gap-2 text-sm text-green-600">
												<svg
													className="h-4 w-4"
													fill="currentColor"
													viewBox="0 0 20 20"
													aria-labelledby="translation-complete-icon"
												>
													<title id="translation-complete-icon">
														Translation completed
													</title>
													<path
														fillRule="evenodd"
														d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
														clipRule="evenodd"
													/>
												</svg>
												<span>
													All subjects translated
												</span>
											</div>
										)}
								</div>
							</div>
							<div className="flex items-center gap-2">
								{correctiveMaintenanceData.length > 0 && (
									<button
										type="button"
										onClick={
											translateCorrectiveMaintenanceData
										}
										disabled={
											translationProgress.isTranslating
										}
										className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
									>
										{translationProgress.isTranslating ? (
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
										) : (
											<svg
												className="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												aria-labelledby="translate-icon"
											>
												<title id="translate-icon">
													Translate icon
												</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
												/>
											</svg>
										)}
										{translationProgress.isTranslating
											? "Translating..."
											: "Translate Subjects"}
									</button>
								)}
								<CorrectiveMaintenanceExcelImport
									onSuccess={() => {
										loadCorrectiveMaintenanceData();
									}}
								/>
							</div>
						</div>
						{/* Filters */}
						<FilterControls
							businessUnits={[
								"FFVV",
								"SB",
								"UB-3",
								"UN-2",
								"CD",
								"PROL",
							]}
							selectedBusinessUnit={selectedBusinessUnit}
							onBusinessUnitChange={setSelectedBusinessUnit}
							requestStatuses={availableRequestStatuses}
							selectedRequestStatus={selectedRequestStatus}
							onRequestStatusChange={setSelectedRequestStatus}
						/>

						{/* Semanal Range Filter */}
						<SemanalFilter
							filterMode={correctiveSemanalFilterMode}
							onFilterModeChange={setCorrectiveSemanalFilterMode}
							inRangeCount={correctiveSemanalCounts.inRangeCount}
							outOfRangeCount={
								correctiveSemanalCounts.outOfRangeCount
							}
							totalCount={correctiveSemanalCounts.totalCount}
						/>

						{/* Column Visibility Controls */}
						<ColumnVisibilityControls
							columns={visibleColumns}
							onColumnVisibilityChange={(
								columnKey,
								isVisible,
							) => {
								setVisibleColumns((prev) => ({
									...prev,
									[columnKey]: isVisible,
								}));
							}}
						/>
						<div className="overflow-x-auto">
							{filteredCorrectiveRecords.length > 0 ? (
								<table
									ref={correctiveMaintenanceTableRef}
									className="min-w-full divide-y divide-gray-200"
								>
									<thead className="bg-gray-50">
										<tr>
											{visibleColumns.businessUnit && (
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Business Unit
												</th>
											)}
											{visibleColumns.inDateRange && (
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													In Date Range
												</th>
											)}
											{visibleColumns.requestId && (
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Request ID
												</th>
											)}
											{visibleColumns.createdTime && (
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Created Time
												</th>
											)}
											{visibleColumns.applications && (
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Applications
												</th>
											)}
											{visibleColumns.categorization && (
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Categorization
												</th>
											)}
											{visibleColumns.requestStatus && (
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Request Status
												</th>
											)}
											{visibleColumns.module && (
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Module
												</th>
											)}
											{visibleColumns.subject && (
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Subject
												</th>
											)}
											{visibleColumns.priority && (
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Priority
												</th>
											)}
											{visibleColumns.enlaces && (
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Enlaces
												</th>
											)}
											{visibleColumns.eta && (
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													ETA
												</th>
											)}
											{visibleColumns.rca && (
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													RCA
												</th>
											)}
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{filteredCorrectiveRecords.map(
											(record, index) => (
												<tr
													key={
														record.requestId ||
														index
													}
												>
													{visibleColumns.businessUnit && (
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{
																record.businessUnit
															}
														</td>
													)}
													{visibleColumns.inDateRange && (
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{record.inDateRange ? (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																	<svg
																		className="w-4 h-4 mr-1"
																		fill="currentColor"
																		viewBox="0 0 20 20"
																		role="img"
																		aria-labelledby="check-icon"
																	>
																		<title id="check-icon">
																			Yes
																		</title>
																		<path
																			fillRule="evenodd"
																			d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																			clipRule="evenodd"
																		/>
																	</svg>
																	Yes
																</span>
															) : (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
																	<svg
																		className="w-4 h-4 mr-1"
																		fill="currentColor"
																		viewBox="0 0 20 20"
																		role="img"
																		aria-labelledby="x-icon"
																	>
																		<title id="x-icon">
																			No
																		</title>
																		<path
																			fillRule="evenodd"
																			d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
																			clipRule="evenodd"
																		/>
																	</svg>
																	No
																</span>
															)}
														</td>
													)}
													{visibleColumns.requestId && (
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{record.requestIdLink ? (
																<button
																	type="button"
																	onClick={() => {
																		if (
																			record.requestIdLink
																		) {
																			const handler =
																				getPreloadHandler(
																					"openExternal",
																				);
																			handler(
																				record.requestIdLink,
																			);
																		}
																	}}
																	className="text-blue-600 hover:text-blue-800 underline"
																>
																	{
																		record.requestId
																	}
																</button>
															) : (
																record.requestId
															)}
														</td>
													)}
													{visibleColumns.createdTime && (
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{record.createdTime}
														</td>
													)}
													{visibleColumns.applications && (
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{
																record.applications
															}
														</td>
													)}
													{visibleColumns.categorization && (
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{
																record.categorization
															}
														</td>
													)}
													{visibleColumns.requestStatus && (
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{
																record.requestStatus
															}
														</td>
													)}
													{visibleColumns.module && (
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{record.module}
														</td>
													)}
													{visibleColumns.subject && (
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{record.subjectLink ? (
																<button
																	type="button"
																	onClick={() => {
																		if (
																			record.subjectLink
																		) {
																			const handler =
																				getPreloadHandler(
																					"openExternal",
																				);
																			handler(
																				record.subjectLink,
																			);
																		}
																	}}
																	className="text-blue-600 hover:text-blue-800 underline"
																>
																	{
																		record.subject
																	}
																</button>
															) : (
																record.subject
															)}
														</td>
													)}
													{visibleColumns.priority && (
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{record.priority}
														</td>
													)}
													{visibleColumns.enlaces && (
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{record.enlaces}
														</td>
													)}
													{visibleColumns.eta && (
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{(() => {
																const etaFormatted =
																	formatEtaDate(
																		record.eta,
																	);
																return etaFormatted.original ? (
																	<span
																		title={
																			etaFormatted.original
																		}
																	>
																		{
																			etaFormatted.display
																		}
																	</span>
																) : (
																	etaFormatted.display
																);
															})()}
														</td>
													)}
													{visibleColumns.rca && (
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{record.rca}
														</td>
													)}
												</tr>
											),
										)}
									</tbody>
								</table>
							) : (
								<EmptyState
									title="No Corrective Maintenance Records"
									description={
										correctiveMaintenanceData.length === 0
											? "Upload an Excel file to get started with corrective maintenance data processing"
											: "No records match the current filter criteria"
									}
									icon={
										<svg
											className="mx-auto h-12 w-12 text-gray-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											aria-labelledby="no-data-icon-title"
										>
											<title id="no-data-icon-title">
												No data icon
											</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
											/>
										</svg>
									}
								/>
							)}
						</div>

						{/* L3 Summary Table */}
						{filteredCorrectiveRecords.length > 0 && (
							<div className="mt-6">
								<L3SummaryTable
									records={filteredCorrectiveRecords}
									businessUnit={selectedBusinessUnit}
								/>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
