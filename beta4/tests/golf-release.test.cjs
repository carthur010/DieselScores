const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
for(const file of ['index.html','beta3/index.html']) {
 function fixture() {
  const html=fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
  const code=html.slice(html.indexOf('  // ---- Golf tournament page'),html.indexOf('  const isWeekly'));
  const el={innerHTML:'',scrollTop:0};
  const ctx={LG:{pga:{id:'pga',name:'PGA Tour'}},LG_LOGO:{},state:{favLeagues:[]},store:{get:(_,d)=>d},document:{getElementById:()=>el},esc:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),XIC:'X',SHAREIC:'Share',STAR:'★',STAR_O:'☆',watchOptions:()=>[{app:'YouTube TV',url:'https://tv.youtube.com/',scheme:'youtubetv://'}],timeLabel:()=> '7:08 AM'};
  vm.createContext(ctx);vm.runInContext(code+'\nthis.paintGolf=paintGolf;this.paintGolfPlayer=paintGolfPlayer;this.setGolf=x=>golfView=x;',ctx);
  const player={id:'1',name:'B. Kohles',full:'Ben Kohles',pos:'T1',tot:'-7',rd:'-7',thru:'11',tee:'time',startHole:1};
  const gv={id:'pga',data:{name:'Tournament',state:'in',round:1,detail:'Round 1 · In Progress',net:'Golf Channel',players:[player]},tab:'lb'};
  ctx.setGolf(gv);return {ctx,el,gv};
 }
 test(file+': tournament actions remain outside the hero and use streaming preferences',()=>{
  const {ctx,el,gv}=fixture();ctx.paintGolf(gv);
  assert.match(el.innerHTML,/class="gf-watch" href="https:\/\/tv.youtube.com\/"/);
  assert.match(el.innerHTML,/data-app="youtubetv:\/\/"/);
  assert.ok(el.innerHTML.indexOf('class="gf-actions"')>el.innerHTML.indexOf('class="gf-net"'));
  gv.data.state='post';ctx.paintGolf(gv);assert.doesNotMatch(el.innerHTML,/class="gf-watch"/);
 });
 test(file+': Group is a section after Stats and displays the playing group',()=>{
  const {ctx,gv}=fixture();gv.player={id:'1',tab:'group',sum:{},round:1};
  const html=ctx.paintGolfPlayer(gv);
  assert.ok(html.indexOf('data-gp-tab="group"')>html.indexOf('data-gp-tab="stats"'));
  assert.doesNotMatch(html,/data-gp-group/);assert.match(html,/Playing Alone/);
  assert.match(html,/class="gp-header"/);assert.match(html,/data-gp-fav/);
 });
}
