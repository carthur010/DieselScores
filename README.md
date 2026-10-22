# Scores

Live scores, what to flip to, and where to watch.

- Live: https://carthur010.github.io/TheLineup/
- Beta: https://carthur010.github.io/TheLineup/beta/
- Beta 4.0 (iPhone Compact Match redesign): https://carthur010.github.io/TheLineup/beta4/
- Beta 3.0 (new home layouts: Bottom Bar, Your Day, League Rail): https://carthur010.github.io/TheLineup/beta3/
- Beta 2.0 (snapshot of beta, Oct 14 1:57 PM): https://carthur010.github.io/TheLineup/beta2/
- Old Apple Sports redesign (archived): https://carthur010.github.io/TheLineup/beta2-apple/

## How releases work
1. Routine changes go to `beta/`. Numbered experiments live in their own directory; Beta 4.0 is in `beta4/`.
2. Test on the beta link (it keeps its own saved settings, separate from live).
3. To ship, copy `beta/index.html` to the root `index.html` (swapping the beta name, storage prefix and badge back to live). Every ship is its own commit, so rolling back is one revert.

## iOS App (app/)

A Capacitor shell that loads the live site, so every "ship it" updates the app too. No rebuild needed for web changes.

1. `git clone https://github.com/carthur010/TheLineup && open TheLineup/app/ios/App/App.xcodeproj`
2. In Xcode: App target → Signing & Capabilities → pick your Team (sign in under Xcode Settings → Accounts first).
3. Pick your iPhone or a simulator up top and hit Run.

Native config lives in `app/capacitor.config.json`. After changing it, run `npx cap sync ios` inside `app/`.

## Tennis (tennis/ and tennis/beta/)

A separate solo app in the Scores look, on Live Tennis API (free plan, 100 calls a day) plus ESPN for finished results.
- Live: https://carthur010.github.io/TheLineup/tennis/
- Beta: https://carthur010.github.io/TheLineup/tennis/beta/
Same workflow as Scores: changes go to tennis/beta first, then ship to tennis/ on "ship it" (copy beta, change title "Tennis Beta" to "Tennis", drop the Beta tag, PREFIX "tennis-beta:" to "tennis:", icon and manifest paths).
The API key is typed into the app once and kept only in that browser (shared between beta and live). It is never in the code.

## PGA Tour statistics cache

Live, Beta 3 and Beta 4 share `assets/pga-stats.js`. The PGA endpoint does not allow our browser origin, so `scripts/update-pga-stats.py` retrieves its public scorecard stats server-side, decodes them and writes `data/pga-stats.json`. No provider key is stored in the repository. Event names/dates and unique full player names match the providers; ambiguous matches are rejected.

The `Refresh PGA statistics` workflow runs on a five-minute schedule (GitHub may delay scheduled jobs). The browser reads the public raw GitHub cache so bot cache commits do not require Pages redeploys. The UI shows the source timestamp and labels data older than 20 minutes as cached. A failed refresh retains the last successful file. Inspect Actions if that timestamp stops advancing. Run locally with `python3 scripts/update-pga-stats.py`.

PGA can omit statistics for individual players/rounds. We use explicit total/rank pairs and preserve genuine zero values. Missing made-putt distance and ranks remain blank; completed scorecards can supply scoring counts. This is PGA-only; LPGA keeps its existing feed.
