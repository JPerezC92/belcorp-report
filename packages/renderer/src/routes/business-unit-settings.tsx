import { createFileRoute } from '@tanstack/react-router';
import { BusinessUnitRulesSettings } from '../components/BusinessUnitRulesSettings';

export const Route = createFileRoute('/business-unit-settings')({
	component: BusinessUnitSettings,
});

function BusinessUnitSettings() {
	return <BusinessUnitRulesSettings />;
}