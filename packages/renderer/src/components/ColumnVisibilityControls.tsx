interface ColumnVisibilityControlsProps {
	columns: Record<string, boolean>;
	onColumnVisibilityChange: (columnKey: string, isVisible: boolean) => void;
	className?: string;
}

const ColumnVisibilityControls = ({
	columns,
	onColumnVisibilityChange,
	className = "",
}: ColumnVisibilityControlsProps) => {
	const formatColumnLabel = (key: string): string => {
		switch (key) {
			case "inDateRange":
				return "In Date Range";
			case "requestId":
				return "Request ID";
			case "createdTime":
				return "Created Time";
			case "requestStatus":
				return "Request Status";
			case "businessUnit":
				return "Business Unit";
			default:
				return key.charAt(0).toUpperCase() + key.slice(1);
		}
	};

	return (
		<div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
			<div className="flex items-center gap-4 mb-2">
				<span className="text-sm font-medium text-gray-700">
					Visible Columns:
				</span>
			</div>
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
				{Object.entries(columns).map(([key, isVisible]) => (
					<label key={key} className="flex items-center">
						<input
							type="checkbox"
							checked={isVisible}
							onChange={(e) => {
								onColumnVisibilityChange(key, e.target.checked);
							}}
							className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
						/>
						<span className="ml-2 text-sm text-gray-700">
							{formatColumnLabel(key)}
						</span>
					</label>
				))}
			</div>
		</div>
	);
};

export default ColumnVisibilityControls;
