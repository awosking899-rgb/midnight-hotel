// In-game modal UI (replaces prompt()): keypad, choice, ordering. Uses window.MH_DLGFN(open) to block movement.
window.MH_UI=(()=>{
 const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;background:#000b;z-index:9;display:none;align-items:center;justify-content:center';
 const card=document.createElement('div');card.style.cssText='background:#1a0f0a;border:1px solid #c9a24b;border-radius:10px;padding:1rem;width:min(92vw,340px);display:grid;gap:.6rem;text-align:center;color:#e8dcc0';ov.append(card);document.body.append(ov);
 const el=(t,txt,fn)=>{const e=document.createElement(t);if(txt)e.textContent=txt;if(fn)e.onclick=fn;return e};
 const open=()=>{ov.style.display='flex';window.MH_DLGFN&&window.MH_DLGFN(true)};
 const close=()=>{ov.style.display='none';window.MH_DLGFN&&window.MH_DLGFN(false)};
 const head=t=>{card.innerHTML='';card.append(el('h3',t));card.lastChild.style.cssText='margin:0;color:#c9a24b;font-family:"Aref Ruqaa",serif'};
 const cancel=()=>card.append(el('button','إلغاء',close));
 return{
  keypad(title,len,cb){let v='';head(title);const s=el('div','····');s.style.cssText='font-size:1.8rem;letter-spacing:.4rem;direction:ltr';card.append(s);
   const g=el('div');g.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;direction:ltr';card.append(g);
   const upd=()=>s.textContent=(v+'····').slice(0,len).replace(/\d/g,'●').replace(/·/g,'·');
   [1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].forEach(k=>g.append(el('button',k,()=>{if(k==='⌫')v=v.slice(0,-1);else if(k==='✓'){if(v.length===len){close();cb(v)}}else if(v.length<len)v+=k;upd();if(v.length===len&&k!=='⌫'&&k!=='✓'){}})));
   cancel();open()},
  choice(title,opts,cb){head(title);opts.forEach(o=>{const b=el('button',o.l,()=>{close();cb(o.v)});b.disabled=!!o.off;card.append(b)});cancel();open()},
  order(title,opts,cb){head(title);const seq=[],line=el('p','');card.append(line);const bs=[];
   opts.forEach(o=>{const b=el('button',o.l,()=>{seq.push(o.v);b.disabled=true;line.textContent=seq.map(v=>opts.find(x=>x.v===v).l).join(' ← ');if(seq.length===opts.length){close();cb(seq.slice())}});bs.push(b);card.append(b)});
   card.append(el('button','إعادة الترتيب',()=>{seq.length=0;line.textContent='';bs.forEach(b=>b.disabled=false)}));cancel();open()}}})();
