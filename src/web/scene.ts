import * as THREE from 'three';

export interface SceneContext {
  scene: THREE.Scene;
  islandMesh: THREE.Mesh;
  ambientLight: THREE.AmbientLight;
  hemiLight: THREE.HemisphereLight;
  dirLight: THREE.DirectionalLight;
  updateLighting: (litCount: number) => void;
}

/**
 * PRNG cố định chỉ dùng cho trang trí hiển thị ở lớp web (không liên quan src/core).
 */
function createWebPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGlowTexture(innerColor: string, midColor: string): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.35, midColor);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function getDefaultLanternPositions(): [number, number][] {
  const positions: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const angleRad = (i * 72 * Math.PI) / 180;
    positions.push([25 * Math.sin(angleRad), 25 * Math.cos(angleRad)]);
  }
  return positions;
}

function isClearOfKeyAreas(x: number, z: number, lanternPositions: [number, number][]): boolean {
  // Tránh bán kính 4m quanh tâm (0, 0)
  if (x * x + z * z < 16) return false;

  // Tránh bán kính 4m quanh mỗi đèn
  for (const [lx, lz] of lanternPositions) {
    const dx = x - lx;
    const dz = z - lz;
    if (dx * dx + dz * dz < 16) return false;
  }

  // Tránh khu vực bến gỗ ở mép -Z (x trong [-5, 5], z < -34)
  if (Math.abs(x) < 5 && z < -34) return false;

  return true;
}

function addSkyMoonAndStars(scene: THREE.Scene, rand: () => number): void {
  // Trăng trên bầu trời đêm
  const moonGroup = new THREE.Group();
  moonGroup.position.set(-45, 55, -75);

  const moonGeo = new THREE.SphereGeometry(5.5, 24, 24);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0xf4f7ff });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonGroup.add(moonMesh);

  const moonGlowTex = createGlowTexture('rgba(220, 235, 255, 0.7)', 'rgba(160, 195, 255, 0.22)');
  const moonGlowMat = new THREE.SpriteMaterial({
    map: moonGlowTex,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  const moonHalo = new THREE.Sprite(moonGlowMat);
  moonHalo.scale.set(28, 28, 1);
  moonGroup.add(moonHalo);

  scene.add(moonGroup);

  // Sao trên bầu trời (THREE.Points)
  const starCount = 420;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(0.15 + rand() * 0.85); // bán cầu trên đường chân trời
    const r = 135 + rand() * 25;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xeaf0ff,
    size: 1.1,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    fog: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
}

function addWoodenPier(scene: THREE.Scene): void {
  const pierGroup = new THREE.Group();
  // Bến gỗ nhỏ ở mép đảo (hướng -Z)
  pierGroup.position.set(0, 0, -39.5);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b472a, roughness: 0.9 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x4d321c, roughness: 0.95 });

  // Hai thanh dầm dọc
  const beamGeo = new THREE.BoxGeometry(0.22, 0.2, 8.2);
  for (const bx of [-1.2, 1.2]) {
    const beam = new THREE.Mesh(beamGeo, postMat);
    beam.position.set(bx, 0.05, -2.8);
    pierGroup.add(beam);
  }

  // Các tấm ván ngang
  const plankGeo = new THREE.BoxGeometry(3.2, 0.12, 0.55);
  for (let i = 0; i < 12; i++) {
    const plank = new THREE.Mesh(plankGeo, woodMat);
    plank.position.set(0, 0.16, 1.0 - i * 0.68);
    pierGroup.add(plank);
  }

  // 4 cọc gỗ ở hai bên bến
  const postGeo = new THREE.CylinderGeometry(0.16, 0.18, 2.2, 8);
  const postCoords: [number, number][] = [
    [-1.55, 0.2],
    [1.55, 0.2],
    [-1.55, -6.2],
    [1.55, -6.2],
  ];
  for (const [px, pz] of postCoords) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(px, 0.35, pz);
    pierGroup.add(post);
  }

  // Đèn cọc trang trí ấm ở đầu bến
  const pierBulbGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const pierBulbMat = new THREE.MeshStandardMaterial({
    color: 0xffbb55,
    emissive: 0xff8822,
    emissiveIntensity: 1.0,
  });
  const pierBulb = new THREE.Mesh(pierBulbGeo, pierBulbMat);
  pierBulb.position.set(1.55, 1.6, -6.2);
  pierGroup.add(pierBulb);

  scene.add(pierGroup);
}

function addIslandDecorations(scene: THREE.Scene, rand: () => number): void {
  const lanternPositions = getDefaultLanternPositions();
  const decorGroup = new THREE.Group();

  const sampleValidPos = (minR: number, maxR: number): [number, number] | null => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const ang = rand() * Math.PI * 2;
      const r = minR + Math.sqrt(rand()) * (maxR - minR);
      const x = r * Math.cos(ang);
      const z = r * Math.sin(ang);
      if (isClearOfKeyAreas(x, z, lanternPositions)) {
        return [x, z];
      }
    }
    return null;
  };

  // 1. 25 cây low-poly (thân trụ + tán nón hoặc tán cầu)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3c24, roughness: 0.95 });
  const coneFoliageMat = new THREE.MeshStandardMaterial({ color: 0x1e4d2b, roughness: 0.85 });
  const sphereFoliageMat = new THREE.MeshStandardMaterial({ color: 0x2a5c34, roughness: 0.85 });

  let treesPlaced = 0;
  let guard = 0;
  while (treesPlaced < 25 && guard < 200) {
    guard++;
    const pos = sampleValidPos(5, 35.5);
    if (!pos) continue;

    const tree = new THREE.Group();
    const scale = 0.8 + rand() * 0.6;
    const isConeTree = rand() < 0.6;

    const trunkH = 1.6 * scale;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, trunkH, 7),
      trunkMat
    );
    trunk.position.y = trunkH / 2;
    tree.add(trunk);

    if (isConeTree) {
      const cone1 = new THREE.Mesh(
        new THREE.ConeGeometry(1.15 * scale, 2.2 * scale, 7),
        coneFoliageMat
      );
      cone1.position.y = trunkH + 0.8 * scale;
      tree.add(cone1);

      const cone2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.85 * scale, 1.7 * scale, 7),
        coneFoliageMat
      );
      cone2.position.y = trunkH + 1.8 * scale;
      tree.add(cone2);
    } else {
      const crown = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.1 * scale, 0),
        sphereFoliageMat
      );
      crown.position.y = trunkH + 0.75 * scale;
      tree.add(crown);
    }

    tree.position.set(pos[0], 0, pos[1]);
    tree.rotation.y = rand() * Math.PI * 2;
    decorGroup.add(tree);
    treesPlaced++;
  }

  // 2. Vài bụi tre (8 bụi)
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0x4d8242, roughness: 0.75 });
  const bambooLeafMat = new THREE.MeshStandardMaterial({ color: 0x3b6e35, roughness: 0.8 });

  for (let b = 0; b < 8; b++) {
    const pos = sampleValidPos(6, 35);
    if (!pos) continue;

    const clump = new THREE.Group();
    const stalks = 4 + Math.floor(rand() * 3);
    for (let s = 0; s < stalks; s++) {
      const h = 2.6 + rand() * 1.8;
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, h, 6), bambooMat);
      const ox = (rand() - 0.5) * 0.7;
      const oz = (rand() - 0.5) * 0.7;
      stalk.position.set(ox, h / 2, oz);
      stalk.rotation.z = (rand() - 0.5) * 0.14;
      stalk.rotation.x = (rand() - 0.5) * 0.14;
      clump.add(stalk);

      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 5), bambooLeafMat);
      leaf.position.set(ox, h - 0.1, oz);
      clump.add(leaf);
    }
    clump.position.set(pos[0], 0, pos[1]);
    decorGroup.add(clump);
  }

  // 3. Đá (14 tảng)
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x5d616b, roughness: 0.95 });
  for (let r = 0; r < 14; r++) {
    const pos = sampleValidPos(5, 37.5);
    if (!pos) continue;
    const size = 0.35 + rand() * 0.55;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), rockMat);
    rock.scale.set(1.2, 0.65, 1.0);
    rock.position.set(pos[0], size * 0.3, pos[1]);
    rock.rotation.set(rand() * 0.5, rand() * Math.PI * 2, rand() * 0.5);
    decorGroup.add(rock);
  }

  // 4. Cụm cỏ (36 cụm)
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x356938, roughness: 0.9 });
  const bladeGeo = new THREE.ConeGeometry(0.12, 0.45, 4);
  for (let g = 0; g < 36; g++) {
    const pos = sampleValidPos(4.5, 35.5);
    if (!pos) continue;
    const tuft = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const blade = new THREE.Mesh(bladeGeo, grassMat);
      blade.position.set((rand() - 0.5) * 0.25, 0.2, (rand() - 0.5) * 0.25);
      blade.rotation.z = (rand() - 0.5) * 0.35;
      tuft.add(blade);
    }
    tuft.position.set(pos[0], 0, pos[1]);
    decorGroup.add(tuft);
  }

  scene.add(decorGroup);
}

export function createScene(): SceneContext {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1226);
  scene.fog = new THREE.FogExp2(0x0d1226, 0.008);

  // 1. Ánh sáng đêm sáng hơn nhưng vẫn giữ không khí đêm cổ tích
  const hemiLight = new THREE.HemisphereLight(0x8899d6, 0x5e412c, 0.85);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0x3a4870, 0.35);
  scene.add(ambientLight);

  // Ánh trăng DirectionalLight trắng xanh 1.2
  const dirLight = new THREE.DirectionalLight(0xdce8ff, 1.2);
  dirLight.position.set(-28, 45, -35);
  scene.add(dirLight);

  // 2. Đảo tròn bán kính 40m: viền cát ấm bên ngoài + mặt cỏ xanh rêu sẫm bên trong
  const sandIslandGeo = new THREE.CylinderGeometry(40, 41.2, 2, 64);
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0xb89c6f,
    roughness: 0.95,
    metalness: 0.05,
  });
  const islandMesh = new THREE.Mesh(sandIslandGeo, sandMat);
  islandMesh.position.set(0, -1, 0);
  scene.add(islandMesh);

  const grassGeo = new THREE.CylinderGeometry(36.8, 37.2, 0.08, 64);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x26442b,
    roughness: 0.92,
    metalness: 0.05,
  });
  const grassMesh = new THREE.Mesh(grassGeo, grassMat);
  grassMesh.position.set(0, -0.02, 0);
  scene.add(grassMesh);

  // 3. Trăng, sao, bến gỗ và trang trí bằng PRNG seed cố định riêng của web
  const decorRand = createWebPrng(202603681);
  addSkyMoonAndStars(scene, decorRand);
  addWoodenPier(scene);
  addIslandDecorations(scene, decorRand);

  const baseBg = new THREE.Color(0x0d1226);
  const litBg = new THREE.Color(0x1b223d);

  const updateLighting = (litCount: number): void => {
    const ratio = Math.min(5, Math.max(0, litCount)) / 5;
    hemiLight.intensity = 0.85 + litCount * 0.22;
    ambientLight.intensity = 0.35 + litCount * 0.14;
    const currentBg = baseBg.clone().lerp(litBg, ratio);
    scene.background = currentBg;
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(currentBg);
    }
  };

  return { scene, islandMesh, ambientLight, hemiLight, dirLight, updateLighting };
}
