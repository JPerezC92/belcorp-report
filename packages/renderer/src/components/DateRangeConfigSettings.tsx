import React, { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { preloadApiKeys } from "../constants/preloadApiKeys";
import RangeIndicator from "./RangeIndicator";

interface DateRangeConfig {
	id: number;
	fromDate: string;
	toDate: string;
	description: string;
	isActive: boolean;
	rangeType: 'weekly' | 'custom' | 'disabled';
	scope: 'monthly' | 'corrective' | 'global';
}

interface DateRangeConfigSettingsProps {
	scope: 'monthly' | 'corrective';
	onSettingsChange?: (message: string) => void;
}

const DateRangeConfigSettings: React.FC<DateRangeConfigSettingsProps> = ({
	scope,
	onSettingsChange,
}) => {
	const [currentRange, setCurrentRange] = useState<DateRangeConfig | null>(null);
	const [rangeType, setRangeType] = useState<'weekly' | 'custom' | 'disabled'>('disabled');
	const [formData, setFormData] = useState({
		fromDate: "",
		toDate: "",
		description: "",
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showSettings, setShowSettings] = useState(false);

	// Load current settings on mount or when scope changes
	useEffect(() => {
		loadSettings();
	}, [scope]);

	const loadSettings = async () => {
		setIsLoading(true);
		setError(null);

		try {
			// Load scoped range
			const result = await (window as any)[preloadApiKeys.getDateRangeConfigByScope](scope);
			if (result.success) {
				setCurrentRange(result.data);
				setRangeType(result.data.rangeType);
				setFormData({
					fromDate: result.data.fromDate,
					toDate: result.data.toDate,
					description: result.data.description,
				});
			}
		} catch (err) {
			console.error("Failed to load date range config settings:", err);
			setError("Failed to load settings");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSave = async () => {
		setIsSaving(true);
		setError(null);

		try {
			const saveFunction = scope === 'monthly'
				? (window as any)[preloadApiKeys.saveMonthlyDateRangeConfig]
				: (window as any)[preloadApiKeys.saveCorrectiveDateRangeConfig];

			const result = await saveFunction({
				fromDate: formData.fromDate,
				toDate: formData.toDate,
				description: formData.description,
				rangeType: rangeType,
			});

			if (result.success) {
				setCurrentRange(result.data);
				onSettingsChange?.(result.data.message || "Date range updated successfully");
				setShowSettings(false);
			} else {
				setError(result.error || "Failed to save settings");
			}
		} catch (err) {
			console.error("Failed to save date range config:", err);
			setError("Failed to save settings");
		} finally {
			setIsSaving(false);
		}
	};

	const handleRangeTypeChange = (newType: 'weekly' | 'custom' | 'disabled') => {
		setRangeType(newType);

		if (newType === 'weekly') {
			// Auto-calculate Friday-Thursday range
			const now = DateTime.now().setZone("America/Lima");
			const dayOfWeek = now.weekday;
			let daysToSubtract = dayOfWeek - 4; // Thursday is day 4
			if (daysToSubtract < 0) daysToSubtract += 7;

			const thursday = now.minus({ days: daysToSubtract }).endOf('day');
			const friday = thursday.minus({ days: 6 }).startOf('day');

			setFormData({
				fromDate: friday.toISODate() || "",
				toDate: thursday.toISODate() || "",
				description: `Weekly Range (${scope})`,
			});
		} else if (newType === 'disabled') {
			setFormData({
				fromDate: '2025-01-01',
				toDate: '2025-12-31',
				description: `Disabled (${scope})`,
			});
		}
	};

	const formatDateForDisplay = (dateStr: string) => {
		const date = DateTime.fromISO(dateStr);
		if (!date.isValid) {
			return dateStr;
		}
		return date.toLocaleString({
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}, { locale: 'en-US' });
	};

	const validateDate = (date: string, expectedDay: number) => {
		const dateObj = DateTime.fromISO(date);
		if (!dateObj.isValid) return false;
		return dateObj.weekday === expectedDay;
	};

	const isValidRange = () => {
		if (rangeType === 'disabled') return true;
		if (!formData.fromDate || !formData.toDate) return false;

		if (rangeType === 'weekly') {
			const fromValid = validateDate(formData.fromDate, 5); // Friday
			const toValid = validateDate(formData.toDate, 4); // Thursday
			const fromDate = DateTime.fromISO(formData.fromDate);
			const toDate = DateTime.fromISO(formData.toDate);
			if (!fromDate.isValid || !toDate.isValid) return false;
			return fromValid && toValid && fromDate < toDate;
		}

		// Custom: just check chronological order
		const fromDate = DateTime.fromISO(formData.fromDate);
		const toDate = DateTime.fromISO(formData.toDate);
		if (!fromDate.isValid || !toDate.isValid) return false;
		return fromDate < toDate;
	};

	if (isLoading) {
		return (
			<div className="bg-white p-4 rounded-lg border border-gray-200">
				<div className="animate-pulse">
					<div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
					<div className="h-3 bg-gray-200 rounded w-1/2"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white p-4 rounded-lg border border-gray-200">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-lg font-medium text-gray-900">
						{scope === 'monthly' ? 'Monthly' : 'Corrective'} Date Range
					</h3>
					<p className="text-sm text-gray-500">
						Configure the date range for {scope} calculations
					</p>
				</div>
				<button
					onClick={() => setShowSettings(!showSettings)}
					className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					{showSettings ? "Hide Settings" : "Show Settings"}
				</button>
			</div>

			{/* Current Range Display with Indicator */}
			{currentRange && (
				<div className="mb-4 p-3 bg-blue-50 rounded-md">
					<div className="flex items-center justify-between mb-2">
						<h4 className="text-sm font-medium text-blue-900">Current Range</h4>
						<RangeIndicator
							rangeType={currentRange.rangeType}
							scope={currentRange.scope}
							fromDate={currentRange.fromDate}
							toDate={currentRange.toDate}
						/>
					</div>
					{currentRange.rangeType !== 'disabled' && (
						<>
							<p className="text-sm text-blue-800">
								<strong>From:</strong> {formatDateForDisplay(currentRange.fromDate)}
							</p>
							<p className="text-sm text-blue-800">
								<strong>To:</strong> {formatDateForDisplay(currentRange.toDate)}
							</p>
						</>
					)}
					<p className="text-sm text-blue-800">
						<strong>Description:</strong> {currentRange.description}
					</p>
				</div>
			)}

			{/* Settings Form */}
			{showSettings && (
				<div className="space-y-4">
					{/* Range Type Selector */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Range Type
						</label>
						<div className="grid grid-cols-3 gap-3">
							<button
								onClick={() => handleRangeTypeChange('weekly')}
								className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
									rangeType === 'weekly'
										? 'bg-green-600 text-white border-green-600'
										: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
								}`}
							>
								Weekly (Fri-Thu)
							</button>
							<button
								onClick={() => handleRangeTypeChange('custom')}
								className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
									rangeType === 'custom'
										? 'bg-blue-600 text-white border-blue-600'
										: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
								}`}
							>
								Custom Range
							</button>
							<button
								onClick={() => handleRangeTypeChange('disabled')}
								className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
									rangeType === 'disabled'
										? 'bg-gray-600 text-white border-gray-600'
										: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
								}`}
							>
								Disabled (All)
							</button>
						</div>
					</div>

					{/* Date Inputs - Only show for weekly and custom */}
					{rangeType !== 'disabled' && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label htmlFor="fromDate" className="block text-sm font-medium text-gray-700">
									From Date {rangeType === 'weekly' && '(Must be Friday)'}
								</label>
								<input
									type="date"
									id="fromDate"
									value={formData.fromDate}
									onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
									disabled={rangeType === 'weekly'}
									className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
								/>
								{rangeType === 'weekly' && formData.fromDate && !validateDate(formData.fromDate, 5) && (
									<p className="mt-1 text-sm text-red-600">From date must be a Friday</p>
								)}
							</div>

							<div>
								<label htmlFor="toDate" className="block text-sm font-medium text-gray-700">
									To Date {rangeType === 'weekly' && '(Must be Thursday)'}
								</label>
								<input
									type="date"
									id="toDate"
									value={formData.toDate}
									onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
									disabled={rangeType === 'weekly'}
									className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
								/>
								{rangeType === 'weekly' && formData.toDate && !validateDate(formData.toDate, 4) && (
									<p className="mt-1 text-sm text-red-600">To date must be a Thursday</p>
								)}
							</div>
						</div>
					)}

					{/* Description */}
					<div>
						<label htmlFor="description" className="block text-sm font-medium text-gray-700">
							Description
						</label>
						<input
							type="text"
							id="description"
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							placeholder="e.g., Cut to Thursday"
							maxLength={100}
						/>
					</div>

					{error && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-md">
							<p className="text-sm text-red-600">{error}</p>
						</div>
					)}

					<div className="flex justify-end items-center pt-4 space-x-3">
						<button
							onClick={() => setShowSettings(false)}
							className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							disabled={!isValidRange() || isSaving}
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
						>
							{isSaving ? "Saving..." : "Save Settings"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default DateRangeConfigSettings;
