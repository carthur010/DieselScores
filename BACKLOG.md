# Scores: Backlog & Roadmap

Live: https://carthur010.github.io/DieselScores/
Beta: https://carthur010.github.io/DieselScores/beta/
Full history of updates: [CHANGELOG.md](CHANGELOG.md)

> Beta 2.0 (/beta2) is now a snapshot of beta from Oct 14, 1:57 PM. The old Apple Sports redesign moved to /beta2-apple and stays parked. Its best ideas (game card, Upcoming tab, Stats/Odds, drag-to-reorder) now live in the classic beta.

## Live: TV Settings (shipped Oct 14)
- [ ] Each user picks the services they have (YouTube TV, Hulu + Live TV, Sling, Fubo, DirecTV Stream, cable login, Peacock, Paramount+, Max, ESPN+, Prime Video, Apple TV, League Pass, MLB.TV, NHL app); watch buttons only show those
- [ ] Home market or ZIP code so regional networks (MSG, YES, SNY, NBC Sports) and blackouts show correctly
- [ ] "Not on your services" note when nothing matches

## Live: Simple view (shipped Oct 14)
- [ ] A **Simple** scoreboard option beside Compact and Expanded: just a list of games grouped by league (league logo and name, then time, two team logos and names, score, bell). No cards, odds or extras. Reference: a Bundesliga list with five 9:30 AM games stacked.

## Waiting to ship (in beta now)
Nothing. Everything shipped to live on Oct 14. Still worth a real-phone check: each watch app opening (YouTube TV, Peacock, Paramount+, HBO Max) and game-day betting odds on the card.

## Future features (Charles)
- **Any Game That's On**: one tap for "I just want something on." Picks the best game live right now, ranked by closeness, stakes and whether it's on your services, with a Watch button.
- **Rivalry**: tag rivalry games and boost them in Worth A Watch and alerts. Especially college (Texas vs. OU, Bama vs. Auburn, USC vs. UCLA), plus pro (Giants vs. Dodgers, Yankees vs. Red Sox). Starting list: [Bleacher Report, The 100 Most Heated Rivalries in Sports](https://bleacherreport.com/articles/1128435-the-100-most-heated-rivalries-in-sports).
- **Halftime countdown**: a live clock on the game card showing how long until the second half starts (about 15 min in college football, 13 in the NFL and NBA, 15 in soccer). Could pair with a "Second Half Starting" alert.

## Alert ideas (not built yet)
- Postponed / delayed / weather delay for your teams
- Starting lineups or goalie confirmed (needs a lineup feed)
- Big line movement on your teams' games
- Clinched / eliminated (playoff races)
- "Worth A Watch" ping when any game becomes must-watch
- Real push alerts with the app closed (needs a small server or the iOS app)

## Idea backlog (from SportsDudes)
- [x] **Tighten Upset Alert** (Ben; group settled on +200 moneyline, in beta Oct 14): today any betting favorite trailing in the second half counts, so PSG vs. City (near pick'em) fired. Require a real underdog: 7+ pt spread NFL/NBA, 10+ CFB, +150 or longer moneyline in soccer/NHL/MLB.
- [x] **College football by conference** (Faiz, in beta Oct 14): SEC, Big Ten, Big 12, ACC etc. as filters or sections, like Bleacher Report. Faiz also said the expanded view beats Bleacher Report's UI.
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
- ~~**Betting results on finals**~~ (in beta Oct 14): "Raptors covered (-11.5), Over 220.5" under final scores (pairs with Faiz's Upset Alert idea).
- ~~**Playoff seeds**~~ (in beta Oct 14) next to team names, e.g. (1) TB, (2) CLE.
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
