interface ErrorStateProps {
	title?: string;
	message: string;
	onRetry?: () => void;
	className?: string;
}

const ErrorState = ({
	title = "Error Loading Data",
	message,
	onRetry,
	className = "",
}: ErrorStateProps) => {
	return (
		<div className={`text-center py-12 ${className}`}>
			<div className="text-red-500 mb-4">
				<svg
					className="mx-auto h-12 w-12"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					role="img"
					aria-labelledby="error-icon-title"
				>
					<title id="error-icon-title">Error icon</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<h2 className="text-xl font-semibold text-red-700 mb-2">{title}</h2>
			<p className="text-red-600 mb-4">{message}</p>
			{onRetry && (
				<button
					type="button"
					onClick={onRetry}
					className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
				>
					Retry
				</button>
			)}
		</div>
	);
};

export default ErrorState;
