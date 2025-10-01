import { useRef, useState } from "react";

interface FileUploadButtonProps {
	accept?: string;
	label?: string;
	buttonText?: string;
	loadingText?: string;
	successMessage?: string;
	errorMessage?: string;
	autoUpload?: boolean;
	disabled?: boolean;
	className?: string;
	onUpload: (
		file: File,
	) => Promise<{ success: boolean; message?: string; data?: unknown }>;
	onSuccess?: (data?: unknown) => void;
	onError?: (error: string) => void;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
	accept = ".xlsx,.xls",
	label = "Select File",
	buttonText = "Upload",
	loadingText = "Processing...",
	successMessage,
	errorMessage,
	autoUpload = false,
	disabled = false,
	className = "",
	onUpload,
	onSuccess,
	onError,
}) => {
	const [file, setFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<{
		success: boolean;
		message?: string;
		data?: unknown;
	} | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0] || null;
		setFile(selectedFile);
		setResult(null);

		if (selectedFile && autoUpload) {
			handleUpload(selectedFile);
		}
	};

	const handleUpload = async (uploadFile?: File) => {
		const fileToUpload = uploadFile || file;
		if (!fileToUpload || loading) return;

		setLoading(true);
		setResult(null);

		try {
			const uploadResult = await onUpload(fileToUpload);
			setResult(uploadResult);

			if (uploadResult.success) {
				onSuccess?.(uploadResult.data);
			} else {
				onError?.(uploadResult.message || "Upload failed");
			}
		} catch (err) {
			const errorMsg =
				err instanceof Error ? err.message : "Unknown error";
			setResult({ success: false, message: errorMsg });
			onError?.(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	const handleButtonClick = () => {
		if (!autoUpload) {
			handleUpload();
		}
	};

	return (
		<div className={`file-upload-button ${className}`}>
			<div className="mb-4">
				<label
					htmlFor="file-upload-input"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					{label}
				</label>
				<input
					ref={fileInputRef}
					id="file-upload-input"
					type="file"
					accept={accept}
					onChange={handleFileChange}
					disabled={loading || disabled}
					className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
				/>
			</div>

			{!autoUpload && (
				<div className="mb-4">
					<button
						type="button"
						onClick={handleButtonClick}
						disabled={!file || loading || disabled}
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
								{loadingText}
							</>
						) : (
							buttonText
						)}
					</button>
				</div>
			)}

			{loading && autoUpload && (
				<div className="flex items-center text-blue-600 mb-4">
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
					<span className="text-sm">{loadingText}</span>
				</div>
			)}

			{result && !result.success && (
				<div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg
								className="h-5 w-5 text-red-400"
								viewBox="0 0 20 20"
								fill="currentColor"
								role="img"
								aria-labelledby="error-icon-title"
							>
								<title id="error-icon-title">Error icon</title>
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="ml-3">
							<h3 className="text-sm font-medium text-red-800">
								{errorMessage || "Error"}
							</h3>
							<div className="mt-2 text-sm text-red-700">
								{result.message}
							</div>
						</div>
					</div>
				</div>
			)}

			{result?.success && (
				<div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg
								className="h-5 w-5 text-green-400"
								viewBox="0 0 20 20"
								fill="currentColor"
								role="img"
								aria-labelledby="success-icon-title"
							>
								<title id="success-icon-title">
									Success icon
								</title>
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="ml-3">
							<p className="text-sm font-medium text-green-800">
								{successMessage || "Success"}
							</p>
							{result.message && (
								<p className="text-sm text-green-700">
									{result.message}
								</p>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default FileUploadButton;
