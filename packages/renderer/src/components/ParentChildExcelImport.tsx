import { useState } from "react";
import { getPreloadHandler } from "../constants/preloadHandlers";

type ParentChildRelationship = {
	parentRequestId: string;
	parentLink?: string;
	childRequestId: string;
	childLink?: string;
	createdAt: string;
	updatedAt: string;
};

type ExcelSheet = {
	name: string;
	headers: string[];
	rows: ParentChildRelationship[];
};

type ParseResult = {
	success: boolean;
	fileName: string;
	sheet: ExcelSheet | null;
	error?: string;
};

interface ParentChildExcelImportProps {
	onSuccess?: () => void;
}

const ParentChildExcelImport = ({ onSuccess }: ParentChildExcelImportProps) => {
	const [file, setFile] = useState<File | null>(null);
	const [result, setResult] = useState<ParseResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const selectedFile = event.target.files?.[0];
		if (selectedFile) {
			setFile(selectedFile);
			setResult(null);
			setError(null);

			// Automatically start upload when file is selected
			await handleUpload(selectedFile);
		}
	};

	const handleUpload = async (uploadFile?: File) => {
		const fileToUpload = uploadFile || file;
		if (!fileToUpload) return;

		setLoading(true);
		setError(null);
		setResult(null);

		try {
			const arrayBuffer = await fileToUpload.arrayBuffer();
			const handler = getPreloadHandler("parseParentChildExcel");
			const parseResult = (await handler(
				arrayBuffer,
				fileToUpload.name,
			)) as ParseResult;

			setResult(parseResult);

			if (parseResult.success && onSuccess) {
				onSuccess();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div className="mb-4">
				<label
					htmlFor="parent-child-file-upload"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					Select Excel File
				</label>
				<input
					id="parent-child-file-upload"
					type="file"
					accept=".xlsx,.xls"
					onChange={handleFileChange}
					disabled={loading}
					className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
				/>
			</div>

			{loading && (
				<div className="flex items-center text-blue-600 mb-4">
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
					<span className="text-sm">Parsing and saving file...</span>
				</div>
			)}

			{error && (
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
								Parse Error
							</h3>
							<div className="mt-2 text-sm text-red-700">
								{error}
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
							<h3 className="text-sm font-medium text-green-800">
								Success
							</h3>
							<div className="mt-2 text-sm text-green-700">
								Successfully processed and saved{" "}
								{result.fileName}
								{result.sheet && (
									<div className="mt-1">
										<p className="text-xs">
											Sheet: {result.sheet.name} • Rows:{" "}
											{result.sheet.rows.length}
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
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
								aria-labelledby="error-icon-title-2"
							>
								<title id="error-icon-title-2">
									Error icon
								</title>
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="ml-3">
							<h3 className="text-sm font-medium text-red-800">
								Processing Failed
							</h3>
							<div className="mt-2 text-sm text-red-700">
								{result.error}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default ParentChildExcelImport;
