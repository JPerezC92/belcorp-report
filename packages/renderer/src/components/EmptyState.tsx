interface EmptyStateProps {
	title: string;
	description: string;
	icon?: React.ReactNode;
	className?: string;
}

const EmptyState = ({
	title,
	description,
	icon,
	className = "",
}: EmptyStateProps) => {
	const defaultIcon = (
		<svg
			className="mx-auto h-12 w-12 text-gray-400"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-labelledby="empty-icon"
		>
			<title id="empty-icon">Empty state icon</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
			/>
		</svg>
	);

	return (
		<div className={`text-center py-12 ${className}`}>
			{icon || defaultIcon}
			<h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
			<p className="mt-1 text-sm text-gray-500">{description}</p>
		</div>
	);
};

export default EmptyState;
