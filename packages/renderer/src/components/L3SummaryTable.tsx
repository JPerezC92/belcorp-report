import React, { useMemo } from "react";

interface CorrectiveMaintenanceRecord {
	requestId: string;
	requestStatus: string;
	priority: string;
	[key: string]: any;
}

interface L3SummaryTableProps {
	records: CorrectiveMaintenanceRecord[];
	businessUnit?: string;
}

interface L3SummaryRow {
	requestStatus: string;
	Critical: number;
	High: number;
	Medium: number;
	Low: number;
	TOTAL: number;
}

const L3SummaryTable: React.FC<L3SummaryTableProps> = ({
	records,
	businessUnit,
}) => {
	const summaryData = useMemo(() => {
		// Define priority columns in order
		const priorities = ["Critical", "High", "Medium", "Low"];

		// Group records by requestStatus and priority
		const grouped = new Map<string, Map<string, number>>();

		records.forEach((record) => {
			const status = record.requestStatus || "Unknown";
			const priority = record.priority || "Unknown";

			if (!grouped.has(status)) {
				grouped.set(status, new Map<string, number>());
			}

			const statusMap = grouped.get(status)!;
			statusMap.set(priority, (statusMap.get(priority) || 0) + 1);
		});

		// Convert to array of summary rows
		const rows: L3SummaryRow[] = [];
		const requestStatuses = Array.from(grouped.keys()).sort();

		for (const status of requestStatuses) {
			const statusMap = grouped.get(status)!;
			const row: L3SummaryRow = {
				requestStatus: status,
				Critical: statusMap.get("Critical") || 0,
				High: statusMap.get("High") || 0,
				Medium: statusMap.get("Medium") || 0,
				Low: statusMap.get("Low") || 0,
				TOTAL: 0,
			};

			// Calculate row total
			row.TOTAL = row.Critical + row.High + row.Medium + row.Low;

			// Add any non-standard priorities to the total
			for (const [priority, count] of statusMap.entries()) {
				if (!priorities.includes(priority)) {
					row.TOTAL += count;
				}
			}

			rows.push(row);
		}

		// Add TOTAL row
		const totalRow: L3SummaryRow = {
			requestStatus: "TOTAL",
			Critical: rows.reduce((sum, row) => sum + row.Critical, 0),
			High: rows.reduce((sum, row) => sum + row.High, 0),
			Medium: rows.reduce((sum, row) => sum + row.Medium, 0),
			Low: rows.reduce((sum, row) => sum + row.Low, 0),
			TOTAL: rows.reduce((sum, row) => sum + row.TOTAL, 0),
		};

		rows.push(totalRow);

		return rows;
	}, [records]);

	if (records.length === 0) {
		return null;
	}

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-gray-900">
					L3 Summary
					{businessUnit && ` - ${businessUnit}`}
				</h3>
				<p className="text-sm text-gray-500 mt-1">
					Pending code fixes by request status and priority
				</p>
			</div>

			<div
				className="overflow-x-auto"
				style={{ fontFamily: "Calibri, sans-serif" }}
			>
				<table className="min-w-full border-collapse border border-gray-300">
					<thead>
						<tr className="bg-gray-100">
							<th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
								Pending code fixes
							</th>
							<th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">
								Critical
							</th>
							<th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">
								High
							</th>
							<th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">
								Medium
							</th>
							<th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">
								Low
							</th>
							<th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-gray-200">
								TOTAL
							</th>
						</tr>
					</thead>
					<tbody>
						{summaryData.map((row, index) => {
							const isTotal = row.requestStatus === "TOTAL";
							const rowClass = isTotal
								? "bg-gray-200 font-semibold"
								: "bg-white hover:bg-gray-50";

							return (
								<tr key={row.requestStatus} className={rowClass}>
									<td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
										{row.requestStatus}
									</td>
									<td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-900">
										{row.Critical || "-"}
									</td>
									<td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-900">
										{row.High || "-"}
									</td>
									<td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-900">
										{row.Medium || "-"}
									</td>
									<td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-900">
										{row.Low || "-"}
									</td>
									<td
										className={`border border-gray-300 px-4 py-2 text-center text-sm text-gray-900 font-semibold ${isTotal ? "bg-gray-300" : "bg-gray-100"}`}
									>
										{row.TOTAL}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Info note */}
			<div className="mt-3 text-xs text-gray-500">
				<p>
					This summary shows the count of corrective maintenance
					records grouped by request status and priority level.
					Totals are calculated automatically.
				</p>
			</div>
		</div>
	);
};

export default L3SummaryTable;
