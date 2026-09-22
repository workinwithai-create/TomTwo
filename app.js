const CDN = "https://cdn.jsdelivr.net/gh/workinwithai-create/PreEight@main/public/samples";
const STEPS = 16;
const BODY = 8;
const FILL = 2;
const recipes = [
  { id:"floor-cascade", name:"Floor cascade", blurb:"Rack then floor down the last eight 16ths. Crash on the next 1." },
  { id:"half-roll", name:"Half-time roll", blurb:"Sparse toms on 2 and 4 of bar 9, then a dump on bar 10." },
  { id:"triplet-dump", name:"Triplet dump", blurb:"Bar 10 only: 8th-note triplets off the floor tom." },
  { id:"flam-door", name:"Flam door", blurb:"Flammed rack on every beat of bar 10. Air on bar 9." },
  { id:"two-and-four", name:"Two and four", blurb:"Toms replace the snare for two bars. Pocket stays." },
  { id:"stop-fill", name:"Stop fill", blurb:"One floor hit on 9.1. Silence until the next section." },
  { id:"march-toms", name:"March toms", blurb:"Even 8ths, rack-floor-rack-floor. Military door." },
  { id:"ghost-toms", name:"Ghost toms", blurb:"Soft rack ghosts so the lyric can finish talking." },
  { id:"crash-gate", name:"Crash gate", blurb:"Toms into a crash on 10.3, then air into the next 1." },
  { id:"double-floor", name:"Double floor", blurb:"Two floor hits on the and of 4. That is the whole fill." }
];
function bar(symbol, piano, guitar, bass){ return { symbol, piano, guitar, bass }; }
const grooves = [
  { id:"amber", name:"Amber Walk", bpm:98, key:"A minor",
    body:[bar("Am",[45,48,52,57],[45,52,57],33),bar("F",[41,45,48,53],[41,48,53],41),bar("C",[48,52,55,60],[48,52,55],36),bar("G",[43,47,50,55],[43,47,50],31),bar("Am",[45,48,52,57],[45,52,57],33),bar("F",[41,45,48,53],[41,48,53],41),bar("C",[48,52,55,60],[48,52,55],36),bar("G",[43,47,50,55],[43,47,50],31)],
    fill:[bar("E",[40,44,47,52],[40,47,52],28),bar("Am",[45,48,52,57],[45,52,57],33)] },
  { id:"porch", name:"Porch Climb", bpm:86, key:"E major",
    body:[bar("E",[40,44,47,52],[40,47,52],28),bar("B",[35,39,42,47],[35,42,47],23),bar("C#m",[44,47,51,56],[44,51,56],32),bar("A",[33,37,40,45],[33,40,45],33),bar("E",[40,44,47,52],[40,47,52],28),bar("B",[35,39,42,47],[35,42,47],23),bar("C#m",[44,47,51,56],[44,51,56],32),bar("A",[33,37,40,45],[33,40,45],33)],
    fill:[bar("B",[35,39,42,47],[35,42,47],23),bar("E",[40,44,47,52],[40,47,52],28)] },
  { id:"fold", name:"Fold Radio", bpm:104, key:"D minor",
    body:[bar("Dm",[38,41,45,50],[38,45,50],26),bar("Bb",[34,38,41,46],[34,41,46],34),bar("F",[41,45,48,53],[41,48,53],29),bar("C",[36,40,43,48],[36,43,48],24),bar("Dm",[38,41,45,50],[38,45,50],26),bar("Bb",[34,38,41,46],[34,41,46],34),bar("F",[41,45,48,53],[41,48,53],29),bar("C",[36,40,43,48],[36,43,48],24)],
    fill:[bar("C",[36,40,43,48],[36,43,48],24),bar("Dm",[38,41,45,50],[38,45,50],26)] }
];
const state = { groove: grooves[0], recipe: recipes[0], playing:false, bar:0, mode:null };
let ctx, bus, buffers = {};
async function load() {
  ctx = new AudioContext();
  bus = ctx.createGain(); bus.gain.value = 0.35; bus.connect(ctx.destination);
  const files = [
    ["kick",`${CDN}/drums/kick.mp3`],["snare",`${CDN}/drums/snare.mp3`],["hat",`${CDN}/drums/hihat.mp3`],["crash",`${CDN}/drums/crash.mp3`],
    ["pC3",`${CDN}/piano/C3.mp3`],["pC4",`${CDN}/piano/C4.mp3`],["pA3",`${CDN}/piano/A3.mp3`],
    ["bE1",`${CDN}/bass/E1.mp3`],["bA1",`${CDN}/bass/A1.mp3`],["bC2",`${CDN}/bass/C2.mp3`],
    ["gE2",`${CDN}/guitar/E2.mp3`],["gA2",`${CDN}/guitar/A2.mp3`],["gE3",`${CDN}/guitar/E3.mp3`]
  ];
  let n=0;
  for (const [k,url] of files) {
    try { const r = await fetch(url); buffers[k] = await ctx.decodeAudioData(await r.arrayBuffer()); } catch (e) { console.warn(k, e); }
    n++; document.getElementById("status").textContent = `Seating chairs ${n}/${files.length}`;
  }
  document.getElementById("status").textContent = "Chairs seated · live FluidR3 + kit (toms from pitched kick/snare)";
}
function playBuf(name, when, rate=1, gain=0.4) {
  const b = buffers[name]; if (!b || !ctx) return;
  const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = gain; src.connect(g); g.connect(bus); src.start(when);
}
function rateFromMidi(midi, baseMidi){ return Math.pow(2, (midi-baseMidi)/12); }
function chordAt(i){ return i < BODY ? state.groove.body[i] : state.groove.fill[i-BODY]; }
function rack(when, gain=0.42){ playBuf("snare", when, 0.72, gain); }
function floorTom(when, gain=0.5){ playBuf("kick", when, 0.78, gain); }
function scheduleBar(barIndex, t0, stepDur){
  const ch = chordAt(barIndex); const onFill = barIndex >= BODY; const rec = state.recipe.id;
  for (let s=0;s<STEPS;s++){
    const when = t0 + s*stepDur;
    const quietBodyHats = onFill && rec==="stop-fill";
    if (s%2===0 && !quietBodyHats) playBuf("hat", when, 1, onFill ? 0.05 : 0.07);
    if (!onFill) {
      if (s===0) playBuf("kick", when, 1, 0.7);
      if (s===8) playBuf("snare", when, 1, 0.45);
    }
    if (s===0) {
      playBuf("pC4", when, rateFromMidi(ch.piano[2]||60, 60), onFill ? 0.16 : 0.28);
      playBuf("pA3", when, rateFromMidi(ch.piano[1]||57, 57), onFill ? 0.12 : 0.22);
      playBuf("bA1", when, rateFromMidi(ch.bass, 33), onFill ? 0.22 : 0.45);
      playBuf("gA2", when, rateFromMidi(ch.guitar[0]||45, 45), onFill ? 0.12 : 0.22);
    }
    if (!onFill) continue;
    if (rec==="floor-cascade") {
      if (barIndex===BODY && s>=8) { (s%2===0 ? rack : floorTom)(when, 0.38 + (s-8)*0.03); }
      if (barIndex===BODY+1) { (s<8 ? rack : floorTom)(when, 0.44); if (s===0) playBuf("crash", when, 1, 0.28); }
    }
    if (rec==="half-roll") {
      if (barIndex===BODY && (s===8 || s===0)) floorTom(when, 0.48);
      if (barIndex===BODY+1 && s%2===0) floorTom(when, 0.40 + s*0.01);
    }
    if (rec==="triplet-dump" && barIndex===BODY+1 && s%2===0) floorTom(when, 0.46);
    if (rec==="flam-door" && barIndex===BODY+1 && s%4===0) { rack(when, 0.36); floorTom(when+0.012, 0.42); }
    if (rec==="two-and-four" && (s===0 || s===8)) { floorTom(when, 0.5); if (s===8) rack(when, 0.28); }
    if (rec==="stop-fill" && barIndex===BODY && s===0) floorTom(when, 0.62);
    if (rec==="march-toms" && s%2===0) { (s%4===0 ? rack : floorTom)(when, 0.4); }
    if (rec==="ghost-toms" && s%4===2) rack(when, 0.16);
    if (rec==="crash-gate") {
      if (barIndex===BODY && s>=12) floorTom(when, 0.4);
      if (barIndex===BODY+1 && s===8) playBuf("crash", when, 1, 0.45);
      if (barIndex===BODY+1 && s<8 && s%2===0) rack(when, 0.34);
    }
    if (rec==="double-floor" && barIndex===BODY+1 && (s===14 || s===15)) floorTom(when, 0.58);
  }
}
let timer=null;
function stop(){ state.playing=false; state.mode=null; if(timer) clearTimeout(timer); timer=null; paintBars(); }
async function play(mode){
  if (!ctx) await load();
  if (ctx.state==="suspended") await ctx.resume();
  stop(); state.playing=true; state.mode=mode;
  const startBar = mode==="eight" ? BODY : 0;
  const endBar = mode==="loop" ? BODY : BODY+FILL;
  const stepDur = 60/state.groove.bpm/4;
  let barIndex = startBar;
  const tick = () => {
    if (!state.playing) return;
    if (barIndex >= endBar) { if (mode==="loop") barIndex = startBar; else { stop(); return; } }
    state.bar = barIndex; paintBars();
    scheduleBar(barIndex, ctx.currentTime+0.02, stepDur);
    barIndex += 1;
    timer = setTimeout(tick, STEPS*stepDur*1000);
  };
  tick();
}
function punch(){
  const g=state.groove, r=state.recipe;
  return `TomTwo punch list\n${g.name} · ${g.bpm} BPM · ${g.key} · ${r.name}\n\nThe problem: chorus dumps into the next section with no handshake.\nThe move: ${r.blurb}\n\nChorus body (bars 1-8)\n${g.body.map((b,i)=>`  ${i+1}. ${b.symbol}`).join("\n")}\n\nFill (bars 9-10) — ${r.name}\n${g.fill.map((b,i)=>`  ${i+9}. ${b.symbol}`).join("\n")}\n\nLive chairs only (FluidR3 piano, upright, nylon, kit; toms pitched from the same kit).\nDistinct from DropFour, LeadFour, RimFour, CongaFour, CueFour, BuildFour.\nPrint bars 9-10. Do not loop them as another chorus.`;
}
function paintGrooves(){
  const el=document.getElementById("grooves"); el.innerHTML="";
  grooves.forEach(g=>{ const b=document.createElement("button"); b.className="card"+(state.groove.id===g.id?" on":""); b.innerHTML=`<b>${g.name}</b><span>${g.bpm} BPM · ${g.key}</span>`; b.onclick=()=>{ state.groove=g; render(); }; el.appendChild(b); });
}
function paintRecipes(){
  const el=document.getElementById("recipes"); el.innerHTML="";
  recipes.forEach(r=>{ const b=document.createElement("button"); b.className="card"+(state.recipe.id===r.id?" on":""); b.innerHTML=`<b>${r.name}</b><span>${r.blurb}</span>`; b.onclick=()=>{ state.recipe=r; render(); }; el.appendChild(b); });
}
function paintBars(){
  const el=document.getElementById("bars"); el.innerHTML="";
  for(let i=0;i<10;i++){ const ch=chordAt(i); const d=document.createElement("div"); d.className="bar"+(i>=8?" fill":"")+(state.playing && state.bar===i?" active":""); d.innerHTML=`<div class="n">${i+1} · ${i>=8?"F":"C"}</div><div class="c">${ch.symbol}</div>`; el.appendChild(d); }
}
function render(){ paintGrooves(); paintRecipes(); paintBars(); document.getElementById("punch").textContent = punch(); }
document.getElementById("playA").onclick=()=>play("loop");
document.getElementById("playB").onclick=()=>play("cut");
document.getElementById("play8").onclick=()=>play("eight");
document.getElementById("stop").onclick=stop;
document.getElementById("copy").onclick=()=>navigator.clipboard.writeText(punch());
render();
load();
