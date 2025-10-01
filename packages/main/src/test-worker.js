#!/usr/bin/env node

/**
 * Simple test worker to check if the environment works
 */

console.log("[Test Worker] Starting test worker...");

process.on("message", (message) => {
	console.log("[Test Worker] Received message:", message);

	if (message.type === "test") {
		process.send?.({ type: "response", message: "Worker is working!" });
	}
});

console.log("[Test Worker] Test worker ready");
