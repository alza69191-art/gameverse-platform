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
