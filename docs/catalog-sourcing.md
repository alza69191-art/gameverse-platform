# GameVerse catalogue sourcing and licence policy

This document records the current external discovery sources. A link in the public catalogue is not a claim that GameVerse owns the game or may redistribute its files.

## Games

| Source | What is listed | Current handling |
|---|---|---|
| Kenney on itch.io | Browser-playable/free titles shown on the creator's page, including Solitaire, Pixepal, KeyCars and other titles | Discovery link only. Open the individual game page and confirm its current terms before embedding, copying, or hosting files. |\n| MadKidGames | Third-party HTML5 games with generated iframe URLs, including selected 3D driving, racing, sports and flight titles | MadKidGames states embedding is free, but each game page requires its ads.txt declaration and domain approval by email. Keep its iframe hosted remotely, preserve attribution, and do not copy game binaries or imply ownership. Re-check terms and frame availability periodically. |

## Developer assets

| Source | Asset scope | Licence evidence | GameVerse policy |
|---|---|---|---|
| Kenney | 2D, 3D, UI and audio asset packs | Kenney states its asset pages are CC0; check the individual asset page and included licence file | Approved for reuse only after recording the specific pack/source page. |
| Poly Haven | 3D models, textures and HDRIs | Official licence page states all assets are CC0 and permits commercial use and redistribution | Approved source; retain the source URL and CC0 evidence for each imported asset. |
| Quaternius | 3D game assets | Licences vary by pack; newer Quaternius Asset License (QAL) restricts redistribution of asset files | External link only until the exact pack licence is checked. Do not mirror QAL assets. |
| OpenGameArt | 2D/3D artwork, music and sound | Licence is specified per item and may require attribution or impose conditions | Review each item and record attribution and redistribution rights before use. |
| Freesound | Sound effects and recordings | Licence is specified per sound | Review each sound's licence and attribution requirements before use. |

## Required metadata before importing any file

- Original creator and source URL.
- Exact asset/game page and version.
- Licence name and licence URL or included licence file.
- Whether redistribution and commercial use are allowed.
- Attribution text, if required.
- Review status and date checked.
- Malware scan result and file hash for uploaded archives.

## Important distinction

A source being free to download does not automatically grant GameVerse permission to re-host or redistribute it. Until rights are verified, catalogue entries link to the original publisher and do not serve third-party binaries from GameVerse.


## MadKidGames embed conditions

The selected catalogue entries are embeds, not MIT/CC0 source-code licences. MadKidGames' embed instructions say embedding is allowed free of charge, but each game page also requires this publisher record in the site's root `ads.txt` file:

```text
#MADKIDGAMES google.com, pub-2328712687113561, DIRECT, f08c47fec0942fa0
```

After deployment, the site owner must email the production domain to `[email protected]` for approval. The domain must not be treated as approved until the provider confirms it. Keep visible source attribution and provide a direct link to the original game page. If a game is removed, blocked, or its terms change, remove or replace the catalogue entry.

## Third-party mobile/desktop store links

The GameVerse Store page links to official Google Play, Apple App Store, and Steam product pages only. GameVerse does not host or repackage those installers, and availability, price, age rating, device compatibility and in-app purchases remain controlled by each store and publisher.


## Other platforms reviewed (not bulk-imported)

| Platform | Finding | GameVerse decision |
|---|---|---|
| GameDistribution | Its publisher/developer partnership requires registration and mandatory SDK/ad integration for submitted games; it is not a blanket free public iframe catalogue for arbitrary third-party games. | Do not add games until a formal publisher agreement and approved embed/API terms are obtained. |
| Famobi | Its official shop offers a paid Web & App Integration licence with an embed link; it also offers subscription licensing. | Keep as a future paid catalogue source; do not claim its games are free to embed. |
| itch.io | It supports HTML5 games embedded through the publisher's project page, but each creator controls the rights and terms. | Add individual titles only after verifying the exact game's licence and whether commercial embedding/rehosting is allowed. |
| Three.js Resources | It is a discovery/tutorial resource for building browser games, not a blanket licence for every linked game. | Use as a lead source; check each project's repository and licence separately. |
| GitHub examples | A repository marked MIT can still have incomplete demos, missing asset rights or no working hosted build. | Import only after checking source, complete build, licence, assets, attribution and browser compatibility. The linked basic-3d-car-game repository currently documents a faux-3D CSS game and placeholder demo, so it is not imported as a polished 3D title. |


## Free-to-play shooter and battle royale links

The following entries are listed as external official-play links, not embedded games. GameVerse does not mirror their files or imply ownership. Free-to-play status and gameplay are described by each publisher's own site.

| Game | Official play page | Source / licence notes | Handling |
|---|---|---|---|
| Remain | https://remain.games/ | Official site describes a free browser battle royale for up to 100 players. No redistribution licence confirmed. | External launch only; no iframe. |
| Suroi | https://suroi.io/ | Official repository is GPL-3.0; review asset licences separately. | External launch only; no iframe. |
| Blockyard | https://blockyard.gg/ | Public repository lists MIT licence. | External launch only; no iframe. |
| Hypersomnia | https://play.hypersomnia.io/ | Official repository lists AGPL-3.0. | External launch only; no iframe. |
| Riposte: Frontline | https://www.playriposte.com/ | Source repository states MIT with exceptions for certain assets listed in NOTICE.md. | External launch only; no asset copying. |
| GoBattle.io | https://gobattle.io/ | Official site describes free browser play including Battle Royale mode. No redistribution licence confirmed. | External launch only; no iframe. |

These entries are free-to-play on the publisher's site; GameVerse does not guarantee that all optional cosmetics, passes, in-game purchases, or app-store versions are free.


## Open-source full-game projects reviewed (2026-11-18)

These are complete game projects or substantial playable builds, not generated toy demos. GameVerse currently links to the projects' official hosted instances where available; the source repositories are credited on each game detail page. Linking to an upstream demo is not the same as self-hosting or incorporating its source code.

| Game | Source repository | Code licence | Integration status | Notes |
|---|---|---|---|---|
| OpenFront.io | https://github.com/openfrontio/OpenFrontIO | AGPL-3.0 | Official browser game linked | Assets are separately CC BY-SA 4.0. Public network modifications must offer corresponding source and retain notices. |
| LibreHold | https://github.com/librehold-game/librehold | AGPL-3.0 | Official browser game linked | Alpha; Go/Postgres/Valkey server stack. Hosting needs a separate backend and persistent services. |
| Ancient Beast | https://github.com/FreezingMoon/AncientBeast | AGPL-3.0 | Official browser game linked | Verify individual art/audio asset terms before copying assets. |
| Freeciv-web | https://github.com/freeciv/freeciv-web | Mixed GPL/AGPL components | Community live instance linked | Multi-component Java/Tomcat/nginx/C server/proxy stack; not a simple static embed. |
| pmndrs Racing | https://github.com/pmndrs/racing-game | MIT | Official demo linked | README describes CC0 assets; preserve MIT notice. |
| Suroi | https://github.com/HasangerGames/suroi | GPL-3.0 | Official browser game linked | 2D battle royale; work in progress; review asset terms separately. |

### Reviewed but not yet deployed as GameVerse-hosted games

- https://github.com/tombuildsstuff/web-shooter-game — MIT source; full Go + WebSocket + Three.js multiplayer FPS, bots, maps and mobile controls. No verified public official hosted instance was found in this review. It needs a dedicated Go service and multiplayer testing before listing as playable.
- https://github.com/glashoff/WebGame — AGPL-3.0 source; browser/Electron Counter-Strike-style FPS with authoritative server and map editor. Assets have separate terms (ambientCG CC0; Mixamo content not included/not covered). Requires separate deployment and AGPL source-offer compliance.
- https://github.com/iiegor/slither — MIT server implementation only; README says it needs a compatible client, so it is not a complete standalone game.
- https://github.com/agreedturtle/slither-clone — MIT full-stack Slither-style project with authoritative simulation and bot AI, but very new/low adoption; do not promote as production-ready until independent security, load and gameplay testing.
- https://github.com/pmndrs/racing-game — complete demo is available, but it is a community showcase rather than a large commercial-grade racing title.

### Reuse rules

1. A public repository is not automatically a blanket licence for every included asset, trademark, music track, model or character.
2. Preserve each repository's copyright and licence notices; provide the source-code offer required by AGPL/GPL when distributing or operating modified versions.
3. Do not copy proprietary game assets, original commercial-game clients, brand marks or paid content into GameVerse.
4. Upstream external links are catalog entries only. Self-hosting requires a separate deployment, storage, networking, security and capacity review.


## Additional full open-source PC games reviewed and listed

| Game | GitHub repository | Official download | Licence notes |
|---|---|---|---|
| OpenRA | https://github.com/OpenRA/OpenRA | https://www.openra.net/download/ | GPL-3.0 code; inspect mod/data asset terms. It is a community reimplementation, not an EA product. |
| Xonotic | https://github.com/xonotic/xonotic | https://xonotic.org/download/ | GPL-3.0-or-later; source package documents component-specific terms. |
| Veloren | https://github.com/veloren/veloren | https://veloren.net/download/ | GPL-3.0; GitHub repo is a mirror, primary development is on GitLab. |
| The Battle for Wesnoth | https://github.com/wesnoth/wesnoth | https://www.wesnoth.org/downloads/ | GPL-2.0 repository; check data/add-on content terms separately. |
| Warzone 2100 | https://github.com/Warzone2100/warzone2100 | https://wz2100.net/ | GPL-2.0-or-later with separate non-GPL exception notices. |
| SuperTuxKart | https://github.com/supertuxkart/stk-code | https://supertuxkart.net/Download | GPL code; inspect the individual media/data asset licences before reuse. |

These six titles are registered as official download destinations, not embedded browser games. GameVerse does not mirror their installers or claim ownership of the games.

## Third-party HTML5 game publisher platforms (integration candidates)

These providers are approved as **research/onboarding leads only**. They are not yet connected to GameVerse, and no provider has approved the GameVerse production property in this record. Do not bulk-import games, copy game files, or enable monetization until the provider account, property/domain and applicable publisher terms are approved.

| Provider | Official publisher entry | Integration options / published terms | GameVerse status |
|---|---|---|---|
| GameDistribution | https://gamedistribution.com/publishers/embedded-links/ | Offers Direct Game Integration using provider-hosted games in an iframe after publisher onboarding. Its publisher agreement licenses display on registered Publisher Properties and provides a publisher revenue share. Its developer upload workflow is separate and requires SDK/ad integration and QA; do not confuse it with publisher iframe access. | Pending publisher application, production-property approval and written confirmation of domain eligibility, revenue share, payment method and regional availability. |
| GameMonetize | https://gamemonetize.com/ | Offers a publisher portal, an arcade script/catalog and embedded HTML5 games. Its FAQ states a 45% publisher revenue share and lists PayPal or USDT ERC20 payout; these terms and eligibility must be reconfirmed in the account agreement before relying on them. | Pending publisher registration and property approval. Confirm whether a free GitHub Pages/Render subdomain is accepted, payout eligibility in the operator's country, thresholds, tax/KYC requirements and exact embed/API rules. |
| Gamezop Business | https://business.gamezop.com/ | Offers a partner integration, including a unique link, API/SDK options and iframe. Its published guide warns that a plain copied iframe does not itself qualify the publisher to monetize traffic; use the partner-provided integration and credentials. | Pending partner enquiry and approval. Confirm domain eligibility, available integration method, revenue share, payout method and regional onboarding. |

### Provider onboarding checklist

1. Apply using the official publisher/partner page linked above and provide the actual GameVerse production URL.
2. Ask each provider to confirm in writing that the exact free subdomain is eligible. Do not assume that free hosting or a GitHub Pages URL is accepted.
3. Confirm the operator's country is eligible, and verify KYC, tax forms, payout minimums, supported payout rails and whether a usable payout method is available before investing in integration.
4. Obtain the approved embed URL, API key or SDK instructions from the provider dashboard. Never invent iframe URLs or scrape a provider's catalogue.
5. Add games only through the approved integration method. Keep provider-hosted games on provider infrastructure unless a separate written redistribution licence permits self-hosting.
6. Record provider, property approval date, terms version, revenue share, payout rules, game IDs, embed method and contact/support details in the GameVerse admin records.
7. Test on desktop and mobile, check CSP/frame restrictions, loading performance, privacy/cookie disclosures and ad behaviour. Do not manipulate ad impressions or clicks.
8. If approval is denied or terms do not permit the intended use, do not embed the content.

**Important:** The presence of a provider in this table is not evidence that GameVerse has been accepted, that its domain is approved, that revenue will be earned, or that payouts to Palestine are supported. Those points require direct provider confirmation.

