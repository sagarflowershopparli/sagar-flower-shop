import * as T from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {products} from './catalog.js';

export async function createBoutique(container,low,onProgress){
 const renderer=new T.WebGLRenderer({antialias:!low,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.6));renderer.setSize(container.clientWidth,container.clientHeight);
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 container.appendChild(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color(0xe9e5d8);scene.fog=new T.Fog(0xe9e5d8,17,35);
 const camera=new T.PerspectiveCamera(52,container.clientWidth/container.clientHeight,.08,50);
 const manager=new T.LoadingManager();manager.onProgress=(url,n,total)=>onProgress(15+n/total*65);
 const loader=new GLTFLoader(manager),tl=new T.TextureLoader(manager);
 let kit,oak,stone,shadow;
 try{[kit,oak,stone,shadow]=await Promise.all([loader.loadAsync('./assets/botanical-kit.glb'),tl.loadAsync('./assets/oak.webp'),tl.loadAsync('./assets/limestone.webp'),tl.loadAsync('./assets/contact-shadow.webp')]);}catch(error){renderer.dispose();renderer.domElement.remove();throw error;}
 const geo={};kit.scene.traverse(o=>{if(o.isMesh)geo[o.name]=o.geometry;});
 [oak,stone].forEach(t=>{t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,3);t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());});
 const mat={
 plaster:new T.MeshStandardMaterial({color:0xe4decf,roughness:.93}),olive:new T.MeshStandardMaterial({color:0x52614a,roughness:.88}),
 wood:new T.MeshStandardMaterial({map:oak,roughness:.65}),stone:new T.MeshStandardMaterial({map:stone,roughness:.69}),
 brass:new T.MeshStandardMaterial({color:0xad8953,metalness:.7,roughness:.3}),dark:new T.MeshStandardMaterial({color:0x29372d,roughness:.7}),
 cream:new T.MeshStandardMaterial({color:0xede7d4,roughness:.6}),metal:new T.MeshStandardMaterial({color:0x8c9991,metalness:.65,roughness:.4}),
 glass:new T.MeshStandardMaterial({color:0xc5ddd6,metalness:.2,roughness:.14,transparent:true,opacity:.17,depthWrite:false}),
 glow:new T.MeshBasicMaterial({color:0xffedc1}),leaf:new T.MeshStandardMaterial({color:0x49643a,roughness:.8,side:T.DoubleSide}),
 petal:new T.MeshStandardMaterial({color:0xffffff,roughness:.72,side:T.DoubleSide}),wrap:new T.MeshStandardMaterial({color:0xd0ac8b,roughness:.9,side:T.DoubleSide})};
 scene.add(new T.HemisphereLight(0xfff7e3,0x777664,1.35));
 const sun=new T.DirectionalLight(0xffecd0,2.4);sun.position.set(-3,4.8,9);sun.castShadow=true;sun.shadow.mapSize.set(low?1024:2048,low?1024:2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:8,bottom:-7,near:.5,far:24});sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;scene.add(sun);
 const fill=new T.DirectionalLight(0xe4ede8,.55);fill.position.set(4,3,-3);scene.add(fill);
 // An inexpensive environment gives the brass and glass soft window reflections.
 const envScene=new T.Scene();envScene.background=new T.Color(0xd3d1bb);
 const ep=new T.Mesh(new T.PlaneGeometry(9,7),new T.MeshBasicMaterial({color:0xffffff}));ep.position.set(0,4,7);ep.rotation.y=Math.PI;envScene.add(ep);
 const pmrem=new T.PMREMGenerator(renderer);const env=pmrem.fromScene(envScene,.04,.1,30);scene.environment=env.texture;scene.environmentIntensity=.35;pmrem.dispose();ep.geometry.dispose();ep.material.dispose();
 const staticGroups=new Map();
 function mesh(g,m,pos=[0,0,0],scale=[1,1,1],parent=scene,rot=[0,0,0]){const o=new T.Mesh(g,m);o.position.set(...pos);o.scale.set(...scale);o.rotation.set(...rot);parent.add(o);return o;}
 const cube=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,24),plane=new T.PlaneGeometry(1,1);
 function box(pos,size,m=mat.wood,parent=scene){return mesh(cube,m,pos,size,parent);}
 function cyl(pos,top,bottom,height,m=mat.brass,parent=scene){return mesh(new T.CylinderGeometry(top,bottom,height,24),m,pos,[1,1,1],parent);}
 function contact(x,z,sx,sz,y=.015,parent=scene){return mesh(plane,new T.MeshBasicMaterial({map:shadow,transparent:true,depthWrite:false,opacity:.65}),[x,y,z],[sx,sz,1],parent,[-Math.PI/2,0,0]);}
 function sign(text,pos,width,height,color='#314332',bg=null,rotation=0){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);}ctx.fillStyle=color;ctx.font='52px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128,960);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const o=mesh(plane,new T.MeshBasicMaterial({map:texture,transparent:!bg,side:T.DoubleSide}),pos,[width,height,1]);o.rotation.y=rotation;return o;}
 // A compact working shop, with an open central aisle and a recessed frontage.
 box([0,-.12,.25],[8.4,.24,10.6],mat.stone);box([0,-.16,7],[11,.18,3.4],mat.stone);
 box([-4.1,1.95,.1],[.2,3.9,10.1],mat.plaster);box([4.1,1.95,.1],[.2,3.9,10.1],mat.plaster);box([0,1.95,-4.95],[8.4,3.9,.18],mat.plaster);
 box([0,3.92,.1],[8.4,.12,10],mat.cream);
 box([0,.22,-4.8],[8,.43,.13],mat.olive);
 for(const x of [-4,4])box([x,.22,.1],[.12,.43,10],mat.olive);
 for(let z=-4.5;z<5.2;z+=1)box([0,.006,z],[8,.006,.012],mat.cream);
 for(let x=-4;x<4.1;x+=1)box([x,.008,.1],[.012,.008,10],mat.cream);
 // Walnut and olive storefront, clear double doors with brass pulls.
 box([0,3.5,5.08],[8.4,.8,.25],mat.olive);sign('S A G A R',[0,3.53,5.23],3.25,.65,'#eee7cf');
 for(const x of [-4,-1.35,1.35,4])box([x,1.6,5.06],[.065,3.2,.11],mat.brass);
 for(const x of [-2.67,2.67]){box([x,1.65,5.06],[2.58,2.9,.018],mat.glass);box([x,.12,5.05],[2.65,.24,.17],mat.olive);}
 const doors=[];for(const side of [-1,1]){const door=new T.Group();door.position.set(side*1.32,0,5.06);scene.add(door);const dx=-side*.65;box([dx,1.59,0],[1.29,3.16,.025],mat.glass,door);for(const ex of [0,-side*1.3])box([ex,1.59,0],[.035,3.18,.05],mat.brass,door);for(const y of [.04,3.17])box([dx,y,0],[1.3,.035,.05],mat.brass,door);box([-side*1.13,1.3,.07],[.028,.45,.04],mat.brass,door);doors.push(door);}
 sign('F L O W E R S   &   C E L E B R A T I O N S',[0,2.95,4.98],2.25,.22,'#4a5c45');
 // Tables, contact shadows and cylindrical fluted bases.
 function table(x,z,w,d,h){box([x,h,z],[w,.12,d],mat.stone);box([x,h-.10,z],[w-.07,.08,d-.07],mat.brass);for(const dx of [-w*.31,w*.31]){cyl([x+dx,(h-.12)/2,z],.19,.23,h-.12,mat.wood);for(let a=0;a<12;a++){const t=a/12*Math.PI*2;box([x+dx+Math.cos(t)*.2,(h-.12)/2,z+Math.sin(t)*.2],[.025,h-.14,.025],mat.wood);}}contact(x,z,w+1,d+1);}
 table(-.15,1.9,2.8,1.3,.95);table(1.65,-2.8,2.45,1.15,.91);
 // Garland display wall with individual hooks and a plinth.
 box([-3.94,1.9,-.6],[.08,2.9,4],mat.olive);box([-3.64,.35,-.65],[.65,.7,4],mat.wood);
 sign('WEDDING GARLANDS',[-3.86,3.23,-.65],2.9,.32,'#f3e9ce',null,Math.PI/2);
 for(const z of [.15,-1.45])box([-3.65,2.96,z],[.5,.025,.025],mat.brass);
 // Shelves: a premium arrangement, paper supplies and ceramics.
 for(const y of [.65,1.57,2.53]){box([3.55,y,-.95],[.8,.09,2.9],mat.wood);box([3.14,y+.05,-.95],[.025,.025,2.9],mat.brass);}
 for(const z of [-2.3,.4])box([3.8,1.8,z],[.025,2.9,.025],mat.brass);
 sign('THE FLOWER BAR',[3.91,3.05,1.1],2.8,.36,'#40533b',null,-Math.PI/2);
 for(let i=0;i<5;i++)cyl([3.55,2.77,-1.95+i*.46],.1,.13,.38,i%2?mat.cream:mat.olive);
 // A florist's counter with wrapping rolls, scissors, ribbons and a handwritten order pad.
 box([1.2,.52,-4.05],[3.2,1.04,.95],mat.wood);box([1.2,1.08,-4.05],[3.35,.12,1.1],mat.stone);
 for(let i=0;i<23;i++)box([-.3+i*.135,.5,-3.565],[.028,.89,.03],mat.brass);
 box([1.95,1.16,-4.02],[.45,.025,.32],mat.cream);box([2,1.185,-4.02],[.32,.009,.012],mat.dark);
 for(let i=0;i<3;i++)cyl([.25+i*.17,1.3,-4.16],.065,.065,.4,mat.wrap);
 for(let i=0;i<2;i++)cyl([.9+i*.21,1.19,-3.91],.075,.075,.14,mat.olive);
 // Real portfolio references sit in slim brass frames beside the event samples.
 for(const [name,z] of [['decor-42',-3.2],['decor-19',-4.25]]){
  box([3.965,2.32,z],[.045,1.0,.82],mat.brass);
  const photo=await tl.loadAsync('../assets/images/decor/'+name+'-small.webp').catch(()=>null);if(!photo)continue;photo.colorSpace=T.SRGBColorSpace;
  mesh(plane,new T.MeshBasicMaterial({map:photo,transparent:true}),[3.93,2.32,z],[.75,.93,1],scene,[0,-Math.PI/2,0]);
 }
 sign('Made for your moments.',[.8,2.52,-4.83],3.8,.58);sign('SAGAR  ·  PARLI',[.8,2.12,-4.83],2,.25);
 // Pendant lamps and warm ceiling strips; no expensive point-light shadows.
 for(const [x,z] of [[-.7,1.8],[1.3,-2.6],[-2.7,-1]]){cyl([x,3.63,z],.012,.012,.55,mat.dark);cyl([x,3.3,z],.1,.32,.27,mat.brass);cyl([x,3.16,z],.28,.28,.02,mat.glow);}
 for(const x of [-3.8,3.8])box([x,3.82,.1],[.04,.025,8.5],mat.glow);
 // Original GLB blooms are instanced per product, sharing materials and geometry.
 let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const items=[];const dummy=new T.Object3D();const color=new T.Color();
 function batch(group,geometry,material,entries,colors){const b=new T.InstancedMesh(geometry,material,entries.length);entries.forEach((e,i)=>{dummy.position.set(...e.p);dummy.rotation.set(...(e.r||[0,0,0]));dummy.scale.setScalar(e.s||1);if(e.scale)dummy.scale.set(...e.scale);dummy.updateMatrix();b.setMatrixAt(i,dummy.matrix);if(colors)b.setColorAt(i,color.setHex(colors[i%colors.length]).multiplyScalar(.88+rand()*.2));});b.instanceMatrix.needsUpdate=true;group.add(b);return b;}
 function blossoms(group,entries,colors,small=false){const lod=new T.LOD();const near=new T.Group(),far=new T.Group();batch(near,geo[low||small?'rose_low':'rose'],mat.petal,entries,colors);batch(far,geo.rose_low,mat.petal,entries,colors);lod.userData.small=small;lod.addLevel(near,0);lod.addLevel(far,5);group.add(lod);}
 const stemGeo=new T.CylinderGeometry(.007,.009,1,5);
 products.forEach(p=>{const group=new T.Group();group.position.set(...p.position);scene.add(group);group.userData.product=p;const flowers=[],leaves=[],stems=[];let bounds;
  if(['bouquet','vase','bucket'].includes(p.type)){
   const isBucket=p.type==='bucket',isVase=p.type==='vase';const h=isBucket?.48:isVase?.4:.35;
   if(isBucket)cyl([0,h/2,0],.25,.18,h,mat.metal,group);
   else if(isVase)cyl([0,h/2,0],.17,.23,h,mat.cream,group);
   else {cyl([0,.19,0],.3,.1,.4,mat.wrap,group);cyl([0,.17,0],.122,.12,.045,mat.olive,group);}
   const n=isBucket?26:40;
   for(let i=0;i<n;i++){const a=i*2.3999,r=Math.sqrt(i/n)*.33;const x=Math.cos(a)*r,z=Math.sin(a)*r,y=h+(isBucket?.24:.015)+Math.sqrt(1-i/n)*.24+rand()*.08;
    flowers.push({p:[x,y,z],s:.125+rand()*.025,r:[Math.cos(a)*.55,rand()*6,Math.sin(a)*.55]});
    const stemStart=new T.Vector3(x*.12,.10,z*.12),stemEnd=new T.Vector3(x,y,z),stemDirection=stemEnd.clone().sub(stemStart);
    const stemRotation=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),stemDirection.clone().normalize()));
    stems.push({p:stemStart.add(stemEnd).multiplyScalar(.5).toArray(),scale:[1,stemDirection.length(),1],r:[stemRotation.x,stemRotation.y,stemRotation.z]});
    leaves.push({p:[x*.5,h*1.05,z*.5],s:.24,r:[.7+a*.03,a,1.0]});
   }
   bounds=[1,1.18,1];contact(0,0,1.1,1.1,.012,group);
  }else if(p.type==='garland'){
   group.rotation.y=Math.PI/2;
   for(let i=0;i<76;i++){const t=i/75;const a=t*Math.PI;let x,y;if(t<.36){x=-.29;y=1.85-t/.36*1.45;}else if(t>.64){x=.29;y=.4+(t-.64)/.36*1.45;}else{x=-Math.cos((t-.36)/.28*Math.PI)*.29;y=.4-Math.sin((t-.36)/.28*Math.PI)*.25;}
    flowers.push({p:[x,y,.04],s:.085,r:[Math.PI/2,rand()*6,rand()*.3]});flowers.push({p:[x+(rand()-.5)*.07,y,.12],s:.07,r:[Math.PI/2,rand()*6,0]});}
   // Colour runs recall the alternating floral bands of a traditional varmala.
   const bands=flowers.map((_,i)=>p.colors[Math.floor(i/14)%p.colors.length]);p._bands=bands;bounds=[.9,2.0,.45];
  }else if(p.type==='arch'){
   for(const x of [-.82,.82])cyl([x,1.0,0],.028,.028,2,mat.brass,group);
   const arch=new T.Mesh(new T.TorusGeometry(.82,.025,6,32,Math.PI),mat.brass);arch.position.y=2;group.add(arch);
   box([0,.04,0],[2.05,.08,1.2],mat.stone,group);
   for(let i=0;i<80;i++){const a=i/79*Math.PI;flowers.push({p:[Math.cos(a)*.82,2+Math.sin(a)*.82,(rand()-.5)*.18],s:.1,r:[Math.PI/2,rand()*6,0]});}
   for(let j=0;j<7;j++)for(let i=0;i<12;i++)flowers.push({p:[-.7+j*.23,1.98-i*.07,-.025],s:.055,r:[Math.PI/2,rand()*6,0]});
   box([0,.27,0],[.9,.38,.45],mat.cream,group);box([0,.5,-.15],[.9,.25,.15],mat.cream,group);bounds=[2.1,3.1,1.1];
  }else if(p.type==='car'){
   // A recognisable tabletop vehicle sample with curved body, glazing and floral bonnet.
   const body=new T.Shape();body.moveTo(-.85,.16);body.quadraticCurveTo(-1.05,.2,-.97,.37);body.lineTo(-.57,.44);body.lineTo(-.34,.7);body.quadraticCurveTo(.1,.81,.39,.66);body.lineTo(.59,.44);body.lineTo(.92,.37);body.quadraticCurveTo(1.0,.27,.91,.17);body.closePath();
   const carGeo=new T.ExtrudeGeometry(body,{depth:.65,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.06,bevelThickness:.04});mesh(carGeo,mat.cream,[0,0,-.325],[1,1,1],group);
   box([0,.56,.374],[.57,.19,.015],mat.dark,group);box([0,.56,-.374],[.57,.19,.015],mat.dark,group);box([0,.58,.39],[.027,.24,.023],mat.cream,group);
   for(const x of [-.63,.63])for(const z of [-.36,.36]){const wheel=mesh(new T.CylinderGeometry(.18,.18,.10,20),mat.dark,[x,.18,z],[1,1,1],group,[Math.PI/2,0,0]);mesh(new T.CylinderGeometry(.09,.09,.106,16),mat.brass,[x,.18,z],[1,1,1],group,[Math.PI/2,0,0]);}
   for(let i=0;i<23;i++){const a=i*2.4,r=Math.sqrt(i/23)*.23;flowers.push({p:[.68+Math.cos(a)*r,.45+rand()*.025,Math.sin(a)*r],s:.067,r:[0,rand()*6,0]});}
   for(const z of [-.18,.18])box([.52,.457,z],[.75,.008,.025],mat.olive,group);bounds=[2.2,.9,1.0];
  }
  blossoms(group,flowers,p._bands||p.colors,['garland','arch','car'].includes(p.type));delete p._bands;
  if(leaves.length)batch(group,geo.leaf,mat.leaf,leaves);if(stems.length)batch(group,stemGeo,mat.leaf,stems);
  const hit=mesh(cube,new T.MeshBasicMaterial({visible:false}),[0,bounds[1]/2,0],bounds,group);hit.userData.product=p;
  const target=new T.Vector3();group.localToWorld(target.set(0,bounds[1]*.52,0));
  items.push({product:p,group,hit,target,baseY:p.position[1]});
 });
 // Consolidate static furniture into one draw call per material. Products/doors remain independent.
 scene.children.slice().forEach(o=>{if(o.isMesh&&!o.material.transparent){o.updateMatrix();const g=o.geometry.clone().applyMatrix4(o.matrix);g.deleteAttribute('uv');const list=staticGroups.get(o.material)||[];list.push(g);staticGroups.set(o.material,list);scene.remove(o);}});
 // Retain UVs for the two textured furniture materials.
 // Reconstruct planar UVs after merging, avoiding hundreds of separate furniture draws.
 staticGroups.forEach((gs,m)=>{const merged=mergeGeometries(gs,false);if(m.map){const p=merged.attributes.position;const uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)*.3+p.getZ(i)*.3,p.getY(i)*.3+p.getZ(i)*.15);merged.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}scene.add(new T.Mesh(merged,m));gs.forEach(g=>g.dispose());});
 scene.traverse(o=>{if(o.isMesh&&!o.material.transparent&&o.material.visible!==false){o.castShadow=true;o.receiveShadow=true;}});renderer.shadowMap.needsUpdate=true;onProgress(95);
 return {renderer,scene,camera,items,doors,setLow(value){renderer.setPixelRatio(Math.min(devicePixelRatio,value?1:1.6));items.forEach(({group})=>group.traverse(o=>{if(o.isLOD){o.levels[0].object.children[0].geometry=geo[value||o.userData.small?'rose_low':'rose'];}}));},dispose(){const geometries=new Set(),materials=new Set(),textures=new Set([oak,stone,shadow]);scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});materials.forEach(m=>{if(m.map)textures.add(m.map);m.dispose();});geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());env.dispose();renderer.dispose();renderer.domElement.remove();}};
}
