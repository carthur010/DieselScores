/* Shared PGA statistics cache reader for Live and Beta 3/4. */
(function(root) {
  'use strict';
  const scriptURL = typeof document !== 'undefined' && document.currentScript?.src;
  const localURL = scriptURL ? new URL('../data/pga-stats.json', scriptURL).href : '../data/pga-stats.json';
  const remoteURL = 'https://raw.githubusercontent.com/carthur010/TheLineup/main/data/pga-stats.json';
  const ids = {'SG: Off The Tee':'02567','SG: Approach to Green':'02568','SG: Around The Green':'02569','SG: Putting':'02564','SG: Total':'02675','Driving Accuracy':'102','Longest Drive':'159','Greens in Regulation':'103','Sand Saves':'111','Scrambling':'130','Putts per GIR':'104','Feet of Putts Made':'438','Eagles':'106','Birdies':'107','Pars':'1005','Bogeys':'1002'};
  let cached, cachedAt=0, pending;
  const valid = s => s && s.total != null && !['','-','--','–'].includes(String(s.total).trim());
  function find(player, scope, category, label) {
    const rows = player?.rounds?.[String(scope)]?.[category] || {};
    const stat = rows[ids[label]] || Object.values(rows).find(s=>s.label?.toLowerCase()===label.toLowerCase());
    return valid(stat) ? {...stat, rank: String(stat.rank || '').trim().replace(/^--?$/, '–') || '–'} : null;
  }
  async function load(eventId, playerId) {
    try {
      if(!cached || Date.now()-cachedAt>60000) {
        if(!pending) pending=(async()=>{
          const base = typeof location !== 'undefined' && location.hostname.endsWith('github.io') ? remoteURL : localURL;
          const r=await fetch(base+'?v='+Math.floor(Date.now()/60000),{signal:AbortSignal.timeout(12000)});
          if(!r.ok) throw new Error('PGA cache unavailable');
          const data=await r.json();
          if(data.version!==1 || !data.events || !Number.isFinite(Date.parse(data.fetchedAt))) throw new Error('Invalid PGA cache');
          cached=data;cachedAt=Date.now();
        })().finally(()=>{pending=null;});
        await pending;
      }
      const event=cached.events[String(eventId)], player=event?.players?.[String(playerId)];
      return player ? {...player,fetchedAt:cached.fetchedAt,source:'PGA Tour'} : null;
    } catch { return null; }
  }
  function note(player) {
    if(!player?.fetchedAt) return '';
    const date=new Date(player.fetchedAt);
    const old=Date.now()-date.getTime()>20*60000;
    return 'PGA Tour · '+(old?'Cached ':'Updated ')+date.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+'. Unavailable statistics appear as a dash.';
  }
  function render(player,scope,esc,scoring={}) {
    const table=(title,labels,category)=>`<h4 class="gp-h">${title}</h4><table class="gp-official-stats"><thead><tr><th>Stat</th><th>Total</th><th>Rank</th></tr></thead><tbody>${labels.map(label=>{const s=find(player,scope,category,label);return `<tr><th scope="row">${esc(label)}</th><td>${esc(s?.total ?? (category==='scoring' ? scoring[label] : null) ?? '–')}</td><td>${esc(s?.rank ?? '–')}</td></tr>`;}).join('')}</tbody></table>`;
    return `<p class="gp-cache-note">${esc(note(player))}</p>`+table('Performance',[...Object.keys(ids).slice(0,11),'Feet of Putts Made'],'performance')+table('Scoring',['Eagles','Birdies','Pars','Bogeys','Double Bogeys','Other'],'scoring');
  }
  root.LineupGolfStats={load,find,note,render};
  if(typeof module!=='undefined') module.exports=root.LineupGolfStats;
})(typeof globalThis!=='undefined'?globalThis:this);
