import {
	type EnrichedForTaggingData,
	type EnrichmentResult,
	type RequestIdWithLink,
	type TagResponseArrayDto,
	tagResponseArraySchema,
	type GroupedTagData,
	type GroupedTagResponse,
} from "@app/core";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { getPreloadHandler } from "@/constants/preloadHandlers";

export const Route = createFileRoute("/tagging-v3")({
	component: TaggingV3Component,
});

type ForTaggingData = {
	technician: string;
	requestId: string;
	requestIdLink?: string;
	createdTime: string;
	module: string;
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

function TaggingV3Component() {
	const [tags, setTags] = useState<TagResponseArrayDto>([]);
	const [forTaggingData, setForTaggingData] = useState<ForTaggingData[]>([]);
	const [enrichedForTaggingData, setEnrichedForTaggingData] = useState<
		EnrichedForTaggingData[]
	>([]);
	const [additionalInfoToRequestIds, setAdditionalInfoToRequestIds] =
		useState<Map<string, RequestIdWithLink[]>>(new Map());
	const [selectedAdditionalInfo, setSelectedAdditionalInfo] = useState<{
		info: string;
		requestIds: RequestIdWithLink[];
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<
		"tag-data" | "for-tagging-data" | "enriched-data" | "linked-request-overview"
	>("tag-data");
	const [groupedTags, setGroupedTags] = useState<GroupedTagData[]>([]);
	const [categorizationToRequestIds, setCategorizationToRequestIds] = useState<Map<string, Map<string, RequestIdWithLink[]>>>(new Map());
	const [additionalInfoToRequestIdsGrouped, setAdditionalInfoToRequestIdsGrouped] = useState<Map<string, Map<string, RequestIdWithLink[]>>>(new Map());
	const [selectedCategorization, setSelectedCategorization] = useState<{
		categorization: string;
		requestIds: RequestIdWithLink[];
	} | null>(null);
	const [selectedAdditionalInfoGrouped, setSelectedAdditionalInfoGrouped] = useState<{
		info: string;
		requestIds: RequestIdWithLink[];
	} | null>(null);
	const [parseStatus, setParseStatus] = useState<{
		loading: boolean;
		error: string | null;
		success: string | null;
	}>({
		loading: false,
		error: null,
		success: null,
	});

	const [forTaggingParseStatus, setForTaggingParseStatus] = useState<{
		loading: boolean;
		error: string | null;
		success: string | null;
	}>({
		loading: false,
		error: null,
		success: null,
	});

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setParseStatus({ loading: true, error: null, success: null });

		try {
			const uploadAndParseTagReport = getPreloadHandler("parseTagReport");
			if (!uploadAndParseTagReport) {
				throw new Error("Tag report upload function not available");
			}
			const fileBuffer = await file.arrayBuffer();
			const result = await uploadAndParseTagReport(fileBuffer, file.name);

			if (!result.success) {
				throw new Error(result.error || "Failed to parse TAG report");
			}

			setParseStatus({
				loading: false,
				error: null,
				success: `Successfully parsed ${file.name}. Check console for details.`,
			});
			await loadTags();
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Unknown error occurred";
			console.error("Error parsing file:", error);
			setParseStatus({
				loading: false,
				error: errorMessage,
				success: null,
			});
		}
	};

	const handleForTaggingFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setForTaggingParseStatus({ loading: true, error: null, success: null });

		try {
			const parseAndSaveForTaggingDataExcel = getPreloadHandler(
				"parseAndSaveForTaggingDataExcel",
			);
			if (!parseAndSaveForTaggingDataExcel) {
				throw new Error(
					"For tagging data upload function not available",
				);
			}
			const fileBuffer = await file.arrayBuffer();
			const result = await parseAndSaveForTaggingDataExcel(
				fileBuffer,
				file.name,
			);

			if (!result.success) {
				throw new Error(
					result.error || "Failed to parse For Tagging Data Excel",
				);
			}

			setForTaggingParseStatus({
				loading: false,
				error: null,
				success: `Successfully parsed and saved ${file.name}. Check console for details.`,
			});
			await loadForTaggingData();
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Unknown error occurred";
			console.error("Error parsing for tagging file:", error);
			setForTaggingParseStatus({
				loading: false,
				error: errorMessage,
				success: null,
			});
		}
	};

	const loadTags = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const fetchAllTags = getPreloadHandler("getAllTags");
			if (!fetchAllTags) {
				throw new Error("Tag fetch function not available");
			}
			const result = await fetchAllTags();
			const validatedResult = tagResponseArraySchema.parse(result);
			setTags(validatedResult);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Unknown error occurred";
			console.error("Error loading tags:", error);
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	}, []);

	const loadForTaggingData = useCallback(async () => {
		try {
			const fetchAllForTaggingData = getPreloadHandler(
				"getAllForTaggingData",
			);
			if (!fetchAllForTaggingData) {
				throw new Error("ForTaggingData fetch function not available");
			}
			const result = await fetchAllForTaggingData();
			setForTaggingData(result || []);
		} catch (error) {
			console.error("Error loading for tagging data:", error);
			// Don't set error state for for tagging data, just log it
		}
	}, []);

	const loadEnrichedForTaggingData = useCallback(async () => {
		try {
			const fetchEnrichedForTaggingData = getPreloadHandler(
				"getEnrichedForTaggingData",
			);
			if (!fetchEnrichedForTaggingData) {
				throw new Error(
					"Enriched ForTaggingData fetch function not available",
				);
			}
			const result: EnrichmentResult =
				await fetchEnrichedForTaggingData();
			setEnrichedForTaggingData(result.enrichedData || []);
			setAdditionalInfoToRequestIds(
				result.additionalInfoToRequestIds || new Map(),
			);
		} catch (error) {
			console.error("Error loading enriched for tagging data:", error);
			// Don't set error state for enriched for tagging data, just log it
		}
	}, []);

	const handleExternalLink = async (url: string) => {
		try {
			const openExternal = getPreloadHandler("openExternal");
			if (openExternal) {
				await openExternal(url);
			}
		} catch (error) {
			console.error("Failed to open external link:", error);
		}
	};

	const handleAdditionalInfoClick = (info: string) => {
		const requestIds = additionalInfoToRequestIds.get(info) || [];
		setSelectedAdditionalInfo({ info, requestIds });
	};

	const handleCopyAdditionalInfo = async (info: string) => {
		try {
			await navigator.clipboard.writeText(info);
			// Could add a toast notification here if desired
		} catch (error) {
			console.error("Failed to copy additional info:", error);
		}
	};

	const loadGroupedTags = useCallback(async () => {
		try {
			const fetchGroupedTags = getPreloadHandler("getGroupedTagsByLinkedRequest");
			if (!fetchGroupedTags) {
				throw new Error("Grouped tags fetch function not available");
			}
			const result: { success: boolean; data?: GroupedTagResponse; error?: string } = await fetchGroupedTags();
			if (result.success && result.data) {
				setGroupedTags(result.data.groupedData || []);
				// Convert the nested record objects to nested Maps
				const categMap = new Map<string, Map<string, RequestIdWithLink[]>>();
				for (const [linkedReqId, innerObj] of Object.entries(result.data.categorizationToRequestIds)) {
					const innerMap = new Map<string, RequestIdWithLink[]>();
					for (const [categorization, requestIds] of Object.entries(innerObj)) {
						innerMap.set(categorization, requestIds);
					}
					categMap.set(linkedReqId, innerMap);
				}
				setCategorizationToRequestIds(categMap);

				const addInfoMap = new Map<string, Map<string, RequestIdWithLink[]>>();
				for (const [linkedReqId, innerObj] of Object.entries(result.data.additionalInfoToRequestIds)) {
					const innerMap = new Map<string, RequestIdWithLink[]>();
					for (const [additionalInfo, requestIds] of Object.entries(innerObj)) {
						innerMap.set(additionalInfo, requestIds);
					}
					addInfoMap.set(linkedReqId, innerMap);
				}
				setAdditionalInfoToRequestIdsGrouped(addInfoMap);
			}
		} catch (error) {
			console.error("Error loading grouped tags:", error);
		}
	}, []);

	const handleCategorizationClick = (linkedRequestId: string, categorization: string) => {
		const requestIds = categorizationToRequestIds.get(linkedRequestId)?.get(categorization) || [];
		setSelectedCategorization({ categorization, requestIds });
	};

	const handleAdditionalInfoGroupedClick = (linkedRequestId: string, info: string) => {
		const requestIds = additionalInfoToRequestIdsGrouped.get(linkedRequestId)?.get(info) || [];
		setSelectedAdditionalInfoGrouped({ info, requestIds });
	};

	const handleCopyAdditionalInfoGrouped = async (info: string) => {
		try {
			await navigator.clipboard.writeText(info);
		} catch (error) {
			console.error("Failed to copy additional info:", error);
		}
	};

	useEffect(() => {
		loadTags();
		loadForTaggingData();
		loadEnrichedForTaggingData();
		loadGroupedTags();
	}, [loadTags, loadForTaggingData, loadEnrichedForTaggingData, loadGroupedTags]);

	if (loading) {
		return (
			<div className="p-8">
				<h1 className="text-2xl font-bold mb-6">
					Tagging V3 - Loading...
				</h1>
				<div className="text-gray-600">Loading tags...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-8">
				<h1 className="text-2xl font-bold mb-6 text-red-600">
					Tagging V3 - Error
				</h1>
				<div className="text-red-600">Error: {error}</div>
			</div>
		);
	}
	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-3xl font-bold text-gray-800 mb-6">
						Tagging v3
					</h1>
					<div className="bg-white rounded-lg shadow-md p-6">
						<div className="text-center py-12">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
							<p className="text-gray-500">Loading tag data...</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-3xl font-bold text-gray-800 mb-6">
						Tagging v3
					</h1>
					<div className="bg-white rounded-lg shadow-md p-6">
						<div className="text-center py-12">
							<div className="text-red-500 mb-4">
								<svg
									className="mx-auto h-12 w-12"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									role="img"
									aria-labelledby="error-icon-title"
								>
									<title id="error-icon-title">
										Error icon
									</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<h2 className="text-xl font-semibold text-red-700 mb-2">
								Error Loading Data
							</h2>
							<p className="text-red-600 mb-4">{error}</p>
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
							>
								Retry
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-800 mb-6">
					Tagging v3
				</h1>
				{/* Tab Navigation */}
				<div className="mb-6">
					<div className="border-b border-gray-200">
						<nav className="-mb-px flex space-x-8">
							<button
								type="button"
								onClick={() => setActiveTab("tag-data")}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === "tag-data"
										? "border-blue-500 text-blue-600"
										: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
								}`}
							>
								Tag Data
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("linked-request-overview")}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === "linked-request-overview"
										? "border-blue-500 text-blue-600"
										: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
								}`}
							>
								Linked Request Overview
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("for-tagging-data")}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === "for-tagging-data"
										? "border-blue-500 text-blue-600"
										: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
								}`}
							>
								For Tagging Data
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("enriched-data")}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === "enriched-data"
										? "border-blue-500 text-blue-600"
										: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
								}`}
							>
								Request Insights
							</button>
						</nav>
					</div>
				</div>
				{/* Tab Content */}
				{activeTab === "tag-data" && (
					<div className="space-y-6">
						{/* File Upload Section */}
						<div className="bg-white rounded-lg shadow-md">
							<div className="px-6 py-4 border-b border-gray-200">
								<h2 className="text-xl font-semibold text-gray-800">
									Upload TAG Report
								</h2>
								<p className="text-gray-600">
									Upload an Excel file to parse TAG report
									data using the new core parser
								</p>
							</div>
							<div className="p-6">
								<div className="mb-4">
									<label
										htmlFor="file-upload"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Select Excel File
									</label>
									<input
										id="file-upload"
										type="file"
										accept=".xlsx,.xls"
										onChange={handleFileUpload}
										disabled={parseStatus.loading}
										className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
									/>
								</div>

								{parseStatus.loading && (
									<div className="flex items-center text-blue-600 mb-4">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
										<span className="text-sm">
											Parsing file...
										</span>
									</div>
								)}

								{parseStatus.error && (
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
													<title id="error-icon-title">
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
													Parse Error
												</h3>
												<div className="mt-2 text-sm text-red-700">
													{parseStatus.error}
												</div>
											</div>
										</div>
									</div>
								)}

								{parseStatus.success && (
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
													{parseStatus.success}
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Refresh Button */}
						<div className="flex justify-end">
							<button
								type="button"
								onClick={() => loadTags()}
								disabled={loading}
								className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
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
										<title id="refresh-icon">
											Refresh icon
										</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
								)}
								Refresh TAG Data
							</button>
						</div>

						{/* Tag Data Section */}
						<div className="bg-white rounded-lg shadow-md">
							<div className="px-6 py-4 border-b border-gray-200">
								<h2 className="text-xl font-semibold text-gray-800">
									Tag Data ({tags.length} records)
								</h2>
								<p className="text-gray-600">
									Live data from tag_v2 database using clean
									architecture
								</p>
							</div>

							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Created
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Request ID
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Additional Info
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Module
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Problem ID
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Linked Request
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Technician
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Category
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												JIRA
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{tags.map((tag) => (
											<tr
												key={tag.id}
												className="hover:bg-gray-50"
											>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{tag.createdTime}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													{tag.requestId.link ? (
														<button
															type="button"
															onClick={() =>
																handleExternalLink(
																	tag
																		.requestId
																		.link,
																)
															}
															className="text-blue-600 hover:text-blue-800 underline text-sm cursor-pointer bg-transparent border-none p-0"
														>
															{
																tag.requestId
																	.value
															}
														</button>
													) : (
														<span className="text-sm text-gray-900">
															{
																tag.requestId
																	.value
															}
														</span>
													)}
												</td>
												<td
													className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate"
													title={tag.additionalInfo}
												>
													{tag.additionalInfo}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
														{tag.module}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													{tag.problemId.link ? (
														<button
															type="button"
															onClick={() =>
																handleExternalLink(
																	tag
																		.problemId
																		.link,
																)
															}
															className="text-green-600 hover:text-green-800 underline text-sm cursor-pointer bg-transparent border-none p-0"
														>
															{
																tag.problemId
																	.value
															}
														</button>
													) : (
														<span className="text-sm text-gray-900">
															{
																tag.problemId
																	.value
															}
														</span>
													)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													{tag.linkedRequestId
														.link ? (
														<button
															type="button"
															onClick={() =>
																handleExternalLink(
																	tag
																		.linkedRequestId
																		.link,
																)
															}
															className="text-purple-600 hover:text-purple-800 underline text-sm cursor-pointer bg-transparent border-none p-0"
														>
															{
																tag
																	.linkedRequestId
																	.value
															}
														</button>
													) : (
														<span className="text-sm text-gray-900">
															{
																tag
																	.linkedRequestId
																	.value
															}
														</span>
													)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{tag.technician}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
														{tag.categorization}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm">
													{tag.jira && (
														<span className="text-purple-600 font-mono">
															{tag.jira}
														</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}

				{activeTab === "for-tagging-data" && (
					<div className="space-y-6">
						{/* For Tagging Data Upload Section */}
						<div className="bg-white rounded-lg shadow-md">
							<div className="px-6 py-4 border-b border-gray-200">
								<h2 className="text-xl font-semibold text-gray-800">
									Upload For Tagging Report
								</h2>
								<p className="text-gray-600">
									Upload an Excel file to parse and save for
									tagging data
								</p>
							</div>
							<div className="p-6">
								<div className="mb-4">
									<label
										htmlFor="for-tagging-file-upload"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Select Excel File
									</label>
									<input
										id="for-tagging-file-upload"
										type="file"
										accept=".xlsx,.xls"
										onChange={handleForTaggingFileUpload}
										disabled={forTaggingParseStatus.loading}
										className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
									/>
								</div>

								{forTaggingParseStatus.loading && (
									<div className="flex items-center text-green-600 mb-4">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
										<span className="text-sm">
											Parsing and saving file...
										</span>
									</div>
								)}

								{forTaggingParseStatus.error && (
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
													Parse Error
												</h3>
												<div className="mt-2 text-sm text-red-700">
													{
														forTaggingParseStatus.error
													}
												</div>
											</div>
										</div>
									</div>
								)}

								{forTaggingParseStatus.success && (
									<div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
										<div className="flex">
											<div className="flex-shrink-0">
												<svg
													className="h-5 w-5 text-green-400"
													viewBox="0 0 20 20"
													fill="currentColor"
													role="img"
													aria-labelledby="success-icon-title-2"
												>
													<title id="success-icon-title-2">
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
													{
														forTaggingParseStatus.success
													}
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Refresh Button */}
						<div className="flex justify-end">
							<button
								type="button"
								onClick={() => loadForTaggingData()}
								disabled={false}
								className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
							>
								<svg
									className="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-labelledby="refresh-icon-2"
								>
									<title id="refresh-icon-2">
										Refresh icon
									</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								Refresh For Tagging Data
							</button>
						</div>

						{/* ForTaggingData Section */}
						<div className="bg-white rounded-lg shadow-md">
							<div className="px-6 py-4 border-b border-gray-200">
								<h2 className="text-xl font-semibold text-gray-800">
									ForTaggingData ({forTaggingData.length}{" "}
									records)
								</h2>
								<p className="text-gray-600">
									Data from for tagging database
								</p>
							</div>

							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Request ID
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Technician
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Created Time
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Modulo
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Subject
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Problem ID
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Linked Request
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Category
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{forTaggingData.map((data, index) => (
											<tr
												key={`${data.requestId}-${index}`}
												className="hover:bg-gray-50"
											>
												<td className="px-6 py-4 whitespace-nowrap">
													{data.requestIdLink ? (
														<button
															type="button"
															onClick={() =>
																handleExternalLink(
																	data.requestIdLink as string,
																)
															}
															className="text-blue-600 hover:text-blue-800 underline text-sm cursor-pointer bg-transparent border-none p-0"
														>
															{data.requestId}
														</button>
													) : (
														<span className="text-sm text-gray-900">
															{data.requestId}
														</span>
													)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{data.technician}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{data.createdTime}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
														{data.module}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													{data.subjectLink ? (
														<button
															type="button"
															onClick={() =>
																handleExternalLink(
																	data.subjectLink as string,
																)
															}
															className="text-green-600 hover:text-green-800 underline text-sm cursor-pointer bg-transparent border-none p-0"
														>
															{data.subject}
														</button>
													) : (
														<span className="text-sm text-gray-900">
															{data.subject}
														</span>
													)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													{data.problemIdLink ? (
														<button
															type="button"
															onClick={() =>
																handleExternalLink(
																	data.problemIdLink as string,
																)
															}
															className="text-purple-600 hover:text-purple-800 underline text-sm cursor-pointer bg-transparent border-none p-0"
														>
															{data.problemId}
														</button>
													) : (
														<span className="text-sm text-gray-900">
															{data.problemId}
														</span>
													)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													{data.linkedRequestIdLink ? (
														<button
															type="button"
															onClick={() =>
																handleExternalLink(
																	data.linkedRequestIdLink as string,
																)
															}
															className="text-orange-600 hover:text-orange-800 underline text-sm cursor-pointer bg-transparent border-none p-0"
														>
															{
																data.linkedRequestId
															}
														</button>
													) : (
														<span className="text-sm text-gray-900">
															{
																data.linkedRequestId
															}
														</span>
													)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
														{data.category}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}
				{activeTab === "enriched-data" && (
					<div className="space-y-6">
						{/* Refresh Button */}
						<div className="flex justify-end">
							<button
								type="button"
								onClick={() => loadEnrichedForTaggingData()}
								disabled={false}
								className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
							>
								<svg
									className="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-labelledby="refresh-icon-3"
								>
									<title id="refresh-icon-3">
										Refresh icon
									</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								Refresh Request Insights
							</button>
						</div>

						{/* Request Insights Section */}
						<div className="bg-white rounded-lg shadow-md">
							<div className="px-6 py-4 border-b border-gray-200">
								<h2 className="text-xl font-semibold text-gray-800">
									Request Insights (
									{enrichedForTaggingData.length} records)
								</h2>
								<p className="text-gray-600">
									Analysis of request relationships and
									additional information
								</p>
							</div>

							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Request ID
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Technician
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Created Time
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Modulo
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Subject
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Problem ID
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Linked Request
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Category
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Additional Info
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{enrichedForTaggingData.map(
											(data, index) => (
												<tr
													key={`${data.requestId}-${index}`}
													className="hover:bg-gray-50"
												>
													<td className="px-6 py-4 whitespace-nowrap">
														{data.requestIdLink ? (
															<button
																type="button"
																onClick={() =>
																	handleExternalLink(
																		data.requestIdLink as string,
																	)
																}
																className="text-blue-600 hover:text-blue-800 underline text-sm cursor-pointer bg-transparent border-none p-0"
															>
																{data.requestId}
															</button>
														) : (
															<span className="text-sm text-gray-900">
																{data.requestId}
															</span>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														{data.technician}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														{data.createdTime}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
															{data.module}
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														{data.subjectLink ? (
															<button
																type="button"
																onClick={() =>
																	handleExternalLink(
																		data.subjectLink as string,
																	)
																}
																className="text-green-600 hover:text-green-800 underline text-sm cursor-pointer bg-transparent border-none p-0"
															>
																{data.subject}
															</button>
														) : (
															<span className="text-sm text-gray-900">
																{data.subject}
															</span>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														{data.problemIdLink ? (
															<button
																type="button"
																onClick={() =>
																	handleExternalLink(
																		data.problemIdLink as string,
																	)
																}
																className="text-purple-600 hover:text-purple-800 underline text-sm cursor-pointer bg-transparent border-none p-0"
															>
																{data.problemId}
															</button>
														) : (
															<span className="text-sm text-gray-900">
																{data.problemId}
															</span>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														{data.linkedRequestIdLink ? (
															<button
																type="button"
																onClick={() =>
																	handleExternalLink(
																		data.linkedRequestIdLink as string,
																	)
																}
																className="text-orange-600 hover:text-orange-800 underline text-sm cursor-pointer bg-transparent border-none p-0"
															>
																{
																	data.linkedRequestId
																}
															</button>
														) : (
															<span className="text-sm text-gray-900">
																{
																	data.linkedRequestId
																}
															</span>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
															{data.category}
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="flex flex-wrap gap-1">
															{data.additionalInfo
																.length > 0 ? (
																data.additionalInfo.map(
																	(info) => (
																		<div
																			key={`${data.requestId}-info-${info}`}
																			className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200"
																		>
																			<button
																				type="button"
																				onClick={() =>
																					handleAdditionalInfoClick(
																						info,
																					)
																				}
																				onKeyDown={(
																					e,
																				) => {
																					if (
																						e.key ===
																							"Enter" ||
																						e.key ===
																							" "
																					) {
																						handleAdditionalInfoClick(
																							info,
																						);
																					}
																				}}
																				className="cursor-pointer border-none bg-transparent p-0 text-purple-800 hover:text-purple-900"
																				title={`Click to see all Request IDs using "${info}"`}
																			>
																				{
																					info
																				}
																			</button>
																			<button
																				type="button"
																				onClick={(
																					e,
																				) => {
																					e.stopPropagation();
																					handleCopyAdditionalInfo(
																						info,
																					);
																				}}
																				onKeyDown={(
																					e,
																				) => {
																					if (
																						e.key ===
																							"Enter" ||
																						e.key ===
																							" "
																					) {
																						e.stopPropagation();
																						handleCopyAdditionalInfo(
																							info,
																						);
																					}
																				}}
																				className="ml-1 p-0.5 rounded-sm hover:bg-purple-300 transition-colors border-none bg-transparent"
																				title="Copy to clipboard"
																			>
																				<svg
																					className="h-3 w-3 text-purple-600"
																					fill="none"
																					viewBox="0 0 24 24"
																					stroke="currentColor"
																					aria-labelledby="copy-icon"
																				>
																					<title id="copy-icon">
																						Copy
																					</title>
																					<path
																						strokeLinecap="round"
																						strokeLinejoin="round"
																						strokeWidth={
																							2
																						}
																						d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
																					/>
																				</svg>
																			</button>
																		</div>
																	),
																)
															) : (
																<span className="text-sm text-gray-400">
																	-
																</span>
															)}
														</div>
													</td>
												</tr>
											),
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}

				{/* Linked Request Overview Tab */}
				{activeTab === "linked-request-overview" && (
					<div className="space-y-6">
						{/* Refresh Button */}
						<div className="flex justify-end">
							<button
								type="button"
								onClick={() => loadGroupedTags()}
								disabled={false}
								className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
							>
								<svg
									className="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-labelledby="refresh-icon-linked"
								>
									<title id="refresh-icon-linked">
										Refresh icon
									</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								Refresh Linked Request Overview
							</button>
						</div>

						{/* Linked Request Overview Section */}
						<div className="bg-white rounded-lg shadow-md">
							<div className="px-6 py-4 border-b border-gray-200">
								<h2 className="text-xl font-semibold text-gray-800">
									Linked Request Overview ({groupedTags.length} linked requests)
								</h2>
								<p className="text-gray-600">
									Grouped view by linked request with categorizations and additional info
								</p>
							</div>

							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Linked Request
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Category
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Additional Info
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{groupedTags.map((group, index) => (
											<tr
												key={`${group.linkedRequestId.value}-${index}`}
												className="hover:bg-gray-50"
											>
												<td className="px-6 py-4 whitespace-nowrap">
													{group.linkedRequestId.link ? (
														<button
															type="button"
															onClick={() =>
																handleExternalLink(
																	group.linkedRequestId.link as string,
																)
															}
															className="text-purple-600 hover:text-purple-800 underline text-sm cursor-pointer bg-transparent border-none p-0"
														>
															{group.linkedRequestId.value}
														</button>
													) : (
														<span className="text-sm text-gray-900">
															{group.linkedRequestId.value}
														</span>
													)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex flex-wrap gap-1">
														{group.categorizations.length > 0 ? (
															group.categorizations.map((categ) => (
																<button
																	key={`${group.linkedRequestId.value}-categ-${categ}`}
																	type="button"
																	onClick={() => handleCategorizationClick(group.linkedRequestId.value, categ)}
																	className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer border-none"
																	title={`Click to see all requests with "${categ}"`}
																>
																	{categ}
																</button>
															))
														) : (
															<span className="text-sm text-gray-400">-</span>
														)}
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex flex-wrap gap-1">
														{group.additionalInfoList.length > 0 ? (
															group.additionalInfoList.map((info) => (
																<div
																	key={`${group.linkedRequestId.value}-info-${info}`}
																	className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200"
																>
																	<button
																		type="button"
																		onClick={() =>
																			handleAdditionalInfoGroupedClick(group.linkedRequestId.value, info)
																		}
																		className="cursor-pointer border-none bg-transparent p-0 text-purple-800 hover:text-purple-900"
																		title={`Click to see all requests using "${info}"`}
																	>
																		{info}
																	</button>
																	<button
																		type="button"
																		onClick={(e) => {
																			e.stopPropagation();
																			handleCopyAdditionalInfoGrouped(info);
																		}}
																		className="ml-1 p-0.5 rounded-sm hover:bg-purple-300 transition-colors border-none bg-transparent"
																		title="Copy to clipboard"
																	>
																		<svg
																			className="h-3 w-3 text-purple-600"
																			fill="none"
																			viewBox="0 0 24 24"
																			stroke="currentColor"
																			aria-labelledby="copy-icon-grouped"
																		>
																			<title id="copy-icon-grouped">
																				Copy
																			</title>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				strokeWidth={2}
																				d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
																			/>
																		</svg>
																	</button>
																</div>
															))
														) : (
															<span className="text-sm text-gray-400">-</span>
														)}
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}

				{/* Additional Information Panel */}
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
					<h3 className="text-lg font-medium text-blue-800 mb-3">
						🎉 Clean Architecture Implementation
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<h4 className="font-medium text-blue-800 mb-2">
								📦 Backend
							</h4>
							<ul className="text-sm text-blue-700 space-y-1">
								<li>• TagService (Service Container)</li>
								<li>• SqlJsTagRepository (Infrastructure)</li>
								<li>• TagFinder (Use Case)</li>
							</ul>
						</div>
						<div>
							<h4 className="font-medium text-blue-800 mb-2">
								🔗 IPC Bridge
							</h4>
							<ul className="text-sm text-blue-700 space-y-1">
								<li>• TagDataModule (Main Process)</li>
								<li>• Preload Script Exposure</li>
								<li>• Type-safe Communication</li>
							</ul>
						</div>
						<div>
							<h4 className="font-medium text-blue-800 mb-2">
								🎨 Frontend
							</h4>
							<ul className="text-sm text-blue-700 space-y-1">
								<li>• React Component</li>
								<li>• TanStack Router</li>
								<li>• Tailwind CSS Styling</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Additional Info Details Modal */}
				{selectedAdditionalInfo && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
							<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
								<h3 className="text-lg font-semibold text-gray-800">
									Request IDs using "
									{selectedAdditionalInfo.info}"
								</h3>
								<button
									type="button"
									onClick={() =>
										setSelectedAdditionalInfo(null)
									}
									className="text-gray-400 hover:text-gray-600"
								>
									<svg
										className="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-labelledby="close-modal"
									>
										<title id="close-modal">
											Close modal
										</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
							<div className="px-6 py-4 max-h-96 overflow-y-auto">
								<p className="text-sm text-gray-600 mb-4">
									This additional info is used by{" "}
									{selectedAdditionalInfo.requestIds.length}{" "}
									request(s):
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
									{selectedAdditionalInfo.requestIds
										.sort((a, b) => a.requestId.localeCompare(b.requestId, undefined, { numeric: true }))
										.reverse()
										.map((requestIdWithLink) => (
											<div
												key={
													requestIdWithLink.requestId
												}
												className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm text-blue-800 font-mono"
											>
												{requestIdWithLink.link ? (
													<a
														href={
															requestIdWithLink.link
														}
														target="_blank"
														rel="noopener noreferrer"
														className="text-blue-600 hover:text-blue-800 underline"
														onClick={(e) => {
															e.preventDefault();
															handleExternalLink(
																requestIdWithLink.link as string,
															);
														}}
													>
														{
															requestIdWithLink.requestId
														}
													</a>
												) : (
													requestIdWithLink.requestId
												)}
											</div>
										),
									)}
								</div>
								{selectedAdditionalInfo.requestIds.length ===
									0 && (
									<p className="text-sm text-gray-500 italic">
										No request IDs found for this additional
										info.
									</p>
								)}
							</div>
							<div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
								<button
									type="button"
									onClick={() =>
										setSelectedAdditionalInfo(null)
									}
									className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Categorization Details Modal */}
				{selectedCategorization && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
							<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
								<h3 className="text-lg font-semibold text-gray-800">
									Request IDs with category "{selectedCategorization.categorization}"
								</h3>
								<button
									type="button"
									onClick={() => setSelectedCategorization(null)}
									className="text-gray-400 hover:text-gray-600"
								>
									<svg
										className="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-labelledby="close-modal-categ"
									>
										<title id="close-modal-categ">Close modal</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
							<div className="px-6 py-4 max-h-96 overflow-y-auto">
								<p className="text-sm text-gray-600 mb-4">
									This category is used by {selectedCategorization.requestIds.length} request(s):
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
									{selectedCategorization.requestIds
										.sort((a, b) => a.requestId.localeCompare(b.requestId, undefined, { numeric: true }))
										.reverse()
										.map((requestIdWithLink) => (
										<div
											key={requestIdWithLink.requestId}
											className="bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm text-green-800 font-mono"
										>
											{requestIdWithLink.link ? (
												<a
													href={requestIdWithLink.link}
													target="_blank"
													rel="noopener noreferrer"
													className="text-green-600 hover:text-green-800 underline"
													onClick={(e) => {
														e.preventDefault();
														handleExternalLink(requestIdWithLink.link as string);
													}}
												>
													{requestIdWithLink.requestId}
												</a>
											) : (
												requestIdWithLink.requestId
											)}
										</div>
									))}
								</div>
								{selectedCategorization.requestIds.length === 0 && (
									<p className="text-sm text-gray-500 italic">
										No request IDs found for this category.
									</p>
								)}
							</div>
							<div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
								<button
									type="button"
									onClick={() => setSelectedCategorization(null)}
									className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Additional Info Grouped Details Modal */}
				{selectedAdditionalInfoGrouped && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
							<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
								<h3 className="text-lg font-semibold text-gray-800">
									Request IDs using "{selectedAdditionalInfoGrouped.info}"
								</h3>
								<button
									type="button"
									onClick={() => setSelectedAdditionalInfoGrouped(null)}
									className="text-gray-400 hover:text-gray-600"
								>
									<svg
										className="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-labelledby="close-modal-info-grouped"
									>
										<title id="close-modal-info-grouped">Close modal</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
							<div className="px-6 py-4 max-h-96 overflow-y-auto">
								<p className="text-sm text-gray-600 mb-4">
									This additional info is used by {selectedAdditionalInfoGrouped.requestIds.length} request(s):
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
									{selectedAdditionalInfoGrouped.requestIds
										.sort((a, b) => a.requestId.localeCompare(b.requestId, undefined, { numeric: true }))
										.reverse()
										.map((requestIdWithLink) => (
										<div
											key={requestIdWithLink.requestId}
											className="bg-purple-50 border border-purple-200 rounded-md px-3 py-2 text-sm text-purple-800 font-mono"
										>
											{requestIdWithLink.link ? (
												<a
													href={requestIdWithLink.link}
													target="_blank"
													rel="noopener noreferrer"
													className="text-purple-600 hover:text-purple-800 underline"
													onClick={(e) => {
														e.preventDefault();
														handleExternalLink(requestIdWithLink.link as string);
													}}
												>
													{requestIdWithLink.requestId}
												</a>
											) : (
												requestIdWithLink.requestId
											)}
										</div>
									))}
								</div>
								{selectedAdditionalInfoGrouped.requestIds.length === 0 && (
									<p className="text-sm text-gray-500 italic">
										No request IDs found for this additional info.
									</p>
								)}
							</div>
							<div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
								<button
									type="button"
									onClick={() => setSelectedAdditionalInfoGrouped(null)}
									className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
