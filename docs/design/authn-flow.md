# Authentication flows

## Login (password)

```mermaid
sequenceDiagram
    participant C as Client
    participant A as identity-core
    participant DB as Postgres
    participant R as Redis
    C->>A: POST /auth/login {email, password}
    A->>A: rate-limit check (per IP + per email)
    A->>DB: find user by email
    A->>A: argon2id verify (same cost even if user not found)
    alt MFA enabled
        A-->>C: 200 {mfaRequired: true, mfaToken (5 min)}
    else no MFA
        A->>R: create refresh token family + first token (hashed)
        A-->>C: 200 {accessToken (JWT, 15m), refreshToken (opaque, 7d)}
    end
```

## Refresh with rotation and reuse detection

```mermaid
sequenceDiagram
    participant C as Client
    participant A as identity-core
    participant R as Redis
    C->>A: POST /auth/refresh {refreshToken}
    A->>R: lookup hash(refreshToken)
    alt token valid and unused
        A->>R: mark used, issue new token in same family
        A-->>C: 200 {new accessToken, new refreshToken}
    else token already used (possible theft)
        A->>R: revoke entire family
        A-->>C: 401
    else unknown or expired
        A-->>C: 401
    end
```

## MFA (TOTP)

1. Login returns `mfaRequired` plus a short-lived `mfaToken` (not an access token).
2. `POST /auth/mfa/verify {mfaToken, code}` checks the TOTP code, then issues the real token pair.
3. Failed codes count toward the same rate limit as passwords.

## Security rules (apply everywhere)

- Login errors are identical for "unknown email" and "wrong password".
- Unknown emails still run a dummy argon2 verification so response time doesn't leak which emails exist.
- Logout revokes the refresh token family.
- Password change or reset revokes all of the user's families.
