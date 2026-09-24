import * as THREE from 'three';

// A procedural character: every surface, curl, joint, and orbit is real geometry.
// Loaded separately so the document and navigation never wait for WebGL.
export function createHologram(host, onReady, onLost) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 40);
  camera.position.set(.2, 3.5, 11.6); camera.lookAt(-.23, 2.67, 0);
  const surface = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color('#79f6d3') } },
    vertexShader: `varying vec3 vNormal; varying vec3 vWorld; varying vec3 vView;
      void main(){vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);vView=cameraPosition-world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader: `uniform float uTime;uniform vec3 uColor;varying vec3 vNormal;varying vec3 vWorld;varying vec3 vView;
      void main(){vec3 n=normalize(vNormal);float rim=pow(1.0-abs(dot(n,normalize(vView))),2.4);float light=max(0.0,dot(n,normalize(vec3(-.7,1.0,1.0))));float scan=pow(.5+.5*sin(vWorld.y*180.0-uTime*1.8),5.0);float sweep=pow(.5+.5*sin(vWorld.y*2.0-uTime*.65),24.0);gl_FragColor=vec4(uColor*(.13+light*.24+rim*.9+scan*.035+sweep*.12),.98);}`,
    transparent: true,
  });
  const edges = new THREE.LineBasicMaterial({ color: '#8ffff0', transparent: true, opacity: .15, blending: THREE.AdditiveBlending, depthWrite: false });
  const bright = new THREE.MeshBasicMaterial({ color: '#9affdd', transparent: true, opacity: .78 });
  const dark = new THREE.MeshBasicMaterial({ color: '#123d34', transparent: true, opacity: .9 });
  const glass = new THREE.MeshBasicMaterial({ color: '#63ecc3', transparent: true, opacity: .15, depthWrite: false });
  const sphere = new THREE.SphereGeometry(1, 24, 16), faceted = new THREE.IcosahedronGeometry(1, 1);
  function mesh(geometry, parent, position, scale = [1, 1, 1], material = surface, wire = false) {
    const item = new THREE.Mesh(geometry, material); item.position.set(...position); item.scale.set(...scale); parent.add(item);
    if (wire) item.add(new THREE.LineSegments(new THREE.WireframeGeometry(geometry), edges));
    return item;
  }
  function ring(radius, tube, parent, position, material = bright, arc = Math.PI * 2) {
    return mesh(new THREE.TorusGeometry(radius, tube, 8, 48, arc), parent, position, [1, 1, 1], material);
  }
  function bone(parent, start, end, radius, radiusEnd = radius, material = surface) {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end), direction = b.clone().sub(a);
    const item = mesh(new THREE.CylinderGeometry(radiusEnd, radius, direction.length(), 12), parent, a.add(b).multiplyScalar(.5).toArray(), [1, 1, 1], material);
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); return item;
  }
  const character = new THREE.Group(); scene.add(character);
  mesh(new THREE.CylinderGeometry(.49, .36, 1.22, 12), character, [0, 2.58, 0], [1, 1, .68], surface, true);
  mesh(faceted, character, [0, 1.85, 0], [.39, .37, .27]);
  mesh(new THREE.CylinderGeometry(.23, .23, .25, 16), character, [0, 3.27, 0]);
  ring(.28, .035, character, [0, 3.2, 0]).rotation.x = Math.PI / 2;
  ring(.15, .012, character, [0, 2.7, .345]);
  const triangle = new THREE.Shape(); triangle.moveTo(-.04, -.055); triangle.lineTo(.06, 0); triangle.lineTo(-.04, .055); triangle.closePath();
  mesh(new THREE.ShapeGeometry(triangle), character, [0, 2.7, .36], [1, 1, 1], bright);
  for (const sign of [-1, 1]) {
    bone(character, [sign * .21, 1.77, 0], [sign * .27, 1.07, .02], .145, .18);
    mesh(faceted, character, [sign * .27, 1.02, .045], [.2, .21, .19], surface, true);
    bone(character, [sign * .27, .98, .02], [sign * .3, .31, .04], .1, .15);
    mesh(new THREE.BoxGeometry(.29, .16, .48), character, [sign * .3, .23, .14]);
    ring(.13, .012, character, [sign * .3, .33, .04]).rotation.x = Math.PI / 2;
    mesh(faceted, character, [sign * .54, 3.02, 0], [.25, .28, .25]);
  }
  const leftArm = new THREE.Group(); character.add(leftArm);
  bone(leftArm, [-.57, 2.92, 0], [-.85, 2.49, .06], .15, .18);
  mesh(sphere, leftArm, [-.85, 2.49, .06], [.16, .16, .16]);
  bone(leftArm, [-.85, 2.49, .06], [-1.35, 2.7, .12], .12, .14);
  bone(leftArm, [-1.28, 2.67, .12], [-1.39, 2.71, .12], .16, .16, bright);
  mesh(sphere, leftArm, [-1.5, 2.72, .14], [.23, .09, .16]);
  for (let i = 0; i < 4; i++) bone(leftArm, [-1.6, 2.73, .02 + i * .075], [-1.78, 2.84, .02 + i * .075], .032);
  bone(leftArm, [-1.4, 2.74, .25], [-1.43, 2.9, .3], .045);
  bone(character, [.57, 2.92, 0], [.72, 2.47, 0], .15, .18);
  mesh(sphere, character, [.72, 2.47, 0], [.15, .15, .15]);
  bone(character, [.72, 2.47, 0], [.92, 2.04, .05], .11, .14);
  bone(character, [.89, 2.08, .05], [.94, 1.99, .05], .16, .16, bright);
  mesh(sphere, character, [.96, 1.86, .05], [.11, .19, .08]);
  for (let i = 0; i < 4; i++) bone(character, [.9 + i * .045, 1.75, .08], [.91 + i * .055, 1.57 + Math.abs(i - 1.5) * .04, .13], .027);
  bone(character, [.85, 1.94, .05], [.8, 1.78, .12], .037);
  const head = new THREE.Group(); head.position.set(0, 3.92, 0); character.add(head);
  mesh(sphere, head, [0, 0, 0], [.64, .65, .53], surface, true);
  for (const sign of [-1, 1]) {
    mesh(sphere, head, [sign * .63, -.03, 0], [.14, .2, .13]);
    ring(.23, .028, head, [sign * .27, .02, .54], surface);
    mesh(new THREE.CircleGeometry(.206, 32), head, [sign * .27, .02, .544], [1, 1, 1], dark);
    mesh(new THREE.CircleGeometry(.202, 32), head, [sign * .27, .02, .55], [1, 1, 1], glass);
    ring(.216, .007, head, [sign * .27, .02, .565], bright);
    mesh(sphere, head, [sign * .27 - .07, .095, .57], [.035, .04, .007], bright);
  }
  bone(head, [-.04, .025, .57], [.04, .025, .57], .02);
  mesh(faceted, head, [0, -.15, .53], [.065, .11, .09]);
  const smile = ring(.135, .014, head, [0, -.23, .485], bright, Math.PI * .65); smile.rotation.z = Math.PI * 1.175;
  const curls = [[-.49,.46,.04,.31],[-.27,.71,.05,.32],[.05,.82,0,.34],[.38,.67,.03,.32],[.59,.41,.02,.28],[-.64,.21,-.04,.24],[.65,.13,-.06,.23],[-.38,.39,.4,.3],[-.07,.48,.46,.34],[.25,.43,.43,.3],[.49,.33,.3,.25],[-.4,.6,-.3,.3],[0,.68,-.37,.32],[.4,.5,-.29,.29]];
  curls.forEach(([x, y, z, s], i) => { const curl = mesh(faceted, head, [x, y, z], [s, s * .9, s], surface, true); curl.rotation.set(i * .31, i * .51, i * .23); });
  bone(head, [.45, .69, 0], [.66, .94, 0], .07, .045);
  mesh(faceted, head, [.75, 1.02, 0], [.13, .11, .12], surface, true);
  const globe = new THREE.Group(); globe.position.set(-1.55, 3.52, .15); character.add(globe);
  mesh(new THREE.IcosahedronGeometry(.47, 2), globe, [0, 0, 0], [1, 1, 1], surface, true);
  for (let i = 0; i < 3; i++) { const orbit = ring(.505, .006, globe, [0, 0, 0]); orbit.rotation.set(i * Math.PI / 3, Math.PI / 2, i * .5); }
  const nut = ring(.125, .049, character, [1.2, 3.13, .1], surface); nut.add(new THREE.LineSegments(new THREE.WireframeGeometry(nut.geometry), edges));
  const platform = mesh(new THREE.CylinderGeometry(1.36, 1.3, .12, 6), scene, [0, .08, 0], [1, 1, .72], surface, true);
  for (const radius of [1.04, 1.24, 1.39]) { const light = ring(radius, .013, scene, [0, .155, 0]); light.rotation.x = Math.PI / 2; light.scale.y = .72; }
  const grid = new THREE.GridHelper(5.5, 22, '#438c72', '#264e40'); grid.material.transparent = true; grid.material.opacity = .18; scene.add(grid);
  const positions = [];
  for (let i = 0; i < 140; i++) { const a = i * 2.39996, radius = 1.3 + (i % 13) * .065; positions.push(Math.cos(a) * radius, .15 + ((i * 37) % 101) / 20, Math.sin(a) * radius * .6); }
  const dustGeometry = new THREE.BufferGeometry(); dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: '#a7ffe0', size: .018, transparent: true, opacity: .45, depthWrite: false })); scene.add(dust);
  const colors = Object.fromEntries(Object.entries({ data: '#79f6d3', flow: '#8cefe3', ai: '#b5e997', edge: '#a2d7fa' }).map(([k, v]) => [k, new THREE.Color(v)]));
  let disposed = false, paused = false, visible = true, lost = false, time = 0, last = 0, pointerX = 0, pointerY = 0, layer = 'data';
  const motion = matchMedia('(prefers-reduced-motion: reduce)'), pointer = matchMedia('(hover: hover) and (pointer: fine)');
  function draw(now = 0) {
    if (disposed || lost) return;
    if (now && !paused && !motion.matches) { if (last) time += Math.min((now - last) / 1000, .05); last = now; }
    const responsive = !paused && !motion.matches;
    character.position.y = Math.sin(time * 1.15) * .045;
    character.rotation.y = Math.sin(time * .35) * .08 + (responsive ? pointerX * .18 : 0);
    head.rotation.y = responsive ? pointerX * .1 : 0; head.rotation.x = responsive ? pointerY * .04 : 0;
    globe.rotation.set(time * .15, time * .27, .14); globe.position.y = 3.52 + Math.sin(time * 1.4) * .07;
    nut.rotation.set(time * .27, time * .44, .3); nut.position.y = 3.13 + Math.sin(time + 2) * .13;
    dust.rotation.y = time * .035; surface.uniforms.uTime.value = time;
    surface.uniforms.uColor.value.lerp(colors[layer], responsive ? .07 : 1);
    renderer.render(scene, camera);
  }
  function sync() {
    last = 0;
    const running = visible && !document.hidden && !paused && !motion.matches && !lost;
    host.dataset.motion = running ? 'running' : 'paused';
    renderer.setAnimationLoop(running ? draw : null);
    if (visible && !document.hidden) draw();
  }
  function resize() { const { width, height } = host.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); draw(); }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }); observer.observe(host);
  function move(e) { if (!pointer.matches) return; const rect = host.getBoundingClientRect(); pointerX = (e.clientX - rect.left) / rect.width - .5; pointerY = (e.clientY - rect.top) / rect.height - .5; }
  function leave() { pointerX = pointerY = 0; }
  function contextLost(e) { e.preventDefault(); lost = true; sync(); onLost(); }
  function contextRestored() { lost = false; resize(); sync(); onReady(); }
  host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave);
  renderer.domElement.addEventListener('webglcontextlost', contextLost); renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  motion.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
  resize(); sync(); onReady();
  return {
    setPaused(value) { paused = value; sync(); },
    setLayer(value) { layer = colors[value] ? value : 'data'; draw(); },
    dispose() {
      disposed = true; renderer.setAnimationLoop(null); observer.disconnect(); resizeObserver.disconnect();
      motion.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync);
      host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost); renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      const geometries = new Set(), materials = new Set();
      scene.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
