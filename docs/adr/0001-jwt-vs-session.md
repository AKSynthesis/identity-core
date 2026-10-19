# 0001. Token strategy: short-lived JWT access tokens + rotating refresh tokens

## Status

Proposed

## Context

identity-core must authenticate users for other services in system-design-hub.
Those services need to verify identity without calling identity-core on every
request, but we also need to be able to revoke access (logout, compromised
account, password change).

Options considered:

1. **Server-side sessions only** (opaque session ID, state in Redis).
   Simple, instantly revocable, but every service must query shared state.
2. **JWT only** (stateless). Services verify locally, but a token cannot be
   revoked before it expires.
3. **Hybrid**: short-lived JWT access token + long-lived opaque refresh token
   stored server-side.

## Decision

Option 3.

- Access token: JWT, 15 minutes, signed with an asymmetric key (EdDSA or
  ES256) so other services verify with the public key and never hold a secret.
- Refresh token: random opaque value, 7 days, stored **hashed** in Redis/Postgres,
  rotated on every use. Reuse of an old refresh token revokes the whole
  token family (theft detection).

## Consequences

- Other services verify access tokens with no network call.
- Revocation window is bounded to 15 minutes, and immediate for refresh.

* More moving parts than plain sessions (rotation, family tracking).
* Needs signing-key management and a JWKS endpoint for key rotation.
* Domain layer must model `RefreshTokenFamily`, not just `Session`.
