import React from "react";

interface SemanalFilterProps {
	filterMode: 'inRange' | 'outOfRange' | 'showAll';
	onFilterModeChange: (mode: 'inRange' | 'outOfRange' | 'showAll') => void;
	inRangeCount: number;
	outOfRangeCount: number;
	totalCount: number;
}

const SemanalFilter: React.FC<SemanalFilterProps> = ({
	filterMode,
	onFilterModeChange,
	inRangeCount,
	outOfRangeCount,
	totalCount,
}) => {
	const getButtonClasses = (mode: 'inRange' | 'outOfRange' | 'showAll') => {
		const baseClasses = "px-4 py-2 text-sm font-medium border transition-colors duration-200";
		const isActive = filterMode === mode;

		if (isActive) {
			return `${baseClasses} bg-blue-600 text-white border-blue-600 hover:bg-blue-700`;
		}
		return `${baseClasses} bg-white text-gray-700 border-gray-300 hover:bg-gray-50`;
	};

	return (
		<div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
			<div className="flex items-center justify-between">
				<div>
					<h4 className="text-sm font-medium text-gray-900 mb-2">Semanal Date Range Filter</h4>
					<p className="text-xs text-gray-600">
						Filter records based on whether they fall within the configured semanal date range
					</p>
				</div>

				<div className="flex items-center gap-1">
					<button
						onClick={() => onFilterModeChange('inRange')}
						className={`${getButtonClasses('inRange')} rounded-l-md`}
					>
						<span className="flex items-center gap-2">
							<span className="w-2 h-2 bg-green-500 rounded-full"></span>
							In Range ({inRangeCount})
						</span>
					</button>

					<button
						onClick={() => onFilterModeChange('outOfRange')}
						className={getButtonClasses('outOfRange')}
					>
						<span className="flex items-center gap-2">
							<span className="w-2 h-2 bg-red-500 rounded-full"></span>
							Out of Range ({outOfRangeCount})
						</span>
					</button>

					<button
						onClick={() => onFilterModeChange('showAll')}
						className={`${getButtonClasses('showAll')} rounded-r-md`}
					>
						<span className="flex items-center gap-2">
							<span className="w-2 h-2 bg-gray-500 rounded-full"></span>
							Show All ({totalCount})
						</span>
					</button>
				</div>
			</div>

			{/* Summary bar */}
			<div className="mt-3 pt-3 border-t border-gray-200">
				<div className="flex items-center justify-between text-xs text-gray-600">
					<span>
						{filterMode === 'inRange' && `Showing records within semanal range (${inRangeCount} of ${totalCount})`}
						{filterMode === 'outOfRange' && `Showing records outside semanal range (${outOfRangeCount} of ${totalCount})`}
						{filterMode === 'showAll' && `Showing all records (${totalCount} total)`}
					</span>
					<span className="flex items-center gap-4">
						<span className="flex items-center gap-1">
							<span className="w-2 h-2 bg-green-500 rounded-full"></span>
							{inRangeCount} in range
						</span>
						<span className="flex items-center gap-1">
							<span className="w-2 h-2 bg-red-500 rounded-full"></span>
							{outOfRangeCount} out of range
						</span>
					</span>
				</div>
			</div>
		</div>
	);
};

export default SemanalFilter;