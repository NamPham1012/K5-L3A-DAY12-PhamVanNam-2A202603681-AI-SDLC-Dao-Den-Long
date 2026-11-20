import * as THREE from 'three';
import { Player, Lantern, Shade, Mote } from '../core/entities.js';
import { createGlowTexture } from './scene.js';

interface LanternVisual {
  group: THREE.Group;
  light: THREE.PointLight;
  mesh: THREE.Mesh;
  halo: THREE.Sprite;
}

interface ShadeVisual {
  group: THREE.Group;
  body: THREE.Mesh;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  smokePuffs: THREE.Mesh[];
  phase: number;
}

interface MoteVisual {
  mesh: THREE.Mesh;
  phase: number;
}

function hashIdToPhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 360;
  }
  return (h * Math.PI) / 180;
}

export class RenderEntities {
  public playerGroup: THREE.Group;
  private handLanternMesh!: THREE.Mesh;
  private handLanternLight!: THREE.PointLight;
  private handLanternAnchor!: THREE.Vector3;
  private orbitMotes: THREE.Mesh[] = [];

  public lanternMeshes: Map<string, LanternVisual> = new Map();
  public shadeMeshes: Map<string, ShadeVisual> = new Map();
  public moteMeshes: Map<string, MoteVisual> = new Map();

  private scene: THREE.Scene;
  private lanternGlowTex: THREE.CanvasTexture;
  private moteGeo: THREE.SphereGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.lanternGlowTex = createGlowTexture(
      'rgba(255, 220, 130, 0.95)',
      'rgba(255, 140, 30, 0.35)'
    );
    this.moteGeo = new THREE.SphereGeometry(0.16, 8, 8);
    this.playerGroup = this.createPlayerMesh();
    this.scene.add(this.playerGroup);
  }

  // Mây: thân + đầu + nón lá + tay cầm sào tre treo đèn lồng đỏ + đom đóm bay quanh đèn
  private createPlayerMesh(): THREE.Group {
    const group = new THREE.Group();

    // Thân
    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.44, 1.15, 14);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b6e8c, roughness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.58;
    group.add(body);

    // Đầu
    const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.32;
    group.add(head);

    // Nón lá (cone)
    const hatGeo = new THREE.ConeGeometry(0.76, 0.42, 24);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xd9ba78, roughness: 0.85 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 1.64;
    group.add(hat);

    // Tay phải cầm sào tre vươn ra phía trước (+Z)
    const armGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.45, 8);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x3b6e8c });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(-0.34, 0.92, 0.18);
    arm.rotation.x = Math.PI / 3;
    group.add(arm);

    // Cây sào tre
    const poleGeo = new THREE.CylinderGeometry(0.03, 0.04, 1.45, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x7c9c4a, roughness: 0.7 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(-0.42, 1.28, 0.58);
    pole.rotation.x = Math.PI / 3.4;
    group.add(pole);

    // Dây treo đèn lồng đỏ ở đầu sào
    const tipX = -0.42;
    const tipY = 1.62;
    const tipZ = 1.12;
    const stringGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.24, 6);
    const stringMat = new THREE.MeshBasicMaterial({ color: 0x332211 });
    const stringMesh = new THREE.Mesh(stringGeo, stringMat);
    stringMesh.position.set(tipX, tipY - 0.12, tipZ);
    group.add(stringMesh);

    // Đèn lồng đỏ nhỏ phát sáng ấm
    this.handLanternAnchor = new THREE.Vector3(tipX, tipY - 0.34, tipZ);
    const miniLanternGeo = new THREE.SphereGeometry(0.17, 12, 12);
    const miniLanternMat = new THREE.MeshStandardMaterial({
      color: 0xd92b2b,
      emissive: 0xff3b1f,
      emissiveIntensity: 0.9,
      roughness: 0.35,
    });
    this.handLanternMesh = new THREE.Mesh(miniLanternGeo, miniLanternMat);
    this.handLanternMesh.scale.set(0.9, 1.15, 0.9);
    this.handLanternMesh.position.copy(this.handLanternAnchor);
    group.add(this.handLanternMesh);

    // PointLight nhỏ ấm của đèn Mây (tăng theo carried)
    this.handLanternLight = new THREE.PointLight(0xff8844, 1.8, 10, 1.6);
    this.handLanternLight.position.copy(this.handLanternAnchor);
    group.add(this.handLanternLight);

    // Pool 10 đom đóm bay vòng quanh đèn lồng đỏ (hiển thị đúng số = carried)
    const orbitMoteGeo = new THREE.SphereGeometry(0.065, 8, 8);
    for (let i = 0; i < 10; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffee66 });
      const mote = new THREE.Mesh(orbitMoteGeo, mat);
      mote.visible = false;
      group.add(mote);
      this.orbitMotes.push(mote);
    }

    return group;
  }

  public syncPlayer(player: Player, yawDeg: number, animTime: number): void {
    this.playerGroup.position.set(player.pos[0], player.pos[1], player.pos[2]);
    this.playerGroup.rotation.y = (yawDeg * Math.PI) / 180;

    // Độ sáng đèn lồng đỏ tăng theo số đom đóm đang mang (carried)
    const carried = player.carried;
    this.handLanternLight.intensity = 1.6 + carried * 0.45;
    this.handLanternLight.distance = 9 + carried * 1.1;
    const mat = this.handLanternMesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.75 + carried * 0.22;

    // Đom đóm đang mang bay vòng quanh đèn lồng đỏ
    const count = Math.min(carried, this.orbitMotes.length);
    for (let i = 0; i < this.orbitMotes.length; i++) {
      const m = this.orbitMotes[i];
      if (i < count) {
        m.visible = true;
        const angle = animTime * 2.8 + (i * Math.PI * 2) / Math.max(1, count);
        const radius = 0.34 + (i % 2) * 0.08;
        const bobY = Math.sin(animTime * 4.5 + i * 1.3) * 0.11;
        m.position.set(
          this.handLanternAnchor.x + Math.cos(angle) * radius,
          this.handLanternAnchor.y + bobY,
          this.handLanternAnchor.z + Math.sin(angle) * radius
        );
      } else {
        m.visible = false;
      }
    }
  }

  public syncLanterns(lanterns: Lantern[], animTime: number): void {
    for (const l of lanterns) {
      let entry = this.lanternMeshes.get(l.id);
      if (!entry) {
        const group = new THREE.Group();
        group.position.set(l.pos[0], 0, l.pos[2]);

        // Cột đèn gỗ
        const postGeo = new THREE.CylinderGeometry(0.18, 0.26, 3.6, 10);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x452d1a, roughness: 0.9 });
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.y = 1.8;
        group.add(post);

        // Mái nhỏ trên đèn
        const roofGeo = new THREE.ConeGeometry(1.15, 0.6, 6);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x332014, roughness: 0.85 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 4.35;
        group.add(roof);

        // Lồng đèn chính
        const lanternGeo = new THREE.SphereGeometry(0.75, 16, 16);
        const lanternMat = new THREE.MeshStandardMaterial({
          color: 0x332211,
          emissive: 0x000000,
          roughness: 0.35,
        });
        const mesh = new THREE.Mesh(lanternGeo, lanternMat);
        mesh.position.y = 3.55;
        group.add(mesh);

        // PointLight vàng cam bán kính lớn khi thắp
        const light = new THREE.PointLight(0xffa62b, 0, 34, 1.4);
        light.position.y = 3.55;
        group.add(light);

        // Quầng sáng sprite additive
        const haloMat = new THREE.SpriteMaterial({
          map: this.lanternGlowTex,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
          opacity: 0,
        });
        const halo = new THREE.Sprite(haloMat);
        halo.position.y = 3.55;
        halo.scale.set(6.5, 6.5, 1);
        group.add(halo);

        this.scene.add(group);
        entry = { group, light, mesh, halo };
        this.lanternMeshes.set(l.id, entry);
      }

      const mat = entry.mesh.material as THREE.MeshStandardMaterial;
      const haloMat = entry.halo.material as THREE.SpriteMaterial;
      if (l.lit) {
        const flicker = 1 + Math.sin(animTime * 5.0 + hashIdToPhase(l.id)) * 0.08;
        mat.color.setHex(0xffc255);
        mat.emissive.setHex(0xff8c1a);
        mat.emissiveIntensity = 1.5 * flicker;
        entry.light.intensity = 5.5 * flicker;
        haloMat.opacity = 0.85;
        const haloScale = 6.8 * flicker;
        entry.halo.scale.set(haloScale, haloScale, 1);
      } else {
        // Đèn chưa thắp: tối, có chút ánh le lói nếu đã nạp một phần
        const progress = l.deposited > 0 ? 0.25 : 0;
        mat.color.setHex(0x2b211a);
        mat.emissive.setHex(0x552800);
        mat.emissiveIntensity = progress;
        entry.light.intensity = progress * 0.8;
        haloMat.opacity = progress * 0.35;
      }
    }
  }

  public syncShades(
    shades: Shade[],
    player: Player,
    lanterns: Lantern[],
    safeRadius: number,
    animTime: number
  ): void {
    const activeIds = new Set(shades.map((s) => s.id));
    const litLanterns = lanterns.filter((l) => l.lit);

    // Xóa các shade không còn tồn tại
    for (const [id, entry] of this.shadeMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(entry.group);
        this.shadeMeshes.delete(id);
      }
    }

    for (const s of shades) {
      let entry = this.shadeMeshes.get(s.id);
      if (!entry) {
        const group = new THREE.Group();

        // Khối mực tím đen
        const bodyGeo = new THREE.SphereGeometry(0.88, 16, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0x160626,
          roughness: 0.35,
          emissive: 0x3b0b66,
          emissiveIntensity: 0.7,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // 2 mắt trắng phát sáng gắn phía trước (+Z local)
        const eyeGeo = new THREE.SphereGeometry(0.14, 10, 10);
        const leftEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const rightEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftEye = new THREE.Mesh(eyeGeo, leftEyeMat);
        leftEye.position.set(-0.28, 0.2, 0.76);
        const rightEye = new THREE.Mesh(eyeGeo, rightEyeMat);
        rightEye.position.set(0.28, 0.2, 0.76);
        group.add(leftEye);
        group.add(rightEye);

        // Vệt khói tím phía sau (-Z local)
        const smokePuffs: THREE.Mesh[] = [];
        for (let k = 0; k < 3; k++) {
          const puffGeo = new THREE.SphereGeometry(0.55 - k * 0.12, 10, 10);
          const puffMat = new THREE.MeshBasicMaterial({
            color: 0x4d1480,
            transparent: true,
            opacity: 0.45 - k * 0.11,
            depthWrite: false,
          });
          const puff = new THREE.Mesh(puffGeo, puffMat);
          puff.position.set(0, -0.05 * k, -0.75 - k * 0.55);
          group.add(puff);
          smokePuffs.push(puff);
        }

        this.scene.add(group);
        entry = {
          group,
          body,
          leftEye,
          rightEye,
          smokePuffs,
          phase: hashIdToPhase(s.id),
        };
        this.shadeMeshes.set(s.id, entry);
      }

      // Kiểm tra xem có gần đèn đã thắp không (để run rẩy sợ ánh sáng)
      let nearLitLantern = false;
      const fearDistSq = (safeRadius + 3.5) * (safeRadius + 3.5);
      for (const l of litLanterns) {
        const lx = s.pos[0] - l.pos[0];
        const lz = s.pos[2] - l.pos[2];
        if (lx * lx + lz * lz <= fearDistSq) {
          nearLitLantern = true;
          break;
        }
      }

      // Hiệu ứng run rẩy chỉ ở lớp hiển thị
      let jitterX = 0;
      let jitterZ = 0;
      if (nearLitLantern && s.state !== 'stunned') {
        jitterX = Math.sin(animTime * 42 + entry.phase) * 0.12;
        jitterZ = Math.cos(animTime * 38 + entry.phase) * 0.12;
      }

      entry.group.position.set(s.pos[0] + jitterX, s.pos[1], s.pos[2] + jitterZ);

      // Xoay mặt hướng về người chơi
      const dx = player.pos[0] - s.pos[0];
      const dz = player.pos[2] - s.pos[2];
      if (dx * dx + dz * dz > 0.0001) {
        entry.group.rotation.y = Math.atan2(dx, dz);
      }

      const bodyMat = entry.body.material as THREE.MeshStandardMaterial;
      const leftEyeMat = entry.leftEye.material as THREE.MeshBasicMaterial;
      const rightEyeMat = entry.rightEye.material as THREE.MeshBasicMaterial;

      if (s.state === 'stunned') {
        // Stunned: xám nhạt, co lại, mắt nhắm
        bodyMat.color.setHex(0xa8a8b8);
        bodyMat.emissive.setHex(0x3a3a4a);
        bodyMat.emissiveIntensity = 0.35;
        entry.body.scale.set(0.72, 0.72, 0.72);

        entry.leftEye.scale.set(1.1, 0.15, 1);
        entry.rightEye.scale.set(1.1, 0.15, 1);
        leftEyeMat.color.setHex(0x444455);
        rightEyeMat.color.setHex(0x444455);

        for (const puff of entry.smokePuffs) {
          puff.visible = false;
        }
      } else {
        // Chase: tím đen nhấp nhô (scale dao động), mắt trắng sáng, vệt khói tím
        const pulse = Math.sin(animTime * 5.2 + entry.phase);
        const sx = 1.0 + pulse * 0.09;
        const sy = 1.0 - pulse * 0.11;
        bodyMat.color.setHex(0x160626);
        bodyMat.emissive.setHex(nearLitLantern ? 0x5c1888 : 0x3b0b66);
        bodyMat.emissiveIntensity = 0.75;
        entry.body.scale.set(sx, sy, sx);

        entry.leftEye.scale.set(1, 1, 1);
        entry.rightEye.scale.set(1, 1, 1);
        leftEyeMat.color.setHex(0xffffff);
        rightEyeMat.color.setHex(0xffffff);

        for (let k = 0; k < entry.smokePuffs.length; k++) {
          const puff = entry.smokePuffs[k];
          puff.visible = true;
          const sway = Math.sin(animTime * 6 + entry.phase + k * 1.1) * 0.12;
          puff.position.x = sway;
          puff.position.y = Math.cos(animTime * 4 + k) * 0.08;
        }
      }
    }
  }

  public syncMotes(motes: Mote[], animTime: number): void {
    const activeMap = new Map<string, Mote>();
    for (const m of motes) {
      if (m.active) activeMap.set(m.id, m);
    }

    // Xóa đom đóm đã nhặt
    for (const [id, entry] of this.moteMeshes.entries()) {
      if (!activeMap.has(id)) {
        this.scene.remove(entry.mesh);
        (entry.mesh.material as THREE.Material).dispose();
        this.moteMeshes.delete(id);
      }
    }

    // Cập nhật vị trí nhấp nhô + nhấp nháy (chỉ hiển thị)
    for (const [id, m] of activeMap.entries()) {
      let entry = this.moteMeshes.get(id);
      if (!entry) {
        const mat = new THREE.MeshStandardMaterial({
          color: 0xfff066,
          emissive: 0xffdd22,
          emissiveIntensity: 1.5,
        });
        const mesh = new THREE.Mesh(this.moteGeo, mat);
        this.scene.add(mesh);
        entry = { mesh, phase: hashIdToPhase(id) };
        this.moteMeshes.set(id, entry);
      }

      const hoverY = 0.38 + Math.sin(animTime * 3.2 + entry.phase) * 0.16;
      const blink = 0.75 + 0.5 * (0.5 + 0.5 * Math.sin(animTime * 6.5 + entry.phase * 2));
      entry.mesh.position.set(m.pos[0], hoverY, m.pos[2]);
      entry.mesh.scale.setScalar(0.85 + blink * 0.25);
      const mat = entry.mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.0 + blink * 1.2;
    }
  }

  public clearAll(): void {
    for (const entry of this.lanternMeshes.values()) {
      this.scene.remove(entry.group);
    }
    this.lanternMeshes.clear();

    for (const entry of this.shadeMeshes.values()) {
      this.scene.remove(entry.group);
    }
    this.shadeMeshes.clear();

    for (const entry of this.moteMeshes.values()) {
      this.scene.remove(entry.mesh);
      (entry.mesh.material as THREE.Material).dispose();
    }
    this.moteMeshes.clear();
  }
}
