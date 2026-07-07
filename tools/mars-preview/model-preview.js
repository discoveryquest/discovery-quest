import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Minimal turntable-free glb viewer for reviewing generated Meshy assets. Loads
// ?model=<url>, centers + frames it, lights it, and holds a gentle 3/4 angle so a
// single screenshot reads the form. Sets window.__ready when the model is on
// screen (a hook for the screenshot helper).
const url = new URLSearchParams(location.search).get('model') || '/mars/meshy/luna.glb';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#2a1a12');
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 100);

scene.add(new THREE.HemisphereLight('#ffffff', '#3a2416', 1.15));
const key = new THREE.DirectionalLight('#fff4e6', 2.2);
key.position.set(3, 5, 4);
scene.add(key);
const rim = new THREE.DirectionalLight('#9ec5ff', 0.6);
rim.position.set(-4, 2, -3);
scene.add(rim);

new GLTFLoader().load(
  url,
  (gltf) => {
    const obj = gltf.scene;
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    camera.position.set(maxDim * 0.9, maxDim * 0.35, maxDim * 2.1);
    camera.lookAt(0, 0, 0);
    scene.add(obj);
    renderer.render(scene, camera);
    window.__ready = true;
  },
  undefined,
  (err) => {
    document.body.innerHTML = `<pre style="color:#f88;padding:20px">LOAD ERROR: ${err}</pre>`;
  },
);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
