import React, { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { preloadApiKeys } from "../constants/preloadApiKeys";

interface SemanalDateRange {
	id: number;
	fromDate: string;
	toDate: string;
	description: string;
	isActive: boolean;
}

interface SemanalDateRangeSettingsProps {
	onSettingsChange?: (message: string) => void;
}

const SemanalDateRangeSettings: React.FC<SemanalDateRangeSettingsProps> = ({
	onSettingsChange,
}) => {
	const [currentRange, setCurrentRange] = useState<SemanalDateRange | null>(null);
	const [defaultRange, setDefaultRange] = useState<{ fromDate: string; toDate: string; description: string } | null>(null);
	const [formData, setFormData] = useState({
		fromDate: "",
		toDate: "",
		description: "Cut to Thursday",
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showSettings, setShowSettings] = useState(false);

	// Load current and default settings on mount
	useEffect(() => {
		loadSettings();
	}, []);

	const loadSettings = async () => {
		setIsLoading(true);
		setError(null);

		try {
			// Load current range
			const currentResult = await (window as any)[preloadApiKeys.getSemanalDateRange]();
			if (currentResult.success) {
				setCurrentRange(currentResult.data);
				setFormData({
					fromDate: currentResult.data.fromDate,
					toDate: currentResult.data.toDate,
					description: currentResult.data.description,
				});
			}

			// Load default range
			const defaultResult = await (window as any)[preloadApiKeys.getDefaultSemanalDateRange]();
			if (defaultResult.success) {
				setDefaultRange(defaultResult.data);
			}
		} catch (err) {
			console.error("Failed to load semanal date range settings:", err);
			setError("Failed to load settings");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSave = async () => {
		if (!formData.fromDate || !formData.toDate || !formData.description) {
			setError("All fields are required");
			return;
		}

		setIsSaving(true);
		setError(null);

		try {
			const result = await (window as any)[preloadApiKeys.saveSemanalDateRange](formData);

			if (result.success) {
				setCurrentRange(result.data);
				onSettingsChange?.(result.data.message || "Date range updated successfully");
				setShowSettings(false);
			} else {
				setError(result.error || "Failed to save settings");
			}
		} catch (err) {
			console.error("Failed to save semanal date range:", err);
			setError("Failed to save settings");
		} finally {
			setIsSaving(false);
		}
	};

	const handleUseDefault = () => {
		if (defaultRange) {
			setFormData({
				fromDate: defaultRange.fromDate,
				toDate: defaultRange.toDate,
				description: defaultRange.description,
			});
		}
	};

	const formatDateForDisplay = (dateStr: string) => {
		const date = DateTime.fromISO(dateStr);
		if (!date.isValid) {
			console.warn(`Invalid date for display: ${dateStr}`);
			return dateStr;
		}

		return date.toLocaleString({
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}, { locale: 'es-ES' });
	};

	const validateDate = (date: string, expectedDay: number, dayName: string) => {
		// Parse as ISO date format (YYYY-MM-DD) that comes from HTML date input
		const dateObj = DateTime.fromISO(date);
		if (!dateObj.isValid) {
			console.warn(`Invalid date format: ${date}`);
			return false;
		}

		// Luxon weekday: 1=Monday, 2=Tuesday, ..., 7=Sunday
		// JavaScript getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
		// Convert expectedDay from JS format to Luxon format
		const luxonExpectedDay = expectedDay === 0 ? 7 : expectedDay; // Convert Sunday from 0 to 7

		return dateObj.weekday === luxonExpectedDay;
	};

	const isValidRange = () => {
		if (!formData.fromDate || !formData.toDate) return false;

		const fromValid = validateDate(formData.fromDate, 5, "Friday"); // Friday = 5
		const toValid = validateDate(formData.toDate, 4, "Thursday"); // Thursday = 4

		const fromDate = DateTime.fromISO(formData.fromDate);
		const toDate = DateTime.fromISO(formData.toDate);

		if (!fromDate.isValid || !toDate.isValid) return false;

		const isChronological = fromDate < toDate;

		return fromValid && toValid && isChronological;
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
					<h3 className="text-lg font-medium text-gray-900">Semanal Date Range</h3>
					<p className="text-sm text-gray-500">Configure the date range for Semanal calculations</p>
				</div>
				<button
					onClick={() => setShowSettings(!showSettings)}
					className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					{showSettings ? "Hide Settings" : "Show Settings"}
				</button>
			</div>

			{/* Current Range Display */}
			{currentRange && (
				<div className="mb-4 p-3 bg-blue-50 rounded-md">
					<h4 className="text-sm font-medium text-blue-900 mb-1">Current Range</h4>
					<p className="text-sm text-blue-800">
						<strong>From:</strong> {formatDateForDisplay(currentRange.fromDate)}
					</p>
					<p className="text-sm text-blue-800">
						<strong>To:</strong> {formatDateForDisplay(currentRange.toDate)}
					</p>
					<p className="text-sm text-blue-800">
						<strong>Description:</strong> {currentRange.description}
					</p>
				</div>
			)}

			{/* Settings Form */}
			{showSettings && (
				<div className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label htmlFor="fromDate" className="block text-sm font-medium text-gray-700">
								From Date (Must be Friday)
							</label>
							<input
								type="date"
								id="fromDate"
								value={formData.fromDate}
								onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
								className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
							{formData.fromDate && !validateDate(formData.fromDate, 5, "Friday") && (
								<p className="mt-1 text-sm text-red-600">From date must be a Friday</p>
							)}
						</div>

						<div>
							<label htmlFor="toDate" className="block text-sm font-medium text-gray-700">
								To Date (Must be Thursday)
							</label>
							<input
								type="date"
								id="toDate"
								value={formData.toDate}
								onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
								className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
							{formData.toDate && !validateDate(formData.toDate, 4, "Thursday") && (
								<p className="mt-1 text-sm text-red-600">To date must be a Thursday</p>
							)}
						</div>
					</div>

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

					<div className="flex justify-between items-center pt-4">
						<button
							onClick={handleUseDefault}
							disabled={!defaultRange}
							className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
						>
							Use Default Range
						</button>

						<div className="flex space-x-3">
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
				</div>
			)}
		</div>
	);
};

export default SemanalDateRangeSettings;