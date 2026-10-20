import type { User } from '../users/user.js';

/**
 * Provides access to users required by authentication use cases.
 */
export interface UserRepository {
  findByEmail(normalizedEmail: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}

/**
 * Verifies passwords against stored password hashes.
 */
export interface PasswordHasher {
  verify(hash: string, plain: string): Promise<boolean>;
  
  /**
   * Performs equivalent password-verification work when a user
   * cannot be found, reducing account-enumeration timing leaks.
   */
  verifyAgainstDummy(plain: string): Promise<void>;
}

/** Defines the application-controlled claims included in an access token. */
export interface AccessTokenClaims {
  readonly sub: string;
  readonly roles: readonly string[];
}

/** Provides the ability to sign access tokens. */
export interface TokenSigner {
  signAccessToken(claims: AccessTokenClaims): Promise<string>;
}

/** Defines the data required to persist a newly issued refresh token. */
export interface NewRefreshToken {
  readonly familyId: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
}

/**
 * Describes the outcome of attempting to consume a refresh token.
 *
 * Distinguishes successful consumption, detected reuse, expiration,
 * and tokens that are unknown to the store.
 */
export type ConsumeResult =
  | { readonly status: 'ok'; readonly userId: string; readonly familyId: string }
  | { readonly status: 'reused'; readonly familyId: string }
  | { readonly status: 'expired' | 'unknown' };

/**
 * Manages refresh-token persistence and token-family lifecycle.
 */
export interface RefreshTokenStore {
  /** Creates a refresh-token family for a user and returns its identifier. */
  startFamily(userId: string): Promise<string>;

  /** Persists a newly issued refresh token. */
  insert(token: NewRefreshToken): Promise<void>;
  /**
   * Must be ATOMIC: mark-as-used and read happen in one step, so two
   * concurrent refreshes with the same token can't both succeed.
   */
  consume(tokenHash: string, now: Date): Promise<ConsumeResult>;
    
  /** Revokes all refresh tokens belonging to the specified family. */
  revokeFamily(familyId: string): Promise<void>;
}

/**
 * Generates cryptographically secure refresh tokens and their hashes.
 *
 * The raw token is returned to the client; only its hash should
 * be persisted by the server.
 */
export interface RefreshTokenGenerator {
  generate(): { readonly raw: string; readonly hash: string };
  hash(raw: string): string;
}

/** Provides the current time through an injectable clock. */
export interface Clock {
  now(): Date;
}