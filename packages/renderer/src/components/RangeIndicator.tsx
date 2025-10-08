import React from "react";

interface RangeIndicatorProps {
	rangeType: 'weekly' | 'custom' | 'disabled';
	scope: 'monthly' | 'corrective' | 'global';
	fromDate?: string;
	toDate?: string;
	globalModeEnabled?: boolean;
}

const RangeIndicator: React.FC<RangeIndicatorProps> = ({
	rangeType,
	scope,
	fromDate,
	toDate,
	globalModeEnabled,
}) => {
	// Determine badge colors based on range type
	const getRangeTypeColor = () => {
		switch (rangeType) {
			case 'weekly':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'custom':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'disabled':
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	};

	// Determine scope badge color
	const getScopeColor = () => {
		if (globalModeEnabled) {
			return 'bg-purple-100 text-purple-800 border-purple-200';
		}
		switch (scope) {
			case 'monthly':
				return 'bg-indigo-100 text-indigo-800 border-indigo-200';
			case 'corrective':
				return 'bg-orange-100 text-orange-800 border-orange-200';
			case 'global':
				return 'bg-purple-100 text-purple-800 border-purple-200';
		}
	};

	// Format range type display text
	const getRangeTypeText = () => {
		switch (rangeType) {
			case 'weekly':
				return 'Weekly (Fri-Thu)';
			case 'custom':
				return 'Custom Range';
			case 'disabled':
				return 'Disabled (All Records)';
		}
	};

	// Format scope display text
	const getScopeText = () => {
		if (globalModeEnabled) {
			return 'Global Mode';
		}
		switch (scope) {
			case 'monthly':
				return 'Monthly Scope';
			case 'corrective':
				return 'Corrective Scope';
			case 'global':
				return 'Global Scope';
		}
	};

	// Format date range if available
	const formatDateRange = () => {
		if (!fromDate || !toDate || rangeType === 'disabled') {
			return null;
		}

		try {
			const from = new Date(fromDate);
			const to = new Date(toDate);
			const fromStr = from.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
			});
			const toStr = to.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			});
			return `${fromStr} - ${toStr}`;
		} catch {
			return `${fromDate} - ${toDate}`;
		}
	};

	const dateRangeDisplay = formatDateRange();

	return (
		<div className="flex flex-wrap items-center gap-2">
			{/* Range Type Badge */}
			<span
				className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRangeTypeColor()}`}
			>
				{getRangeTypeText()}
			</span>

			{/* Scope Badge */}
			<span
				className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getScopeColor()}`}
			>
				{getScopeText()}
			</span>

			{/* Date Range Display */}
			{dateRangeDisplay && (
				<span className="text-xs text-gray-600 font-medium">
					{dateRangeDisplay}
				</span>
			)}
		</div>
	);
};

export default RangeIndicator;
