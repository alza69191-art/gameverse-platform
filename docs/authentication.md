# GameVerse authentication setup

The platform now exposes these account endpoints:

- `POST /api/v1/auth/register` — creates a player account only.
- `POST /api/v1/auth/login` — verifies the password and starts a session.
- `POST /api/v1/auth/logout` — clears the session cookie.
- `GET /api/v1/auth/me` — returns the authenticated account, or `user: null`.

## Required Render setting

Set `SESSION_SECRET` to a cryptographically random value of at least 32 characters. Never put it in source code, a client-side variable, or Git. The session cookie is HttpOnly, SameSite=Lax, and Secure in production.

Passwords are stored as salted scrypt hashes. Registration always assigns the `player` role; privileged roles must only be granted by a trusted administrative process.

## Current security scope

This is the first authentication foundation, not a complete production security certification. Before public launch, add distributed rate limiting, email verification and password reset, CSRF protection for any future cross-site state-changing flows, audit logging, and security tests. Uploaded game files must be stored outside the application filesystem and scanned before review or publication.


## Database rate limiting

Apply `database/migrations/003_rate_limits.sql` in TiDB. Login and registration requests are limited by HMAC-hashed IP/email buckets; raw identifiers are not stored in the rate-limit table. The limits are conservative defaults and should be monitored and adjusted based on abuse patterns.

## Player endpoints

- `GET /api/v1/auth/me` — current session.
- `GET /api/v1/users/me/favorites` — saved games.
- `GET /api/v1/users/me/history` — play history.
- `GET /api/v1/users/me/notifications` — account notifications.
- `POST /api/v1/users/me/notifications` — mark one notification as read.

Apply `database/migrations/004_community_moderation.sql` before using favorites, reviews, comments, reports, play history, notifications or admin audit screens.

## Administrative access

The first administrator is bootstrapped manually in TiDB after creating a player account. Do not add public admin registration. Admin actions are authorized on the server and written to `admin_audit_logs`.


Apply `database/migrations/005_revocable_sessions.sql` before enabling account registration. It stores only SHA-256 hashes of random session tokens and supports server-side logout revocation. New passwords use scrypt with N=2^17, r=8 and p=1; old hashes remain verifiable for migration compatibility.
