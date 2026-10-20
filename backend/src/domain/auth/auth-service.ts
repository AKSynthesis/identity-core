import { normalizeEmail, isActive, type User } from '../users/user.js';
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  RefreshTokenReuseError,
} from './errors.js';
import type {
  Clock,
  PasswordHasher,
  RefreshTokenGenerator,
  RefreshTokenStore,
  TokenSigner,
  UserRepository,
} from './ports.js';

/** Contains the credentials issued after successful authentication. */
export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}

/**
 * Dependencies required to execute authentication use cases.
 *
 * Infrastructure implementations are supplied externally, keeping
 * the service independent of specific databases and security libraries.
 */
export interface AuthDeps {
  readonly users: UserRepository;
  readonly hasher: PasswordHasher;
  readonly signer: TokenSigner;
  readonly refreshTokens: RefreshTokenStore;
  readonly tokenGen: RefreshTokenGenerator;
  readonly clock: Clock;
  
  /** Refresh-token lifetime in milliseconds. */
  readonly refreshTtlMs: number;
}

/**
 * Coordinates login and refresh-token rotation.
 *
 * Delegates persistence, password verification, token generation,
 * signing, and timekeeping to injected dependencies.
 */
export class AuthService {
  constructor(private readonly deps: AuthDeps) {}

   /**
   * Authenticates a user and issues an access/refresh token pair.
   *
   * Uses a dummy password verification when the email is unknown
   * to reduce timing differences that could reveal account existence.
   *
   * @throws InvalidCredentialsError when credentials are invalid
   * or the account is disabled.
   */
  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.deps.users.findByEmail(normalizeEmail(email));

    if (user === null) {
      await this.deps.hasher.verifyAgainstDummy(password);
      throw new InvalidCredentialsError();
    }

    const passwordOk = await this.deps.hasher.verify(user.passwordHash, password);
    if (!passwordOk || !isActive(user)) {
      throw new InvalidCredentialsError();
    }

    const familyId = await this.deps.refreshTokens.startFamily(user.id);
    return this.issuePair(user, familyId);
  }

  /**
   * Validates a refresh token and issues a replacement token pair.
   *
   * Consumes the presented token before issuing replacements, preventing
   * the same token from being successfully used more than once.
   *
   * Detected reuse triggers revocation of the associated token family.
   *
   * @throws InvalidRefreshTokenError when the token is invalid or
   * its associated user is missing or disabled.
   * @throws RefreshTokenReuseError when token reuse is detected.
   */
  async refresh(rawToken: string): Promise<TokenPair> {
    const { refreshTokens, users, tokenGen, clock } = this.deps;
    const result = await refreshTokens.consume(tokenGen.hash(rawToken), clock.now());

    switch (result.status) {
      case 'ok': {
        const user = await users.findById(result.userId);
        if (user === null || !isActive(user)) {
          await refreshTokens.revokeFamily(result.familyId);
          throw new InvalidRefreshTokenError();
        }
        return this.issuePair(user, result.familyId);
      }
      case 'reused':
        await refreshTokens.revokeFamily(result.familyId);
        throw new RefreshTokenReuseError();
      default:
        throw new InvalidRefreshTokenError();
    }
  }

  /**
   * Issues a new access token and persists a replacement refresh token.
   *
   * The raw refresh token is returned to the client, while only its
   * hash is persisted. The new token belongs to the existing family.
   */
  private async issuePair(user: User, familyId: string): Promise<TokenPair> {
    const { refreshTokens, tokenGen, signer, clock, refreshTtlMs } = this.deps;
    const { raw, hash } = tokenGen.generate();

    await refreshTokens.insert({
      familyId,
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(clock.now().getTime() + refreshTtlMs),
    });

    const accessToken = await signer.signAccessToken({
      sub: user.id,
      roles: user.roles,
    });
    return { accessToken, refreshToken: raw };
  }
}