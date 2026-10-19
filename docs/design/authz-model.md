# Authorization model

## Decision: RBAC now, ABAC-ready

Users have roles, and roles have permissions. This covers the current
needs (admin, user, support) with the least complexity. Permissions are
checked in the domain layer through a single function, so attribute-based
rules ("only the owner can edit this") can be added later without
touching callers.

## Permission format

`resource:action`, for example `users:read`, `users:update`, `roles:assign`.

## Policy check (domain layer, framework-agnostic)

```ts
can(principal, permission, resource?) -> allow | deny
```

- Default is **deny**.
- `resource` is optional and unused for now. It is the hook where ABAC
  conditions (ownership, tenant) will plug in later.

## JWT claims

| Claim        | Meaning                                    |
| ------------ | ------------------------------------------ |
| `sub`        | user id                                    |
| `roles`      | role names, not permissions                |
| `iss`, `aud` | issuer and audience, verified by consumers |
| `iat`, `exp` | issued-at and expiry (15 min)              |
| `jti`        | token id                                   |

Permissions are resolved from roles at check time. This keeps tokens small
and means a permission change takes effect without waiting for tokens to
expire.

## Initial roles

| Role      | Permissions                            |
| --------- | -------------------------------------- |
| `user`    | `users:read:self`, `users:update:self` |
| `support` | `users:read`                           |
| `admin`   | all, including `roles:assign`          |
