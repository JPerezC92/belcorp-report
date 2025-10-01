import { useState } from "react";
import { getPreloadHandler } from "../constants/preloadHandlers";

type CorrectiveMaintenanceRecord = {
	requestId: string;
	requestIdLink?: string;
	createdTime: string;
	applications: string;
	categorization: string;
	requestStatus: string;
	module: string;
	subject: string;
	subjectLink?: string;
	priority: string;
	eta: string;
	rca: string;
};

type ExcelSheet = {
	name: string;
	headers: string[];
	rows: CorrectiveMaintenanceRecord[];
};

type ParseResult = {
	success: boolean;
	fileName: string;
	sheet: ExcelSheet | null;
	error?: string;
	warnings?: string[];
};

interface CorrectiveMaintenanceExcelImportProps {
	onSuccess?: () => void;
}

const CorrectiveMaintenanceExcelImport = ({
	onSuccess,
}: CorrectiveMaintenanceExcelImportProps) => {
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
		if (!uploadFile) return;

		setLoading(true);
		try {
			// Read file as ArrayBuffer
			const arrayBuffer = await uploadFile.arrayBuffer();

			// Call preload handler
			const handler = getPreloadHandler(
				"parseCorrectiveMaintenanceExcel",
			);
			const parseResult = (await handler(
				arrayBuffer,
				uploadFile.name,
			)) as ParseResult;

			setResult(parseResult);

			if (parseResult.success && onSuccess) {
				onSuccess();
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Upload failed";
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex items-center gap-4">
			<div className="flex-1">
				<label
					htmlFor="corrective-maintenance-file"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					Upload Corrective Maintenance Excel File
				</label>
				<input
					id="corrective-maintenance-file"
					type="file"
					accept=".xlsx,.xls"
					onChange={handleFileChange}
					disabled={loading}
					className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
				/>
			</div>

			{loading && (
				<div className="flex items-center gap-2">
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
					<span className="text-sm text-gray-500">Processing...</span>
				</div>
			)}

			{error && (
				<div className="text-sm text-red-600 max-w-xs">{error}</div>
			)}

			{result?.success && (
				<div className="text-sm text-green-600 max-w-xs">
					File processed successfully
					{result.sheet && (
						<span className="block">
							{result.sheet.rows.length} records loaded
						</span>
					)}
					{result.warnings && result.warnings.length > 0 && (
						<div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
							<div className="font-medium mb-1">Warnings:</div>
							<ul className="list-disc list-inside space-y-1">
								{result.warnings.map((warning) => (
									<li key={warning}>{warning}</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default CorrectiveMaintenanceExcelImport;
