import { useState, useEffect } from 'react';
import { preloadApiKeys } from '../constants/preloadApiKeys';

interface LevelMapping {
	requestStatusReporte: string;
	level: string;
	createdAt: string;
	updatedAt: string;
}

interface LevelMappingFormData {
	requestStatusReporte: string;
	level: string;
}

const LevelMappingEditDialog = ({
	mapping,
	onSave,
	onCancel,
	isNew
}: {
	mapping: LevelMappingFormData;
	onSave: (mapping: LevelMappingFormData) => void;
	onCancel: () => void;
	isNew: boolean;
}) => {
	const [formData, setFormData] = useState<LevelMappingFormData>({
		requestStatusReporte: mapping.requestStatusReporte,
		level: mapping.level
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.requestStatusReporte.trim()) {
			newErrors.requestStatusReporte = 'Request Status Reporte is required';
		}

		if (!formData.level) {
			newErrors.level = 'Level is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (validateForm()) {
			onSave(formData);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">
					{isNew ? 'Add New Level Mapping' : 'Edit Level Mapping'}
				</h3>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Request Status Reporte</label>
						<input
							type="text"
							value={formData.requestStatusReporte}
							onChange={(e) => setFormData({...formData, requestStatusReporte: e.target.value})}
							disabled={!isNew}
							className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
								!isNew ? 'bg-gray-100 cursor-not-allowed' : ''
							} ${errors.requestStatusReporte ? 'border-red-500' : 'border-gray-300'}`}
							placeholder="e.g., Closed, On going in L2"
						/>
						{errors.requestStatusReporte && <p className="text-red-500 text-xs mt-1">{errors.requestStatusReporte}</p>}
						{!isNew && <p className="text-xs text-gray-500 mt-1">Request Status Reporte cannot be changed (it's the primary key)</p>}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
						<select
							value={formData.level}
							onChange={(e) => setFormData({...formData, level: e.target.value})}
							className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
								errors.level ? 'border-red-500' : 'border-gray-300'
							}`}
						>
							<option value="">Select a level...</option>
							<option value="L2">L2</option>
							<option value="L3">L3</option>
							<option value="Unknown">Unknown</option>
						</select>
						{errors.level && <p className="text-red-500 text-xs mt-1">{errors.level}</p>}
						<p className="text-xs text-gray-500 mt-1">
							L2: Level 2 support | L3: Level 3 support | Unknown: Unclassified
						</p>
					</div>

					<div className="flex gap-2 pt-4">
						<button
							type="submit"
							className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
						>
							Save
						</button>
						<button
							type="button"
							onClick={onCancel}
							className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export function LevelMappingSettings() {
	const [mappings, setMappings] = useState<LevelMapping[]>([]);
	const [editingMapping, setEditingMapping] = useState<{ data: LevelMappingFormData; isNew: boolean } | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load mappings on mount
	useEffect(() => {
		loadMappings();
	}, []);

	const loadMappings = async () => {
		try {
			setLoading(true);
			setError(null);
			const api = (window as any)[preloadApiKeys.getLevelMappings];
			const result = await api();
			if (result.success) {
				setMappings(result.data);
			} else {
				setError(result.error || 'Failed to load level mappings');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load level mappings');
		} finally {
			setLoading(false);
		}
	};

	const handleSaveMapping = async (mappingData: LevelMappingFormData) => {
		try {
			setError(null);
			let result;

			if (editingMapping?.isNew) {
				// Create new mapping
				const api = (window as any)[preloadApiKeys.createLevelMapping];
				result = await api(mappingData.requestStatusReporte, mappingData.level);
			} else {
				// Update existing mapping
				const api = (window as any)[preloadApiKeys.updateLevelMapping];
				result = await api(mappingData.requestStatusReporte, mappingData.level);
			}

			if (result.success) {
				await loadMappings();
				setEditingMapping(null);
			} else {
				setError(result.error || 'Failed to save level mapping');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save level mapping');
		}
	};

	const handleDeleteMapping = async (requestStatusReporte: string) => {
		if (!confirm(`Are you sure you want to delete the level mapping for "${requestStatusReporte}"?`)) {
			return;
		}

		try {
			setError(null);
			const api = (window as any)[preloadApiKeys.deleteLevelMapping];
			const result = await api(requestStatusReporte);
			if (result.success) {
				await loadMappings();
			} else {
				setError(result.error || 'Failed to delete level mapping');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete level mapping');
		}
	};

	const getLevelBadgeColor = (level: string) => {
		switch (level) {
			case 'L2':
				return 'bg-blue-100 text-blue-800';
			case 'L3':
				return 'bg-purple-100 text-purple-800';
			case 'Unknown':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-7xl mx-auto">
					<div className="bg-white rounded-lg shadow-md p-6">
						<div className="text-center py-12">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
							<p className="text-gray-500">Loading level mappings...</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-800 mb-6">Level Mapping Configuration</h1>

				{/* Explanation Section */}
				<div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm mb-6 p-6">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div className="ml-3">
							<h3 className="text-lg font-semibold text-blue-900 mb-2">How Level Mapping Works</h3>
							<div className="text-sm text-blue-800 space-y-2">
								<p>
									Level mappings determine which support level (L2 or L3) each request status belongs to.
									This is used for categorizing and reporting incidents by support level.
								</p>
								<p>
									<strong>When applied:</strong> Level mapping happens during Excel upload, <strong>after</strong> status mapping.
									It uses the mapped <code className="bg-blue-100 px-1 rounded">requestStatusReporte</code> value, not the original status.
								</p>
								<p>
									<strong>Default value:</strong> If no mapping exists for a status, it will be assigned <strong>"Unknown"</strong>.
								</p>
							</div>
						</div>
					</div>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 rounded-lg shadow-sm p-4 mb-6">
						<div className="flex">
							<div className="flex-shrink-0">
								<svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
								</svg>
							</div>
							<div className="ml-3">
								<p className="text-sm text-red-800">{error}</p>
							</div>
						</div>
					</div>
				)}

				{/* Mappings Management Section */}
				<div className="bg-white rounded-lg shadow-md">
					<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
						<div>
							<h2 className="text-xl font-semibold text-gray-800">Level Mappings</h2>
							<p className="text-sm text-gray-600 mt-1">{mappings.length} mappings configured</p>
						</div>
						<button
							onClick={() => setEditingMapping({
								data: {
									requestStatusReporte: '',
									level: ''
								},
								isNew: true
							})}
							className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
						>
							+ Add New Mapping
						</button>
					</div>

					<div className="p-6">
						{mappings.length === 0 ? (
							<div className="text-center py-12">
								<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								<h3 className="mt-2 text-sm font-medium text-gray-900">No level mappings configured</h3>
								<p className="mt-1 text-sm text-gray-500">Get started by creating a new level mapping.</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Status Reporte</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
											<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{mappings.map((mapping) => (
											<tr key={mapping.requestStatusReporte}>
												<td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate" title={mapping.requestStatusReporte}>
													{mapping.requestStatusReporte}
												</td>
												<td className="px-4 py-4 whitespace-nowrap">
													<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelBadgeColor(mapping.level)}`}>
														{mapping.level}
													</span>
												</td>
												<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
													{new Date(mapping.updatedAt).toLocaleString()}
												</td>
												<td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
													<button
														onClick={() => setEditingMapping({
															data: {
																requestStatusReporte: mapping.requestStatusReporte,
																level: mapping.level
															},
															isNew: false
														})}
														className="text-blue-600 hover:text-blue-900 mr-3"
													>
														Edit
													</button>
													<button
														onClick={() => handleDeleteMapping(mapping.requestStatusReporte)}
														className="text-red-600 hover:text-red-900"
													>
														Delete
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Edit Dialog */}
			{editingMapping && (
				<LevelMappingEditDialog
					mapping={editingMapping.data}
					onSave={handleSaveMapping}
					onCancel={() => setEditingMapping(null)}
					isNew={editingMapping.isNew}
				/>
			)}
		</div>
	);
}
