# Scores: Backlog & Roadmap

Live: https://carthur010.github.io/DieselScores/
Beta: https://carthur010.github.io/DieselScores/beta/
Full history of updates: [CHANGELOG.md](CHANGELOG.md)

> Beta 2.0 (Apple Sports look, /beta2) is parked. Its best ideas (game card, Upcoming tab, Stats/Odds, drag-to-reorder) now live in the classic beta.

## Waiting to ship (in beta now)
- [ ] SF Pro fonts on Apple devices
- [ ] Watch buttons open the app first on phones, website fallback (test each app: YouTube TV, Peacock, Paramount+, HBO Max)
- [ ] "You Are Looking Live" section in By League view on the Live tab
- [ ] Settings panel (gear icon): Open to, Layout, Appearance, Close-game alerts, My Teams, My Leagues
- [ ] In-app game details screen (replaces Gamecast links)
- [ ] Alert options (my teams / watched games / all games), game bell, test alert button
- [ ] Apple-style game card in Scores colors, with Stats / Play-By-Play / Box Score tabs
- [ ] Betting odds toggle (Settings, or Hide right on the odds card)
- [ ] Upcoming tab (next 3 days)
- [ ] Drag-to-reorder in My Leagues

## Idea backlog (from SportsDudes)
1. **"This guy is going off" tracker** (Ben): flag big individual games live, like a no-hitter in progress, hat trick, triple-double, big NFL stat lines.
2. **Upset Alert section** (Faiz): its own section for any underdog currently leading. Built for live bets.
3. **Rank sports by importance** (Faiz, Ben): first-open setup to rank sports/leagues so the home page only shows what you care about. Partly built: My Leagues tab + Edit order.
4. **Your team vs. a great game** (Ben): which wins the top spot? Also: Power 4 only or every college team?
5. **Pakistani green** (Faiz): shift the app green toward Pakistan flag green.
6. **Team records** (Charles): on By League cards already; not in By Time. Keep it simple.
7. ~~Close games at the top of Worth A Watch~~ (Faiz). Done, plus every playoff game.

### Layout options (from CBS Sports)
- **Compact vs. Expanded scoreboard picker** in Settings with little phone previews: Compact = two games per row, Expanded = one full-width game per row.
- **Pinch to switch layout** on the scores screen.
- **Always expand favorite games** toggle: your teams' games stay full-size even in Compact.
- **Favorites section** at the top as a grid of your teams' games across leagues (today's strip, but full cards).
- **Betting results on finals**: "Raptors covered (-11.5), Over 220.5" under final scores (pairs with Faiz's Upset Alert idea).
- **Playoff seeds** next to team names, e.g. (1) TB, (2) CLE.
- **Highlights link** on final games.

### Low priority
- **Soccer depth via API-Football** (part of API-Sports): player ratings, detailed match stats, closer to SofaScore. Free tier to start. (SofaScore's own feed is off-limits: blocked and against their terms.)
- **YouTube TV deep links to the channel**: test whether a channel's share link (ESPN, TNT, etc.) stays the same day to day. If yes, map every channel so the button lands on the live feed.
- **MLB's own stats feed** (statsapi.mlb.com) for richer at-bat detail in the game screen.

## Roadmap: real iOS app

### Approach
- **Option A, wrap the web app (a weekend):** Capacitor shell around the current app. Adds real push and reliable app links. Needs at least one native feature for App Store approval.
- **Option B, native SwiftUI (a few weeks):** Live Activities (lock screen + Dynamic Island scores), home screen widgets, background push alerts.
- Plan: A first for the group, B once the feature set settles.

### Setup
- [ ] Install Xcode on the MacBook
- [ ] Join the Apple Developer Program ($99/yr)
- [ ] Set up Claude Code on the Mac for the project folder
- [ ] Pick a unique App Store name (DieselScores, Worth A Watch, ...)

### Build
- [ ] Option A: Capacitor project, drop in the app, add push + native app links, run on phone from Xcode
- [ ] Option B: SwiftUI rebuild screen by screen (Live, Worth A Watch, My Leagues, search), then widgets + Live Activities
- [ ] Push server: small always-on service polling scores every ~30s and sending alerts (Cloudflare Worker or Firebase free tier)

### Distribution
- [ ] TestFlight for SportsDudes (replaces the web beta)
- [ ] Feedback loop through the backlog
- [ ] App Store submission if going public

### Before going public
- [ ] Licensed score data (Sportradar, SportsDataIO, API-Sports) instead of ESPN's unofficial feed
- [ ] Team logo usage handled properly, or abbreviations only
- [ ] Simple privacy policy
