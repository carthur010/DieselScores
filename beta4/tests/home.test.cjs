// Run with: node --test beta4/tests/home.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const implementation = html.split('  // Beta 4.0: compact iPhone home, using the existing feeds and detail routes.')[1].split('  renderDates();\n  loadAll();')[0];

function fixture() {
  const lg = { id: 'nba', name: 'NBA', path: 'basketball/nba' };
  const soccer = { id: 'wlc', name: 'WSL Players Cup', short: 'WSL Cup', path: 'soccer/eng.w.league_cup' };
  const game = (id, status, mine, league = lg) => ({ id, lg: league, state: status, mine, status: status === 'in' ? '6:12 3rd' : status === 'post' ? 'Final' : '7:00 PM', date: '2026-10-21T23:00:00Z', teams: [{ name: 'Away ' + id, abbr: 'A', score: 1 }, { name: 'Home ' + id, abbr: 'H', score: 2 }], watch: [] });
  const games = [game('live', 'in', true), game('pre', 'pre', true), game('other', 'pre', false), game('final', 'post', true), game('soccer', 'in', false, soccer)];
  const body = { innerHTML: '', dataset: {}, classList: { add() {}, contains() { return false; } } };
  const saved = {};
  const ctx = {
    state: { tab: 'foryou', density: 'simple', favGames: {}, favs: new Set(), favMeta: {}, next: {}, favLeagues: ['nba'], data: {}, loading: false },
    store: { get: (k, d) => saved[k] ?? d, set: (k, v) => { saved[k] = v; } },
    document: { addEventListener() {}, getElementById: () => body },
    window: {}, Intl, Date, Map, Set, Promise, AbortSignal,
    LG: { nba: lg, wlc: soccer }, LEAGUES: [lg, soccer], TEAM_LEAGUES: [lg, soccer],
    allGames: () => games, specialsFor: () => [],
    gameKey: g => g.lg.id + ':' + g.id,
    favKey: (lg, abbr) => lg.id + ':' + abbr,
    isMine: g => g.mine, pickedNothing: () => false, hasYTTV: () => false,
    worthPicks: () => [], gameTag: () => "Close Game",
    isFavTeam: () => false,
    byState: (a, b) => ({ in: 0, pre: 1, post: 2 }[a.state] - { in: 0, pre: 1, post: 2 }[b.state]),
    esc: s => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'),
    netLabel: () => 'NBA League Pass', isToday: () => true,
    HEART: '<svg></svg>', HEART_ON: '<svg></svg>', IC3: {},
    starBtn: (lg, t) => '<button data-fav="' + lg.id + ':' + t.abbr + '">Follow</button>',
    bellBtn: g => g.state === 'post' ? '' : '<button data-watchgame="' + g.lg.id + ':' + g.id + '">Alerts</button>',
    mvSection: () => '', timeLabel: () => '7:00 PM', BLOCK: {}, API: 'https://example.test/',
    normalize: (event, league) => ({ ...event, lg: league, teams: event.competitions[0].competitors.map(c => ({ name: c.team.name, abbr: c.team.abbreviation, score: c.score })), status: 'Final', state: 'post' }),
    fetch: async () => ({ ok: true, json: async () => ({ header: { competitions: [{ date: '2026-10-20T23:00:00Z', competitors: [{ team: { name: 'Old Away', abbreviation: 'OA' }, score: 1 }, { team: { name: 'Old Home', abbreviation: 'OH' }, score: 2 }] }] } }) })
  };
  vm.createContext(ctx); vm.runInContext(implementation, ctx);
  return { ctx, games, body };
}

test('For You includes followed teams and separates finals', () => {
  const { ctx, games } = fixture();
  const result = ctx.beta4Home(games);
  assert.match(result, /Your featured match/);
  assert.match(result, /Away pre/);
  assert.match(result, /<h2>Final<\/h2>/);
  assert.doesNotMatch(result, /Away other/);
});
test('Live excludes upcoming games, finals and the featured card', () => {
  const { ctx, games } = fixture(); ctx.state.tab = 'live';
  const result = ctx.beta4Home(games);
  assert.match(result, /Away live/);
  assert.doesNotMatch(result, /Away pre|Away final|Your featured match/);
});
test('league filter stays applied when changing scope', () => {
  const { ctx, games } = fixture(); ctx.state.favLeagues.push("wlc");
  vm.runInContext('b4League = "wlc"', ctx); ctx.state.tab = 'all';
  let result = ctx.beta4Home(games);
  assert.match(result, /Away soccer W/);
  assert.doesNotMatch(result, /Away live/);
  ctx.state.tab = 'live'; result = ctx.beta4Home(games);
  assert.match(result, /Away soccer W/);
  assert.doesNotMatch(result, /Away pre/);
});
test('Saved does not show unsaved games', () => {
  const { ctx, body } = fixture(); ctx.state.favGames['nba:pre'] = { date: '2026-10-21' };
  ctx.beta4SavedPaint();
  assert.match(body.innerHTML, /Away pre/);
  assert.doesNotMatch(body.innerHTML, /Away live|Away other/);
});
test('Saved reloads a match that is absent from today’s feed', async () => {
  const { ctx, body } = fixture(); ctx.state.favGames['nba:yesterday'] = { date: '2026-10-20' };
  await ctx.beta4LoadSaved();
  assert.match(body.innerHTML, /Old Away/);
  assert.doesNotMatch(body.innerHTML, /unavailable|Loading your tracked games/);
});
test('failed saved requests keep a retry action', async () => {
  const { ctx, body } = fixture(); ctx.state.favGames['nba:missing'] = {};
  ctx.fetch = async () => { throw new Error('offline'); };
  await ctx.beta4LoadSaved();
  assert.match(body.innerHTML, /1 tracked game is unavailable/);
  assert.match(body.innerHTML, /data-b4-retry-saved/);
});
test('team names and attributes are escaped in score rows', () => {
  const { ctx, games } = fixture(); games[0].teams[0].name = '<script>alert(1)</script>';
  const result = ctx.beta4Row(games[0]);
  assert.doesNotMatch(result, /<script>/);
  assert.match(result, /&lt;script&gt;/);
});
test('Beta 4 shares follows but isolates display and game preferences', () => {
  assert.match(html, /scoreline-b4:/);
  assert.match(html, /scoreline-shared:/);
  assert.match(html, /location.pathname.includes\("\/beta4"\) \? "beta4\/"/);
  assert.doesNotMatch(html, /BETA4_IMPLEMENTATION/);
});

function scheduleFixture() {
  const now = Date.now();
  const event = (id, offset, state) => ({ id, date: new Date(now + offset).toISOString(), competitions: [{ status: { type: { state } }, competitors: [{ team: { id: '1', abbreviation: 'A' }, homeAway: 'away' }, { team: { id: '2', abbreviation: 'B', shortDisplayName: 'Opponent' } }] }] });
  const events = [event('playing', -3600000, 'in'), event('next', 86400000, 'pre')];
  const ctx = {
    state: { favMeta: { 'nba:A': { lg: 'nba', id: '1' } }, next: {} },
    LG: { nba: { path: 'basketball/nba' } }, API: 'https://example.test/',
    Date, placeName: () => '', ymd: () => '20261022', normalize: (ev, lg) => ({ id: ev.id, lg, teams: ev.competitions[0].competitors }),
    fetch: async () => ({ ok: true, json: async () => ({ events }) })
  };
  vm.createContext(ctx);
  vm.runInContext('async function fetchNext' + html.split('async function fetchNext')[1].split('  async function refreshNext')[0], ctx);
  return ctx;
}

test('My Teams next-game lookup skips a match already in progress', async () => {
  const ctx = scheduleFixture();
  await ctx.fetchNext('nba:A', true);
  assert.equal(ctx.state.next['nba:A'].id, 'next');
  assert.equal(ctx.state.next['nba:A'].oppName, 'Opponent');
});

test('ordinary next-game lookup still includes a live game', async () => {
  const ctx = scheduleFixture();
  await ctx.fetchNext('nba:A');
  assert.equal(ctx.state.next['nba:A'].id, 'playing');
});

test('My Teams distinguishes a failed schedule request from no upcoming game', async () => {
  const ctx = scheduleFixture();
  ctx.fetch = async () => { throw new Error('offline'); };
  await ctx.fetchNext('nba:A', true);
  assert.equal(ctx.state.next['nba:A'].error, true);
  assert.notEqual(ctx.state.next['nba:A'].none, true);
});

test('Compact cards show team names, scores and both game actions without a Watch button', () => {
  const { ctx, games } = fixture(); ctx.state.density = 'compact';
  games[0].teams[0].name = 'Rangers'; games[0].teams[0].abbr = 'NYR';
  games[0].watch = [{ url: 'https://example.test/watch', app: 'Gotham Sports' }];
  const result = ctx.beta4Rows(games.slice(0, 2));
  assert.match(result, /b4-cards-compact/);
  assert.match(result, />Rangers<\/b>/);
  assert.match(result, /b4-card-score/);
  assert.match(result, /data-favgame=/);
  assert.match(result, /data-watchgame=/);
  assert.doesNotMatch(result, /b4-card-watch|>NYR</);
});

test('Expanded cards link the Watch button to the matching streaming provider', () => {
  const { ctx, games } = fixture(); ctx.state.density = 'expanded';
  games[0].watch = [{ url: 'https://example.test/watch?game=1&live=1', app: 'Gotham Sports', scheme: 'gotham://watch' }];
  const result = ctx.beta4Rows([games[0]]);
  assert.match(result, /b4-cards-expanded/);
  assert.match(result, /Watch On Gotham Sports/);
  assert.match(result, /href="https:\/\/example.test\/watch\?game=1&amp;live=1"/);
  assert.match(result, /data-app="gotham:\/\/watch"/);
});

test('Expanded cards do not invent a Watch destination or pregame scores', () => {
  const { ctx, games } = fixture(); ctx.state.density = 'expanded';
  const result = ctx.beta4Card(games[1]);
  assert.doesNotMatch(result, /b4-card-watch|b4-card-score/);
  assert.match(result, /7:00 PM/);
});

test('Always Expand My Teams expands followed games while leaving other Compact cards compact', () => {
  const { ctx, games } = fixture();
  ctx.state.density = 'compact'; ctx.state.expandFavs = true;
  const result = ctx.beta4Rows([games[0], games[2]]);
  assert.match(result, /b4-mixed-compact/);
  assert.equal((result.match(/b4-card-expanded tap/g) || []).length, 1);
  assert.equal((result.match(/b4-card-compact tap/g) || []).length, 1);
});

function settingsFixture() {
  const { ctx, body } = fixture();
  ctx.state.tv = { market: 'nyc', services: ['youtube'] };
  ctx.state.homeLayout = 'bar'; ctx.state.alertPrefs = { team: { start: true, remind: [15] }, watched: { start: true, remind: [5] }, all: { close: false } };
  Object.assign(ctx, {
    MARKETS: { nyc: { name: 'New York' }, other: { name: 'Other' } },
    LN: null, notifyStatus: () => 'Notifications not allowed yet',
    ALERT_EVENTS: { team: [['start', 'Game Start']], watched: [['start', 'Game Start']], all: [['close', 'Close Games']] },
    REMIND_MINS: [30, 15, 10, 5, 1],
    SERVICE_GROUPS: [['Free To Watch', 'free']], SERVICES: [{ id: 'youtube', grp: 'free', name: 'YouTube' }, { id: 'tubi', grp: 'free', name: 'Tubi' }]
  });
  return { ctx, body };
}

test('Settings home links to dedicated display, TV and alerts pages', () => {
  const { ctx, body } = settingsFixture(); ctx.beta4RenderSettings();
  assert.match(body.innerHTML, /Saved on this device/);
  assert.match(body.innerHTML, /data-b4-settings-page="display"/);
  assert.match(body.innerHTML, /data-b4-settings-page="tv"/);
  assert.match(body.innerHTML, /data-b4-settings-page="alerts"/);
  assert.match(body.innerHTML, /data-set="homeLayout" data-val="bar" aria-pressed="true"/);
});

test('TV settings reflect saved market and service selections', () => {
  const { ctx, body } = settingsFixture(); vm.runInContext('b4SettingsPage = "tv"', ctx); ctx.beta4RenderSettings();
  assert.match(body.innerHTML, /data-tv-market="nyc" aria-pressed="true"/);
  assert.match(body.innerHTML, /data-tv-svc="youtube" aria-pressed="true"/);
  assert.match(body.innerHTML, /data-tv-svc="tubi" aria-pressed="false"/);
});

test('Alert pages retain independent event and reminder selections', () => {
  const { ctx } = settingsFixture();
  const team = ctx.beta4AlertSettings('team'), game = ctx.beta4AlertSettings('watched');
  assert.match(team, /data-remind-group="team" data-remind="15" aria-pressed="true"/);
  assert.match(game, /data-remind-group="watched" data-remind="5" aria-pressed="true"/);
  assert.doesNotMatch(team, /Phone Notifications Allowed/);
  assert.doesNotMatch(game, /Phone Notifications Allowed/);
});


test('Featured game separates scores and clock and retains follow, save, alert and watch actions', () => {
  const { ctx, games } = fixture();
  const g = games[0]; g.watch = [{ app: 'Paramount+', url: 'https://www.paramountplus.com/live-tv/', scheme: 'paramountplus://' }];
  let result = ctx.beta4Feature(games).html;
  assert.match(result, /Your Game/);
  assert.match(result, /Away live leads|Home live leads/);
  assert.match(result, /b4-feature-scoreline/);
  assert.match(result, /data-fav="nba:A"/);
  assert.match(result, /data-favgame="nba:live"/);
  assert.match(result, /data-watchgame="nba:live"/);
  assert.match(result, /href="https:\/\/www.paramountplus.com\/live-tv\/"/);
  assert.match(result, /data-app="paramountplus:\/\/"/);
  g.teams[0].score = 2;
  result = ctx.beta4Feature(games).html;
  assert.match(result, />Tied</);
});


test('Game cards put the network in the header and use game actions instead of team stars', () => {
  const { ctx, games } = fixture();
  for (const density of ['compact', 'expanded']) {
    const result = ctx.beta4Card(games[0], density);
    assert.match(result, /b4-card-top[^]*b4-card-tv/);
    assert.match(result, /b4-card-clock b4-status">6:12 3rd/);
    assert.match(result, /data-favgame="nba:live"/);
    assert.match(result, /data-watchgame="nba:live"/);
    assert.doesNotMatch(result, /data-fav="|class="star/);
  }
});


test('Expanded shows real team records only before a game starts', () => {
  const { ctx, games } = fixture();
  const g = games[1]; g.teams[0].record = '12-4'; g.teams[1].record = '9-7';
  let result = ctx.beta4Card(g, 'expanded');
  assert.match(result, /b4-card-record">12-4</);
  assert.match(result, /b4-card-record">9-7</);
  assert.doesNotMatch(result, /b4-card-score/);
  assert.doesNotMatch(ctx.beta4Card(g, 'compact'), /b4-card-record/);
  for (const state of ['in', 'post']) {
    g.state = state;
    assert.doesNotMatch(ctx.beta4Card(g, 'expanded'), /b4-card-record/);
  }
  g.state = 'pre'; g.teams[0].record = ''; g.teams[1].record = '';
  assert.doesNotMatch(ctx.beta4Card(g, 'expanded'), /b4-card-record/);
  g.teams[0].record = '2-1'; g.teams[0].seasonRecord = '50-32';
  assert.match(ctx.beta4Card(g, 'expanded'), /b4-card-record">50-32</);
});


test('Saved sections retain dates and put Today, Tomorrow and upcoming games before previous games', () => {
  const { ctx, games } = fixture();
  const dated = (id, date) => ({ ...games[1], id, date });
  const result = ctx.beta4SavedSections([
    dated('old', '2026-10-19T12:00:00'), dated('future', '2026-10-24T12:00:00'),
    dated('tomorrow', '2026-10-22T12:00:00'), dated('today', '2026-10-21T12:00:00')
  ], new Date('2026-10-21T12:00:00'));
  assert.ok(result.indexOf('<h2>Today</h2>') < result.indexOf('<h2>Tomorrow</h2>'));
  assert.ok(result.indexOf('<h2>Tomorrow</h2>') < result.indexOf('<h2>Upcoming Games</h2>'));
  assert.ok(result.indexOf('<h2>Upcoming Games</h2>') < result.indexOf('<h2>Previous Games</h2>'));
  assert.match(result, /Oct 19/); assert.match(result, /Oct 24/);
});

test('League menu prioritizes favorites and filters by name without dropping the selection', () => {
  const { ctx } = fixture();
  const menu = ctx.beta4LeagueMenu();
  assert.ok(menu.indexOf('My Leagues') < menu.indexOf('More Leagues'));
  const searched = ctx.beta4LeagueMenu('WSL');
  assert.match(searched, /WSL Players Cup/); assert.doesNotMatch(searched, />NBA</);
  assert.match(ctx.beta4LeagueMenu('zzzzz'), /No leagues match/);
});

test('Choosing an extra league keeps pinned shortcut order stable', () => {
  const { ctx } = fixture();
  const el = { innerHTML: '', hidden: true };
  ctx.beta4Filters(el, [], []);
  const before = [...el.innerHTML.matchAll(/data-b4-league="([^"]+)"/g)].map(x => x[1]);
  ctx.LG.extra = { id: 'extra', name: 'Extra League', short: 'EX' };
  vm.runInContext('b4League = "extra"', ctx);
  ctx.beta4Filters(el, [], []);
  assert.deepEqual([...el.innerHTML.matchAll(/data-b4-league="([^"]+)"/g)].map(x => x[1]), before);
  assert.match(el.innerHTML, /Selected Extra League/);
});

test('Active search hides unrelated following content and clearing it restores the list', () => {
  const { ctx } = fixture();
  const nodes = { sheet: { classList: { contains: () => false } }, q: { value: 'Arsenal' }, following: {}, 'b4-following-heading': {} };
  ctx.document.getElementById = id => nodes[id];
  ctx.beta4SearchVisibility();
  assert.equal(nodes.following.hidden, true);
  nodes.q.value = ''; ctx.beta4SearchVisibility(); assert.equal(nodes.following.hidden, false);
  nodes.sheet.classList.contains = () => true; ctx.beta4SearchVisibility(); assert.equal(nodes.following.hidden, true);
});

test('Smart opens Live for a single relevant live game and For You when none are live', () => {
  const { ctx, games } = fixture();
  ctx.state.homeLayout = 'bar'; ctx.store.set('home3', 'auto'); ctx.inMyWorld = g => g.mine;
  vm.runInContext(html.slice(html.indexOf('  function homeTab()'), html.indexOf('  function specialsFor(')), ctx);
  assert.equal(ctx.homeTab(), 'live');
  games[0].state = 'post'; assert.equal(ctx.homeTab(), 'foryou');
});


function selectionFixture() {
  const f = fixture(), { ctx } = f;
  ctx.CLOSE = { Basketball: { minsLeft: 5, margin: 6 }, Football: { minsLeft: 5, margin: 8 }, Hockey: { minsLeft: 5, margin: 1 }, Baseball: { fromInning: 7, margin: 2 }, Soccer: { fromMinute: 85, margin: 1 } };
  ctx.clockSecs = s => { const [m, sec = 0] = String(s).split(':').map(Number); return m * 60 + sec; };
  ctx.mvHome = new Set(); ctx.mvKey = ctx.gameKey;
  vm.runInContext(html.slice(html.indexOf('  function isClose(g)'), html.indexOf('  // Which of YOUR services')), ctx);
  vm.runInContext(html.slice(html.indexOf('  function worthPicks('), html.indexOf('  // Your Day and Bottom Bar keep')), ctx);
  let nextId = 0;
  const make = (sport, period, margin, extra = {}) => {
    const lg = { id: sport.toLowerCase(), name: sport, sport, reg: sport === 'Hockey' ? 3 : sport === 'Baseball' ? 9 : 4, soccer: sport === 'Soccer' };
    const g = { id: String(++nextId), lg, state: 'in', mine: false, date: new Date().toISOString(), period, clock: sport === 'Soccer' ? "65'" : '10:00', teams: [{ name: 'Away', abbr: 'A', score: margin }, { name: 'Home', abbr: 'H', score: 0 }], ...extra };
    g.close = ctx.isClose(g); g.tight = ctx.isTight(g); Object.assign(g, ctx.interest(g)); return g;
  };
  return { ...f, make };
}

test('Worth A Watch applies tight-game boundaries for each sport', () => {
  const { ctx, make } = selectionFixture();
  for (const [sport, period, margin] of [['Football',3,8], ['Basketball',4,8], ['Hockey',3,1], ['Soccer',2,1], ['Baseball',7,2]]) {
    assert.equal(ctx.worthPicks([make(sport,period,margin)]).length, 1, sport);
    assert.equal(ctx.worthPicks([make(sport,period,margin+1)]).length, 0, sport + ' outside margin');
    assert.equal(ctx.worthPicks([make(sport,period-1,margin)]).length, 0, sport + ' too early');
  }
});

test('Overtime, extra innings, ranked clashes and playoffs qualify while blowouts never qualify', () => {
  const { ctx, make } = selectionFixture();
  for (const g of [make('Basketball',5,10), make('Baseball',10,3), make('Football',1,0,{rankedClash:true}), make('Football',1,0,{playoff:true})]) assert.equal(ctx.worthPicks([g]).length,1);
  for (const [sport,period,margin] of [['Football',3,17], ['Basketball',4,20], ['Hockey',3,3], ['Soccer',2,3], ['Baseball',6,6]]) assert.equal(ctx.worthPicks([make(sport,period,margin,{playoff:true,rankedClash:true})]).length,0,sport);
});

test('Upset qualification uses the cached pregame +200 line and only a second-half leader', () => {
  const { ctx, make } = selectionFixture();
  const g = make('Football',1,10,{id:'upset',state:'pre',odds:{ml:{a:200,h:-250}}});
  ctx.pregameML(g); g.state='in'; g.period=3; g.odds.ml.a=-500;
  Object.assign(g,ctx.interest(g));
  assert.match(g.reasons.join(),/Upset Alert/); assert.equal(ctx.worthPicks([g]).length,1);
  g.period=2; Object.assign(g,ctx.interest(g)); assert.equal(ctx.worthPicks([g]).length,0);
});

test('Worth picks prioritize late close games and playoffs, cap at six and exclude owned games', () => {
  const { ctx, make } = selectionFixture();
  const priority = make('Football',4,3,{clock:'2:00'}), exciting = make('Football',3,7); exciting.hype=1000;
  assert.equal(ctx.worthPicks([exciting,priority])[0].id,priority.id);
  assert.equal(ctx.worthPicks(Array.from({length:9},()=>make('Football',3,7))).length,6);
  const owned=make('Football',4,0,{mine:true}); assert.equal(ctx.worthPicks([owned]).length,0);
  const hearted=make('Football',4,0); ctx.state.favGames[ctx.gameKey(hearted)]={}; assert.equal(ctx.worthPicks([hearted]).length,0);
});

test('Home sections are shown by default and first claim follows saved order with no duplicates', () => {
  const { ctx, games } = fixture();
  for (const key of ['mine','worth','live','mv','feature','final']) assert.equal(ctx.beta4SectionShown(key),true);
  const candidate = { ...games[0], id:'worthy', mine:false }; games.push(candidate);
  ctx.worthPicks = gs => gs.filter(g=>g.id==='worthy');
  const mv = gs => ({games:gs.filter(g=>g.state==='in').slice(0,2),html:'quad',available:true});
  let plan=ctx.beta4HomePlan(games,mv);
  assert.equal(plan.sections[0].key,'mine'); assert.equal(plan.sections.find(s=>s.key==='worth').games[0].id,'worthy');
  ctx.store.set('secOrder',['mv','worth','mine','live']); plan=ctx.beta4HomePlan(games,mv);
  assert.equal(plan.sections[0].key,'mv'); assert.ok(plan.sections[0].games.some(g=>g.id==='live'));
  const assigned=plan.sections.flatMap(s=>s.games).map(ctx.gameKey); assert.equal(new Set(assigned).size,assigned.length);
  ctx.store.set('homeSections',{mv:false,worth:false}); plan=ctx.beta4HomePlan(games,mv);
  assert.equal(plan.sections.some(s=>s.key==='mv'||s.key==='worth'),false);
  assert.ok(plan.sections.find(s=>s.key==='live').games.some(g=>g.id==='worthy'));
});

test('Section eligibility excludes unrelated and watched-only leagues, and Live lists every remaining game', () => {
  const { ctx, games } = fixture(); ctx.state.tab='live';
  const live=Array.from({length:12},(_,i)=>({...games[0],id:'other'+i,mine:false,date:new Date(2026,9,21,10,i).toISOString()}));
  const unrelated={...live[0],id:'unrelated',lg:{id:'other'}};
  ctx.state.watched={'other:unrelated':true};
  const plan=ctx.beta4HomePlan([...live,unrelated],()=>({games:[],html:'',available:false}));
  const rest=plan.sections.find(s=>s.key==='live').games; assert.equal(rest.length,12);
  assert.deepEqual(Array.from(rest,g=>g.id),live.map(g=>g.id));
  ctx.state.favGames['other:unrelated']={}; assert.equal(ctx.beta4Eligible(unrelated),true);
});

test('Home section settings expose order, visibility and selection explanations', () => {
  const {ctx}=settingsFixture(); const ui=ctx.beta4SectionSettings();
  for(const key of ['mine','worth','live','mv']) { assert.match(ui,new RegExp('data-b4-section-toggle="'+key+'"')); assert.match(ui,new RegExp('data-sec-mv="'+key+'"')); }
  assert.match(ui,/How Games Are Chosen/); assert.match(ui,/Reset Home Sections/); assert.match(ui,/Lock In My Teams/);
});

test('Worth A Watch renders exactly one reason tag for each card in every view', () => {
  const {ctx,games}=fixture(); const g={...games[0],b4Reason:'Overtime'};
  for(const density of ['simple','compact','expanded']) { ctx.state.density=density; assert.equal((ctx.beta4Rows([g]).match(/class="b4-reason"/g)||[]).length,1); }
});

function multiviewFixture() {
  const f=selectionFixture(), {ctx}=f;
  Object.assign(ctx,{mvSport:'all',mvSlots:[],mvLockedNow:new Set(),mvLocks:new Set(),mvUnpinned:new Set(),mvMode:()=> 'auto',mvLockMine:()=>true,mvRZ:()=>false,mvSave:()=>{},gameRank:()=>0,DEFAULT_TV:{services:[]}});
  ctx.state.tv={services:['youtubetv']}; ctx.state.updatedAt=new Date();
  vm.runInContext(html.slice(html.indexOf('  const mvKey ='),html.indexOf('  function mvTile(')),ctx);
  return f;
}

test('Multiview admits only eligible YouTube TV games live or within 15 minutes and drops blowouts', () => {
  const {ctx,games,make}=multiviewFixture();
  const game=(id,minutes,watch='YouTube TV')=>make('Football',1,0,{id,state:minutes===null?'in':'pre',date:new Date(Date.now()+(minutes||0)*60000).toISOString(),watch:[{app:watch}]});
  const live=game('live',null),soon=game('soon',14),later=game('later',16),stream=game('exclusive',null,'Peacock'),past=game('past',-1),blowout=make('Football',3,17,{watch:[{app:'YouTube TV'}]});
  ctx.state.favLeagues=['football']; games.splice(0,games.length,live,soon,later,stream,past,blowout);
  const pool=ctx.mvPool(); assert.deepEqual(Array.from(pool.live,g=>g.id),['live']); assert.deepEqual(Array.from(pool.soon,g=>g.id),['soon']);
  const allowed=new Set([ctx.gameKey(soon)]); assert.equal(ctx.mvPool(allowed).live.length,0); assert.equal(ctx.mvPool(allowed).soon.length,1);
});

test('Multiview keeps tiles stable until a challenger is clearly better and pins owned games', () => {
  const {ctx,games,make}=multiviewFixture(); ctx.state.favLeagues=['football'];
  const choices=[100,90,80,70,60].map((hype,i)=>({...make('Football',1,0,{id:String(i),watch:[{app:'YouTube TV'}]}),hype}));
  games.splice(0,games.length,...choices);
  let selected=ctx.mvPick(false).tiles.filter(Boolean).map(g=>g.id); assert.deepEqual(Array.from(selected),['0','1','2','3']);
  choices[4].hype=90; selected=ctx.mvPick(false).tiles.filter(Boolean).map(g=>g.id); assert.equal(selected.includes('4'),false);
  choices[4].hype=100; selected=ctx.mvPick(false).tiles.filter(Boolean).map(g=>g.id); assert.equal(selected.includes('4'),true);
  choices[3].mine=true; choices[3].hype=-200; selected=ctx.mvPick(false).tiles.filter(Boolean).map(g=>g.id); assert.equal(selected.includes('3'),true);
});

test('RedZone is restricted to active afternoon NFL windows', () => {
  const {ctx,games,make}=multiviewFixture(); ctx.state.favLeagues=['nfl']; ctx.mvRZOn=()=>true;
  vm.runInContext(html.slice(html.indexOf('  function etMins('),html.indexOf('  function mvRZTile(')),ctx);
  const nfl=(id,date)=>({...make('Football',1,0,{id,date}),lg:{id:'nfl',sport:'Football'}});
  games.splice(0,games.length,nfl('early','2026-10-25T13:30:00Z'),nfl('night','2026-10-26T00:20:00Z')); assert.equal(ctx.mvRZ(),false);
  games.splice(0,games.length,nfl('one','2026-10-25T17:00:00Z'),nfl('two','2026-10-25T20:25:00Z')); assert.equal(ctx.mvRZ(),true);
});

test('Bottom navigation removes Saved while preserving tracked game storage and display', () => {
  assert.doesNotMatch(html,/<button data-bb="saved"/);
  const {ctx,games}=fixture(); ctx.state.favGames['nba:pre']={};
  const body={innerHTML:''},tracked={innerHTML:'',hidden:true};
  ctx.document.getElementById=id=>id==='b4saved-body'?body:id==='b4-tracked-games'?tracked:{classList:{contains:()=>true}};
  ctx.beta4SavedPaint(); assert.match(tracked.innerHTML,/Tracked Games/); assert.match(tracked.innerHTML,/Away pre/); assert.equal(tracked.hidden,false);
});

test('Settings container page metadata does not intercept move or preference buttons', async () => {
  const {ctx}=fixture(); let handler;
  const node={addEventListener:(_,fn)=>{handler=fn;}};
  ctx.document.getElementById=()=>node;
  Object.assign(ctx,{secOrder:()=>ctx.beta4HomeOrder(),applySecOrder:()=>{},renderSettings:()=>{},render:()=>{},setDensity:val=>{ctx.state.density=val;}});
  const start=html.indexOf('  document.getElementById("ssheet").addEventListener("click", async e => {');
  const end=html.indexOf('  // Home Screen apps on iPhone',start);
  vm.runInContext(html.slice(start,end),ctx);
  const container={dataset:{b4SettingsPage:'sections'}};
  const move={dataset:{secMv:'worth',dir:'-1'}};
  await handler({target:{closest:selector=>selector==='[data-sec-mv]'?move:selector==='[data-b4-settings-page]'?container:null}});
  assert.equal(ctx.beta4HomeOrder()[0],'worth');
  const preference={dataset:{set:'density',val:'expanded'}};
  await handler({target:{closest:selector=>selector==='[data-set]'?preference:selector==='[data-b4-settings-page]'?container:null}});
  assert.equal(ctx.state.density,'expanded');
});


test('Empty home sections omit their headings and return automatically when populated', () => {
  const {ctx,games}=fixture();
  ctx.beta4HomeMultiview=()=>({games:[],html:'',available:true});
  let result=ctx.beta4Home([games[1]]);
  assert.match(result, /<h2>Your Teams<\/h2>/);
  for(const title of ['Worth A Watch','You Are Looking Live','Your Multiview']) assert.ok(!result.includes('<h2>'+title+'</h2>'));
  assert.doesNotMatch(result,/No qualifying live games|No other live games|No unclaimed YouTube/);
  assert.equal(ctx.beta4SectionShown('worth'),true);
  const pick={...games[0],id:'pick',mine:false}; games.push(pick); ctx.worthPicks=gs=>gs.filter(g=>g.id==='pick');
  result=ctx.beta4Home(games); assert.match(result,/<h2>Worth A Watch<\/h2>/);
});


test('Starred teams omit hearts in every density and featured games; tracked-only games keep untrack', () => {
  const { ctx, games } = fixture();
  ctx.isFavTeam = (_, abbr) => abbr === 'A';
  for (const density of ['simple', 'compact', 'expanded']) {
    ctx.state.density = density;
    assert.doesNotMatch(ctx.beta4Rows([games[1]]), /data-favgame=/);
    assert.doesNotMatch(ctx.beta4Rows([games[3]]), /data-favgame=/);
  }
  assert.doesNotMatch(ctx.beta4Feature(games).html, /data-favgame=/);
  assert.doesNotMatch(ctx.beta4Card(games[3], 'expanded'), /b4-card-foot/);
  ctx.isFavTeam = () => false;
  ctx.state.favGames['nba:pre'] = true;
  assert.match(ctx.beta4Card(games[1]), /Stop Tracking/);
  assert.match(ctx.beta4Row(games[1]), /Stop Tracking/);
});

test('Next For Your Teams uses shared tiles, correct home/away order and future dates', () => {
  const { ctx, games } = fixture();
  ctx.nextWhen = () => 'Tomorrow · 7:00 PM';
  ctx.state.favs = new Set(['nba:K']);
  ctx.state.favMeta['nba:K'] = { lg: 'nba', id: '1', abbr: 'K', name: 'Kings', logo: 'kings.png' };
  ctx.state.next['nba:K'] = { id: 'tomorrow', date: '2026-10-22T23:00:00Z', at: '@', opp: 'C', oppName: 'Clippers', oppLogo: 'clippers.png' };
  ctx.isFavTeam = (_, abbr) => abbr === 'K';
  const next = ctx.beta4NextGame({ m: ctx.state.favMeta['nba:K'], n: ctx.state.next['nba:K'] });
  assert.equal(next.teams[0].name, 'Kings');
  assert.equal(next.teams[1].logo, 'clippers.png');
  assert.equal(next.state, 'pre');
  assert.equal(next.teams[0].score, '');
  ctx.state.next['nba:K'].at = 'vs';
  assert.equal(ctx.beta4NextGame({ m: ctx.state.favMeta['nba:K'], n: ctx.state.next['nba:K'] }).teams[1].name, 'Kings');
  for (const density of ['simple', 'compact', 'expanded']) {
    ctx.state.density = density;
    const result = ctx.beta4Home(games);
    const section = result.split('<h2>Next For Your Teams</h2>')[1].split('</section>')[0];
    assert.match(section, /Tomorrow · 7:00 PM/);
    assert.match(section, /Kings/);
    assert.match(section, /Clippers/);
    assert.match(section, /data-game="nba:tomorrow"/);
    assert.match(section, density === 'simple' ? /b4-rows/ : /b4-scorecard/);
    assert.doesNotMatch(section, /data-favgame=|ln-nx/);
  }
});

test('Home starts with upcoming collapsed after today’s finals and retains its open state on refresh', () => {
  const { ctx, games } = fixture();
  ctx.nextWhen = () => 'Tomorrow · 7:00 PM';
  ctx.state.favs = new Set(['nba:K']);
  ctx.state.favMeta['nba:K'] = { lg: 'nba', abbr: 'K', name: 'Kings' };
  ctx.state.next['nba:K'] = { id: 'next', date: '2026-10-22T23:00:00Z', at: '@', opp: 'C' };
  let result = ctx.beta4Home(games);
  assert.match(result, /<details class="b4-upcoming-disclosure">/);
  assert.match(result, /See Upcoming/);
  assert.ok(result.indexOf('<h2>Final</h2>') < result.indexOf('<details'));
  assert.doesNotMatch(result, /Customize Home Sections|Manage Alerts/);
  vm.runInContext('b4UpcomingOpen = true', ctx);
  result = ctx.beta4Home(games);
  assert.match(result, /<details class="b4-upcoming-disclosure" open>/);
  assert.match(result, /Hide Upcoming/);
});

test('Search discovery omits the following list even with an empty query', () => {
  const { ctx } = fixture();
  const nodes = { sheet: { dataset: { b4Area: 'search' }, classList: { contains: () => false } }, q: { value: '' }, following: {}, 'b4-following-heading': {} };
  ctx.document.getElementById = id => nodes[id];
  ctx.beta4SearchVisibility();
  assert.equal(nodes.following.hidden, true);
  assert.equal(nodes['b4-following-heading'].hidden, true);
});

function navigationFixture() {
  const {ctx} = fixture();
  const nodes = {};
  for (const id of ['sheet', 'ssheet', 'q']) nodes[id] = {
    hidden: false, value: '', scrollTop: 0,
    classList: { contains: () => false },
    querySelector() { return this; }
  };
  ctx.document.getElementById = id => nodes[id];
  ctx.BB_SHEETS = { search: 'sheet', teams: 'sheet', settings: 'ssheet' };
  ctx.renderSettings = () => {};
  ctx.beta4SearchVisibility = () => {};
  ctx.search = () => {};
  vm.runInContext(html.slice(html.indexOf('  const bbPlaces = new Map();'), html.indexOf('  function bbGo(act) {')), ctx);
  return {ctx, nodes};
}

test('Search keeps its query and scroll position when the shared Teams sheet changes', () => {
  const {ctx, nodes} = navigationFixture();
  let searches = 0; ctx.search = () => { searches++; };
  nodes.q.value = 'Knicks'; nodes.sheet.scrollTop = 240;
  ctx.bbRemember('search');
  nodes.q.value = ''; nodes.sheet.scrollTop = 80;
  ctx.bbRemember('teams');
  ctx.bbRestore('search');
  assert.equal(nodes.q.value, 'Knicks');
  assert.equal(nodes.sheet.scrollTop, 240);
  assert.equal(searches, 1);
  ctx.bbRestore('teams');
  assert.equal(nodes.sheet.scrollTop, 80);
});

test('Settings restores its subpage and scroll position after changing tabs', () => {
  const {ctx, nodes} = navigationFixture();
  vm.runInContext('b4SettingsPage = "tv"', ctx);
  nodes.ssheet.scrollTop = 150; ctx.bbRemember('settings');
  vm.runInContext('b4SettingsPage = "root"', ctx);
  nodes.ssheet.scrollTop = 0; ctx.bbRestore('settings');
  assert.equal(vm.runInContext('b4SettingsPage', ctx), 'tv');
  assert.equal(nodes.ssheet.scrollTop, 150);
});

test('Team editors do not overwrite the parent tab position', () => {
  const {ctx, nodes} = navigationFixture();
  nodes.sheet.scrollTop = 320; ctx.bbRemember('teams');
  nodes.sheet.classList.contains = value => value === 'sub';
  nodes.sheet.scrollTop = 0; ctx.bbRemember('teams');
  ctx.bbRestore('teams');
  assert.equal(nodes.sheet.scrollTop, 320);
});

test('My Teams uses shared game tiles in each density and deduplicates followed opponents', () => {
  const {ctx, body} = fixture();
  ctx.state.favs = new Set(['nba:A', 'nba:B']);
  ctx.state.favMeta = {
    'nba:A': {lg:'nba', abbr:'A', name:'Away'},
    'nba:B': {lg:'nba', abbr:'B', name:'Home'}
  };
  const date = new Date(Date.now()+86400000).toISOString();
  ctx.state.next = {
    'nba:A': {id:'shared', date, at:'@', opp:'B', oppName:'Home'},
    'nba:B': {id:'shared', date, at:'vs', opp:'A', oppName:'Away'}
  };
  ctx.nextWhen = () => 'Tomorrow · 7:00 PM';
  for (const [density, css] of [['simple','b4-rows'],['compact','b4-cards-compact'],['expanded','b4-cards-expanded']]) {
    ctx.state.density = density; ctx.beta4TeamUpcomingPaint();
    assert.match(body.innerHTML, new RegExp(css));
    assert.equal((body.innerHTML.match(/data-game="nba:shared"/g)||[]).length,1);
    assert.match(body.innerHTML, /1 Game/);
    assert.match(body.innerHTML, /Tomorrow · 7:00 PM/);
    assert.doesNotMatch(body.innerHTML, /class="b4-team-next"/);
  }
});

test('My Teams separates schedule errors, off-season teams and loading states and keeps Retry', () => {
  const {ctx,body} = fixture();
  ctx.state.favs = new Set(['nba:A','nba:B','nba:C']);
  ctx.state.favMeta = {'nba:A':{name:'A <team>'},'nba:B':{name:'B'},'nba:C':{name:'C'}};
  ctx.state.next = {'nba:A':{error:true},'nba:B':{none:true}};
  ctx.beta4TeamUpcomingPaint();
  assert.match(body.innerHTML,/Team Schedules/);
  assert.match(body.innerHTML,/Schedule unavailable/);
  assert.match(body.innerHTML,/No upcoming game scheduled/);
  assert.match(body.innerHTML,/Checking schedule…/);
  assert.match(body.innerHTML,/A &lt;team&gt;/);
  assert.match(body.innerHTML,/data-b4-retry-teams/);
  assert.doesNotMatch(body.innerHTML,/Next For Your Teams/);
});

function golfFixture() {
  const {ctx} = fixture();
  ctx.str = v => v == null ? '' : typeof v === 'object' ? (v.displayValue ?? v.value ?? '') : String(v);
  ctx.evState = ev => ev.status?.type || {};
  ctx.SHAREIC = '<svg></svg>';
  ctx.watchOptions = () => [];
  vm.runInContext(html.slice(html.indexOf('  function parseGolf(ev, lg) {'), html.indexOf('  function parseRace')),ctx);
  vm.runInContext(html.slice(html.indexOf('  function beta4GolfView(e) {'), html.indexOf('  document.addEventListener("click", e => {',html.indexOf('  function beta4GolfView(e) {'))),ctx);
  return ctx;
}

test('Golf derives tied positions and holes completed from the current round only', () => {
  const ctx = golfFixture();
  const player = (id,total,holes) => ({id,athlete:{displayName:'Player '+id,shortName:'P. '+id},score:total,linescores:[{period:1,displayValue:total,linescores:Array.from({length:holes},()=>({value:4}))},{period:2}]});
  const e=ctx.parseGolf({id:'event',status:{type:{state:'in'}},competitions:[{status:{period:1,type:{state:'in',detail:'Round 1 - In Progress'}},broadcasts:[{names:['Golf Chnl']}],competitors:[player('1','-7',11),player('2','-7',18),player('3','-6',9)]}]},{id:'pga',name:'PGA Tour',short:'PGA'});
  assert.deepEqual(Array.from(e.rows,r=>r.pos),['T1','T1','3']);
  assert.deepEqual(Array.from(e.rows,r=>r.thru),['11','F','9']);
  assert.equal(e.rows[0].today,'-7');
  assert.equal(e.broadcast,'Golf Channel');
  assert.equal(e.round,1);
  assert.match(e.rows[0].headshot,/golf\/players\/full\/1.png/);
});

test('Golf does not reuse a previous round score or invent scores for unstarted players', () => {
  const ctx=golfFixture();
  const e=ctx.parseGolf({competitions:[{status:{period:2,type:{state:'pre'}},competitors:[{athlete:{displayName:'Not started'},linescores:[{period:1,displayValue:'-3'},{period:2}]}]}]},{id:'pga'});
  assert.equal(e.rows[0].today,''); assert.equal(e.rows[0].thru,''); assert.equal(e.rows[0].pos,'');
});

test('Tournament view renders the full field with escaped names and accessible columns', () => {
  const ctx=golfFixture();
  const e={id:'event',lg:{id:'pga',name:'PGA Tour',short:'PGA'},name:'Cup <test>',round:2,state:'in',detail:'Round 2 - In Progress',broadcast:'Golf Channel',rows:Array.from({length:120},(_,i)=>({pos:String(i+1),name:'Player '+i,shortName:'P. '+i,total:'-2',today:'E',thru:'5'}))};
  const result=ctx.beta4GolfView(e);
  assert.equal((result.match(/<th scope="row">/g)||[]).length,120);
  assert.match(result,/Cup &lt;test&gt;/); assert.match(result,/R2<\/th>/);
  assert.match(result,/Round 2 · In Progress/); assert.match(result,/Live on Golf Channel/);
  assert.match(result,/aria-pressed="false"/); assert.match(result,/Back to Scores/);
  assert.doesNotMatch(result,/undefined/);
});

test('Unstarted even-par golfers do not inflate the ranks of players above par', () => {
  const ctx=golfFixture();
  const e=ctx.parseGolf({competitions:[{status:{period:1,type:{state:'in'}},competitors:[{id:'1',athlete:{displayName:'Playing'},score:'+1',linescores:[{period:1,displayValue:'+1',linescores:[{value:5}]}]},{id:'2',athlete:{displayName:'Waiting'},score:'E',linescores:[{period:1,displayValue:'-'}]}]}]},{id:'pga'});
  assert.equal(e.rows[0].pos,'1');
  assert.equal(e.rows[1].pos,'');
  assert.equal(e.rows[1].total,'');
});

test('Player scorecards keep future holes blank and distinguish birdies, eagles and bogeys', () => {
  const ctx=golfFixture();
  const player={rounds:[{period:1,linescores:[{period:1,value:3,scoreType:{displayValue:'-1'}},{period:2,value:3,scoreType:{displayValue:'-2'}},{period:3,value:4,scoreType:{displayValue:'+1'}},{period:4,value:6,scoreType:{displayValue:'+2'}}]}]};
  const holes=ctx.beta4GolfHoles(player,1,{});
  assert.deepEqual(Array.from(holes.slice(0,4),h=>h.par),[4,5,3,4]);
  assert.equal(holes[4].value,null); assert.equal(holes[4].par,null);
  const result=ctx.beta4GolfScorecard(player,1,{});
  for(const kind of ['birdie','eagle','bogey','double'])assert.match(result,new RegExp('b4-gp-stroke '+kind));
  assert.match(result,/Front nine scorecard/);assert.match(result,/Back nine scorecard/);
  assert.match(result,/<td>16<\/td>/);
  assert.doesNotMatch(result,/undefined|NaN/);
});

test('Player performance uses tournament statistics and preserves legitimate zero values', () => {
  const ctx=golfFixture();
  const result=ctx.beta4GolfPlayerStats({scope:'all',round:1,player:{rounds:[]},stats:{splits:{categories:[{stats:[{name:'strokesGainedPutting',displayValue:'0.000',rankDisplayValue:'T5'},{name:'driveAccuracyPct',displayValue:'70'}]}]}}});
  assert.match(result,/SG: Putting<\/th><td>0.000<\/td><td>T5/);
  assert.match(result,/Driving Accuracy<\/th><td>70%/);
  assert.match(result,/SG: Off The Tee<\/th><td>–/);
  assert.match(result,/Performance/);assert.match(result,/Scoring/);
});

test('Playing groups exclude golfers starting on a different tee at the same time', async () => {
  const ctx=golfFixture();ctx.beta4GolfPlayerPaint=()=>{};
  const rows=[{id:'a',teeGroup:'tee'},{id:'b',teeGroup:'tee'},{id:'c',teeGroup:'tee'}];
  const v={event:{id:'event',lg:{id:'pga'},rows},player:rows[0],status:{teeTime:'2026-10-22T11:08Z',startHole:1}};
  ctx.testView=v;vm.runInContext('b4Golfer=testView',ctx);
  ctx.beta4GolfJSON=async url=>({teeTime:'2026-10-22T11:08Z',startHole:url.includes('/b/')?1:10});
  await ctx.beta4GolfLoadGroup();
  assert.deepEqual(Array.from(v.group,p=>p.id),['a','b']);
  assert.equal(v.groupLoading,false);
});

test('Late player data cannot repaint a player page that has been closed', async () => {
  const ctx=golfFixture();let paints=0,resolve;
  ctx.beta4GolfPlayerPaint=()=>{paints++;};
  ctx.beta4GolfJSON=()=>new Promise(r=>{resolve=r;});
  ctx.testView={event:{id:'event',lg:{id:'pga'}},player:{id:'a'},scope:'all'};
  vm.runInContext('b4Golfer=testView',ctx);
  const request=ctx.beta4GolfLoadStats();
  vm.runInContext('b4Golfer=null',ctx);
  resolve({splits:{categories:[]}});await request;
  assert.equal(paints,1);assert.equal(ctx.testView.stats,undefined);
});

test('Golf previews remove Hot and open the in-app leaderboard', () => {
  const ctx=golfFixture();ctx.block=(_id,_title,_meta,body)=>body;
  vm.runInContext(html.slice(html.indexOf('  function toPar('),html.indexOf('  function beta4GolfView(')),ctx);
  const result=ctx.golfBlock({lg:{id:'pga',name:'PGA Tour'},id:'event',state:'in',detail:'Live',rows:[{name:'Leader',today:'-7',total:'-7'}],link:'https://espn.com/leaderboard'});
  assert.doesNotMatch(result,/Hot|why hot|href=/);
  assert.match(result,/data-b4-golf-open="pga\|event"/);
});

test('Tee times separate simultaneous groups starting at different tees and sort chronologically', () => {
  const ctx=golfFixture();
  const e={rows:[{id:'a'},{id:'b'},{id:'c'},{id:'d'}]};
  const statuses=new Map([
    ['a',{teeTime:'2026-10-22T11:08Z',startHole:10}],
    ['b',{teeTime:'2026-10-22T10:35Z',startHole:1}],
    ['c',{teeTime:'2026-10-22T11:08Z',startHole:1}],
    ['d',{teeTime:'2026-10-22T11:08Z',startHole:1}]
  ]);
  const groups=ctx.beta4GolfTeeGroups(e,statuses);
  assert.equal(groups.length,3);
  assert.equal(groups[0].time,'2026-10-22T10:35Z');
  assert.deepEqual(Array.from(groups[1].players,p=>p.player.id),['c','d']);
  assert.equal(groups[2].tee,10);
});

test('Tee-time status shows only supported progress and retains withdrawals', () => {
  const ctx=golfFixture();
  assert.equal(ctx.beta4GolfTeeStatus({thru:12,type:{state:'in'}},{}),'Thru 12');
  assert.equal(ctx.beta4GolfTeeStatus({thru:18,type:{state:'post'}},{}),'Finished');
  assert.equal(ctx.beta4GolfTeeStatus({type:{state:'pre'}},{}),'Scheduled');
  assert.equal(ctx.beta4GolfTeeStatus({type:{name:'STATUS_WITHDRAWN',description:'Withdrawn'}},{}),'Withdrawn');
});

test('Tee-time requests use six workers at most, reuse fresh data and retry failures', async () => {
  const ctx=golfFixture();ctx.state.tab='pga';
  const event={id:'event',lg:{id:'pga'},round:1,rows:Array.from({length:14},(_,id)=>({id:String(id+1),name:'Player '+id}))};
  ctx.testEvent=event;vm.runInContext("b4GolfTournamentTabs.set('pga:event','tees')",ctx);
  ctx.document.getElementById=()=>null;
  let active=0,max=0,calls=0,fail=true;
  ctx.beta4GolfJSON=async url=>{calls++;active++;max=Math.max(max,active);await Promise.resolve();active--;if(fail && url.includes('/3/status'))throw new Error('offline');return {period:1,teeTime:'2026-10-22T11:00Z',startHole:1};};
  await ctx.beta4GolfLoadTeeTimes(event);
  assert.ok(max<=6);assert.equal(calls,14);
  let entry=vm.runInContext("b4GolfTeeCache.get('pga:event:1')",ctx);
  assert.equal(entry.statuses.size,13);assert.equal(entry.errors.size,1);
  await ctx.beta4GolfLoadTeeTimes(event);assert.equal(calls,14);
  fail=false;await ctx.beta4GolfLoadTeeTimes(event,true);
  assert.equal(calls,15);assert.equal(entry.statuses.size,14);assert.equal(entry.errors.size,0);
});

test('Player sections place Group after Stats and keep Favorite in the action row', () => {
  const ctx=golfFixture();
  const node={innerHTML:'',scrollTop:0,classList:{add(){}}};ctx.document.getElementById=()=>node;
  ctx.testView={event:{lg:{id:'pga',name:'PGA Tour'},name:'Cup',round:1,state:'in'},player:{id:'1',name:'Player',rounds:[]},round:1,tab:'scorecard'};
  vm.runInContext('b4Golfer=testView',ctx);ctx.beta4GolfPlayerPaint();
  const nav=node.innerHTML.match(/<nav class="b4-gp-tabs"[\s\S]*?<\/nav>/)[0];
  assert.ok(nav.indexOf('Scorecard')<nav.indexOf('Stats'));
  assert.ok(nav.indexOf('Stats')<nav.indexOf('Group'));
  assert.doesNotMatch(node.innerHTML,/data-b4-gp-group/);
  assert.match(node.innerHTML,/<div class="b4-gp-actions"><button data-b4-gp-favorite/);
});

test('Tournament action row uses configured streaming destinations and escapes their labels', () => {
  const ctx=golfFixture();
  let networks;ctx.watchOptions=nets=>{networks=nets;return [{url:'https://tv.example.test/',app:'YouTube <TV>',scheme:'youtubetv://'}];};
  const result=ctx.beta4GolfView({id:'event',lg:{id:'pga',name:'PGA Tour',short:'PGA'},name:'Cup',round:1,state:'in',rows:[],broadcast:'Golf Channel'});
  assert.equal(networks[0].name,'Golf Channel');
  assert.match(result,/Watch On YouTube &lt;TV&gt;/);
  assert.match(result,/data-app="youtubetv:\/\/"/);
  assert.ok(result.indexOf('b4-golf-actions')>result.indexOf('</header>'));
  assert.ok(result.indexOf('b4-golf-actions')<result.indexOf('<nav'));
});
