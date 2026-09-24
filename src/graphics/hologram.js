import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Original procedural sculpture. No remote models, textures, or tracking requests.
export function createHologram(host, onReady, onLost) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .92;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, .1, 50);
  camera.position.set(0, 2.6, 9.2); camera.lookAt(0, 2.15, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xe5f4ef, 0x273036, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 4); key.position.set(-3, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xd3ffad, 3); rim.position.set(4, 3, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x8fb6dc, 2); fill.position.set(-4, 1, -2); scene.add(fill);
  const silver = new THREE.MeshStandardMaterial({ color: '#819692', metalness: .92, roughness: .25 });
  const porcelain = new THREE.MeshStandardMaterial({ color: '#b9c8c2', metalness: .84, roughness: .28 });
  const graphite = new THREE.MeshStandardMaterial({ color: '#202b30', metalness: .78, roughness: .34 });
  const black = new THREE.MeshStandardMaterial({ color: '#040b0d', metalness: .5, roughness: .17 });
  const neon = new THREE.MeshStandardMaterial({ color: '#d2f78a', emissive: '#baf57b', emissiveIntensity: .9, metalness: .2, roughness: .24 });
  const line = new THREE.LineBasicMaterial({ color: '#bdebb2', transparent: true, opacity: .24 });
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  function mesh(geometry, parent, xyz, material = silver, scale = [1, 1, 1]) {
    const object = new THREE.Mesh(geometry, material); object.position.set(...xyz); object.scale.set(...scale); parent.add(object); return object;
  }
  function box(parent, xyz, size, material = silver, radius = .08) {
    return mesh(new RoundedBoxGeometry(...size, 3, radius), parent, xyz, material);
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
  const arms = [];
  // Floating, layered torso with a recessed mechanical spine.
  box(robot, [0, 1.83, 0], [.82, .93, .58], graphite);
  for (let i = 0; i < 5; i++) {
    box(robot, [0, 1.25 + i * .16, .31], [.61 + i * .045, .09, .16], i % 2 ? silver : graphite, .025);
  }
  for (const s of [-1, 1]) {
    const chest = box(robot, [s * .38, 2.22, .08], [.7, .82, .79], porcelain, .17); chest.rotation.z = s * -.16;
    box(robot, [s * .32, 2.47, .48], [.43, .045, .035], graphite, .01);
    box(robot, [s * .39, 2.35, .49], [.3, .025, .025], neon, .008);
    for (let j = 0; j < 3; j++) box(robot, [s * .43, 1.98 + j * .085, .49], [.2, .028, .025], graphite, .008);
    const armStart = robot.children.length;
    mesh(sphere, robot, [s * .94, 2.32, 0], graphite, [.29, .29, .29]);
    const shoulder = box(robot, [s * 1.02, 2.43, 0], [.53, .49, .62], silver, .13); shoulder.rotation.z = s * .2;
    ring(robot, [s * 1.02, 2.42, .33], .13, .025, black);
    ring(robot, [s * 1.02, 2.42, .36], .085, .016, neon);
    rod(robot, [s * 1.01, 2.25, 0], [s * 1.2, 1.61, .05], .15, graphite);
    const arm = box(robot, [s * 1.12, 1.98, .04], [.34, .52, .4], porcelain, .09); arm.rotation.z = s * .25;
    mesh(sphere, robot, [s * 1.2, 1.57, .08], silver, [.19, .19, .19]);
    ring(robot, [s * 1.2, 1.57, .255], .115, .018, graphite);
    const wrist = s === -1 ? [-1.55, 1.85, .4] : [1.18, .95, .22];
    rod(robot, [s * 1.2, 1.56, .1], wrist, .12, graphite);
    const forearm = box(robot, [(s * 1.2 + wrist[0]) / 2, (1.56 + wrist[1]) / 2, .24], [.3, .49, .38], silver, .08);
    forearm.rotation.z = s === -1 ? -.9 : -.06;
    const palm = box(robot, wrist, [.28, .16, .29], graphite, .05);
    if (s === 1) palm.rotation.z = Math.PI / 2;
    for (let j = 0; j < 4; j++) {
      const x = wrist[0] - .09 + j * .062;
      const y = wrist[1] + (s === -1 ? .04 : -.16);
      rod(robot, [x, y, wrist[2] + .09], [x - .03, y + (s === -1 ? .11 : -.16), wrist[2] + .22], .028, silver);
      mesh(sphere, robot, [x - .03, y + (s === -1 ? .11 : -.16), wrist[2] + .22], graphite, [.033,.033,.033]);
    }
    const pieces = robot.children.slice(armStart);
    const pivot = new THREE.Group(); pivot.position.set(s * .94, 2.32, 0); robot.add(pivot);
    robot.updateMatrixWorld(true); pieces.forEach(piece => pivot.attach(piece)); arms.push(pivot);
    for (const y of [2.06, 2.58]) mesh(new THREE.CylinderGeometry(.035,.035,.02,6), robot,[s * .61,y,.475],graphite).rotation.x=Math.PI/2;
  }
  const reactor = new THREE.Group(); reactor.position.set(0, 2.16, .53); robot.add(reactor);
  mesh(new THREE.CylinderGeometry(.245,.245,.12,48),reactor,[0,0,0],black).rotation.x=Math.PI/2;
  ring(reactor,[0,0,.07],.21,.025,silver);
  ring(reactor,[0,0,.095],.145,.022,neon);
  mesh(new THREE.IcosahedronGeometry(.08,0),reactor,[0,0,.12],neon);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;box(reactor,[Math.cos(a)*.18,Math.sin(a)*.18,.1],[.025,.025,.03],graphite,.003);}
  rod(robot,[0,2.55,0],[0,2.92,0],.2,graphite);
  for(let i=0;i<3;i++) ring(robot,[0,2.67+i*.075,0],.22,.025,silver).rotation.x=Math.PI/2;
  const head=new THREE.Group();head.position.set(0,3.38,0);robot.add(head);
  box(head,[0,0,0],[1.2,.97,.87],porcelain,.25);
  box(head,[0,.35,-.03],[.68,.37,.88],silver,.12);
  box(head,[0,.39,.425],[.07,.19,.027],graphite,.015);
  box(head,[0,.035,.407],[1.055,.395,.19],graphite,.15);
  box(head,[0,.04,.5],[.94,.24,.06],black,.1);
  box(head,[0,.055,.54],[.74,.035,.026],neon,.014);
  for(const s of [-1,1]){
    const ear=mesh(new THREE.CylinderGeometry(.235,.235,.16,40),head,[s*.62,.025,-.02],graphite);ear.rotation.z=Math.PI/2;
    const earRing=ring(head,[s*.716,.025,-.02],.177,.028,silver);earRing.rotation.y=Math.PI/2;
    const earLight=ring(head,[s*.729,.025,-.02],.105,.014,neon);earLight.rotation.y=Math.PI/2;
    box(head,[s*.3,-.3,.44],[.24,.12,.04],silver,.03).rotation.z=s*-.22;
    box(head,[s*.22,.055,.558],[.14,.07,.028],neon,.02);
  }
  box(head,[0,-.31,.42],[.12,.045,.04],graphite,.01);
  const voiceBars = Array.from({length: 7}, (_, i) => box(head, [(i - 3) * .045, -.19, .474], [.025, .035, .025], neon, .006));
  // A small orbiting data object sits above the open palm.
  const core=new THREE.Group();core.position.set(-1.57,2.5,.4);robot.add(core);
  const gem=mesh(new THREE.IcosahedronGeometry(.22,0),core,[0,0,0],silver);
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.33,0)),line);core.add(wire);
  for(let i=0;i<2;i++){const orbit=ring(core,[0,0,0],.42+i*.09,.009,neon);orbit.rotation.set(.7+i, .3+i, .2);}
  // Quiet orbital architecture gives the sculpture depth without covering the copy.
  const orbitals = new THREE.Group();orbitals.position.set(0,2.3,-.8);scene.add(orbitals);
  for(let i=0;i<3;i++){
    const curve=new THREE.EllipseCurve(0,0,1.8+i*.18,1.8+i*.18,0,Math.PI*2,false,0);
    const orbit=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(curve.getPoints(160)),line);
    orbit.rotation.set(.3+i*.35,.55+i*.5,i*.28);orbitals.add(orbit);
  }
  const pedestal=mesh(new THREE.CylinderGeometry(1.35,1.48,.16,64),scene,[0,.39,0],graphite);
  ring(scene,[0,.48,0],1.25,.016,neon).rotation.x=Math.PI/2;
  ring(scene,[0,.5,0],.94,.01,silver).rotation.x=Math.PI/2;
  const scan = ring(scene, [0, 1.6, 0], 1.6, .009, neon); scan.rotation.x = Math.PI / 2; scan.visible = false;
  const sparks = new THREE.Group(); scene.add(sparks);
  const sparkGeometry = new THREE.IcosahedronGeometry(.022, 0);
  for (let i = 0; i < 24; i++) mesh(sparkGeometry, sparks, [0, 0, 0], neon);
  const colors=Object.fromEntries(Object.entries({data:'#d2f78a',flow:'#81e1d4',ai:'#c1acff',edge:'#88caff'}).map(([k,v])=>[k,new THREE.Color(v)]));
  let disposed=false,paused=false,visible=true,lost=false,time=0,last=0,targetX=0,targetY=0,lookX=0,lookY=0,layer='data';
  let actionStart = -10, action = 'data', phase = 'idle';
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),pointer=matchMedia('(hover: hover) and (pointer: fine)');
  function draw(now=0){
    if(disposed||lost)return;
    const responsive=!paused&&!motion.matches;
    if(now&&responsive){if(last)time+=Math.min((now-last)/1000,.05);last=now;}
    if(responsive){lookX+=(targetX-lookX)*.055;lookY+=(targetY-lookY)*.055;}
    const elapsed = Math.max(0, time - actionStart), progress = Math.min(1, elapsed / 3.2);
    const pulse = Math.sin(progress * Math.PI), gesture = motion.matches ? 0 : pulse;
    const talking = phase === 'speaking' || phase === 'responding', thinking = phase === 'thinking';
    robot.position.y=Math.sin(time*.85)*.055 + (action === 'edge' ? gesture * .42 : 0);
    robot.rotation.y=-.2+Math.sin(time*.3)*.06+lookX*.3 + (action === 'edge' ? gesture * .8 : 0);
    head.rotation.y=lookX*.28 + (action === 'data' ? Math.sin(elapsed * 4) * gesture * .3 : 0);
    head.rotation.x=lookY*.14 + (talking ? Math.sin(time * 5) * .05 : 0);
    head.rotation.z = thinking ? Math.sin(time * 1.5) * .09 : action === 'ai' ? gesture * -.22 : 0;
    arms[0].rotation.z = action === 'flow' ? gesture * (.3 + Math.sin(elapsed * 7) * .3) : action === 'ai' ? gesture * -.3 : 0;
    arms[1].rotation.z = action === 'flow' ? gesture * (1.35 + Math.sin(elapsed * 8) * .25) : action === 'edge' ? gesture * -.45 : talking ? .12 + Math.sin(time * 3) * .08 : 0;
    arms[1].rotation.x = action === 'ai' ? gesture * -1 : 0;
    core.rotation.set(time*.24,time*(thinking ? 1.5 : .4),.15);core.position.y=2.5+Math.sin(time*1.2)*.06 + (action === 'ai' ? gesture * .3 : 0);
    core.scale.setScalar(1 + (action === 'ai' ? gesture * .45 : 0));
    voiceBars.forEach((bar, i) => { bar.scale.y = talking ? 1 + Math.abs(Math.sin(time * 14 + i * 1.7)) * 3 : thinking ? 1 + Math.sin(time * 4 + i) * .4 : 1; });
    scan.visible = action === 'data' && progress < 1 && !motion.matches;
    scan.position.y = .7 + progress * 3.2;
    sparks.children.forEach((spark, i) => { const angle = time * (layer === 'flow' ? .8 : .25) + i * Math.PI / 12; const r = 1.75 + Math.sin(i * 2.3) * .25; spark.position.set(Math.cos(angle) * r, 2.1 + Math.sin(angle * 2 + i) * 1.2, Math.sin(angle) * .7 - .5); });
    gem.rotation.y=-time*.7;orbitals.rotation.z=Math.sin(time*.12)*.1;
    neon.color.lerp(colors[layer],responsive?.07:1);neon.emissive.copy(neon.color);
    neon.emissiveIntensity = .9 + (talking ? Math.sin(time * 10) * .18 : thinking ? Math.sin(time * 3) * .2 : gesture * .4);
    renderer.render(scene,camera);
    host.dataset.frame=String(Math.round(time*1000));
    host.dataset.gesture = progress < 1 ? action : 'idle';
  }
  function sync(){
    last=0;const running=visible&&!document.hidden&&!paused&&!motion.matches&&!lost;
    host.dataset.motion=running?'running':'paused';
    renderer.setAnimationLoop(running?draw:null);
    if(visible&&!document.hidden)draw();
  }
  function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.position.z=camera.aspect<.85?10.4:9.2;camera.updateProjectionMatrix();draw();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});observer.observe(host);
  function move(e){if(!pointer.matches)return;const r=host.getBoundingClientRect();targetX=(e.clientX-r.left)/r.width-.5;targetY=(e.clientY-r.top)/r.height-.5;}
  function leave(){targetX=targetY=0;}
  function contextLost(e){e.preventDefault();lost=true;sync();onLost();}
  function contextRestored(){lost=false;resize();sync();onReady();}
  host.addEventListener('pointermove',move);host.addEventListener('pointerleave',leave);
  renderer.domElement.addEventListener('webglcontextlost',contextLost);renderer.domElement.addEventListener('webglcontextrestored',contextRestored);
  motion.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  host.append(renderer.domElement);resize();sync();onReady();
  return {
    setPaused(value){paused=value;sync();},
    setLayer(value){layer=colors[value]?value:'data';draw();},
    perform(value){action=colors[value]?value:'data';actionStart=time;draw();},
    setPhase(value){phase=value;draw();},
    dispose(){
      disposed=true;renderer.setAnimationLoop(null);observer.disconnect();resizeObserver.disconnect();
      motion.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);
      host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);
      renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.domElement.removeEventListener('webglcontextrestored',contextRestored);
      const geometries=new Set(),materials=new Set();
      scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());environment.dispose();renderer.dispose();renderer.domElement.remove();
    }
  };
}
