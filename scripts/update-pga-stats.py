#!/usr/bin/env python3
"""Publish a small, public PGA stats cache. Uses only PGA's public website data."""
import base64, concurrent.futures, datetime as dt, gzip, json, re, sys, time, unicodedata, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'data/pga-stats.json'
ENDPOINT = 'https://orchestrator.pgatour.com/graphql'

def request(url, body=None, headers=None):
    h = {'User-Agent': 'TheLineup-PGA-stats/1.0', **(headers or {})}
    if body is not None:
        body = json.dumps(body).encode(); h['Content-Type'] = 'application/json'
    for attempt in range(2):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=body, headers=h), timeout=25) as r:
                return r.read().decode()
        except Exception:
            if attempt: raise
            time.sleep(1)

def norm(value):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower())

def normalized_stats(payload):
    rounds = {}
    for rd in payload.get('rounds', []):
        key = 'all' if str(rd['round']) == '-1' else str(rd['round'])
        groups = {}
        for category in ['performance', 'scoring']:
            groups[category] = {str(s['statId']): {'label': s.get('label', ''), 'total': str(s.get('total', '')).strip(), 'rank': str(s.get('rank', '')).strip()} for s in rd.get(category, []) if s.get('statId') and s.get('total') is not None}
        rounds[key] = groups
    return rounds

def main():
    html = request('https://www.pgatour.com/leaderboard')
    page = json.loads(re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.S)[1])
    queries = page['props']['pageProps']['dehydratedState']['queries']
    board = next(q['state']['data'] for q in queries if q['queryKey'][0] == 'leaderboard')
    tournament = next(q['state']['data'] for q in queries if q['queryKey'][0] == 'tournament' and q['state']['data']['id'] == board['tournamentId'])
    espn = json.loads(request('https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard'))
    def event_matches(e):
        if norm(e.get('name', '')) != norm(tournament['tournamentName']): return False
        a = dt.datetime.fromisoformat(e['date'].replace('Z', '+00:00')).date()
        # The PGA tournament ID carries the season. Dates additionally fence off another edition.
        year = int(tournament['seasonYear'])
        return a.year == year and abs((a - dt.datetime.now(dt.timezone.utc).date()).days) <= 8
    events = [e for e in espn.get('events', []) if event_matches(e)]
    if len(events) != 1: raise RuntimeError('Cannot uniquely match current PGA and ESPN tournament; retaining prior cache')
    event = events[0]
    names = {}
    for row in board['players']:
        player = row.get('player', {})
        if player.get('id'):
            names.setdefault(norm(player.get('displayName', '')), []).append(player)
    pairs = []
    for c in event.get('competitions', [{}])[0].get('competitors', []):
        athlete = c.get('athlete', {})
        matches = names.get(norm(athlete.get('displayName', '')), [])
        if len(matches) == 1:
            pairs.append((str(c.get('id') or athlete['id']), matches[0]))
    if not pairs: raise RuntimeError('No unambiguous player matches; retaining prior cache')
    script_url = re.search(r'<script[^>]+src="([^"]*/_app-[^"]+\.js)"', html)[1]
    js = request(script_url)
    # The website publishes this browser key. Discover on each run; never persist it.
    api_key = re.search(r'"prod":\{"comment":"[^"]+","apiKey":"([^"]+)"', js)[1]
    headers = {'x-api-key': api_key, 'x-pgat-platform': 'web'}
    def batch(group):
        selections = ' '.join('p'+p['id']+': scorecardStatsV3Compressed(id:'+json.dumps(board['tournamentId'])+',playerId:'+json.dumps(p['id'])+'){payload}' for _, p in group)
        response = json.loads(request(ENDPOINT, {'query': '{'+selections+'}'}, headers))
        if not response.get('data'): raise RuntimeError('PGA statistics returned no data')
        result = {}
        for espn_id, player in group:
            packed = (response['data'].get('p'+player['id']) or {}).get('payload')
            if not packed: continue
            payload = json.loads(gzip.decompress(base64.b64decode(packed)))
            rounds = normalized_stats(payload)
            if rounds:
                result[espn_id] = {'pgaPlayerId': player['id'], 'name': player['displayName'], 'rounds': rounds}
        return result
    groups = [pairs[i:i+12] for i in range(0, len(pairs), 12)]
    players = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for result in pool.map(batch, groups): players.update(result)
    if not players: raise RuntimeError('No statistics returned; retaining prior cache')
    cache = {'version': 1, 'source': 'PGA Tour', 'fetchedAt': dt.datetime.now(dt.timezone.utc).isoformat(), 'events': {str(event['id']): {'pgaTournamentId': board['tournamentId'], 'name': tournament['tournamentName'], 'players': players}}}
    # Never publish partial output after an exception. Replace only after all batches succeeded.
    DEST.parent.mkdir(exist_ok=True)
    temporary = DEST.with_suffix('.tmp'); temporary.write_text(json.dumps(cache, separators=(',', ':'))+'\n'); temporary.replace(DEST)
    print(f"Cached {len(players)} players for {tournament['tournamentName']} ({event['id']})")

if __name__ == '__main__': main()
