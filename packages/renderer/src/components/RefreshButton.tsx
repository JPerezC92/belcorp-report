interface RefreshButtonProps {
	onClick: () => void;
	loading?: boolean;
	disabled?: boolean;
	className?: string;
	children?: React.ReactNode;
}

const RefreshButton = ({
	onClick,
	loading = false,
	disabled = false,
	className = "",
	children = "Refresh",
}: RefreshButtonProps) => {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={loading || disabled}
			className={`bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${className}`}
		>
			{loading ? (
				<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
			) : (
				<svg
					className="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-labelledby="refresh-icon"
				>
					<title id="refresh-icon">Refresh icon</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
			)}
			{children}
		</button>
	);
};

export default RefreshButton;
