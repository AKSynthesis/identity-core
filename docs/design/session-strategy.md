# Session strategy

Rationale lives in [ADR 0001](../adr/0001-jwt-vs-session.md). This doc
holds the operational parameters.

| Item          | Value                                          | Storage           |
| ------------- | ---------------------------------------------- | ----------------- |
| Access token  | JWT, 15 min, EdDSA/ES256                       | none (stateless)  |
| Refresh token | opaque 256-bit random, 7 days, rotated per use | Redis, **hashed** |
| MFA token     | JWT, 5 min, single purpose                     | none              |
| Token family  | one per login, revoked as a unit               | Redis             |

## Open questions

- Absolute session lifetime (force re-login after 30 days even with rotation?)
- Signing key rotation: publish keys at `/.well-known/jwks.json`, keep the
  previous key valid for one access-token lifetime.
