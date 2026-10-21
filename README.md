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
