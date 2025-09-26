import { useState } from "react";
import { getPreloadHandler } from "../constants/preloadHandlers";

type ForTaggingData = {
	technician: string;
	requestId: string;
	requestIdLink?: string;
	createdTime: string;
	modulo: string;
	subject: string;
	subjectLink?: string;
	problemId: string;
	problemIdLink?: string;
	linkedRequestId: string;
	linkedRequestIdLink?: string;
	category: string;
	importedAt?: string;
	sourceFile?: string;
};

type ExcelSheet = {
	name: string;
	headers: string[];
	rows: ForTaggingData[];
};

type ParseResult = {
	success: boolean;
	fileName: string;
	sheet: ExcelSheet | null;
	error?: string;
	savedCount?: number;
};

const ForTaggingDataExcelImport = () => {
	const [file, setFile] = useState<File | null>(null);
	const [result, setResult] = useState<ParseResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	// Helper function to render cell value with optional link
	const renderCellValue = (row: ForTaggingData, header: string) => {
		const headerMap: Record<
			string,
			{ value: keyof ForTaggingData; link?: keyof ForTaggingData }
		> = {
			Technician: { value: "technician" },
			"Request ID": { value: "requestId", link: "requestIdLink" },
			"Created Time": { value: "createdTime" },
			"Modulo.": { value: "modulo" },
			Subject: { value: "subject", link: "subjectLink" },
			"Problem ID": { value: "problemId", link: "problemIdLink" },
			"Linked Request Id": {
				value: "linkedRequestId",
				link: "linkedRequestIdLink",
			},
			Category: { value: "category" },
		};

		const field = headerMap[header];
		if (!field)
			return (
				<span className="text-gray-900">
					{String(row[header as keyof ForTaggingData] || "")}
				</span>
			);

		const value = String(row[field.value] || "");
		const link = field.link ? String(row[field.link] || "") : undefined;

		if (link) {
			return (
				<button
					type="button"
					onClick={() => window.open(link, "_blank")}
					className="text-blue-600 hover:text-blue-800 underline cursor-pointer bg-transparent border-none p-0 text-sm"
				>
					{value}
				</button>
			);
		}

		return <span className="text-gray-900">{value}</span>;
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFile(e.target.files?.[0] || null);
		setResult(null);
		setError(null);
	};

	const handleImport = async () => {
		if (!file) return;
		setLoading(true);
		setError(null);
		setResult(null);
		try {
			const buffer = await file.arrayBuffer();
			const parseAndSaveExcel = getPreloadHandler(
				"parseAndSaveForTaggingDataExcel",
			);
			const parseResult = (await parseAndSaveExcel(
				buffer,
				file.name,
			)) as ParseResult;
			setResult(parseResult);
			if (!parseResult.success) {
				setError(parseResult.error || "Unknown error");
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Error processing file",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<div className="mb-4">
				<label
					htmlFor="excel-file-upload"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					Select Excel File
				</label>
				<input
					id="excel-file-upload"
					type="file"
					accept=".xlsx,.xls"
					onChange={handleFileChange}
					disabled={loading}
					className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
				/>
			</div>

			<div className="mb-4">
				<button
					type="button"
					onClick={handleImport}
					disabled={!file || loading}
					className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? (
						<>
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Processing...
						</>
					) : (
						"Import Excel"
					)}
				</button>
			</div>

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
								Import Error
							</h3>
							<div className="mt-2 text-sm text-red-700">
								{error}
							</div>
						</div>
					</div>
				</div>
			)}

			{result?.success && result.savedCount !== undefined && (
				<div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg
								className="h-5 w-5 text-green-400"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<title>Success</title>
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="ml-3">
							<p className="text-sm font-medium text-green-800">
								Import Successful
							</p>
							<p className="text-sm text-green-700">
								Successfully imported and saved{" "}
								{result.savedCount} records to the database.
							</p>
						</div>
					</div>
				</div>
			)}

			{result?.success &&
				result.sheet &&
				(() => {
					const sheet = result.sheet;
					return (
						<div>
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											{sheet.headers.map(
												(header: string) => (
													<th
														key={header}
														className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>
														{header}
													</th>
												),
											)}
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{sheet.rows.map(
											(
												row: ForTaggingData,
												rowIndex: number,
											) => (
												<tr
													key={`${sheet.name}-${rowIndex}`}
												>
													{sheet.headers.map(
														(header: string) => (
															<td
																key={header}
																className="px-6 py-4 whitespace-nowrap text-sm"
															>
																{renderCellValue(
																	row,
																	header,
																)}
															</td>
														),
													)}
												</tr>
											),
										)}
									</tbody>
								</table>
							</div>

							<div className="mt-4 text-sm text-gray-600">
								Showing {sheet.rows.length} rows from sheet "
								{sheet.name}"
							</div>
						</div>
					);
				})()}
		</div>
	);
};

export default ForTaggingDataExcelImport;
