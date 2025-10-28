import { CorrectiveMaintenanceRecord } from "@core/modules/weekly-report/domain/corrective-maintenance-record.js";
import type { DateRangeConfig } from "@core/modules/weekly-report/domain/date-range-config.js";
import type { CorrectiveMaintenanceExcelDto } from "@core/modules/weekly-report/infrastructure/dtos/corrective-maintenance-excel.dto.js";

// Type for business unit detection function
export type BusinessUnitDetector = (
	applicationText: string
) => Promise<string> | string;

export async function correctiveMaintenanceDtoToDomain(
	dto: CorrectiveMaintenanceExcelDto,
	detectBusinessUnit?: BusinessUnitDetector,
	dateRangeConfig?: DateRangeConfig | null
): Promise<CorrectiveMaintenanceRecord | null> {
	const requestId = dto["Request ID"].value.trim();

	// Skip rows with empty required fields
	if (!requestId) {
		console.log(
			`[CorrectiveMaintenanceAdapter] Skipping row with empty requestId`
		);
		return null;
	}

	const applications = dto["Aplicativos"].trim();
	console.log(
		`[CorrectiveMaintenanceAdapter] Processing request ${requestId} with applications: "${applications}"`
	);

	// Determine business unit using injected function or fallback to hardcoded logic
	let businessUnit: string;
	if (detectBusinessUnit) {
		businessUnit = await detectBusinessUnit(applications);
		console.log(
			`[CorrectiveMaintenanceAdapter] Assigned business unit: ${businessUnit} (using service)`
		);
	} else {
		// Fallback to hardcoded logic for backward compatibility
		if (
			applications.includes("APP - Gestiona tu Negocio (SE)") ||
			applications.includes("APP - Crecer es Ganar (FFVV)") ||
			applications.includes("Portal FFVV")
		) {
			businessUnit = "FFVV";
		} else if (
			applications.includes("Somos Belcorp 2.0") ||
			applications.includes("APP - SOMOS BELCORP")
		) {
			businessUnit = "SB";
		} else if (applications.includes("Unete 3.0")) {
			businessUnit = "UB-3";
		} else if (applications.includes("Unete 2.0")) {
			businessUnit = "UN-2";
		} else if (applications.includes("Catálogo Digital")) {
			businessUnit = "CD";
		} else if (applications.includes("PROL")) {
			businessUnit = "PROL";
		} else {
			console.warn(
				`[CorrectiveMaintenanceAdapter] Unable to determine business unit for applications: "${applications}". Skipping record ${requestId}.`
			);
			return null;
		}
		console.log(
			`[CorrectiveMaintenanceAdapter] Assigned business unit: ${businessUnit} (using fallback logic)`
		);
	}

	// Skip records with unknown business unit
	if (businessUnit === "UNKNOWN") {
		console.warn(
			`[CorrectiveMaintenanceAdapter] Unknown business unit for applications: "${applications}". Skipping record ${requestId}.`
		);
		return null;
	}

	const requestStatus = dto["Request Status"].trim();
	const priority = dto["Priority"].trim();

	// Map Spanish status values to English
	let mappedRequestStatus = requestStatus;
	switch (requestStatus) {
		case "En Pruebas	":
			mappedRequestStatus = "In Testing";
			break;
		case "En Mantenimiento Correctivo":
		case "Esperando El Cliente":
			mappedRequestStatus = "In L3 Backlog";
			break;
		// Add more mappings as needed for other Spanish status values
		default:
			// Keep original value if no mapping found
			break;
	}

	// Map Spanish priority values to English
	let mappedPriority = priority;
	switch (priority) {
		case "Baja":
			mappedPriority = "Low";
			break;
		case "Alta":
			mappedPriority = "High";
			break;
		case "Media":
			mappedPriority = "Medium";
			break;
		// Add more mappings as needed for other Spanish priority values
		default:
			// Keep original value if no mapping found
			break;
	}

	const createData: {
		requestId: string;
		requestIdLink?: string;
		createdTime: string;
		applications: string;
		categorization: string;
		requestStatus: string;
		module: string;
		subject: string;
		subjectLink?: string;
		priority: string;
		eta: string;
		rca: string;
		businessUnit: string;
	} = {
		requestId,
		subject: dto["Subject"].value.trim(),
		requestStatus: mappedRequestStatus,
		priority: mappedPriority,
		applications,
		businessUnit,
		createdTime: dto["Created Time"].trim(),
		categorization: dto["Categorización"].trim(),
		module: dto["Modulo."].trim(),
		eta: dto["ETA"].trim(),
		rca: dto["RCA"].trim(),
	};

	if (dto["Request ID"].link) {
		createData.requestIdLink = dto["Request ID"].link;
	}

	if (dto["Subject"].link) {
		createData.subjectLink = dto["Subject"].link;
	}

	// Add dateRangeConfig if provided
	const finalData = dateRangeConfig
		? { ...createData, dateRangeConfig }
		: createData;

	return CorrectiveMaintenanceRecord.create(finalData);
}
