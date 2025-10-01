import { createFileRoute } from '@tanstack/react-router';
import { MonthlyReportStatusMappingSettings } from '../components/MonthlyReportStatusMappingSettings';

export const Route = createFileRoute('/monthly-report-status-settings')({
	component: MonthlyReportStatusSettings,
});

function MonthlyReportStatusSettings() {
	return <MonthlyReportStatusMappingSettings />;
}
