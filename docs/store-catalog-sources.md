# GameVerse store catalogue sources

Updated: 2026-11-18

## Current implementation

- The Store page is a download/discovery catalogue, not a game launcher.
- The curated seed catalogue is stored in `data/store-catalog.json`.
- It lists open-source desktop/mobile applications and games, with official publisher or repository release pages.
- F-Droid discovery refresh is implemented in `scripts/sync-fdroid-catalog.mjs` and `.github/workflows/refresh-open-catalog.yml`. It runs weekly and can also be started manually from GitHub Actions.
- The refreshed discovery index is stored in `data/fdroid-catalog.json` and is merged into the Store UI.
- The F-Droid search API is documented as a discovery/display API. It is not a binary verification service. GameVerse links to official F-Droid package pages and does not mirror APKs.

## Aptoide

Aptoide's official Applications Catalog API advertises access to more than 100,000 apps with verified distribution rights, but it is a partner integration, not an unrestricted public catalogue endpoint.

Before enabling the Aptoide feed:
1. GameVerse owner must contact Aptoide through the official Applications Catalog API / partner contact route.
2. Obtain partner eligibility and a written distribution/API agreement.
3. Obtain the partner API credentials and current API documentation/schema.
4. Confirm whether GameVerse may display metadata only or may also link to, redirect to, or host the package binaries.
5. Add credentials only to server-side Render environment variables; never expose them to browser code.
6. Provide the approved API docs and credentials through the secure configuration route before implementation.

Official references:
- https://dev.connect.aptoide.com/partners-apps-catalog-api
- https://docs.connect.aptoide.com/docs/overview
- https://docs.connect.aptoide.com/docs/api-keys

Do not scrape the Aptoide website, bypass authentication, or assume that a public web-services API grants redistribution rights. Aptoide Connect terms describe a distribution/partnership agreement and possible annual subscription fees.

## Other sources

- F-Droid: public search API and signed repository indexes. For APK mirroring, verify repository signatures and package signer fingerprints first.
- GitHub Releases: discovery candidates only. A public repository does not establish that every bundled asset, font, soundtrack, trademark, or binary can be redistributed. Review the full license and release contents before hosting.
- Google Play and Apple App Store: use official product/store pages as destinations. Do not scrape their catalogues or mirror proprietary binaries without a separate authorized feed.
- Steam and publisher sites: link to official store/download pages. Commercial titles remain publisher-controlled.

## Publication rules

- Keep a source URL, platform, category, version when known, licence, and verification status for every listing.
- Do not mark a candidate as verified solely because a GitHub repository is public or an app page exists.
- Never re-host paid/proprietary apps or game binaries without explicit redistribution rights.
- Keep regional availability and minimum OS requirements visible when available.
