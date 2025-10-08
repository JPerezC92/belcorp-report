import React, { useMemo } from "react";
import IncidentOverviewTable, {
	type IncidentOverviewData,
} from "./IncidentOverviewTable";

interface MonthlyReportRecord {
	inDateRange: boolean;
	requestStatusReporte: string;
	categorization: string;
	recurrence: string;
	recurrenceComputed: string | null;
	[key: string]: any;
}

interface CorrectiveMaintenanceRecord {
	inDateRange: boolean;
	requestStatus: string;
	businessUnit: string;
	[key: string]: any;
}

export interface IncidentOverviewSectionProps {
	monthlyRecords: MonthlyReportRecord[];
	correctiveRecords: CorrectiveMaintenanceRecord[];
	businessUnit?: string;
	// Table 5 independent business unit filter
	correctiveBusinessUnit?: string;
	availableCorrectiveBusinessUnits?: string[];
	onCorrectiveBusinessUnitChange?: (businessUnit: string | undefined) => void;
}

const IncidentOverviewSection: React.FC<IncidentOverviewSectionProps> = ({
	monthlyRecords,
	correctiveRecords,
	businessUnit,
	correctiveBusinessUnit,
	availableCorrectiveBusinessUnits = [],
	onCorrectiveBusinessUnitChange,
}) => {
	// Table 1: Resolved in L2
	const resolvedInL2Data = useMemo(() => {
		const filtered = monthlyRecords.filter(
			(r) => r.inDateRange && r.requestStatusReporte === "Closed",
		);

		const grouped = new Map<string, number>();
		filtered.forEach((record) => {
			const cat = record.categorization || "Unknown";
			grouped.set(cat, (grouped.get(cat) || 0) + 1);
		});

		return Array.from(grouped.entries())
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count);
	}, [monthlyRecords]);

	const resolvedInL2Total = useMemo(
		() => resolvedInL2Data.reduce((sum, item) => sum + item.count, 0),
		[resolvedInL2Data],
	);

	// Table 2: Pending
	const pendingData = useMemo(() => {
		const filtered = monthlyRecords.filter(
			(r) => r.inDateRange && r.requestStatusReporte === "On going in L2",
		);

		const grouped = new Map<string, number>();
		filtered.forEach((record) => {
			const cat = record.categorization || "Unknown";
			grouped.set(cat, (grouped.get(cat) || 0) + 1);
		});

		return Array.from(grouped.entries())
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count);
	}, [monthlyRecords]);

	const pendingTotal = useMemo(
		() => pendingData.reduce((sum, item) => sum + item.count, 0),
		[pendingData],
	);

	// Table 3: Recurrent in L2 & L3
	const recurrentData = useMemo(() => {
		const filtered = monthlyRecords.filter((r) => r.inDateRange);

		const grouped = new Map<string, number>();
		filtered.forEach((record) => {
			const rec = record.recurrenceComputed || "Unknown";
			grouped.set(rec, (grouped.get(rec) || 0) + 1);
		});

		return Array.from(grouped.entries())
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count);
	}, [monthlyRecords]);

	const recurrentTotal = useMemo(
		() => recurrentData.reduce((sum, item) => sum + item.count, 0),
		[recurrentData],
	);

	// Table 4: Assigned to L3 Backlog
	const l3BacklogData = useMemo(() => {
		const filtered = monthlyRecords.filter(
			(r) =>
				r.inDateRange &&
				(r.requestStatusReporte === "In L3 Backlog" ||
					r.requestStatusReporte === "On going in L3"),
		);

		const grouped = new Map<string, number>();
		filtered.forEach((record) => {
			const cat = record.categorization || "Unknown";
			grouped.set(cat, (grouped.get(cat) || 0) + 1);
		});

		return Array.from(grouped.entries())
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count);
	}, [monthlyRecords]);

	const l3BacklogTotal = useMemo(
		() => l3BacklogData.reduce((sum, item) => sum + item.count, 0),
		[l3BacklogData],
	);

	// Table 5: L3 Status (from corrective maintenance records)
	// Note: Data is already filtered by business unit in the backend
	const l3StatusData = useMemo(() => {
		// Only filter by inDateRange - business unit filtering happens in backend
		const filtered = correctiveRecords.filter((r) => !r.inDateRange);

		const grouped = new Map<string, number>();
		filtered.forEach((record) => {
			const status = record.requestStatus || "Unknown";
			grouped.set(status, (grouped.get(status) || 0) + 1);
		});

		return Array.from(grouped.entries())
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count);
	}, [correctiveRecords]);

	const l3StatusTotal = useMemo(
		() => l3StatusData.reduce((sum, item) => sum + item.count, 0),
		[l3StatusData],
	);

	// Calculate total incidents for header (from monthly records in range)
	const totalIncidents = useMemo(
		() => monthlyRecords.filter((r) => r.inDateRange).length,
		[monthlyRecords],
	);

	// Business Unit filter dropdown for Table 5
	const correctiveBusinessUnitFilter = (
		<div className="flex items-center gap-2">
			<label
				htmlFor="corrective-business-unit-filter"
				className="text-sm font-medium text-gray-700"
			>
				Filter by Business Unit:
			</label>
			<select
				id="corrective-business-unit-filter"
				value={correctiveBusinessUnit || ""}
				onChange={(e) => {
					const value = e.target.value;
					onCorrectiveBusinessUnitChange?.(
						value === "" ? undefined : value,
					);
				}}
				className="px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
			>
				<option value="">All Business Units</option>
				{availableCorrectiveBusinessUnits.map((bu) => (
					<option key={bu} value={bu}>
						{bu}
					</option>
				))}
			</select>
		</div>
	);

	return (
		<div className="bg-gray-50 rounded-lg p-6 mt-6">
			{/* Section Header */}
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-2">
					5. Incident Overview by Category
				</h2>
				<div className="flex items-center gap-4 text-sm text-gray-600">
					<span className="font-medium">
						Total Incidents:{" "}
						<span className="text-blue-600 font-bold">
							{totalIncidents}
						</span>{" "}
						registered tickets
					</span>
					{businessUnit && (
						<span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
							Business Unit: {businessUnit}
						</span>
					)}
				</div>
			</div>

			{/* Grid Layout for 5 tables */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* Table 1: Resolved in L2 */}
				<IncidentOverviewTable
					title="Resolved in L2"
					subtitle="Distribution by category"
					description="Incidents resolved by Level 2 support team during the current week, grouped by incident category"
					data={resolvedInL2Data}
					footerText={`${resolvedInL2Total} Resolved tickets of the Week`}
					colorScheme="blue"
				/>

				{/* Table 2: Pending */}
				<IncidentOverviewTable
					title="Pending"
					subtitle="Distribution by category"
					description="Incidents currently being handled by Level 2 support team, pending resolution"
					data={pendingData}
					footerText={`${pendingTotal} pending tickets of the Week`}
					colorScheme="orange"
				/>

				{/* Table 3: Recurrent in L2 & L3 */}
				<IncidentOverviewTable
					title="Recurrent in L2 & L3"
					subtitle="Distribution by recurrency"
					description="Analysis of incident recurrence patterns to identify unique vs recurring issues"
					data={recurrentData}
					footerText={`${recurrentTotal} tickets of the Week`}
					colorScheme="orange"
				/>

				{/* Table 4: Assigned to L3 Backlog */}
				<IncidentOverviewTable
					title="Assigned to L3 Backlog"
					subtitle="Distribution by Categorie"
					description="Incidents escalated to Level 3 support or currently in the backlog awaiting assignment"
					data={l3BacklogData}
					footerText={`${l3BacklogTotal} pending tickets of the Week`}
					colorScheme="blue"
				/>

				{/* Table 5: L3 Status */}
				<IncidentOverviewTable
					title="L3 Status"
					subtitle="Distribution by Status"
					description="Level 3 incident status distribution from previous periods, showing backlog evolution over time"
					data={l3StatusData}
					footerText={`${l3StatusTotal} tickets previous week`}
					colorScheme="gray"
					filterDropdown={correctiveBusinessUnitFilter}
				/>
			</div>
		</div>
	);
};

export default IncidentOverviewSection;
