import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Original procedural sculpture. No remote models, textures, or tracking requests.
export function createHologram(host, onReady, onLost) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, .1, 50);
  camera.position.set(0, 2.6, 9.2); camera.lookAt(0, 2.15, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = .85;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#e4efda', '#15241c', .9));
  const key = new THREE.SpotLight('#f3f8df', 65, 25, .58, .9, 1.4);
  key.position.set(-3.5, 6, 5); key.target.position.set(0, 2, 0); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -.0003; key.shadow.normalBias = .025;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#c5ed99', 2.6); rim.position.set(4, 3, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight('#9cb9db', 1.3); fill.position.set(-4, 1, -2); scene.add(fill);
  const silver = new THREE.MeshPhysicalMaterial({ color: '#aab9b3', metalness: 1, roughness: .22, clearcoat: .7, clearcoatRoughness: .17 });
  const porcelain = new THREE.MeshPhysicalMaterial({ color: '#b5c5a8', metalness: .35, roughness: .24, clearcoat: 1, clearcoatRoughness: .16 });
  const sage = new THREE.MeshPhysicalMaterial({ color: '#8caa78', metalness: .72, roughness: .26, clearcoat: 1 });
  const graphite = new THREE.MeshStandardMaterial({ color: '#14241b', metalness: .65, roughness: .32 });
  const black = new THREE.MeshPhysicalMaterial({ color: '#04130c', metalness: .38, roughness: .12, clearcoat: 1, clearcoatRoughness: .08 });
  const neon = new THREE.MeshStandardMaterial({ color: '#d2f78a', emissive: '#baf57b', emissiveIntensity: .65, metalness: .2, roughness: .24 });
  const pearl = new THREE.MeshPhysicalMaterial({ color: '#e4f9bd', metalness: .18, roughness: .16, clearcoat: 1, emissive: '#accd72', emissiveIntensity: .42 });
  const sphere = new THREE.SphereGeometry(1, 40, 28);
  function mesh(geometry, parent, xyz, material = silver, scale = [1, 1, 1]) {
    const object = new THREE.Mesh(geometry, material); object.position.set(...xyz); object.scale.set(...scale); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  }
  function box(parent, xyz, size, material = silver, radius = .08) {
    return mesh(new RoundedBoxGeometry(...size, 5, radius), parent, xyz, material);
  }
  function ring(parent, xyz, radius, tube, material = silver) {
    return mesh(new THREE.TorusGeometry(radius, tube, 8, 64), parent, xyz, material);
  }
  function rod(parent, a, b, radius, material = silver) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const object = mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 12), parent, start.add(end).multiplyScalar(.5).toArray(), material);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return object;
  }
  const robot = new THREE.Group(); scene.add(robot); robot.rotation.y = -.2;
  const arms = [], elbows = [];
  // A continuous ceramic shell over a recessed chassis, with polished seam details.
  box(robot, [0, 1.75, 0], [.8, .9, .57], graphite, .2);
  mesh(sphere, robot, [0, 1.55, .02], sage, [.47, .5, .33]);
  box(robot, [0, 1.77, .33], [.54, .06, .05], silver, .025);
  box(robot, [0, 2.22, .1], [1.4, .96, .84], porcelain, .28);
  for (const s of [-1, 1]) {
    box(robot, [s * .46, 2.49, .46], [.27, .02, .025], silver, .008);
    box(robot, [s * .49, 2.37, .53], [.12, .015, .02], neon, .006);
    const armStart = robot.children.length;
    mesh(sphere, robot, [s * .94, 2.32, 0], graphite, [.29, .29, .29]);
    const shoulder = mesh(sphere, robot, [s * 1.02, 2.4, 0], porcelain, [.35, .33, .35]); shoulder.rotation.z = s * .2;
    ring(robot, [s * 1.02, 2.42, .33], .13, .025, black);
    mesh(sphere, robot, [s * 1.02, 2.42, .32], silver, [.13, .13, .04]);
    rod(robot, [s * 1.01, 2.25, 0], [s * 1.2, 1.61, .05], .15, graphite);
    const arm = box(robot, [s * 1.12, 1.98, .04], [.36, .57, .42], porcelain, .17); arm.rotation.z = s * .25;
    mesh(sphere, robot, [s * 1.2, 1.57, .08], silver, [.19, .19, .19]);
    ring(robot, [s * 1.2, 1.57, .255], .115, .018, graphite);
    const forearmStart = robot.children.length;
    const wrist = s === -1 ? [-1.55, 1.85, .4] : [1.18, .95, .22];
    rod(robot, [s * 1.2, 1.56, .1], wrist, .12, graphite);
    const forearm = box(robot, [(s * 1.2 + wrist[0]) / 2, (1.56 + wrist[1]) / 2, .24], [.33, .52, .4], sage, .15);
    forearm.rotation.z = s === -1 ? -.9 : -.06;
    const palm = box(robot, wrist, [.28, .16, .29], graphite, .05);
    if (s === 1) palm.rotation.z = Math.PI / 2;
    for (let j = 0; j < 4; j++) {
      const x = wrist[0] - .09 + j * .062;
      const y = wrist[1] + (s === -1 ? .04 : -.16);
      rod(robot, [x, y, wrist[2] + .09], [x - .03, y + (s === -1 ? .11 : -.16), wrist[2] + .22], .028, silver);
      mesh(sphere, robot, [x - .03, y + (s === -1 ? .11 : -.16), wrist[2] + .22], graphite, [.033,.033,.033]);
    }
    const lowerPieces = robot.children.slice(forearmStart);
    const elbow = new THREE.Group(); elbow.position.set(s * 1.2, 1.57, .08); robot.add(elbow);
    robot.updateMatrixWorld(true); lowerPieces.forEach(piece => elbow.attach(piece)); elbows.push(elbow);
    const pieces = robot.children.slice(armStart);
    const pivot = new THREE.Group(); pivot.position.set(s * .94, 2.32, 0); robot.add(pivot);
    robot.updateMatrixWorld(true); pieces.forEach(piece => pivot.attach(piece)); arms.push(pivot);
  }
  const reactor = new THREE.Group(); reactor.position.set(0, 2.16, .53); robot.add(reactor);
  mesh(new THREE.CylinderGeometry(.245,.245,.12,48),reactor,[0,0,0],black).rotation.x=Math.PI/2;
  ring(reactor,[0,0,.07],.21,.025,silver);
  ring(reactor,[0,0,.095],.145,.012,neon);
  mesh(sphere,reactor,[0,0,.12],pearl,[.1,.1,.05]);
  rod(robot,[0,2.55,0],[0,2.92,0],.2,graphite);
  ring(robot,[0,2.72,0],.22,.045,silver).rotation.x=Math.PI/2;
  const head=new THREE.Group();head.position.set(0,3.26,0);robot.add(head);
  box(head,[0,0,0],[1.25,1.02,.92],porcelain,.32);
  box(head,[0,.04,.407],[1.14,.53,.22],silver,.19);
  box(head,[0,.04,.49],[1.055,.44,.14],black,.18);
  const visorLight = box(head,[0,.055,.572],[.58,.012,.014],neon,.005);
  const eyes = [];
  for(const s of [-1,1]){
    const ear=mesh(new THREE.CylinderGeometry(.205,.205,.13,48),head,[s*.63,.025,-.02],sage);ear.rotation.z=Math.PI/2;
    const earRing=ring(head,[s*.705,.025,-.02],.14,.025,silver);earRing.rotation.y=Math.PI/2;
    eyes.push(box(head,[s*.22,.07,.578],[.115,.075,.018],neon,.032));
  }
  const voiceBars = Array.from({length: 7}, (_, i) => box(head, [(i - 3) * .04, -.105, .58], [.018, .018, .014], neon, .006));
  // A small orbiting data object sits above the open palm.
  const core=new THREE.Group();core.position.set(-1.57,2.5,.4);robot.add(core);
  const gem=mesh(sphere,core,[0,0,0],pearl,[.21,.21,.21]);
  for(let i=0;i<2;i++){const orbit=ring(core,[0,0,0],.34+i*.1,.035,i ? sage : silver);orbit.rotation.set(.7+i, .3+i, .2);}
  // Quiet orbital architecture gives the sculpture depth without covering the copy.
  const orbitals = new THREE.Group();orbitals.position.set(0,2.3,-.8);scene.add(orbitals);
  const backdropArc=mesh(new THREE.TorusGeometry(1.87,.035,12,96,Math.PI*1.6),orbitals,[0,0,0],sage);
  backdropArc.rotation.z=-.9;backdropArc.rotation.y=.4;
  const pedestal=mesh(new THREE.CylinderGeometry(1.35,1.48,.16,64),scene,[0,.39,0],graphite);
  mesh(new THREE.CylinderGeometry(1.28,1.28,.025,96),scene,[0,.48,0],graphite);
  const pedestalLight = ring(scene,[0,.42,0],1.4,.01,neon); pedestalLight.rotation.x=Math.PI/2;
  ring(scene,[0,.5,0],1.26,.012,silver).rotation.x=Math.PI/2;
  const ground=mesh(new THREE.CircleGeometry(2.3,64),scene,[0,.29,0],new THREE.ShadowMaterial({opacity:.18}));ground.rotation.x=-Math.PI/2;ground.castShadow=false;
  const scan = ring(scene, [0, 1.6, 0], 1.6, .009, neon); scan.rotation.x = Math.PI / 2; scan.visible = false;
  const sparks = new THREE.Group(); scene.add(sparks);
  const sparkGeometry = new THREE.IcosahedronGeometry(.022, 0);
  for (let i = 0; i < 10; i++) mesh(sparkGeometry, sparks, [0, 0, 0], neon);
  // Batch rigid armor by material; articulated parts keep their own pivots.
  // This reduces GPU draw calls without changing the sculpture or its joints.
  const retiredGeometry = new Set();
  for (const group of [robot, head, reactor, ...arms, ...elbows]) {
    const batches = new Map();
    for (const child of [...group.children]) {
      if (!child.isMesh || voiceBars.includes(child) || eyes.includes(child) || child === visorLight) continue;
      child.updateMatrix();
      // Rounded boxes are non-indexed; cylinders and spheres are indexed.
      // Normalize before merging so a failed batch cannot disable the entire scene.
      const geometry = (child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone()).applyMatrix4(child.matrix);
      const batch = batches.get(child.material) || [];
      batch.push(geometry); batches.set(child.material, batch);
      retiredGeometry.add(child.geometry); group.remove(child);
    }
    for (const [material, geometries] of batches) {
      const merged = mergeGeometries(geometries);
      const mergedMesh = new THREE.Mesh(merged, material); mergedMesh.castShadow = true; mergedMesh.receiveShadow = true; group.add(mergedMesh);
      geometries.forEach(geometry => geometry.dispose());
    }
  }
  const colors=Object.fromEntries(Object.entries({data:'#d2f78a',flow:'#81e1d4',ai:'#c1acff',edge:'#88caff'}).map(([k,v])=>[k,new THREE.Color(v)]));
  let disposed=false,paused=false,visible=true,lost=false,time=0,last=0,targetX=0,targetY=0,lookX=0,lookY=0,layer='data';
  let actionStart = -10, action = 'data', phase = 'idle';
  let coreSpin = 0, sparkSpin = 0, coreSpeed = .4, sparkSpeed = .25;
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),pointer=matchMedia('(hover: hover) and (pointer: fine)');
  function draw(now=0){
    if(disposed||lost)return;
    const responsive=!paused&&!motion.matches;
    const dt = now && responsive ? (last ? Math.min((now-last)/1000,.05) : 1/60) : 0;
    if(now&&responsive){time+=dt;last=now;}
    const blend = 1 - Math.exp(-10 * dt), follow = 1 - Math.exp(-5 * dt);
    const smooth = (object, key, target) => { object[key] += (target - object[key]) * blend; };
    if(responsive){lookX+=(targetX-lookX)*follow;lookY+=(targetY-lookY)*follow;}
    const elapsed = Math.max(0, time - actionStart), progress = Math.min(1, elapsed / 3.2);
    const pulse = Math.sin(progress * Math.PI) ** 2, gesture = motion.matches ? 0 : pulse;
    const talking = phase === 'speaking' || phase === 'responding', thinking = phase === 'thinking';
    // The head leads; the torso and hands follow with a smaller, slower response.
    const glanceCycle = time % 14;
    const glance = phase === 'idle' && progress === 1 && glanceCycle > 9 && glanceCycle < 12
      ? Math.sin((glanceCycle - 9) / 3 * Math.PI) ** 2 : 0;
    const breath = Math.sin(time * 1.15);
    const blinkCycle = time % 5.7;
    const blink = blinkCycle > 5.48 ? Math.sin((blinkCycle - 5.48) / .22 * Math.PI) ** 2 : 0;
    eyes.forEach(eye => { eye.scale.y = 1 - blink * .92; });
    visorLight.scale.y = 1 - blink * .7;
    smooth(robot.position, 'y', Math.sin(time*.85)*.055 + (action === 'edge' ? gesture * .42 : 0));
    smooth(robot.position, 'x', Math.sin(time * .38) * .035 + lookX * .035);
    smooth(robot.rotation, 'y', -.2+Math.sin(time*.3)*.06+lookX*.24 - glance * .045 + (action === 'edge' ? gesture * .8 : 0));
    smooth(robot.rotation, 'x', breath * .009 + (thinking ? .035 : 0));
    smooth(robot.rotation, 'z', Math.sin(time * .65) * .017 - lookX * .035);
    smooth(head.rotation, 'y', lookX*.36 - glance * .3 + (action === 'data' ? Math.sin(elapsed * 2.8) * gesture * .3 : 0));
    smooth(head.rotation, 'x', lookY*.2 + glance * .13 + (talking ? Math.sin(time * 3) * .05 : Math.sin(time * .8) * .025) + (action === 'wave' ? gesture * -.08 : 0));
    smooth(head.rotation, 'z', thinking ? Math.sin(time * 1.5) * .09 : action === 'ai' ? gesture * -.22 : 0);
    smooth(arms[0].rotation, 'x', breath * .025 - glance * .12);
    smooth(arms[0].rotation, 'z', Math.sin(time * .9) * .045 + (action === 'flow' ? gesture * (.3 + Math.sin(elapsed * 3.5) * .3) : action === 'ai' ? gesture * -.3 : 0));
    smooth(arms[1].rotation, 'z', action === 'wave' ? gesture * 1.9 : action === 'flow' ? gesture * (1.15 + Math.sin(elapsed * 4) * .2) : action === 'edge' ? gesture * -.45 : talking ? .12 + Math.sin(time * 3) * .08 : Math.sin(time * .9 + .6) * .035);
    smooth(arms[1].rotation, 'x', action === 'ai' ? gesture * -1 : breath * -.035);
    smooth(elbows[0].rotation, 'x', Math.sin(time * 1.1) * .025 + (action === 'ai' ? gesture * -.24 : 0));
    smooth(elbows[1].rotation, 'z', action === 'wave' ? gesture * (.45 + Math.sin(elapsed * 11) * .32) : action === 'flow' ? gesture * .35 : 0);
    smooth(elbows[1].rotation, 'x', talking ? -.18 + Math.sin(time * 2.3) * .1 : action === 'data' ? gesture * -.25 : 0);
    coreSpeed += ((thinking ? 1.2 : layer === 'ai' ? .85 : .4) - coreSpeed) * blend; coreSpin += coreSpeed * dt;
    sparkSpeed += ((layer === 'flow' ? .95 : layer === 'edge' ? .5 : .25) - sparkSpeed) * blend; sparkSpin += sparkSpeed * dt;
    core.rotation.set(time*.24,coreSpin,.15);
    smooth(core.position, 'y', 2.5+Math.sin(time*1.2)*.06 + (action === 'ai' ? gesture * .3 : 0));
    smooth(core.scale, 'x', 1 + (action === 'ai' ? gesture * .45 : 0)); core.scale.y = core.scale.z = core.scale.x;
    const launch = action === 'edge' ? gesture : 0;
    smooth(pedestalLight.scale, 'x', 1 + launch * .28); pedestalLight.scale.y = pedestalLight.scale.z = pedestalLight.scale.x;
    voiceBars.forEach((bar, i) => smooth(bar.scale, 'y', talking ? 1 + Math.abs(Math.sin(time * 8 + i * 1.7)) * 3 : thinking ? 1 + Math.sin(time * 4 + i) * .4 : 1));
    scan.visible = action === 'data' && progress < 1 && !motion.matches;
    scan.position.y = .7 + progress * 3.2;
    sparks.children.forEach((spark, i) => { const angle = sparkSpin + i * Math.PI / 12; const r = 1.75 + Math.sin(i * 2.3) * .25; spark.position.set(Math.cos(angle) * r, 2.1 + Math.sin(angle * 2 + i) * 1.2, Math.sin(angle) * .7 - .5); });
    gem.rotation.y=-time * (layer === 'flow' ? 1.4 : .7);
    orbitals.rotation.z=Math.sin(time*.12)*.1;
    orbitals.rotation.y += (layer === 'flow' ? 1.5 : .15) * dt;
    neon.color.lerp(colors[layer],responsive ? blend : 1);neon.emissive.copy(neon.color);
    neon.emissiveIntensity = .65 + (talking ? Math.sin(time * 10) * .12 : thinking ? Math.sin(time * 3) * .15 : gesture * .3);
    camera.position.x += (lookX * .12 - camera.position.x) * follow;
    camera.lookAt(0, 2.15, 0);
    renderer.render(scene,camera);
    host.dataset.frame=String(Math.round(time*1000));
    host.dataset.gesture = progress < 1 ? action : 'idle';
    host.dataset.drawCalls = String(renderer.info.render.calls);
  }
  function sync(){
    last=0;const running=visible&&!document.hidden&&!paused&&!motion.matches&&!lost;
    host.dataset.motion=running?'running':'paused';
    renderer.setAnimationLoop(running?draw:null);
    if(visible&&!document.hidden)draw();
  }
  function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.position.z=camera.aspect<.85?10.4:9.2;camera.updateProjectionMatrix();draw();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const observer=new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;sync();});observer.observe(host);
  function move(e){if(!pointer.matches || e.pointerType !== 'mouse')return;const r=host.getBoundingClientRect();targetX=THREE.MathUtils.clamp((e.clientX-r.left)/r.width-.5,-.75,.75);targetY=THREE.MathUtils.clamp((e.clientY-r.top)/r.height-.5,-.6,.6);}
  function leave(){targetX=targetY=0;}
  function contextLost(e){e.preventDefault();lost=true;sync();onLost();}
  function contextRestored(){lost=false;resize();sync();onReady();}
  const interactionArea = host.closest('.hero-layout') || host;
  interactionArea.addEventListener('pointermove',move);interactionArea.addEventListener('pointerleave',leave);
  renderer.domElement.addEventListener('webglcontextlost',contextLost);renderer.domElement.addEventListener('webglcontextrestored',contextRestored);
  motion.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  host.append(renderer.domElement);resize();sync();onReady();
  return {
    setPaused(value){paused=value;sync();},
    setLayer(value){layer=colors[value]?value:'data';draw();},
    perform(value){action=colors[value] || value === 'wave' ? value : 'data';actionStart=time;draw();},
    setPhase(value){phase=value;draw();},
    dispose(){
      disposed=true;renderer.setAnimationLoop(null);observer.disconnect();resizeObserver.disconnect();
      motion.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);
      interactionArea.removeEventListener('pointermove',move);interactionArea.removeEventListener('pointerleave',leave);
      renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.domElement.removeEventListener('webglcontextrestored',contextRestored);
      const geometries=new Set(),materials=new Set();
      scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
      retiredGeometry.forEach(g=>geometries.add(g));geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());key.shadow.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();
    }
  };
}
