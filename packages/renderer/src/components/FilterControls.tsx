interface FilterControlsProps {
	businessUnits: string[];
	selectedBusinessUnit?: string;
	onBusinessUnitChange: (unit?: string) => void;
	requestStatuses: string[];
	selectedRequestStatus?: string;
	onRequestStatusChange: (status?: string) => void;
	className?: string;
}

const FilterControls = ({
	businessUnits,
	selectedBusinessUnit,
	onBusinessUnitChange,
	requestStatuses,
	selectedRequestStatus,
	onRequestStatusChange,
	className = "",
}: FilterControlsProps) => {
	return (
		<div className={className}>
			{/* Business Unit Filter */}
			<div className="px-6 py-4 border-b border-gray-200">
				<div className="flex items-center gap-4">
					<span className="text-sm font-medium text-gray-700">
						Filter by Business Unit:
					</span>
					<div className="flex items-center gap-4">
						{businessUnits.map((unit) => (
							<label key={unit} className="flex items-center">
								<input
									type="checkbox"
									checked={selectedBusinessUnit === unit}
									onChange={(e) => {
										if (e.target.checked) {
											onBusinessUnitChange(unit);
										} else {
											onBusinessUnitChange(undefined);
										}
									}}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<span className="ml-2 text-sm text-gray-700">
									{unit}
								</span>
							</label>
						))}
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={selectedBusinessUnit === undefined}
								onChange={(e) => {
									if (e.target.checked) {
										onBusinessUnitChange(undefined);
										onRequestStatusChange(undefined);
									}
								}}
								className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<span className="ml-2 text-sm text-gray-700">
								All
							</span>
						</label>
					</div>
				</div>
			</div>

			{/* Request Status Filter */}
			<div className="px-6 py-4 border-b border-gray-200">
				<div className="flex items-center gap-4">
					<span className="text-sm font-medium text-gray-700">
						Filter by Request Status:
					</span>
					{!selectedBusinessUnit && (
						<span className="text-xs text-gray-500">
							(Select a Business Unit first)
						</span>
					)}
					<div className="flex items-center gap-4">
						{requestStatuses.map((status) => (
							<label key={status} className="flex items-center">
								<input
									type="checkbox"
									disabled={!selectedBusinessUnit}
									checked={selectedRequestStatus === status}
									onChange={(e) => {
										if (e.target.checked) {
											onRequestStatusChange(status);
										} else {
											onRequestStatusChange(undefined);
										}
									}}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
								/>
								<span
									className={`ml-2 text-sm ${
										!selectedBusinessUnit
											? "text-gray-400"
											: "text-gray-700"
									}`}
								>
									{status}
								</span>
							</label>
						))}
						<label className="flex items-center">
							<input
								type="checkbox"
								disabled={!selectedBusinessUnit}
								checked={selectedRequestStatus === undefined}
								onChange={(e) => {
									if (e.target.checked) {
										onRequestStatusChange(undefined);
									}
								}}
								className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
							/>
							<span
								className={`ml-2 text-sm ${
									!selectedBusinessUnit
										? "text-gray-400"
										: "text-gray-700"
								}`}
							>
								All
							</span>
						</label>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FilterControls;
