// Hotel expansion: more floors/rooms, secret room, NPC dialogue, puzzles, endings, events.
window.MH_ENDINGS={
 basic:{t:'النهاية الأساسية: باب بلا اسم',p:'فتحتما الباب الأخير ورأيتما الحقيقة ناقصة. خرجتما، لكن الفندق احتفظ بجزء منكما.'},
 alt:{t:'النهاية البديلة: خروج هادئ',p:'غادرتما من الباب الرئيسي. استيقظتما في الشارع بلا ذاكرة، والساعة تشير إلى 11:47.'},
 bad:{t:'النهاية السيئة: رماد',p:'اتهام خاطئ أو سجلات محترقة. ضاع الدليل الوحيد، وبقيتما في الفندق مع مراد.'},
 secret:{t:'النهاية السرية: منتصف الليل',p:'بأدلة مشتركة وثقة بياسين، كشفتما أن مراد حبس الوقت في الغرفة 102 وكسرتما القفل. توقفت الساعة عن الدق وانفتح الفندق للصباح.'}};
window.MH_EXT=function(X){
 const {T,scene,box,wallX,wallZ,rect,woodM,goldM,std,tex,items,doors,colliders,addClue,doAct,toast,tone,noise,useDoor,ITEMNAMES,P,ending,makeAvatar,syncMine,me}=X;
 const W=()=>X.world,C=()=>X.clues,has=id=>C().some(c=>c.id===id)||W().shared.some(c=>c.id===id);
 Object.assign(ITEMNAMES,{keyB:'مفتاح الطابق السفلي',fuse:'فيوز محترق',wire:'سلك نحاسي',fuseOK:'فيوز مُصلَح'});
 const CL={c6:['لوحة قائمة الطعام','«عشاء الافتتاح — 1923». إلى جانبه رسم صغير لإطار لوحة.'],c7:['وصفة معلّقة','بخط ياسين: «الخزنة تُفتح بأربعة أرقام. أنا أعرف الأولين فقط: 47».'],c8:['محضر الاجتماع','«الخزنة: الرقمان الأخيران 12. ياسين صوّت ضد الإغلاق، ومراد أمر بحذف اسمه».'],c9:['لوحة الصمامات','«الطاقة للقبو معطّلة. يلزم فيوز وسلك». ورقة: مراد ينتظر في المكتب حين تعود الكهرباء.'],c10:['همسة ياسين','«ابحثا في المكتبة عن لوحة كبيرة. إنها تُفتح بعام افتتاح الفندق».'],c11:['من الخزنة','عقد باسم مراد: «سيُحبَس الوقت في الغرفة 102 ما دام أحدٌ ينتظر».'],s1:['مذكرات مراد (الغرفة السرية)','«لم يكن حريقًا. أغلقتُ الفندق على من فيه كي لا يغادر أحد قبل منتصف الليل».']};
 const dot=d=>{const s=new T.Mesh(new T.SphereGeometry(.05),new T.MeshBasicMaterial({color:0xc9a24b}));s.position.set(d.x,d.y||1,d.z);scene.add(s);d.dot=s;items.push(d)};
 const light=(x,y,z,i,d)=>{const l=new T.PointLight(0xffb870,i,d,1.6);l.position.set(x,y,z);scene.add(l)};
 const read=(id,x,z,y,name)=>dot({id:'r_'+id,name,x,z,y,fn:()=>{addClue(id,CL);toast(CL[id][1],5000)}});
 const mkDoor=d=>{const g=new T.Group(),m=new T.Mesh(new T.BoxGeometry(1.6,2.4,.1),d.mat||woodM);m.position.set(.8,1.2,0);g.add(m);const k=new T.Mesh(new T.SphereGeometry(.05),goldM);k.position.set(1.4,1.1,.08);g.add(k);
  if(d.axis==='z'){g.position.set(d.x,0,d.z+.8);d.base=Math.PI/2;d.col={x1:d.x-.15,x2:d.x+.15,z1:d.z-.8,z2:d.z+.8,door:d}}else{g.position.set(d.x-.8,0,d.z);d.base=0;d.col={x1:d.x-.8,x2:d.x+.8,z1:d.z-.15,z2:d.z+.15,door:d}}
  g.rotation.y=d.base;scene.add(g);d.g=g;d.ang=0;d.open=false;colliders.push(d.col);doors[d.id]=d;items.push({name:d.name,x:d.x,z:d.z,fn:()=>useDoor(d)})};
 const paint=tex((g,w,h)=>{g.fillStyle='#c9a24b';g.fillRect(0,0,w,h);g.fillStyle='#2a0f12';g.fillRect(18,18,w-36,h-36);g.fillStyle='#7a1f1f';g.beginPath();g.arc(128,150,60,0,7);g.fill();g.fillStyle='#0c0807';g.fillRect(100,60,56,40)});
 /* ground floor north: dining hall, kitchen, meeting room */
 [[-6,-14,6,-6],[-12,-14,-6,-6],[6,-14,14,-8],[-6,6,6,16],[6,2,9,8]].forEach(r=>rect(...r));
 wallX(-14,-12,14);wallZ(-6,-14,-6,[[-10,1.6]]);wallZ(6,-14,-6,[[-10,1.6]]);wallZ(-12,-14,-6);wallX(-6,-12,-6);
 wallZ(14,-14,-8);wallX(-8,6,9);
 wallX(16,-6,6);wallZ(-6,6,16);wallZ(6,6,16);wallX(8,6,9);wallZ(6,6,8);
 mkDoor({id:'ddin',name:'باب قاعة الطعام',x:-4.5,z:-6,swing:1});
 mkDoor({id:'dkit',name:'باب المطبخ',x:-6,z:-10,swing:1,axis:'z'});
 mkDoor({id:'dmeet',name:'باب غرفة الاجتماعات',x:6,z:-10,swing:-1,axis:'z'});
 mkDoor({id:'dbase',name:'باب الطابق السفلي',x:-3,z:6,swing:-1,lock:'keyB'});
 mkDoor({id:'dsec',name:'لوحة كبيرة',x:9,z:4,swing:1,axis:'z',lock:'code',code:'1923',mat:std({map:paint})});
 light(0,2.6,-10,.7,12);light(-9,2.5,-10,.6,9);light(10,2.5,-11,.55,9);light(0,2.4,11,.35,12);light(7.5,2.3,5,.4,6);
 /* furniture */
 box(-3,.4,-10,1.6,.8,1.6,woodM);box(3,.4,-10,1.6,.8,1.6,woodM);box(-9,.5,-12.5,4,1,1,woodM);box(10,.4,-11,3,.8,1.4,woodM);box(7.5,.4,7,1,.8,.6,woodM);
 box(4,.5,10,1,1,1,woodM);box(-4,.5,10,1,1,1,woodM);box(-4,1,15.2,1.5,2,1.2,std({color:0x222222}));box(0,.5,15.5,.8,1,.7,std({color:0x333338}));box(4.5,1.5,15.7,.6,.8,.2,std({color:0x1a1a1a}),false);
 box(0,1.6,-13.8,2,1,.1,std({color:0x1a0d08}),false);
 /* items & puzzles */
 read('c6',0,-13.5,1.5,'قائمة الطعام');read('c7',-11.5,-9,1.5,'وصفة معلّقة');read('c8',10,-11,.9,'محضر الاجتماع');read('s1',7.5,7,.9,'مذكرات على الطاولة');
 dot({id:'kit',take:1,name:'خزانة المطبخ',x:-9,z:-12.5,y:1.1,fn:()=>{X.inv.push('keyB','fuse');doAct({k:'take',id:'kit'});syncMine();tone(660,.4,.1);toast('وجدت مفتاح الطابق السفلي وفيوزًا محترقًا')}});
 dot({id:'crate',take:1,name:'صندوق المخزن',x:4,z:10,y:1.1,fn:()=>{X.inv.push('wire');doAct({k:'take',id:'crate'});syncMine();tone(660,.4,.1);toast('وجدت سلكًا نحاسيًا')}});
 dot({id:'fusebox',name:'لوحة الصمامات',x:4.5,z:15.2,y:1.5,fn:()=>{const I=X.inv;addClue('c9',CL);if(W().taken.fusebox)return toast('الكهرباء تعمل. مراد ينتظر في المكتب.');
  if(I.includes('fuse')&&I.includes('wire')){I.splice(I.indexOf('fuse'),1);I.splice(I.indexOf('wire'),1);syncMine();doAct({k:'take',id:'fusebox'});noise(.6,900,.25);toast('أصلحت الفيوز: عادت الكهرباء')}
  else toast('تحتاج فيوزًا وسلكًا لإصلاحها: '+(I.includes('fuse')?'':'فيوز ')+(I.includes('wire')?'':'سلك'),4000)}});
 dot({id:'safe',take:1,name:'الخزنة',x:0,z:15.2,y:1,fn:()=>MH_UI.keypad('رمز الخزنة',4,v=>{if(v==='4712'){doAct({k:'take',id:'safe'});addClue('c11',CL);toast(CL.c11[1],5000)}else toast('رمز خاطئ — الرقمان الأولان في المطبخ والأخيران في غرفة الاجتماعات',4000)})});
 /* NPCs & branching dialogue */
 const npc=(a,x,z,ry)=>{const g=makeAvatar(a);g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);colliders.push({x1:x-.3,x2:x+.3,z1:z-.3,z2:z+.3});return g};
 const yas=npc({skin:'#b98860',shirt:'#5a1414',pants:'#111',hair:'#111',hstyle:'short',acc:'glasses',gender:'m',face:'round',eyes:'#222'},0,-5.65,0);
 const murad=npc({skin:'#d9b08c',shirt:'#222',pants:'#222',hair:'#999',hstyle:'short',acc:'hat',gender:'m',face:'long',eyes:'#a00'},0,11.8,Math.PI);
 window.MH_NPCS=[{g:yas,x:0,z:-5.65},{g:murad,x:0,z:11.8}];
 setInterval(()=>{murad.visible=!!W().taken.fusebox},500);
 const dlg=document.createElement('div');dlg.style.cssText='position:fixed;left:50%;bottom:6%;transform:translateX(-50%);width:min(94vw,560px);background:#0c0807f0;border:1px solid #c9a24b;border-radius:8px;padding:.8rem;z-index:8;display:none;gap:.5rem;grid-auto-flow:row';document.body.append(dlg);
 const D=(who,n)=>{const d=W().decisions;
  if(who==='yasin'){
   if(n==='who')return{t:'ياسين، موظف الاستقبال. لم أغادر هذه المنضدة قط.',c:[['حسنًا','start']]};
   if(n==='g101')return{t:'النزيل غادر قبل وصولكما بيوم. هكذا قيل لي. (يتجنب النظر إليكما)',c:[['حسنًا','start']]};
   if(n==='acc')return{t:'تتهمني؟ كنت أنقذ من أستطيع!',c:[['...',null,()=>doAct({k:'decide',id:'yasin',v:'accuse'})]]};
   if(n==='trust')return{t:'شكرًا. خذا هذا: ابحثا عن لوحة كبيرة في المكتبة، وعام الافتتاح هو المفتاح.',c:[['شكرًا',null,()=>{doAct({k:'decide',id:'yasin',v:'trust'});addClue('c10',CL)}]]};
   if(n==='sorry')return{t:'سأنسى الأمر… هذه المرة.',c:[['شكرًا',null,()=>doAct({k:'decide',id:'yasin',v:''})]]};
   if(d.yasin==='accuse')return{t:'ابتعد عني.',c:[['أعتذر','sorry'],['أغادر',null]]};
   if(d.yasin==='trust')return{t:'أنا معكما. تذكرا: الأبواب تعرف الوقت.',c:[['حسنًا',null]]};
   return{t:'أهلاً بكما في فندق منتصف الليل. لا أذكر أنني سجّلتكما.',c:[['من أنت؟','who'],['ماذا حدث للنزيل في 101؟','g101'],...(has('c4')?[['المدير أغلق 102 وأنت تعرف.','acc']]:[]),['أثق بك. ساعدنا.','trust'],['أغادر',null]]}}
  if(n==='fire')return{t:'احترق الجناح الشرقي. قلت للجميع إن الفندق أُغلق… ولم أقل إنه أُغلق عليهم.',c:[['…','start']]};
  if(n==='r102')return{t:has('s1')?'قرأتما مذكراتي إذن. نعم، حبست الوقت في 102.':'كانت غرفة صيانة. لا شيء فيها.',c:[['…','start']]};
  if(n==='exit')return{t:'الباب الأخير خلفي. القرار لكما.',c:[['نفتحه ونواجه الحقيقة',null,()=>doAct({k:'decide',id:'final',v:'open'})],['نغادر من الباب الرئيسي',null,()=>doAct({k:'decide',id:'final',v:'leave'})],['نحرق السجلات',null,()=>doAct({k:'decide',id:'final',v:'burn'})],['ليس بعد','start']]};
  return{t:'أخيرًا وصلتما. أنا مراد، مدير الفندق… أو ما تبقّى مني.',c:[['ماذا حدث ليلة الحريق؟','fire'],['لماذا أغلقت 102؟','r102'],['أريد الخروج','exit']]}};
 const talk=(who,n='start')=>{const o=D(who,n);dlg.style.display='grid';X.dlg(true);dlg.innerHTML='';const p=document.createElement('p');p.textContent=o.t;dlg.append(p);
  o.c.forEach(([l,nx,fn])=>{const b=document.createElement('button');b.textContent=l;b.onclick=()=>{fn&&fn();if(nx)talk(who,nx);else{dlg.style.display='none';X.dlg(false)}};dlg.append(b)})};
 items.push({name:'ياسين — موظف الاستقبال',x:0,z:-5.65,fn:()=>talk('yasin')});
 items.push({name:'مراد — مدير الفندق',x:0,z:11.8,hide:()=>!W().taken.fusebox,fn:()=>talk('murad')});
 /* endings (both players) + timed events */
 let ended=false;setInterval(()=>{const d=W().decisions;if(ended||!d.final)return;ended=true;
  const k=d.yasin==='accuse'||d.final==='burn'?'bad':d.final==='open'&&has('s1')&&has('c11')&&has('c17')&&d.yasin==='trust'?'secret':d.final==='leave'?'alt':'basic';ending(k)},800);
 setInterval(()=>{if(W().doors.d101&&Math.random()<.5){noise(1,220,.2);toast('خطوات بطيئة خلف الجدار…',2500)}},45000);
};
