import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// A real-time studio sculpture. Its geometry, lighting and camera all live here.
export function createCinematic(host, onReady, onLost) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  const compact = innerWidth < 700 || matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? 1.25 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .86;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#101813');
  scene.fog = new THREE.FogExp2('#101813', .04);
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 70);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .035);
  scene.environment = environment.texture; scene.environmentIntensity = .62;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#e8e4d8', '#080e0b', .38));
  const key = new THREE.SpotLight('#fff1d9', 65, 30, .48, .8, 1.5);
  key.position.set(-3.5, 7, 4); key.target.position.set(0, 1.8, 0); key.castShadow = true;
  const shadowSize = compact ? 512 : 1024;
  key.shadow.mapSize.set(shadowSize, shadowSize); key.shadow.bias = -.0003; key.shadow.normalBias = .035;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#d8e3c9', 1.8); rim.position.set(3, 4, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight('#b9ccd5', .65); fill.position.set(-4, 2, -1); scene.add(fill);
  const coreLight = new THREE.PointLight('#e5edcb', 1.5, 4, 2); coreLight.position.set(0, 2.25, .3); scene.add(coreLight);
  const silver = new THREE.MeshPhysicalMaterial({ color: '#aab9b3', metalness: 1, roughness: .22, clearcoat: .7, clearcoatRoughness: .17 });
  const sage = new THREE.MeshPhysicalMaterial({ color: '#8caa78', metalness: .72, roughness: .26, clearcoat: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: '#15241d', metalness: .65, roughness: .32 });
  const pearl = new THREE.MeshPhysicalMaterial({ color: '#eee9d5', metalness: .25, roughness: .25, clearcoat: 1, emissive: '#cdd8aa', emissiveIntensity: .16 });
  const lightMaterial = new THREE.MeshStandardMaterial({ color: '#d3ef9e', emissive: '#c8f58a', emissiveIntensity: 2.4 });
  const add = (geometry, material, parent = scene) => {
    const object = new THREE.Mesh(geometry, material); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  };
  const stone = new THREE.MeshStandardMaterial({ color: '#101b13', roughness: .85, metalness: .08, envMapIntensity: .35 });
  const trim = new THREE.MeshStandardMaterial({ color: '#66634b', roughness: .4, metalness: .8 });
  const architecturalLight = new THREE.MeshStandardMaterial({ color: '#c4dc9d', emissive: '#a5bf7d', emissiveIntensity: .8 });
  const floor = add(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: '#0c140f', roughness: .75, metalness: .12, envMapIntensity: .4 }));
  floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  // A built environment frames the installation: a ribbed gallery, arches, and inlaid stone.
  const gallery = new THREE.Group(); scene.add(gallery);
  const wall = add(new RoundedBoxGeometry(24, 6, .35, 3, .12), stone, gallery); wall.position.set(0, 3, -4.5);
  for (let i = 0; i < 29; i++) {
    const rib = add(new RoundedBoxGeometry(.055, 5.9, .12, 2, .02), trim, gallery);
    rib.position.set(-9.8 + i * .7, 2.95, -4.25);
  }
  const arch = add(new THREE.TorusGeometry(3.45, .18, 16, 112, Math.PI), stone, gallery); arch.position.set(0, .06, -3);
  const archTrim = add(new THREE.TorusGeometry(3.26, .018, 8, 112, Math.PI), architecturalLight, gallery); archTrim.position.set(0, .06, -2.98);
  const outerArch = add(new THREE.TorusGeometry(4.2, .055, 12, 112, Math.PI), trim, gallery); outerArch.position.set(0, .06, -3.5);
  for (let i = 0; i < 3; i++) {
    const inlay = add(new THREE.TorusGeometry(2.45 + i * .8, .011, 6, 128), trim, gallery);
    inlay.rotation.x = -Math.PI / 2; inlay.position.y = .012; inlay.castShadow = false;
  }
  for (let i = 0; i < 3; i++) {
    const height = .65 + i * .55;
    const column = add(new RoundedBoxGeometry(.55, height, .7, 3, .06), stone, gallery);
    column.position.set(-3.4 - i * .65, height / 2, -1.6 - i * .25);
    const cap = add(new RoundedBoxGeometry(.56, .035, .71, 2, .012), trim, gallery);
    cap.position.set(column.position.x, height + .015, column.position.z);
  }
  const satelliteStand = add(new THREE.CylinderGeometry(.65, .7, .9, 64), stone, gallery); satelliteStand.position.set(3.65, .45, -1.6);
  const satellite = add(new THREE.SphereGeometry(.44, 32, 24), sage, gallery); satellite.position.set(3.65, 1.34, -1.6);
  const satelliteRing = add(new THREE.TorusGeometry(.58, .028, 12, 80), silver, gallery); satelliteRing.position.copy(satellite.position); satelliteRing.rotation.set(.9, .4, -.4);
  const galleryWash = new THREE.SpotLight('#e4ddc4', 12, 15, .8, 1, 1.5);
  galleryWash.position.set(-4, 4, 0); galleryWash.target.position.set(0, 2, -4); scene.add(galleryWash, galleryWash.target);
  const floorMarkers = [0, 1, 2].map(i => {
    const marker = add(new THREE.SphereGeometry(.03, 12, 8), architecturalLight, gallery); marker.castShadow = false; return marker;
  });
  // The gallery is static. Batch it so architectural detail doesn't cost a draw per rib.
  const galleryBatches = new Map();
  for (const object of [...gallery.children]) {
    if (!object.isMesh || object === satelliteRing || floorMarkers.includes(object)) continue;
    object.updateMatrix();
    const geometry = (object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()).applyMatrix4(object.matrix);
    const id = `${object.material.uuid}:${object.castShadow}`;
    const batch = galleryBatches.get(id) || { material: object.material, shadow: object.castShadow, geometries: [] };
    batch.geometries.push(geometry); galleryBatches.set(id, batch);
    gallery.remove(object); object.geometry.dispose();
  }
  for (const batch of galleryBatches.values()) {
    const combined = add(mergeGeometries(batch.geometries), batch.material, gallery);
    combined.castShadow = batch.shadow;
    batch.geometries.forEach(geometry => geometry.dispose());
  }
  const plinth = add(new THREE.CylinderGeometry(1.82, 1.9, .28, 96), dark); plinth.position.y = .14;
  const top = add(new THREE.CylinderGeometry(1.73, 1.73, .022, 96), silver); top.position.y = .29;
  const inset = add(new THREE.CylinderGeometry(1.68, 1.68, .035, 96), dark); inset.position.y = .32;
  const pedestalLine = add(new THREE.TorusGeometry(1.83, .012, 8, 128), lightMaterial); pedestalLine.rotation.x = Math.PI / 2; pedestalLine.position.y = .19;
  const sculpture = new THREE.Group(); sculpture.position.y = 2.15; scene.add(sculpture);
  // Beveled annular sections catch long softbox highlights instead of faceted edges.
  const shape = new THREE.Shape(); shape.absarc(0, 0, 1.24, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, 1.02, 0, Math.PI * 2, true); shape.holes.push(hole);
  const ringGeometry = new THREE.ExtrudeGeometry(shape, { depth: .18, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: .045, bevelThickness: .045, curveSegments: 96 });
  ringGeometry.center();
  const rings = [silver, sage, silver].map((material, i) => {
    const pivot = new THREE.Group(); sculpture.add(pivot);
    const ring = add(ringGeometry, material, pivot);
    ring.scale.setScalar(1 - i * .14);
    return pivot;
  });
  const core = add(new THREE.SphereGeometry(.43, 48, 32), pearl, sculpture);
  const collar = add(new THREE.TorusGeometry(.51, .018, 12, 96), silver, sculpture); collar.rotation.x = 1.2;
  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(54 * 3);
  for (let i = 0; i < 54; i++) { dustPositions[i * 3] = Math.sin(i * 13.4) * 4; dustPositions[i * 3 + 1] = .5 + ((i * 17) % 53) / 12; dustPositions[i * 3 + 2] = Math.cos(i * 8.3) * 3 - 2; }
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: '#c9e6ac', size: .018, transparent: true, opacity: .45, depthWrite: false })); scene.add(dust);
  const renderTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: compact ? 2 : 4 });
  const composer = new EffectComposer(renderer, renderTarget);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .14, .5, 1.3);
  composer.addPass(bloom); const output = new OutputPass(); composer.addPass(output);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false, lost = false, visible = false, paused = false, time = 0, last = 0;
  let expanded = false, expansion = 0, orbit = .2, orbitTarget = .2, dragging = false, pointerId = null, pointerX = 0;
  let frame = 0, width = 1, height = 1;
  function draw(now = 0) {
    if (disposed || lost) return;
    const dt = now && !paused && !motion.matches ? Math.min((now - (last || now)) / 1000, .05) : 0;
    last = now; time += dt;
    const blend = dt ? 1 - Math.exp(-4 * dt) : 1;
    expansion += ((expanded ? 1 : 0) - expansion) * blend;
    orbit += (orbitTarget - orbit) * blend;
    const angle = orbit + Math.sin(time * .12) * .13;
    const distance = width / height < 1 ? 13.8 : 10.2;
    camera.position.set(Math.sin(angle) * distance, 3.25 + Math.sin(time * .19) * .08, Math.cos(angle) * distance);
    camera.lookAt(0, 1.75, 0);
    sculpture.position.y = 2.15 + Math.sin(time * .65) * .065;
    sculpture.rotation.y = Math.sin(time * .18) * .18;
    rings[0].rotation.set(.28 + expansion * .2, -.48, -.35 + Math.sin(time * .25) * .04);
    rings[1].rotation.set(.92, .85 + expansion * .22, .58);
    rings[2].rotation.set(-.65, -.8, -.4 - expansion * .4);
    rings.forEach((ring, i) => { ring.position.x = (i - 1) * expansion * 1.28; ring.position.y = (i === 1 ? .65 : -.1) * expansion; });
    core.scale.setScalar(1 + Math.sin(time * .9) * .025);
    dust.rotation.y = time * .012;
    galleryWash.target.position.x = Math.sin(time * .16) * 2;
    satelliteRing.rotation.y = .4 + Math.sin(time * .3) * .18;
    floorMarkers.forEach((marker, i) => { const angle = time * .09 + i * Math.PI * 2 / 3; marker.position.set(Math.cos(angle) * 3.25, .025, Math.sin(angle) * 3.25); });
    composer.render();
    host.dataset.frame = String(Math.round(time * 1000)); host.dataset.expansion = expansion.toFixed(2); host.dataset.orbit = orbit.toFixed(3);
  }
  function tick(now) { frame = requestAnimationFrame(tick); if (now - last < 32) return; draw(now); }
  function sync() {
    cancelAnimationFrame(frame); last = 0;
    const running = visible && !document.hidden && !paused && !motion.matches && !lost;
    host.dataset.motion = running ? 'running' : 'paused';
    if (visible && !document.hidden) draw();
    if (running) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const rect = host.getBoundingClientRect(); width = rect.width; height = rect.height;
    if (!width || !height) return;
    renderer.setSize(width, height, false); composer.setSize(width, height);
    camera.aspect = width / height; camera.updateProjectionMatrix(); draw();
  }
  function down(event) { if (event.button !== 0) return; dragging = true; pointerId = event.pointerId; pointerX = event.clientX; host.setPointerCapture(event.pointerId); host.dataset.dragging = 'true'; }
  function move(event) { if (!dragging) return; orbitTarget = THREE.MathUtils.clamp(orbitTarget + (event.clientX - pointerX) * .006, -1.1, 1.1); pointerX = event.clientX; if (paused || motion.matches) draw(); }
  function up() { dragging = false; delete host.dataset.dragging; if (pointerId !== null && host.hasPointerCapture(pointerId)) host.releasePointerCapture(pointerId); pointerId = null; }
  function contextLost(event) { event.preventDefault(); lost = true; sync(); onLost(); }
  function contextRestored() { lost = false; resize(); sync(); onReady(); }
  // Rapid viewport changes can deliver multiple entries together; use the newest.
  const observer = new IntersectionObserver(entries => { visible = entries.at(-1).isIntersecting; sync(); }); observer.observe(host);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  motion.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
  host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move); host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up); host.addEventListener('lostpointercapture', up);
  renderer.domElement.addEventListener('webglcontextlost', contextLost); renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  host.append(renderer.domElement); resize(); onReady();
  return {
    setExpanded(value) { expanded = value; if (paused || motion.matches) draw(); },
    setPaused(value) { paused = value; sync(); },
    rotate(direction) { orbitTarget = THREE.MathUtils.clamp(orbitTarget + direction * .18, -1.1, 1.1); if (paused || motion.matches) draw(); },
    resetView() { orbitTarget = .2; if (paused || motion.matches) draw(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect();
      motion.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync);
      host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move); host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', up); host.removeEventListener('lostpointercapture', up);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost); renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      const geometries = new Set(), materials = new Set(); scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
      key.shadow.dispose(); bloom.dispose(); output.dispose(); composer.dispose(); environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
