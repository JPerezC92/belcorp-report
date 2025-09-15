import {
	createHashHistory,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";

// Create hash history for Electron compatibility (works with file:// protocol)
const hashHistory = createHashHistory();

// Create a new router instance with hash history
const router = createRouter({
	routeTree,
	history: hashHistory,
	context: {},
	defaultPreload: false,
	defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Add comprehensive debugging
console.log("=== App Debug Information ===");
console.log("App starting up (Reliable Mode)...");
console.log("Current location:", window.location);
console.log("Protocol:", window.location.protocol);
console.log("Pathname:", window.location.pathname);
console.log("Document ready state:", document.readyState);
console.log("DOM loaded:", document.documentElement ? "Yes" : "No");

// Render the app
const rootElement = document.getElementById("app");
console.log("Root element found:", !!rootElement);
console.log("Root element details:", rootElement);
console.log("Document body children:", document.body?.children?.length || 0);

if (rootElement) {
	try {
		console.log("=== Starting TanStack Router Setup ===");
		console.log("Router configuration:", {
			history: router.history,
			basepath: router.basepath,
			routes: router.routeTree,
		});

		const root = ReactDOM.createRoot(rootElement);
		root.render(<RouterProvider router={router} />);
		console.log("TanStack Router rendered successfully");
	} catch (error) {
		console.error("Router setup failed:", error);
		// Fallback to our working HTML version
		rootElement.innerHTML = `
      <div style="
        background: #282c34;
        color: white;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 600px;
        ">
          <h1 style="font-size: 3rem; margin-bottom: 20px; font-weight: bold;">
            Welcome to Belcorp Report
          </h1>
          <p style="font-size: 1.2rem; margin-bottom: 15px;">
            🎉 Router setup failed, but app is working!
          </p>
          <p style="margin-bottom: 20px;">
            Error: ${error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      </div>
    `;
		console.log("HTML fallback rendered after router failure");
	}
} else {
	console.error("Root element not found");
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
