import React, { useState } from "react";

export interface IncidentOverviewData {
	label: string;
	count: number;
}

export interface IncidentOverviewTableProps {
	title: string;
	subtitle: string;
	description: string;
	data: IncidentOverviewData[];
	footerText: string;
	colorScheme?: "blue" | "orange" | "gray" | "yellow";
	isPlaceholder?: boolean;
	filterDropdown?: React.ReactNode;
}

type ViewMode = "chart" | "table";

const colorSchemes = {
	blue: {
		primary: "bg-blue-500",
		secondary: "bg-blue-400",
		tertiary: "bg-blue-300",
		quaternary: "bg-blue-200",
		text: "text-white",
	},
	orange: {
		primary: "bg-orange-500",
		secondary: "bg-orange-400",
		tertiary: "bg-orange-300",
		quaternary: "bg-orange-200",
		text: "text-white",
	},
	gray: {
		primary: "bg-gray-500",
		secondary: "bg-gray-400",
		tertiary: "bg-gray-300",
		quaternary: "bg-gray-200",
		text: "text-gray-900",
	},
	yellow: {
		primary: "bg-yellow-500",
		secondary: "bg-yellow-400",
		tertiary: "bg-yellow-300",
		quaternary: "bg-yellow-200",
		text: "text-gray-900",
	},
};

const IncidentOverviewTable: React.FC<IncidentOverviewTableProps> = ({
	title,
	subtitle,
	description,
	data,
	footerText,
	colorScheme = "blue",
	isPlaceholder = false,
	filterDropdown,
}) => {
	const [viewMode, setViewMode] = useState<ViewMode>("table");

	const colors = colorSchemes[colorScheme];
	const colorClasses = [
		colors.primary,
		colors.secondary,
		colors.tertiary,
		colors.quaternary,
	];

	// Calculate total for percentage calculations
	const total = data.reduce((sum, item) => sum + item.count, 0);

	if (isPlaceholder) {
		return (
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[300px] flex flex-col">
				<div className="mb-4">
					<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
					<p className="text-sm text-gray-500 mt-1">{subtitle}</p>
					<p className="text-xs text-gray-400 mt-2">{description}</p>
				</div>
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<div className="text-6xl mb-4">🚧</div>
						<p className="text-gray-500 font-medium">Coming Soon</p>
						<p className="text-sm text-gray-400 mt-2">
							Awaiting complete requirements
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[300px] flex flex-col">
			{/* Header */}
			<div className="mb-4">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
						<p className="text-sm text-gray-500 mt-1">{subtitle}</p>
						<p className="text-xs text-gray-400 mt-2">{description}</p>
					</div>

					{/* View Toggle Button */}
					{data.length > 0 && (
						<div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
							<button
								type="button"
								onClick={() => setViewMode("chart")}
								className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
									viewMode === "chart"
										? "bg-white text-gray-900 shadow-sm"
										: "text-gray-600 hover:text-gray-900"
								}`}
								title="Chart view"
							>
								<svg
									className="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<title>Chart icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							</button>
							<button
								type="button"
								onClick={() => setViewMode("table")}
								className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
									viewMode === "table"
										? "bg-white text-gray-900 shadow-sm"
										: "text-gray-600 hover:text-gray-900"
								}`}
								title="Table view"
							>
								<svg
									className="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<title>Table icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Filter Dropdown (if provided) */}
			{filterDropdown && (
				<div className="mb-4">
					{filterDropdown}
				</div>
			)}

			{/* Data Visualization */}
			{data.length === 0 ? (
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center text-gray-400">
						<svg
							className="mx-auto h-12 w-12 mb-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<title>No data icon</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<p className="text-sm font-medium">No data available</p>
					</div>
				</div>
			) : viewMode === "chart" ? (
				<div className="flex-1 flex flex-col space-y-2">
					{data.map((item, index) => {
						const percentage =
							total > 0 ? (item.count / total) * 100 : 0;
						const colorClass =
							colorClasses[index % colorClasses.length];

						return (
							<div
								key={`${item.label}-${index}`}
								className="relative"
							>
								{/* Bar with label */}
								<div
									className={`${colorClass} ${colors.text} rounded px-3 py-2 flex items-center justify-between transition-all duration-300 hover:opacity-90`}
									style={{
										minHeight: "48px",
										width: `${Math.max(percentage, 15)}%`,
										minWidth: "120px",
									}}
								>
									<span className="text-sm font-medium truncate pr-2">
										{item.label}
									</span>
									<span className="text-sm font-bold">
										{item.count}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<div className="flex-1 overflow-auto">
					<table className="min-w-full border-collapse border border-gray-300">
						<thead>
							<tr className="bg-gray-100">
								<th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
									Category
								</th>
								<th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
									Count
								</th>
								<th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
									Percentage
								</th>
							</tr>
						</thead>
						<tbody>
							{data.map((item, index) => {
								const percentage =
									total > 0
										? ((item.count / total) * 100).toFixed(1)
										: "0.0";

								return (
									<tr
										key={`${item.label}-${index}`}
										className="bg-white hover:bg-gray-50"
									>
										<td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
											{item.label}
										</td>
										<td className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-900">
											{item.count}
										</td>
										<td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-600">
											{percentage}%
										</td>
									</tr>
								);
							})}
							{/* Total Row */}
							<tr className="bg-gray-200 font-semibold">
								<td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
									TOTAL
								</td>
								<td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-900">
									{total}
								</td>
								<td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-900">
									100%
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			)}

			{/* Footer */}
			<div className="mt-4 pt-3 border-t border-gray-200">
				<p className="text-sm text-gray-600 font-medium italic">
					{footerText}
				</p>
			</div>
		</div>
	);
};

export default IncidentOverviewTable;
