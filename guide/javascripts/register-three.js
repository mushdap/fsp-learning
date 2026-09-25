import * as THREE from './vendor/three.module.js';

// Decorative spatial metaphor. Every word is also readable in the adjacent HTML.
export async function mount(host) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  host.classList.add('has-canvas');host.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.position.set(0,1.1,9);camera.lookAt(0,0,0);
  const group=new THREE.Group();scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(2,4,6);scene.add(light);
  const colors=[0x76cab6,0xf2b978,0xa6b2fa],cards=[];
  ['PATIENT','NOTE','COLLEAGUE'].forEach((label,i)=>{
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=640;const ctx=canvas.getContext('2d');
    ctx.fillStyle=['#bce8dc','#ffe0b3','#d4dcff'][i];ctx.fillRect(0,0,512,640);ctx.fillStyle='#172435';ctx.textAlign='center';ctx.font='bold 39px sans-serif';ctx.fillText(label,256,100);
    ctx.font='bold 120px sans-serif';ctx.fillText(String(i+1),256,270);ctx.font='24px sans-serif';ctx.fillText('THE SAME STORY',256,410);
    ctx.fillStyle='#17243555';for(let j=0;j<3;j++)ctx.fillRect(90,460+j*36,332-j*40,12);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshStandardMaterial({map:texture,roughness:.8});
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.8,2.25,.1),[new THREE.MeshStandardMaterial({color:colors[i]}),new THREE.MeshStandardMaterial({color:colors[i]}),new THREE.MeshStandardMaterial({color:colors[i]}),new THREE.MeshStandardMaterial({color:colors[i]}),material,new THREE.MeshStandardMaterial({color:colors[i]})]);
    mesh.position.set((i-1)*2.25,0,0);group.add(mesh);cards.push(mesh);
  });
  let current=0,frame=0,disposed=false;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const draw=()=>{if(!disposed)renderer.render(scene,camera);};
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=w/h<1.8?12:9;camera.updateProjectionMatrix();draw();};
  const obs=new ResizeObserver(resize);obs.observe(host);resize();
  const select=n=>{
    current=n;cancelAnimationFrame(frame);const started=performance.now(),from=cards.map(m=>({z:m.position.z,y:m.rotation.y}));
    const animate=now=>{const t=reduce.matches?1:Math.min(1,(now-started)/420),ease=1-Math.pow(1-t,3);cards.forEach((m,i)=>{const z=i===current?.85:-.3,y=i===current?0:(i-current)*-.12;m.position.z=from[i].z+(z-from[i].z)*ease;m.rotation.y=from[i].y+(y-from[i].y)*ease;});draw();if(t<1&&!disposed)frame=requestAnimationFrame(animate);};
    frame=requestAnimationFrame(animate);
  };
  return {select,dispose(){disposed=true;cancelAnimationFrame(frame);obs.disconnect();scene.traverse(obj=>{obj.geometry?.dispose();if(obj.material){for(const m of (Array.isArray(obj.material)?obj.material:[obj.material])){m.map?.dispose();m.dispose();}}});renderer.dispose();renderer.domElement.remove();host.classList.remove('has-canvas');}};
}
