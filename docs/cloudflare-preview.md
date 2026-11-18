# GameVerse Cloudflare Preview

This branch is a parallel Cloudflare Workers deployment setup. It does not replace or modify the Render production service.

## Branch safety
- Keep Render production on `main`.
- Cloudflare preview uses the Worker name `gameverse-platform-preview`.
- Do not merge this branch into `main` until Cloudflare preview has passed functional checks.

## Cloudflare setup
1. Connect the GitHub repository to Cloudflare Workers Builds and select branch `cloudflare-preview`.
2. Use Node.js 22.12 or newer for the build environment.
3. Build command: `npm install && npm run deploy`.
4. Set the required secrets as Worker secrets/environment variables in Cloudflare. Never commit them:
   - `DATABASE_URL` (existing TiDB MySQL-compatible connection string; retain TLS)
   - `SESSION_SECRET`
   - `R2_ENDPOINT`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET`
   - `SCAN_WEBHOOK_SECRET` (only if the scanner is enabled)
   - `ALLOWED_APP_ORIGINS` (include the preview Worker origin and the existing admin/developer app origins)
5. Verify database connectivity, authentication, admin APIs, uploads to R2, downloads, and all major pages before using the preview.

## Database
The application currently uses `mysql2` and `DATABASE_URL`. Cloudflare Hyperdrive is the recommended route for MySQL. Configure a Hyperdrive binding after the Cloudflare account is connected; do not paste database credentials into GitHub. The existing database must remain unchanged during preview.

## Local preview
- `npm install`
- `npm run preview`

No deployment is performed by these documentation changes alone. Render remains untouched.
