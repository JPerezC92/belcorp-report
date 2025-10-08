import React from "react";
import { formatEtaDate } from "@/utils/dateUtils";

interface ScopeErrorCategorizedRecord {
	linkedRequestId: string;
	linkedRequestIdLink: string | null;
	informacionAdicionalReporte: string | null;
	enlaces: number;
	recordCount: number;
	createdTime: string;
	requestStatus: string;
	eta: string;
	priority: string;
}

interface ScopeErrorCategorizedTableProps {
	data: ScopeErrorCategorizedRecord[];
}

const ScopeErrorCategorizedTable: React.FC<ScopeErrorCategorizedTableProps> = ({ data }) => {
	// Calculate total record count
	const totalRecordCount = data.reduce((sum, record) => sum + record.recordCount, 0);

	if (data.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-6">
				<div className="text-center">
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Scope Error Categorization Overview
					</h3>
					<p className="text-gray-500">
						No records found with "Error de Alcance" categorization
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
			{/* Table Header */}
			<div className="px-6 py-4 border-b border-gray-200">
				<h3 className="text-lg font-semibold text-gray-900">
					Scope Error Categorization Overview
				</h3>
				<p className="text-sm text-gray-600 mt-1">
					Records categorized as "Error de Alcance" with corrective maintenance details
				</p>
				<div className="mt-2 text-sm text-gray-500">
					Total grouped records: <span className="font-semibold text-blue-600">{data.length}</span>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
								#
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Created Time
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Linked Request ID
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Información Adicional
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Enlaces
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Record Count
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Priority
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Request Status
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								ETA
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{data.map((record, index) => (
							<tr key={`${record.linkedRequestId}-${index}`} className="hover:bg-gray-50">
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium sticky left-0 bg-white z-10">
									{index + 1}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.createdTime || "-"}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
									{record.linkedRequestIdLink ? (
										<a
											href={record.linkedRequestIdLink}
											onClick={(e) => {
												e.preventDefault();
												if (record.linkedRequestIdLink) {
													window[
														btoa("openExternal") as keyof Window
													]?.(record.linkedRequestIdLink);
												}
											}}
											className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
										>
											{record.linkedRequestId || "-"}
										</a>
									) : (
										record.linkedRequestId || "-"
									)}
								</td>
								<td className="px-6 py-4 text-sm text-gray-900 max-w-md">
									<div className="truncate" title={record.informacionAdicionalReporte || "-"}>
										{record.informacionAdicionalReporte || "-"}
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.enlaces}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
									{record.recordCount}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.priority || "-"}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									<span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
										{record.requestStatus || "-"}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{(() => {
										const formatted = formatEtaDate(record.eta);
										return (
											<span title={formatted.original}>
												{formatted.display}
											</span>
										);
									})()}
								</td>
							</tr>
						))}
						{/* Total Row */}
						<tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-gray-100 z-10" colSpan={5}>
								TOTAL
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-700">
								{totalRecordCount}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan={3}>
								-
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Table Footer */}
			<div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
				Showing {data.length} grouped scope error record{data.length !== 1 ? "s" : ""}
			</div>
		</div>
	);
};

export default ScopeErrorCategorizedTable;
