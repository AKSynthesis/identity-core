# Data model

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : granted
    ROLES ||--o{ ROLE_PERMISSIONS : contains
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : included
    USERS ||--o{ REFRESH_FAMILIES : owns
    REFRESH_FAMILIES ||--o{ REFRESH_TOKENS : contains
    USERS ||--o| MFA_CREDENTIALS : may_have
    USERS ||--o{ ONE_TIME_TOKENS : receives

    USERS {
        uuid id PK
        text email UK "stored lowercase"
        text password_hash "argon2id string"
        boolean email_verified
        timestamptz created_at
        timestamptz disabled_at "null = active"
    }
    ROLES { uuid id PK
            text name UK }
    PERMISSIONS { uuid id PK
                  text name UK "resource:action" }
    USER_ROLES { uuid user_id FK
                 uuid role_id FK }
    ROLE_PERMISSIONS { uuid role_id FK
                       uuid permission_id FK }
    REFRESH_FAMILIES {
        uuid id PK
        uuid user_id FK
        timestamptz created_at
        timestamptz revoked_at
    }
    REFRESH_TOKENS {
        uuid id PK
        uuid family_id FK
        text token_hash UK
        timestamptz expires_at
        timestamptz used_at "set on rotation"
    }
    MFA_CREDENTIALS {
        uuid user_id PK
        text totp_secret_encrypted
        timestamptz enabled_at
    }
    ONE_TIME_TOKENS {
        uuid id PK
        uuid user_id FK
        text type "verify_email | reset_password"
        text token_hash UK
        timestamptz expires_at
        timestamptz used_at
    }
```

## Decisions

- Refresh tokens and one-time tokens are stored as **hashes**, never raw.
- TOTP secrets must be stored **encrypted** (not hashed), because we need
  the original to verify codes. The encryption key comes from config.
- Soft-disable users (`disabled_at`) instead of deleting, to keep audit history.
- Redis is a fast path for refresh lookups, and Postgres is the source of truth.
  Whether to keep refresh tokens in both is a trade-off we settle in Step 5.
