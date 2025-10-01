import React from "react";

interface MonthlyReportTableProps {
	records: any[];
	visibleColumns: Record<string, boolean>;
	onOpenExternal: (url: string) => void;
}

const MonthlyReportTable: React.FC<MonthlyReportTableProps> = ({
	records,
	visibleColumns,
	onOpenExternal,
}) => {
	return (
		<div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						{visibleColumns.requestId && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Request ID
							</th>
						)}
						{visibleColumns.inDateRange && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								In Date Range
							</th>
						)}
						{visibleColumns.rep && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								REP
							</th>
						)}
						{visibleColumns.dia && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Day
							</th>
						)}
						{visibleColumns.week && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Week
							</th>
						)}
						{visibleColumns.applications && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Applications
							</th>
						)}
						{visibleColumns.categorization && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Categorization
							</th>
						)}
						{visibleColumns.createdTime && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Created Time
							</th>
						)}
						{visibleColumns.requestStatus && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Request Status
							</th>
						)}
						{visibleColumns.module && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Module
							</th>
						)}
						{visibleColumns.subject && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Subject
							</th>
						)}
						{visibleColumns.priority && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Priority (Original)
							</th>
						)}
						{visibleColumns.priorityReporte && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Priority (English)
							</th>
						)}
						{visibleColumns.eta && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								ETA
							</th>
						)}
						{visibleColumns.additionalInfo && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Additional Info
							</th>
						)}
						{visibleColumns.resolvedTime && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Resolved Time
							</th>
						)}
						{visibleColumns.affectedCountries && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Affected Countries
							</th>
						)}
						{visibleColumns.recurrence && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Recurrence
							</th>
						)}
						{visibleColumns.technician && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Technician
							</th>
						)}
						{visibleColumns.jira && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Jira
							</th>
						)}
						{visibleColumns.problemId && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Problem ID
							</th>
						)}
						{visibleColumns.linkedRequestId && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Linked Request ID
							</th>
						)}
						{visibleColumns.requestOLAStatus && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Request OLA Status
							</th>
						)}
						{visibleColumns.escalationGroup && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Escalation Group
							</th>
						)}
						{visibleColumns.affectedApplications && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Affected Applications
							</th>
						)}
						{visibleColumns.shouldResolveLevel1 && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Should Resolve Level 1
							</th>
						)}
						{visibleColumns.campaign && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Campaign
							</th>
						)}
						{visibleColumns.cuv1 && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								CUV_1
							</th>
						)}
						{visibleColumns.release && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Release
							</th>
						)}
						{visibleColumns.rca && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								RCA
							</th>
						)}
						{visibleColumns.businessUnit && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Business Unit
							</th>
						)}
						{visibleColumns.requestStatusReporte && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Status Report
							</th>
						)}
						{visibleColumns.informacionAdicionalReporte && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Additional Info Report
							</th>
						)}
						{visibleColumns.enlaces && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Enlaces
							</th>
						)}
						{visibleColumns.mensaje && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								Mensaje
							</th>
						)}
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{records.map((record, index) => (
						<tr key={record.requestId || index}>
							{visibleColumns.requestId && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.requestIdLink ? (
										<button
											type="button"
											onClick={() => onOpenExternal(record.requestIdLink)}
											className="text-blue-600 hover:text-blue-800 underline"
										>
											{record.requestId}
										</button>
									) : (
										record.requestId
									)}
								</td>
							)}
							{visibleColumns.inDateRange && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									<span className="flex items-center gap-2">
										<span className={`w-2 h-2 rounded-full ${record.inDateRange ? 'bg-green-500' : 'bg-red-500'}`}></span>
										{record.inDateRange ? "In Range" : "Out of Range"}
									</span>
								</td>
							)}
							{visibleColumns.rep && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.rep}
								</td>
							)}
							{visibleColumns.dia && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.dia}
								</td>
							)}
							{visibleColumns.week && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.week}
								</td>
							)}
							{visibleColumns.applications && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.applications}
								</td>
							)}
							{visibleColumns.categorization && (
								<td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
									{record.categorization}
								</td>
							)}
							{visibleColumns.createdTime && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.createdTime}
								</td>
							)}
							{visibleColumns.requestStatus && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.requestStatus}
								</td>
							)}
							{visibleColumns.module && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.module}
								</td>
							)}
							{visibleColumns.subject && (
								<td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
									{record.subjectLink ? (
										<button
											type="button"
											onClick={() => onOpenExternal(record.subjectLink)}
											className="text-blue-600 hover:text-blue-800 underline"
										>
											{record.subject}
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
							{visibleColumns.priorityReporte && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.priorityReporte}
								</td>
							)}
							{visibleColumns.eta && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.eta}
								</td>
							)}
							{visibleColumns.additionalInfo && (
								<td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
									{record.additionalInfo}
								</td>
							)}
							{visibleColumns.resolvedTime && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.resolvedTime}
								</td>
							)}
							{visibleColumns.affectedCountries && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.affectedCountries}
								</td>
							)}
							{visibleColumns.recurrence && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.recurrence}
								</td>
							)}
							{visibleColumns.technician && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.technician}
								</td>
							)}
							{visibleColumns.jira && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.jira}
								</td>
							)}
							{visibleColumns.problemId && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.problemIdLink ? (
										<button
											type="button"
											onClick={() => onOpenExternal(record.problemIdLink)}
											className="text-blue-600 hover:text-blue-800 underline"
										>
											{record.problemId}
										</button>
									) : (
										record.problemId
									)}
								</td>
							)}
							{visibleColumns.linkedRequestId && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.linkedRequestIdLink ? (
										<button
											type="button"
											onClick={() => onOpenExternal(record.linkedRequestIdLink)}
											className="text-blue-600 hover:text-blue-800 underline"
										>
											{record.linkedRequestId}
										</button>
									) : (
										record.linkedRequestId
									)}
								</td>
							)}
							{visibleColumns.requestOLAStatus && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.requestOLAStatus}
								</td>
							)}
							{visibleColumns.escalationGroup && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.escalationGroup}
								</td>
							)}
							{visibleColumns.affectedApplications && (
								<td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
									{record.affectedApplications}
								</td>
							)}
							{visibleColumns.shouldResolveLevel1 && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.shouldResolveLevel1}
								</td>
							)}
							{visibleColumns.campaign && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.campaign}
								</td>
							)}
							{visibleColumns.cuv1 && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.cuv1}
								</td>
							)}
							{visibleColumns.release && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.release}
								</td>
							)}
							{visibleColumns.rca && (
								<td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
									{record.rca}
								</td>
							)}
							{visibleColumns.businessUnit && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.businessUnit}
								</td>
							)}
							{visibleColumns.requestStatusReporte && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.requestStatusReporte}
								</td>
							)}
							{visibleColumns.informacionAdicionalReporte && (
								<td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
									{record.informacionAdicionalReporte}
								</td>
							)}
							{visibleColumns.enlaces && (
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{record.enlaces}
								</td>
							)}
							{visibleColumns.mensaje && (
								<td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
									{record.mensaje}
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default MonthlyReportTable;