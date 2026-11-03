/* Range Lab — модели танков v3: Т-72Б, Т-90М, Leopard 2A6, M1A2 SEPv3.
   Формы сняты по заводским чертежам и фотографиям (вид сбоку/сверху), размеры — по ТТХ. Процедурные, без внешних ассетов.
   Данные ТТХ, которые модель переопределяет в VT, — в REG.<id>.over; при window.NOMV2=true возвращаются прежние значения. */
(()=>{const M=window.MV2,T3=THREE,{Bld,hullGeo,turretGeo,barrelGeo,interp,profYs,runGear,loftPoly,scaleP,mirrorP}=M,V=(x,y,z)=>new T3.Vector3(x,y,z),lerp=(a,b,t)=>a+(b-a)*t;
const TM=C=>C.turT||(C.turT=C.turMat());
const MATS=C=>({tur:TM(C),dark:C.dark,det:C.detM,steel:C.steel,glass:C.glass,lamp:C.lamp,rub:C.rub,body:C.body});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const roofFn=(P,h,o)=>{const zmin=Math.min(...P.map(p=>p[1])),zmax=Math.max(...P.map(p=>p[1]));return z=>{const zn=clamp((z-zmin)/(zmax-zmin),0,1);return o.fd!=null?h*(1-o.fd*clamp((zn-(o.fs||0))/(1-(o.fs||0)),0,1)):h*(1-(o.roofDrop||0)*(1-zn));};};
const hullTopAt=(v,z)=>profYs(v.prof,z)[1];
/* корпус: ящичное сечение, борт на W/2 (совпадает с плоскостями накладной брони), нос сужается */
function boxHull(v,o){
  const zs=o.zs,Wh=v.W/2;
  return hullGeo(v,{zs,sec(z,yb,yt){const w=interp(o.wt,z)*Wh,hb=Math.min(w-.15,o.hb||.95),c=Math.min(o.ch||.07,(yt-yb)*.3),ywb=Math.min(o.yw||.8,yb+(yt-yb)*.55),
      rw=w-(o.roofIn?interp(o.roofIn,z):0);
    return[[0,yb],[hb,yb],[w-.05,ywb-.04],[w,ywb],[w,yt-c],[Math.min(w,rw+c*.5),yt-c*.2],[rw-c*.6,yt],[0,yt]];}});}
/* накладка-«щит» на поверхность: тонкая панель, тег "hull" не нужен (броня считается по патчам) */

/* ======================= Т-72Б =======================
   ТТХ: длина корпуса 6,9 м (с пушкой вперёд 9,53 м), ширина 3,46 м (≈3,59 м с экранами), высота 2,23 м (по крыше башни ≈2,05), клиренс 0,47 м,
   траки 580 мм шаг 137 мм, 6 катков Ø750, 3 поддерживающих, ведущее колесо заднее; пушка 2А46М-5 125 мм L/48, вынос среза за нос ≈2,5 м. */
M.REG.tank={
  over:v=>[[v,"prof",[[-3.2,.47],[2.55,.47],[3.43,.93],[2.02,1.40],[-3.3,1.34],[-3.45,.95]]],[v,"W",3.5],[v,"top",1.4],[v,"L",6.88],[v,"zF",1.95],
    [v.tur,"p",[0,1.4,0]],[v.tur,"h",.62],[v.tur,"poly",[[0,1.72],[.55,1.66],[1.0,1.42],[1.32,.9],[1.43,.3],[1.42,-.4],[1.28,-1.0],[.95,-1.5],[.5,-1.78],[0,-1.85],[-.5,-1.78],[-.95,-1.5],[-1.28,-1.0],[-1.42,-.4],[-1.43,.3],[-1.32,.9],[-1.0,1.42],[-.55,1.66]]],[v.tur,"inset",.88],
    [v.tur,"rb",1.43],[v.tur,"rt",1.26],[v.tur,"gun",{L:4.57,r:.085,y:.42,z0:1.5}],
    [v.run,"x",1.4],[v.run,"w",.58],[v.run,"h",.92],[v.run,"wr",.375],[v.run,"z0",-3.19],[v.run,"z1",3.35]],
  hull(v){
    return boxHull(v,{zs:[-3.45,-3.38,-3.3,-3.1,-2.6,-1.5,-.5,.5,1.5,2.0,2.3,2.6,2.9,3.15,3.43],hb:.95,yw:.82,ch:.07,
      wt:[[-3.45,.86],[-3.3,.98],[-2.8,1],[2.0,1],[2.8,.82],[3.43,.58]],roofIn:[[-3.45,.2],[-3.3,.05],[2.0,.05],[3.43,.2]]});},
  run(C){
    const guards=(C,sd,px,r,za,zb)=>{const{R0}=C,B=C.b2,fw=R0.w+.16;
      B.box("tur",fw,.04,R0.z1-R0.z0-.7,px,1.03,(R0.z0+R0.z1)/2-.1);               /* крыло */
      B.box("rub",fw,.34,.03,px,.96,R0.z1-.12,-.45);B.box("rub",fw,.42,.03,px,.9,R0.z0+.2,.1);   /* брызговики */
      B.box("rub",.03,.34,R0.z1-R0.z0-1.5,px+sd*(fw/2-.05),.85,(R0.z0+R0.z1)/2-.1);   /* резиновый борт-экран */
      seams(B,sd*1.756,.86,1.3,[-2.6,-1.9,-1.2,-.5,.2,.9,1.6,2.3],"dark");B.box("dark",.02,.025,R0.z1-R0.z0-1.3,sd*1.757,1.31,(R0.z0+R0.z1)/2-.1);};
    C.b2=new Bld();
    runGear(C,{track:{pitch:.137,th:.05,hornW:.04,hornH:.07,grouser:true},half:C.R0.w*.3,sprF:false,sprK:.74,idlK:.78,teeth:14,rollers:3,rollR:.1,
      wz:()=>[2.18,1.36,.54,-.28,-1.1,-1.92],guards});
    C.b2.flush(C.g,MATS(C));},
  turret(C){const{tg,T0,tag,dark}=C,P=T0.poly.map(p=>[p[0],p[1]]),h=T0.h,o={smooth:1,fd:.2,fs:.35,dome:.05,
      layers:[{y:0,s:1},{y:.08,s:1},{y:.3,s:.965},{y:.58,s:.915},{y:.82,s:.86},{y:1,s:.78}]};
    const tm=tag(new T3.Mesh(turretGeo(P,h,o),TM(C)),"tur");tg.add(tm);C.roofY=roofFn(P,h,o);
    const ring=new T3.Mesh(new T3.CylinderGeometry(1.1,1.12,.1,36),dark);ring.position.y=.0;C.sh0(ring);tg.add(ring);},
  gun(C){const{gp,T0,tag}=C,r=T0.gun.r,L=T0.gun.L;
    /* маска пушки: литой «шар» вокруг казённика */
    const man=new T3.Mesh(new T3.SphereGeometry(1,16,12),TM(C));man.scale.set(.52,.36,.30);man.position.set(0,.0,.12);tag(man,"tur");gp.add(man);
    const pr=[[0,1.9],[.06,1.9],[.07,1.25],[.12,1.12],[.5,.98],[.505,1.5],[.62,1.5],[.625,.98],[.9,.92],[.955,.92],[.96,1.1],[1,1.1]];
    const brl=tag(new T3.Mesh(barrelGeo(L,r,pr,18),C.dark),"gun");brl.rotation.x=Math.PI/2;brl.position.z=L/2;gp.add(brl);return brl;},
  decor(C){const{v,tg,bg,T0}=C,B=new Bld(),h=T0.h,rY=C.roofY;
    /* ---- башня ---- (правый борт машины = −x) */
    { const yc=rY(-.1),cx=-.5,cz=-.15;                       /* командирская башенка ТКН-3Б (справа) */
      B.cyl("tur",.31,.34,.16,20,cx,yc+.04,cz);B.cyl("det",.28,.28,.05,20,cx,yc+.14,cz);
      for(let i=0;i<7;i++){const a=i/7*6.283;B.box("glass",.1,.07,.03,cx+Math.sin(a)*.3,yc+.17,cz+Math.cos(a)*.3,0,a);}
      B.cyl("dark",.1,.1,.2,12,cx,yc+.3,cz);B.box("dark",.24,.14,.18,cx,yc+.42,cz);
      /* зенитный пулемёт НСВТ на турели */
      B.cyl("dark",.03,.03,.3,8,cx+.28,yc+.4,cz-.02);B.box("dark",.14,.14,.55,cx+.28,yc+.62,cz+.22);B.cyl("dark",.02,.02,.9,8,cx+.28,yc+.65,cz+.78,Math.PI/2);
      /* люк наводчика (слева) и прицел */
      const yg=rY(.0),gx=.52,gz=-.05;B.cyl("tur",.27,.28,.07,18,gx,yg+.02,gz);B.cyl("dark",.18,.18,.03,14,gx,yg+.07,gz);[-.1,.1].forEach(d=>B.box("glass",.09,.06,.03,gx+d,yg+.09,gz+.3,-.2));
      /* дальномерный прицел ТПД-К1 справа от пушки и прожектор Л-4 слева */
      const yf=rY(1.3);B.box("tur",.46,.3,.34,-.7,yf+.12,1.18);B.box("glass",.34,.15,.02,-.7,yf+.14,1.36);B.box("dark",.38,.04,.2,-.7,yf+.3,1.2);
      B.box("tur",.5,.32,.4,.78,yf+.1,1.0);B.cyl("lamp",.15,.15,.04,18,.78,yf+.12,1.22,Math.PI/2);B.cyl("dark",.17,.17,.03,18,.78,yf+.12,1.2,Math.PI/2);
      /* дымовые гранатомёты 902Б по 4 на борт */
      [-1,1].forEach(sd=>{for(let i=0;i<4;i++)B.cyl("dark",.045,.045,.3,8,sd*(1.0-i*.08),h*.7,1.02-i*.1,-.45,sd*.8);});
      /* кормовые ящики ЗИП, антенна, брезент */
      B.box("tur",.9,.34,.56,.4,h*.52,-1.9,0,.15);B.box("tur",.8,.32,.5,-.5,h*.5,-1.88,0,-.15);B.box("det",.12,.1,.5,.9,h*.4,-1.5);
      B.cyl("dark",.045,.05,.14,8,.95,rY(-1.2)+.04,-1.2);B.cyl("dark",.012,.012,3.0,5,.95,rY(-1.2)+1.5,-1.2);
      [.15,.45,.75,1.05].forEach(z=>B.cyl("det",.045,.045,.5,8,-.0,h*.6,-1.45,0,0,Math.PI/2));
    }
    B.flush(tg,MATS(C));
    /* ---- корпус ---- */
    const H=new Bld(),gy=z=>hullTopAt(v,z),top=v.top;
    /* люк механика-водителя по центру носа с тремя перископами, крышка */
    H.cyl("tur",.27,.3,.07,18,0,gy(2.25)+.02,2.25);H.cyl("dark",.17,.17,.03,14,0,gy(2.25)+.07,2.25);
    [-1,0,1].forEach(s=>H.box("glass",.11,.07,.03,s*.29,gy(2.6)+.05,2.6,-.35));
    /* буксирные тросы по лобовому листу, волноотбойный щиток, фары с защитой, буксирные серьги */
    [-.45,.45].forEach(x=>H.rod("dark",[x,gy(2.0)+.04,2.0],[x*1.05,gy(3.3)+.04,3.3],.025,6));
    H.box("tur",1.6,.28,.04,0,gy(3.0)+.14,3.0,-.35);
    [-1,1].forEach(s=>{H.cyl("lamp",.08,.08,.08,12,s*1.45,1.12,3.08,Math.PI/2+.35);H.box("dark",.2,.14,.22,s*1.45,1.06,3.0);H.box("dark",.14,.12,.12,s*.8,.98,3.4);});
    /* моторно-трансмиссионное отделение: жалюзи и воздухозаборники */
    for(let i=0;i<8;i++)H.box("dark",1.9,.025,.07,0,top-.04+.02,-1.55-i*.17);H.box("dark",1.1,.03,.7,0,top-.03,-3.0);
    [-1,1].forEach(s=>{H.box("dark",.7,.025,.55,s*.62,gy(-.7)+.02,-.7);});
    /* запасные баки на правом крыле, ящики ЗИП на левом, бревно-самовытаскиватель, бочка (дымовая БДШ) сзади */
    for(let i=0;i<2;i++){H.cyl("det",.17,.17,1.0,14,-1.52,top+.2,-2.3+i*1.1,Math.PI/2);H.box("dark",.05,.12,.06,-1.52,top+.05,-2.3+i*1.1+.4);H.box("dark",.05,.12,.06,-1.52,top+.05,-2.3+i*1.1-.4);}
    [0,1,2].forEach(i=>H.box("tur",.38,.2,.8,1.55,top+.1,-2.4+i*.95));
    H.cyl("det",.3,.3,.9,18,.0,top+.28,-3.55,0,0,Math.PI/2);H.cyl("dark",.31,.31,.04,18,.46,top+.28,-3.55,0,0,Math.PI/2);H.cyl("dark",.31,.31,.04,18,-.46,top+.28,-3.55,0,0,Math.PI/2);
    H.cyl("dark",.1,.1,3.2,10,0,top+.14,-3.45,0,0,Math.PI/2);
    H.flush(bg,MATS(C));}
};

/* ---------- общие детали ---------- */
const seams=(B,x,y0,y1,zs,k)=>zs.forEach(z=>{B.box(k||"dark",.014,y1-y0,.025,x,(y0+y1)/2,z);});
const smokeBank=(B,sd,x,y,z,n,rows,tilt,len)=>{for(let r=0;r<rows;r++)for(let i=0;i<n;i++)B.cyl("dark",.042,.042,len||.28,8,sd*x,y+r*.1,z-i*.1,-.2,sd*(tilt||.5),0);};
const hatchRing=(B,k,x,y,z,r,sc)=>{B.cyl(k,r,r*1.05,.07,18,x,y+.02,z);B.cyl("dark",r*.65,r*.65,.03,14,x,y+.07,z);if(sc)for(let i=0;i<sc;i++){const a=-1.1+i*(2.2/Math.max(1,sc-1));B.box("glass",.09,.06,.03,x+Math.sin(a)*r*.7,y+.1,z+Math.cos(a)*r*.7,-.2,a);}};
const wheelZ=(z0,dz,n)=>Array.from({length:n},(_,i)=>z0-i*dz);

/* ======================= Т-90М =======================
   ТТХ: корпус 6,86 м (с пушкой вперёд 9,63 м), ширина по гусеницам ≈3,4 м (≈3,8 м с ДЗ и экранами), высота по крыше башни 2,0 м (2,23 м по прицелам),
   траки 580 мм, 6 катков Ø750, 3 поддерживающих, ведущее — заднее; пушка 2А46М-5 125 мм L/48, вынос среза ≈2,7 м. Башня сварная, клиновидная в плане. */
M.REG.t90m={
  over:v=>[[v,"prof",[[-3.2,.47],[2.55,.47],[3.43,.93],[2.02,1.40],[-3.3,1.36],[-3.45,.95]]],[v,"W",3.5],[v,"top",1.4],[v,"L",6.86],[v,"zF",1.95],
    [v.tur,"p",[0,1.4,-.05]],[v.tur,"h",.62],[v.tur,"poly",mirrorP([[0,1.95],[.45,1.95],[1.55,.75],[1.47,-.1],[1.17,-1.2],[.92,-2.1],[.8,-2.6],[0,-2.6]])],[v.tur,"inset",.9],
    [v.tur,"rb",1.55],[v.tur,"rt",1.4],[v.tur,"gun",{L:4.7,r:.085,y:.40,z0:1.55}],
    [v.run,"x",1.4],[v.run,"w",.58],[v.run,"h",.92],[v.run,"wr",.375],[v.run,"z0",-3.17],[v.run,"z1",3.37]],
  hull(v){return M.REG.tank.hull(v);},
  run(C){
    const guards=(C,sd,px,r,za,zb)=>{const{R0}=C,B=C.b2,fw=R0.w+.16;
      B.box("tur",fw,.04,R0.z1-R0.z0-.7,px,1.03,(R0.z0+R0.z1)/2-.1);B.box("rub",fw,.34,.03,px,.96,R0.z1-.12,-.45);B.box("rub",fw,.42,.03,px,.9,R0.z0+.2,.1);
      B.box("tur",.03,.78,R0.z1-R0.z0-1.4,px+sd*(fw/2-.05),.88,(R0.z0+R0.z1)/2-.1);   /* экран-борт (под ДЗ) */
      seams(B,sd*1.756,.6,1.3,[-2.6,-1.9,-1.2,-.5,.2,.9,1.6,2.3],"dark");B.box("dark",.02,.025,R0.z1-R0.z0-1.3,sd*1.757,1.31,(R0.z0+R0.z1)/2-.1);};
    C.b2=new Bld();
    runGear(C,{track:{pitch:.137,th:.05,hornW:.04,hornH:.07,grouser:true},half:C.R0.w*.3,sprF:false,sprK:.74,idlK:.78,teeth:14,rollers:3,rollR:.1,wz:()=>[2.2,1.4,.6,-.2,-1.0,-1.8],guards});
    C.b2.flush(C.g,MATS(C));},
  turret(C){const{tg,T0,tag,dark}=C,P=T0.poly.map(p=>[p[0],p[1]]),h=T0.h,o={smooth:0,fd:.1,fs:.5,layers:[{y:0,s:1},{y:.08,s:1},{y:.5,s:.95},{y:.92,s:.9},{y:1,s:.895}]};
    const tm=tag(new T3.Mesh(turretGeo(P,h,o),TM(C)),"tur");tg.add(tm);C.roofY=roofFn(P,h,o);
    const ring=new T3.Mesh(new T3.CylinderGeometry(1.1,1.12,.1,36),dark);ring.position.y=0;C.sh0(ring);tg.add(ring);},
  gun(C){const{gp,T0,tag}=C,r=T0.gun.r,L=T0.gun.L,B=new Bld();
    const man=new T3.Mesh(new T3.BoxGeometry(.95,.5,.55),TM(C));man.position.set(0,.0,.28);tag(man,"tur");gp.add(man);
    const pr=[[0,1.9],[.06,1.9],[.07,1.3],[.12,1.2],[.14,1.34],[.64,1.34],[.645,1.2],[.68,1.2],[.72,1.5],[.78,1.5],[.785,1.0],[.93,.96],[.95,1.1],[.99,1.1],[1,1.0]];
    const brl=tag(new T3.Mesh(barrelGeo(L,r,pr,18),C.dark),"gun");brl.rotation.x=Math.PI/2;brl.position.z=L/2;gp.add(brl);return brl;},
  decor(C){const{v,tg,bg,T0}=C,B=new Bld(),h=T0.h,rY=C.roofY;
    {const yc=rY(-1.1),cx=-.62,cz=-1.1;                          /* дистанционный модуль командира (справа) */
      B.cyl("tur",.33,.35,.14,20,cx,yc+.05,cz);B.box("tur",.62,.52,.74,cx,yc+.36,cz);B.box("glass",.4,.18,.02,cx,yc+.4,cz+.38);B.box("dark",.34,.12,.3,cx,yc+.68,cz);
      B.box("dark",.14,.14,.4,cx+.42,yc+.46,cz+.22);B.cyl("dark",.025,.025,1.0,8,cx+.42,yc+.46,cz+.9,Math.PI/2);
      const yg=rY(-.5);hatchRing(B,"tur",.58,yg,-.55,.27,5);                               /* люк наводчика */
      const yf=rY(1.0);B.box("tur",.4,.3,.5,.6,yf+.12,.85);B.box("glass",.3,.14,.02,.6,yf+.14,1.11);B.box("dark",.3,.04,.3,.6,yf+.3,.85);   /* прицел «Сосна-У» */
      B.box("tur",.3,.22,.34,-.5,rY(.9)+.1,.95);B.box("glass",.2,.1,.02,-.5,rY(.9)+.12,1.13);                                 /* прицел ТПД */
      [-1,1].forEach(sd=>{smokeBank(B,sd,1.08,h*.7,1.0,4,1,.6);});
      B.box("tur",1.5,.5,.5,0,h*.55,-2.45);B.box("det",1.3,.2,.5,0,h*.88,-2.5);for(let i=0;i<5;i++)B.box("dark",1.4,.02,.06,0,h*.34,-2.7+0);   /* кормовая ниша */
      B.cyl("dark",.045,.05,.14,8,.9,rY(-1.7)+.03,-1.7);B.cyl("dark",.012,.012,3.0,5,.9,rY(-1.7)+1.5,-1.7);
      B.cyl("dark",.012,.012,.8,5,-.1,rY(-.1)+.4,-.1);
    }
    B.flush(tg,MATS(C));
    const H=new Bld(),gy=z=>hullTopAt(v,z),top=v.top;
    hatchRing(H,"tur",0,gy(2.25),2.25,.27,0);[-1,0,1].forEach(s=>H.box("glass",.11,.07,.03,s*.29,gy(2.6)+.05,2.6,-.35));
    [-.45,.45].forEach(x=>H.rod("dark",[x,gy(2.0)+.04,2.0],[x*1.05,gy(3.3)+.04,3.3],.025,6));H.box("tur",1.6,.28,.04,0,gy(3.0)+.14,3.0,-.35);
    [-1,1].forEach(s=>{H.cyl("lamp",.08,.08,.08,12,s*1.45,1.12,3.08,Math.PI/2+.35);H.box("dark",.2,.14,.22,s*1.45,1.06,3.0);});
    for(let i=0;i<9;i++)H.box("dark",1.9,.025,.07,0,top-.04+.02,-1.5-i*.16);H.box("dark",1.1,.03,.7,0,top-.03,-3.1);
    H.cyl("det",.3,.3,.9,18,0,top+.28,-3.55,0,0,Math.PI/2);H.cyl("dark",.31,.31,.04,18,.46,top+.28,-3.55,0,0,Math.PI/2);H.cyl("dark",.31,.31,.04,18,-.46,top+.28,-3.55,0,0,Math.PI/2);
    [-1,1].forEach(s=>{H.box("tur",.55,.3,.7,s*.65,top+.12,-3.75);H.box("dark",.5,.04,.6,s*.65,top+.28,-3.75);});          /* задние баки */
    [0,1,2].forEach(i=>H.box("tur",.38,.2,.8,1.55,top+.1,-2.2+i*.95));
    H.flush(bg,MATS(C));}
};

/* ======================= Leopard 2A6 =======================
   ТТХ: корпус 7,72 м (с пушкой вперёд 10,97 м), ширина 3,75 м с экранами (по гусеницам 3,42 м), высота 2,64 м (по крыше башни ≈2,5 м), клиренс 0,54 м,
   траки 635 мм, 7 сдвоенных катков Ø710, 4 поддерживающих, ведущее — заднее; пушка Rh-120 L/55, вынос среза за нос корпуса 3,25 м.
   Башня сварная, клиновидная; бортовые экраны корпуса по всей длине гусеницы. */
M.REG.leo2={
  over:v=>[[v,"prof",[[-3.8,.52],[2.9,.5],[3.78,.97],[3.74,1.46],[1.85,1.74],[-.7,1.76],[-.8,1.86],[-3.84,1.86],[-3.9,1.1]]],[v,"W",3.7],[v,"top",1.76],[v,"L",7.72],[v,"zF",2.0],
    [v.tur,"p",[0,1.76,0]],[v.tur,"h",.74],[v.tur,"poly",mirrorP([[0,3.12],[.35,3.1],[1.2,2.45],[1.5,2.0],[1.55,1.0],[1.55,-2.2],[1.4,-2.85],[1.0,-3.1],[0,-3.1]])],[v.tur,"inset",.96],
    [v.tur,"rb",1.55],[v.tur,"rt",1.5],[v.tur,"gun",{L:4.41,r:.085,y:.5,z0:2.85}],
    [v.run,"x",1.5],[v.run,"w",.635],[v.run,"h",.913],[v.run,"wr",.355],[v.run,"z0",-3.74],[v.run,"z1",3.9]],
  hull(v){
    return boxHull(v,{zs:[-3.9,-3.84,-3.75,-3.5,-2.8,-1.5,-.8,-.7,.5,1.5,1.9,2.4,2.9,3.4,3.74,3.78],hb:.95,yw:.8,ch:.06,
      wt:[[-3.9,.84],[-3.75,.98],[-3.0,1],[2.5,1],[3.2,.9],[3.78,.74]],roofIn:[[-3.9,.1],[2.5,.1],[3.78,.2]]});},
  run(C){
    const guards=(C,sd,px,r,za,zb)=>{const R0=C.R0,B=C.b2;
      B.box("rub",R0.w+.12,.36,.03,px,.98,R0.z1-.06,-.35);B.box("rub",R0.w+.1,.4,.03,px,.9,R0.z0+.2,.1);
      B.box("tur",.04,.86,R0.z1-R0.z0-1.0,px+sd*(R0.w/2+.07),1.2,(R0.z0+R0.z1)/2-.1);   /* бортовой экран */
      seams(B,px+sd*(R0.w/2+.1),.8,1.62,[-3.0,-2.0,-1.0,0,1.0,2.0,2.9],"dark");};
    C.b2=new Bld();
    runGear(C,{track:{pitch:.19,th:.05,hornW:.05,hornH:.07,grouser:false,pad:true},half:C.R0.w*.3,sprF:false,sprK:.8,idlK:.78,teeth:15,rollers:4,rollR:.1,
      wz:()=>[2.31,1.47,.62,-.22,-1.06,-1.91,-2.75],guards});
    C.b2.flush(C.g,MATS(C));},
  turret(C){const{tg,T0,tag,dark}=C,P=T0.poly.map(p=>[p[0],p[1]]),h=T0.h,o={smooth:0,fd:.55,fs:.55,layers:[{y:0,s:1},{y:.06,s:1},{y:.88,s:.975},{y:1,s:.96}]};
    const tm=tag(new T3.Mesh(turretGeo(P,h,o),TM(C)),"tur");tg.add(tm);C.roofY=roofFn(P,h,o);
    const ring=new T3.Mesh(new T3.CylinderGeometry(1.2,1.22,.1,36),dark);ring.position.y=0;C.sh0(ring);tg.add(ring);},
  gun(C){const{gp,T0,tag}=C,r=T0.gun.r,L=T0.gun.L;
    const man=new T3.Mesh(new T3.BoxGeometry(1.0,.58,.8),TM(C));man.position.set(0,0,.55);tag(man,"tur");gp.add(man);
    const pr=[[0,1.9],[.18,1.9],[.19,1.45],[.56,1.45],[.565,1.0],[.59,1.0],[.6,1.28],[.66,1.28],[.665,1.0],[.9,.95],[.98,.95],[.985,1.05],[1,1.05]];
    const brl=tag(new T3.Mesh(barrelGeo(L+.6,r,pr,18),C.dark),"gun");brl.rotation.x=Math.PI/2;brl.position.z=(L+.6)/2-.6;gp.add(brl);return brl;},
  decor(C){const{v,tg,bg,T0}=C,B=new Bld(),h=T0.h,rY=C.roofY;
    {const yc=rY(-.2);
      hatchRing(B,"tur",-.57,yc,-.2,.3,6);B.cyl("dark",.08,.08,.18,10,-.57,yc+.18,-.2);                       /* командир (справа) */
      B.box("tur",.36,.34,.44,-.5,yc+.12,.4);B.box("glass",.26,.18,.02,-.5,yc+.14,.63);B.box("dark",.3,.05,.3,-.5,yc+.32,.4);  /* панорамный прицел PERI */
      hatchRing(B,"tur",.75,yc,-.25,.28,0);B.box("dark",.14,.14,.46,.75,yc+.28,.05);B.cyl("dark",.022,.022,.8,8,.75,yc+.3,.6,Math.PI/2);   /* заряжающий с MG3 */
      const yf=rY(1.15);B.box("tur",.5,.28,.55,.66,yf+.12,1.05);B.box("glass",.34,.16,.02,.66,yf+.14,1.34);B.box("dark",.34,.04,.3,.66,yf+.3,1.05);   /* прицел EMES-15 */
      [-1,1].forEach(sd=>{smokeBank(B,sd,1.57,h*.62,-.95,4,2,.5,.3);});
      B.box("tur",2.5,.62,.5,0,h*.5,-3.35);for(let i=0;i<6;i++)B.box("dark",2.4,.025,.04,0,h*.2+i*.08,-3.62);   /* кормовая корзина */
      B.cyl("dark",.045,.05,.14,8,-1.1,rY(-2.2)+.03,-2.2);B.cyl("dark",.012,.012,3.2,5,-1.1,rY(-2.2)+1.6,-2.2);
      B.box("det",.4,.12,.7,-.95,rY(-1.5)+.05,-1.5);B.box("det",.4,.12,.7,.95,rY(-1.5)+.05,-1.5);}
    B.flush(tg,MATS(C));
    const H=new Bld(),gy=z=>hullTopAt(v,z),top=v.top;
    hatchRing(H,"tur",-.62,gy(2.9),2.9,.27,0);[-1,0,1].forEach(s=>H.box("glass",.1,.07,.03,-.62+s*.25,gy(3.2)+.05,3.2,-.3));
    [-1,1].forEach(s=>{H.cyl("lamp",.09,.09,.1,12,s*1.35,gy(3.5)+.07,3.5,Math.PI/2+.2);H.box("dark",.24,.15,.2,s*1.35,gy(3.5)-.02,3.43);});
    for(let i=0;i<10;i++)H.box("dark",1.7,.02,.05,0,gy(-1.3)+.02,-1.25-i*.22);
    [-1,1].forEach(s=>{H.cyl("dark",.58,.58,.04,24,s*.9,top+.1,-3.2);H.cyl("steel",.5,.5,.02,24,s*.9,top+.13,-3.2);});
    H.box("dark",.14,.14,.14,0,top+.07,-1.0);
    [-1,1].forEach(s=>{H.box("tur",.55,.4,1.0,s*1.0,gy(2.5)+.2,2.2);H.box("tur",.45,.18,.9,s*1.05,gy(2.3)+.1,1.9);});
    H.flush(bg,MATS(C));}
};

/* ======================= M1A2 SEPv3 Abrams =======================
   ТТХ: корпус 7,93 м (с пушкой вперёд 9,83 м), ширина 3,66 м, высота 2,44 м (по крыше башни ≈2,35 м), клиренс 0,43 м, траки 635 мм, 7 катков Ø635,
   4 поддерживающих, ведущее — заднее; пушка M256 120 мм L/44, вынос среза за нос корпуса ≈1,8 м. Башня сварная, плоская лобовая плита. */
M.REG.m1a2={
  over:v=>[[v,"prof",[[-4.0,.52],[3.0,.52],[3.5,.64],[3.95,1.18],[2.25,1.43],[-.2,1.43],[-.7,1.52],[-4.0,1.52],[-4.08,1.0]]],[v,"W",3.66],[v,"top",1.43],[v,"L",8.03],[v,"zF",2.2],
    [v.tur,"p",[0,1.43,-.25]],[v.tur,"h",.92],[v.tur,"poly",mirrorP([[0,2.35],[.38,2.33],[1.46,1.55],[1.52,.9],[1.52,-2.35],[1.25,-2.8],[.6,-2.85],[0,-2.85]])],[v.tur,"inset",.93],
    [v.tur,"rb",1.52],[v.tur,"rt",1.42],[v.tur,"gun",{L:4.05,r:.078,y:.52,z0:2.07}],
    [v.run,"x",1.5],[v.run,"w",.635],[v.run,"h",.95],[v.run,"wr",.318],[v.run,"z0",-3.59],[v.run,"z1",3.84]],
  hull(v){
    return boxHull(v,{zs:[-4.08,-4.0,-3.8,-3.0,-2.0,-.8,-.7,-.2,1,2.25,2.8,3.3,3.6,3.95],hb:.95,yw:.8,ch:.05,
      wt:[[-4.08,.9],[-3.8,1],[2.4,1],[3.3,.95],[3.95,.7]],roofIn:[[-4.08,.1],[2.25,.1],[3.95,.3]]});},
  run(C){
    const guards=(C,sd,px,r,za,zb)=>{const R0=C.R0,B=C.b2;
      B.box("rub",R0.w+.12,.4,.03,px,.9,R0.z1-.06,-.4);B.box("rub",R0.w+.1,.4,.03,px,.88,R0.z0+.2,.1);
      B.box("tur",.04,.84,R0.z1-R0.z0-1.2,px+sd*(R0.w/2+.08),1.0,(R0.z0+R0.z1)/2-.2);
      seams(B,px+sd*(R0.w/2+.105),.6,1.42,[-2.9,-1.6,-.3,1.0,2.3],"dark");};
    C.b2=new Bld();
    runGear(C,{track:{pitch:.19,th:.05,hornW:.05,hornH:.07,grouser:false,pad:true},half:C.R0.w*.3,sprF:false,sprK:.85,idlK:.8,teeth:11,rollers:4,rollR:.1,
      wz:()=>[2.35,1.55,.75,-.05,-.85,-1.65,-2.45],guards});
    C.b2.flush(C.g,MATS(C));},
  turret(C){const{tg,T0,tag,dark}=C,P=T0.poly.map(p=>[p[0],p[1]]),h=T0.h,o={smooth:0,fd:.12,fs:.6,layers:[{y:0,s:1},{y:.05,s:1},{y:.5,s:.97},{y:.92,s:.935},{y:1,s:.93}]};
    const tm=tag(new T3.Mesh(turretGeo(P,h,o),TM(C)),"tur");tg.add(tm);C.roofY=roofFn(P,h,o);
    const ring=new T3.Mesh(new T3.CylinderGeometry(1.15,1.17,.1,36),dark);ring.position.y=0;C.sh0(ring);tg.add(ring);},
  gun(C){const{gp,T0,tag}=C,r=T0.gun.r,L=T0.gun.L;
    const man=new T3.Mesh(new T3.BoxGeometry(.78,.55,.9),TM(C));man.position.set(0,0,.45);tag(man,"tur");gp.add(man);
    const pr=[[0,2.2],[.14,2.2],[.15,1.5],[.42,1.5],[.425,1.0],[.58,1.0],[.585,1.55],[.7,1.55],[.705,1.0],[.96,.95],[.985,.95],[.99,1.15],[1,1.15]];
    const brl=tag(new T3.Mesh(barrelGeo(L+.9,r,pr,18),C.dark),"gun");brl.rotation.x=Math.PI/2;brl.position.z=(L+.9)/2-.9;gp.add(brl);return brl;},
  decor(C){const{v,tg,bg,T0}=C,B=new Bld(),h=T0.h,rY=C.roofY;
    {const yc=rY(-.3);
      /* станция командира с дистанционным пулемётным модулем (справа) */
      B.cyl("tur",.4,.42,.2,20,-.55,yc+.08,-.35);B.cyl("tur",.28,.3,.55,16,-.55,yc+.4,-.35);B.box("tur",.5,.3,.55,-.55,yc+.95,-.25);B.box("glass",.34,.16,.02,-.55,yc+.97,.04);
      B.box("dark",.18,.16,.5,-.2,yc+.7,.0);B.cyl("dark",.03,.03,.9,8,-.2,yc+.7,.65,Math.PI/2);
      /* люк заряжающего с M240 (слева) */
      hatchRing(B,"tur",.62,yc,-.35,.3,0);B.cyl("dark",.03,.03,.3,8,.8,yc+.2,-.35);B.box("dark",.12,.14,.5,.8,yc+.4,-.1);B.cyl("dark",.022,.022,.6,8,.8,yc+.4,.4,Math.PI/2);
      /* прицел наводчика (лобовая крышка) и метеодатчик */
      const yf=rY(1.4);B.box("tur",.42,.2,.5,.55,yf+.08,1.3);B.box("glass",.3,.1,.02,.55,yf+.1,1.56);
      B.cyl("dark",.012,.012,.7,5,-.3,rY(-1.2)+.35,-1.2);
      /* дымовые гранатомёты по бортам лба башни */
      [-1,1].forEach(sd=>{B.box("dark",.34,.3,.3,sd*1.38,h*.82,1.45,0,sd*.5);B.box("dark",.3,.24,.12,sd*1.45,h*.72,1.28,0,sd*.5);});
      /* кормовой контейнер-ниша и антенны */
      B.box("tur",2.4,.62,.55,0,h*.5,-3.1);for(let i=0;i<5;i++)B.box("dark",2.3,.03,.05,0,h*.3+i*.1,-3.4);
      [-1,1].forEach(sd=>{B.cyl("dark",.05,.055,.14,8,sd*1.1,rY(-2.1)+.04,-2.1);B.cyl("dark",.012,.012,3.1,5,sd*1.1,rY(-2.1)+1.55,-2.1);});
      B.box("det",.7,.12,.5,-.6,rY(-1.6)+.05,-1.6);B.box("det",.7,.12,.5,.6,rY(-1.6)+.05,-1.6);}
    B.flush(tg,MATS(C));
    const H=new Bld(),gy=z=>hullTopAt(v,z),top=v.top;
    hatchRing(H,"tur",0,gy(3.0),3.0,.27,0);[-1,0,1].forEach(s=>H.box("glass",.1,.07,.03,s*.27,gy(3.28)+.05,3.28,-.35));
    [-1,1].forEach(s=>{H.cyl("lamp",.09,.09,.1,12,s*1.5,gy(3.6)+.07,3.6,Math.PI/2+.2);H.box("dark",.3,.16,.26,s*1.5,gy(3.6)-.02,3.5);});
    [-1,1].forEach(s=>H.box("tur",.5,.35,.8,s*1.35,top-.02+.17,2.3));
    for(let i=0;i<9;i++)H.box("dark",1.5,.02,.06,0,gy(-1.9)+.02,-1.9-i*.2);
    [-.5,.5].forEach(x=>{for(let i=0;i<8;i++)H.box("dark",.85,.02,.05,x,gy(-.4)+.02,-.3-i*.1);});
    H.box("tur",1.4,.3,.4,0,top+.15,-3.9);H.box("dark",1.4,.05,.3,0,top+.31,-3.9);
    [-1,1].forEach(s=>H.cyl("dark",.05,.05,.8,8,s*1.55,top+.2,-3.7));
    H.flush(bg,MATS(C));}
};
})();
