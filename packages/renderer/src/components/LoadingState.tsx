interface LoadingStateProps {
	message?: string;
	className?: string;
}

const LoadingState = ({
	message = "Loading...",
	className = "",
}: LoadingStateProps) => {
	return (
		<div className={`text-center py-12 ${className}`}>
			<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
			<p className="text-gray-500">{message}</p>
		</div>
	);
};

export default LoadingState;
