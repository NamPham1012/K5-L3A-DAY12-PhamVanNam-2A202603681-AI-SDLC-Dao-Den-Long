import * as THREE from 'three';
import type { Lantern, Mote, Player, Shade } from '../core/entities.js';

const SHADE_LIMIT = 1024, MOTE_LIMIT = 4096;
function phase(id: string): number { let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))%360; return h*Math.PI/180; }

export class InstancedEntities {
  private body: THREE.InstancedMesh;
  private eyes: THREE.InstancedMesh;
  private smoke: THREE.InstancedMesh;
  private motes: THREE.InstancedMesh;
  private transform = new THREE.Object3D();
  private rotation = new THREE.Euler();
  private offset = new THREE.Vector3();
  private color = new THREE.Color();

  constructor(scene: THREE.Scene) {
    this.body = new THREE.InstancedMesh(new THREE.SphereGeometry(0.88,16,16), new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.35,emissive:0x34204f,emissiveIntensity:0.5}), SHADE_LIMIT);
    this.eyes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.14,10,10), new THREE.MeshBasicMaterial({color:0xffffff}), SHADE_LIMIT*2);
    this.smoke = new THREE.InstancedMesh(new THREE.SphereGeometry(1,10,10), new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.3,depthWrite:false}), SHADE_LIMIT*3);
    this.motes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16,8,8), new THREE.MeshStandardMaterial({color:0xfff6c2,emissive:0xffe58a,emissiveIntensity:1.5}), MOTE_LIMIT);
    for (const mesh of [this.body,this.eyes,this.smoke,this.motes]) { mesh.count=0; mesh.frustumCulled=false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(mesh); }
  }

  public syncShades(shades: Shade[], player: Player, lanterns: Lantern[], safeRadius:number, time:number, colorblind:boolean):void {
    let count=0, smokeCount=0;
    const fear=(safeRadius+3.5)**2;
    for (let i=0; i<shades.length && count<SHADE_LIMIT; i++) {
      const shade=shades[i]; const p=phase(shade.id); let near=false;
      for (let j=0;j<lanterns.length;j++) { const l=lanterns[j]; const dx=shade.pos[0]-l.pos[0],dz=shade.pos[2]-l.pos[2]; if(l.lit && dx*dx+dz*dz<=fear){near=true;break;} }
      const jitter=near && shade.state!=='stunned';
      const x=shade.pos[0]+(jitter?Math.sin(time*42+p)*0.12:0), y=shade.pos[1], z=shade.pos[2]+(jitter?Math.cos(time*38+p)*0.12:0);
      const yaw=Math.atan2(player.pos[0]-shade.pos[0],player.pos[2]-shade.pos[2]);
      const pulse=Math.sin(time*5.2+p); const stunned=shade.state==='stunned';
      this.transform.position.set(x,y,z); this.transform.rotation.set(0,yaw,0);
      this.transform.scale.set(stunned?0.72:1+pulse*0.09,stunned?0.72:1-pulse*0.11,stunned?0.72:1+pulse*0.09);
      this.transform.updateMatrix(); this.body.setMatrixAt(count,this.transform.matrix);
      this.color.setHex(stunned?0x3a3450:0x120a1a); this.body.setColorAt(count,this.color);
      this.rotation.set(0,yaw,0);
      for (let e=0;e<2;e++) {
        this.offset.set(e===0?-0.28:0.28,0.2,0.76).applyEuler(this.rotation);
        this.transform.position.set(x+this.offset.x,y+this.offset.y,z+this.offset.z); this.transform.rotation.set(0,yaw,0);
        this.transform.scale.set(1,stunned?0.15:1,1); this.transform.updateMatrix(); this.eyes.setMatrixAt(count*2+e,this.transform.matrix);
        this.color.setHex(colorblind?0x00b3ff:stunned?0x666677:0xffffff); this.eyes.setColorAt(count*2+e,this.color);
      }
      if(!stunned) for(let k=0;k<3;k++) {
        this.offset.set(Math.sin(time*6+p+k*1.1)*0.12,Math.cos(time*4+k)*0.08-0.05*k,-0.75-k*0.55).applyEuler(this.rotation);
        this.transform.position.set(x+this.offset.x,y+this.offset.y,z+this.offset.z); this.transform.scale.setScalar(0.55-k*0.12); this.transform.updateMatrix(); this.smoke.setMatrixAt(smokeCount,this.transform.matrix);
        this.color.setHex(colorblind?0x00b3ff:0x7a3cff); this.smoke.setColorAt(smokeCount++,this.color);
      }
      count++;
    }
    this.body.count=count; this.eyes.count=count*2; this.smoke.count=smokeCount;
    this.body.instanceMatrix.needsUpdate=true; this.eyes.instanceMatrix.needsUpdate=true; this.smoke.instanceMatrix.needsUpdate=true;
    if(this.body.instanceColor)this.body.instanceColor.needsUpdate=true;
    if(this.eyes.instanceColor)this.eyes.instanceColor.needsUpdate=true;
    if(this.smoke.instanceColor)this.smoke.instanceColor.needsUpdate=true;
  }

  public syncMotes(motes:Mote[],time:number):void {
    let count=0;
    for(let i=0;i<motes.length && count<MOTE_LIMIT;i++) {
      const m=motes[i]; if(!m.active) continue; const p=phase(m.id);
      const blink=0.75+0.5*(0.5+0.5*Math.sin(time*6.5+p*2));
      this.transform.position.set(m.pos[0],m.pos[1]+0.38+Math.sin(time*3.2+p)*0.16,m.pos[2]);
      this.transform.rotation.set(0,0,0); this.transform.scale.setScalar(0.85+blink*0.25); this.transform.updateMatrix();
      this.motes.setMatrixAt(count++,this.transform.matrix);
    }
    this.motes.count=count; this.motes.instanceMatrix.needsUpdate=true;
  }
  public clear():void { this.body.count=0; this.eyes.count=0; this.smoke.count=0; this.motes.count=0; }
}
