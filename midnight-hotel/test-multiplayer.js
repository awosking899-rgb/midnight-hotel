// Spins up the server and drives two WebSocket clients. Run: node test-multiplayer.js
const {spawn}=require('child_process');const fs=require('fs');
const PORT=3999,DB='/tmp/mh_test.json';try{fs.unlinkSync(DB)}catch{}
const srv=spawn('node',['server.js'],{env:{...process.env,PORT,DB_FILE:DB}});
const ok=[],fail=[];const chk=(n,c)=>(c?ok:fail).push(n);
const cli=()=>new Promise(r=>{const w=new WebSocket('ws://localhost:'+PORT);w.q=[];w.onmessage=e=>w.q.push(JSON.parse(e.data));w.onopen=()=>r(w)});
const wait=ms=>new Promise(r=>setTimeout(r,ms)),take=(w,t)=>w.q.find(m=>m.t===t);
(async()=>{await wait(600);
 const a=await cli(),b=await cli(),c=await cli();
 a.send(JSON.stringify({t:'join',mode:'create',pid:'A',me:{name:'أ'}}));await wait(200);
 const code=take(a,'joined')?.code;chk('create room returns code',!!code);
 b.send(JSON.stringify({t:'join',mode:'join',code,pid:'B',me:{name:'ب'}}));await wait(200);
 chk('B joined',!!take(b,'joined'));chk('A notified of peer',!!take(a,'peer'));
 c.send(JSON.stringify({t:'join',mode:'join',code,pid:'C',me:{name:'ج'}}));await wait(200);
 chk('third player rejected',take(c,'err')?.msg?.includes('ممتلئة'));
 a.send(JSON.stringify({t:'pos',x:1,z:2,yaw:.5}));a.send(JSON.stringify({t:'act',k:'door',id:'d101',open:true}));
 a.send(JSON.stringify({t:'act',k:'share',clue:{id:'c1',title:'t',text:'x'},from:'A'}));a.send(JSON.stringify({t:'act',k:'decide',id:'yasin',v:'trust'}));
 a.send(JSON.stringify({t:'chat',name:'أ',text:'مرحبا'}));await wait(300);
 chk('position synced',take(b,'pos')?.x===1);chk('door synced',take(b,'act')?.k==='door');chk('chat synced',take(b,'chat')?.text==='مرحبا');
 b.close();await wait(150);chk('A notified of leave',!!take(a,'gone'));
 const b2=await cli();b2.send(JSON.stringify({t:'join',mode:'join',code,pid:'B',me:{name:'ب'}}));await wait(200);
 const w=take(b2,'joined')?.world;chk('reconnect restores door',w?.doors?.d101===true);chk('reconnect restores shared clue',w?.shared?.length===1);chk('decision persisted',w?.decisions?.yasin==='trust');
 a.send(JSON.stringify({t:'act',k:'lift',to:8}));b2.send(JSON.stringify({t:'act',k:'give',item:'keyR'}));await wait(200);chk('lift synced',b2.q.some(x=>x.k==='lift'&&x.to===8));chk('item gift relayed live',a.q.some(x=>x.k==='give'&&x.item==='keyR'));
 a.close();await wait(150);b2.send(JSON.stringify({t:'act',k:'give',item:'wire'}));await wait(150);
 await wait(3500);chk('state saved to disk',fs.existsSync(DB));
 /* restart server: rooms must persist */
 srv.kill('SIGTERM');await wait(500);const srv2=spawn('node',['server.js'],{env:{...process.env,PORT,DB_FILE:DB}});await wait(700);
 const a2=await cli();a2.send(JSON.stringify({t:'join',mode:'join',code,pid:'A',me:{name:'أ'}}));await wait(250);const j=take(a2,'joined');
 chk('room survives server restart',!!j);chk('door/lift persisted after restart',j?.world?.doors?.d101===true&&j?.world?.lift===8);chk('offline gift delivered after restart',j?.gifts?.includes('wire'));chk('shared clue persisted after restart',j?.world?.shared?.length===1);srv2.kill();
 console.log('PASS:',ok.length,ok.join(' | '));console.log('FAIL:',fail.length,fail.join(' | '));process.exit(fail.length?1:0)})();
