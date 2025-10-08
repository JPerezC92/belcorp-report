import { createFileRoute } from '@tanstack/react-router';
import { ModuleCategorizationDisplayRulesSettings } from '../components/ModuleCategorizationDisplayRulesSettings';

export const Route = createFileRoute('/module-categorization-display-settings')({
	component: ModuleCategorizationDisplaySettings,
});

function ModuleCategorizationDisplaySettings() {
	return <ModuleCategorizationDisplayRulesSettings />;
}
