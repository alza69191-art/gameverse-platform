# GameVerse security and launch readiness

Updated: 2026-11-18

## Controls present in the player application

- Passwords are stored as scrypt hashes, not plaintext.
- Session tokens are random; only SHA-256 token hashes are stored in the database.
- Session records support revocation, expiry and a 24-hour idle timeout.
- Registration assigns the `player` role on the server. A browser request cannot choose `developer` or `admin`.
- Login and registration use database-backed rate-limit buckets.
- Mutating auth and user-notification routes check the request Origin.
- API access for the separately hosted admin and developer portals is restricted to an explicit allow-list and uses credentialed CORS. Browser clients must use `credentials: "include"`; never copy session tokens into localStorage.
- Security response headers disable MIME sniffing, restrict framing, set HSTS, and restrict browser permissions.
- Render provides automatic DDoS protection for deployed services and encrypts environment variables/secret files at rest. These platform protections do not replace application controls.

## Render dashboard checklist

For each GameVerse service (player, admin, developer):

1. Open **Environment** and keep all secrets server-side. Never prefix a secret with `NEXT_PUBLIC_`.
2. Confirm `SESSION_SECRET` is at least 32 random characters and identical on services that share the central session database. Rotate it through a coordinated deployment if it may have leaked.
3. Set `ALLOWED_APP_ORIGINS` on the player API to the exact production origins only:
   - `https://gameverse-admin.onrender.com`
   - `https://gameverse-developers.onrender.com`
   Do not use wildcards. Remove any origin that is not actually controlled by GameVerse.
4. Enable two-factor authentication on every Render account with access to production. Workspace owners should enforce 2FA if the workspace plan exposes that control.
5. Keep the production services' IP allow-list public only where required for player traffic. Do not expose database ports publicly.
6. Keep TiDB TLS enabled and restrict Authorized Networks to the current Render egress ranges documented for the deployed service. Recheck these ranges when Render changes its networking.
7. Do not place uploaded game archives on Render's ephemeral filesystem. Use a private object-storage bucket and short-lived signed URLs.
8. Configure alert notifications, review audit events, and rotate any credential that was ever pasted into chat, logs, or source control.

## Database migrations that must be applied to TiDB

Run these SQL files against the `gameverse` database, in order, before enabling account/admin workflows:

1. `database/schema.sql`
2. `database/migrations/002_developer_uploads.sql`
3. `database/migrations/003_rate_limits.sql`
4. `database/migrations/004_community_moderation.sql`
5. `database/migrations/005_revocable_sessions.sql`

The application cannot prove that these migrations have been applied merely because the Render service starts. Confirm the tables exist before accepting registrations:
- `users`
- `user_sessions` (including `last_seen_at`)
- `rate_limit_buckets`
- `developer_applications`
- upload, moderation, favorites, history and notification tables used by their API routes.

## Authentication limitations that remain

- Email ownership verification is not implemented.
- Password reset is not implemented.
- MFA/WebAuthn inside GameVerse is not implemented.
- Login throttling currently depends on TiDB availability; use an edge/WAF rate limit as an additional layer if available.
- A new user is a player; admin role assignment must be a manual, audited operation performed by an existing trusted administrator.
- No default admin account or password is created.

## Game catalogue and rights

GameVerse currently has a curated catalogue of external play/store links and selected open-source projects. It does not have a verified pipeline that imports, scans, hosts and serves thousands of game binaries. Public repository visibility is not proof of rights to redistribute all art, music, fonts or other assets.

Partner catalogues (GameDistribution, GameMonetize and Gamezop) remain pending onboarding and property approval. Do not show their games as approved until a partner account supplies the approved IDs/URLs and terms. No ad-click manipulation, scraping or repackaging is allowed.

## Production release gate

Do not declare the platform production-ready until:
- all SQL migrations have been applied and verified;
- account creation, login, logout, idle expiry and revoked-session tests pass;
- admin and developer portals use credentialed CORS from their exact origins;
- role checks are tested on every admin/developer mutation route;
- email verification and password recovery are implemented or explicitly deferred in the launch policy;
- upload archives are stored privately, scanned in quarantine, and never executed on the web server;
- dependency, secret, static-analysis and penetration tests are reviewed;
- backup/restore and incident response are tested;
- desktop/mobile and cross-browser end-to-end tests pass.
