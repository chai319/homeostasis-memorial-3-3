const fs=require('fs'),vm=require('vm'),assert=require('assert');
let time=0,id=0,jobs=new Map();const clock={performance:{now:()=>time},setTimeout(fn,ms){jobs.set(++id,{at:time+ms,fn});return id},clearTimeout(i){jobs.delete(i)},requestAnimationFrame(fn){return this.setTimeout(fn,16)},cancelAnimationFrame(i){jobs.delete(i)}};
function advance(ms){let end=time+ms;while(true){let next=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;time=next[1].at;jobs.delete(next[0]);next[1].fn()}time=end}
function deck(){let source='',value=0;return {paused:true,changes:0,samples:[],get src(){return source},set src(v){source=v;this.changes++},get volume(){return value},set volume(v){assert(v>=0&&v<=1);this.samples.push([time,v]);value=v},pause(){this.paused=true},play(){this.paused=false;return Promise.resolve()}}}
const context={window:{},console};vm.createContext(context);vm.runInContext(fs.readFileSync((process.argv[2]||require('path').resolve(__dirname,'..')+'/')+'audio-player.js','utf8'),context);
let decks=[deck(),deck()],p=new context.window.SmoothBgm(decks,{daily:'day.mp3',evening:'eve.mp3',room:'night.mp3'},clock);
p.request('daily',.4,false);advance(1600);assert.equal(p.track,'daily');assert.equal(decks[0].volume,.4);
for(let i=0;i<20;i++)p.request('daily',.4,false);assert.equal(decks[0].changes,1);
p.request('evening',.4,false);advance(100);p.request('room',.4,false);
advance(499);assert.equal(p.track,'daily');advance(1);assert.equal(p.track,'room');
advance(1200);assert(decks[0].volume>0&&decks[1].volume>0);advance(1300);assert(decks[0].paused);assert.equal(decks[1].volume,.4);
const changes=decks.reduce((n,d)=>n+d.changes,0);advance(60000);assert.equal(decks.reduce((n,d)=>n+d.changes,0),changes,'music must not rotate on a timer');
p.request('room',.4,true);advance(500);assert(decks.every(d=>d.paused&&d.volume===0));p.request('room',.4,false);advance(1100);assert.equal(decks[1].changes,1);assert.equal(decks[1].volume,.4);
p.request('evening',.4,false);p.request('room',.4,false);advance(9000);assert.equal(p.track,'room');assert.equal(decks.reduce((n,d)=>n+d.changes,0),changes);
p.stop();advance(500);assert(decks.every(d=>d.paused&&d.volume===0));
console.log('PASS: scene-requested smooth crossfade; no automatic rotation after 60 seconds; latest scene wins; no same-track restarts; mute/unmute/stop');
