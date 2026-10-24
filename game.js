
"use strict";
const $=id=>document.getElementById(id),CELL=220,S=CELL,STUBL=36,BASE=22,PI=Math.PI,DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
const WALLD=S+5,HIT_BLINK=2.2,HEAL=6;
const yawOf=h=>Math.atan2(-DIRS[h][0],-DIRS[h][1]);
/* ---------- route logic (pure) ---------- */
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function layout(turns){let h=0,p=[0,0];const pts=[[0,0]],hs=[];
 for(let i=0;i<=turns.length;i++){hs.push(h);p=[p[0]+DIRS[h][0],p[1]+DIRS[h][1]];pts.push(p);if(i<turns.length)h=(h+(turns[i]=='RIGHT'?1:3))%4}
 return{points:pts,headings:hs}}
function validate(r){const e=[],t=r.turns;if(!t.length)e.push('length');if(t.some(x=>x!='LEFT'&&x!='RIGHT'))e.push('value');
 const L=layout(t);if(JSON.stringify(L)!=JSON.stringify(r.layout))e.push('layout');if(new Set(L.points.map(String)).size!=L.points.length)e.push('overlap');return e}
const TH=[{n:'Residential',sky:0x4a2e48,fog:0x7a4a50,t:[0xffc08a,0xe8a070,0xd9b8a0],d:'🏠'},{n:'Shopping',sky:0x3a2458,fog:0x6a3a74,t:[0xff9ad0,0xffc84a,0xb8a0ff],d:'🏬'},
 {n:'Office',sky:0x1c3050,fog:0x2f4a70,t:[0x9ac8ff,0xc8d8e8,0x7ab0e0],d:'🏢'},{n:'Market lanes',sky:0x4a3018,fog:0x7a5026,t:[0xffa040,0xe86a30,0xffd070],d:'🛍️'},
 {n:'Night roads',sky:0x080a1c,fog:0x10162c,t:[0x7a9aff,0xa070ff,0x60d0c0],d:'🍽️'},{n:'Complex junctions',sky:0x0a2830,fog:0x164048,t:[0x40e0d0,0xff80a0,0xf0d060],d:'🏥'}];
const TB=[[3,.85,2000],[5,1.0,1600],[6,1.12,1350],[7,1.25,1200],[8,1.38,1080],[9,1.5,1000]];
const DIFFS={easy:{s:.85,r:.05,cap:1.25,o:.7,pay:300},normal:{s:1.3,r:.1,cap:1.5,o:1,pay:500},hard:{s:1.6,r:.12,cap:1.6,o:1.3,pay:800}},DF=()=>DIFFS[SV.diff]||DIFFS.normal,ramp=k=>Math.min(DF().cap,1+DF().r*k);
function cfg(m){const i=Math.min(5,Math.floor((m-1)/2));let[t,sp,w]=TB[i];if(m>12){sp=Math.min(1.9,1.5+.02*(m-12));w=Math.max(900,1000-(m-12)*10)}
 w=Math.max(m<=2?2000:900,w);const speed=BASE*sp*DF().s;return{turns:t,mult:sp,win:w,speed,dopen:speed*w/1000,theme:TH[m>12?m%6:i]}}
const TEACH=[['RIGHT','LEFT','LEFT'],['LEFT','RIGHT','RIGHT']];let attemptCtr=0;
function gen(m,seed,avoid){const c=cfg(m),R=rng(seed);let turns=null;
 for(let a=0;a<80&&!turns;a++){let t;if(m<=2)t=TEACH[m-1];else{t=[];for(let i=0;i<c.turns;i++)t.push(R()<.5?'LEFT':'RIGHT')}
  const j=t.join();if(m>=3&&/(LEFT,){3}LEFT|(RIGHT,){3}RIGHT/.test(j))continue;if(m>2&&j==avoid)continue;
  if(validate({turns:t,layout:layout(t)}).length==0)turns=t}
 if(!turns)turns=Array.from({length:c.turns},(_,i)=>i%2?'LEFT':'RIGHT');
 return{missionId:m,attemptId:++attemptCtr,seed,turns,theme:c.theme.n,speed:c.speed,decisionWindowMs:c.win,approachDistance:c.dopen+30,layout:layout(turns)}}
/* ---------- save ---------- */
const DEF={v:1,wallet:0,missionsCompleted:0,highestUnlocked:1,sound:true,reducedMotion:false,quality:'auto',diff:'normal',eng:true,music:true,lastMissionId:1};
let mem=null;const num=(x,d)=>Number.isFinite(x)&&x>=0?Math.floor(x):d;
function load(){let o={};try{o=JSON.parse(localStorage.getItem('dd_save')||'{}')||{}}catch(e){o=mem||{}}
 return{v:1,wallet:num(o.wallet,0),missionsCompleted:num(o.missionsCompleted,0),highestUnlocked:Math.max(1,num(o.highestUnlocked,1)),sound:o.sound!==false,
 reducedMotion:false,quality:['auto','low','med','high'].includes(o.quality)?o.quality:'auto',diff:['easy','normal','hard'].includes(o.diff)?o.diff:'normal',eng:o.eng!==false,music:o.music!==false,lastMissionId:Math.max(1,num(o.lastMissionId,1))}}
let SV=load();function save(){mem=JSON.parse(JSON.stringify(SV));try{localStorage.setItem('dd_save',JSON.stringify(SV))}catch(e){}}
let claimed=-1,mission=1;
function claim(id){if(claimed===id)return false;claimed=id;SV.wallet+=DF().pay;SV.missionsCompleted++;SV.highestUnlocked=Math.max(SV.highestUnlocked,mission+1);SV.lastMissionId=mission;save();return true}
/* ---------- audio ---------- */
let AC,mg,eo,eg;
function aud(){if(!SV.sound)return null;try{if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();mg=AC.createGain();mg.gain.value=.25;mg.connect(AC.destination)}if(AC.state=='suspended')AC.resume();return AC}catch(e){return null}}
function beep(f,d=.12,ty='sine',v=.4,w=0,f2){const a=aud();if(!a)return;try{const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+w;o.type=ty;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(mg);o.start(t);o.stop(t+d+.05)}catch(e){}}
function engine(on){try{if(on&&!eo){if(SV.eng===false)return;const a=aud();if(!a)return;eo=a.createOscillator();eg=a.createGain();eo.type='triangle';eo.frequency.value=55;const fl=a.createBiquadFilter();fl.type='lowpass';fl.frequency.value=160;eg.gain.value=.018;const lf=a.createOscillator(),ld=a.createGain();lf.frequency.value=6;ld.gain.value=.007;lf.connect(ld);ld.connect(eg.gain);lf.start();eo._lf=lf;eo.connect(fl);fl.connect(eg);eg.connect(mg);eo.start()}
 else if(!on&&eo){eo.stop();eo._lf.stop();eo.disconnect();eg.disconnect();eo=eg=null}}catch(e){eo=null}}
const sfx={tick:()=>beep(880,.08),ok:()=>{beep(660,.1);beep(990,.2,'sine',.3,.1)},crash:()=>beep(180,.6,'sawtooth',.6,0,40),win:()=>[523,659,784,1047].forEach((f,i)=>beep(f,.25,'triangle',.4,i*.15))};
let mus=null,nb=null;
function mn(f,t,d,ty,v,dest,f2){const o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d*.6);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(dest);o.start(t);o.stop(t+d+.02)}
function nz(t,d,f,v,ty){if(!nb){nb=AC.createBuffer(1,AC.sampleRate*.3,AC.sampleRate);const c=nb.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1}const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=nb;fl.type=ty;fl.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(fl);fl.connect(g);g.connect(mus.g);s.start(t);s.stop(t+d+.02)}
function music(on){try{if(on&&SV.music!==false&&!mus){const a=aud();if(!a)return;const g=a.createGain(),lp=a.createBiquadFilter();g.gain.value=.45;lp.type='lowpass';lp.frequency.value=1200;lp.Q.value=4;lp.connect(g);g.connect(mg);mus={g,lp,t:a.currentTime+.1,step:0}}else if(!on&&mus){mus.g.disconnect();mus=null}}catch(e){mus=null}}
const ROOT=[55,43.65,65.41,49],CH=[[0,3,7,12],[0,4,7,12],[0,4,7,12],[0,4,7,12]];
function musTick(){if(!mus||!AC||AC.state!='running')return;const s=60/104/4;if(mus.t<AC.currentTime)mus.t=AC.currentTime+.05;
 try{while(mus.t<AC.currentTime+.25){const st=mus.step,bar=(st>>4)&3,i=st&15,t=mus.t,r=ROOT[bar],ch=CH[bar];
  if(i%4==0){mn(130,t,.18,'sine',.5,mus.g,40);mus.lp.frequency.setTargetAtTime(600+((st>>2)%32)*50,t,.1)}
  if(i==4||i==12)nz(t,.14,1800,.12,'bandpass');
  if(i%2==1)nz(t,.04,7000,.05,'highpass');
  if([0,3,6,8,11,14].includes(i))mn(r,t,.2,'sawtooth',.22,mus.lp);
  if(i%2==0){const n=ch[(i>>1)%4];mn(r*4*Math.pow(2,n/12),t,.14,'square',.05,mus.lp);mn(r*4.02*Math.pow(2,n/12),t,.14,'sawtooth',.03,mus.lp)}
  mus.t+=s;mus.step++}}catch(e){music(false)}}
/* ---------- 3D ---------- */
let rn,scene,cam,rider,body,bm=[],G={},pix=1,autoScale=1,GLOK=true;
let mapleTreeTemplate = null;
try{rn=new THREE.WebGLRenderer({canvas:$('gl'),antialias:false,powerPreference:'high-performance'})}catch(e){GLOK=false;$('nogl').classList.add('on');$('menu').classList.remove('on')}
if(GLOK){
  scene=new THREE.Scene();

const mapleLoader = new THREE.GLTFLoader();

mapleLoader.load(
  'assets/maple_tree/scene.gltf',

  function (gltf) {
    const tree = gltf.scene;

    // Measure the original model
    tree.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(tree);
    const size = bounds.getSize(new THREE.Vector3());

    // Make the tree approximately 12 world units tall
    if (size.y > 0) {
      tree.scale.setScalar(12 / size.y);
    }

    // Align its base with ground level
    tree.updateMatrixWorld(true);

    const scaledBounds = new THREE.Box3().setFromObject(tree);
    tree.position.y -= scaledBounds.min.y;

    mapleTreeTemplate = tree;

    // The first road segment may already exist because GLTF loading is asynchronous.
    Object.values(G).forEach(addMapleTrees);
    console.log('Maple tree loaded successfully!');
  },

  undefined,

  function (error) {
    console.error('Maple tree failed to load:', error);
  }
);

  cam=new THREE.PerspectiveCamera(62,1,.5,400);
  scene.add(new THREE.HemisphereLight(0xffd9b0,0x2a2040,1.0));
  const dl=new THREE.DirectionalLight(0xffc89a,.7);dl.position.set(30,50,20);scene.add(dl);

  // Procedural lofi pink-purple dusk sky (no image file needed).
  (function(){
    const W=2048,H=1024,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
    let sd=7;const r=()=>(sd=(sd*16807)%2147483647)/2147483647;
    // vertical gradient: zenith -> horizon at 50% -> haze below
    const gr=g.createLinearGradient(0,0,0,H);
    [[0,'#1d1450'],[.16,'#3a2478'],[.30,'#6a3f9e'],[.40,'#b358a8'],[.46,'#ff86b4'],[.50,'#ffc0a8'],[.54,'#e48ab8'],[.70,'#8a5aa8'],[1,'#4a3078']]
      .forEach(([p,col])=>gr.addColorStop(p,col));
    g.fillStyle=gr;g.fillRect(0,0,W,H);
    // faint stars in upper sky
    for(let i=0;i<260;i++){const x=r()*W,y=r()*H*.3,a=.15+r()*.5;g.fillStyle='rgba(255,235,250,'+a+')';g.fillRect(x,y,r()<.15?2:1,r()<.15?2:1)}
    // sun glow near horizon
    const sx=W*.5,sy=H*.5;
    let rg=g.createRadialGradient(sx,sy,0,sx,sy,520);
    rg.addColorStop(0,'rgba(255,240,200,.95)');rg.addColorStop(.08,'rgba(255,200,170,.8)');rg.addColorStop(.3,'rgba(255,130,180,.35)');rg.addColorStop(1,'rgba(255,130,180,0)');
    g.fillStyle=rg;g.fillRect(0,0,W,H);
    // soft squashed clouds, wrapped so the seam is invisible
    function puff(x,y,rad,al){
      g.save();g.translate(x,y);g.scale(1,.42);
      const q=g.createRadialGradient(-rad*.25,-rad*.35,rad*.05,0,0,rad);
      q.addColorStop(0,'rgba(255,228,240,'+al+')');q.addColorStop(.55,'rgba(238,150,195,'+al*.8+')');q.addColorStop(1,'rgba(150,90,170,0)');
      g.fillStyle=q;g.beginPath();g.arc(0,0,rad,0,7);g.fill();g.restore()}
    function cloud(cx,cy,w,al){
      const n=10+(r()*8|0);
      for(let i=0;i<n;i++){const px=cx+(r()-.5)*w,py=cy+(r()-.5)*w*.06,rad=w*(.10+r()*.14);
        for(const o of [-W,0,W])puff(px+o,py,rad,al)}}
    for(let i=0;i<9;i++)cloud(r()*W,H*(.16+r()*.14),240+r()*260,.55);   // high, faint
    for(let i=0;i<12;i++)cloud(r()*W,H*(.34+r()*.12),300+r()*340,.8);   // low, glowing
    // thin horizon haze
    const hz=g.createLinearGradient(0,H*.44,0,H*.56);
    hz.addColorStop(0,'rgba(255,170,190,0)');hz.addColorStop(.5,'rgba(255,190,190,.45)');hz.addColorStop(1,'rgba(255,170,190,0)');
    g.fillStyle=hz;g.fillRect(0,H*.44,W,H*.12);
    const tex=new THREE.CanvasTexture(c);tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.ClampToEdgeWrapping;
    const m=new THREE.Mesh(new THREE.SphereGeometry(260,48,32),new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,depthWrite:false,fog:false}));
    m.renderOrder=-1000;window._deliverySky=m;scene.add(m);scene.background=null;
  })();
  // Endless ground plane: fades into the fog at the horizon
  const fg=new THREE.PlaneGeometry(1400,1400);fg.rotateX(-Math.PI/2);
  window._gndFar=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({color:0x4a3866,roughness:1}));
  window._gndFar.position.y=-.3;scene.add(window._gndFar);
}
function ctex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
let roadMat,barMat,signMat,destMat,boxG,planeG,poleG,bulbG,bulbM,poleM,carG,cylG;const carCols=[0xf2c230,0x2fa36b,0xd8d8d8,0xc03030,0x3060c0],roadGeos={};
if(GLOK){const roadT=ctex(128,128,(g,w,h)=>{g.fillStyle='#23262e';g.fillRect(0,0,w,h);for(let i=0;i<600;i++){g.fillStyle='rgba(255,255,255,'+Math.random()*.05+')';g.fillRect(Math.random()*w,Math.random()*h,2,2)}g.fillStyle='#e8e2c0';g.fillRect(w/3-3,10,6,h/2-10);g.fillRect(2*w/3-3,10,6,h/2-10);g.fillStyle='#ddd';g.fillRect(3,0,3,h);g.fillRect(w-6,0,3,h)});
 roadMat=new THREE.MeshStandardMaterial({map:roadT,roughness:.3,metalness:.25});
 barMat=new THREE.MeshStandardMaterial({map:ctex(64,32,(g)=>{g.fillStyle='#f4f4f4';g.fillRect(0,0,64,32);g.fillStyle='#d62b2b';for(let i=0;i<8;i++)g.fillRect(i*16,0,8,32)}),roughness:.6});
 signMat=new THREE.MeshBasicMaterial({map:ctex(256,64,(g)=>{g.fillStyle='#ffb81f';g.fillRect(0,0,256,64);g.fillStyle='#2a1200';g.font='bold 34px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('चाय · CHAI & CO',128,34)})});
 destMat=new THREE.MeshStandardMaterial({color:0xb0825a,roughness:.8});
 boxG=new THREE.BoxGeometry(1,1,1);planeG=new THREE.PlaneGeometry(20,4.5);poleG=new THREE.CylinderGeometry(.12,.12,7,6);bulbG=new THREE.SphereGeometry(.4,8,6);cylG=new THREE.CylinderGeometry(.3,.3,.2,12);
 bulbM=new THREE.MeshBasicMaterial({color:0xffe8a0});poleM=new THREE.MeshStandardMaterial({color:0x444455});
 const winT=ctex(64,128,(g,w,h)=>{g.fillStyle='#14121f';g.fillRect(0,0,w,h);for(let y=6;y<h-6;y+=14)for(let x=6;x<w-6;x+=14){if(Math.random()<.55){g.fillStyle='#ffd88a';g.fillRect(x,y,7,8)}}});window._winT=winT;
 rider=new THREE.Group();body=new THREE.Group();rider.add(body);
 // Build the player vehicle entirely from lightweight Three.js geometry.
 // Procedural low-poly delivery car: all geometry is created in code; no external model file.
 const carPaint=new THREE.MeshStandardMaterial({color:0xc9002b,roughness:.32,metalness:.18});
 const darkPaint=new THREE.MeshStandardMaterial({color:0x111521,roughness:.42,metalness:.2});
 const glass=new THREE.MeshStandardMaterial({color:0x27c7ed,roughness:.16,metalness:.25,transparent:true,opacity:.9});
 const chrome=new THREE.MeshStandardMaterial({color:0xb8c3cf,roughness:.25,metalness:.8});
 const lamp=new THREE.MeshStandardMaterial({color:0xfff5ce,emissive:0xffe7a0,emissiveIntensity:.75});
 const tailLamp=new THREE.MeshStandardMaterial({color:0xff172e,emissive:0x7d0010,emissiveIntensity:.5});
 const addCarPart=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);body.add(m);return m};
 // Main shell, hood and rear deck (the car faces toward -Z).
 addCarPart(new THREE.BoxGeometry(2.05,.52,3.55),carPaint,0,.62,0);
 addCarPart(new THREE.BoxGeometry(1.96,.28,1.05),carPaint,0,.82,-1.16);
 addCarPart(new THREE.BoxGeometry(1.92,.3,.72),carPaint,0,.83,1.35);
 // Sloped cabin with dark roof and blue glass.
 addCarPart(new THREE.BoxGeometry(1.52,.66,1.62),darkPaint,0,1.12,.02);
 addCarPart(new THREE.BoxGeometry(1.45,.52,1.48),carPaint,0,1.17,.02);
 addCarPart(new THREE.BoxGeometry(1.31,.34,.075),glass,0,1.27,-.77,.34,0,0);
 addCarPart(new THREE.BoxGeometry(1.27,.33,.07),glass,0,1.27,.79,-.3,0,0);
 addCarPart(new THREE.BoxGeometry(.07,.34,.76),glass,-.78,1.25,0,0,0,-.12);
 addCarPart(new THREE.BoxGeometry(.07,.34,.76),glass,.78,1.25,0,0,0,.12);
 // Front fascia, grille, bumper, lights and rear lights.
 addCarPart(new THREE.BoxGeometry(1.55,.16,.08),darkPaint,0,.48,-1.79);
 addCarPart(new THREE.BoxGeometry(.92,.1,.06),chrome,0,.55,-1.84);
 for(const x of [-.72,-.42,.42,.72]) addCarPart(new THREE.CylinderGeometry(.105,.105,.055,12),lamp,x,.66,-1.82,0,0,Math.PI/2);
 addCarPart(new THREE.BoxGeometry(1.82,.13,.14),carPaint,0,.39,-1.78);
 for(const x of [-.72,.72]){addCarPart(new THREE.BoxGeometry(.28,.12,.06),tailLamp,x,.65,1.79);addCarPart(new THREE.BoxGeometry(.12,.09,.12),chrome,x*1.35,.88,-.28,0,0,x<0?-.25:.25)}
 // Mirrors, side skirts and rear spoiler.
 for(const x of [-1.08,1.08]){addCarPart(new THREE.BoxGeometry(.18,.09,.24),carPaint,x,.97,-.42);addCarPart(new THREE.BoxGeometry(.12,.05,.17),glass,x*1.04,.99,-.42);addCarPart(new THREE.BoxGeometry(.08,.13,2.15),darkPaint,x,.38,.05)}
 addCarPart(new THREE.BoxGeometry(1.45,.09,.16),darkPaint,0,1.12,1.68);
 for(const x of [-.57,.57])addCarPart(new THREE.BoxGeometry(.08,.25,.08),darkPaint,x,1.0,1.63);
 // Four chunky rubber tyres and metallic rims. Cylinders are rotated onto the axle.
 const tyre=new THREE.MeshStandardMaterial({color:0x17191e,roughness:.9}),rim=new THREE.MeshStandardMaterial({color:0x9ca8b4,metalness:.85,roughness:.28});
 for(const x of [-.99,.99])for(const z of [-1.12,1.12]){
  addCarPart(new THREE.CylinderGeometry(.36,.36,.22,12),tyre,x,.39,z,0,0,Math.PI/2);
  addCarPart(new THREE.CylinderGeometry(.22,.22,.235,10),rim,x,.39,z,0,0,Math.PI/2);
  addCarPart(new THREE.CylinderGeometry(.085,.085,.245,8),darkPaint,x,.39,z,0,0,Math.PI/2);
 }
 // Swap in the 3D delivery car model (embedded GLB). The procedural car above stays as a fallback.
 try{
  const CAR_LEN=3.6,CAR_YAW=-Math.PI/2; // CAR_YAW: if the car drives backwards, change to -Math.PI/2
  fetch('assets/delivery_car.glb').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.arrayBuffer()}).then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{
   const m=gltf.scene,drop=[],jobs=[],pj=gltf.parser.json,texOf={};
   (pj.materials||[]).forEach(mt=>{const t=mt.emissiveTexture||(mt.pbrMetallicRoughness&&mt.pbrMetallicRoughness.baseColorTexture);if(t)texOf[mt.name]=t.index});
   m.traverse(o=>{if(!o.isMesh)return;
    if(/ground/i.test(o.name)||/ground/i.test(o.material.name)){drop.push(o);return}
    const mat=new THREE.MeshBasicMaterial({color:new THREE.Color(1.35,1.35,1.35),side:THREE.DoubleSide}),ti=texOf[o.material.name];
    if(ti!==undefined)jobs.push(gltf.parser.getDependency('texture',ti).then(t=>{t.encoding=THREE.LinearEncoding;mat.map=t;mat.needsUpdate=true}));
    o.material=mat});
   drop.forEach(o=>o.parent.remove(o));
   const w=new THREE.Group();w.add(m);w.rotation.y=CAR_YAW;const outer=new THREE.Group();outer.add(w);
   outer.updateMatrixWorld(true);let bx=new THREE.Box3().setFromObject(outer),sz=bx.getSize(new THREE.Vector3());
   w.scale.setScalar(CAR_LEN/sz.z);outer.updateMatrixWorld(true);bx=new THREE.Box3().setFromObject(outer);
   const c=bx.getCenter(new THREE.Vector3());w.position.set(-c.x,-bx.min.y,-c.z);
   // show the model only once its textures are ready, so there is never a white flash
   Promise.all(jobs).then(()=>{body.children.forEach(ch=>{ch.visible=false});body.add(outer);window._deliveryCarModel=outer}).catch(e=>console.warn('Car textures failed, keeping built-in car.',e));
  },err=>console.warn('Car model failed to parse, using the built-in car.',err))).catch(err=>console.warn('Car file could not be loaded (needs a web server, not file://). Using the built-in car.',err));
 }catch(e){console.warn('Car model error',e)}
 window._deliveryCarModel=body;scene.add(rider);
  loadCityPack();
}


// ---------- City asset pack (asynchronous, with procedural fallbacks) ----------
const CITY={ready:false,buildings:[],cars:[],props:[],trees:[],used:0};
function loadCityPack(){
 if(!THREE.GLTFLoader)return;
 new THREE.GLTFLoader().load('assets/lowpoly_city_street_pack_buildings_stylized.glb',gltf=>{
  try{
   const root=gltf.scene;root.updateMatrixWorld(true);
   for(const src of root.children.slice()){
    const obj=src.clone(true);
    obj.matrix.copy(src.matrixWorld);obj.matrix.decompose(obj.position,obj.quaternion,obj.scale);obj.matrixAutoUpdate=true;obj.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(obj);
    if(box.isEmpty())continue;
    const size=box.getSize(new THREE.Vector3()),largest=Math.max(size.x,size.y,size.z);
    if(!isFinite(largest)||largest>10000||largest<12)continue;
    const name=(src.name||'').toLowerCase();
    const buildingLike=size.y>Math.max(size.x,size.z)*.48&&size.y>90;
    const vehicleLike=/car|vehicle|bus|truck|train|taxi|van/i.test(name)||
      (size.x>size.z*1.2&&size.x>80&&size.y<Math.max(size.x,size.z)*.6);
    const treeLike=/tree|plant|bush/i.test(name);
    const target=buildingLike?CITY.buildings:vehicleLike?CITY.cars:treeLike?CITY.trees:CITY.props;
    const holder=new THREE.Group();holder.add(obj);holder.updateMatrixWorld(true);
    const b=new THREE.Box3().setFromObject(holder),sz=b.getSize(new THREE.Vector3());
    const targetSize=buildingLike?(sz.y>350?20:13):vehicleLike?4:treeLike?7:2.6;
    const denom=buildingLike?sz.y:Math.max(sz.x,sz.z,sz.y*.45);
    const scale=targetSize/Math.max(denom,.001);
    holder.scale.setScalar(scale);
    holder.position.set(-((b.min.x+b.max.x)/2)*scale,-b.min.y*scale,-((b.min.z+b.max.z)/2)*scale);
    holder.updateMatrixWorld(true);
    target.push({name:src.name||'',obj:holder,size:sz.clone()});
   }
   CITY.ready=true;
   console.info('City pack ready',CITY.buildings.length,CITY.cars.length,CITY.props.length,CITY.trees.length);
  }catch(e){console.warn('City pack extraction failed; procedural fallbacks active.',e)}
 },undefined,e=>console.warn('City pack failed to load; procedural fallbacks active.',e));
}
function cityClone(list){
 if(!CITY.ready||!list.length)return null;
 const a=list[(Math.random()*list.length)|0],o=a.obj.clone(true);
 o.traverse(m=>{if(m.isMesh){m.castShadow=false;m.receiveShadow=true}});
 CITY.used++;return o;
}

function roadGeo(len){if(!roadGeos[len]){const g=new THREE.PlaneGeometry(12,len);g.rotateX(-PI/2);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*len/12);roadGeos[len]=g}return roadGeos[len]}
function applyTheme(th){scene.fog=new THREE.Fog(new THREE.Color(th.fog).lerp(new THREE.Color(0xc77ab0),.6),45,150);bm.forEach(m=>m.dispose());
 bm=th.t.map(c=>new THREE.MeshStandardMaterial({map:window._winT,emissiveMap:window._winT,emissive:0xffffff,emissiveIntensity:.8,color:c,roughness:.8}))}
function addMapleTrees(segment){
 if(!mapleTreeTemplate || !segment || segment.userData.mapleTreesAdded)return;
 segment.userData.mapleTreesAdded=true;
 for(const side of [-1,1]){
  for(const distance of [65,145]){
   const tree=mapleTreeTemplate.clone(true);
   tree.position.x=side*15;
   tree.position.z=-distance;
   tree.rotation.y=Math.random()*Math.PI*2;
   const size=.8+Math.random()*.4;
   tree.scale.multiplyScalar(size);
   segment.add(tree);
  }
 }
}

function buildSeg(rt,k){const g=new THREE.Group(),P=rt.layout.points[k],N=rt.turns.length,rnd=rng(rt.seed*31+k+7),dens=Math.min(1,.3+rt.missionId*.07);
 g.position.set(P[0]*CELL,0,P[1]*CELL);g.rotation.y=yawOf(rt.layout.headings[k]);
 const add=(geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);g.add(m);return m};
 const RL=k<N?S+8:S+16,RY=.008*(k+1),JY=.008*(N+2),r0=k>0?6:0,r1=k<N?S-6:RL;
 // Road is split around a plain asphalt junction so lane markings never cross or double up at turns
 add(roadGeo(r1-r0),roadMat,0,RY,-(r0+r1)/2);
 {const jm=window._jm||(window._jm=new THREE.MeshStandardMaterial({color:0x23262e,roughness:.3,metalness:.25}));
  if(k>0){const m=new THREE.Mesh(roadGeo(12),jm);m.position.set(0,JY,0);g.add(m)}
  if(k<N){const m=new THREE.Mesh(roadGeo(14),jm);m.position.set(0,JY,-(S+1));g.add(m)}}

 {const gm=window._gm||(window._gm={gg:{},
   gnd:new THREE.MeshStandardMaterial({map:ctex(128,128,(c,w,h)=>{c.fillStyle='#4f3b6e';c.fillRect(0,0,w,h);for(let i=0;i<300;i++){c.fillStyle=i%2?'rgba(255,200,230,.07)':'rgba(20,10,40,.10)';c.fillRect(Math.random()*w,Math.random()*h,2,2)}c.strokeStyle='rgba(25,12,45,.4)';c.lineWidth=2;c.strokeRect(0,0,w,h);c.strokeStyle='rgba(255,190,225,.10)';c.strokeRect(3,3,w-6,h-6)}),roughness:.95}),
   sw:new THREE.MeshStandardMaterial({color:0xb79bc4,roughness:.85})});
  const GL=RL+40;if(!gm.gg[GL]){const gg=new THREE.PlaneGeometry(140,GL);gg.rotateX(-PI/2);const uv=gg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*140/8,uv.getY(i)*GL/8);gm.gg[GL]=gg}
  const gnd=new THREE.Mesh(gm.gg[GL],gm.gnd);gnd.position.set(0,-.03-.003*k,20-GL/2);g.add(gnd);
  const sw=(a0,a1)=>{if(a1-a0<2)return;for(const sd of[-1,1]){const m=new THREE.Mesh(boxG,gm.sw);m.position.set(sd*7.5,.03,-(a0+a1)/2);m.scale.set(3,.1,a1-a0);g.add(m)}};
  sw(r0,S-6);sw(S+6,RL)}
 for(const sd of[-1,1]){add(roadGeo(30),roadMat,sd*21,RY,-S).rotation.y=PI/2;
  for(let a=k>0?32:20;a<S-20;a+=16){if(rnd()<.88){
    const bx=sd*(9+10),bz=-a;
    const asset=cityClone(CITY.buildings);
    if(asset){asset.position.set(bx,0,bz);asset.rotation.y=(rnd()-.5)*.16;const sc=.72+rnd()*.55;asset.scale.multiplyScalar(sc);g.add(asset)}
    else{const w=8+rnd()*8,h=8+rnd()*(14+rt.missionId*1.5);add(boxG,bm[(rnd()*3)|0],sd*(9+w/2),h/2,-a,w,h,13)}
   }}
  for(let a=30;a<S-30;a+=28){add(poleG,poleM,sd*7,3.5,-a-(sd>0?0:14));add(bulbG,bulbM,sd*6.4,7,-a-(sd>0?0:14))}
  for(let a=26;a<S-26;a+=22){if(rnd()<dens*.5){const parked=cityClone(CITY.cars);if(parked){parked.position.set(sd*8.3,0,-a);parked.rotation.y=sd>0?Math.PI/2:-Math.PI/2;g.add(parked)}else add(boxG,new THREE.MeshStandardMaterial({color:carCols[(rnd()*5)|0]}),sd*7.6,.8,-a,1.8,1.5,3.6)}}}
 g.userData.veh=[];const V=window._vm||(window._vm={bus:new THREE.MeshStandardMaterial({color:0xc03030}),ric:new THREE.MeshStandardMaterial({color:0xf2c230}),cow:new THREE.MeshStandardMaterial({color:0xeeeedd}),ped:new THREE.MeshStandardMaterial({color:0x6a8ad0}),car:carCols.map(c=>new THREE.MeshStandardMaterial({color:c}))}),nv=Math.round(dens*4);
 let pf=1;g.userData.obs=[];const sk=rt.speed*ramp(k),zE=k<N?S-12-sk*rt.decisionWindowMs/1000-16:S-45,m2=rt.missionId,od=DF().o,sp=(m2<=2?Math.max(32,sk*1.25):Math.max(28,sk*1.0))/Math.sqrt(od),pr=Math.min(.97,(m2<=2?.45+m2*.04:.6+m2*.04)*od);
 for(let a=Math.max(40,12+sk*.8);a<zE;a+=sp+rnd()*8){if(rnd()>pr)continue;
  if(m2>=3&&rnd()<Math.min(.7,(.12+m2*.05)*od)){const cr=rnd()<.4,l0=(rnd()*2)|0,ph=rnd()*6.28,cx=cr?0:(l0-1)*4+2,amp=cr?8:2,om=cr?.6:1.3,w=cr?2.2:1.4,len=cr?1.1:2.6,xx=cx+amp*Math.sin(ph),m=cr?add(boxG,V.cow,xx,.7,-a,w,1.3,len):add(boxG,V.ric,xx,.85,-a,w,1.7,len);g.userData.obs.push({a,x:xx,w,l:len,m,k:1,cx,amp,om,ph});continue}
  pf=Math.max(0,Math.min(2,pf+((rnd()*3)|0)-1));const oth=[0,1,2].filter(l=>l!=pf),nb=m2<=2||rnd()>(.15+m2*.07)*od?1:2;if(rnd()<.5)oth.reverse();
  for(const l of oth.slice(0,nb)){const ty=(rnd()*4)|0,x=(l-1)*4;let w,len;
   if(ty==0){w=1.9;len=4.2;const model=cityClone(CITY.cars);if(model){model.position.set(x,0,-a);model.rotation.y=Math.PI;model.scale.multiplyScalar(.9);g.add(model)}else add(boxG,V.car[(rnd()*5)|0],x,.8,-a,w,1.5,len)}else if(ty==1&&m2>2){w=2.6;len=8;add(boxG,V.bus,x,1.6,-a,w,3.2,len)}else if(ty==2){w=3;len=1.2;add(boxG,barMat,x,.6,-a,w,1.2,len)}else{w=1.4;len=2.6;add(boxG,V.ric,x,.85,-a,w,1.7,len)}
   g.userData.obs.push({a,x,w,l:len})}}
 for(let j=0;j<nv;j++){const sd=rnd()<.5?1:-1,a=30+rnd()*(S-70),m=add(boxG,V.ped,sd*8.8,.8,-a,.5,1.6,.5);g.userData.veh.push({m,a,v:(rnd()<.5?1:-1)*1.3})}
 if(k<N)add(boxG,barMat,0,2.5,-(S+7),14,5,1.2);
 else{add(boxG,destMat,0,8,-(S+10),26,16,14);add(planeG,signMat,0,12,-(S+2.9));
  const cu=add(boxG,new THREE.MeshStandardMaterial({color:0x7a3a9a}),4,1,-(S-4),.7,1.8,.5);add(boxG,new THREE.MeshStandardMaterial({color:0xffd070}),4,2.1,-(S-4),.4,.4,.4);g.userData.cust=cu;
  add(boxG,new THREE.MeshStandardMaterial({color:0xc89a5a,emissive:0x331a00}),2.6,1.2,-(S-5),.6,.5,.6)}
 
  // Add trees now if the model has loaded; loader also updates existing segments.
  addMapleTrees(g);
 return g}
function clearWorld(){for(const k in G){scene.remove(G[k]);delete G[k]}}
/* ---------- state machine ---------- */
const TR={BOOT:['MENU'],MENU:['ROUTE_PREVIEW'],ROUTE_PREVIEW:['RUN_START','MENU'],RUN_START:['RUNNING'],RUNNING:['INTERSECTION_DECISION','ARRIVAL','CRASHING'],INTERSECTION_DECISION:['TURN_ANIMATION','CRASHING'],TURN_ANIMATION:['RUNNING','CRASHING'],ARRIVAL:['MISSION_COMPLETE'],MISSION_COMPLETE:['ROUTE_PREVIEW','MENU'],CRASHING:['GAME_OVER'],GAME_OVER:['ROUTE_PREVIEW','MENU']};
const SC={MENU:'menu',ROUTE_PREVIEW:'prev',MISSION_COMPLETE:'done',GAME_OVER:'over'},HUDS=['RUN_START','RUNNING','INTERSECTION_DECISION','TURN_ANIMATION','CRASHING','ARRIVAL'];
let st='BOOT',timers=[],R=null,pv=null,paused=false,resumeT=0,inq=[],shake=0,cy=0,conf=null;
const later=(ms,fn)=>timers.push({ms,fn}),ann=t=>{$('live').textContent=t};
function go(s){if(!(TR[st]||[]).includes(s)){console.error('Illegal transition',st,'->',s);return false}
 timers=[];st=s;document.querySelectorAll('.scr').forEach(e=>e.classList.toggle('on',e.id==SC[s]));$('hud').classList.toggle('on',HUDS.includes(s));(ENTER[s]||(()=>{}))();return true}
const seqHTML=(rt)=>rt.turns.map((t,i)=>'<span>'+(i+1)+'. '+(t=='LEFT'?'←':'→')+' '+t+'</span>').join('');
const ENTER={
 MENU(){engine(false);pad(false);killConf();refreshMenu();const rt=gen(3,7);R=null;clearWorld();applyTheme(rt.theme?TH[0]:TH[0]);G[0]=buildSeg(rt,0);scene.add(G[0]);rider.position.set(0,0,-60);rider.rotation.y=0;body.rotation.set(0,0,0)},
 ROUTE_PREVIEW(){killConf();const c=cfg(mission),rt=gen(mission,(Math.random()*2147483647)|0,window._prevSeq);window._prevSeq=rt.turns.join();
  R={route:rt,cfg:c,k:0,d:0,h:0,mode:'main',lane:1,lat:0,tm:0,locked:false,closed:false,done:0,ct:0,px:0,pz:0,yaw:0,ox:0,oz:0,oyaw:0,health:100,hT:0,inv:0,sm:1};$('hr').textContent='₹'+DF().pay;
  const e=validate(rt);if(e.length)console.error('Route invalid',e);setSpd();
  clearWorld();applyTheme(c.theme);G[0]=buildSeg(rt,0);scene.add(G[0]);place();R.ox=R.px;R.oz=R.pz;R.oyaw=R.yaw;cy=R.yaw;body.rotation.set(0,0,0);
  pv={rem:5000,s:false,sec:0};drawMap($('map'),rt);$('pt').textContent='Remember '+rt.turns.length+' turns!';$('seq').innerHTML=seqHTML(rt);
  $('tut').textContent=mission<=2?'Tutorial: you ride automatically on three lanes. Tap LEFT or RIGHT to change lanes and dodge obstacles. At a junction (the timer bar appears) the same buttons turn you. A crash or wrong turn ends the run.':'';
  $('hm').textContent='Mission '+mission;$('ht').textContent='0 / '+rt.turns.length;$('pf').style.width='0%'},
 RUN_START(){$('prev').classList.remove('on');later(300,()=>go('RUNNING'));engine(true);ann('Go')},
 ARRIVAL(){R.inv=0;R.mode='stop';R.lane=1;engine(false);later(2400,()=>go('MISSION_COMPLETE'))},
 CRASHING(){engine(false);later(1400,()=>go('GAME_OVER'))},
 MISSION_COMPLETE(){claim(R.route.attemptId);$('dseq').innerHTML=seqHTML(R.route);$('dw').textContent='Wallet ₹'+SV.wallet.toLocaleString('en-IN');$('dm').textContent='Missions: '+SV.missionsCompleted;sfx.win();$('rw').textContent='₹'+DF().pay;ann('Mission complete. Reward '+DF().pay+' rupees.');
  if(!SV.reducedMotion)startConf()},
 GAME_OVER(){const w=R.reason=='timeout',ob=R.reason=='obstacle'||R.reason=='wall';$('ot').textContent=ob?'Crash!':w?'Too Slow!':'Wrong Turn!';$('od').textContent=(w?'You missed the turn! ':R.reason=='wall'?'You hit the wall! ':ob?'You hit an obstacle! ':'')+'You completed '+R.done+' of '+R.route.turns.length+' turns.';
  $('oseq').innerHTML=seqHTML(R.route);drawMap($('map2'),R.route,{k:R.k0,c:R.choice});ann($('ot').textContent)}};
/* ---------- gameplay sim ---------- */
function press(d){inq.push({d,w:st=='INTERSECTION_DECISION'&&R&&!R.locked&&!R.closed})}
function lock(d){const i=R.k,rt=R.route,pts=rt.layout.points,ok=d==rt.turns[i];R.locked=true;R.choice=d;R.ok=ok;R.k0=i;
 const C=[pts[i+1][0]*CELL,pts[i+1][1]*CELL],nh=(R.h+(d=='RIGHT'?1:3))%4,n=DIRS[nh],P2=[C[0]+n[0]*12,C[1]+n[1]*12],P0=[R.px,R.pz],C1=R.d>S?P0:C;
 let L=0,pr=P0;for(let j=1;j<=20;j++){const t=j/20,u=1-t,q=[0,1].map(a=>u*u*P0[a]+2*u*t*C1[a]+t*t*P2[a]);L+=Math.hypot(q[0]-pr[0],q[1]-pr[1]);pr=q}
 R.arc={P0,P1:C1,P2,t:0,L,nh};R.mode='arc';go('TURN_ANIMATION');
 if(ok){R.done++;G[i+1]=buildSeg(rt,i+1);scene.add(G[i+1]);sfx.ok();vib(30);$('ht').textContent=R.done+' / '+rt.turns.length;ann('Correct')}
 else{const sd=d=='RIGHT'?1:-1,dm=window._dm||(window._dm=[barMat,new THREE.MeshStandardMaterial({color:0xe0a020}),new THREE.MeshStandardMaterial({color:0x5a5f6a})]),ty=i%3,b=new THREE.Mesh(boxG,dm[ty]);
 if(ty==0){b.position.set(sd*STUBL,1.5,-S);b.scale.set(1.2,3,12)}else if(ty==1){b.position.set(sd*(STUBL+2),1.7,-S);b.scale.set(8,3.4,3.4)}else{b.position.set(sd*STUBL,2,-S);b.scale.set(.8,4,12.5)}
 G[i].add(b)}}
function crash(r){R.reason=r;R.mode='crash';R.ct=0;shake=1.2;burst();sfx.crash();vib(200);fb(r=='timeout'?'TOO SLOW!':r=='obstacle'?'CRASH!':'WRONG TURN!','bad');go('CRASHING')}
function hurt(kind){if(R.inv>0)return false;R.health-=50;R.hT=0;if(R.health<=0){crash(kind);return true}R.inv=HIT_BLINK;shake=.9;burst();sfx.crash();vib(120);ann('Hit. Health at half');return false}
function setSpd(){R.v=R.cfg.speed*ramp(R.k);R.dop=R.v*R.cfg.win/1000}
function hitObs(){const o=G[R.k]&&G[R.k].userData.obs;return !!o&&o.some(b=>Math.abs(b.x-R.lat)<b.w/2+.5&&Math.abs(b.a-R.d)<b.l/2+1)}
function place(){const pts=R.route.layout.points;
 if(R.mode=='main'||R.mode=='stop'){const f=DIRS[R.h],P=pts[R.k];R.px=P[0]*CELL+f[0]*R.d-f[1]*R.lat;R.pz=P[1]*CELL+f[1]*R.d+f[0]*R.lat;R.yaw=yawOf(R.h)}
 else if(R.mode=='arc'){const a=R.arc,t=Math.min(1,a.t),u=1-t,B=i=>u*u*a.P0[i]+2*u*t*a.P1[i]+t*t*a.P2[i];R.px=B(0);R.pz=B(1);
  R.yaw=Math.atan2(-(2*u*(a.P1[0]-a.P0[0])+2*t*(a.P2[0]-a.P1[0])),-(2*u*(a.P1[1]-a.P0[1])+2*t*(a.P2[1]-a.P1[1])))}
 else if(R.mode=='stub'){R.px=R.sc[0]+R.sd[0]*R.ds;R.pz=R.sc[1]+R.sd[1]*R.ds}}
function tick(dt){
 if(timers.length){timers.forEach(t=>t.ms-=dt*1000);const due=timers.filter(t=>t.ms<=0);timers=timers.filter(t=>t.ms>0);due.forEach(t=>t.fn())}
 const q=inq;inq=[];if(!R||!HUDS.includes(st)||st=='RUN_START')return;
 R.ox=R.px;R.oz=R.pz;R.oyaw=R.yaw;
 const hit=q.find(x=>x.w);if(hit&&st=='INTERSECTION_DECISION'&&!R.locked)lock(hit.d);
 R.inv=Math.max(0,R.inv-dt);if(R.health<100){R.hT+=dt;if(R.hT>=HEAL){R.health=100;R.hT=0;ann('Health recovered')}}R.sm+=((R.mode=='arc'?.72:1)-R.sm)*(1-Math.exp(-(R.mode=='arc'?6:2.5)*dt));
 const v=R.v,N=R.route.turns.length;R.tm+=dt;const ob=G[R.k]&&G[R.k].userData.obs;if(ob)for(const o of ob)if(o.k){o.x=o.cx+o.amp*Math.sin(o.om*R.tm+o.ph);o.m.position.x=o.x}
 if(st=='RUNNING'&&R.mode=='main'){for(const x of q)if(!x.w)R.lane=Math.max(0,Math.min(2,R.lane+(x.d=='RIGHT'?1:-1)))}
 const tl=(R.lane-1)*4;R.lat+=Math.max(-22*dt,Math.min(22*dt,tl-R.lat));
 if(R.mode=='main'||R.mode=='stop'){
  if(R.mode=='stop'){const rem=S-8-R.d;R.d+=rem>.15?Math.min(Math.max(1.5,rem*2.2)*dt,rem):0}else R.d+=v*R.sm*dt;
  if(R.mode=='main'){if(hitObs()&&hurt('obstacle')){place();return}if(R.k<N){const stop=S-12;
   if(st=='RUNNING'&&R.d>=stop-R.dop){go('INTERSECTION_DECISION');ann('Intersection ahead');beep(520,.1,'square',.12)}
   if(R.d>=WALLD&&!R.locked){if(hurt('wall')){R.v*=.15;place();return}R.d=S-45;R.sm=.35}}
   else if(R.d>=S-30&&st=='RUNNING')go('ARRIVAL')}
  place()}
 else if(R.mode=='arc'){const a=R.arc;a.t+=v*R.sm*dt/a.L;
  if(a.t>=1){a.t=1;place();R.k++;R.h=a.nh;R.lane=1;R.lat=0;setSpd();if(R.ok){$('hm').textContent='Mission '+mission+' · '+(R.v/R.cfg.speed).toFixed(2)+'×';}
   if(R.ok){R.d=12;R.mode='main';R.locked=false;R.closed=false;const old=G[R.k-1];if(old){scene.remove(old);delete G[R.k-1]}}
   else{R.mode='stub';R.ds=12;R.sc=a.P1;R.sd=DIRS[a.nh]}
   go('RUNNING')}else place()}
 else if(R.mode=='stub'){R.ds+=v*dt;place();if(R.ds>=STUBL-2)crash('wrong')}
 else if(R.mode=='crash'){R.ct+=dt;const vv=v*Math.max(0,1-R.ct*2.2);R.px+=-Math.sin(R.yaw)*vv*dt;R.pz+=-Math.cos(R.yaw)*vv*dt}
}
/* ---------- map ---------- */
function drawMap(cv,rt,fail){const g=cv.getContext('2d'),W=cv.width,H=cv.height,pts=rt.layout.points,hs=rt.layout.headings,N=rt.turns.length,pad=Math.max(48,W*.1);
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs),y0=Math.min(...ys),w=Math.max(1,Math.max(...xs)-x0),h=Math.max(1,Math.max(...ys)-y0);
 const sc=Math.min((W-2*pad)/w,(H-2*pad)/h,W*.28),ox=(W-w*sc)/2,oy=(H-h*sc)/2,P=p=>[ox+(p[0]-x0)*sc,oy+(p[1]-y0)*sc],fs=Math.round(W/22);
 g.clearRect(0,0,W,H);g.lineCap='round';g.lineJoin='round';g.strokeStyle='#26e0d033';g.lineWidth=W/34;g.beginPath();pts.forEach((p,i)=>{const q=P(p);i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1])});g.stroke();
 g.strokeStyle='#26e0d0';g.lineWidth=W/70;g.stroke();
 g.font=fs+'px sans-serif';g.textAlign='center';g.textBaseline='middle';const s0=P(pts[0]),d0=P(pts[N+1]);g.fillText('🛵',s0[0],s0[1]);g.fillText(TH.find(t=>t.n==rt.theme).d,d0[0],d0[1]);
 for(let k=0;k<N;k++){const c=P(pts[k+1]),n=DIRS[hs[k+1]],R2=W/30,ar=W/17;
  g.strokeStyle='#ffb81f';g.fillStyle='#ffb81f';g.lineWidth=W/90;g.beginPath();g.moveTo(c[0]+n[0]*R2,c[1]+n[1]*R2);g.lineTo(c[0]+n[0]*ar,c[1]+n[1]*ar);g.stroke();
  const e=[c[0]+n[0]*(ar+4),c[1]+n[1]*(ar+4)];g.beginPath();g.moveTo(e[0],e[1]);g.lineTo(e[0]-n[0]*8+n[1]*6,e[1]-n[1]*8-n[0]*6);g.lineTo(e[0]-n[0]*8-n[1]*6,e[1]-n[1]*8+n[0]*6);g.fill();
  g.fillStyle='#15112a';g.strokeStyle='#ffb81f';g.beginPath();g.arc(c[0],c[1],R2,0,PI*2);g.fill();g.stroke();g.fillStyle='#fff';g.font='bold '+Math.round(fs*.7)+'px sans-serif';g.fillText(k+1,c[0],c[1]+1);
  g.font='bold '+Math.round(fs*.62)+'px sans-serif';const lb=(rt.turns[k]=='LEFT'?'↰ L':'↱ R'),lx=c[0]-n[0]*W/12,ly=c[1]-n[1]*W/20;g.fillStyle='#ffb81f';g.fillText(lb,lx,ly)}
 if(fail&&fail.c){const c=P(pts[fail.k+1]),wd=DIRS[(hs[fail.k]+(fail.c=='RIGHT'?1:3))%4],e=[c[0]+wd[0]*sc*.3,c[1]+wd[1]*sc*.3];g.strokeStyle='#ff4f6a';g.lineWidth=5;g.beginPath();g.moveTo(c[0],c[1]);g.lineTo(e[0],e[1]);g.stroke();g.fillStyle='#ff4f6a';g.font='bold '+fs+'px sans-serif';g.fillText('✖',e[0],e[1])}}
let dust=null,po=[];
function burst(){if(SV.reducedMotion||!GLOK)return;if(!dust){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(180),3));dust={m:new THREE.Points(g,new THREE.PointsMaterial({size:.45,color:0xcbb89a,transparent:true,opacity:.85})),v:[],t:0};scene.add(dust.m)}
 const p=dust.m.geometry.attributes.position;dust.v=[];for(let i=0;i<60;i++){p.setXYZ(i,R.px,.6,R.pz);dust.v.push([(Math.random()-.5)*8,Math.random()*5,(Math.random()-.5)*8])}p.needsUpdate=true;dust.t=1.2;dust.m.visible=true}
function pad(on){try{if(on&&!po.length){const a=aud();if(!a)return;[98,147,196].forEach(f=>{const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.value=f;g.gain.value=.012;o.connect(g);g.connect(mg);o.start();po.push(o,g)})}else if(!on&&po.length){po.forEach(n=>n.stop?n.stop():n.disconnect());po=[]}}catch(e){po=[]}}
/* ---------- UI helpers ---------- */
function fb(t,c){}
function vib(ms){try{if(!SV.reducedMotion&&navigator.vibrate)navigator.vibrate(ms)}catch(e){}}
function refreshMenu(){$('wal').textContent='₹'+SV.wallet.toLocaleString('en-IN');$('mc').textContent='Missions: '+SV.missionsCompleted;$('snd').checked=SV.sound;$('eng').checked=SV.eng!==false;$('mu').checked=SV.music!==false;$('ql').value=SV.quality;$('df').value=SV.diff;}
function startConf(){const n=120,g=new THREE.BufferGeometry(),p=new Float32Array(n*3),c=new Float32Array(n*3),vel=[];
 for(let i=0;i<n;i++){p[i*3]=R.px+(Math.random()-.5)*4;p[i*3+1]=3;p[i*3+2]=R.pz+(Math.random()-.5)*4;vel.push([(Math.random()-.5)*6,6+Math.random()*6,(Math.random()-.5)*6]);const col=new THREE.Color().setHSL(Math.random(),.9,.6);c.set([col.r,col.g,col.b],i*3)}
 g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));conf={m:new THREE.Points(g,new THREE.PointsMaterial({size:.5,vertexColors:true})),vel,t:0};scene.add(conf.m)}
function killConf(){if(dust){dust.m.visible=false;dust.t=0}if(conf){scene.remove(conf.m);conf.m.geometry.dispose();conf.m.material.dispose();conf=null}}
function freeze(){if(HUDS.includes(st)&&!paused){paused=true;resumeT=0;inq=[];$('rcd').textContent='';$('resume').style.display='';$('pause').classList.add('on')}}
document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden)freeze()});
$('resume').onclick=()=>{resumeT=3;$('resume').style.display='none'};
/* ---------- input ---------- */
addEventListener('keydown',e=>{if(e.repeat)return;const k=e.key.toLowerCase();if(k=='arrowleft'||k=='a'){press('LEFT');if(HUDS.includes(st))e.preventDefault()}else if(k=='arrowright'||k=='d'){press('RIGHT');if(HUDS.includes(st))e.preventDefault()}else if(k=='`')$('dbg').style.display=$('dbg').style.display=='block'?'none':'block'});
for(const[i,d]of[['bl','LEFT'],['br','RIGHT']])$(i).addEventListener('pointerdown',e=>{e.preventDefault();press(d)});
let sw=null;addEventListener('pointerdown',e=>{if(!e.target.closest('button'))sw={x:e.clientX,y:e.clientY,t:performance.now()}});
addEventListener('pointerup',e=>{if(!sw)return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5&&performance.now()-sw.t<600)press(dx<0?'LEFT':'RIGHT');sw=null});
let gp={l:0,r:0};function pollPad(){try{const p=(navigator.getGamepads?navigator.getGamepads():[])[0];if(!p)return;const l=p.buttons[14]?.pressed||p.buttons[4]?.pressed||p.axes[0]<-.6,r=p.buttons[15]?.pressed||p.buttons[5]?.pressed||p.axes[0]>.6;if(l&&!gp.l)press('LEFT');if(r&&!gp.r)press('RIGHT');gp={l,r}}catch(e){}}
$('go').onclick=()=>{aud();pad(true);music(true);mission=SV.highestUnlocked;go('ROUTE_PREVIEW')};$('nx').onclick=()=>{mission++;go('ROUTE_PREVIEW')};$('rt').onclick=()=>go('ROUTE_PREVIEW');
$('mm1').onclick=$('mm2').onclick=()=>go('MENU');
$('snd').onchange=e=>{SV.sound=e.target.checked;if(mg)mg.gain.value=SV.sound?.25:0;if(!SV.sound){engine(false);pad(false);music(false)}else music(true);save()};$('mu').onchange=e=>{SV.music=e.target.checked;music(e.target.checked);save()};$('eng').onchange=e=>{SV.eng=e.target.checked;if(!SV.eng)engine(false);save()};
$('ql').onchange=e=>{SV.quality=e.target.value;save();resize()};$('df').onchange=e=>{SV.diff=e.target.value;save()};$('rs').onclick=()=>{if(confirm('Reset all progress?')){SV=Object.assign({},DEF);save();refreshMenu()}};
/* ---------- loop / render ---------- */
let last=performance.now(),acc=0,fAcc=0,fN=0,calm=0,dbgT=0,fps=0;
function resize(){if(!GLOK)return;const mob=matchMedia('(pointer:coarse)').matches,dpr=devicePixelRatio||1,cap={low:1,med:1.25,high:2,auto:1.5}[SV.quality];pix=Math.min(dpr,mob?Math.min(cap,1.5):cap)*(SV.quality=='auto'?autoScale:1);rn.setPixelRatio(pix);rn.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
addEventListener('resize',resize);
const lerp=(a,b,t)=>a+(b-a)*t;
function frame(){requestAnimationFrame(frame);const now=performance.now();let dt=now-last;last=now;if(dt>250)dt=16.7;
 pollPad();musTick();
 if(paused){inq=[];if(resumeT>0){resumeT-=dt/1000;$('rcd').textContent=Math.max(1,Math.ceil(resumeT));if(resumeT<=0){paused=false;resumeT=0;acc=0;$('pause').classList.remove('on')}}}
 else{
  if(st=='ROUTE_PREVIEW'){if(!pv.s)pv.s=true;else pv.rem-=dt;const sec=Math.max(1,Math.ceil(pv.rem/1000));if(sec!=pv.sec){pv.sec=sec;$('cd').textContent=sec;sfx.tick();ann(String(sec))}if(pv.rem<=0)go('RUN_START')}
  acc+=Math.min(dt,50)/1000;while(acc>=1/60){tick(1/60);acc-=1/60}
  if(!HUDS.includes(st)&&timers.length){/* menu-state timers */}
 }
 if(!GLOK)return;
  if(window._deliverySky && cam) window._deliverySky.position.copy(cam.position); if(window._gndFar&&cam){window._gndFar.position.x=cam.position.x;window._gndFar.position.z=cam.position.z}
  const al=Math.min(1,acc*60),t=now/1000;
 if(R&&st!='MENU'&&st!='BOOT'){
  rider.position.set(lerp(R.ox,R.px,al),0,lerp(R.oz,R.pz,al));rider.visible=!(R.inv>0&&HUDS.includes(st)&&!paused)||Math.floor(t*12)%2==0;let dy=R.yaw-R.oyaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));const yw=R.oyaw+dy*al;rider.rotation.y=yw;
  body.rotation.z=R.mode=='arc'?(R.choice=='RIGHT'?-1:1)*.35*Math.sin(PI*R.arc.t):(R.mode=='main'?-(((R.lane-1)*4)-R.lat)*.08:0);body.rotation.x=R.mode=='crash'?-Math.min(R.ct*3,1.3):0;body.position.y=R.mode=='crash'?Math.abs(Math.sin(R.ct*8))*.4*Math.max(0,1-R.ct):(R.mode=='main'?Math.sin(t*20)*.02:0);
  let d2=yw-cy;d2=Math.atan2(Math.sin(d2),Math.cos(d2));cy+=d2*(1-Math.exp(-6*dt/1000));const fx=-Math.sin(cy),fz=-Math.cos(cy),p=rider.position;
  cam.position.set(p.x-fx*9,4.8,p.z-fz*9);if(shake>0&&!SV.reducedMotion){cam.position.x+=(Math.random()-.5)*shake;cam.position.y+=(Math.random()-.5)*shake}shake=Math.max(0,shake-dt/500);
  cam.lookAt(p.x+fx*8,1.2,p.z+fz*8);cam.fov=60+R.v*R.sm*.28;cam.updateProjectionMatrix();
  if(HUDS.includes(st)){const N=R.route.turns.length,stop=S-12;$('pf').style.width=Math.min(100,(R.k*S+R.d)/((N+1)*S)*100)+'%';
   $('amb').style.display=R.mode=='main'&&R.k<N&&!R.locked&&R.d>=stop-R.dop-30?'block':'none';
   const win=st=='INTERSECTION_DECISION'&&!R.locked&&!R.closed,L1=win?'↰ TURN LEFT':'← LANE';if($('bl').textContent!=L1){$('bl').textContent=L1;$('br').textContent=win?'TURN RIGHT ↱':'LANE →'}$('wb').style.display=win?'block':'none';if(win)$('wf').style.width=Math.max(0,(WALLD-R.d)/(WALLD-stop+R.dop)*100)+'%';
   $('hp').children[0].className=R.health>=50?'':'off';$('hp').children[1].className=R.health>=100?'':'off';if(eo)eo.frequency.value=40+R.v*R.sm*.9}
 }else if(st=='MENU'){rider.visible=true;const a=t*.3;cam.position.set(Math.sin(a)*12,3.4,-60+Math.cos(a)*12);cam.lookAt(0,1.4,-60);cam.fov=55;cam.updateProjectionMatrix()}
 if(conf){conf.t+=dt/1000;const p=conf.m.geometry.attributes.position;for(let i=0;i<p.count;i++){conf.vel[i][1]-=7*dt/1000;p.setXYZ(i,p.getX(i)+conf.vel[i][0]*dt/1000,Math.max(0,p.getY(i)+conf.vel[i][1]*dt/1000),p.getZ(i)+conf.vel[i][2]*dt/1000)}p.needsUpdate=true}
 if(!paused){for(const k in G){const vs=G[k].userData.veh;if(vs)for(const c of vs){c.a+=c.v*dt/1000;if(c.a<22)c.a=S-30;else if(c.a>S-30)c.a=22;c.m.position.z=-c.a}}}
 if(dust&&dust.t>0){dust.t-=dt/1000;const p=dust.m.geometry.attributes.position;for(let i=0;i<60;i++){const v=dust.v[i];v[1]-=9*dt/1000;p.setXYZ(i,p.getX(i)+v[0]*dt/1000,Math.max(.1,p.getY(i)+v[1]*dt/1000),p.getZ(i)+v[2]*dt/1000)}p.needsUpdate=true;if(dust.t<=0)dust.m.visible=false}
 if(st=='MISSION_COMPLETE'&&R){const c=G[R.k]&&G[R.k].userData.cust;if(c)c.position.y=1+Math.abs(Math.sin(t*7))*.5}
 rn.render(scene,cam);
 fAcc+=dt;fN++;if(fAcc>=2000){const ms=fAcc/fN;fps=1000/ms;if(SV.quality=='auto'){if(ms>24&&autoScale>.6){autoScale=Math.max(.6,autoScale-.15);calm=0;resize()}else if(ms<14){if(++calm>=3&&autoScale<1){autoScale=Math.min(1,autoScale+.15);calm=0;resize()}}else calm=0}fAcc=0;fN=0}
 if($('dbg').style.display=='block'&&now-dbgT>300){dbgT=now;const i=rn.info;$('dbg').textContent='fps '+fps.toFixed(0)+' state '+st+'\nseed '+(R?R.route.seed:'-')+' turn '+(R?R.k:'-')+'\ncalls '+i.render.calls+' tris '+i.render.triangles+'\ngeo '+i.memory.geometries+' tex '+i.memory.textures}}
/* ---------- tests / hook ---------- */
function selfTest(){const r=[],t=(n,c)=>r.push([n,!!c]),a=gen(5,42),b=gen(5,42);t('deterministic',a.turns.join()==b.turns.join());
 for(let m=1;m<=14;m++){const x=gen(m,m*77+1);t('valid m'+m,validate(x).length==0&&x.turns.length==cfg(m).turns)}
 const bad=['RIGHT','RIGHT','RIGHT','RIGHT'];t('overlap detected',validate({turns:bad,layout:layout(bad)}).includes('overlap'));
 const s0=st;t('illegal transition rejected',go('GAME_OVER')===false&&st==s0);const snap=JSON.stringify(SV),c0=claimed;claim(-5);claim(-5);t('reward once',SV.wallet==JSON.parse(snap).wallet+DF().pay);SV=JSON.parse(snap);claimed=c0;save();
 t('window>=900ms',[1,5,9,12,30].every(m=>cfg(m).win>=900));console.table(r);return r.every(x=>x[1])}
window.__DD__={get state(){return st},get route(){return R&&R.route},get turn(){return R&&R.k},press,step(ms){for(let i=0;i<Math.round(ms/16.667);i++)tick(1/60)},selfTest,leak(n=20){if(st!='ROUTE_PREVIEW')return'start a mission first';const a=JSON.stringify(rn.info.memory);for(let i=0;i<n;i++)ENTER.ROUTE_PREVIEW();rn.render(scene,cam);return[a,JSON.stringify(rn.info.memory)]}};
if(GLOK){resize();SV.sound=SV.sound;go('MENU');requestAnimationFrame(frame)}
