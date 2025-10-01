import type { AppInitConfig } from "./AppInitConfig.js";
import { createModuleRunner } from "./ModuleRunner.js";
import { terminateAppOnLastWindowClose } from "./modules/ApplicationTerminatorOnLastWindowClose.js";
import { autoUpdater } from "./modules/AutoUpdater.js";
import { allowInternalOrigins } from "./modules/BlockNotAllowdOrigins.js";
import { createDatabaseModule } from "./modules/DatabaseModule.js";
import { allowExternalUrls } from "./modules/ExternalUrls.js";
import { createForTaggingDataExcelModule } from "./modules/ForTaggingDataExcelModule.js";
import { hardwareAccelerationMode } from "./modules/HardwareAccelerationModule.js";
import { createMonthlyReportModule } from "./modules/MonthlyReportModule.js";
import { disallowMultipleAppInstance } from "./modules/SingleInstanceApp.js";
import { createTagDataModule } from "./modules/TagDataModule.js";
import { createBusinessUnitRulesModule } from "./modules/BusinessUnitRulesModule.js";
import { createMonthlyReportStatusMappingModule } from "./modules/MonthlyReportStatusMappingModule.js";
import { createTranslationModule } from "./modules/TranslationModule.js";
import { createWeeklyReportModule } from "./modules/WeeklyReportModule.js";
import { createWindowManagerModule } from "./modules/WindowManager.js";

export async function initApp(initConfig: AppInitConfig) {
	// Create database module reference
	const databaseModule = createDatabaseModule();

	const businessUnitRulesModule = createBusinessUnitRulesModule();

	const moduleRunner = createModuleRunner()
		.init(databaseModule) // Initialize DatabaseModule with migrations
		.init(businessUnitRulesModule) // Initialize business unit rules management first
		.init(createMonthlyReportStatusMappingModule()) // Initialize monthly report status mapping
		.init(createTranslationModule()) // Initialize translation module
		.init(createTagDataModule()) // Initialize tag data IPC handlers
		.init(createForTaggingDataExcelModule()) // Initialize Excel processing IPC handlers
		.init(createWeeklyReportModule()) // Initialize weekly report IPC handlers
		.init(createMonthlyReportModule()) // Initialize monthly report IPC handlers
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

	await moduleRunner;
}
