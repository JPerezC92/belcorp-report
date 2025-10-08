import { useState, useEffect } from 'react';
import { getPreloadHandler } from '../constants/preloadHandlers';

interface ModuleCategorizationDisplayRule {
	id: number;
	ruleType: 'module' | 'categorization';
	sourceValue: string;
	displayValue: string;
	patternType: 'exact' | 'contains' | 'regex';
	priority: number;
	active: boolean;
	createdAt: string;
	updatedAt: string;
}

interface ModuleCategorizationDisplayRuleFormData {
	ruleType: 'module' | 'categorization';
	sourceValue: string;
	displayValue: string;
	patternType: 'exact' | 'contains' | 'regex';
	priority: number;
	active: boolean;
}

const ModuleCategorizationDisplayRuleEditDialog = ({
	rule,
	onSave,
	onCancel
}: {
	rule: ModuleCategorizationDisplayRule | ModuleCategorizationDisplayRuleFormData;
	onSave: (rule: ModuleCategorizationDisplayRuleFormData) => void;
	onCancel: () => void;
}) => {
	const [formData, setFormData] = useState<ModuleCategorizationDisplayRuleFormData>({
		ruleType: rule.ruleType,
		sourceValue: rule.sourceValue,
		displayValue: rule.displayValue,
		patternType: rule.patternType,
		priority: rule.priority,
		active: rule.active
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.sourceValue.trim()) {
			newErrors.sourceValue = 'Source value is required';
		}

		if (!formData.displayValue.trim()) {
			newErrors.displayValue = 'Display value is required';
		}

		if (formData.patternType === 'regex') {
			try {
				new RegExp(formData.sourceValue);
			} catch (error) {
				newErrors.sourceValue = 'Invalid regex pattern';
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
					{'id' in rule ? 'Edit Display Rule' : 'Add New Display Rule'}
				</h3>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
						<select
							value={formData.ruleType}
							onChange={(e) => setFormData({...formData, ruleType: e.target.value as 'module' | 'categorization'})}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="module">Module</option>
							<option value="categorization">Categorization</option>
						</select>
						<p className="text-xs text-gray-500 mt-1">
							Choose whether this rule applies to Module or Categorization values
						</p>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Source Value</label>
						<input
							type="text"
							value={formData.sourceValue}
							onChange={(e) => setFormData({...formData, sourceValue: e.target.value})}
							className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.sourceValue ? 'border-red-500' : 'border-gray-300'}`}
							placeholder="e.g., Error de codificación (Bug)"
						/>
						{errors.sourceValue && <p className="text-red-500 text-xs mt-1">{errors.sourceValue}</p>}
						<p className="text-xs text-gray-500 mt-1">
							The original value from the database to match against
						</p>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Display Value</label>
						<input
							type="text"
							value={formData.displayValue}
							onChange={(e) => setFormData({...formData, displayValue: e.target.value})}
							className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.displayValue ? 'border-red-500' : 'border-gray-300'}`}
							placeholder="e.g., Bug"
						/>
						{errors.displayValue && <p className="text-red-500 text-xs mt-1">{errors.displayValue}</p>}
						<p className="text-xs text-gray-500 mt-1">
							The value to display in the Weekly Evolution table
						</p>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Pattern Type</label>
						<select
							value={formData.patternType}
							onChange={(e) => setFormData({...formData, patternType: e.target.value as 'contains' | 'regex' | 'exact'})}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="exact">Exact Match</option>
							<option value="contains">Contains</option>
							<option value="regex">Regex</option>
						</select>
						<p className="text-xs text-gray-500 mt-1">
							Exact: exact match (case-insensitive) | Contains: case-insensitive substring match | Regex: full regex support
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
							className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							Save
						</button>
						<button
							type="button"
							onClick={onCancel}
							className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export const ModuleCategorizationDisplayRulesSettings = () => {
	const [rules, setRules] = useState<ModuleCategorizationDisplayRule[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingRule, setEditingRule] = useState<ModuleCategorizationDisplayRule | ModuleCategorizationDisplayRuleFormData | null>(null);
	const [testPattern, setTestPattern] = useState('');
	const [testText, setTestText] = useState('');
	const [testPatternType, setTestPatternType] = useState<'exact' | 'contains' | 'regex'>('exact');
	const [testResult, setTestResult] = useState<boolean | null>(null);
	const [activeTab, setActiveTab] = useState<'module' | 'categorization'>('module');

	const loadRules = async () => {
		setLoading(true);
		setError(null);
		try {
			const handler = getPreloadHandler('getAllModuleCategorizationDisplayRules');
			const response = (await handler()) as { success: boolean; data: ModuleCategorizationDisplayRule[]; error?: string };
			if (response.success && response.data) {
				setRules(response.data);
			} else {
				setError(response.error || 'Failed to load rules');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load rules');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadRules();
	}, []);

	const handleAddRule = () => {
		setEditingRule({
			ruleType: activeTab,
			sourceValue: '',
			displayValue: '',
			patternType: 'exact',
			priority: rules.length > 0 ? Math.max(...rules.map(r => r.priority)) + 1 : 0,
			active: true
		});
	};

	const handleEditRule = (rule: ModuleCategorizationDisplayRule) => {
		setEditingRule(rule);
	};

	const handleSaveRule = async (formData: ModuleCategorizationDisplayRuleFormData) => {
		try {
			if ('id' in editingRule!) {
				// Update existing rule
				const handler = getPreloadHandler('updateModuleCategorizationDisplayRule');
				const response = (await handler((editingRule as ModuleCategorizationDisplayRule).id, formData)) as { success: boolean; error?: string };
				if (!response.success) {
					throw new Error(response.error || 'Failed to update rule');
				}
			} else {
				// Create new rule
				const handler = getPreloadHandler('createModuleCategorizationDisplayRule');
				const response = (await handler(formData)) as { success: boolean; error?: string };
				if (!response.success) {
					throw new Error(response.error || 'Failed to create rule');
				}
			}
			setEditingRule(null);
			await loadRules();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save rule');
		}
	};

	const handleDeleteRule = async (id: number) => {
		if (!confirm('Are you sure you want to delete this rule?')) {
			return;
		}
		try {
			const handler = getPreloadHandler('deleteModuleCategorizationDisplayRule');
			const response = (await handler(id)) as { success: boolean; error?: string };
			if (!response.success) {
				throw new Error(response.error || 'Failed to delete rule');
			}
			await loadRules();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete rule');
		}
	};

	const handleToggleActive = async (rule: ModuleCategorizationDisplayRule) => {
		try {
			const handler = getPreloadHandler('updateModuleCategorizationDisplayRule');
			const response = (await handler(rule.id, { active: !rule.active })) as { success: boolean; error?: string };
			if (!response.success) {
				throw new Error(response.error || 'Failed to toggle rule');
			}
			await loadRules();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to toggle rule');
		}
	};

	const handleTestPattern = async () => {
		try {
			const handler = getPreloadHandler('testModuleCategorizationDisplayPattern');
			const response = (await handler(testPattern, testText, testPatternType)) as { success: boolean; data: boolean; error?: string };
			if (response.success) {
				setTestResult(response.data);
			} else {
				throw new Error(response.error || 'Failed to test pattern');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to test pattern');
			setTestResult(null);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-lg text-gray-600">Loading display rules...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6 max-w-6xl">
			<div className="bg-white rounded-lg shadow-md p-6 mb-6">
				<div className="flex justify-between items-center mb-6">
					<div>
						<h1 className="text-2xl font-bold text-gray-800">Module/Categorization Display Name Mapping</h1>
						<p className="text-sm text-gray-600 mt-1">
							Configure how module and categorization names are displayed in the Weekly Evolution of Incidents table
						</p>
					</div>
					<button
						onClick={handleAddRule}
						className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						Add Rule
					</button>
				</div>

				{error && (
					<div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
						{error}
						<button
							onClick={() => setError(null)}
							className="float-right text-red-700 hover:text-red-900"
						>
							×
						</button>
					</div>
				)}

				{/* Tabs */}
				<div className="mb-6 border-b border-gray-200">
					<nav className="flex -mb-px">
						<button
							onClick={() => setActiveTab('module')}
							className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'module'
									? 'border-blue-600 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							}`}
						>
							Module Rules ({rules.filter(r => r.ruleType === 'module').length})
						</button>
						<button
							onClick={() => setActiveTab('categorization')}
							className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'categorization'
									? 'border-blue-600 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							}`}
						>
							Categorization Rules ({rules.filter(r => r.ruleType === 'categorization').length})
						</button>
					</nav>
				</div>

				{/* Pattern Tester */}
				<div className="mb-6 p-4 bg-gray-50 rounded-md">
					<h3 className="text-lg font-semibold text-gray-800 mb-3">Pattern Tester</h3>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
						<input
							type="text"
							value={testPattern}
							onChange={(e) => setTestPattern(e.target.value)}
							placeholder="Pattern to test"
							className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<input
							type="text"
							value={testText}
							onChange={(e) => setTestText(e.target.value)}
							placeholder="Text to match against"
							className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<select
							value={testPatternType}
							onChange={(e) => setTestPatternType(e.target.value as 'exact' | 'contains' | 'regex')}
							className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="exact">Exact</option>
							<option value="contains">Contains</option>
							<option value="regex">Regex</option>
						</select>
						<div className="flex gap-2">
							<button
								onClick={handleTestPattern}
								className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
							>
								Test
							</button>
							{testResult !== null && (
								<div className={`flex items-center px-3 py-2 rounded-md ${testResult ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
									{testResult ? '✓ Match' : '✗ No match'}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Rules Table */}
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Value</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Value</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern Type</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{rules.filter(r => r.ruleType === activeTab).length === 0 ? (
								<tr>
									<td colSpan={6} className="px-6 py-4 text-center text-gray-500">
										No {activeTab} display rules configured. Click "Add Rule" to create one.
									</td>
								</tr>
							) : (
								rules.filter(r => r.ruleType === activeTab).map((rule) => (
									<tr key={rule.id} className={!rule.active ? 'bg-gray-50 opacity-60' : ''}>
										<td className="px-6 py-4 text-sm text-gray-900">{rule.sourceValue}</td>
										<td className="px-6 py-4 text-sm font-medium text-gray-900">{rule.displayValue}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											<span className="px-2 py-1 bg-gray-100 rounded text-xs">
												{rule.patternType}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.priority}</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<button
												onClick={() => handleToggleActive(rule)}
												className={`px-2 py-1 rounded-full text-xs font-medium ${rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
											>
												{rule.active ? 'Active' : 'Inactive'}
											</button>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
											<button
												onClick={() => handleEditRule(rule)}
												className="text-blue-600 hover:text-blue-900"
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
								))
							)}
						</tbody>
					</table>
				</div>

				<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
					<h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ How Display Mapping Works</h3>
					<ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
						<li><strong>Module rules</strong> map module names (e.g., "Unete Afiliación" → "Afiliación")</li>
						<li><strong>Categorization rules</strong> map categorization names (e.g., "Error de codificación (Bug)" → "Bug")</li>
						<li>Rules are applied in <strong>priority order</strong> (lower number = higher priority)</li>
						<li>Only <strong>active rules</strong> are used for mapping</li>
						<li>Mappings only affect the <strong>Weekly Evolution of Incidents</strong> table</li>
						<li>All other tables continue to show original values</li>
					</ul>
				</div>
			</div>

			{editingRule && (
				<ModuleCategorizationDisplayRuleEditDialog
					rule={editingRule}
					onSave={handleSaveRule}
					onCancel={() => setEditingRule(null)}
				/>
			)}
		</div>
	);
};
