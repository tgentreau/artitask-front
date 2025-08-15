export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  errors?: Array<{
    field: string;
    messages: string[];
    value?: any;
  }>;
  context?: any;
  timestamp: string;
  path: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export function isApiErrorResponse(error: any): error is ApiErrorResponse {
  return error &&
    typeof error === 'object' &&
    'statusCode' in error &&
    'error' in error &&
    'message' in error;
}

export function isValidationError(error: ApiErrorResponse): boolean {
  return error.error === 'VALIDATION_ERROR' && Array.isArray(error.errors);
}

export function getErrorMessage(error: any): string {
  if (isApiErrorResponse(error)) {
    if (isValidationError(error) && error.errors?.length) {
      return error.errors
        .map(e => `${e.field}: ${e.messages.join(', ')}`)
        .join('. ');
    }
    return error.message;
  }

  if (error?.error?.message) {
    return error.error.message;
  }

  if (error?.message) {
    return error.message;
  }

  return 'Une erreur inattendue s\'est produite';
}

export function getFieldErrors(error: ApiErrorResponse, field: string): string[] {
  if (!isValidationError(error)) return [];

  const fieldError = error.errors?.find(e => e.field === field);
  return fieldError?.messages || [];
}

export const ERROR_CODES = {
  ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND',
  UNAUTHORIZED_OPERATION: 'UNAUTHORIZED_OPERATION',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  HTTP_ERROR: 'HTTP_ERROR',
  DOMAIN_ERROR: 'DOMAIN_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
