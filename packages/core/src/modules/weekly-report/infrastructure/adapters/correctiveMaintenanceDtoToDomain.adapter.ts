import { CorrectiveMaintenanceRecord } from "@core/modules/weekly-report/domain/corrective-maintenance-record.js";
import type { CorrectiveMaintenanceExcelDto } from "@core/modules/weekly-report/infrastructure/dtos/corrective-maintenance-excel.dto.js";

export function correctiveMaintenanceDtoToDomain(
	dto: CorrectiveMaintenanceExcelDto
): CorrectiveMaintenanceRecord | null {
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

	// Determine business unit based on applications - check for substring matches
	let businessUnit: string;
	if (
		applications.includes("APP - Gestiona tu Negocio (SE)") ||
		applications.includes("APP - Crecer es Ganar (FFVV)") ||
		applications.includes("Portal FFVV")
	) {
		businessUnit = "FFVV";
		console.log(
			`[CorrectiveMaintenanceAdapter] Assigned business unit: ${businessUnit} (FFVV match)`
		);
	} else if (
		applications.includes("Somos Belcorp 2.0") ||
		applications.includes("APP - SOMOS BELCORP")
	) {
		businessUnit = "SB";
		console.log(
			`[CorrectiveMaintenanceAdapter] Assigned business unit: ${businessUnit} (SB match)`
		);
	} else if (applications.includes("Unete 3.0")) {
		businessUnit = "UB-3";
		console.log(
			`[CorrectiveMaintenanceAdapter] Assigned business unit: ${businessUnit} (UB-3 match)`
		);
	} else if (applications.includes("Unete 2.0")) {
		businessUnit = "UN-2";
		console.log(
			`[CorrectiveMaintenanceAdapter] Assigned business unit: ${businessUnit} (UN-2 match)`
		);
	} else if (applications.includes("Catálogo Digital")) {
		businessUnit = "CD";
		console.log(
			`[CorrectiveMaintenanceAdapter] Assigned business unit: ${businessUnit} (CD match)`
		);
	} else if (applications.includes("PROL")) {
		businessUnit = "PROL";
		console.log(
			`[CorrectiveMaintenanceAdapter] Assigned business unit: ${businessUnit} (PROL match)`
		);
	} else {
		// Log the unmatched application and skip the record instead of throwing error
		console.warn(
			`[CorrectiveMaintenanceAdapter] Unable to determine business unit for applications: "${applications}". Skipping record ${requestId}.`
		);
		return null;
	}

	const requestStatus = dto["Request Status"].trim();
	const priority = dto["Priority"].trim();

	// Map Spanish status values to English
	let mappedRequestStatus = requestStatus;
	switch (requestStatus) {
		case "En Pruebas":
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

	return CorrectiveMaintenanceRecord.create(createData);
}
