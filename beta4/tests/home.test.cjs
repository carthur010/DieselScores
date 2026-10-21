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
  const body = { innerHTML: '' };
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
    isMine: g => g.mine,
    isFavTeam: () => false,
    byState: (a, b) => ({ in: 0, pre: 1, post: 2 }[a.state] - { in: 0, pre: 1, post: 2 }[b.state]),
    esc: s => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'),
    netLabel: () => 'NBA League Pass', isToday: () => true,
    HEART: '<svg></svg>', HEART_ON: '<svg></svg>', IC3: {},
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
  const { ctx, games } = fixture();
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
  assert.doesNotMatch(body.innerHTML, /unavailable|Loading your saved games/);
});
test('failed saved requests keep a retry action', async () => {
  const { ctx, body } = fixture(); ctx.state.favGames['nba:missing'] = {};
  ctx.fetch = async () => { throw new Error('offline'); };
  await ctx.beta4LoadSaved();
  assert.match(body.innerHTML, /1 saved game is unavailable/);
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
    Date, placeName: () => '', ymd: () => '20261022',
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
