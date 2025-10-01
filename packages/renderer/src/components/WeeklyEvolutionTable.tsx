import React from "react";

export interface AdditionalInfoStat {
	info: string;
	count: number;
	mensaje: string;
}

export interface CategorizationStat {
	name: string;
	count: number;
	additionalInfos: AdditionalInfoStat[];
}

export interface ModuleStat {
	module: string;
	count: number;
	percentage: number;
	categorizations: CategorizationStat[];
}

interface WeeklyEvolutionTableProps {
	moduleStats: ModuleStat[];
	businessUnit: string;
}

const WeeklyEvolutionTable: React.FC<WeeklyEvolutionTableProps> = ({
	moduleStats,
	businessUnit,
}) => {
	const totalCount = moduleStats.reduce((sum, stat) => sum + stat.count, 0);
	const [showVisualPercentage, setShowVisualPercentage] = React.useState(true);
	const [showAdditionalInfo, setShowAdditionalInfo] = React.useState(true);

	// Hacky code: Remove "Unete " from module names if business unit is UN-2
	const processedStats = moduleStats.map(stat => ({
		...stat,
		module: businessUnit === 'UN-2' && stat.module.startsWith('Unete ')
			? stat.module.substring(6) // Remove "Unete " (6 characters)
			: stat.module
	}));

	if (moduleStats.length === 0) {
		return null;
	}

	return (
		<div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-lg font-semibold text-gray-900">
					Weekly Evolution of Incidents
					{businessUnit && ` - ${businessUnit}`}
				</h3>
				<div className="flex gap-2">
					<button
						onClick={() => setShowVisualPercentage(!showVisualPercentage)}
						className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded border border-blue-300 transition-colors"
					>
						{showVisualPercentage ? 'Hide' : 'Show'} Visual %
					</button>
					<button
						onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
						className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded border border-green-300 transition-colors"
					>
						{showAdditionalInfo ? 'Hide' : 'Show'} Details
					</button>
				</div>
			</div>

			<div
				className="overflow-x-auto"
				style={{ fontFamily: 'Calibri, sans-serif' }}
			>
				<table className="min-w-full border-collapse">
					<thead>
						<tr className="bg-gray-50">
							<th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
								Etiquetas de fila
							</th>
							<th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
								Cuenta de ID de la solicitud
							</th>
							<th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
								%
							</th>
							{showVisualPercentage && (
								<th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
									% Visual
								</th>
							)}
						</tr>
					</thead>
					<tbody>
						{processedStats.map((stat, moduleIndex) => (
							<React.Fragment key={stat.module}>
								{/* Module header row */}
								<tr className="bg-blue-100">
									<td className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900">
										{stat.module}
									</td>
									<td className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900">
										{stat.count}
									</td>
									<td className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900">
										{stat.percentage.toFixed(0)}%
									</td>
									{showVisualPercentage && (
										<td className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900">
											<div className="relative w-16 h-6 bg-gray-200 rounded mx-auto">
												<div
													className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-400 to-blue-500 rounded"
													style={{
														width: `${Math.max(stat.percentage, 8)}%` // Minimum 8% for visibility
													}}
												></div>
												<span className="relative z-10 text-xs font-medium text-gray-800 leading-6">
													{stat.percentage.toFixed(0)}%
												</span>
											</div>
										</td>
									)}
								</tr>
								{/* Categorization breakdown rows */}
								{stat.categorizations.map((categorization, catIndex) => {
									// Calculate percentage based on module total, not grand total
									const categorizationPercentage = stat.count > 0 ? (categorization.count / stat.count) * 100 : 0;
									return (
										<React.Fragment key={`${stat.module}-${categorization.name}`}>
											{/* Categorization row */}
											<tr className="bg-white">
												<td className="border border-gray-300 px-8 py-2 text-sm text-gray-700">
													{categorization.name}
												</td>
												<td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-700">
													{categorization.count}
												</td>
												<td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-700">
													{categorizationPercentage.toFixed(0)}%
												</td>
												{showVisualPercentage && (
													<td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-700">
														<div className="relative w-16 h-6 bg-gray-200 rounded mx-auto">
															<div
																className="absolute left-0 top-0 h-full bg-gradient-to-r from-gray-400 to-gray-600 rounded"
																style={{
																	width: `${Math.max(categorizationPercentage, 5)}%` // Minimum 5% for visibility
																}}
															></div>
															<span className="relative z-10 text-xs font-medium text-gray-800 leading-6">
																{categorizationPercentage.toFixed(0)}%
															</span>
														</div>
													</td>
												)}
											</tr>
											{/* Additional info breakdown rows */}
											{showAdditionalInfo && categorization.additionalInfos.map((additionalInfo, infoIndex) => (
												<tr key={`${stat.module}-${categorization.name}-${additionalInfo.info}`} className="bg-gray-50">
													<td className="border border-gray-300 px-12 py-1 text-xs text-gray-600">
														{additionalInfo.count} {additionalInfo.info}{(additionalInfo.mensaje && additionalInfo.mensaje.trim() !== '') ? ` - ${additionalInfo.mensaje}` : ''}
													</td>
													<td className="border border-gray-300 px-4 py-1 text-center text-xs text-gray-600">
														{/* Count now displayed in first column */}
													</td>
													<td className="border border-gray-300 px-4 py-1 text-center text-xs text-gray-600">
														{/* No percentage for additional info rows */}
													</td>
													{showVisualPercentage && (
														<td className="border border-gray-300 px-4 py-1 text-center text-xs text-gray-600">
															{/* No visual percentage for additional info rows */}
														</td>
													)}
												</tr>
											))}
										</React.Fragment>
									);
								})}
							</React.Fragment>
						))}
						{/* Total row */}
						<tr className="bg-blue-200 font-semibold">
							<td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 font-bold">
								Total general
							</td>
							<td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-900 font-bold">
								{totalCount}
							</td>
							<td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-900 font-bold">
								100%
							</td>
							{showVisualPercentage && (
								<td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-900">
									<div className="relative w-16 h-6 bg-gray-200 rounded mx-auto">
										<div
											className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded"
											style={{ width: '100%' }}
										></div>
										<span className="relative z-10 text-xs font-medium text-gray-800 leading-6">
											100%
										</span>
									</div>
								</td>
							)}
						</tr>
					</tbody>
				</table>
			</div>

			{/* Legend */}
			<div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
				<h4 className="text-sm font-semibold text-gray-700 mb-3">How to interpret this table:</h4>
				<div className="text-sm text-gray-600 space-y-2">
					<div className="flex items-start">
						<div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mt-0.5 mr-3 flex-shrink-0"></div>
						<div>
							<strong>Module rows (blue background):</strong> Show total incidents per module.
							Percentages are relative to the grand total ({totalCount} total incidents).
						</div>
					</div>
					<div className="flex items-start">
						<div className="w-4 h-4 bg-white border border-gray-300 rounded mt-0.5 mr-3 flex-shrink-0"></div>
						<div>
							<strong>Categorization rows (white, indented):</strong> Show breakdown by categorization within each module.
							Percentages are relative to their parent module's total.
						</div>
					</div>
					<div className="flex items-start">
						<div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded mt-0.5 mr-3 flex-shrink-0"></div>
						<div>
							<strong>Total row (darker blue):</strong> Shows grand total of all incidents across all modules (always 100%).
						</div>
					</div>
					{showVisualPercentage && (
						<div className="flex items-start">
							<div className="w-4 h-2 bg-gradient-to-r from-teal-400 to-blue-500 rounded mt-1 mr-3 flex-shrink-0"></div>
							<div>
								<strong>Visual % bars:</strong> Provide graphical representation of percentages.
								Can be hidden using the "Hide Visual %" button for cleaner Excel copying.
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default WeeklyEvolutionTable;