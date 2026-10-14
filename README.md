# Scores

Live scores, what to flip to, and where to watch.

- Live: https://carthur010.github.io/DieselScores/
- Beta: https://carthur010.github.io/DieselScores/beta/
- Beta 2.0 (snapshot of beta, Oct 14 1:57 PM): https://carthur010.github.io/DieselScores/beta2/
- Old Apple Sports redesign (archived): https://carthur010.github.io/DieselScores/beta2-apple/

## How releases work
1. New changes go to `beta/` only.
2. Test on the beta link (it keeps its own saved settings, separate from live).
3. To ship, copy `beta/index.html` to the root `index.html` (swapping the beta name, storage prefix and badge back to live). Every ship is its own commit, so rolling back is one revert.

## iOS App (app/)

A Capacitor shell that loads the live site, so every "ship it" updates the app too. No rebuild needed for web changes.

1. `git clone https://github.com/carthur010/DieselScores && open DieselScores/app/ios/App/App.xcodeproj`
2. In Xcode: App target → Signing & Capabilities → pick your Team (sign in under Xcode Settings → Accounts first).
3. Pick your iPhone or a simulator up top and hit Run.

Native config lives in `app/capacitor.config.json`. After changing it, run `npx cap sync ios` inside `app/`.
