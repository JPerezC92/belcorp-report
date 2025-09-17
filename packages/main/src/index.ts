import type { AppInitConfig } from "./AppInitConfig.js";
import { createModuleRunner } from "./ModuleRunner.js";
import { terminateAppOnLastWindowClose } from "./modules/ApplicationTerminatorOnLastWindowClose.js";
import { autoUpdater } from "./modules/AutoUpdater.js";
import { allowInternalOrigins } from "./modules/BlockNotAllowdOrigins.js";
import { initExcelHandlers } from "./modules/ExcelProcessor.js";
import { allowExternalUrls } from "./modules/ExternalUrls.js";
import { hardwareAccelerationMode } from "./modules/HardwareAccelerationModule.js";
import { disallowMultipleAppInstance } from "./modules/SingleInstanceApp.js";
import { createSqlJsDatabaseModule } from "./modules/SqlJsDatabaseModule.js";
import { initTagReportHandlers } from "./modules/TagReportProcessor.js";
import { createWindowManagerModule } from "./modules/WindowManager.js";

export async function initApp(initConfig: AppInitConfig) {
	const moduleRunner = createModuleRunner()
		.init(createSqlJsDatabaseModule()) // Initialize SQL.js SQLite database
		.init(createWindowManagerModule({ initConfig, openDevTools: true })) // Enable dev tools temporarily for debugging
		.init(disallowMultipleAppInstance())
		.init(terminateAppOnLastWindowClose())
		.init(hardwareAccelerationMode({ enable: false }))
		.init(autoUpdater())

		// Install DevTools extension if needed
		// .init(chromeDevToolsExtension({extension: 'VUEJS3_DEVTOOLS'}))

		// Security
		.init(
			allowInternalOrigins(
				new Set(
					initConfig.renderer instanceof URL
						? [initConfig.renderer.origin]
						: []
				)
			)
		)
		.init(
			allowExternalUrls(
				new Set(
					initConfig.renderer instanceof URL
						? [
								"https://vite.dev",
								"https://developer.mozilla.org",
								"https://solidjs.com",
								"https://qwik.dev",
								"https://lit.dev",
								"https://react.dev",
								"https://preactjs.com",
								"https://www.typescriptlang.org",
								"https://vuejs.org",
						  ]
						: []
				)
			)
		);

	// Initialize Excel handlers
	initExcelHandlers();

	// Initialize V2 Excel handlers with enhanced validation
	initTagReportHandlers();

	await moduleRunner;
}
