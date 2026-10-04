import * as THREE from 'three';
import type { CropId } from '../domain/types';
import { cropModelNotes } from '../data/crop-models';

// Original schematic geometry. Relative proportions are artistic, not field measurements.
export function cropGeometry(crop: CropId, mature: boolean, belowGround = true): THREE.Group {
  const group = new THREE.Group();
  if (!cropModelNotes[crop] || crop === 'fallow') return group;
  const stemMaterial = new THREE.MeshStandardMaterial({ color: '#527039', roughness: 0.85 });
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: '#658b3d',
    side: THREE.DoubleSide,
    roughness: 0.8,
  });
  const grainMaterial = new THREE.MeshStandardMaterial({ color: '#c7a151', roughness: 0.9 });
  const rootMaterial = new THREE.MeshStandardMaterial({ color: '#c5a77a', roughness: 1 });
  const stemShape = new THREE.CylinderGeometry(1, 1, 1, 5);
  const seedShape = new THREE.SphereGeometry(1, 7, 5);
  const leafletShape = new THREE.SphereGeometry(1, 8, 5);
  const blade = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const triangles: number[] = [];
  for (let i = 0; i <= 7; i++) {
    const t = i / 7;
    const width = Math.sin(Math.PI * t) * 0.5;
    vertices.push(-width, t - 0.15 * t * t, 0.55 * t * t, width, t - 0.15 * t * t, 0.55 * t * t);
    if (i < 7) {
      const n = i * 2;
      triangles.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  blade.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  blade.setIndex(triangles);
  blade.computeVertexNormals();
  const put = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: THREE.Vector3,
    scale: THREE.Vector3,
  ) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.scale.copy(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const segment = (a: THREE.Vector3, b: THREE.Vector3, radius: number, material = stemMaterial) => {
    const delta = b.clone().sub(a);
    const mesh = put(
      stemShape,
      material,
      a.clone().add(b).multiplyScalar(0.5),
      new THREE.Vector3(radius, delta.length(), radius),
    );
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    return mesh;
  };
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const cereal = ['boro', 'aman', 'wheat'].includes(crop);
  const rice = crop === 'boro' || crop === 'aman';
  const height = mature ? (cereal ? 1.25 : 0.82) : 0.45;
  if (cereal) {
    const shoots = rice ? 3 : 2;
    for (let shoot = 0; shoot < shoots; shoot++) {
      const angle = shoot * 2.4;
      const base = v(Math.cos(angle) * 0.045, 0, Math.sin(angle) * 0.045);
      const tip = base.clone().add(v(Math.cos(angle) * 0.075, height * (1 - shoot * 0.05), 0));
      segment(base, tip, 0.012);
      for (let leaf = 0; leaf < 3; leaf++) {
        const mesh = put(
          blade,
          leafMaterial,
          base.clone().lerp(tip, 0.23 + leaf * 0.23),
          v(0.085, height * 0.65, height * 0.65),
        );
        mesh.rotation.y = angle + leaf * 2.1;
        mesh.rotation.z = Math.cos(angle + leaf) * 0.35;
      }
      if (mature && rice) {
        const apex = tip.clone().add(v(0.16, 0.23, 0.01));
        segment(tip, apex, 0.01, grainMaterial);
        for (let branch = 0; branch < 5; branch++) {
          const start = tip.clone().lerp(apex, 0.15 + branch * 0.15);
          const side = branch % 2 ? -1 : 1;
          const end = start.clone().add(v(side * 0.12, 0.055, ((branch % 3) - 1) * 0.08));
          segment(start, end, 0.006, grainMaterial);
          for (let grain = 1; grain <= 3; grain++) {
            const point = start
              .clone()
              .lerp(end, grain / 3)
              .add(v(0, -0.025, 0));
            put(seedShape, grainMaterial, point, v(0.025, 0.048, 0.021)).rotation.z = side * 0.35;
          }
        }
      } else if (mature) {
        const apex = tip.clone().add(v(0, 0.3, 0));
        segment(tip, apex, 0.012, grainMaterial);
        for (let grain = 0; grain < 7; grain++) {
          for (const side of [-1, 1]) {
            const point = tip.clone().add(v(side * 0.035, 0.03 + grain * 0.035, 0));
            put(seedShape, grainMaterial, point, v(0.036, 0.045, 0.027)).rotation.z = side * -0.45;
            segment(point, point.clone().add(v(side * 0.035, 0.12, 0)), 0.003, grainMaterial);
          }
        }
      }
    }
  } else {
    segment(v(0, 0, 0), v(0, height, 0), 0.023);
    for (let level = 0; level < 3; level++) {
      for (const side of [-1, 1]) {
        const start = v(0, height * (0.25 + level * 0.22), 0);
        const tip = start.clone().add(v(side * 0.22, 0.1, (level % 2 ? -1 : 1) * 0.06));
        segment(start, tip, 0.009);
        const leaflets = crop === 'mung' ? 3 : 5;
        for (let leaflet = 0; leaflet < leaflets; leaflet++) {
          const angle =
            leaflet === 0 ? 0 : (leaflet % 2 ? 1 : -1) * (0.8 + Math.floor(leaflet / 2) * 0.4);
          const point = tip
            .clone()
            .add(v(side * Math.cos(angle) * 0.085, 0.015, Math.sin(angle) * 0.1));
          const leaf = put(leafletShape, leafMaterial, point, v(0.115, 0.018, 0.07));
          leaf.rotation.y = -angle * side;
          leaf.rotation.z = side * 0.18;
        }
        if (mature && crop === 'mung' && level > 0) {
          for (let pod = 0; pod < 2; pod++) {
            const startPod = tip.clone().add(v(side * 0.025 * pod, 0.02, pod * 0.045));
            segment(
              startPod,
              startPod.clone().add(v(side * 0.08, -0.23, 0.02)),
              0.018,
              grainMaterial,
            );
          }
        }
      }
    }
  }
  const underground = new THREE.Group();
  underground.name = 'underground';
  for (let root = 0; belowGround && root < 7; root++) {
    const angle = root * 0.91;
    const point = v(Math.cos(angle) * 0.22, -0.25 - root * 0.025, Math.sin(angle) * 0.22);
    const mesh = segment(v(0, 0, 0), point, 0.007, rootMaterial);
    group.remove(mesh);
    underground.add(mesh);
  }
  if (belowGround && mature && crop === 'potato') {
    for (let tuber = 0; tuber < 3; tuber++) {
      const angle = tuber * 2.2;
      const start = v(0, -0.08, 0);
      const point = v(Math.cos(angle) * 0.32, -0.14 - tuber * 0.055, Math.sin(angle) * 0.3);
      const stolon = segment(start, point, 0.012, rootMaterial);
      group.remove(stolon);
      underground.add(stolon);
      const potato = put(seedShape, grainMaterial, point, v(0.14, 0.09, 0.1));
      group.remove(potato);
      underground.add(potato);
    }
  }
  group.add(underground);
  // Unused shapes/materials do not belong to a renderer yet, but still release their CPU-side records.
  const usedGeometry = new Set<THREE.BufferGeometry>();
  const usedMaterial = new Set<THREE.Material>();
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      usedGeometry.add(object.geometry);
      usedMaterial.add(object.material as THREE.Material);
    }
  });
  [stemShape, seedShape, leafletShape, blade].forEach((geometry) => {
    if (!usedGeometry.has(geometry)) geometry.dispose();
  });
  [stemMaterial, leafMaterial, grainMaterial, rootMaterial].forEach((material) => {
    if (!usedMaterial.has(material)) material.dispose();
  });
  return group;
}
