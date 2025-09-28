interface FileUploadSectionProps {
	title: string;
	description: string;
	children: React.ReactNode;
	className?: string;
}

const FileUploadSection = ({
	title,
	description,
	children,
	className = "",
}: FileUploadSectionProps) => {
	return (
		<div className={`bg-white rounded-lg shadow-md mb-6 ${className}`}>
			<div className="px-6 py-4 border-b border-gray-200">
				<h2 className="text-xl font-semibold text-gray-800">{title}</h2>
				<p className="text-gray-600">{description}</p>
			</div>
			<div className="p-6">{children}</div>
		</div>
	);
};

export default FileUploadSection;
