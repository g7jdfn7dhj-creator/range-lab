/* Range Lab — модели техники v2 (процедурные, three.js r128, без внешних ассетов).
   Подключается ДО основного скрипта. Хуки в vehBuild: MV2.sync / MV2.hull / MV2.run / MV2.turret / MV2.gun / MV2.decor.
   Структура групп, теги зон ("hull","tur","gun","run"), userData (belt, rw, rz, part) — как у прежних моделей. */
window.MV2=(()=>{
const T3=THREE,lerp=(a,b,t)=>a+(b-a)*t,V=(x,y,z)=>new T3.Vector3(x,y,z);
const clamp01=x=>Math.max(0,Math.min(1,x));
function interp(tab,z){if(z<=tab[0][0])return tab[0][1];for(let i=1;i<tab.length;i++)if(z<=tab[i][0]){const t=(z-tab[i-1][0])/(tab[i][0]-tab[i-1][0]);return lerp(tab[i-1][1],tab[i][1],t);}return tab[tab.length-1][1];}
function profYs(prof,z){const ys=[];for(let i=0;i<prof.length;i++){const a=prof[i],b=prof[(i+1)%prof.length];if(a[0]===b[0]){if(Math.abs(a[0]-z)<1e-6)ys.push(a[1],b[1]);continue;}if((a[0]-z)*(b[0]-z)<=0){const t=(z-a[0])/(b[0]-a[0]);ys.push(a[1]+t*(b[1]-a[1]));}}return[Math.min(...ys),Math.max(...ys)];}
/* плоско-затенённая сетка из треугольников; UV — проекция по доминирующей оси нормали (в метрах*s) */
function triGeo(T,s,colFn){const P=[],N=[],U=[],C=colFn?[]:null;const n=new T3.Vector3(),e1=new T3.Vector3(),e2=new T3.Vector3();
  T.forEach(t=>{e1.subVectors(t[1],t[0]);e2.subVectors(t[2],t[0]);n.crossVectors(e1,e2);if(n.lengthSq()<1e-14)return;n.normalize();const ax=Math.abs(n.x),ay=Math.abs(n.y),az=Math.abs(n.z);
    t.forEach(p=>{P.push(p.x,p.y,p.z);N.push(n.x,n.y,n.z);if(ax>=ay&&ax>=az)U.push(p.z*s,p.y*s);else if(ay>=az)U.push(p.x*s,p.z*s);else U.push(p.x*s,p.y*s);if(C){const k=colFn(p);C.push(k*1.02,k,k*.94);}});});
  const g=new T3.BufferGeometry();g.setAttribute("position",new T3.Float32BufferAttribute(P,3));g.setAttribute("normal",new T3.Float32BufferAttribute(N,3));g.setAttribute("uv",new T3.Float32BufferAttribute(U,2));if(C)g.setAttribute("color",new T3.Float32BufferAttribute(C,3));return g;}
function mergeG(list){let nv=0,ni=0;list.forEach(g=>{nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;});
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),U=new Float32Array(nv*2),I=new Uint32Array(ni);let vo=0,io=0;
  list.forEach(g=>{const c=g.attributes.position.count;P.set(g.attributes.position.array,vo*3);N.set(g.attributes.normal.array,vo*3);U.set(g.attributes.uv.array,vo*2);
    if(g.index){for(let i=0;i<g.index.count;i++)I[io+i]=g.index.array[i]+vo;io+=g.index.count;}else{for(let i=0;i<c;i++)I[io+i]=vo+i;io+=c;}vo+=c;});
  const m=new T3.BufferGeometry();m.setAttribute("position",new T3.BufferAttribute(P,3));m.setAttribute("normal",new T3.BufferAttribute(N,3));m.setAttribute("uv",new T3.BufferAttribute(U,2));m.setIndex(new T3.BufferAttribute(I,1));return m;}
/* накопитель деталей: геометрия по ключу материала, потом одна сетка на материал */
function Bld(){this.m={};}
Bld.prototype.geo=function(k,g,x,y,z,rx,ry,rz,sx,sy,sz){const M=new T3.Matrix4().compose(V(x||0,y||0,z||0),new T3.Quaternion().setFromEuler(new T3.Euler(rx||0,ry||0,rz||0)),V(sx==null?1:sx,sy==null?1:sy,sz==null?1:sz));g.applyMatrix4(M);(this.m[k]=this.m[k]||[]).push(g);return this;};
Bld.prototype.box=function(k,w,h,d,x,y,z,rx,ry,rz){return this.geo(k,new T3.BoxGeometry(w,h,d),x,y,z,rx,ry,rz);};
Bld.prototype.cyl=function(k,rt,rb,h,s,x,y,z,rx,ry,rz){return this.geo(k,new T3.CylinderGeometry(rt,rb,h,s||12),x,y,z,rx,ry,rz);};
Bld.prototype.sph=function(k,r,x,y,z,sx,sy,sz,ws,hs){return this.geo(k,new T3.SphereGeometry(r,ws||10,hs||7),x,y,z,0,0,0,sx,sy,sz);};
Bld.prototype.flush=function(par,mats,cs){let n=0;for(const k in this.m){const L=this.m[k];if(!L.length)continue;const me=new T3.Mesh(mergeG(L),mats[k]);me.castShadow=me.receiveShadow=cs!==false;me.name="v2:"+k;par.add(me);n+=L.length;}return n;};
function chaikin(P,it){let p=P.slice();for(let k=0;k<it;k++){const q=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];q.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);}p=q;}return p;}

/* ---------- корпус: лофт по сечениям вдоль профиля v.prof ---------- */
function hullGeo(v,o){
  const rings=o.zs.map(z=>{const[yb,yt]=profYs(v.prof,z),h=o.sec(z,yb,yt),r=h.map(q=>V(q[0],q[1],z));for(let i=h.length-2;i>=1;i--)r.push(V(-h[i][0],h[i][1],z));return r;});
  const T=[],n=rings[0].length;
  for(let k=0;k<rings.length-1;k++){const A=rings[k],B=rings[k+1];for(let i=0;i<n;i++){const j=(i+1)%n;T.push([A[i],A[j],B[j]],[A[i],B[j],B[i]]);}}
  const cap=(R,front)=>{const c=V(0,0,0);R.forEach(p=>c.add(p));c.multiplyScalar(1/R.length);for(let i=0;i<n;i++){const j=(i+1)%n;front?T.push([c,R[i],R[j]]):T.push([c,R[j],R[i]]);}};
  cap(rings[rings.length-1],true);cap(rings[0],false);
  const top=v.top;return triGeo(T,1,p=>Math.min(1,.55+.45*Math.max(0,(p.y-.3)/(top-.3))));}

/* ---------- башня: лофт по многоугольнику с «наклоном» крыши ---------- */
function turretGeo(P0,h,o){
  let A=0;P0.forEach((p,i)=>{const q=P0[(i+1)%P0.length];A+=p[0]*q[1]-q[0]*p[1];});if(A<0)P0=P0.slice().reverse();
  const P=o.smooth?chaikin(P0,o.smooth):P0.slice(),L=o.layers;
  const zmin=Math.min(...P.map(p=>p[1])),zmax=Math.max(...P.map(p=>p[1]));
  const rings=L.map((l,k)=>P.map(p=>{const zn=(p[1]-zmin)/(zmax-zmin);const rf=o.fd!=null?1-o.fd*clamp01((zn-(o.fs||0))/(1-(o.fs||0))):1-(o.roofDrop||0)*(1-zn);const roof=lerp(1,rf,k/(L.length-1));return V(p[0]*l.s,l.y*h*roof,p[1]*l.s+(l.f||0));}));
  const T=[],n=P.length;
  for(let k=0;k<rings.length-1;k++){const A=rings[k],B=rings[k+1];for(let i=0;i<n;i++){const j=(i+1)%n;T.push([A[i],B[j],A[j]],[A[i],B[i],B[j]]);}}
  const top=rings[rings.length-1],c=V(0,0,0);top.forEach(p=>c.add(p));c.multiplyScalar(1/n);c.y+=o.dome||0;for(let i=0;i<n;i++){const j=(i+1)%n;T.push([c,top[j],top[i]]);}
  const b=rings[0],bc=V(0,0,(zmin+zmax)/2);for(let i=0;i<n;i++){const j=(i+1)%n;T.push([bc,b[i],b[j]]);}
  let g=triGeo(T,.9);
  if(o.smooth){ /* сглаженные нормали для литой башни */
    const Pp=g.attributes.position,Nn=g.attributes.normal,map=new Map(),key=(i)=>Math.round(Pp.getX(i)*500)+"_"+Math.round(Pp.getY(i)*500)+"_"+Math.round(Pp.getZ(i)*500);
    for(let i=0;i<Pp.count;i++){const k=key(i);let a=map.get(k);if(!a)map.set(k,a=V(0,0,0));a.x+=Nn.getX(i);a.y+=Nn.getY(i);a.z+=Nn.getZ(i);}
    for(let i=0;i<Pp.count;i++){const a=map.get(key(i)).clone().normalize();Nn.setXYZ(i,a.x,a.y,a.z);}}
  return g;}

/* ---------- ствол: лофт по заданному профилю [доля длины, множитель радиуса] ---------- */
function barrelGeo(L,r,prof,seg){const pts=prof.map(p=>new T3.Vector2(r*p[1],-L/2+p[0]*L));pts.unshift(new T3.Vector2(0,-L/2));pts.push(new T3.Vector2(0,L/2));return new T3.LatheGeometry(pts,seg||18);}

/* ---------- гусеница: траки как геометрия, движутся по контуру ---------- */
function trackBelt(za,zb,r,w,o,ox,oy){ox=ox||0;oy=oy||0;
  const Ls=zb-za,Per=2*Ls+2*Math.PI*r,N=Math.max(8,Math.round(Per/o.pitch)),th=o.th;
  const at=s=>{s=((s%Per)+Per)%Per;if(s<Ls)return[za+s,0,0,-1];s-=Ls;const arc=Math.PI*r;
    if(s<arc){const a=-Math.PI/2+s/r;return[zb+Math.cos(a)*r,r+Math.sin(a)*r,Math.cos(a),Math.sin(a)];}
    s-=arc;if(s<Ls)return[zb-s,2*r,0,1];s-=Ls;const a=Math.PI/2+s/r;return[za+Math.cos(a)*r,r+Math.sin(a)*r,Math.cos(a),Math.sin(a)];};
  /* шаблон одного трака в локальных осях: X поперёк, Y наружу, Z вдоль (-касательной) */
  const parts=[];const pg=new T3.BoxGeometry(w,th,o.pitch*.9);parts.push(pg);
  const horn=new T3.BoxGeometry(o.hornW||.04,o.hornH||.06,o.pitch*.5);horn.translate(0,-(th/2+(o.hornH||.06)/2),0);parts.push(horn);
  if(o.grouser){const gs=new T3.BoxGeometry(w*.94,.016,.028);gs.translate(0,th/2+.008,0);parts.push(gs);}
  if(o.pad){[-1,1].forEach(sx=>{const pd=new T3.BoxGeometry(w*.3,.02,o.pitch*.82);pd.translate(sx*w*.3,th/2+.01,0);parts.push(pd);});}
  const tmpl=mergeG(parts).toNonIndexed(),M=tmpl.attributes.position.count,lp=tmpl.attributes.position.array,ln=tmpl.attributes.normal.array,uv=tmpl.attributes.uv.array;
  const pos=new Float32Array(N*M*3),nor=new Float32Array(N*M*3),UV=new Float32Array(N*M*2);
  for(let i=0;i<N;i++)UV.set(uv,i*M*2);
  const geo=new T3.BufferGeometry();const pa=new T3.BufferAttribute(pos,3),na=new T3.BufferAttribute(nor,3);pa.setUsage(T3.DynamicDrawUsage);na.setUsage(T3.DynamicDrawUsage);
  geo.setAttribute("position",pa);geo.setAttribute("normal",na);geo.setAttribute("uv",new T3.BufferAttribute(UV,2));
  let shift=0;
  const upd=()=>{for(let i=0;i<N;i++){const p=at((i+.5)*Per/N+shift),ny=p[3],nz=p[2],y0=p[1],z0=p[0];
      for(let k=0;k<M;k++){const o3=(i*M+k)*3,k3=k*3,lx=lp[k3],ly=lp[k3+1],lz=lp[k3+2];
        pos[o3]=lx+ox;pos[o3+1]=oy+y0+ny*(ly+th/2)-nz*lz;pos[o3+2]=z0+nz*(ly+th/2)+ny*lz;
        const nx=ln[k3],nyl=ln[k3+1],nzl=ln[k3+2];nor[o3]=nx;nor[o3+1]=ny*nyl-nz*nzl;nor[o3+2]=nz*nyl+ny*nzl;}}
    pa.needsUpdate=na.needsUpdate=true;};
  upd();geo.boundingSphere=new T3.Sphere(V(ox,r,(za+zb)/2),Ls/2+r+.5);
  return{geo,anim:d=>{shift+=d;if(Math.abs(d)>1e-5)upd();},N,Per};}
function starGeo(rOut,rIn,teeth,depth){const sh=new T3.Shape(),n=teeth*4;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,k=i%4,rr=(k===1||k===2)?rOut:rIn;const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?sh.lineTo(x,y):sh.moveTo(x,y);}sh.closePath();
  const g=new T3.ExtrudeGeometry(sh,{depth,bevelEnabled:false});g.translate(0,0,-depth/2);g.rotateX(Math.PI/2);g.parameters={radiusTop:rOut};return g;}
function wheelParts(wr,half,seg){
  const tyre=[[wr*.78,-half-.01],[wr*.95,-half-.01],[wr,-half+.02],[wr,-.03],[wr*.95,-.022],[wr*.78,-.022]].map(p=>new T3.Vector2(p[0],p[1]));
  const t1=new T3.LatheGeometry(tyre,seg||16),t2=t1.clone();t2.scale(1,-1,1);
  const hh=half+.035,dp=[[0,-hh],[wr*.2,-hh],[wr*.27,-half+.02],[wr*.34,-half+.005],[wr*.8,-half+.005],[wr*.84,-half-.01],[wr*.84,half+.01],[wr*.8,half-.005],[wr*.34,half-.005],[wr*.27,half-.02],[wr*.2,hh],[0,hh]].map(p=>new T3.Vector2(p[0],p[1]));
  /* t2 зеркальный: нормали и порядок вершин — через пересчёт */
  t2.computeVertexNormals();
  return{tyres:mergeG([t1,t2]),disc:new T3.LatheGeometry(dp,seg||16)};}

/* ---------- ходовая часть гусеничной машины ---------- */
function run(C,o){
  const{g,R0,v,rub,detM,dark,steel,tag,sh0}=C,r=R0.h*.46,za=R0.z0+r,zb=R0.z1-r;
  const trkM=C.mk(o.trkCol||0x3b3a33,{roughness:.62,metalness:.7});
  const belts=[];
  [-1,1].forEach(sd=>{const px=sd*R0.x;
    const proxy=tag(new T3.Mesh(new T3.BoxGeometry(R0.w,R0.h*.9,R0.z1-R0.z0),rub),"run");proxy.position.set(px,R0.h*.47,(R0.z0+R0.z1)/2);proxy.visible=false;g.add(proxy);
    const tb=trackBelt(za,zb,r,R0.w,o.track,px,o.track.th);
    const bm=sh0(new T3.Mesh(tb.geo,trkM));bm.userData.belt=sd;bm.frustumCulled=false;g.add(bm);belts.push(tb);
    const wr=Math.min(R0.wr,r-.04),{tyres,disc}=wheelParts(wr,o.half||R0.w*.3,o.seg);
    const zw=o.wz(R0,za,zb,r);
    zw.forEach(z=>{const y=o.track.th+wr+.01;
      const a=sh0(new T3.Mesh(tyres,rub)),b=sh0(new T3.Mesh(disc,detM));
      [a,b].forEach(m=>{m.rotation.z=Math.PI/2;m.position.set(px,y,z);m.userData.rw=sd;m.userData.rz=z;m.geometry.parameters={radiusTop:wr};g.add(m);});});
    const fz=o.sprF?zb:za,iz=o.sprF?za:zb,sR=r*o.sprK,sy=r;
    [-1,1].forEach(k=>{const m=sh0(new T3.Mesh(starGeo(sR,sR*.84,o.teeth,.04),dark));m.rotation.z=Math.PI/2;m.position.set(px+k*R0.w*.2,sy,fz);m.userData.sp=1;g.add(m);});
    {const hub=sh0(new T3.Mesh(new T3.CylinderGeometry(sR*.34,sR*.34,R0.w*.62,14),steel));hub.rotation.z=Math.PI/2;hub.position.set(px,sy,fz);hub.userData.sp=1;g.add(hub);
     const mid=sh0(new T3.Mesh(new T3.CylinderGeometry(sR*.82,sR*.82,R0.w*.3,16),dark));mid.rotation.z=Math.PI/2;mid.position.set(px,sy,fz);mid.userData.sp=1;g.add(mid);}
    {const ir=r*o.idlK,m=sh0(new T3.Mesh(new T3.CylinderGeometry(ir,ir,R0.w*.5,24),rub));m.rotation.z=Math.PI/2;m.position.set(px,r,iz);m.userData.sp=1;g.add(m);
     const m2=sh0(new T3.Mesh(new T3.CylinderGeometry(ir*.6,ir*.6,R0.w*.66,16),detM));m2.rotation.z=Math.PI/2;m2.position.set(px,r,iz);m2.userData.sp=1;g.add(m2);}
    const nR=o.rollers||0,rr=o.rollR||.09;for(let i=0;i<nR;i++){const z=lerp(za+(zb-za)*.12,zb-(zb-za)*.12,(i+.5)/nR);if(o.rollSkip&&o.rollSkip(i))continue;const m=sh0(new T3.Mesh(new T3.CylinderGeometry(rr,rr,R0.w*.42,12),dark));m.rotation.z=Math.PI/2;m.position.set(px,2*r-rr*.55,z);m.userData.sp=1;g.add(m);}
    o.guards&&o.guards(C,sd,px,r,za,zb);});
  g.userData.beltAnim=d=>belts.forEach(b=>b.anim(d));
  return belts;}


/* ---------- v3: призмы, усечённые параллелепипеды, стержни, лофт по произвольным многоугольникам ---------- */
/* профиль [[z,y]...] (вид сбоку), выдавленный по X от x0 до x1 */
Bld.prototype.prismX=function(k,pts,x0,x1){const sh=new T3.Shape();pts.forEach((p,i)=>i?sh.lineTo(-p[0],p[1]):sh.moveTo(-p[0],p[1]));
  const g=new T3.ExtrudeGeometry(sh,{depth:Math.abs(x1-x0),bevelEnabled:false});g.applyMatrix4(new T3.Matrix4().set(0,0,1,0, 0,1,0,0, -1,0,0,0, 0,0,0,1));g.translate(Math.min(x0,x1),0,0);
  (this.m[k]=this.m[k]||[]).push(fixG(g));return this;};
/* контур [[x,z]...] (вид сверху), выдавленный по Y от y0 до y1 */
Bld.prototype.prismY=function(k,pts,y0,y1){const sh=new T3.Shape();pts.forEach((p,i)=>i?sh.lineTo(p[0],-p[1]):sh.moveTo(p[0],-p[1]));
  const g=new T3.ExtrudeGeometry(sh,{depth:Math.abs(y1-y0),bevelEnabled:false});g.applyMatrix4(new T3.Matrix4().set(1,0,0,0, 0,0,1,0, 0,-1,0,0, 0,0,0,1));g.translate(0,Math.min(y0,y1),0);
  (this.m[k]=this.m[k]||[]).push(fixG(g));return this;};
function fixG(g){g=g.index?g.toNonIndexed():g;if(!g.attributes.uv)g.setAttribute("uv",new T3.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return g;}
/* усечённый параллелепипед: основание (hw0 x hd0) на y, верх (hw1 x hd1) на y+h со сдвигом верха по z на dz */
Bld.prototype.frus=function(k,hw0,hd0,hw1,hd1,h,x,y,z,dz,ry){dz=dz||0;const a=[[-hw0,0,-hd0],[hw0,0,-hd0],[hw0,0,hd0],[-hw0,0,hd0]],b=[[-hw1,h,-hd1+dz],[hw1,h,-hd1+dz],[hw1,h,hd1+dz],[-hw1,h,hd1+dz]],P=a.concat(b).map(p=>V(p[0],p[1],p[2])),T=[];
  const q=(i,j,k2,l)=>{T.push([P[i],P[j],P[k2]],[P[i],P[k2],P[l]]);};q(3,2,1,0);q(4,5,6,7);q(0,1,5,4);q(1,2,6,5);q(2,3,7,6);q(3,0,4,7);
  const g=triGeo(T,1);g.applyMatrix4(new T3.Matrix4().compose(V(x||0,y||0,z||0),new T3.Quaternion().setFromEuler(new T3.Euler(0,ry||0,0)),V(1,1,1)));(this.m[k]=this.m[k]||[]).push(g);return this;};
/* стержень между двумя точками */
Bld.prototype.rod=function(k,a,b,r,seg){const A=V(a[0],a[1],a[2]),B=V(b[0],b[1],b[2]),d=B.clone().sub(A),L=d.length();if(L<1e-4)return this;const g=new T3.CylinderGeometry(r,r,L,seg||6);
  g.applyMatrix4(new T3.Matrix4().makeRotationFromQuaternion(new T3.Quaternion().setFromUnitVectors(V(0,1,0),d.clone().normalize())));g.translate((A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2);(this.m[k]=this.m[k]||[]).push(g);return this;};
/* лофт по слоям: layers=[{y, P:[[x,z]...]}] с одинаковым числом вершин; smooth — сглаженные нормали */
function loftPoly(layers,o){o=o||{};const n=layers[0].P.length,T=[];
  const R=layers.map(l=>l.P.map(p=>V(p[0],l.y,p[1])));
  for(let k=0;k<R.length-1;k++){const A=R[k],B=R[k+1];for(let i=0;i<n;i++){const j=(i+1)%n;T.push([A[i],B[j],A[j]],[A[i],B[i],B[j]]);}}
  const top=R[R.length-1],c=V(0,0,0);top.forEach(p=>c.add(p));c.multiplyScalar(1/n);c.y+=o.dome||0;for(let i=0;i<n;i++){const j=(i+1)%n;T.push([c,top[j],top[i]]);}
  const b=R[0],bc=V(0,b[0].y,0);b.forEach(p=>bc.add(V(p.x,0,p.z).multiplyScalar(1/n)));for(let i=0;i<n;i++){const j=(i+1)%n;T.push([bc,b[i],b[j]]);}
  let g=triGeo(T,.9);
  if(o.smooth){const Pp=g.attributes.position,Nn=g.attributes.normal,map=new Map(),key=i=>Math.round(Pp.getX(i)*400)+"_"+Math.round(Pp.getY(i)*400)+"_"+Math.round(Pp.getZ(i)*400);
    for(let i=0;i<Pp.count;i++){const k=key(i);let a=map.get(k);if(!a)map.set(k,a=V(0,0,0));a.x+=Nn.getX(i);a.y+=Nn.getY(i);a.z+=Nn.getZ(i);}
    for(let i=0;i<Pp.count;i++){const a=map.get(key(i)).clone().normalize();Nn.setXYZ(i,a.x,a.y,a.z);}}
  return g;}
/* вспомогательные: масштаб/сдвиг контура */
const scaleP=(P,sx,sz,dz)=>P.map(p=>[p[0]*sx,p[1]*(sz==null?sx:sz)+(dz||0)]);
const mirrorP=H=>H.concat(H.slice(1,-1).reverse().map(p=>[-p[0],p[1]]));

const REG={};
function has(k){return !!REG[k];}
return{loftPoly,scaleP,mirrorP,interp,profYs,triGeo,mergeG,Bld,chaikin,hullGeo,turretGeo,barrelGeo,trackBelt,starGeo,wheelParts,runGear:run,REG,has,
  sync(k,on){const R=REG[k];if(!R)return;const v=VT[k];if(!v._mvO)v._mvO=R.over(v).map(([o,key,val])=>[o,key,o[key],val]);v._mvO.forEach(([o,key,old,nw])=>{o[key]=on?nw:old;});},
  hull:(k,v)=>REG[k].hull(v),run:(k,C)=>REG[k].run(C),turret:(k,C)=>REG[k].turret(C),gun:(k,C)=>REG[k].gun(C),decor:(k,C)=>REG[k].decor(C)};
})();
