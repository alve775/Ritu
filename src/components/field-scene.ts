import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CropId, Irrigation } from '../domain/types';
import { cropGeometry } from './crop-geometry';
import { animateFrame, prefersReducedMotion } from '../lib/motion';

export type FieldView = 'field' | 'crop' | 'soil';

export interface FieldAppearance {
  crop: CropId | null;
  view: FieldView;
  mature: boolean;
  water: Irrigation;
  conflict: boolean;
  orbit: boolean;
}
export type CameraAction = 'left' | 'right' | 'top' | 'reset' | 'in' | 'out';
export interface FieldController {
  update: (appearance: FieldAppearance) => void;
  camera: (action: CameraAction) => void;
  dispose: () => void;
}

function release(group: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((m) =>
        materials.add(m),
      );
      if (object instanceof THREE.InstancedMesh) object.dispose();
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  group.clear();
}

export function createFieldScene(
  host: HTMLElement,
  inspect: () => void,
  lost: () => void,
): FieldController {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor('#f6f8fa');
  renderer.shadowMap.enabled = true;
  // Camera movement does not change the sun or plants: reuse the shadow texture.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const home = new THREE.Vector3(10, 9, 12);
  camera.position.copy(home);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableZoom = false; // Page scrolling always belongs to the document.
  controls.minPolarAngle = 0.05;
  controls.maxPolarAngle = Math.PI / 2.4;
  controls.enabled = false;
  controls.update();
  controls.saveState();
  const world = new THREE.Group();
  const plants = new THREE.Group();
  const study = new THREE.Group();
  scene.add(world, plants, study, new THREE.HemisphereLight('#f7faf0', '#899171', 2));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.position.set(-4, 10, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 });
  sun.shadow.bias = -0.001;
  scene.add(sun);
  const box = (
    width: number,
    height: number,
    depth: number,
    color: string,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color, roughness: 1 }),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    world.add(mesh);
    return mesh;
  };
  box(9.4, 0.5, 6.8, '#97734d', 0, -0.28);
  box(9.4, 0.08, 6.8, '#b29563', 0, 0);
  const field = box(8.3, 0.05, 5.7, '#806744', 0.1, 0.07);
  box(0.45, 0.09, 6.3, '#8c7650', -4.1, 0.06);
  const canal = box(0.28, 0.045, 6.15, '#769fa0', -4.1, 0.12);
  for (let row = 0; row < 13; row++)
    box(7.9, 0.06, 0.11, '#9b7a4e', 0.15, 0.13, -2.55 + row * 0.42);
  // A normalized field layout, not a surveyed parcel or physical crop model.
  const floor = box(28, 0.04, 25, '#f0f3f5', 0, -0.58);
  floor.castShadow = false;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = { x: 0, y: 0 };
  let disposed = false;
  let orbit = false;
  let view: FieldView = 'field';
  let plantKey = '';
  let contextLost = false;
  let frame = 0;
  let stopCamera = () => {};
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let settleCamera = () => {};
  const onMotionChange = () => {
    if (prefersReducedMotion()) settleCamera();
  };
  motionPreference.addEventListener('change', onMotionChange);
  document.addEventListener('ritu-motion-change', onMotionChange);
  function travel(position: THREE.Vector3, target = controls.target.clone()) {
    stopCamera();
    const from = camera.position.clone();
    const fromTarget = controls.target.clone();
    settleCamera = () => {
      stopCamera();
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      requestDraw();
    };
    stopCamera = animateFrame(
      520,
      (progress) => {
        camera.position.lerpVectors(from, position, progress);
        controls.target.lerpVectors(fromTarget, target, progress);
        controls.update();
        requestDraw();
      },
      () => {
        settleCamera = () => {};
      },
    );
  }
  function draw() {
    frame = 0;
    if (!disposed && !contextLost) renderer.render(scene, camera);
  }
  function requestDraw() {
    if (!disposed && !contextLost && !frame) frame = requestAnimationFrame(draw);
  }
  controls.addEventListener('change', requestDraw);
  const observer = new ResizeObserver(() => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestDraw();
  });
  observer.observe(host);
  const onDown = (event: PointerEvent) => {
    stopCamera();
    settleCamera = () => {};
    down = { x: event.clientX, y: event.clientY };
  };
  const onUp = (event: PointerEvent) => {
    if (orbit || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.intersectObjects(view === 'field' ? [field, plants] : [study], true).length)
      inspect();
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    stopCamera();
    controls.enabled = false;
    lost();
  };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);
  renderer.domElement.addEventListener('webglcontextlost', onLost);

  function addPlants(crop: CropId, mature: boolean) {
    const prototype = cropGeometry(crop, mature, false);
    prototype.updateMatrixWorld(true);
    const batches = new Map<
      string,
      { geometry: THREE.BufferGeometry; material: THREE.Material; matrices: THREE.Matrix4[] }
    >();
    prototype.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = object.material as THREE.Material;
      const key = object.geometry.uuid + material.uuid;
      const batch = batches.get(key) ?? {
        geometry: object.geometry,
        material,
        matrices: [] as THREE.Matrix4[],
      };
      batch.matrices.push(object.matrixWorld.clone());
      batches.set(key, batch);
    });
    const count = 18 * 10;
    const placement = new THREE.Object3D();
    const matrix = new THREE.Matrix4();
    for (const batch of batches.values()) {
      const mesh = new THREE.InstancedMesh(
        batch.geometry,
        batch.material,
        count * batch.matrices.length,
      );
      let index = 0;
      for (let i = 0; i < count; i++) {
        placement.position.set(-3.45 + (i % 18) * 0.41, 0.17, -2.35 + Math.floor(i / 18) * 0.5);
        placement.scale.setScalar(0.62 + ((i * 7) % 5) * 0.015);
        placement.rotation.y = ((i * 13) % 17) * 0.12;
        placement.updateMatrix();
        for (const local of batch.matrices)
          mesh.setMatrixAt(index++, matrix.multiplyMatrices(placement.matrix, local));
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      plants.add(mesh);
    }
    // Mesh ownership transfers into the instanced batches; do not dispose shared shapes here.
    prototype.clear();
  }
  function addStudy(crop: CropId | null, mature: boolean, cutaway: boolean) {
    const soil = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, cutaway ? 0.6 : 0.12, cutaway ? 1.1 : 2),
      new THREE.MeshStandardMaterial({ color: '#98744d', roughness: 1 }),
    );
    soil.position.set(0, cutaway ? -0.3 : -0.06, cutaway ? -0.55 : 0);
    soil.receiveShadow = true;
    soil.castShadow = true;
    study.add(soil);
    if (crop && crop !== 'fallow') {
      const model = cropGeometry(crop, mature);
      const underground = model.getObjectByName('underground');
      if (underground) underground.visible = cutaway;
      study.add(model);
    }
  }
  return {
    update(appearance) {
      orbit = appearance.orbit;
      controls.enabled = orbit && !contextLost;
      renderer.domElement.style.touchAction = orbit ? 'none' : 'pan-y';
      renderer.domElement.style.cursor = orbit ? 'grab' : 'pointer';
      (field.material as THREE.MeshStandardMaterial).color.set(
        appearance.conflict ? '#ae7d65' : '#806744',
      );
      (canal.material as THREE.MeshStandardMaterial).color.set(
        appearance.water === 'rainfed'
          ? '#ac9472'
          : appearance.water === 'unknown'
            ? '#b2a36a'
            : appearance.water === 'limited'
              ? '#8eafa9'
              : '#6e9fa3',
      );
      if (view !== appearance.view) {
        view = appearance.view;
        const target = new THREE.Vector3(0, view === 'field' ? 0 : 0.4, 0);
        if (view === 'field') home.set(10, 9, 12);
        else home.set(2.8, 2.1, 3.5);
        travel(home.clone(), target);
      }
      world.visible = view === 'field';
      plants.visible = view === 'field';
      study.visible = view !== 'field';
      const key = `${appearance.crop}:${appearance.mature}:${appearance.conflict}:${view}`;
      if (key !== plantKey) {
        renderer.shadowMap.needsUpdate = true;
        plantKey = key;
        release(plants);
        release(study);
        if (
          !appearance.conflict &&
          appearance.crop &&
          appearance.crop !== 'fallow' &&
          view === 'field'
        )
          addPlants(appearance.crop, appearance.mature);
        if (view !== 'field')
          addStudy(
            appearance.conflict ? null : appearance.crop,
            appearance.mature,
            view === 'soil',
          );
      }
      requestDraw();
    },
    camera(action) {
      const destination = camera.position.clone();
      if (action === 'reset') {
        travel(home.clone(), new THREE.Vector3(0, view === 'field' ? 0 : 0.4, 0));
        return;
      } else if (action === 'top') {
        destination.set(0.1, view === 'field' ? 17 : 4.5, 0.1);
      } else if (action === 'left' || action === 'right')
        destination
          .sub(controls.target)
          .applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            action === 'left' ? -Math.PI / 8 : Math.PI / 8,
          )
          .add(controls.target);
      else
        destination
          .sub(controls.target)
          .multiplyScalar(
            action === 'in'
              ? Math.max(0.85, (view === 'field' ? 12 : 2.2) / camera.position.length())
              : Math.min(1.15, (view === 'field' ? 27 : 8) / camera.position.length()),
          )
          .add(controls.target);
      travel(destination);
    },
    dispose() {
      disposed = true;
      stopCamera();
      motionPreference.removeEventListener('change', onMotionChange);
      document.removeEventListener('ritu-motion-change', onMotionChange);
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.removeEventListener('change', requestDraw);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      release(world);
      release(plants);
      release(study);
      sun.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
