# GameVerse production readiness checklist

This document is an implementation checklist, not a claim of certification or a guarantee that defects do not exist.

## Implemented in the repositories

- Player registration and login; developer applications; server-side role checks.
- Scrypt password hashing with per-password random salts and configurable work factors.
- Opaque 256-bit session tokens stored as SHA-256 hashes in the database, seven-day absolute expiry, and server-side revocation on logout.
- HttpOnly, Secure-in-production, SameSite=Lax session cookies.
- HMAC-keyed database rate-limit buckets for login, registration, play events, reviews, comments and reports.
- Same-origin checks for state-changing requests, with an allowlist for the three deployed app origins.
- Baseline security response headers.
- Private R2 presigned uploads, quarantine state, upload ownership checks and signed downloads.
- ZIP signature, path traversal, symlink, encryption, expanded-size, entry-count and compression-ratio checks in the scheduled scanner.
- ClamAV scheduled scanner workflow; publication requires a clean verdict and a separate admin decision.
- Player favorites, play history, ratings, comments, reports and notifications.
- Admin queues, user suspension, moderation decisions and audit logs.

## Required owner setup before public use

1. Apply SQL migrations 002, 003, 004 and 005 in order to TiDB.
2. Create a private Cloudflare R2 bucket and bucket-scoped API token; set R2 environment variables in the platform service.
3. Apply the documented R2 CORS policy for the developer portal.
4. Add the six scanner secrets to GitHub Actions; align the scanner webhook secret with Render. Do not put secrets in Git.
5. Create a player account, then bootstrap the first admin role using the documented TiDB SQL statement.
6. Verify login, logout revocation, developer application approval, upload, scanner verdict, admin approval and signed download end-to-end.
7. Test benign ZIPs, malformed ZIPs, encrypted ZIPs, traversal paths, symlinks, high compression ratios and the EICAR test file in a controlled test account.
8. Confirm every external game source allows embedding and the stated license/attribution is accurate.
9. Configure backups, retention/lifecycle rules, usage alerts, error monitoring and a recovery procedure.

## Not yet production-complete

- Email verification and secure password-reset delivery are not integrated with an email provider.
- Admin MFA/WebAuthn is not implemented.
- Account export/deletion workflows and privacy request handling are not implemented.
- A formal Terms of Service, Privacy Policy, age/content-rating policy, copyright/takedown process and developer agreement require owner/legal review.
- The GitHub Actions scanner runs hourly, not synchronously. New uploads remain quarantined until it runs and returns a conclusive verdict.
- The developer ZIP pipeline publishes download archives only. Secure extraction and hosting for browser-playable developer uploads is not implemented.
- Automated tests, load tests, penetration tests, accessibility audits and cross-browser/device QA remain to be performed.
- External game embeds may be blocked by their source's frame policy or may change without notice; each source needs ongoing monitoring.
- Render free services may sleep and have resource/usage limits. R2, TiDB, bandwidth and scanner operations are not unlimited.

## Launch gate

Do not enable public developer uploads until all owner setup steps above are complete and the end-to-end security tests pass. Do not market the platform as defect-free, certified, or fully production-ready before independent testing and operational controls are in place.
