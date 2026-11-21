// Midnight Hotel — static server + WebSocket room server (2 players per room)
const http=require('http'),fs=require('fs'),path=require('path');
const crypto=require('crypto'),{EventEmitter}=require('events');
const PUB=path.join(__dirname,'public'),DB=process.env.DB_FILE||path.join(__dirname,'data','rooms.json');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css'};
let rooms={},dirty=false;try{rooms=JSON.parse(fs.readFileSync(DB,'utf8'))}catch{}
const flush=()=>{if(!dirty)return;dirty=false;try{fs.mkdirSync(path.dirname(DB),{recursive:true});fs.writeFileSync(DB,JSON.stringify(rooms))}catch(e){console.error('save failed',e.message)}};setInterval(flush,3000);for(const sg of['SIGTERM','SIGINT'])process.on(sg,()=>{flush();process.exit(0)});
const srv=http.createServer((req,res)=>{
  if(req.url==='/healthz'){res.writeHead(200);return res.end('ok')}
  let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';
  const f=path.normalize(path.join(PUB,p));
  if(!f.startsWith(PUB)){res.writeHead(403);return res.end()}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('404')}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});res.end(d)});
});

// Minimal zero-dependency WebSocket server (RFC 6455: text frames, ping/pong, close)
class Sock extends EventEmitter{
  constructor(sock){super();this.s=sock;this.readyState=1;this.buf=Buffer.alloc(0);
    sock.on('data',d=>{this.buf=Buffer.concat([this.buf,d]);this.parse()});
    sock.on('close',()=>{if(this.readyState!==3){this.readyState=3;this.emit('close')}});sock.on('error',()=>sock.destroy())}
  parse(){for(;;){const b=this.buf;if(b.length<2)return;let len=b[1]&127,o=2;
    if(len===126){if(b.length<4)return;len=b.readUInt16BE(2);o=4}else if(len===127){if(b.length<10)return;len=Number(b.readBigUInt64BE(2));o=10}
    const masked=b[1]&128;if(len>1e6)return this.close();const need=o+(masked?4:0)+len;if(b.length<need)return;
    const mk=masked?b.subarray(o,o+4):null,p=Buffer.from(b.subarray(o+(masked?4:0),need));if(mk)for(let i=0;i<p.length;i++)p[i]^=mk[i&3];
    this.buf=b.subarray(need);const op=b[0]&15;
    if(op===1)this.emit('message',p.toString());else if(op===8)return this.close();else if(op===9)this.frame(10,p)}}
  frame(op,p){if(this.s.destroyed)return;const n=p.length,h=n<126?Buffer.from([128|op,n]):n<65536?Buffer.from([128|op,126,n>>8,n&255]):(()=>{const x=Buffer.alloc(10);x[0]=128|op;x[1]=127;x.writeBigUInt64BE(BigInt(n),2);return x})();this.s.write(Buffer.concat([h,p]))}
  send(t){this.frame(1,Buffer.from(String(t)))}
  close(){if(this.readyState===3)return;this.readyState=3;try{this.frame(8,Buffer.alloc(0));this.s.end()}catch{}this.emit('close')}
}
const wss={on:(ev,fn)=>srv.on('upgrade',(req,sock)=>{const k=req.headers['sec-websocket-key'];if(!k)return sock.destroy();
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+crypto.createHash('sha1').update(k+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')+'\r\n\r\n');fn(new Sock(sock))})};

const live={}; // code -> {pid: ws}
const ALPHA='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode=()=>{let c;do{c=Array.from({length:5},()=>ALPHA[Math.random()*ALPHA.length|0]).join('')}while(rooms[c]);return c};
const tx=(ws,o)=>ws&&ws.readyState===1&&ws.send(JSON.stringify(o));
const others=(code,pid,o)=>{for(const[k,w]of Object.entries(live[code]||{}))if(k!==pid)tx(w,o)};
wss.on('connection',ws=>{
  let code=null,pid=null;
  ws.on('message',raw=>{
    let m;try{m=JSON.parse(raw)}catch{return}
    if(m.t==='join'){
      if(typeof m.pid!=='string'||m.pid.length>32)return;
      if(m.mode==='create'){code=newCode();rooms[code]={world:{doors:{},unlocked:{},taken:{},shared:[],radio:false,decisions:{},lift:0},pids:[],me:{},mine:{}}}
      else{code=String(m.code||'').toUpperCase().trim();if(!rooms[code]){code=null;return tx(ws,{t:'err',msg:'كود الغرفة غير موجود'})}}
      const r=rooms[code];pid=m.pid;
      if(!r.pids.includes(pid)){if(r.pids.length>=2){code=null;return tx(ws,{t:'err',msg:'الغرفة ممتلئة (لاعبان فقط)'})}r.pids.push(pid)}
      r.me[pid]=m.me;dirty=true;live[code]=live[code]||{};
      if(live[code][pid]&&live[code][pid]!==ws)try{live[code][pid].close()}catch{}
      live[code][pid]=ws;
      const gifts=(r.gifts&&r.gifts[pid])||[];if(gifts.length){r.gifts[pid]=[];dirty=true}
      tx(ws,{t:'joined',code,gifts,world:r.world,mine:r.mine[pid]||null,peers:r.pids.filter(k=>k!==pid).map(k=>({pid:k,me:r.me[k]}))});
      others(code,pid,{t:'peer',pid,me:m.me});return;
    }
    if(!code)return;const r=rooms[code];
    if(m.t==='pos')return others(code,pid,{t:'pos',pid,x:m.x,z:m.z,yaw:m.yaw,y:+m.y||0});
    if(m.t==='chat')return others(code,pid,{t:'chat',name:String(m.name||'').slice(0,20),text:String(m.text||'').slice(0,200)});
    if(m.t==='act'){
      const w=r.world;
      if(m.k==='give'){const t=r.pids.find(k=>k!==pid);if(!t)return;const it=String(m.item).slice(0,20);if(live[code]&&live[code][t])tx(live[code][t],{t:'act',k:'give',item:it});else{r.gifts=r.gifts||{};r.gifts[t]=[...(r.gifts[t]||[]),it]}dirty=true;return}
      if(m.k==='mine'){r.mine[pid]={clues:m.clues,inv:m.inv};dirty=true;return}
      if(m.k==='door')w.doors[m.id]=!!m.open;
      else if(m.k==='unlock')w.unlocked[m.id]=true;
      else if(m.k==='take')w.taken[m.id]=true;
      else if(m.k==='lift')w.lift=[0,4,8].includes(+m.to)?+m.to:0;
      else if(m.k==='radio')w.radio=!!m.on;
      else if(m.k==='decide'){w.decisions=w.decisions||{};w.decisions[String(m.id).slice(0,30)]=String(m.v).slice(0,30)}
      else if(m.k==='share'){if(!w.shared.some(c=>c.id===m.clue.id))w.shared.push(m.clue)}
      else return;
      dirty=true;others(code,pid,{t:'act',...m});
    }
  });
  ws.on('close',()=>{if(code&&live[code]&&live[code][pid]===ws){delete live[code][pid];others(code,pid,{t:'gone',pid})}});
});
srv.listen(process.env.PORT||3000,()=>console.log('Midnight Hotel on :'+(process.env.PORT||3000)));
