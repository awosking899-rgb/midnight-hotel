// Tower wing: real levels (ground / first floor / roof), stairs, elevator, book/picture/map puzzles.
(()=>{const prev=window.MH_EXT;window.MH_EXT=function(X){prev&&prev(X);window.MH_DLGFN=X.dlg;
 const {T,scene,colliders,items,addClue,doAct,toast,tone,noise,P,std,woodM,ITEMNAMES,syncMine}=X,W=()=>X.world,UI=window.MH_UI;
 ITEMNAMES.keyR='مفتاح السطح';
 const stone=std({color:0x3a2420}),flr=std({color:0x2a1a12}),rf=std({color:0x2b2b30}),dark=std({color:0x1d1210}),brass=std({color:0x8a6a2a,metalness:.6});
 const plane=(a,m,y,down)=>{const[x1,z1,x2,z2]=a,p=new T.Mesh(new T.PlaneGeometry(x2-x1,z2-z1),m);p.rotation.x=down?Math.PI/2:-Math.PI/2;p.position.set((x1+x2)/2,y,(z1+z2)/2);scene.add(p)};
 const B=(x,y,z,w,h,d,m,lo,hi,ex)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(x,y,z);scene.add(b);colliders.push(Object.assign({x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2,lo,hi},ex));return b};
 const floors=[],layer=(arr,y,m)=>arr.forEach(a=>{plane(a,m,y,false);floors.push({x1:a[0],z1:a[1],x2:a[2],z2:a[3],y})});
 const core=[[22,-2.5,34,1],[22,1,29,6],[31.5,1,34,6],[29,4,31.5,6]],strips=[[22,-6,24,-2.5],[32,-6,34,-2.5]];
 plane([22,-6,34,6],flr,0);[...core,...strips].forEach(a=>plane(a,dark,3,true));
 layer([...core,...strips],4,flr);[...core,[22,-6,34,-2.5]].forEach(a=>plane(a,dark,7.9,true));layer([[22,-6,34,1],core[1],core[2],core[3]],8,rf);
 const ring=(y0,lo,hi,h,gap)=>{const cy=y0+h/2;B(28,cy,-6,12.3,h,.3,stone,lo,hi);B(28,cy,6,12.3,h,.3,stone,lo,hi);B(34,cy,0,.3,h,12.3,stone,lo,hi);
  if(gap){B(22,cy,-3.5,.3,h,5,stone,lo,hi);B(22,cy,3.5,.3,h,5,stone,lo,hi)}else B(22,cy,0,.3,h,12.3,stone,lo,hi)};
 ring(0,-1,3.4,3,true);ring(4,3.9,7.4,3,false);ring(8,7.9,9.3,1.2,false);
 /* stairs: ramp x24..32 rising east (y0 -> y4) along the north wall */
 const rm=new T.Mesh(new T.BoxGeometry(8.94,.15,1.2),woodM);rm.position.set(28,2,-5.3);rm.rotation.z=Math.atan2(4,8);scene.add(rm);
 B(28,2,-4.6,8,4,.1,stone,-1,4);B(28,4.45,-2.6,8,.9,.1,woodM,3.9,5.2);
 /* elevator: cab at x29..31.5, z1..4, shared via world.lift (0/4/8) */
 const cab={y:+W().lift||0},cg=new T.Group();const pf=new T.Mesh(new T.BoxGeometry(2.5,.15,3),brass);pf.position.set(30.25,-.08,2.5);cg.add(pf);
 const back=new T.Mesh(new T.BoxGeometry(.1,2.4,3),brass);back.position.set(31.55,1.2,2.5);cg.add(back);cg.position.y=cab.y;scene.add(cg);window.MH_CAB=cab;
 for(const lv of[4,8]){B(29,lv+1,2.5,.1,2,3,brass,lv,lv+2,{gate:lv});B(30.25,lv+1,1,2.5,2,.1,brass,lv,lv+2,{gate:lv})}
 const lamp=(x,y,z,i,d)=>{const l=new T.PointLight(0xffb870,i,d,1.6);l.position.set(x,y,z);scene.add(l)};lamp(27,2.4,0,.7,12);lamp(27,6.4,0,.7,12);lamp(28,10,0,.5,16);
 const dot=d=>{const s=new T.Mesh(new T.SphereGeometry(.05),new T.MeshBasicMaterial({color:0xc9a24b}));s.position.set(d.x,d.y,d.z);scene.add(s);d.dot=s;if(d.lvl!==undefined)d.hide=()=>Math.abs(P.y-d.lvl)>1.6;items.push(d)};
 const CL={c12:['لوحة نحاسية في المكتبة','«رتّب الكتب كما وُلدت: الأقدم أولًا».'],c13:['الدرج الخفي','«خبّأت مفتاح السطح في الغرفة الواقعة شرق المطبخ».'],c14:['ملاحظة المصوّر','«في الصورة الأصلية، المدير الوحيد الذي لا ظل له».'],c16:['خلف الإطار','«ياسين لم يخن أحدًا. من خانهم هو الذي لا ظل له».'],c17:['تلسكوب السطح','عبر التلسكوب: نافذة الغرفة 102 مسدودة من الخارج، والساعة في البرج تشير إلى 11:47.']};
 const hints={books:['الأقدم أولًا: انظر إلى السنة على كل كتاب.','الترتيب يبدأ بسنة 1901.'],map:['اقرأ الدرج الخفي: اتجاه الشرق نسبةً للمطبخ.','المطبخ غرب قاعة الطعام.'],pic:['اقرأ ملاحظة المصوّر عن الظل.','اختر الصورة التي لا يوجد فيها أي ظل.']},tr={};
 const wrong=id=>{const n=tr[id]=(tr[id]||0)+1;toast('تلميح: '+hints[id][Math.min(n-1,hints[id].length-1)],4500)};
 const note=(id,x,z,y,name,lvl)=>dot({name,x,z,y,lvl,fn:()=>{addClue(id,CL);toast(CL[id][1],5000)}});
 note('c12',14.5,5,1.3,'لوحة نحاسية');note('c14',32,5.3,5.3,'ملاحظة المصوّر',4);note('c17',28,-1,9.3,'تلسكوب',8);
 dot({id:'books',take:1,name:'رف الكتب',x:9.5,z:6.2,y:1.3,fn:()=>UI.order('رتّب الكتب',[['الليل ١٩٣٤','n'],['الساعة ١٩٠١','h'],['الظل ١٩٢٣','s'],['المرآة ١٩١١','m']].map(([l,v])=>({l,v})),q=>{if(q.join('')==='hmsn'){doAct({k:'take',id:'books'});addClue('c13',CL);tone(880,.5,.1);toast('انفتح درج خفي في الرف: '+CL.c13[1],5000)}else wrong('books')})});
 dot({id:'map',take:1,name:'خريطة الفندق',x:33.5,z:0,y:5.5,lvl:4,fn:()=>UI.choice('أين خبّأ مراد مفتاح السطح؟',['المكتبة','المخزن','قاعة الطعام','غرفة الاجتماعات'].map(l=>({l,v:l})),v=>{if(v==='قاعة الطعام'){X.inv.push('keyR');doAct({k:'take',id:'map'});syncMine();tone(880,.5,.1);toast('خلف الخريطة: مفتاح السطح')}else wrong('map')})});
 dot({id:'pic',take:1,name:'معرض الصور',x:26,z:5.3,y:5.5,lvl:4,fn:()=>UI.choice('أي صورة هي الأصلية؟',['الردهة ١٩٢٣ — ظلّان','الردهة ١٩٢٤ — ظلّان','الردهة ١٩٢٥ — ظل واحد','الردهة ١٩٢٦ — بلا ظل'].map((l,i)=>({l,v:i})),v=>{if(v===3){doAct({k:'take',id:'pic'});addClue('c16',CL);tone(880,.5,.1);toast(CL.c16[1],5000)}else wrong('pic')})});
 dot({name:'لوحة المصعد',x:30.25,z:2.5,y:1.2,fn:()=>UI.choice('اختر الطابق',[{l:'الطابق الأرضي',v:0},{l:'الطابق الأول',v:4},{l:X.inv.includes('keyR')?'السطح':'السطح (يحتاج مفتاحًا)',v:8,off:!X.inv.includes('keyR')}],v=>{doAct({k:'lift',to:v});toast('المصعد يتحرك…',2000)})});
 /* dust motes for atmosphere */
 const pos=[];for(let i=0;i<260;i++)pos.push(-12+Math.random()*46,.3+Math.random()*2.5,-14+Math.random()*30);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));const dust=new T.Points(geo,new T.PointsMaterial({color:0xffd9a0,size:.035,transparent:true,opacity:.5}));scene.add(dust);
 /* height field: floors, ramp, cab */
 window.MH_H=(x,z,py)=>{let best=0;const ok=y=>{if(y<=py+.6&&y>best)best=y};
  for(const f of floors)if(x>=f.x1&&x<=f.x2&&z>=f.z1&&z<=f.z2)ok(f.y);
  if(x>=24&&x<=32&&z>=-5.9&&z<=-4.7)ok(4*(x-24)/8);
  if(x>=29&&x<=31.5&&z>=1&&z<=4&&Math.abs(cab.y-py)<.6)ok(cab.y);return best};
 let lt=0;window.MH_TICK=dt=>{const t=+W().lift||0,d=t-cab.y;if(Math.abs(d)>.01){cab.y+=Math.sign(d)*Math.min(Math.abs(d),2*dt);cg.position.y=cab.y;if((lt-=dt)<=0){lt=.5;noise(.4,160,.08)}}
  dust.rotation.y+=dt*.01;for(const n of window.MH_NPCS||[]){const dx=P.x-n.x,dz=P.z-n.z;if(Math.hypot(dx,dz)<5){let a=Math.atan2(dx,dz)-n.g.rotation.y;a=Math.atan2(Math.sin(a),Math.cos(a));n.g.rotation.y+=a*Math.min(1,dt*3)}}};
};})();
