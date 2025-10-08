import React, { useState } from "react";

interface GlobalModeToggleProps {
	globalModeEnabled: boolean;
	onToggle: (enabled: boolean) => void;
}

const GlobalModeToggle: React.FC<GlobalModeToggleProps> = ({
	globalModeEnabled,
	onToggle,
}) => {
	const [showConfirmation, setShowConfirmation] = useState(false);

	const handleToggleClick = () => {
		if (!globalModeEnabled) {
			// Enabling global mode - show confirmation
			setShowConfirmation(true);
		} else {
			// Disabling global mode - no confirmation needed
			onToggle(false);
		}
	};

	const handleConfirmEnable = () => {
		setShowConfirmation(false);
		onToggle(true);
	};

	const handleCancelEnable = () => {
		setShowConfirmation(false);
	};

	return (
		<div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<h3 className="text-sm font-semibold text-gray-900">
						Global Date Range Mode
					</h3>
					<p className="text-xs text-gray-600 mt-1">
						{globalModeEnabled
							? "Both tabs use the same date range configuration"
							: "Each tab has independent date range configurations"}
					</p>
				</div>

				<button
					onClick={handleToggleClick}
					className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
						globalModeEnabled ? "bg-blue-600" : "bg-gray-200"
					}`}
				>
					<span
						className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
							globalModeEnabled ? "translate-x-6" : "translate-x-1"
						}`}
					/>
				</button>
			</div>

			{/* Confirmation Dialog */}
			{showConfirmation && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
						<div className="p-6">
							<div className="flex items-center gap-3 mb-4">
								<div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
									<svg
										className="w-6 h-6 text-blue-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>
								<h3 className="text-lg font-semibold text-gray-900">
									Enable Global Mode?
								</h3>
							</div>

							<div className="mb-6">
								<p className="text-sm text-gray-700 mb-3">
									When Global Mode is enabled:
								</p>
								<ul className="text-sm text-gray-600 space-y-2 ml-4">
									<li className="flex items-start gap-2">
										<span className="text-blue-600 mt-0.5">•</span>
										<span>
											Both Monthly Report and Corrective Maintenance tabs will
											share the same date range
										</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-blue-600 mt-0.5">•</span>
										<span>
											Changes to the date range in Settings will affect both
											tabs
										</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-blue-600 mt-0.5">•</span>
										<span>
											You'll need to reload Excel files on both tabs when the
											range changes
										</span>
									</li>
								</ul>
							</div>

							<div className="flex gap-3 justify-end">
								<button
									onClick={handleCancelEnable}
									className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
								>
									Cancel
								</button>
								<button
									onClick={handleConfirmEnable}
									className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
								>
									Enable Global Mode
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default GlobalModeToggle;
