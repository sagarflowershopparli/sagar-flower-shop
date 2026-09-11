import {products,photoURL,orderURL,stops} from './catalog.js';
const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let loadGeneration=0;
let world=null,THREE=null,loading=false,frame=0,last=0,progress=0,destination=0,selected=null,hovered=null,focusPoint=null,catalogOpen=false,failed=false,low=false,qualityManual=false,slowFrames=0,activeStop=-1,abortLoad=false,hoverTimer=0;
let look,ray,pointer,goalPosition,goalLook;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function panel(p){$('product-category').textContent=p.category;$('product-name').textContent=p.name;$('order').href=orderURL(p);$('product-panel').hidden=false;}
function clearSelection(){selected=null;hovered=null;focusPoint=null;$('product-panel').hidden=true;wake();}
function details(p){$('detail-title').textContent=p.name;$('detail-description').textContent=p.description;$('detail-photo').src=photoURL(p);$('detail-photo').alt=p.name+' — Sagar Flower Shop portfolio photograph';$('detail-order').href=orderURL(p);$('details-dialog').showModal();}
$('close-details').onclick=()=>$('details-dialog').close();
$('details-dialog').addEventListener('click',e=>{if(e.target===$('details-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('details').onclick=()=>{const item=selected||hovered;if(item)details(item.product);};
$('close-product').onclick=clearSelection;
$('product-panel').addEventListener('pointerenter',()=>clearTimeout(hoverTimer));
$('product-panel').addEventListener('pointerleave',()=>{if(!selected)hoverTimer=setTimeout(()=>{hovered=null;$('product-panel').hidden=true;wake();},700);});
for(const p of products){const article=document.createElement('article');const img=document.createElement('img');img.src=photoURL(p);img.alt=p.name;img.loading='lazy';img.width=400;img.height=500;const h=document.createElement('h2');h.textContent=p.name;const category=document.createElement('p');category.textContent=p.category;const b=document.createElement('button');b.textContent='View Details';b.onclick=()=>details(p);const a=document.createElement('a');a.textContent='Order on WhatsApp ↗';a.href=orderURL(p);a.target='_blank';a.rel='noopener noreferrer';const find=document.createElement('button');find.textContent='Find in boutique';find.className='find-in-shop';find.hidden=true;find.onclick=()=>{catalogOpen=false;$('catalog').hidden=true;$('tour').hidden=false;setStop(p.stop);select(world.items.find(i=>i.product.id===p.id));};article.append(img,h,category,b,a,find);$('catalog-items').append(article);}
function showCatalog(message){document.querySelectorAll('.find-in-shop').forEach(b=>b.hidden=!world);catalogOpen=true;$('catalog').hidden=false;$('welcome').hidden=true;$('tour').hidden=true;$('product-panel').hidden=true;$('return-tour').textContent=world?'Return to the boutique →':'Try the 3D experience →';if(message)$('fallback-message').textContent=message;cancelAnimationFrame(frame);frame=0;$('return-tour').focus();}
$('browse').onclick=()=>showCatalog();
$('return-tour').onclick=()=>{catalogOpen=false;$('catalog').hidden=true;if(world){$('tour').hidden=false;wake();}else{$('welcome').hidden=false;$('enter').focus();}};
function fallback(message,error){failed=true;loading=false;abortLoad=true;if(world){world.dispose();world=null;}cancelAnimationFrame(frame);frame=0;$('loading').hidden=true;$('enter').disabled=false;$('enter').textContent='Try 3D again →';showCatalog(message);if(error)console.warn('Sagar boutique fallback:',error.message||error);}
$('enter').onclick=async()=>{
 if(loading)return;
 // Data-saving devices receive the complete photo catalog before any WebGL download.
 if(!failed&&(navigator.connection?.saveData||navigator.deviceMemory&&navigator.deviceMemory<2)){failed=true;showCatalog('Lightweight viewing is enabled for this device. Browse the collection below, or choose Try the 3D experience.');return;}
 const generation=++loadGeneration;loading=true;abortLoad=false;$('enter').disabled=true;$('loading').hidden=false;$('load-progress').value=3;$('load-message').textContent='Opening the boutique…';
 const timeout=setTimeout(()=>fallback('The 3D shop is taking too long to load. You can explore and order from the photographs below.'),30000);
 try{
  THREE=await import('three');const {createBoutique}=await import('./scene.js');
  low=matchMedia('(pointer:coarse)').matches||(navigator.deviceMemory||8)<=4;
  const loaded=await createBoutique($('viewport'),low,value=>{$('load-progress').value=value;});
  if(abortLoad||generation!==loadGeneration){loaded.dispose();return;}world=loaded;
  clearTimeout(timeout);look=new THREE.Vector3(...stops[0].look);goalPosition=new THREE.Vector3();goalLook=new THREE.Vector3();ray=new THREE.Raycaster();pointer=new THREE.Vector2();
  world.camera.position.set(...stops[0].position);world.camera.lookAt(look);world.renderer.render(world.scene,world.camera);
  world.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('Your device paused the 3D view. Your flower collection and WhatsApp ordering are still available.');});
  $('load-progress').value=100;$('welcome').hidden=true;$('tour').hidden=false;loading=false;failed=false;
  setupInput();resize();setStop(0);$('next').focus();wake();if(!reduced)setTimeout(()=>{if(world&&!catalogOpen&&destination===0&&!selected)setStop(1);},1100);
 }catch(error){clearTimeout(timeout);if(generation!==loadGeneration)return;fallback('The interactive view is unavailable on this browser. Explore the real collection and order below.',error);}
};
stops.forEach((s,i)=>{const b=document.createElement('button');b.textContent=s.label;b.title='Visit '+s.label;b.onclick=()=>setStop(i);$('stops').append(b);});
function setStop(i){destination=clamp(i,0,stops.length-1);clearSelection();wake();}
$('previous').onclick=()=>setStop(Math.round(destination)-1);
$('next').onclick=()=>setStop(Math.round(destination)+1);
$('quality').onclick=()=>{qualityManual=true;low=!low;world?.setLow(low);$('quality').textContent='Quality: '+(low?'Light':'High');$('quality').setAttribute('aria-pressed',String(low));wake();};
function select(item){selected=item;hovered=null;panel(item.product);focusPoint=item.target.clone();wake();}
function pick(e){const r=world.renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,world.camera);const hits=ray.intersectObjects(world.items.map(i=>i.hit),false);return hits.length?world.items.find(i=>i.hit===hits[0].object):null;}
function setupInput(){const canvas=world.renderer.domElement;let down=null,dragging=false;
 canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,lastY:e.clientY};dragging=false;canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(down){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>8)dragging=true;if(dragging){const delta=(down.lastY-e.clientY)/260;destination=clamp(destination+delta,0,4);if(selected||hovered)clearSelection();wake();}down.lastY=e.clientY;return;}if(e.pointerType!=='mouse'||selected)return;const item=pick(e);clearTimeout(hoverTimer);if(item){hovered=item;panel(item.product);canvas.style.cursor='pointer';wake();}else{canvas.style.cursor='default';hoverTimer=setTimeout(()=>{if(!selected){hovered=null;$('product-panel').hidden=true;wake();}},650);}});
 canvas.addEventListener('pointerup',e=>{if(down&&!dragging){const item=pick(e);if(item)select(item);else clearSelection();}down=null;});
 canvas.addEventListener('pointercancel',()=>{down=null;dragging=false;});
 canvas.addEventListener('pointerleave',()=>{if(!selected)hoverTimer=setTimeout(()=>{hovered=null;$('product-panel').hidden=true;wake();},700);});
 canvas.addEventListener('wheel',e=>{e.preventDefault();const scale=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;destination=clamp(destination+clamp(e.deltaY*scale,-150,150)/1100,0,4);if(selected||hovered)clearSelection();wake();},{passive:false});
}
window.addEventListener('keydown',e=>{if(!world||catalogOpen||$('details-dialog').open)return;if(e.key==='Escape')clearSelection();if(e.target.closest('button,a,input'))return;if(['ArrowDown','ArrowRight','PageDown','ArrowUp','ArrowLeft','PageUp','Home','End'].includes(e.key)){e.preventDefault();setStop(e.key==='Home'?0:e.key==='End'?4:Math.round(destination)+(['ArrowDown','ArrowRight','PageDown'].includes(e.key)?1:-1));}});
function resize(){if(!world)return;world.camera.aspect=$('viewport').clientWidth/$('viewport').clientHeight;world.camera.fov=world.camera.aspect<.7?82:52;world.camera.updateProjectionMatrix();world.renderer.setSize($('viewport').clientWidth,$('viewport').clientHeight);wake();}
window.addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
window.addEventListener('pagehide',e=>{cancelAnimationFrame(frame);frame=0;if(!e.persisted)world?.dispose();});window.addEventListener('pageshow',()=>wake());
function wake(){if(world&&!frame&&!document.hidden&&!catalogOpen){last=performance.now();frame=requestAnimationFrame(tick);}}
function tick(now){frame=0;if(!world||catalogOpen||document.hidden)return;const dt=Math.min((now-last)/1000,.25);last=now;const blend=reduced?1:1-Math.exp(-dt*4.8);progress+=(destination-progress)*blend;
 const idx=Math.floor(progress),t=progress-idx,a=stops[idx],b=stops[Math.min(idx+1,4)],ease=t*t*(3-2*t);
 const mobile=world.camera.aspect<.7;const positionFor=s=>mobile&&s===stops[1]?[.1,2.25,4.9]:mobile&&s===stops[4]?[.05,2.8,3.1]:s.position;
 goalPosition.set(...positionFor(a)).lerp(new THREE.Vector3(...positionFor(b)),ease);goalLook.set(...a.look).lerp(new THREE.Vector3(...b.look),ease);
 if(focusPoint){goalLook.copy(focusPoint);const v=goalPosition.clone().sub(focusPoint).normalize();goalPosition.copy(focusPoint).addScaledVector(v,selected.product.type==='arch'?3.7:2.05);goalPosition.y=Math.max(goalPosition.y,focusPoint.y+.22);}
 world.camera.position.lerp(goalPosition,blend);look.lerp(goalLook,blend);world.camera.lookAt(look);
 const opening=clamp(progress*3,0,1);world.doors[0].rotation.y=-opening*1.25;world.doors[1].rotation.y=opening*1.25;
 let moving=Math.abs(destination-progress)>.0001||world.camera.position.distanceTo(goalPosition)>.002||look.distanceTo(goalLook)>.002;
 for(const item of world.items){const lifted=item===selected||item===hovered;const target=item.baseY+(lifted?.035:0);item.group.position.y+=(target-item.group.position.y)*blend;if(Math.abs(item.group.position.y-target)>.001)moving=true;}
 const current=Math.round(progress);if(activeStop!==current){activeStop=current;$('chapter-number').textContent=String(current+1).padStart(2,'0')+' / THE BOUTIQUE';$('chapter-title').textContent=stops[current].title;$('chapter-copy').textContent=stops[current].copy;[...$('stops').children].forEach((b,i)=>b.setAttribute('aria-current',String(i===current)));$('previous').disabled=current===0;$('next').disabled=current===4;}
 world.renderer.render(world.scene,world.camera);
 if(dt>.043&&moving&&!low&&!qualityManual){if(++slowFrames>65){low=true;world.setLow(true);$('quality').textContent='Quality: Light (auto)';$('quality').setAttribute('aria-pressed','true');}}else slowFrames=Math.max(0,slowFrames-1);
 // Read-only diagnostics make field performance and automated rendering checks inspectable.
 window.sagarShopDiagnostics={drawCalls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles,quality:low?'light':'high',stop:activeStop,progress,selected:selected?.product.id||null};
 if(moving)frame=requestAnimationFrame(tick);
}
