import { DateTime } from "luxon";
import type { DateRangeConfig } from "./date-range-config.js";
import { DATA_QUALITY_RULES, COMMON_FIELD_VALUES } from "./monthly-report-data-quality-rules.js";

export class MonthlyReportRecord {
	constructor(
		public readonly requestId: string,
		public readonly applications: string,
		public readonly categorization: string | null,
		public readonly requestIdLink: string | null,
		public readonly createdTime: string,
		public readonly requestStatus: string,
		public readonly module: string,
		public readonly subject: string,
		public readonly subjectLink: string | null,
		public readonly priority: string | null,
		public readonly priorityReporte: string | null,
		public readonly eta: string | null,
		public readonly additionalInfo: string | null,
		public readonly resolvedTime: string | null,
		public readonly affectedCountries: string | null,
		public readonly recurrence: string | null,
		public readonly recurrenceComputed: string | null,
		public readonly technician: string | null,
		public readonly jira: string | null,
		public readonly problemId: string | null,
		public readonly problemIdLink: string | null,
		public readonly linkedRequestId: string | null,
		public readonly linkedRequestIdLink: string | null,
		public readonly requestOLAStatus: string | null,
		public readonly escalationGroup: string | null,
		public readonly affectedApplications: string | null,
		public readonly shouldResolveLevel1: string | null,
		public readonly campaign: string | null,
		public readonly cuv1: string | null,
		public readonly release: string | null,
		public readonly rca: string | null,
		// Computed fields
		public readonly businessUnit: string,
		public readonly inDateRange: boolean,
		public readonly rep: string,
		public readonly dia: number,
		public readonly week: number,
		public readonly requestStatusReporte: string,
		public readonly informacionAdicionalReporte: string | null,
		public readonly enlaces: number,
		public readonly mensaje: string,
		public readonly observations: string | null,
		public readonly statusModifiedByUser: boolean = false,
		// Display name mappings (for Weekly Evolution only)
		public readonly moduleDisplayName?: string | null,
		public readonly categorizationDisplayName?: string | null,
		// Metadata
		public readonly createdAt?: Date,
		public readonly updatedAt?: Date
	) {}

	static create(data: {
		requestId: string;
		applications: string;
		categorization: string | null;
		requestIdLink: string | null;
		createdTime: string;
		requestStatus: string;
		module: string;
		subject: string;
		subjectLink: string | null;
		priority: string | null;
		eta: string | null;
		additionalInfo: string | null;
		resolvedTime: string | null;
		affectedCountries: string | null;
		recurrence: string | null;
		technician: string | null;
		jira: string | null;
		problemId: string | null;
		problemIdLink: string | null;
		linkedRequestId: string | null;
		linkedRequestIdLink: string | null;
		requestOLAStatus: string | null;
		escalationGroup: string | null;
		affectedApplications: string | null;
		shouldResolveLevel1: string | null;
		campaign: string | null;
		cuv1: string | null;
		release: string | null;
		rca: string | null;
		enlaces?: number;
		dateRangeConfig?: DateRangeConfig; // Optional custom date range for Semanal calculation
		requestStatusReporte?: string; // Optional pre-mapped status (from MonthlyReportStatusMappingService)
	}): MonthlyReportRecord {
		// Derive business unit from applications
		const businessUnit = this.deriveBusinessUnit(data.applications);

		// Extract rep (simplified business unit code)
		const rep = this.extractRep(data.applications);

		// Parse date and extract computed fields
		const dateTime = this.parseDateTime(data.createdTime);
		const inDateRange = data.dateRangeConfig
			? data.dateRangeConfig.isDateInRange(dateTime)
			: this.isCurrentWeek(dateTime); // Fallback to old logic if no range provided
		const dia = dateTime.day;
		const week = dateTime.weekNumber;

		// Map request status for reporting (use provided value or calculate it)
		const requestStatusReporte = data.requestStatusReporte ?? this.mapRequestStatus(data.requestStatus);

		// Map priority to English
		const priorityReporte = this.mapPriority(data.priority);

		// Validate and set informacionAdicionalReporte
		const informacionAdicionalReporte = this.validateAdditionalInfo(
			data.additionalInfo,
			requestStatusReporte
		);

		// Compute recurrence based on linkedRequestId
		const recurrenceComputed = this.computeRecurrence(data.linkedRequestId, data.recurrence);

		// Compute observations based on data quality rules
		const observations = this.computeObservations(requestStatusReporte, informacionAdicionalReporte, data.categorization);

		// Create mensaje
		const enlaces = data.enlaces ?? 0;
		const mensaje = this.createMensaje(data.linkedRequestId, enlaces, requestStatusReporte);

		return new MonthlyReportRecord(
			data.requestId,
			data.applications,
			data.categorization,
			data.requestIdLink,
			data.createdTime,
			data.requestStatus,
			data.module,
			data.subject,
			data.subjectLink,
			data.priority,
			priorityReporte,
			data.eta,
			data.additionalInfo,
			data.resolvedTime,
			data.affectedCountries,
			data.recurrence,
			recurrenceComputed,
			data.technician,
			data.jira,
			data.problemId,
			data.problemIdLink,
			data.linkedRequestId,
			data.linkedRequestIdLink,
			data.requestOLAStatus,
			data.escalationGroup,
			data.affectedApplications,
			data.shouldResolveLevel1,
			data.campaign,
			data.cuv1,
			data.release,
			data.rca,
			businessUnit,
			inDateRange,
			rep,
			dia,
			week,
			requestStatusReporte,
			informacionAdicionalReporte,
			enlaces,
			mensaje,
			observations,
			false
		);
	}

	/**
	 * Factory method for creating MonthlyReportRecord from database records.
	 * This method trusts all pre-computed values from the database and does not recalculate them.
	 * Use this when loading existing records from the database.
	 */
	static fromDatabase(data: {
		requestId: string;
		applications: string;
		categorization: string | null;
		requestIdLink: string | null;
		createdTime: string;
		requestStatus: string;
		module: string;
		subject: string;
		subjectLink: string | null;
		priority: string | null;
		eta: string | null;
		additionalInfo: string | null;
		resolvedTime: string | null;
		affectedCountries: string | null;
		recurrence: string | null;
		recurrenceComputed: string | null;
		technician: string | null;
		jira: string | null;
		problemId: string | null;
		problemIdLink: string | null;
		linkedRequestId: string | null;
		linkedRequestIdLink: string | null;
		requestOLAStatus: string | null;
		escalationGroup: string | null;
		affectedApplications: string | null;
		shouldResolveLevel1: string | null;
		campaign: string | null;
		cuv1: string | null;
		release: string | null;
		rca: string | null;
		businessUnit: string;
		inDateRange: boolean;
		rep: string;
		dia: number;
		week: number;
		priorityReporte: string | null;
		requestStatusReporte: string;
		informacionAdicionalReporte: string | null;
		enlaces: number;
		mensaje: string;
		observations: string | null;
		statusModifiedByUser: boolean;
		moduleDisplayName?: string | null;
		categorizationDisplayName?: string | null;
	}): MonthlyReportRecord {
		return new MonthlyReportRecord(
			data.requestId,
			data.applications,
			data.categorization,
			data.requestIdLink,
			data.createdTime,
			data.requestStatus,
			data.module,
			data.subject,
			data.subjectLink,
			data.priority,
			data.priorityReporte,
			data.eta,
			data.additionalInfo,
			data.resolvedTime,
			data.affectedCountries,
			data.recurrence,
			data.recurrenceComputed,
			data.technician,
			data.jira,
			data.problemId,
			data.problemIdLink,
			data.linkedRequestId,
			data.linkedRequestIdLink,
			data.requestOLAStatus,
			data.escalationGroup,
			data.affectedApplications,
			data.shouldResolveLevel1,
			data.campaign,
			data.cuv1,
			data.release,
			data.rca,
			data.businessUnit,
			data.inDateRange,
			data.rep,
			data.dia,
			data.week,
			data.requestStatusReporte,
			data.informacionAdicionalReporte,
			data.enlaces,
			data.mensaje,
			data.observations,
			data.statusModifiedByUser,
			data.moduleDisplayName,
			data.categorizationDisplayName
		);
	}

	private static deriveBusinessUnit(applications: string): string {
		if (!applications) {
			throw new Error("Applications field is required for business unit assignment");
		}

		const apps = applications.toLowerCase();

		// FFVV patterns
		if (
			apps.includes("app - gestiona tu negocio") ||
			apps.includes("app - crecer es ganar") ||
			apps.includes("portal ffvv")
		) {
			return "FFVV";
		}

		// SB patterns
		if (
			apps.includes("somos belcorp 2.0") ||
			apps.includes("app - somos belcorp")
		) {
			return "SB";
		}

		// Unete patterns
		if (apps.includes("unete 3.0")) {
			return "UB-3";
		}
		if (apps.includes("unete 2.0")) {
			return "UN-2";
		}

		// CD pattern
		if (apps.includes("catálogo digital") || apps.includes("catalogo digital")) {
			return "CD";
		}

		// PROL pattern
		if (apps.includes("prol")) {
			return "PROL";
		}

		throw new Error(`Could not derive business unit from applications: ${applications}`);
	}

	private static extractRep(applications: string): string {
		const businessUnit = this.deriveBusinessUnit(applications);
		// Rep is the same as business unit in most cases
		return businessUnit;
	}

	private static parseDateTime(dateTimeStr: string): DateTime {
		// Parse European format: "dd/MM/yyyy HH:mm"
		const dt = DateTime.fromFormat(dateTimeStr, "dd/MM/yyyy HH:mm", {
			zone: "America/Lima", // Belcorp timezone
		});

		if (!dt.isValid) {
			throw new Error(`Invalid date format: ${dateTimeStr}. Expected dd/MM/yyyy HH:mm`);
		}

		return dt;
	}

	private static isCurrentWeek(dateTime: DateTime): boolean {
		const now = DateTime.now().setZone("America/Lima");
		const startOfWeek = now.startOf("week");
		const endOfWeek = now.endOf("week");

		return dateTime >= startOfWeek && dateTime <= endOfWeek;
	}

	private static mapPriority(priority: string | null): string | null {
		if (!priority) return null;

		const priorityMap: Record<string, string> = {
			"Alta": "High",
			"Media": "Medium",
			"Baja": "Low",
			"Crítica": "Critical"
		};

		return priorityMap[priority] || priority;
	}

	private static mapRequestStatus(status: string): string {
		const normalizedStatus = status.toLowerCase().trim();

		// Map to "In L3 Backlog"
		if (
			normalizedStatus === "en mantenimiento correctivo" ||
			normalizedStatus === "dev in progress"
		) {
			return "In L3 Backlog";
		}

		// Keep original for user-modifiable status
		if (normalizedStatus === "esperando el cliente") {
			return status; // Keep original, can be modified by user
		}

		// Map to "On going in L2"
		if (normalizedStatus === "nivel 2") {
			return "On going in L2";
		}

		// Map to "On going in L3"
		if (normalizedStatus === "nivel 3") {
			return "On going in L3";
		}

		// Map to "Closed"
		if (normalizedStatus === "validado" || normalizedStatus === "closed") {
			return "Closed";
		}

		// Default: keep original status
		return status;
	}

	private static validateAdditionalInfo(
		additionalInfo: string | null,
		requestStatusReporte: string
	): string | null {
		// If status maps to "In L3 Backlog", validate additionalInfo
		if (requestStatusReporte === "In L3 Backlog") {
			if (additionalInfo && additionalInfo.toLowerCase() !== COMMON_FIELD_VALUES.NO_ASIGNADO.toLowerCase()) {
				throw new Error(
					`Validation error: When Request Status maps to "In L3 Backlog", ` +
					`Información Adicional must be "${COMMON_FIELD_VALUES.NO_ASIGNADO}" but got: "${additionalInfo}"`
				);
			}
			return COMMON_FIELD_VALUES.NO_ASIGNADO;
		}

		// Otherwise, keep original value
		return additionalInfo;
	}

	private static computeRecurrence(linkedRequestId: string | null, recurrence: string | null): string | null {
		// Only return "Recurrente" if linkedRequestId exists AND is not "No asignado"
		if (linkedRequestId &&
			linkedRequestId.trim() !== "" &&
			linkedRequestId.toLowerCase().trim() !== COMMON_FIELD_VALUES.NO_ASIGNADO.toLowerCase()) {
			return "Recurrente";
		}
		// Otherwise, return original recurrence value
		return recurrence;
	}

	/**
	 * Compute observations based on data quality rules
	 * Returns a concatenated string of all applicable observation descriptions, or null if no issues found
	 */
	private static computeObservations(
		requestStatusReporte: string,
		informacionAdicionalReporte: string | null,
		categorization: string | null
	): string | null {
		const observations: string[] = [];

		// Rule 1: Closed requests must have informacionAdicionalReporte
		if (requestStatusReporte === COMMON_FIELD_VALUES.CLOSED && !informacionAdicionalReporte) {
			observations.push(DATA_QUALITY_RULES.CLOSED_MISSING_ADDITIONAL_INFO.description);
		}

		// Rule 2: Reports should not include "Esperando El Cliente" status
		if (requestStatusReporte === COMMON_FIELD_VALUES.ESPERANDO_EL_CLIENTE) {
			observations.push(DATA_QUALITY_RULES.WAITING_FOR_CLIENT_IN_REPORT.description);
		}

		// Rule 3: All records must have categorization and cannot be "No asignado"
		if (!categorization ||
			categorization.trim() === "" ||
			categorization.toLowerCase().trim() === COMMON_FIELD_VALUES.NO_ASIGNADO.toLowerCase()) {
			observations.push(DATA_QUALITY_RULES.MISSING_OR_UNASSIGNED_CATEGORIZATION.description);
		}

		// Return concatenated observations or null if no issues
		return observations.length > 0 ? observations.join("; ") : null;
	}

	private static createMensaje(linkedRequestId: string | null, enlaces: number, requestStatusReporte: string): string {
		// Check if we have meaningful linkedRequestId and enlaces
		const hasLinkedRequest = linkedRequestId && linkedRequestId.trim() !== "";
		const hasEnlaces = enlaces > 0;

		// If we have either linkedRequestId or enlaces, create the traditional message
		if (hasLinkedRequest || hasEnlaces) {
			const id = linkedRequestId || "N/A";
			return `${id} --> ${enlaces} Linked tickets`;
		}

		// Otherwise, return empty string (no fallback in backend)
		return "";
	}

	// Method to update status (for user modifications)
	updateStatus(newStatus: string): MonthlyReportRecord {
		if (this.requestStatus.toLowerCase() !== "esperando el cliente") {
			throw new Error("Only 'Esperando El Cliente' status can be modified");
		}

		return new MonthlyReportRecord(
			this.requestId,
			this.applications,
			this.categorization,
			this.requestIdLink,
			this.createdTime,
			this.requestStatus,
			this.module,
			this.subject,
			this.subjectLink,
			this.priority,
			this.priorityReporte,
			this.eta,
			this.additionalInfo,
			this.resolvedTime,
			this.affectedCountries,
			this.recurrence,
			this.recurrenceComputed,
			this.technician,
			this.jira,
			this.problemId,
			this.problemIdLink,
			this.linkedRequestId,
			this.linkedRequestIdLink,
			this.requestOLAStatus,
			this.escalationGroup,
			this.affectedApplications,
			this.shouldResolveLevel1,
			this.campaign,
			this.cuv1,
			this.release,
			this.rca,
			this.businessUnit,
			this.inDateRange,
			this.rep,
			this.dia,
			this.week,
			newStatus, // Updated status
			this.informacionAdicionalReporte,
			this.enlaces,
			this.mensaje,
			this.observations,
			true, // Mark as modified by user
			this.moduleDisplayName,
			this.categorizationDisplayName,
			this.createdAt,
			new Date()
		);
	}
}