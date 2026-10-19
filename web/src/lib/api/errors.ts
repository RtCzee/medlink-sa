// Typed API errors. Anything thrown that is NOT an ApiError becomes a generic 500.

export type ApiErrorCode =
  | "INVALID_JSON"
  | "INVALID_BODY"
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "PROFILE_NOT_FOUND"
  | "SETTINGS_NOT_FOUND"
  | "FACILITY_NOT_FOUND"
  | "PRACTITIONER_NOT_FOUND"
  | "APPOINTMENT_NOT_FOUND"
  | "MEDICAL_RECORD_NOT_FOUND"
  | "QUEUE_TICKET_NOT_FOUND"
  | "QUEUE_TICKET_ACTIVE"
  | "QUEUE_TICKET_NOT_LEAVABLE"
  | "PRESCRIPTION_NOT_FOUND"
  | "MEDICINE_NOT_FOUND"
  | "CONFLICT"
  | "APPOINTMENT_CONFLICT"
  | "APPOINTMENT_NOT_EDITABLE"
  | "APPOINTMENT_NOT_CANCELLABLE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

export type ApiIssue = {
  path: string;
  code: string;
  message: string;
  keys?: string[];
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: ApiIssue[];
  readonly headers?: Record<string, string>;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    options: { details?: ApiIssue[]; headers?: Record<string, string> } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = options.details;
    this.headers = options.headers;
  }
}

export const unauthenticated = (message = "Sign in to continue.") =>
  new ApiError(401, "UNAUTHENTICATED", message);

export const forbidden = (message = "You don't have permission to do that.") =>
  new ApiError(403, "FORBIDDEN", message);

export const profileNotFound = () =>
  new ApiError(
    404,
    "PROFILE_NOT_FOUND",
    "Your profile could not be found. It is created when you register; contact support if this persists."
  );

export const settingsNotFound = () =>
  new ApiError(
    404,
    "SETTINGS_NOT_FOUND",
    "Your settings could not be found. They are created when you register; contact support if this persists."
  );

export const facilityNotFound = () =>
  new ApiError(404, "FACILITY_NOT_FOUND", "No facility exists with that id.");

export const practitionerNotFound = () =>
  new ApiError(404, "PRACTITIONER_NOT_FOUND", "No practitioner exists with that id.");

/** Missing OR another patient's appointment: the same 404, so ids can't be probed. */
export const appointmentNotFound = () =>
  new ApiError(404, "APPOINTMENT_NOT_FOUND", "No appointment with that id was found.");

export const appointmentNotEditable = (message: string) =>
  new ApiError(409, "APPOINTMENT_NOT_EDITABLE", message);

export const appointmentNotCancellable = (message: string) =>
  new ApiError(409, "APPOINTMENT_NOT_CANCELLABLE", message);

/** Missing OR another patient's record: the same 404, so ids can't be probed. */
export const medicalRecordNotFound = () =>
  new ApiError(404, "MEDICAL_RECORD_NOT_FOUND", "No medical record with that id was found.");

/** Missing OR another patient's ticket: the same 404, so ids can't be probed. */
export const queueTicketNotFound = () =>
  new ApiError(404, "QUEUE_TICKET_NOT_FOUND", "No queue ticket with that id was found.");

export const queueTicketActive = () =>
  new ApiError(
    409,
    "QUEUE_TICKET_ACTIVE",
    "You already have an active queue ticket today. Leave it before joining another queue."
  );

export const queueTicketNotLeavable = (message: string) =>
  new ApiError(409, "QUEUE_TICKET_NOT_LEAVABLE", message);

/** Missing OR another patient's prescription: the same 404, so ids can't be probed. */
export const prescriptionNotFound = () =>
  new ApiError(404, "PRESCRIPTION_NOT_FOUND", "No prescription with that id was found.");

export const medicineNotFound = () =>
  new ApiError(404, "MEDICINE_NOT_FOUND", "No medicine exists with that id.");
