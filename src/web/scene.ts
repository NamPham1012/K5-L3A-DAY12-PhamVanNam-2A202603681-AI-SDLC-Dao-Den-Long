import * as THREE from 'three';

export interface SceneContext {
  scene: THREE.Scene;
  islandMesh: THREE.Mesh;
  ambientLight: THREE.AmbientLight;
  dirLight: THREE.DirectionalLight;
}

export function createScene(): SceneContext {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c1a);
  scene.fog = new THREE.FogExp2(0x0a0c1a, 0.015);

  // 1. Ánh sáng môi trường đêm ấm
  const ambientLight = new THREE.AmbientLight(0x223355, 1.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x4466aa, 0.8);
  dirLight.position.set(20, 40, 20);
  scene.add(dirLight);

  // 2. Mặt đảo tròn bán kính 40m
  const islandGeo = new THREE.CylinderGeometry(40, 41, 2, 64);
  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x1e3325,
    roughness: 0.9,
    metalness: 0.1,
  });
  const islandMesh = new THREE.Mesh(islandGeo, islandMat);
  islandMesh.position.set(0, -1, 0);
  scene.add(islandMesh);

  // Mép đảo phát sáng nhẹ gợi ý ranh giới
  const ringGeo = new THREE.RingGeometry(39.8, 40.2, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x335544,
    side: THREE.DoubleSide,
  });
  const borderRing = new THREE.Mesh(ringGeo, ringMat);
  borderRing.rotation.x = -Math.PI / 2;
  borderRing.position.y = 0.02;
  scene.add(borderRing);

  return { scene, islandMesh, ambientLight, dirLight };
}
