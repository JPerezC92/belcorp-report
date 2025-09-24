// Test functions to verify core package functionality
export function getBackendGreeting(): string {
	return "Hello from Core package! (Backend test)";
}

export function getFrontendGreeting(): string {
	return "Hello from Core package! (Frontend test)";
}

export function getCoreVersion(): string {
	return "Core Package v1.0.0";
}

export function getCurrentTimestamp(): string {
	return `Core package timestamp: ${new Date().toISOString()}`;
}
