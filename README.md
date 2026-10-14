# Scores

Live scores, what to flip to, and where to watch.

- Live: https://carthur010.github.io/DieselScores/
- Beta: https://carthur010.github.io/DieselScores/beta/

## How releases work
1. New changes go to `beta/` only.
2. Test on the beta link (it keeps its own saved settings, separate from live).
3. To ship, copy `beta/index.html` to the root `index.html` (swapping the beta name, storage prefix and badge back to live). Every ship is its own commit, so rolling back is one revert.
