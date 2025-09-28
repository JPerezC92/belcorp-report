interface Tab<T extends string> {
	id: T;
	label: string;
}

interface TabNavigationProps<T extends string> {
	tabs: Tab<T>[];
	activeTab: T;
	onTabChange: (tabId: T) => void;
	className?: string;
}

const TabNavigation = <T extends string>({
	tabs,
	activeTab,
	onTabChange,
	className = "",
}: TabNavigationProps<T>) => {
	return (
		<div className={`mb-6 ${className}`}>
			<div className="border-b border-gray-200">
				<nav className="-mb-px flex space-x-8">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => onTabChange(tab.id)}
							className={`py-2 px-1 border-b-2 font-medium text-sm ${
								activeTab === tab.id
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
						>
							{tab.label}
						</button>
					))}
				</nav>
			</div>
		</div>
	);
};

export default TabNavigation;
