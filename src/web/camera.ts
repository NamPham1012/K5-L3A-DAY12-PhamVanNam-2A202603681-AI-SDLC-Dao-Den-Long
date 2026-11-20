import * as THREE from 'three';
import { Vec3 } from '../core/entities.js';

export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(0, 5, 10);
  return camera;
}

export function updateFollowCamera(
  camera: THREE.PerspectiveCamera,
  playerPos: Vec3,
  yawDeg: number
): void {
  const distance = 8.0;
  const height = 4.0;
  const rad = (yawDeg * Math.PI) / 180;

  // Camera is behind player: offset by -yaw direction
  const camX = playerPos[0] - distance * Math.sin(rad);
  const camZ = playerPos[2] - distance * Math.cos(rad);
  const camY = playerPos[1] + height;

  camera.position.set(camX, camY, camZ);
  camera.lookAt(playerPos[0], playerPos[1] + 1.2, playerPos[2]);
}
