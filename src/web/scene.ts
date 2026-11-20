import * as THREE from 'three';
import { NightMap } from '../core/maps/index.js';

export interface SceneContext {
  scene: THREE.Scene;
  ambientLight: THREE.AmbientLight;
  hemiLight: THREE.HemisphereLight;
  dirLight: THREE.DirectionalLight;
  loadMap: (map: NightMap) => void;
  updateLighting: (litCount: number, totalLanterns: number) => void;
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

function addSkyMoonAndStars(scene: THREE.Scene, rand: () => number): void {
  // Trăng trên bầu trời đêm
  const moonGroup = new THREE.Group();
  moonGroup.position.set(-45, 55, -75);

  const moonGeo = new THREE.SphereGeometry(5.5, 24, 24);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0xf4f7ff });
  moonGroup.add(new THREE.Mesh(moonGeo, moonMat));

  const moonGlowTex = createGlowTexture('rgba(220, 235, 255, 0.7)', 'rgba(160, 195, 255, 0.22)');
  const moonHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: moonGlowTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    })
  );
  moonHalo.scale.set(28, 28, 1);
  moonGroup.add(moonHalo);
  scene.add(moonGroup);

  // Sao (THREE.Points)
  const starCount = 420;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(0.15 + rand() * 0.85);
    const r = 145 + rand() * 25;
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
  scene.add(new THREE.Points(starGeo, starMat));

  // Biển mây phía dưới Y = -10.5 (#12384A)
  const cloudSeaGeo = new THREE.PlaneGeometry(500, 500);
  const cloudSeaMat = new THREE.MeshStandardMaterial({
    color: 0x12384a,
    roughness: 0.95,
    metalness: 0.05,
  });
  const cloudSea = new THREE.Mesh(cloudSeaGeo, cloudSeaMat);
  cloudSea.rotation.x = -Math.PI / 2;
  cloudSea.position.y = -10.5;
  scene.add(cloudSea);
}

function addJumpPadVisual(parent: THREE.Group, pos: [number, number, number], radius: number): void {
  const padGroup = new THREE.Group();
  padGroup.position.set(pos[0], pos[1], pos[2]);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.1, 0.22, 20),
    new THREE.MeshStandardMaterial({
      color: 0xf2c14e,
      emissive: 0xd99b26,
      emissiveIntensity: 0.65,
      roughness: 0.35,
    })
  );
  base.position.y = 0.11;
  padGroup.add(base);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.85, 0.07, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe9b0 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.26;
  padGroup.add(ring);

  parent.add(padGroup);
}

function addRoundIsland(
  parent: THREE.Group,
  cx: number,
  cz: number,
  radius: number,
  sandMat: THREE.Material,
  grassMat: THREE.Material
): void {
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + 1.2, 2, 56), sandMat);
  sand.position.set(cx, -1, cz);
  parent.add(sand);

  const grassR = Math.max(2, radius - 2.8);
  const grass = new THREE.Mesh(new THREE.CylinderGeometry(grassR, grassR + 0.4, 0.08, 56), grassMat);
  grass.position.set(cx, -0.02, cz);
  parent.add(grass);
}

function addWoodenPier(parent: THREE.Group): void {
  const pierGroup = new THREE.Group();
  pierGroup.position.set(0, 0, -39.5);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.9 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x4d321c, roughness: 0.95 });

  const beamGeo = new THREE.BoxGeometry(0.22, 0.2, 8.2);
  for (const bx of [-1.2, 1.2]) {
    const beam = new THREE.Mesh(beamGeo, postMat);
    beam.position.set(bx, 0.05, -2.8);
    pierGroup.add(beam);
  }

  const plankGeo = new THREE.BoxGeometry(3.2, 0.12, 0.55);
  for (let i = 0; i < 12; i++) {
    const plank = new THREE.Mesh(plankGeo, woodMat);
    plank.position.set(0, 0.16, 1.0 - i * 0.68);
    pierGroup.add(plank);
  }

  const postGeo = new THREE.CylinderGeometry(0.16, 0.18, 2.2, 8);
  for (const [px, pz] of [
    [-1.55, 0.2],
    [1.55, 0.2],
    [-1.55, -6.2],
    [1.55, -6.2],
  ]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(px, 0.35, pz);
    pierGroup.add(post);
  }

  const pierBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffb347,
      emissive: 0xff8822,
      emissiveIntensity: 1.0,
    })
  );
  pierBulb.position.set(1.55, 1.6, -6.2);
  pierGroup.add(pierBulb);

  parent.add(pierGroup);
}

function addNight1Decorations(parent: THREE.Group, map: NightMap, rand: () => number): void {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.95 });
  const coneFoliageMat = new THREE.MeshStandardMaterial({ color: 0x1e4d3b, roughness: 0.85 });
  const sphereFoliageMat = new THREE.MeshStandardMaterial({ color: 0x2a5c46, roughness: 0.85 });

  const isClear = (x: number, z: number): boolean => {
    if (x * x + z * z < 16) return false;
    for (const l of map.lanterns) {
      const dx = x - l.pos[0];
      const dz = z - l.pos[2];
      if (dx * dx + dz * dz < 16) return false;
    }
    if (Math.abs(x) < 5 && z < -34) return false;
    return true;
  };

  const samplePos = (minR: number, maxR: number): [number, number] | null => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const ang = rand() * Math.PI * 2;
      const r = minR + Math.sqrt(rand()) * (maxR - minR);
      const x = r * Math.cos(ang);
      const z = r * Math.sin(ang);
      if (isClear(x, z)) return [x, z];
    }
    return null;
  };

  // 25 cây low-poly
  let placed = 0;
  let guard = 0;
  while (placed < 25 && guard < 200) {
    guard++;
    const pos = samplePos(5, 35.5);
    if (!pos) continue;
    const tree = new THREE.Group();
    const scale = 0.8 + rand() * 0.6;
    const trunkH = 1.6 * scale;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, trunkH, 7),
      trunkMat
    );
    trunk.position.y = trunkH / 2;
    tree.add(trunk);

    if (rand() < 0.6) {
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.15 * scale, 2.2 * scale, 7), coneFoliageMat);
      c1.position.y = trunkH + 0.8 * scale;
      tree.add(c1);
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.85 * scale, 1.7 * scale, 7), coneFoliageMat);
      c2.position.y = trunkH + 1.8 * scale;
      tree.add(c2);
    } else {
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1 * scale, 0), sphereFoliageMat);
      crown.position.y = trunkH + 0.75 * scale;
      tree.add(crown);
    }
    tree.position.set(pos[0], 0, pos[1]);
    tree.rotation.y = rand() * Math.PI * 2;
    parent.add(tree);
    placed++;
  }

  // 8 bụi tre + 14 tảng đá
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0x4d8242, roughness: 0.75 });
  for (let b = 0; b < 8; b++) {
    const pos = samplePos(6, 35);
    if (!pos) continue;
    const clump = new THREE.Group();
    for (let s = 0; s < 5; s++) {
      const h = 2.6 + rand() * 1.6;
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, h, 6), bambooMat);
      stalk.position.set((rand() - 0.5) * 0.6, h / 2, (rand() - 0.5) * 0.6);
      clump.add(stalk);
    }
    clump.position.set(pos[0], 0, pos[1]);
    parent.add(clump);
  }

  const rockMat = new THREE.MeshStandardMaterial({ color: 0x5d616b, roughness: 0.95 });
  for (let r = 0; r < 14; r++) {
    const pos = samplePos(5, 37.5);
    if (!pos) continue;
    const size = 0.35 + rand() * 0.5;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), rockMat);
    rock.scale.set(1.2, 0.65, 1.0);
    rock.position.set(pos[0], size * 0.3, pos[1]);
    parent.add(rock);
  }
}

function buildNight2Geometry(
  parent: THREE.Group,
  map: NightMap,
  sandMat: THREE.Material,
  grassMat: THREE.Material
): void {
  // 2 đảo tròn bán kính 28 m tại tâm A (0,0,0) và B (70,0,0)
  addRoundIsland(parent, 0, 0, 28, sandMat, grassMat);
  addRoundIsland(parent, 70, 0, 28, sandMat, grassMat);

  // Cầu tre nối x ∈ [26, 44], z ∈ [-2, 2] (dài 18m, rộng 4m)
  const bridgeGroup = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.85 });
  const bambooRailMat = new THREE.MeshStandardMaterial({ color: 0x8a6a42, roughness: 0.8 });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(18, 0.25, 4), woodMat);
  deck.position.set(35, -0.125, 0);
  bridgeGroup.add(deck);

  // Các nan tre ngang trang trí trên mặt cầu
  const slatGeo = new THREE.BoxGeometry(0.45, 0.08, 4.05);
  for (let x = 26.5; x <= 43.5; x += 0.9) {
    const slat = new THREE.Mesh(slatGeo, bambooRailMat);
    slat.position.set(x, 0.02, 0);
    bridgeGroup.add(slat);
  }
  parent.add(bridgeGroup);

  // 2 bục nhảy (20,0,18) và (50,0,-18)
  for (const pad of map.jumpPads) {
    addJumpPadVisual(parent, pad.pos, pad.radius);
  }
}

function buildNight3Geometry(
  parent: THREE.Group,
  map: NightMap,
  sandMat: THREE.Material,
  grassMat: THREE.Material
): void {
  // Tầng 0: Đảo tròn bán kính 45 m (Y=0)
  addRoundIsland(parent, 0, 0, 45, sandMat, grassMat);

  const stoneWallMat = new THREE.MeshStandardMaterial({ color: 0x4b5163, roughness: 0.9 });
  const tier1TopMat = new THREE.MeshStandardMaterial({ color: 0x2f5d50, roughness: 0.9 });
  const tier2TopMat = new THREE.MeshStandardMaterial({ color: 0x3b6e5f, roughness: 0.85 });
  const rampMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.88 });

  // Tầng 1 (Y=3): vành khăn bán kính 12–24 m ở nửa z > 0 (góc 0..π)
  const tier1Shape = new THREE.Shape();
  tier1Shape.absarc(0, 0, 24, 0, Math.PI, false);
  tier1Shape.lineTo(-12, 0);
  tier1Shape.absarc(0, 0, 12, Math.PI, 0, true);
  tier1Shape.closePath();

  const tier1Geo = new THREE.ExtrudeGeometry(tier1Shape, {
    depth: 3,
    bevelEnabled: false,
    curveSegments: 36,
  });
  // RotateX(+PI/2) chuyển (x, y_2d, z_extrude) -> (x, -z_extrude, +y_2d) => đặt y=3 cho y∈[0,3], z>0
  tier1Geo.rotateX(Math.PI / 2);
  const tier1Mesh = new THREE.Mesh(tier1Geo, [tier1TopMat, stoneWallMat]);
  tier1Mesh.position.y = 3;
  parent.add(tier1Mesh);

  // Tầng 2 (Y=6): đĩa bán kính 8 m ở tâm (vách từ Y=0..6)
  const tier2Mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 8.2, 6, 36),
    [stoneWallMat, tier2TopMat, stoneWallMat]
  );
  tier2Mesh.position.y = 3;
  parent.add(tier2Mesh);

  // Tháp chuông tâm tầng 2: hình trụ bán kính 2 m, cao 8 m (Y=6..14) + mái nón
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.85 });
  const towerBody = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 8, 20), towerMat);
  towerBody.position.set(0, 10, 0);
  parent.add(towerBody);

  const towerRoof = new THREE.Mesh(
    new THREE.ConeGeometry(3.1, 2.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x8c3b2b, roughness: 0.8 })
  );
  towerRoof.position.set(0, 15.2, 0);
  parent.add(towerRoof);

  // 2 dốc thẳng rộng 3 m ở góc 30° và 150°: r=30 (Y=0) lên r=24 (Y=3)
  const rampLen = Math.hypot(6, 3);
  const rampPitch = Math.atan2(3, 6);
  const rampGeo = new THREE.BoxGeometry(rampLen, 0.25, 3.0);

  for (const deg of [30, 150]) {
    const rad = (deg * Math.PI) / 180;
    const ux = Math.cos(rad);
    const uz = Math.sin(rad);

    // Đặt dốc trong group xoay theo hướng bán kính +X_local = (ux, 0, uz)
    // Khi xoay rotation.y = -rad: local (+1, 0, 0) -> world (cos(rad), 0, sin(rad))!
    // Cần r=30 (local +3) ở Y=0 và r=24 (local -3) ở Y=3 -> xoay rotation.z = -rampPitch!
    const rampHolder = new THREE.Group();
    rampHolder.position.set(27 * ux, 1.5, 27 * uz);
    rampHolder.rotation.y = -rad;

    const rampMesh = new THREE.Mesh(rampGeo, rampMat);
    rampMesh.rotation.z = -rampPitch;
    rampHolder.add(rampMesh);
    parent.add(rampHolder);
  }

  // Bục nhảy (0, 3, 13)
  for (const pad of map.jumpPads) {
    addJumpPadVisual(parent, pad.pos, pad.radius);
  }
}

export function createScene(): SceneContext {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1430);
  scene.fog = new THREE.FogExp2(0x1b2350, 0.0075);

  const hemiLight = new THREE.HemisphereLight(0x8899d6, 0x5e412c, 0.85);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0x3a4870, 0.35);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xdce8ff, 1.2);
  dirLight.position.set(-28, 45, -35);
  scene.add(dirLight);

  const skyRand = createWebPrng(202603681);
  addSkyMoonAndStars(scene, skyRand);

  const mapRoot = new THREE.Group();
  scene.add(mapRoot);

  const sandMat = new THREE.MeshStandardMaterial({
    color: 0xc9b48a,
    roughness: 0.95,
    metalness: 0.05,
  });
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x2f5d50,
    roughness: 0.92,
    metalness: 0.05,
  });

  const loadMap = (map: NightMap): void => {
    while (mapRoot.children.length > 0) {
      mapRoot.remove(mapRoot.children[0]);
    }

    if (map.night === 1) {
      addRoundIsland(mapRoot, 0, 0, 40, sandMat, grassMat);
      addWoodenPier(mapRoot);
      addNight1Decorations(mapRoot, map, createWebPrng(202603682));
    } else if (map.night === 2) {
      buildNight2Geometry(mapRoot, map, sandMat, grassMat);
    } else {
      buildNight3Geometry(mapRoot, map, sandMat, grassMat);
    }
  };

  const baseBg = new THREE.Color(0x0e1430);
  const litBg = new THREE.Color(0x1f2854);

  const updateLighting = (litCount: number, totalLanterns: number): void => {
    const ratio = totalLanterns > 0 ? Math.min(1, Math.max(0, litCount / totalLanterns)) : 0;
    // Ánh sáng môi trường tăng theo tiến độ thắp đèn
    ambientLight.intensity = 0.15 + 0.55 * ratio;
    hemiLight.intensity = 0.85 + 0.95 * ratio;
    const currentBg = baseBg.clone().lerp(litBg, ratio);
    scene.background = currentBg;
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(currentBg);
    }
  };

  return { scene, ambientLight, hemiLight, dirLight, loadMap, updateLighting };
}
