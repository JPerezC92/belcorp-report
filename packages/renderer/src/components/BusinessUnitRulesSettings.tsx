import { useState, useEffect } from 'react';
import { preloadApiKeys } from '../constants/preloadApiKeys';

interface BusinessUnitRule {
	id: number;
	businessUnit: string;
	pattern: string;
	patternType: 'contains' | 'regex' | 'exact';
	priority: number;
	active: boolean;
	createdAt: string;
	updatedAt: string;
}

interface BusinessUnitRuleFormData {
	businessUnit: string;
	pattern: string;
	patternType: 'contains' | 'regex' | 'exact';
	priority: number;
	active: boolean;
}

const BusinessUnitRuleEditDialog = ({
	rule,
	onSave,
	onCancel
}: {
	rule: BusinessUnitRule | BusinessUnitRuleFormData;
	onSave: (rule: BusinessUnitRuleFormData) => void;
	onCancel: () => void;
}) => {
	const [formData, setFormData] = useState<BusinessUnitRuleFormData>({
		businessUnit: rule.businessUnit,
		pattern: rule.pattern,
		patternType: rule.patternType,
		priority: rule.priority,
		active: rule.active
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.businessUnit.trim()) {
			newErrors.businessUnit = 'Business unit is required';
		}

		if (!formData.pattern.trim()) {
			newErrors.pattern = 'Pattern is required';
		}

		if (formData.patternType === 'regex') {
			try {
				new RegExp(formData.pattern);
			} catch (error) {
				newErrors.pattern = 'Invalid regex pattern';
			}
		}

		if (formData.priority < 0) {
			newErrors.priority = 'Priority must be non-negative';
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
					{'id' in rule ? 'Edit Rule' : 'Add New Rule'}
				</h3>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Business Unit</label>
						<input
							type="text"
							value={formData.businessUnit}
							onChange={(e) => setFormData({...formData, businessUnit: e.target.value})}
							className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.businessUnit ? 'border-red-500' : 'border-gray-300'}`}
							placeholder="e.g., FFVV, SB, UB-3"
						/>
						{errors.businessUnit && <p className="text-red-500 text-xs mt-1">{errors.businessUnit}</p>}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
						<input
							type="text"
							value={formData.pattern}
							onChange={(e) => setFormData({...formData, pattern: e.target.value})}
							className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.pattern ? 'border-red-500' : 'border-gray-300'}`}
							placeholder="e.g., somos belcorp"
						/>
						{errors.pattern && <p className="text-red-500 text-xs mt-1">{errors.pattern}</p>}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Pattern Type</label>
						<select
							value={formData.patternType}
							onChange={(e) => setFormData({...formData, patternType: e.target.value as 'contains' | 'regex' | 'exact'})}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="contains">Contains</option>
							<option value="regex">Regex</option>
							<option value="exact">Exact Match</option>
						</select>
						<p className="text-xs text-gray-500 mt-1">
							Contains: case-insensitive substring match | Regex: full regex support | Exact: exact match (case-insensitive)
						</p>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
						<input
							type="number"
							value={formData.priority}
							onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
							className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.priority ? 'border-red-500' : 'border-gray-300'}`}
							min="0"
						/>
						{errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority}</p>}
						<p className="text-xs text-gray-500 mt-1">Lower numbers = higher priority</p>
					</div>

					<div className="flex items-center">
						<input
							type="checkbox"
							id="active"
							checked={formData.active}
							onChange={(e) => setFormData({...formData, active: e.target.checked})}
							className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
						/>
						<label htmlFor="active" className="ml-2 block text-sm text-gray-700">
							Active
						</label>
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

export function BusinessUnitRulesSettings() {
	const [rules, setRules] = useState<BusinessUnitRule[]>([]);
	const [editingRule, setEditingRule] = useState<BusinessUnitRule | BusinessUnitRuleFormData | null>(null);
	const [testText, setTestText] = useState('');
	const [testResults, setTestResults] = useState<Map<number, boolean>>(new Map());
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load rules on mount
	useEffect(() => {
		loadRules();
	}, []);

	const loadRules = async () => {
		try {
			setLoading(true);
			setError(null);
			const api = (window as any)[preloadApiKeys.getAllBusinessUnitRules];
			const result = await api();
			if (result.success) {
				setRules(result.data);
			} else {
				setError(result.error || 'Failed to load rules');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load rules');
		} finally {
			setLoading(false);
		}
	};

	const handleSaveRule = async (ruleData: BusinessUnitRuleFormData) => {
		try {
			setError(null);
			let result;

			if (editingRule && 'id' in editingRule) {
				// Update existing rule
				const api = (window as any)[preloadApiKeys.updateBusinessUnitRule];
				result = await api(editingRule.id, ruleData);
			} else {
				// Create new rule
				const api = (window as any)[preloadApiKeys.createBusinessUnitRule];
				result = await api(ruleData);
			}

			if (result.success) {
				await loadRules();
				setEditingRule(null);
			} else {
				setError(result.error || 'Failed to save rule');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save rule');
		}
	};

	const handleDeleteRule = async (id: number) => {
		if (!confirm('Are you sure you want to delete this rule?')) {
			return;
		}

		try {
			setError(null);
			const api = (window as any)[preloadApiKeys.deleteBusinessUnitRule];
			const result = await api(id);
			if (result.success) {
				await loadRules();
			} else {
				setError(result.error || 'Failed to delete rule');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete rule');
		}
	};

	const handleTestRules = async () => {
		if (!testText.trim()) return;

		try {
			setError(null);
			const results = new Map<number, boolean>();

			// Test each rule individually
			const api = (window as any)[preloadApiKeys.testBusinessUnitPattern];
			for (const rule of rules.filter(r => r.active)) {
				const result = await api(rule.pattern, testText, rule.patternType);
				if (result.success) {
					results.set(rule.id, result.data);
				}
			}

			setTestResults(results);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to test rules');
		}
	};

	const handleToggleActive = async (rule: BusinessUnitRule) => {
		try {
			setError(null);
			const api = (window as any)[preloadApiKeys.updateBusinessUnitRule];
			const result = await api(rule.id, { active: !rule.active });
			if (result.success) {
				await loadRules();
			} else {
				setError(result.error || 'Failed to update rule');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update rule');
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-7xl mx-auto">
					<div className="bg-white rounded-lg shadow-md p-6">
						<div className="text-center py-12">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
							<p className="text-gray-500">Loading business unit rules...</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-800 mb-6">Business Unit Rules Configuration</h1>

				{/* Explanation Section */}
				<div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm mb-6 p-6">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div className="ml-3">
							<h3 className="text-lg font-semibold text-blue-900 mb-2">How Business Unit Detection Works</h3>
							<div className="text-sm text-blue-800 space-y-2">
								<p>
									Rules are evaluated in <strong>priority order</strong> (lowest number first).
									The first matching rule determines the business unit.
								</p>
								<p>
									<strong>Unmatched values:</strong> If no rule matches the application text,
									the system will assign <span className="font-mono bg-yellow-100 px-2 py-0.5 rounded">UNKNOWN</span> as the business unit.
									Consider creating catch-all rules with lower priority if needed.
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

				{/* Test Section */}
				<div className="bg-white rounded-lg shadow-md mb-6">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-xl font-semibold text-gray-800">Test Rules</h2>
						<p className="text-sm text-gray-600 mt-1">
							Enter sample text to see which business unit would be detected
						</p>
					</div>
					<div className="p-6">
						<div className="flex gap-2 mb-4">
							<input
								type="text"
								value={testText}
								onChange={(e) => setTestText(e.target.value)}
								placeholder="Enter application text to test... (e.g., 'Somos Belcorp 2.0')"
								className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<button
								onClick={handleTestRules}
								disabled={!testText.trim()}
								className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
							>
								Test Rules
							</button>
						</div>
						{testResults.size > 0 && (
							<div className="bg-gray-50 border border-gray-200 rounded-md p-4">
								<div className="text-sm font-medium text-gray-700 mb-1">Detected Business Unit:</div>
								<div className="text-lg font-semibold text-gray-900">
									{rules.find(r => testResults.get(r.id))?.businessUnit ||
										<span className="text-yellow-600">UNKNOWN</span>
									}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Rules Management Section */}
				<div className="bg-white rounded-lg shadow-md">
					<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
						<div>
							<h2 className="text-xl font-semibold text-gray-800">Business Unit Rules</h2>
							<p className="text-sm text-gray-600 mt-1">{rules.length} rules configured</p>
						</div>
						<button
							onClick={() => setEditingRule({
								businessUnit: '',
								pattern: '',
								patternType: 'contains',
								priority: rules.length,
								active: true
							})}
							className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
						>
							+ Add New Rule
						</button>
					</div>

					<div className="p-6">
						{rules.length === 0 ? (
							<div className="text-center py-12">
								<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								<h3 className="mt-2 text-sm font-medium text-gray-900">No rules configured</h3>
								<p className="mt-1 text-sm text-gray-500">Get started by creating a new business unit rule.</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Unit</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
											<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{rules.map((rule) => (
											<tr key={rule.id} className={!rule.active ? 'opacity-50' : ''}>
												<td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
													{rule.priority}
												</td>
												<td className="px-4 py-4 whitespace-nowrap">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
														{rule.businessUnit}
													</span>
												</td>
												<td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate" title={rule.pattern}>
													{rule.pattern}
												</td>
												<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
													<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
														{rule.patternType}
													</span>
												</td>
												<td className="px-4 py-4 whitespace-nowrap">
													<button
														onClick={() => handleToggleActive(rule)}
														className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
															rule.active
																? 'bg-green-100 text-green-800 hover:bg-green-200'
																: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
														} transition-colors`}
													>
														{rule.active ? 'Active' : 'Inactive'}
													</button>
												</td>
												<td className="px-4 py-4 whitespace-nowrap text-sm">
													{testResults.has(rule.id) && (
														testResults.get(rule.id) ? (
															<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
																✓ Match
															</span>
														) : (
															<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
																No match
															</span>
														)
													)}
												</td>
												<td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
													<button
														onClick={() => setEditingRule(rule)}
														className="text-blue-600 hover:text-blue-900 mr-3"
													>
														Edit
													</button>
													<button
														onClick={() => handleDeleteRule(rule.id)}
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
			{editingRule && (
				<BusinessUnitRuleEditDialog
					rule={editingRule}
					onSave={handleSaveRule}
					onCancel={() => setEditingRule(null)}
				/>
			)}
		</div>
	);
}