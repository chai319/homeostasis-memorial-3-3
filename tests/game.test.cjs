const fs=require('fs'),vm=require('vm'),path=process.argv[2]||require('path').resolve(__dirname,'..')+'/';
const element=()=>({innerHTML:'',value:'',appendChild(){},remove(){},onsubmit:null});let cache={app:element(),bgm:{pause(){},play(){return Promise.resolve()},volume:0,src:''}};let ctx={window:{},console,Date,Set,Math,JSON,confirm:()=>true,localStorage:{setItem(){},getItem(){return null}},document:{getElementById(id){return cache[id]||(cache[id]=element())},createElement:element,body:element(),addEventListener(){}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path+'characters-data.js','utf8'),ctx);vm.runInContext(fs.readFileSync(path+'audio-player.js','utf8'),ctx);Object.assign(ctx.window,{performance:{now:()=>0},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){}});vm.runInContext(fs.readFileSync(path+'game.js','utf8'),ctx);let test=`
if(DAYS.length!==42||DAYS[0]!=='4/8'||DAYS[41]!=='6/21') throw Error('calendar '+DAYS);
for(const c of C){
 state=fresh('テスト','その他',c.gender); let p=state.cs[c.id];
 for(let d=0;d<42;d++){
  state.day=d;state.phase='afternoon';state.scene=null;
  // Raise each required skill with actual action increments, then visit this student.
  let need=Object.entries(c.stats).find(([k,v])=>state.stats[k]<v-10);
  if(need){let loc=Object.entries(LOC).find(([k,v])=>v[1]===need[0]);state.stats[loc[1][1]]=clamp(state.stats[loc[1][1]]+8,0,120)}
  else {state.stats[LOC[c.place][1]]=clamp(state.stats[LOC[c.place][1]]+8,0,120);meet(c);if(state.scene){let opts=state.scene.options||[];let idx=opts.findIndex(x=>x.kind==='寄');sceneChoice(idx<0?0:idx);if(state.scene)sceneChoice(0)}if(p.notes>=2&&!p.solved){p.solved=true;add(c,5,0,2)}add(c,4,4,0)}
  if(d%4===3){let needNight=Object.entries(c.stats).find(([k,v])=>state.stats[k]<v-10);if(needNight)state.stats[needNight[0]]=clamp(state.stats[needNight[0]]+7,0,120)}
 }
 if(!qualified(c))throw Error('unreachable '+c.name+' '+conditions(c));if(p.events.length!==4)throw Error('events '+c.name+' '+p.events);
 state.phase='final';render();if(!app.innerHTML.includes(c.name))throw Error('ending menu '+c.name);
}
for(let player of ['男','女','その他'])for(let pref of ['男','女','両方']){state=fresh('空',player,pref);for(let c of C){let expected=pref==='両方'||c.gender===pref;if(eligible(c)!==expected)throw Error('filter');if(!state.cs[c.id])throw Error('missing')}}
state=fresh('空','女','両方'); if(unique('{name}{chan}')!=='空ちゃん')throw Error('suffix');
console.log('PASS: 42 days; 15 independently reachable routes and 4 events each; all 9 player/preference combinations; address suffix');`;
vm.runInContext(test,ctx);
vm.runInContext(`
state=fresh('場面テスト','その他','両方');state.phase='afternoon';render();
if(!app.innerHTML.includes('scene-cutin'))throw Error('missing initial cut-in');
render();if(app.innerHTML.includes('scene-cutin'))throw Error('cut-in repeated on redraw');
state.phase='people';state.location='roof';render();
if(!app.innerHTML.includes('scene-cutin')||!app.innerHTML.includes('放課後 · 屋上'))throw Error('missing location cut-in');
meet(C.find(c=>c.id==='c03_gaku'));
if(app.innerHTML.includes('scene-cutin'))throw Error('cut-in interrupts same-location conversation');
state.scene=null;state.phase='walk';render();
if(!app.innerHTML.includes('scene-cutin'))throw Error('missing walk-home cut-in');
state.phase='night';render();if(!app.innerHTML.includes('scene-cutin'))throw Error('missing night cut-in');
state.day=2;state.phase='afternoon';render();if(!app.innerHTML.includes('scene-cutin'))throw Error('missing next-day cut-in');
const html=stage('roof','test',C[0],'blush');
if(!html.includes('assets/chars-alpha/c01_naibun_blush.png')||html.includes('mask-image'))throw Error('old silhouette mask remains');
console.log('PASS: date/location/time cut-ins; no repeated cut-in within a conversation; native alpha sprite rendering');
`,ctx);
