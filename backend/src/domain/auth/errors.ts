/**
 * Indicates that the supplied authentication credentials are invalid.
 *
 * Use a generic message to avoid revealing whether the email
 * or password was incorrect.
 */
export class InvalidCredentialsError extends Error {
    override readonly name = 'InvalidCredentialsError';
    constructor() {
    super('Invalid credentials');
  }
}

/**
 * Indicates that a refresh token is invalid, expired, or otherwise
 * cannot be used to renew an authentication session.
 */
export class InvalidRefreshTokenError extends Error {
  override readonly name = 'InvalidRefreshTokenError';
  constructor() {
    super('Invalid refresh token');
  }
}

/**
 * Indicates that a refresh token was reused after it had already
 * been rotated or invalidated.
 *
 * May signal token theft and require revoking the associated
 * refresh-token family, depending on the session design.
 */
export class RefreshTokenReuseError extends Error {
  override readonly name = 'RefreshTokenReuseError';
  constructor() {
    super('Refresh token reuse detected');
  }
}