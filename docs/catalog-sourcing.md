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
