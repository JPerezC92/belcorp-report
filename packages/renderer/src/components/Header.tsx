import { Link } from "@tanstack/react-router";

export default function Header() {
	return (
		<header className="p-2 flex gap-2 bg-white text-black justify-between">
			<nav className="flex flex-row">
				<div className="px-2 font-bold">
					<Link to="/">Home</Link>
				</div>
				<div className="px-2 font-bold">
					<Link to="/tagging-v3">Tagging v3</Link>
				</div>
				<div className="px-2 font-bold">
					<Link to="/weekly-report">Weekly Report</Link>
				</div>
				<div className="px-2 font-bold">
					<Link to="/business-unit-settings">Business Unit Settings</Link>
			</div>
			<div className="px-2 font-bold">
				<Link to="/monthly-report-status-settings">Status Mapping</Link>
				</div>
			</nav>
		</header>
	);
}
