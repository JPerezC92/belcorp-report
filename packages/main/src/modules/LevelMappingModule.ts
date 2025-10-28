import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { SqlJsLevelMappingRepository } from "./monthly-report/SqlJsLevelMappingRepository.js";
import { LevelMappingService } from "./monthly-report/LevelMappingService.js";
import { ServiceRegistry } from "../services/ServiceRegistry.js";

export class LevelMappingModule implements AppModule {
	async enable(_context: ModuleContext): Promise<void> {
		console.log("🔧 Initializing Level Mapping Module");

		// Create repository and service
		const repository = new SqlJsLevelMappingRepository();
		const levelMappingService = new LevelMappingService(repository);

		// Register service in global registry for use by other modules
		// Note: Mappings will be loaded lazily on first use via mapLevel()
		ServiceRegistry.registerLevelMappingService(levelMappingService);

		console.log("✅ Level Mapping Service initialized and registered");
	}
}

export function createLevelMappingModule(): LevelMappingModule {
	return new LevelMappingModule();
}
