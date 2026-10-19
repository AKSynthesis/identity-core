# 0002. Password hashing: argon2id

## Status

Proposed

## Context

Password hashes will leak eventually. The algorithm must make offline
cracking expensive, including against GPUs.

Options considered: bcrypt, scrypt, argon2id, PBKDF2.

## Decision

argon2id via the `argon2` npm package, starting from the OWASP minimum
(19 MiB memory, 2 iterations, 1 parallelism) and tuned upward until hashing
takes roughly 100-250 ms on our target hardware. Parameters are stored
inside each hash string, so they can be raised later without a migration.

## Consequences

- Memory-hard, which resists GPU/ASIC cracking better than bcrypt.
- Hash strings are self-describing, so upgrading parameters is easy: rehash
  on next successful login when parameters are outdated.

* Native dependency (needs prebuilt binaries or a compiler in Docker).
* Hashing is deliberately slow, so login endpoints need rate limiting (Step 6).
