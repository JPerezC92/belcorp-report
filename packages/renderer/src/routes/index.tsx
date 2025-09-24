import {
	getCoreVersion,
	getCurrentTimestamp,
	getFrontendGreeting,
} from "@app/core";
import { createFileRoute } from "@tanstack/react-router";
import logo from "../logo.svg";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	// Test core package functions in frontend
	const frontendGreeting = getFrontendGreeting();
	const coreVersion = getCoreVersion();
	const timestamp = getCurrentTimestamp();

	return (
		<div className="text-center">
			<header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
				<img
					src={logo}
					className="h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
					alt="logo"
					onError={(e) => {
						console.error("Logo failed to load:", e);
						// Hide the image if it fails to load
						e.currentTarget.style.display = "none";
					}}
				/>
				<h1 className="text-4xl font-bold mb-4">
					Welcome to Belcorp Report
				</h1>

				{/* Core Package Test Section */}
				<div className="mb-6 p-4 bg-blue-900/50 rounded-lg border border-blue-500">
					<h2 className="text-xl font-semibold mb-3 text-yellow-300">
						🧪 Core Package Test (Frontend)
					</h2>
					<div className="space-y-2 text-sm">
						<p className="text-green-300">✅ {frontendGreeting}</p>
						<p className="text-green-300">📦 {coreVersion}</p>
						<p className="text-green-300">⏰ {timestamp}</p>
					</div>
				</div>

				<p className="mb-4 text-lg">
					🎉 Your Electron app is working correctly with TanStack
					Router!
				</p>
				<p className="mb-4">
					Edit <code>src/routes/index.tsx</code> and save to reload.
				</p>
				<div className="flex flex-col gap-4">
					<a
						className="text-[#61dafb] hover:underline text-lg"
						href="https://reactjs.org"
						target="_blank"
						rel="noopener noreferrer"
					>
						Learn React
					</a>
					<a
						className="text-[#61dafb] hover:underline text-lg"
						href="https://tanstack.com"
						target="_blank"
						rel="noopener noreferrer"
					>
						Learn TanStack Router
					</a>
					<a
						className="text-[#61dafb] hover:underline text-lg"
						href="https://electronjs.org"
						target="_blank"
						rel="noopener noreferrer"
					>
						Learn Electron
					</a>
				</div>
			</header>
		</div>
	);
}
