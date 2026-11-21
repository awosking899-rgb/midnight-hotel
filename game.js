(()=>{'use strict';
const T=THREE,$=s=>document.querySelector(s),touch=matchMedia('(pointer:coarse)').matches;
if(touch)document.body.classList.add('touch');
const me={name:'',skin:'#c68642',shirt:'#7a1f1f',pants:'#2a2a33',hair:'#1b1210',hstyle:'short',acc:'none',pid:localStorage.mh_pid||(localStorage.mh_pid=Math.random().toString(36).slice(2,10))};
let ws,code=null,started=false,world={doors:{},unlocked:{},taken:{},shared:[],radio:false,decisions:{}},inv=[],clues=[],peers={},retry=0,panelOpen=false;
const SET=Object.assign({vol:1,sens:1},JSON.parse(localStorage.mh_set||'{}')),evlog=[];let dlgOpen=false;
const send=o=>ws&&ws.readyState===1&&ws.send(JSON.stringify(o));
const toast=(m,ms=3200)=>{evlog.push(m);const e=$('#toast');e.textContent=m;e.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.opacity=0,ms)};
/* ---------- audio (procedural) ---------- */
let AC;const au=()=>{if(!AC){try{AC=new(window.AudioContext||webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=55;g.gain.value=.03;o.connect(g).connect(AC.destination);o.start()}catch{}}if(AC&&AC.state==='suspended')AC.resume();return AC};
function noise(d,f,v){const a=au();if(!a)return;const b=a.createBuffer(1,a.sampleRate*d,a.sampleRate),c=b.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=(Math.random()*2-1)*(1-i/c.length);const s=a.createBufferSource();s.buffer=b;const fl=a.createBiquadFilter();fl.type='lowpass';fl.frequency.value=f;const g=a.createGain();g.gain.value=v*SET.vol;s.connect(fl).connect(g).connect(a.destination);s.start()}
function tone(f,d,v){const a=au();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.frequency.value=f;g.gain.setValueAtTime(v*SET.vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+d)}
/* ---------- avatar ---------- */
function makeAvatar(a){const g=new T.Group();
 const add=(geo,c,x,y,z)=>{const m=new T.Mesh(geo,new T.MeshStandardMaterial({color:c,roughness:.8}));m.position.set(x,y,z);g.add(m);return m};
 for(const s of[-1,1]){add(new T.BoxGeometry(.18,.8,.2),a.pants,s*.12,.4,0);add(new T.BoxGeometry(.2,.08,.28),'#111',s*.12,.04,.04);add(new T.BoxGeometry(.12,.58,.14),a.shirt,s*.31,1.12,0)}
 add(new T.BoxGeometry(a.gender==='f'?.44:.5,.62,.28),a.shirt,0,1.12,0);{const h=add(new T.SphereGeometry(.14,16,12),a.skin,0,1.58,0);if(a.face==='long')h.scale.set(.9,1.2,.95);else if(a.face==='wide')h.scale.set(1.15,.95,1);for(const e of[-1,1])add(new T.SphereGeometry(.018,8,6),a.eyes||'#222',e*.05,1.6,.13)}
 if(a.hstyle!=='bald')add(new T.SphereGeometry(.15,16,8,0,6.3,0,1.45),a.hair,0,1.6,0);
 if(a.hstyle==='long')add(new T.BoxGeometry(.3,.36,.08),a.hair,0,1.45,-.1);
 if(a.acc==='hat'){add(new T.CylinderGeometry(.22,.22,.03,16),'#222',0,1.7,0);add(new T.CylinderGeometry(.12,.12,.14,16),'#222',0,1.78,0)}
 if(a.acc==='glasses')add(new T.BoxGeometry(.24,.04,.02),'#050505',0,1.6,.14);
 return g}
const avatarOpts=()=>({skin:$('#skin').value,shirt:$('#shirt').value,pants:$('#pants').value,hair:$('#hair').value,hstyle:$('#hstyle').value,acc:$('#acc').value,gender:$('#gender').value,face:$('#face').value,eyes:$('#eyes').value});
let pvS,pvC,pvR,pvA;
try{pvR=new T.WebGLRenderer({canvas:$('#prev'),antialias:true,alpha:true});pvS=new T.Scene();pvC=new T.PerspectiveCamera(35,440/600,.1,20);pvC.position.set(0,1.1,3.8);pvC.lookAt(0,.95,0);pvS.add(new T.AmbientLight(0xffffff,.6));const dl=new T.DirectionalLight(0xffd9a0,1);dl.position.set(2,3,3);pvS.add(dl);
 const rebuild=()=>{if(pvA)pvS.remove(pvA);pvA=makeAvatar(avatarOpts());pvS.add(pvA)};rebuild();
 document.querySelectorAll('#menu input[type=color],#menu select').forEach(e=>e.oninput=rebuild);
 (function pl(){if(started)return;pvA.rotation.y+=.012;pvR.render(pvS,pvC);requestAnimationFrame(pl)})()}catch(e){console.warn('preview unavailable',e)}
function label(name){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.font='700 34px Cairo,sans-serif';g.textAlign='center';g.fillStyle='#e8dcc0';g.shadowColor='#000';g.shadowBlur=6;g.fillText(name,128,42);const s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),transparent:true,depthTest:false}));s.scale.set(1,.25,1);s.position.y=2;return s}
/* ---------- network ---------- */
function connect(mode,c){ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);
 ws.onopen=()=>{retry=0;send({t:'join',mode,code:c,pid:me.pid,me})};
 ws.onmessage=e=>{const m=JSON.parse(e.data);on[m.t]&&on[m.t](m)};
 ws.onerror=()=>{if(!started)alert('تعذر الاتصال بالخادم')};
 ws.onclose=()=>{if(started){$('#net').textContent='انقطع الاتصال… جارٍ إعادة المحاولة';setTimeout(()=>connect('join',code),Math.min(5000,1000*++retry))}}}
const on={err:m=>alert(m.msg),
 joined:m=>{code=m.code;world=Object.assign({doors:{},unlocked:{},taken:{},shared:[],radio:false,decisions:{}},m.world);if(m.mine&&!started){clues=m.mine.clues||[];inv=m.mine.inv||[]}
  $('#net').textContent='الغرفة: '+code+(touch?'':'  —  شارك الكود مع صديقك');if(m.gifts&&m.gifts.length){inv.push(...m.gifts);toast('وصلتك عناصر من اللاعب الآخر')}for(const p of m.peers)addPeer(p.pid,p.me);if(!started)start();else applyWorld()},
 peer:m=>{addPeer(m.pid,m.me);toast('انضم لاعب: '+m.me.name)},
 pos:m=>{const p=peers[m.pid];if(p){p.tx=m.x;p.tz=m.z;p.ty=m.yaw;p.tY=m.y||0}},
 gone:m=>{const p=peers[m.pid];if(p){scene.remove(p.g);delete peers[m.pid];toast('غادر اللاعب الآخر')}},
 act:m=>applyAct(m),
 chat:m=>log(m.name+': '+m.text)};
function addPeer(pid,a){if(!scene){peers[pid]={pending:a};return}const o=peers[pid];if(o&&o.g)scene.remove(o.g);const g=makeAvatar(a);g.add(label(a.name));scene.add(g);peers[pid]={g,tx:o?.tx??-3,tz:o?.tz??3,ty:o?.ty??0}}
const log=t=>{const l=$('#chatlog');const p=document.createElement('p');p.textContent=t;l.append(p);l.scrollTop=1e9;if(panelOpen===false)toast(t)};
/* ---------- world ---------- */
let scene,cam,ren,colliders=[],doors={},items=[],lamps=[],flicker=0;
const P={y:0,x:-3,z:3,yaw:Math.PI,pitch:0,r:.35};
function tex(draw,w=256,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;return t}
const rep=(t,a,b)=>{const c=t.clone();c.repeat.set(a,b);c.needsUpdate=true;return c};
const std=(o)=>new T.MeshStandardMaterial(Object.assign({roughness:.85},o));
function build(){
 scene=new T.Scene();scene.background=new T.Color(0x07040a);scene.fog=new T.FogExp2(0x07040a,.055);
 cam=new T.PerspectiveCamera(70,innerWidth/innerHeight,.05,60);cam.rotation.order='YXZ';
 ren=new T.WebGLRenderer({canvas:$('#gl'),antialias:!touch});ren.setPixelRatio(Math.min(devicePixelRatio,2));ren.setSize(innerWidth,innerHeight);ren.outputEncoding=T.sRGBEncoding;ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=1.15;
 scene.add(new T.AmbientLight(0x3a2a2a,.9));
 const wallT=tex((g,w,h)=>{g.fillStyle='#3a1a1a';g.fillRect(0,0,w,h);for(let i=0;i<8;i++){g.fillStyle=i%2?'#2c1313':'#44201f';g.fillRect(i*32,0,32,h);g.fillStyle='rgba(201,162,75,.4)';g.fillRect(i*32,0,2,h)}for(let i=0;i<600;i++){g.fillStyle='rgba(0,0,0,.1)';g.fillRect(Math.random()*w,Math.random()*h,2,2)}g.fillStyle='#1a0d08';g.fillRect(0,h-40,w,40)});
 const floorT=tex((g,w,h)=>{for(let i=0;i<8;i++){g.fillStyle=`hsl(25,${35+Math.random()*10}%,${14+Math.random()*7}%)`;g.fillRect(0,i*32,w,32);g.fillStyle='#0008';g.fillRect(0,i*32,w,2);g.fillRect(Math.random()*w,i*32,2,32)}});
 const woodM=std({color:0x4a2b18}),goldM=std({color:0xc9a24b,metalness:.7,roughness:.35}),ceilM=std({color:0x1d1210});
 const rect=(x1,z1,x2,z2)=>{const w=x2-x1,d=z2-z1;for(const[y,m,r]of[[0,std({map:rep(floorT,w/2,d/2)}),-1],[3,ceilM,1]]){const p=new T.Mesh(new T.PlaneGeometry(w,d),m);p.rotation.x=r*Math.PI/2;p.position.set((x1+x2)/2,y,(z1+z2)/2);scene.add(p)}};
 [[-6,-6,6,6],[6,-2,22,2],[9,-8,15,-2],[15,-8,21,-2],[9,2,15,8]].forEach(r=>rect(...r));
 const box=(x,y,z,w,h,d,m,col=true)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(x,y,z);scene.add(b);if(col)colliders.push({x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2});return b};
 const wallSeg=(a,b,fixed,horiz)=>{if(b-a<.01)return;const len=b-a+.3,c=(a+b)/2,m=std({map:rep(wallT,len/3,1)});horiz?box(c,1.5,fixed,len,3,.3,m):box(fixed,1.5,c,.3,3,len,m)};
 const wall=(fixed,a,b,gaps,horiz)=>{let cur=a;for(const[c,w]of(gaps||[])){wallSeg(cur,c-w/2,fixed,horiz);horiz?box(c,2.7,fixed,w,.6,.3,woodM,false):box(fixed,2.7,c,.3,.6,w,woodM,false);cur=c+w/2}wallSeg(cur,b,fixed,horiz)};
 const wallX=(z,a,b,g)=>wall(z,a,b,g,true),wallZ=(x,a,b,g)=>wall(x,a,b,g,false);
 wallX(-6,-6,6,[[-4.5,1.6]]);wallX(6,-6,6,[[-3,1.6]]);wallZ(-6,-6,6);wallZ(6,-6,6,[[0,3]]);
 wallX(-2,6,22,[[12,1.6],[18,1.6]]);wallX(2,6,22,[[12,1.6]]);wallZ(22,-2,2,[[0,2]]);
 wallX(-8,9,21);wallZ(9,-8,-2);wallZ(15,-8,-2);wallZ(21,-8,-2);wallX(8,9,15);wallZ(9,2,8,[[4,1.6]]);wallZ(15,2,8);
 /* doors */
 [{id:'d101',name:'باب الغرفة 101',x:12,z:-2,swing:1,lock:'key101'},{id:'d102',name:'باب الغرفة 102',x:18,z:-2,swing:1,lock:'code'},{id:'dlib',name:'باب المكتبة',x:12,z:2,swing:-1}].forEach(d=>{
  const g=new T.Group(),m=new T.Mesh(new T.BoxGeometry(1.6,2.4,.1),woodM);m.position.set(.8,1.2,0);g.add(m);const k=new T.Mesh(new T.SphereGeometry(.05),goldM);k.position.set(1.4,1.1,.08);g.add(k);g.position.set(d.x-.8,0,d.z);scene.add(g);
  d.g=g;d.ang=0;d.open=false;d.col={x1:d.x-.8,x2:d.x+.8,z1:d.z-.15,z2:d.z+.15,door:d};colliders.push(d.col);doors[d.id]=d;
  items.push({name:d.name,x:d.x,z:d.z,fn:()=>useDoor(d)})});
 /* furniture */
 const lobbyDesk=box(0,.55,-4.6,3,1.1,.9,woodM);
 box(-3.5,.4,3.8,2.4,.8,.9,std({color:0x5a1414}));box(-3,.9,-2,.6,1.8,.6,std({color:0x2a1a14}));box(3,.9,-2,.6,1.8,.6,std({color:0x2a1a14}));
 const clockFace=tex((g,w,h)=>{g.fillStyle='#e8dcc0';g.beginPath();g.arc(128,128,110,0,7);g.fill();g.strokeStyle='#111';g.lineWidth=8;g.beginPath();g.moveTo(128,128);g.lineTo(128+Math.sin(5.9)*60,128-Math.cos(5.9)*60);g.moveTo(128,128);g.lineTo(128+Math.sin(3.5)*85,128-Math.cos(3.5)*85);g.stroke()});
 box(-5.5,1.1,0,.5,2.2,.6,woodM);const cf=new T.Mesh(new T.CircleGeometry(.2,24),new T.MeshBasicMaterial({map:clockFace}));cf.position.set(-5.24,1.8,0);cf.rotation.y=Math.PI/2;scene.add(cf);
 const radio=box(4.5,.9,-5.2,.5,.3,.25,std({color:0x1a1a1a}));box(4.5,.4,-5.2,.8,.8,.5,woodM);
 box(10.4,.3,-6.8,1.4,.6,2.2,std({color:0x5a1414}));box(12.6,.4,-7.3,1.6,.8,.7,woodM);
 box(19.6,.3,-6.6,1.4,.6,2.2,std({color:0x333344}));box(18,.4,-7.3,1.6,.8,.7,woodM);
 const shelfT=tex((g,w,h)=>{g.fillStyle='#2a1810';g.fillRect(0,0,w,h);for(let r=0;r<5;r++)for(let x=4;x<w-10;x+=12){g.fillStyle=`hsl(${Math.random()*40},${40+Math.random()*30}%,${18+Math.random()*18}%)`;g.fillRect(x,r*50+8,9,40)}});
 box(9.5,1.2,5,.5,2.4,5,std({map:rep(shelfT,1,1)}));box(14.5,1.2,5,.5,2.4,5,std({map:rep(shelfT,1,1)}));box(12,1.2,7.7,5,2.4,.5,std({map:rep(shelfT,1,1)}));
 /* lights */
 [[0,2.6,0,1.1,14,true],[14,2.6,0,.8,12],[12,2.4,-5,.6,9],[12,2.4,5,.7,9],[18,2.4,-5,.45,9]].forEach(([x,y,z,i,d,f])=>{const l=new T.PointLight(0xffb870,i,d,1.6);l.position.set(x,y,z);scene.add(l);l.userData.base=i;if(f)lamps.push(l);const b=new T.Mesh(new T.SphereGeometry(.1),new T.MeshBasicMaterial({color:0xffd9a0}));b.position.set(x,y+.2,z);scene.add(b)});
 /* items */
 const CL={c1:['دفتر الحجز','النزيل الأخير سجّل في الغرفة 101 ولم يغادر. بجانب الاسم مسح أحدهم الساعة.'],c2:['ساعة الردهة','الساعة متوقفة عند 11:47. على الإطار كُتب بخط صغير: «الأبواب تعرف الوقت».'],c3:['رسالة في الغرفة 101','«لم تتوقف الساعة. نحن الذين توقفنا. الغرفة 102 تُفتح بالوقت الذي لا يمرّ.»'],c4:['سجل المكتبة','المدير مراد أغلق الغرفة 102 ليلة الحريق وأخذ المفتاح معه. لم يَرَه أحد بعدها.'],c5:['خطاب الغرفة 102','«إن وجدتما هذا الخطاب فأنتما لستما أول من استيقظ هنا… ابحثا عن ياسين.»']};
 const take=(id,label,clue)=>{if(world.taken[id])return;doAct({k:'take',id});if(label&&!inv.includes(id)){inv.push(label);}if(clue)addClue(clue,CL);tone(660,.4,.1)};
 const defs=[
  {id:'drawer',name:'درج الاستقبال',x:0,z:-4.6,y:1.15,take:1,fn:()=>{inv.push('key101');addClue('c1',CL);doAct({k:'take',id:'drawer'});tone(660,.4,.1);toast('وجدت مفتاح الغرفة 101')}},
  {id:'clock',name:'ساعة الردهة',x:-5.4,z:0,y:1.8,fn:()=>{addClue('c2',CL);toast(CL.c2[1],5000)}},
  {id:'radio',name:'المذياع',x:4.5,z:-5.2,y:1,fn:()=>{doAct({k:'radio',on:!world.radio});toast(world.radio?'المذياع يهمس…':'أُطفئ المذياع')}},
  {id:'note101',name:'رسالة على المكتب',x:12.6,z:-7.3,y:.9,fn:()=>{addClue('c3',CL);toast(CL.c3[1],5000)}},
  {id:'book',name:'سجل الفندق',x:12,z:7.5,y:1.2,fn:()=>{addClue('c4',CL);toast(CL.c4[1],5000)}},
  {id:'letter',name:'خطاب على الطاولة',x:18,z:-7.3,y:.9,fn:()=>{addClue('c5',CL);toast(CL.c5[1],5000)}}];
 defs.forEach(d=>{const s=new T.Mesh(new T.SphereGeometry(.05),new T.MeshBasicMaterial({color:0xc9a24b}));s.position.set(d.x,d.y,d.z);scene.add(s);d.dot=s;items.push(d)});
 window.MH_EXT&&window.MH_EXT({T,scene,box,wallX,wallZ,rect,woodM,goldM,std,tex,rep,items,doors,colliders,addClue,doAct,toast,tone,noise,useDoor,ITEMNAMES,P,ending,makeAvatar,syncMine,me,dlg:v=>{dlgOpen=v;if(v)document.exitPointerLock&&document.exitPointerLock()},get world(){return world},get clues(){return clues},get inv(){return inv}});
 for(const[k,pr]of Object.entries(peers))if(pr.pending){delete peers[k];addPeer(k,pr.pending)}
 addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();ren.setSize(innerWidth,innerHeight)});
}
const ITEMNAMES={key101:'مفتاح الغرفة 101'};
function addClue(id,CL){if(clues.some(c=>c.id===id))return;clues.push({id,title:CL[id][0],text:CL[id][1]});tone(880,.5,.08);tone(1320,.7,.05);if(!panelOpen)toast('دليل جديد: '+CL[id][0],2500);syncMine()}
const syncMine=()=>send({t:'act',k:'mine',clues,inv});
function doAct(m){applyAct(m);send({t:'act',...m})}
function applyAct(m){
 if(m.k==='door'){world.doors[m.id]=m.open;if(m.id==='d101'&&m.open&&!world._ev){world._ev=1;flicker=5;setTimeout(()=>noise(1.2,300,.25),1500)}noise(.5,500,.2)}
 else if(m.k==='unlock')world.unlocked[m.id]=true;
 else if(m.k==='take'){world.taken[m.id]=true;applyWorld()}
 else if(m.k==='radio')world.radio=m.on;
 else if(m.k==='lift')world.lift=m.to;
 else if(m.k==='give'){inv.push(m.item);toast('استلمت: '+(ITEMNAMES[m.item]||m.item));syncMine()}
 else if(m.k==='decide')world.decisions[m.id]=m.v;
 else if(m.k==='share'){if(!world.shared.some(c=>c.id===m.clue.id))world.shared.push(m.clue);if(m.from!==me.pid)toast('شاركك اللاعب دليلًا: '+m.clue.title)}
}
function applyWorld(){for(const it of items)if(it.dot)it.dot.visible=!(it.take&&world.taken[it.id])}
function useDoor(d){
 if(!d.open&&d.lock&&!world.unlocked[d.id]){
  if(d.lock.startsWith('key')){if(inv.includes(d.lock)){doAct({k:'unlock',id:d.id});toast('فتحت القفل بالمفتاح')}else return toast('الباب مقفل. تحتاج مفتاحًا.')}
  else{MH_UI.keypad('أدخل رمز الباب',4,v=>{if(v===(d.code||'1147')){doAct({k:'unlock',id:d.id});tone(1000,.5,.1);toast('انفتح القفل');doAct({k:'door',id:d.id,open:true})}else toast('رمز خاطئ')});return}}
 doAct({k:'door',id:d.id,open:!d.open});
}
function ending(k){const E=(window.MH_ENDINGS||{})[k]||{t:'النهاية',p:''};$('#endt').textContent=E.t;$('#endp').textContent=E.p;$('#end').hidden=false;document.exitPointerLock&&document.exitPointerLock()}
/* ---------- input ---------- */
const keys={};let joy={x:0,y:0},lookId=null,lastT={x:0,y:0},joyId=null;
addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;keys[e.code]=1;if(e.code==='KeyE')interact();if(e.code==='KeyI'||e.code==='Escape')if(started)setPanel(e.code==='KeyI'?!panelOpen:true)});
addEventListener('keyup',e=>keys[e.code]=0);
$('#gl').addEventListener('click',()=>{au();if(!touch&&started&&!panelOpen)$('#gl').requestPointerLock()});
addEventListener('mousemove',e=>{if(document.pointerLockElement)look(e.movementX,e.movementY,.0022)});
function look(dx,dy,s){s*=SET.sens;P.yaw-=dx*s;P.pitch=Math.max(-1.3,Math.min(1.3,P.pitch-dy*s))}
const joyEl=$('#joy'),knob=$('#knob');
joyEl.addEventListener('touchstart',e=>{e.preventDefault();au();joyId=e.changedTouches[0].identifier},{passive:false});
joyEl.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===joyId){const r=joyEl.getBoundingClientRect();let dx=(t.clientX-r.left-60)/50,dy=(t.clientY-r.top-60)/50,l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}joy={x:dx,y:dy};knob.style.transform=`translate(${dx*40}px,${dy*40}px)`}},{passive:false});
const joyEnd=()=>{joy={x:0,y:0};joyId=null;knob.style.transform=''};joyEl.addEventListener('touchend',joyEnd);joyEl.addEventListener('touchcancel',joyEnd);
const lk=$('#look');
lk.addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0];lookId=t.identifier;lastT={x:t.clientX,y:t.clientY}},{passive:false});
lk.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===lookId){look(t.clientX-lastT.x,t.clientY-lastT.y,.005);lastT={x:t.clientX,y:t.clientY}}},{passive:false});
lk.addEventListener('touchend',()=>lookId=null);
$('#btnE').addEventListener('touchstart',e=>{e.preventDefault();interact()},{passive:false});
$('#bag').onclick=()=>setPanel(true);$('#resume').onclick=()=>setPanel(false);
function setPanel(v){panelOpen=v;$('#panel').hidden=!v;if(v){document.exitPointerLock&&document.exitPointerLock();render()}}
function render(){
 const iv=$('#inv');iv.innerHTML='';inv.forEach((i,ix)=>{const p=document.createElement('p');p.textContent=(ITEMNAMES[i]||i)+' ';const b=document.createElement('button');b.textContent='أعطِ اللاعب الآخر';b.onclick=()=>{inv.splice(ix,1);syncMine();send({t:'act',k:'give',item:i});toast('أرسلت: '+(ITEMNAMES[i]||i));render()};p.append(b);iv.append(p)});if(!inv.length)iv.innerHTML='<p>فارغة</p>';
 const c=$('#clues');c.innerHTML='';clues.forEach(cl=>{const d=document.createElement('div');d.className='clue';d.innerHTML=`<b>${cl.title}</b><p>${cl.text}</p>`;const b=document.createElement('button');b.textContent=world.shared.some(s=>s.id===cl.id)?'مشارَك':'شارك مع اللاعب الآخر';b.disabled=world.shared.some(s=>s.id===cl.id);b.onclick=()=>{doAct({k:'share',clue:cl,from:me.pid});render()};d.append(b);c.append(d)});
 if(!clues.length)c.innerHTML='<p>لا أدلة بعد</p>';
 $('#evlog').innerHTML=evlog.slice(-12).map(e=>`<p>${e}</p>`).join('');
 $('#shared').innerHTML=world.shared.length?world.shared.map(s=>`<div class="clue"><b>${s.title}</b><p>${s.text}</p></div>`).join(''):'<p>لا شيء مشترك بعد</p>';
}
$('#vol').value=SET.vol;$('#sens').value=SET.sens;$('#vol').oninput=$('#sens').oninput=()=>{SET.vol=+$('#vol').value;SET.sens=+$('#sens').value;localStorage.mh_set=JSON.stringify(SET)};
$('#notes').value=localStorage.mh_notes||'';$('#notes').oninput=e=>localStorage.mh_notes=e.target.value;
const chat=()=>{const i=$('#chatin'),t=i.value.trim();if(!t)return;i.value='';send({t:'chat',name:me.name,text:t});log('أنا: '+t)};
$('#chatsend').onclick=chat;$('#chatin').onkeydown=e=>{if(e.key==='Enter')chat()};
/* ---------- loop ---------- */
let target=null,stepT=0,sendT=0,radioT=0,last=performance.now(),bob=0;
function interact(){if(started&&!panelOpen&&!dlgOpen&&target){au();target.fn()}}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
 if(!panelOpen&&!dlgOpen&&$('#end').hidden){
  let fx=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy.y,sx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x;
  const l=Math.hypot(fx,sx);if(l>1){fx/=l;sx/=l}
  const sp=(keys.ShiftLeft||keys.ShiftRight?4.6:2.8)*dt,sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);
  const ox=P.x,oz=P.z;P.x+=(-sy*fx+cy*sx)*sp;P.z+=(-cy*fx-sy*sx)*sp;
  for(let k=0;k<3;k++)for(const c of colliders){if(c.door&&c.door.open||c.gate!==undefined&&window.MH_CAB&&Math.abs(window.MH_CAB.y-c.gate)<.6||P.y+.3>=(c.hi??3.4)||P.y+1.6<=(c.lo??-1))continue;const cx=Math.max(c.x1,Math.min(P.x,c.x2)),cz=Math.max(c.z1,Math.min(P.z,c.z2));let dx=P.x-cx,dz=P.z-cz,d=Math.hypot(dx,dz);if(d<P.r){if(d<1e-4){dx=0;dz=-1;d=1e-4}const p=(P.r-d)/d;P.x+=dx*p;P.z+=dz*p}}
  const mv=Math.hypot(P.x-ox,P.z-oz);if(mv>1e-4){bob+=mv*7;stepT-=mv;if(stepT<=0){stepT=.85;noise(.09,450,.12)}}
  const hy=window.MH_H?window.MH_H(P.x,P.z,P.y):0;P.y+=(hy-P.y)*Math.min(1,dt*(hy>P.y?16:9));sendT-=dt;if(sendT<=0&&mv>0||sendT<-1){sendT=.1;send({t:'pos',x:+P.x.toFixed(2),z:+P.z.toFixed(2),yaw:+P.yaw.toFixed(2),y:+P.y.toFixed(2)});if(sendT<-1)sendT=.1}
 }
 cam.position.set(P.x,P.y+1.65+Math.sin(bob)*.025,P.z);cam.rotation.set(P.pitch,P.yaw,0);
 for(const d of Object.values(doors)){d.open=!!world.doors[d.id];const t=d.open?d.swing*Math.PI/2:0;d.ang+=(t-d.ang)*Math.min(1,dt*6);d.g.rotation.y=(d.base||0)+d.ang}
 window.MH_TICK&&window.MH_TICK(dt);
 for(const p of Object.values(peers))if(p.g){p.g.position.y+=((p.tY||0)-p.g.position.y)*Math.min(1,dt*10);p.g.position.x+=(p.tx-p.g.position.x)*Math.min(1,dt*10);p.g.position.z+=(p.tz-p.g.position.z)*Math.min(1,dt*10);p.g.rotation.y=p.ty+Math.PI}
 flicker=Math.max(0,flicker-dt);for(const l of lamps)l.intensity=l.userData.base*(flicker>0?(Math.random()>.5?1:.1):(.95+Math.sin(now/700)*.05));
 if(world.radio){radioT-=dt;if(radioT<=0){radioT=.25+Math.random()*.4;noise(.3,2500,.035)}}
 /* nearest interactable in front */
 target=null;let best=2.3;const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);
 for(const it of items){if(it.take&&world.taken[it.id]||it.hide&&it.hide())continue;const dx=it.x-P.x,dz=it.z-P.z,d=Math.hypot(dx,dz);if(d<best&&(dx*fx+dz*fz)/d>.45){best=d;target=it}}
 const pr=$('#prompt');pr.hidden=!target||panelOpen;if(target)pr.textContent=target.name+(touch?'':'  [E]');
 ren.render(scene,cam)}
function start(){me.name=$('#name').value.trim()||'نزيل';started=true;$('#menu').hidden=true;$('#hud').hidden=false;au();build();applyWorld();requestAnimationFrame(frame);toast(touch?'اسحب يمينًا للنظر، والعصا للتحرك':'WASD للحركة، الفأرة للنظر، E للتفاعل، I للحقيبة',5000)}
function begin(mode){Object.assign(me,avatarOpts(),{name:$('#name').value.trim()||'نزيل'});au();connect(mode,$('#code').value)}
$('#create').onclick=()=>begin('create');
$('#join').onclick=()=>{if(!$('#code').value.trim())return alert('أدخل كود الغرفة');begin('join')};
const q=new URLSearchParams(location.search).get('room');if(q)$('#code').value=q.slice(0,5);
})();
