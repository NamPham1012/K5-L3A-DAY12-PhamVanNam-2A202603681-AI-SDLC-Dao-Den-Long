import * as THREE from 'three';
import { Player, Lantern, Shade, Mote } from '../core/entities.js';

export class RenderEntities {
  public playerGroup: THREE.Group;
  public lanternMeshes: Map<string, { group: THREE.Group; light: THREE.PointLight; mesh: THREE.Mesh }> = new Map();
  public shadeMeshes: Map<string, THREE.Mesh> = new Map();
  public moteMeshes: Map<string, THREE.Mesh> = new Map();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.playerGroup = this.createPlayerMesh();
    this.scene.add(this.playerGroup);
  }

  // Mây: hình khối đơn giản đội nón lá (cone) có đèn nhỏ treo
  private createPlayerMesh(): THREE.Group {
    const group = new THREE.Group();

    // Thân
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.2, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a7a96 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    group.add(body);

    // Đầu
    const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.35;
    group.add(head);

    // Nón lá (cone)
    const hatGeo = new THREE.ConeGeometry(0.75, 0.4, 24);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xd4b476 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 1.65;
    group.add(hat);

    // Đèn lồng nhỏ treo trước nón
    const miniLanternGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.16, 8);
    const miniLanternMat = new THREE.MeshStandardMaterial({
      color: 0xffaa33,
      emissive: 0xff8800,
      emissiveIntensity: 0.8,
    });
    const miniLantern = new THREE.Mesh(miniLanternGeo, miniLanternMat);
    miniLantern.position.set(0, 1.2, 0.45);
    group.add(miniLantern);

    const miniLight = new THREE.PointLight(0xffaa44, 1.5, 5);
    miniLight.position.set(0, 1.2, 0.5);
    group.add(miniLight);

    return group;
  }

  public syncPlayer(player: Player, yawDeg: number): void {
    this.playerGroup.position.set(player.pos[0], player.pos[1], player.pos[2]);
    this.playerGroup.rotation.y = (yawDeg * Math.PI) / 180;
  }

  public syncLanterns(lanterns: Lantern[]): void {
    for (const l of lanterns) {
      let entry = this.lanternMeshes.get(l.id);
      if (!entry) {
        const group = new THREE.Group();
        group.position.set(l.pos[0], 0, l.pos[2]);

        // Cột đèn
        const postGeo = new THREE.CylinderGeometry(0.2, 0.25, 3.5, 12);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.y = 1.75;
        group.add(post);

        // Lồng đèn
        const lanternGeo = new THREE.SphereGeometry(0.8, 16, 16);
        const lanternMat = new THREE.MeshStandardMaterial({
          color: 0x332211,
          emissive: 0x000000,
          roughness: 0.4,
        });
        const mesh = new THREE.Mesh(lanternGeo, lanternMat);
        mesh.position.y = 3.6;
        group.add(mesh);

        // Ánh sáng khi thắp
        const light = new THREE.PointLight(0xffaa22, 0, 20);
        light.position.y = 3.6;
        group.add(light);

        this.scene.add(group);
        entry = { group, light, mesh };
        this.lanternMeshes.set(l.id, entry);
      }

      // Cập nhật trạng thái thắp
      const mat = entry.mesh.material as THREE.MeshStandardMaterial;
      if (l.lit) {
        mat.color.setHex(0xffaa33);
        mat.emissive.setHex(0xff8811);
        mat.emissiveIntensity = 1.2;
        entry.light.intensity = 3.5;
      } else {
        mat.color.setHex(0x332211);
        mat.emissive.setHex(0x110800);
        mat.emissiveIntensity = 0.1;
        entry.light.intensity = 0.2;
      }
    }
  }

  public syncShades(shades: Shade[]): void {
    const activeIds = new Set(shades.map((s) => s.id));

    // Remove absent
    for (const [id, mesh] of this.shadeMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        this.shadeMeshes.delete(id);
      }
    }

    // Add or update
    for (const s of shades) {
      let mesh = this.shadeMeshes.get(s.id);
      if (!mesh) {
        const geo = new THREE.SphereGeometry(0.9, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x110022,
          roughness: 0.2,
          emissive: 0x330055,
          emissiveIntensity: 0.6,
        });
        mesh = new THREE.Mesh(geo, mat);
        this.scene.add(mesh);
        this.shadeMeshes.set(s.id, mesh);
      }

      mesh.position.set(s.pos[0], s.pos[1], s.pos[2]);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (s.state === 'stunned') {
        mat.emissive.setHex(0x224488);
        mat.emissiveIntensity = 0.9;
      } else {
        mat.emissive.setHex(0x330055);
        mat.emissiveIntensity = 0.6;
      }
    }
  }

  public syncMotes(motes: Mote[]): void {
    const activeMap = new Map<string, Mote>();
    for (const m of motes) {
      if (m.active) activeMap.set(m.id, m);
    }

    // Remove inactive
    for (const [id, mesh] of this.moteMeshes.entries()) {
      if (!activeMap.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        this.moteMeshes.delete(id);
      }
    }

    // Add or update
    for (const [id, m] of activeMap.entries()) {
      let mesh = this.moteMeshes.get(id);
      if (!mesh) {
        const geo = new THREE.SphereGeometry(0.2, 8, 8);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xffff44,
          emissive: 0xffdd22,
          emissiveIntensity: 1.5,
        });
        mesh = new THREE.Mesh(geo, mat);
        this.scene.add(mesh);
        this.moteMeshes.set(id, mesh);
      }
      mesh.position.set(m.pos[0], 0.3, m.pos[2]);
    }
  }

  public clearAll(): void {
    for (const entry of this.lanternMeshes.values()) {
      this.scene.remove(entry.group);
    }
    this.lanternMeshes.clear();

    for (const mesh of this.shadeMeshes.values()) {
      this.scene.remove(mesh);
    }
    this.shadeMeshes.clear();

    for (const mesh of this.moteMeshes.values()) {
      this.scene.remove(mesh);
    }
    this.moteMeshes.clear();
  }
}
