// Headless smoke test: runs game.js + content.js against stubbed DOM/THREE to catch runtime errors in build(), the loop and dialogues.
const fs=require('fs'),vm=require('vm');
const mk=()=>new Proxy(function(){},{get:(t,k)=>k==='then'?undefined:k===Symbol.toPrimitive?()=>0:k==='style'?{}:k==='classList'?{add(){}}:k==='children'?[]:mk(),apply:()=>mk(),construct:()=>mk(),set:()=>true});
const els={};const $=s=>els[s]||(els[s]={style:{},value:'1',hidden:true,innerHTML:'',textContent:'',addEventListener(){},append(){},getContext:()=>mk(),getBoundingClientRect:()=>({left:0,top:0}),classList:{add(){}}});
const seen=[];const Tn=new Proxy({},{get:(_,k)=>k==='Color'||k==='Vector3'?function(){return mk()}:function(){seen.push(k);return mk()}});
const ctx={THREE:Tn,document:{querySelector:$,querySelectorAll:()=>[],createElement:()=>$('x'+Math.random()),body:{classList:{add(){}},append(){}},exitPointerLock(){}},
 window:{},addEventListener(){},matchMedia:()=>({matches:false}),localStorage:{},location:{protocol:'http:',host:'x',search:''},URLSearchParams,innerWidth:800,innerHeight:600,devicePixelRatio:1,
 requestAnimationFrame(f){ctx.raf=f},setInterval(){},setTimeout(){},clearTimeout(){},clearInterval(){},performance,console,alert:console.log,prompt:()=>null,WebSocket:function(){ctx.ws=this},Math,JSON,Object,Array,Number,String,Promise};
ctx.window=ctx;vm.createContext(ctx);
try{for(const f of['ui','content','tower'])vm.runInContext(fs.readFileSync('public/'+f+'.js','utf8'),ctx);vm.runInContext(fs.readFileSync('public/game.js','utf8'),ctx);
 // force start(): menu click handlers are stubs, so call create handler via captured element
 $('#create').onclick();ctx.ws.onmessage({data:JSON.stringify({t:'joined',code:'ABCDE',world:{decisions:{}},peers:[]})});for(let i=1;i<4;i++)ctx.raf(i*20);const H=ctx.MH_H,eq=(n,a,b)=>console.log(Math.abs(a-b)<.05?'OK  ':'FAIL',n,a);eq('ground',H(0,0,0),0);eq('ramp mid',H(28,-5.3,1.9),2);eq('level1 floor',H(26,0,3.9),4);eq('hole at ground is 0',H(26,-3,0),0);eq('cab at ground',H(30.25,2.5,0),0);eq('roof floor',H(26,0,7.9),8);eq('fall from hole',H(26,-4,4),0);ctx.MH_CAB.y=4;eq('cab at lvl1',H(30.25,2.5,3.9),4);
 console.log('build() + 3 frames ran OK; THREE classes used:',[...new Set(seen)].length)}catch(e){console.log('ERR',e.stack.split('\n').slice(0,4).join('\n'))}
