# GameVerse security and launch readiness

Updated: 2026-11-18

## Controls present in the player application

- Passwords are stored as scrypt hashes, not plaintext.
- Session tokens are random; only SHA-256 token hashes are stored in the database.
- Session records support revocation, expiry and a 24-hour idle timeout.
- Registration assigns the `player` role on the server. A browser request cannot choose `developer` or `admin`.
- Login and registration use database-backed rate-limit buckets.
- Mutating auth and user-notification routes check the request Origin.
- The separately hosted admin and developer portals use a same-origin server-side API proxy. The browser receives only an HttpOnly portal cookie; the proxy forwards the opaque central session token to the player API. Session tokens are never exposed to page JavaScript or stored in localStorage. The central API checks the exact portal Origin against `ALLOWED_APP_ORIGINS`.
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

Run these SQL files against the `gameverse` database, in order, before enabling account/admin workflows. A manual GitHub Actions workflow is available at **Actions → Apply GameVerse database migrations**. Add the GitHub Actions secret `GAMEVERSE_DATABASE_URL`, take a TiDB backup, then run the workflow and confirm its `backup_confirmed` checkbox. It applies the same files in order and verifies the required tables:

1. `database/schema.sql`
2. `database/migrations/002_developer_uploads.sql`
3. `database/migrations/003_rate_limits.sql`
4. `database/migrations/004_community_moderation.sql`
5. `database/migrations/005_revocable_sessions.sql`
6. `database/migrations/006_admin_bootstrap_audit.sql`

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


## Create the first administrator

There is no default administrator account. First register a normal account at the player site and verify that the email is yours. After applying migration 006 and creating an active player account, open **Actions → Bootstrap first GameVerse administrator**, enter the exact email of that account, and confirm that no active admin exists. The workflow uses the `GAMEVERSE_DATABASE_URL` GitHub secret and does not expose it in the run command. Alternatively, run the one-time CLI from a trusted local environment with the TiDB connection string supplied through the shell environment (never commit it):

```bash
BOOTSTRAP_ADMIN_CONFIRM_EMAIL="your-real-email@example.com" DATABASE_URL="your-TiDB-connection-string" node scripts/bootstrap-admin.mjs "your-real-email@example.com"
```

The script only works when there is no active administrator, requires the confirmation email to match exactly, and upgrades an existing active player account. It does not create a password or a new account. After the first administrator signs in, additional role changes should be made from the admin portal and are recorded in the audit log.

## Configure private upload storage and malware scanning

Developer ZIP uploads are disabled until private R2-compatible object storage and the scanner workflow are configured.

### Render environment variables (player API service)

Set these in Render → GameVerse platform → Environment. Do not paste values into GitHub or chat.

- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `SCAN_WEBHOOK_SECRET` (generate a separate random secret of at least 32 characters)
- `DATABASE_URL` (existing TiDB connection string; retain TLS)

### GitHub Actions repository secrets

In GitHub → gameverse-platform → Settings → Secrets and variables → Actions, add:

- `GAMEVERSE_DATABASE_URL`
- `GAMEVERSE_R2_ENDPOINT`
- `GAMEVERSE_R2_ACCESS_KEY_ID`
- `GAMEVERSE_R2_SECRET_ACCESS_KEY`
- `GAMEVERSE_R2_BUCKET`
- `GAMEVERSE_SCAN_WEBHOOK_SECRET` — must exactly match Render's `SCAN_WEBHOOK_SECRET`.

The scheduled scanner uses ClamAV and archive validation. Run the workflow manually once after all secrets exist, then confirm the job completes and the callback updates the upload's scan status.

### R2 bucket CORS

Keep the bucket private. Add a CORS rule allowing only the developer portal origin:
- Allowed origin: `https://gameverse-developers.onrender.com`
- Allowed method: `PUT`
- Allowed header: `Content-Type`
- Expose header: `ETag`
- Max age: 3600 seconds

Do not add wildcard origins. Keep direct object listing and public bucket access disabled. The browser receives only a short-lived signed PUT URL for the individual quarantine object.

Each portal service also needs these non-secret Render variables:
- Admin service: `GAMEVERSE_API_URL=https://gameverse-platform-drdc.onrender.com`, `PORTAL_ORIGIN=https://gameverse-admin.onrender.com`.
- Developer service: `GAMEVERSE_API_URL=https://gameverse-platform-drdc.onrender.com`, `PORTAL_ORIGIN=https://gameverse-developers.onrender.com`.

The portals now proxy `/api/v1/*` server-side and store the central opaque session token in their own HttpOnly cookie. This avoids relying on third-party browser cookies between separate `onrender.com` subdomains.

