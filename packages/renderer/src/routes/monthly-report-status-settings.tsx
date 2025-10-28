import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { MonthlyReportStatusMappingSettings } from '../components/MonthlyReportStatusMappingSettings';
import { LevelMappingSettings } from '../components/LevelMappingSettings';

export const Route = createFileRoute('/monthly-report-status-settings')({
	component: MonthlyReportStatusSettings,
});

type Tab = 'status-mapping' | 'level-mapping';

function MonthlyReportStatusSettings() {
	const [activeTab, setActiveTab] = useState<Tab>('status-mapping');

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Tabs */}
			<div className="bg-white shadow">
				<div className="container mx-auto px-4">
					<div className="max-w-7xl mx-auto">
						<div className="flex border-b border-gray-200">
							<button
								onClick={() => setActiveTab('status-mapping')}
								className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
									activeTab === 'status-mapping'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								Status Mapping Configuration
							</button>
							<button
								onClick={() => setActiveTab('level-mapping')}
								className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
									activeTab === 'level-mapping'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								Level Mapping Configuration
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Tab Content */}
			<div>
				{activeTab === 'status-mapping' && <MonthlyReportStatusMappingSettings />}
				{activeTab === 'level-mapping' && <LevelMappingSettings />}
			</div>
		</div>
	);
}
