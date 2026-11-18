# Developer uploads and review pipeline

## Database

Apply `database/migrations/002_developer_uploads.sql` once in the TiDB SQL Editor, using the existing `gameverse` database. Back up the database first. The migration adds developer applications and a quarantine table; it does not replace the eight original tables. Also apply `database/migrations/003_rate_limits.sql` to enable authentication rate limiting and `database/migrations/004_community_moderation.sql` for favorites, ratings, comments, reports, player history, notifications and admin audit logs.

## Cloudflare R2 configuration

Create a **private** R2 bucket. Create an API token scoped to that bucket with Object Read & Write permissions. Add these server-only Render environment variables:

- `R2_ENDPOINT`: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

Do not make the quarantine bucket public. The app issues short-lived presigned PUT URLs; uploaded archives remain private. R2 supports the S3 API, and its free monthly allowance is limited, not unlimited. Check current billing and usage before launch.
Configure bucket CORS to allow the developer portal to upload directly. Example policy (replace the origin if the Render URL changes):

```json
[
  {
    "AllowedOrigins": ["https://gameverse-developers.onrender.com"],
    "AllowedMethods": ["PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "x-amz-*", "authorization"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```


## Current upload contract

1. A logged-in player submits a developer application at `POST /api/v1/developer/apply`.
2. An administrator reviews it at `GET /api/v1/admin/developer-applications` and decides via `POST /api/v1/admin/developer-applications/:id/decision`.
3. Approved developers request a signed upload URL from `POST /api/v1/developer/uploads`. Version 1 accepts ZIP archives up to 200 MiB only.
4. The browser uploads directly to R2 using the returned URL and exact `Content-Type: application/zip` header.
5. The client confirms with `POST /api/v1/developer/uploads/:id/complete`.
6. Developers inspect their uploads at `GET /api/v1/developer/uploads/mine`.
7. Administrators inspect the queue at `GET /api/v1/admin/game-uploads`.

Uploads are stored under a private `quarantine/` key. They are **not playable or downloadable** while quarantined.

## Malware scanning gate — not yet operational

The internal callback `POST /api/v1/internal/scanner-result` accepts `clean`, `infected`, or `error` only when the caller supplies the separate `x-scanner-token` secret. Configure `SCAN_WEBHOOK_SECRET` only after deploying a private scanner worker. The worker must:

- Poll only `upload_status='uploaded' AND scan_status='pending'` records.
- Fetch the object from the private R2 bucket and verify ZIP signature and size.
- Run ClamAV with current signatures; do not treat skipped, encrypted, malformed, oversized, or timed-out archives as clean.
- Enforce archive entry-count, expanded-size, compression-ratio, path traversal, and symlink limits before any extraction.
- Call the callback only after a conclusive result. On worker failure, leave the item blocked or set `error`.
- Never expose its token or database/R2 credentials to the browser.

**No scanner worker is deployed by this change.** Until one is deployed and tested, every upload remains pending scan and the admin API intentionally refuses approval. This fail-closed behavior is deliberate.

## Approval and downloads

An administrator can approve only an uploaded archive whose scan status is `clean`. Approval creates an approved download-only game and version record. The download endpoint `GET /api/v1/games/:slug/download` generates a short-lived signed URL. Browser-playable ZIP extraction/hosting is not implemented by this pipeline; browser games must continue to use reviewed, verified hosted URLs.

## Operational checklist

- Keep the R2 quarantine bucket private and restrict API tokens to that bucket.
- Configure lifecycle deletion for abandoned quarantine objects only after confirming retention requirements.
- Add rate limiting, email verification, password reset, audit logging, and alerting before opening registration broadly.
- Test with benign archives and the EICAR test file in a controlled environment before accepting public uploads.
- Add abuse reporting, takedown, copyright review, and developer terms before public marketplace launch.

## First administrator bootstrap

Create a normal player account through the developer portal registration screen first. Then, in TiDB SQL Editor, promote only that verified account:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'YOUR_VERIFIED_ADMIN_EMAIL'
  AND status = 'active';
```

Do not expose an admin registration endpoint. Sign in again at the admin portal after running the update.

## Activate the scheduled malware scanner

The scanner workflow is committed at `.github/workflows/scan-uploads.yml`. It runs hourly on GitHub Actions, updates ClamAV signatures, validates ZIP structure and limits, scans archives, and posts a signed verdict. Because this repository is public, GitHub's standard hosted runners are free for public repositories according to GitHub's current billing documentation.

Before the workflow can process uploads, add these **repository Actions secrets** under GitHub → Settings → Secrets and variables → Actions:

- `GAMEVERSE_DATABASE_URL`: the TiDB connection URL already configured in Render's GameVerse platform service. Copy it from Render's Environment page; never paste it into source code.
- `GAMEVERSE_R2_ENDPOINT`
- `GAMEVERSE_R2_ACCESS_KEY_ID`
- `GAMEVERSE_R2_SECRET_ACCESS_KEY`
- `GAMEVERSE_R2_BUCKET`
- `GAMEVERSE_SCAN_WEBHOOK_SECRET`: generate a new random secret locally (at least 48 random bytes), then set the exact same value in this GitHub secret and Render's `SCAN_WEBHOOK_SECRET` environment variable. Do not send the secret in chat or commit it.

Use a bucket-scoped R2 token with only the permissions required for object reads. The scanner does not need public bucket access. Once the secrets and SQL migrations are in place, open GitHub → Actions → Scan quarantined game uploads → Run workflow for the first controlled test. Check the run logs and verify a known benign archive and the EICAR test file in a controlled test upload. The schedule is hourly; it is not an instant real-time scanner.

If any secret is missing or a scan cannot be completed, the upload remains blocked. Never change an `error` or `pending` result to `clean` manually.
