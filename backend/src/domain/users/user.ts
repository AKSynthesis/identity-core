/**
 * Represents a user in the application domain.
 */
export interface User {
  readonly id: string;
  readonly email: string;
    
  /** Cryptographic hash of the user's password, never the raw password. */
  readonly passwordHash: string;
    
  readonly emailVerified: boolean;
  readonly roles: readonly string[];
  readonly disabledAt: Date | null;
}

/**
 * Normalizes an email address for consistent comparison.
 *
 * Trims surrounding whitespace and converts the address to lowercase.
 * Does not validate the email address.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Determines whether a user has been disabled.
 *
 * A user is active if `disabledAt` is null.
 * Email verification and authorization are evaluated separately.
 */
export function isActive(user: User): boolean {
  return user.disabledAt === null;
}