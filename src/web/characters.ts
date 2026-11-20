import * as THREE from 'three';
import { Player, Lantern, Shade, Mote, Drifter, Charm } from '../core/entities.js';
import { createGlowTexture } from './scene.js';
import { InstancedEntities } from './instanced.js';

interface LanternVisual {
  group: THREE.Group;
  light: THREE.PointLight;
  mesh: THREE.Mesh;
  halo: THREE.Sprite;
  fuelBack: THREE.Sprite;
  fuelFill: THREE.Sprite;
  tear: THREE.Line;
}

interface DrifterVisual {
  group: THREE.Group;
  segments: THREE.Mesh[];
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
  public drifterMeshes: Map<string, DrifterVisual> = new Map();
  public charmMeshes: Map<string, THREE.Group> = new Map();

  private scene: THREE.Scene;
  private lanternGlowTex: THREE.CanvasTexture;
  private instances: InstancedEntities;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.lanternGlowTex = createGlowTexture(
      'rgba(255, 233, 176, 0.95)',
      'rgba(255, 179, 71, 0.35)'
    );
    this.instances = new InstancedEntities(scene);
    this.playerGroup = this.createPlayerMesh();
    this.scene.add(this.playerGroup);
  }

  private createPlayerMesh(): THREE.Group {
    const group = new THREE.Group();

    // Thân áo Mây (#E8E2D0) + khăn đỏ (#C8102E)
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.44, 1.15, 14),
      new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.8 })
    );
    body.position.y = 0.58;
    group.add(body);

    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.07, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.7 })
    );
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 1.12;
    group.add(scarf);

    // Đầu
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.7 })
    );
    head.position.y = 1.32;
    group.add(head);

    // Nón lá (cone)
    const hat = new THREE.Mesh(
      new THREE.ConeGeometry(0.76, 0.42, 24),
      new THREE.MeshStandardMaterial({ color: 0xd9ba78, roughness: 0.85 })
    );
    hat.position.y = 1.64;
    group.add(hat);

    // Tay phải cầm sào tre treo đèn lồng đỏ
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.08, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0xe8e2d0 })
    );
    arm.position.set(-0.34, 0.92, 0.18);
    arm.rotation.x = Math.PI / 3;
    group.add(arm);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 1.45, 8),
      new THREE.MeshStandardMaterial({ color: 0x7c9c4a, roughness: 0.7 })
    );
    pole.position.set(-0.42, 1.28, 0.58);
    pole.rotation.x = Math.PI / 3.4;
    group.add(pole);

    const tipX = -0.42;
    const tipY = 1.62;
    const tipZ = 1.12;
    const stringMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.24, 6),
      new THREE.MeshBasicMaterial({ color: 0x332211 })
    );
    stringMesh.position.set(tipX, tipY - 0.12, tipZ);
    group.add(stringMesh);

    this.handLanternAnchor = new THREE.Vector3(tipX, tipY - 0.34, tipZ);
    this.handLanternMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xc8102e,
        emissive: 0xff3b1f,
        emissiveIntensity: 0.9,
        roughness: 0.35,
      })
    );
    this.handLanternMesh.scale.set(0.9, 1.15, 0.9);
    this.handLanternMesh.position.copy(this.handLanternAnchor);
    group.add(this.handLanternMesh);

    this.handLanternLight = new THREE.PointLight(0xff8844, 1.8, 10, 1.6);
    this.handLanternLight.position.copy(this.handLanternAnchor);
    group.add(this.handLanternLight);

    // Pool 10 đom đóm bay quanh đèn lồng đỏ theo carried
    const orbitMoteGeo = new THREE.SphereGeometry(0.065, 8, 8);
    for (let i = 0; i < 10; i++) {
      const mote = new THREE.Mesh(orbitMoteGeo, new THREE.MeshBasicMaterial({ color: 0xfff6c2 }));
      mote.visible = false;
      group.add(mote);
      this.orbitMotes.push(mote);
    }

    return group;
  }

  public syncPlayer(player: Player, yawDeg: number, animTime: number): void {
    this.playerGroup.visible = player.fall_respawn_ticks === 0;
    this.playerGroup.position.set(player.pos[0], player.pos[1], player.pos[2]);
    this.playerGroup.rotation.y = (yawDeg * Math.PI) / 180;

    const carried = player.carried;
    this.handLanternLight.intensity = 1.6 + carried * 0.45;
    this.handLanternLight.distance = 9 + carried * 1.1;
    const mat = this.handLanternMesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.75 + carried * 0.22;

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
        group.position.set(l.pos[0], l.pos[1], l.pos[2]);

        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.26, 3.6, 10),
          new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.9 })
        );
        post.position.y = 1.8;
        group.add(post);

        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(1.15, 0.6, 6),
          new THREE.MeshStandardMaterial({ color: 0x452d1a, roughness: 0.85 })
        );
        roof.position.y = 4.35;
        group.add(roof);

        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.75, 16, 16),
          new THREE.MeshStandardMaterial({
            color: 0x5b5f6e,
            emissive: 0x000000,
            roughness: 0.35,
          })
        );
        mesh.position.y = 3.55;
        group.add(mesh);

        const light = new THREE.PointLight(0xffb347, 0, 34, 1.4);
        light.position.y = 3.55;
        group.add(light);

        const halo = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: this.lanternGlowTex,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
            opacity: 0,
          })
        );
        halo.position.y = 3.55;
        halo.scale.set(6.5, 6.5, 1);
        group.add(halo);

        const fuelBack = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x181d2b, depthTest: false }));
        fuelBack.position.y = 5.25;
        fuelBack.scale.set(1.8, 0.26, 1);
        fuelBack.renderOrder = 10;
        group.add(fuelBack);
        const fuelFill = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffb347, depthTest: false }));
        fuelFill.position.set(0, 5.25, 0);
        fuelFill.renderOrder = 11;
        group.add(fuelFill);

        const tear = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.18, 0.5, 0.53), new THREE.Vector3(0.03, 0.24, 0.72),
            new THREE.Vector3(-0.08, 0.03, 0.75), new THREE.Vector3(0.18, -0.26, 0.68),
          ]),
          new THREE.LineBasicMaterial({ color: 0x18131a })
        );
        mesh.add(tear);

        this.scene.add(group);
        entry = { group, light, mesh, halo, fuelBack, fuelFill, tear };
        this.lanternMeshes.set(l.id, entry);
      }

      const mat = entry.mesh.material as THREE.MeshStandardMaterial;
      const haloMat = entry.halo.material as THREE.SpriteMaterial;
      entry.group.position.set(l.pos[0], l.pos[1], l.pos[2]);
      entry.mesh.scale.set(1, l.lit ? 1 : 0.8, 1);
      entry.tear.visible = !l.lit;
      entry.fuelBack.visible = l.lit;
      entry.fuelFill.visible = l.lit;
      const ratio = Math.max(0, Math.min(1, l.fuel_u / 6000));
      entry.fuelFill.scale.set(1.68 * ratio, 0.15, 1);
      entry.fuelFill.material.color.setHex(l.fuel_u < 1800 ? 0xff5a5f : 0xffb347);
      const lowFuelBlink = l.fuel_u < 1800 && Math.sin(animTime * Math.PI * 2) < 0;
      entry.fuelBack.material.opacity = lowFuelBlink ? 0.3 : 1;
      entry.fuelFill.material.opacity = lowFuelBlink ? 0.3 : 1;
      entry.fuelBack.material.transparent = true;
      entry.fuelFill.material.transparent = true;
      if (l.lit) {
        const flicker = (1 + Math.sin(animTime * 5.0 + hashIdToPhase(l.id)) * 0.08) * (lowFuelBlink ? 0.3 : 1);
        mat.color.setHex(0xffe9b0);
        mat.emissive.setHex(0xffb347);
        mat.emissiveIntensity = 1.5 * flicker;
        entry.light.intensity = 5.5 * flicker;
        haloMat.opacity = lowFuelBlink ? 0.25 : 0.85;
        const haloScale = 6.8 * flicker;
        entry.halo.scale.set(haloScale, haloScale, 1);
      } else {
        const progress = l.deposited > 0 ? 0.25 : 0;
        mat.color.setHex(0x5b5f6e);
        mat.emissive.setHex(0x552800);
        mat.emissiveIntensity = progress;
        entry.light.intensity = progress * 0.8;
        haloMat.opacity = progress * 0.35;
      }
    }
  }

  public syncShades(shades: Shade[], player: Player, lanterns: Lantern[], safeRadius: number, animTime: number, colorblind = false): void {
    this.instances.syncShades(shades, player, lanterns, safeRadius, animTime, colorblind);
  }

  // Gió Lạc: dải lụa xám xanh (#8FA3B8) lượn sóng
  public syncDrifters(drifters: Drifter[], player: Player, animTime: number): void {
    const activeIds = new Set(drifters.map((d) => d.id));
    for (const [id, entry] of this.drifterMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(entry.group);
        this.drifterMeshes.delete(id);
      }
    }

    for (const d of drifters) {
      let entry = this.drifterMeshes.get(d.id);
      if (!entry) {
        const group = new THREE.Group();
        const segments: THREE.Mesh[] = [];
        for (let k = 0; k < 4; k++) {
          const seg = new THREE.Mesh(
            new THREE.BoxGeometry(0.65 - k * 0.1, 0.14, 0.7),
            new THREE.MeshStandardMaterial({
              color: 0x8fa3b8,
              emissive: 0x5c7791,
              emissiveIntensity: 0.6,
              transparent: true,
              opacity: 0.9 - k * 0.15,
            })
          );
          seg.position.set(0, 0, -k * 0.62);
          group.add(seg);
          segments.push(seg);
        }
        this.scene.add(group);
        entry = { group, segments, phase: hashIdToPhase(d.id) };
        this.drifterMeshes.set(d.id, entry);
      }

      if (d.state === 'removed') {
        entry.group.visible = false;
        continue;
      }

      entry.group.visible = true;
      entry.group.position.set(d.pos[0], d.pos[1], d.pos[2]);

      const dx = player.pos[0] - d.pos[0];
      const dz = player.pos[2] - d.pos[2];
      if (dx * dx + dz * dz > 1e-4) {
        entry.group.rotation.y =
          d.state === 'flee' ? Math.atan2(-dx, -dz) : Math.atan2(dx, dz);
      }

      for (let k = 0; k < entry.segments.length; k++) {
        const seg = entry.segments[k];
        seg.position.y = Math.sin(animTime * 8 + entry.phase - k * 0.9) * 0.18;
        seg.position.x = Math.cos(animTime * 5 + entry.phase - k * 0.7) * 0.12;
        const mat = seg.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(d.stolen > 0 ? 0xf2c14e : 0x5c7791);
      }
    }
  }

  // Bùa Gió: lá bùa đỏ (#C8102E) viền vàng (#F2C14E)
  public syncCharms(charms: Charm[], animTime: number): void {
    const activeIds = new Set(charms.map((c) => c.id));
    for (const [id, group] of this.charmMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(group);
        this.charmMeshes.delete(id);
      }
    }

    for (const c of charms) {
      let group = this.charmMeshes.get(c.id);
      if (!group) {
        group = new THREE.Group();
        const border = new THREE.Mesh(
          new THREE.BoxGeometry(0.54, 0.86, 0.08),
          new THREE.MeshStandardMaterial({
            color: 0xf2c14e,
            emissive: 0xd99b26,
            emissiveIntensity: 0.7,
          })
        );
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.74, 0.1),
          new THREE.MeshStandardMaterial({
            color: 0xc8102e,
            emissive: 0x990b22,
            emissiveIntensity: 0.65,
          })
        );
        group.add(border, body);
        this.scene.add(group);
        this.charmMeshes.set(c.id, group);
      }

      group.visible = c.available;
      if (c.available) {
        group.position.set(
          c.pos[0],
          c.pos[1] + 0.9 + Math.sin(animTime * 3.5) * 0.18,
          c.pos[2]
        );
        group.rotation.y = animTime * 1.8;
      }
    }
  }

  public syncMotes(motes: Mote[], animTime: number): void {
    this.instances.syncMotes(motes, animTime);
  }

  public clearAll(): void {
    for (const entry of this.lanternMeshes.values()) {
      this.scene.remove(entry.group);
    }
    this.lanternMeshes.clear();

    this.instances.clear();

    for (const entry of this.drifterMeshes.values()) {
      this.scene.remove(entry.group);
    }
    this.drifterMeshes.clear();

    for (const group of this.charmMeshes.values()) {
      this.scene.remove(group);
    }
    this.charmMeshes.clear();
  }
}
