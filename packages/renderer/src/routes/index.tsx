import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-800 mb-6">
					Welcome to Belcorp Report
				</h1>

				{/* Introduction Card */}
				<div className="bg-white rounded-lg shadow-md p-6 mb-6">
					<p className="text-gray-700 mb-4">
						This application helps you manage and process Belcorp Excel reports including incident tagging, weekly reports, and monthly analytics.
					</p>
					<p className="text-gray-600 text-sm">
						Use the navigation menu above to access different features.
					</p>
				</div>

				{/* Feature Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Tagging v3 Card */}
					<Link to="/tagging-v3" className="block group">
						<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
							<div className="flex items-center mb-3">
								<svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
								</svg>
								<h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600">
									Tagging v3
								</h2>
							</div>
							<p className="text-gray-600 text-sm">
								Upload and manage TAG reports and For Tagging Data. View request insights and enriched information.
							</p>
						</div>
					</Link>

					{/* Weekly Report Card */}
					<Link to="/weekly-report" className="block group">
						<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
							<div className="flex items-center mb-3">
								<svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								<h2 className="text-xl font-semibold text-gray-800 group-hover:text-green-600">
									Weekly Report
								</h2>
							</div>
							<p className="text-gray-600 text-sm">
								Process weekly corrective maintenance reports. View parent-child relationships and aggregated data.
							</p>
						</div>
					</Link>

					{/* Business Unit Settings Card */}
					<Link to="/business-unit-settings" className="block group">
						<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
							<div className="flex items-center mb-3">
								<svg className="h-6 w-6 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								<h2 className="text-xl font-semibold text-gray-800 group-hover:text-purple-600">
									Business Unit Settings
								</h2>
							</div>
							<p className="text-gray-600 text-sm">
								Configure business unit detection rules with pattern matching and priority settings.
							</p>
						</div>
					</Link>
				</div>
			</div>
		</div>
	);
}
