import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { filmChapters, filmDuration } from '../../src/data/process-film.js';

// Offline production scene. Only the encoded video ships to the site.
const W = 1280, H = 720;
const output = document.createElement('canvas'); output.width = W; output.height = H;
document.body.append(output);
const ctx = output.getContext('2d');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(1200, 900); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(33, 800 / 600, .1, 50);
camera.position.set(7, 5.5, 9); camera.lookAt(0, .35, 0);
scene.add(new THREE.HemisphereLight(0xecfff4, 0x1c3023, 3));
const key = new THREE.DirectionalLight(0xffffff, 5); key.position.set(-3, 8, 5); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = key.shadow.camera.bottom = -6; key.shadow.camera.right = key.shadow.camera.top = 6; scene.add(key);
const rim = new THREE.DirectionalLight(0xd2f78a, 4); rim.position.set(5, 3, -4); scene.add(rim);
const fill = new THREE.DirectionalLight(0x8ad7ff, 2); fill.position.set(-4, 1, -4); scene.add(fill);
const ivory = new THREE.MeshStandardMaterial({ color: '#dce6da', metalness: .35, roughness: .28 });
const dark = new THREE.MeshStandardMaterial({ color: '#20362e', metalness: .48, roughness: .3 });
const lime = new THREE.MeshStandardMaterial({ color: '#d2f78a', emissive: '#a9d66a', emissiveIntensity: .3, metalness: .2, roughness: .3 });
const aqua = new THREE.MeshStandardMaterial({ color: '#81e1d4', metalness: .25, roughness: .3 });
const lavender = new THREE.MeshStandardMaterial({ color: '#c1acff', metalness: .25, roughness: .3 });
function box(parent, size, position, material = ivory, radius = .08) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 3, radius), material);
  mesh.position.set(...position); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function ball(parent, size, position, material = lime) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 16), material); mesh.position.set(...position); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function link(parent, start, end, color = '#92b499') {
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...start), new THREE.Vector3(...end)]), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .5 })); parent.add(line); return line;
}
function orbit(parent, radius, y, color = '#86b8a0') {
  const points = Array.from({ length: 97 }, (_, i) => new THREE.Vector3(Math.cos(i / 96 * Math.PI * 2) * radius, y, Math.sin(i / 96 * Math.PI * 2) * radius));
  const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .35 })); parent.add(ring); return ring;
}
const stage = new THREE.Mesh(new THREE.CylinderGeometry(3.35, 3.5, .16, 96), dark); stage.position.y = -1.55; stage.receiveShadow = true; scene.add(stage);
orbit(scene, 3.1, -1.455, '#d2f78a'); orbit(scene, 2.92, -1.45, '#506653');
const groups = Array.from({ length: 4 }, () => { const g = new THREE.Group(); scene.add(g); return g; });

// 01: a shared purpose connects the real people and handoffs.
const discovery = groups[0];
const center = new THREE.Mesh(new THREE.IcosahedronGeometry(.7, 1), lime); discovery.add(center);
const discoveryNodes = [], discoveryLinks = [], packets = [];
for (let i = 0; i < 6; i++) {
  const a = i * Math.PI / 3, target = [Math.cos(a) * 2.35, (i % 2) * .7 - .3, Math.sin(a) * 2.35];
  const node = box(discovery, [.7, .7, .7], target, i % 2 ? ivory : aqua, .14);
  discoveryNodes.push({ node, target }); discoveryLinks.push(link(discovery, [0,0,0], target)); packets.push(ball(discovery, .07, [0,0,0]));
}
orbit(discovery, 2.35, -.7);

// 02: data, interfaces, and integrations stack into one architecture.
const plates = [];
for (let i = 0; i < 3; i++) {
  const plate = new THREE.Group(); groups[1].add(plate); plates.push(plate);
  box(plate, [3.6,.22,2.5], [0,0,0], [dark,aqua,ivory][i]);
  for (let j = 0; j < 4; j++) {
    box(plate, [.58,.035,.07], [-1.15 + j * .77,.14,.6], i === 0 ? lime : dark, .015);
    box(plate, [.035,.04,1], [-1.15 + j * .77,.14,0], i === 0 ? lime : dark, .012);
    ball(plate,.07,[-1.15 + j * .77,.18,-.5],lime);
  }
}
const spines=[];
for (const x of [-1.5,1.5]) for (const z of [-.95,.95]) spines.push({line:link(groups[1], [x,-1,z], [x,1,z], '#d2f78a'),x,z});

// 03: a recognisable product, built in small, tested pieces.
function product(parent) {
  const g = new THREE.Group(); parent.add(g);
  box(g,[3.7,2.65,.22],[0,.15,0],ivory,.15);
  box(g,[3.4,2.3,.05],[0,.15,.14],dark,.06);
  box(g,[.65,1.9,.07],[-1.22,.13,.2],aqua,.04);
  for(let i=0;i<4;i++) box(g,[.39,.045,.04],[-1.22,.72-i*.3,.25],dark,.01);
  box(g,[2.1,.14,.07],[.4,1,.2],lime,.03);
  const tiles=[];
  for(let i=0;i<6;i++) {
    const target=[-.28+(i%3)*.71,.5-Math.floor(i/3)*.75,.24];
    const tile=box(g,[.56,.56,.1],target,i>2?aqua:ivory,.06);tiles.push({tile,target});
  }
  return {g,tiles};
}
const build = product(groups[2]);
const checks = Array.from({length:3},(_,i)=>ball(groups[2],.12,[i*.4-.4,-1.05,.3],lime));
const evolve = product(groups[3]); evolve.g.scale.setScalar(.72);
const satellites=[];
for(let i=0;i<3;i++) { const g=new THREE.Group(); groups[3].add(g); box(g,[.62,.62,.62],[0,0,0],[lime,aqua,lavender][i],.13); satellites.push(g); }
orbit(groups[3],2.45,0); orbit(groups[3],2.7,-.2);
const feedback = Array.from({length:12},()=>ball(groups[3],.04,[0,0,0],lime));
const smooth = value => { const p=Math.max(0,Math.min(1,value)); return p*p*(3-2*p); };
function text(value,x,y,size,color='#f0f2e9',family='Manrope',weight=400) { ctx.fillStyle=color; ctx.font=`${weight} ${size}px ${family}`; ctx.fillText(value,x,y); }
function wrap(value,x,y,maxWidth,lineHeight) {
  let line=''; for(const word of value.split(' ')){ const next=line?line+' '+word:word; if(ctx.measureText(next).width>maxWidth && line){ctx.fillText(line,x,y);y+=lineHeight;line=word;}else line=next;} ctx.fillText(line,x,y);
}
window.renderFilmFrame = (time, loop = false) => {
  const chapter=Math.min(3,Math.floor(time/8)), local=time-chapter*8, p=local/8, copy=filmChapters[chapter];
  groups.forEach((g,i)=>{g.visible=i===chapter;g.scale.setScalar(.88+.12*smooth(local/1.2));g.rotation.y=Math.sin(time*.23)*.12;});
  camera.position.x=7+Math.sin(time*.12)*.7; camera.lookAt(0,.35,0);
  center.rotation.set(time*.12,time*.3,0); center.position.y=Math.sin(time)*.1;
  discoveryNodes.forEach(({node,target},i)=>{
    const spread=1.35-.35*smooth(local/3);node.position.set(target[0]*spread,target[1]+Math.sin(time+i)*.08,target[2]*spread);node.rotation.y=time*.13;
    const vertices=discoveryLinks[i].geometry.attributes.position;vertices.setXYZ(1,...node.position.toArray());vertices.needsUpdate=true;
    packets[i].position.copy(node.position).multiplyScalar((time*.32+i/6)%1);
  });
  plates.forEach((plate,i)=>{plate.position.set(Math.sin(local*.65+i)*.04,(i-1)*(.58+(.85-.58)*(1-smooth(local/5))),0);plate.rotation.y=(1-smooth(local/4))*(i-1)*.25;});
  spines.forEach(({line,x,z})=>{const points=line.geometry.attributes.position;points.setXYZ(0,x,plates[0].position.y,z);points.setXYZ(1,x,plates[2].position.y,z);points.needsUpdate=true;});
  build.g.rotation.y=-.15+Math.sin(local*.3)*.1;
  build.tiles.forEach(({tile,target},i)=>{const amount=1-smooth((local-.3-i*.3)/2);tile.position.set(target[0]+amount*(i%2?2:-2),target[1]+amount*1.5,target[2]+amount*2);tile.rotation.z=amount*(i%2?.6:-.6);tile.scale.setScalar(1-amount*.4);});
  checks.forEach((check,i)=>check.scale.setScalar(.3+.7*smooth((local-4-i*.55)/.4)));
  evolve.g.rotation.y=-.2+Math.sin(local*.4)*.13;
  satellites.forEach((satellite,i)=>{const a=time*.34+i*Math.PI*2/3;satellite.position.set(Math.cos(a)*2.45,Math.sin(a)*.45,Math.sin(a)*2.45);satellite.rotation.set(time*.16,time*.2,0);});
  feedback.forEach((point,i)=>{const a=time*.65+i*Math.PI/6;point.position.set(Math.cos(a)*2.45,0,Math.sin(a)*2.45);});
  // Each standalone scene returns to its starting pose after eight seconds.
  if (loop) {
    const angle = local / 8 * Math.PI * 2, pulse = (1 - Math.cos(angle)) / 2;
    groups[chapter].scale.setScalar(1); groups[chapter].rotation.y = Math.sin(angle) * .12;
    camera.position.x = 7 + Math.sin(angle) * .4; camera.lookAt(0,.35,0);
    center.rotation.set(Math.sin(angle) * .12,angle,0); center.position.y=Math.sin(angle)*.1;
    discoveryNodes.forEach(({node,target},i)=>{
      const spread=1+pulse*.15;node.position.set(target[0]*spread,target[1]+Math.sin(angle+i)*.08,target[2]*spread);node.rotation.y=angle;
      const vertices=discoveryLinks[i].geometry.attributes.position;vertices.setXYZ(1,...node.position.toArray());vertices.needsUpdate=true;
      packets[i].position.copy(node.position).multiplyScalar((local/8+i/6)%1);
    });
    plates.forEach((plate,i)=>{plate.position.set(Math.sin(angle+i)*.04,(i-1)*(.58+pulse*.35),0);plate.rotation.y=Math.sin(angle)*(i-1)*.12;});
    spines.forEach(({line,x,z})=>{const points=line.geometry.attributes.position;points.setXYZ(0,x,plates[0].position.y,z);points.setXYZ(1,x,plates[2].position.y,z);points.needsUpdate=true;});
    build.g.rotation.y=-.15+Math.sin(angle)*.1;
    build.tiles.forEach(({tile,target},i)=>{
      const amount=1-smooth((local-i*.16)/2)*smooth((8-local-i*.16)/2);
      tile.position.set(target[0]+amount*(i%2?2:-2),target[1]+amount*1.5,target[2]+amount*2);tile.rotation.z=amount*(i%2?.6:-.6);tile.scale.setScalar(1-amount*.4);
    });
    checks.forEach((check,i)=>check.scale.setScalar(.3+.7*smooth((local-2.3-i*.2)/.4)*smooth((5.7-local-i*.2)/.4)));
    evolve.g.rotation.y=-.2+Math.sin(angle)*.13;
    satellites.forEach((satellite,i)=>{const a=angle+i*Math.PI*2/3;satellite.position.set(Math.cos(a)*2.45,Math.sin(a)*.45,Math.sin(a)*2.45);satellite.rotation.set(angle,angle,0);});
    feedback.forEach((point,i)=>{const a=angle+i*Math.PI/6;point.position.set(Math.cos(a)*2.45,0,Math.sin(a)*2.45);});
  }
  renderer.render(scene,camera);
  ctx.fillStyle='#0c1511';ctx.fillRect(0,0,W,H);
  const glow=ctx.createRadialGradient(945,335,0,945,335,490);glow.addColorStop(0,'#294534');glow.addColorStop(1,'#0c1511');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#aacda514';ctx.lineWidth=1;for(let x=560;x<W;x+=48){ctx.beginPath();ctx.moveTo(x,90);ctx.lineTo(x,H-100);ctx.stroke();}for(let y=100;y<H-100;y+=48){ctx.beginPath();ctx.moveTo(560,y);ctx.lineTo(W,y);ctx.stroke();}
  ctx.drawImage(renderer.domElement,540,45,720,540);
  text('AYNKO',52,56,22,'#f0f2e9','Manrope',800);text('THE WAY WE BUILD',165,54,11,'#a7b9ac','DM Mono');
  text('FROM COMPLEXITY TO CLARITY',940,54,11,'#b9cbbf','DM Mono');
  ctx.strokeStyle='#d2f78a30';ctx.beginPath();ctx.moveTo(52,80);ctx.lineTo(1228,80);ctx.stroke();
  text(`0${chapter+1} / ${copy.title.toUpperCase()}`,52,181,13,'#d2f78a','DM Mono');
  text(copy.heading[0],48,265,47,'#f0f2e9','Manrope',500);text(copy.heading[1],48,329,47,'#d2f78a','Manrope',500);
  ctx.font='400 19px Manrope';ctx.fillStyle='#b4c1b7';wrap(copy.description,52,392,425,30);
  text('WHAT YOU LEAVE WITH',52,535,10,'#9fb5a6','DM Mono');text(copy.output,52,565,15,'#e0e8db','Manrope',500);
  return output.toDataURL('image/png').split(',')[1];
};
window.filmReady = document.fonts.ready.then(()=>true);
