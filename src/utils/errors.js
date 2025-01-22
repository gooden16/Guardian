export class AuthError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.originalError = originalError;
  }
}

export const ErrorCodes = {
  // Session errors
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_INVALID: 'SESSION_INVALID',
  
  // Profile errors
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  PROFILE_CREATE_FAILED: 'PROFILE_CREATE_FAILED',
  PROFILE_UPDATE_FAILED: 'PROFILE_UPDATE_FAILED',
  
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_NETWORK_ERROR: 'AUTH_NETWORK_ERROR',
  AUTH_UNKNOWN_ERROR: 'AUTH_UNKNOWN_ERROR'
};

export function getErrorMessage(code) {
  const messages = {
    [ErrorCodes.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
    [ErrorCodes.SESSION_INVALID]: 'Invalid session. Please sign in again.',
    [ErrorCodes.PROFILE_NOT_FOUND]: 'User profile not found.',
    [ErrorCodes.PROFILE_CREATE_FAILED]: 'Failed to create user profile.',
    [ErrorCodes.PROFILE_UPDATE_FAILED]: 'Failed to update user profile.',
    [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid credentials. Please check your email and password.',
    [ErrorCodes.AUTH_NETWORK_ERROR]: 'Network error. Please check your connection.',
    [ErrorCodes.AUTH_UNKNOWN_ERROR]: 'An unknown error occurred. Please try again.'
  };
  
  return messages[code] || 'An error occurred.';
}
