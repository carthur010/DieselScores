# Scores: Backlog & Roadmap

Live: https://carthur010.github.io/DieselScores/
Beta: https://carthur010.github.io/DieselScores/beta/
Full history of updates: [CHANGELOG.md](CHANGELOG.md)

## Waiting to ship (in beta now)
- [ ] SF Pro fonts on Apple devices
- [ ] Watch buttons open the app first on phones, website fallback (test each app: YouTube TV, Peacock, Paramount+, HBO Max)
- [ ] "You Are Looking Live" section in By League view on the Live tab
- [ ] Settings panel (gear icon): Open to, Layout, Appearance, Close-game alerts, My Teams, My Leagues
- [ ] In-app game details screen (replaces Gamecast links)

## Idea backlog (from SportsDudes)
1. **"This guy is going off" tracker** (Ben): flag big individual games live, like a no-hitter in progress, hat trick, triple-double, big NFL stat lines.
2. **Upset Alert section** (Faiz): its own section for any underdog currently leading. Built for live bets.
3. **Rank sports by importance** (Faiz, Ben): first-open setup to rank sports/leagues so the home page only shows what you care about. Partly built: My Leagues tab + Edit order.
4. **Your team vs. a great game** (Ben): which wins the top spot? Also: Power 4 only or every college team?
5. **Pakistani green** (Faiz): shift the app green toward Pakistan flag green.
6. **Team records** (Charles): on By League cards already; not in By Time. Keep it simple.
7. ~~Close games at the top of Worth A Watch~~ (Faiz). Done, plus every playoff game.

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
