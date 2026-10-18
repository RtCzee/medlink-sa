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
  | "CONFLICT"
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
