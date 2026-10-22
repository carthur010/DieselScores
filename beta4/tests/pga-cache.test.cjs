const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../../assets/pga-stats.js'),'utf8');
const sample=JSON.parse(fs.readFileSync(path.join(__dirname,'../../data/pga-stats.json'),'utf8'));
const esc=s=>String(s).replaceAll('<','&lt;');
function fixture(response=sample){let calls=0;const ctx={Date,URL,AbortSignal,fetch:async()=>{calls++;return {ok:true,json:async()=>response}}};vm.createContext(ctx);vm.runInContext(code,ctx);return {api:ctx.LineupGolfStats,calls:()=>calls};}
test('PGA cache isolates event/player IDs and shares one request across players',async()=>{
 const {api,calls}=fixture(),event=Object.keys(sample.events)[0],ids=Object.keys(sample.events[event].players);
 const [a,b]=await Promise.all([api.load(event,ids[0]),api.load(event,ids[1])]);assert.ok(a&&b);assert.equal(calls(),1);
 assert.equal(await api.load('wrong-event',ids[0]),null);assert.equal(await api.load(event,'unknown-player'),null);
});
test('PGA mapping preserves zero, negative SG, ties and round boundaries',()=>{
 const {api}=fixture();const p={rounds:{all:{performance:{'02564':{total:'-1.354',rank:' T5 '},'111':{total:'0%',rank:'T1'}}},1:{performance:{'02564':{total:'0',rank:'1'}}}}};
 assert.equal(api.find(p,'all','performance','SG: Putting').rank,'T5');assert.equal(api.find(p,1,'performance','SG: Putting').total,'0');assert.equal(api.find(p,2,'performance','SG: Putting'),null);assert.equal(api.find(p,'all','performance','Sand Saves').total,'0%');
});
test('PGA rendering keeps missing putt distances blank, escapes data and retains derived zero counts',()=>{
 const {api}=fixture();const p={fetchedAt:new Date().toISOString(),rounds:{all:{performance:{'159':{total:'<bad>',rank:'1'}},scoring:{}}}};
 const html=api.render(p,'all',esc,{'Double Bogeys':0});assert.match(html,/&lt;bad>/);assert.match(html,/Feet of Putts Made<\/th><td>–/);assert.match(html,/Double Bogeys<\/th><td>0/);
});
test('Malformed cache and fetch failures fall back without throwing',async()=>{assert.equal(await fixture({}).api.load('1','2'),null);});
