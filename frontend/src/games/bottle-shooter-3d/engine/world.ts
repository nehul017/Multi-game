import * as THREE from 'three';
import { getLevel } from '../levels';
import type { BottleKind, GraphicsQuality, HudSnapshot, LevelConfig, WorldHooks } from '../types';
import { createBottleMesh, KIND_COLOR, KIND_SCORE } from './bottles';
import { buildEnvMap, buildEnvironment, type EnvHandle } from './environment';
import { hashNoise } from './math';
import { detectDefaultQuality, getPreset, type QualityPreset } from './quality';
import { createTextures, type TextureKit } from './textures';
import { buildWeapon, type WeaponHandle } from './weapon';

const GRAVITY = 9.4;
const COMBO_WINDOW = 2.35;
const FIRE_COOLDOWN = 0.17;
const RELOAD_TIME = 1.45;
const SHARD_LIFE = 2.05;
const PARTICLE_LIFE = 0.72;
const TRACER_LIFE = 0.09;
const SMOKE_LIFE = 0.7;
const MAG_SIZE_DEFAULT = 12;

type SurfaceKind = 'bottle' | 'wood' | 'metal' | 'ground';

interface BottleEntity {
  id: number;
  kind: BottleKind;
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  health: number;
  maxHealth: number;
  alive: boolean;
  base: THREE.Vector3;
  moving: boolean;
  spinning: boolean;
  phase: number;
  speed: number;
  amplitude: number;
  scale: number;
  sparkleRing: THREE.Mesh | null;
  emissiveMat: THREE.MeshPhysicalMaterial | null;
  crackDecal: THREE.Mesh;
  knock: THREE.Vector3;
  spinVel: THREE.Vector3;
}

interface Shard {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  angular: THREE.Vector3;
  life: number;
  active: boolean;
  bounced: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
  sparkle: boolean;
}

interface Tracer {
  mesh: THREE.Mesh;
  life: number;
  active: boolean;
}

interface SmokeP {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  active: boolean;
}

function tetraShard(sc = 1): THREE.BufferGeometry {
  const s = (0.04 + Math.random() * 0.07) * sc;
  const p = [
    new THREE.Vector3(0, s * 1.25, 0),
    new THREE.Vector3(-s, -s, s),
    new THREE.Vector3(s, -s, s * 0.4),
    new THREE.Vector3(0, -s * 0.6, -s),
  ];
  const pos: number[] = [];
  [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]].forEach(([a, b, c]) => {
    pos.push(p[a].x, p[a].y, p[a].z, p[b].x, p[b].y, p[b].z, p[c].x, p[c].y, p[c].z);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function tick(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 16);
  });
}

export class BottleShooterWorld {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raycaster = new THREE.Raycaster();
  private hooks: WorldHooks;

  private textures!: TextureKit;
  private env!: EnvHandle;
  private gun!: WeaponHandle;
  private envMap: THREE.Texture | null = null;
  private quality: QualityPreset;

  private bottles: BottleEntity[] = [];
  private shards: Shard[] = [];
  private particles: Particle[] = [];
  private tracers: Tracer[] = [];
  private smokes: SmokeP[] = [];
  private bottleId = 0;

  private yaw = 0;
  private pitch = -0.06;
  private swayYaw = 0;
  private swayPitch = 0;
  private prevYaw = 0;
  private prevPitch = 0;
  private recoil = 0;
  private recoilVel = 0;
  private shake = 0;
  private fireCooldown = 0;
  private reloadT = 0;
  private reloading = false;
  private time = 0;
  private flashT = 0;
  private flashAngle = 0;
  private impactT = 0;
  private shellLife = 0;
  private shellVel = new THREE.Vector3();
  private shellAng = new THREE.Vector3();
  private slowMo = 0;
  private hitPulse = 0;
  private perfectPulse = 0;

  private mode: 'menu' | 'play' = 'menu';
  private paused = false;
  private running = false;
  private frame = 0;
  private hudAcc = 0;
  private ended = false;

  private level: LevelConfig | null = null;
  private score = 0;
  private combo = 0;
  private bestCombo = 0;
  private comboT = 0;
  private shots = 0;
  private hits = 0;
  private bottlesBroken = 0;
  private magazineCount = 12;
  private reserve = 8;
  private timeLeft = 60;
  private targeted = false;
  private emptyArmed = false;

  private lookAbs: { x: number; y: number } | null = null;
  private hitSurfaces: THREE.Object3D[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private canvas: HTMLCanvasElement;
  private obstacleGrp: THREE.Group | null = null;
  private impactLight: THREE.PointLight;

  constructor(canvas: HTMLCanvasElement, hooks: WorldHooks, quality?: GraphicsQuality) {
    this.canvas = canvas;
    this.hooks = hooks;
    this.quality = getPreset(quality ?? detectDefaultQuality());

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.quality.id !== 'low',
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(this.quality.pixelRatio);
    this.renderer.setSize(canvas.clientWidth || 800, canvas.clientHeight || 600, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.quality.exposure;
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.renderer.shadowMap.type = this.quality.softShadows ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(56, (canvas.clientWidth || 800) / (canvas.clientHeight || 600), 0.08, 240);
    this.camera.position.set(0, 1.5, 4.6);

    this.impactLight = new THREE.PointLight(0xfff1c2, 0, 4.5);
    this.scene.add(this.impactLight);
  }

  async bootstrap(onProgress?: (value: number, message: string) => void): Promise<void> {
    const report = (value: number, message: string) => onProgress?.(value, message);
    report(0.08, 'Preparing renderer…');
    await tick();
    this.textures = createTextures(this.quality);
    report(0.28, 'Painting the range…');
    await tick();
    this.env = buildEnvironment(this.scene, this.textures, this.quality);
    this.hitSurfaces = [...this.env.hitSurfaces];
    report(0.52, 'Building the range…');
    await tick();
    this.gun = buildWeapon(this.textures);
    this.camera.add(this.gun.group);
    this.scene.add(this.camera);
    this.gun.group.visible = false;
    report(0.7, 'Arming the pistol…');
    await tick();
    this.initPools();
    report(0.86, 'Loading atmosphere…');
    await tick();
    if (this.quality.envMap) this.envMap = buildEnvMap(this.renderer, this.scene);
    report(1, 'Range ready');

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas.parentElement || this.canvas);
    this.resize();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    this.loop();
  }

  setMode(mode: 'menu' | 'play'): void {
    this.mode = mode;
    this.gun.group.visible = mode === 'play';
    if (mode === 'menu') {
      this.yaw = 0;
      this.pitch = -0.05;
      this.lookAbs = null;
      this.ended = true;
      this.clearBottles();
      this.spawnBottles(getLevel(2));
      this.scene.fog = new THREE.Fog(0xb7c9d8, 26, 118);
    } else {
      this.scene.fog = new THREE.Fog(0xb7c9d8, 32, 132);
    }
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setQuality(quality: GraphicsQuality): void {
    this.quality = getPreset(quality);
    this.renderer.setPixelRatio(this.quality.pixelRatio);
    this.renderer.toneMappingExposure = this.quality.exposure;
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.renderer.shadowMap.type = this.quality.softShadows ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
    this.env?.applyQuality(this.quality);
  }

  getQuality(): GraphicsQuality {
    return this.quality.id;
  }

  loadLevel(config: LevelConfig, carryScore = 0): void {
    this.clearBottles();
    this.level = config;
    this.score = carryScore;
    this.combo = 0;
    this.bestCombo = 0;
    this.comboT = 0;
    this.shots = 0;
    this.hits = 0;
    this.bottlesBroken = 0;
    this.timeLeft = config.timeLimit;
    this.magazineCount = Math.min(config.magazineSize || MAG_SIZE_DEFAULT, config.ammo);
    this.reserve = Math.max(0, config.ammo - this.magazineCount);
    this.reloading = false;
    this.reloadT = 0;
    this.ended = false;
    this.emptyArmed = false;
    this.recoil = 0;
    this.recoilVel = 0;
    this.shake = 0;
    this.spawnBottles(config);
    this.setMode('play');
    this.emitHud();
  }

  getStats() {
    return {
      score: this.score,
      accuracy: this.accuracy(),
      shots: this.shots,
      bottlesBroken: this.bottlesBroken,
      bestCombo: this.bestCombo,
      hits: this.hits,
    };
  }

  lookDelta(dx: number, dy: number): void {
    if (this.mode !== 'play' || this.paused) return;
    this.lookAbs = null;
    this.yaw = THREE.MathUtils.clamp(this.yaw - dx * 0.0024, -0.72, 0.72);
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.0021, -0.38, 0.28);
  }

  lookAbsolute(nx: number, ny: number): void {
    if (this.mode !== 'play' || this.paused) return;
    this.lookAbs = { x: nx, y: ny };
  }

  shoot(): boolean {
    if (this.mode !== 'play' || this.paused || this.ended || this.reloading) return false;
    if (this.fireCooldown > 0) return false;
    if (this.magazineCount <= 0) {
      this.hooks.onEvent('empty');
      this.emitHud();
      return false;
    }

    this.magazineCount -= 1;
    this.shots += 1;
    this.fireCooldown = FIRE_COOLDOWN;
    this.recoilVel = 14;
    this.shake = 0.85;
    this.flashT = 0.055;
    this.flashAngle = Math.random() * Math.PI * 2;
    this.ejectShell();
    this.hooks.onEvent('shot');

    const origin = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.raycaster.set(origin, dir);
    this.raycaster.far = 40;

    const res = this.raycaster.intersectObjects(this.hitSurfaces, false);
    const mPos = new THREE.Vector3();
    this.gun.muzzle.getWorldPosition(mPos);
    let end = origin.clone().add(dir.clone().multiplyScalar(22));

    if (res.length > 0) {
      const hit = res[0];
      end = hit.point.clone();
      const kind = (hit.object.userData.kind || 'wood') as SurfaceKind;
      const pan = THREE.MathUtils.clamp(hit.point.x / 8, -1, 1);
      if (kind === 'bottle') {
        this.strikeBottle(hit.object.userData.bottleId as number, hit.point, dir, pan);
      } else {
        this.combo = 0;
        this.comboT = 0;
        this.hooks.onEvent('miss');
        if (kind === 'ground') {
          this.hooks.onEvent('hit-wood', { pan });
          this.burstParticles(hit.point, dir, 0xa08860, 12, 1.2);
          this.dustPuff(hit.point);
        } else if (kind === 'metal') {
          this.hooks.onEvent('hit-metal', { pan });
          this.burstParticles(hit.point, dir, 0xffd9a0, 14, 2.2, false, true);
        } else {
          this.hooks.onEvent('hit-wood', { pan });
          this.burstParticles(hit.point, dir, 0xc8b48a, 10, 1.6);
        }
        this.impactFlash(hit.point);
      }
    } else {
      this.combo = 0;
      this.comboT = 0;
      this.hooks.onEvent('miss');
    }

    this.spawnTracer(mPos, end);
    this.muzzleSmoke();
    if (this.magazineCount <= 0 && this.reserve <= 0) this.emptyArmed = true;
    this.emitHud();
    return true;
  }

  reload(): boolean {
    if (this.mode !== 'play' || this.paused || this.ended || this.reloading) return false;
    if (this.magazineCount >= (this.level?.magazineSize || MAG_SIZE_DEFAULT)) return false;
    if (this.reserve <= 0) return false;
    this.reloading = true;
    this.reloadT = RELOAD_TIME;
    this.hooks.onEvent('reload-start');
    this.emitHud();
    return true;
  }

  dispose(): void {
    this.running = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.clearBottles();
    this.shards.forEach((s) => {
      this.scene.remove(s.mesh);
      s.mesh.geometry.dispose();
    });
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.tracers.forEach((t) => this.scene.remove(t.mesh));
    this.smokes.forEach((s) => this.scene.remove(s.mesh));
    this.scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat) (mat as THREE.Material).dispose();
    });
    this.textures?.dispose();
    this.envMap?.dispose();
    this.renderer.dispose();
  }

  private loop = (): void => {
    if (!this.running) return;
    this.frame = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    if (!(this.paused && this.mode === 'play')) this.update(dt);
    this.render();
  };

  private update(dt: number): void {
    const vdt = this.slowMo > 0 ? dt * 0.32 : dt;
    this.slowMo = Math.max(0, this.slowMo - dt);
    this.hitPulse = Math.max(0, this.hitPulse - dt);
    this.perfectPulse = Math.max(0, this.perfectPulse - dt);

    if (this.mode === 'menu') {
      this.yaw = Math.sin(this.time * 0.12) * 0.28;
      this.pitch = -0.08 + Math.sin(this.time * 0.09) * 0.04;
    } else if (this.lookAbs) {
      this.yaw = THREE.MathUtils.damp(this.yaw, this.lookAbs.x * 0.62, 8, dt);
      this.pitch = THREE.MathUtils.damp(this.pitch, -this.lookAbs.y * 0.32, 8, dt);
    }
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);

    this.recoilVel += (-this.recoil * 55 - this.recoilVel * 9) * dt;
    this.recoil = Math.max(0, this.recoil + this.recoilVel * dt);
    this.shake = THREE.MathUtils.damp(this.shake, 0, 8, dt);

    this.flashT = Math.max(0, this.flashT - dt);
    this.impactT = Math.max(0, this.impactT - dt);
    const fA = Math.max(0, this.flashT / 0.055);
    this.gun.flashInner.visible = this.gun.flashOuter.visible = fA > 0.01;
    if (fA > 0) {
      this.gun.flashInner.scale.setScalar(0.55 + fA * 1.15);
      this.gun.flashOuter.scale.setScalar(0.75 + fA * 1.8);
      (this.gun.flashInner.material as THREE.MeshBasicMaterial).opacity = fA;
      (this.gun.flashOuter.material as THREE.MeshBasicMaterial).opacity = fA * 0.45;
      this.gun.flashInner.rotation.z = this.flashAngle;
      this.gun.flashOuter.rotation.z = this.flashAngle + 0.45;
    }
    this.gun.flashLight.intensity = fA > 0 ? 12 * fA : 0;
    this.impactLight.intensity = this.impactT > 0 ? 5 * (this.impactT / 0.08) : 0;

    if (this.reloading) {
      this.reloadT -= dt;
      if (this.reloadT <= 0) this.finishReload();
    }

    if (this.mode === 'play' && !this.ended) {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.comboT > 0) {
        this.comboT -= dt;
        if (this.comboT <= 0) this.combo = 0;
      }
      if (this.timeLeft <= 0) this.finish('time-up');
      else if (this.emptyArmed && this.magazineCount <= 0 && this.reserve <= 0 && !this.reloading) {
        if (this.bottles.some((b) => b.alive)) this.finish('out-of-ammo');
      }
    }

    this.swayYaw = THREE.MathUtils.damp(this.swayYaw, (this.yaw - this.prevYaw) * 12, 6, dt);
    this.swayPitch = THREE.MathUtils.damp(this.swayPitch, (this.pitch - this.prevPitch) * 10, 6, dt);
    this.prevYaw = this.yaw;
    this.prevPitch = this.pitch;

    this.updateBottles(vdt);
    this.updateShards(vdt);
    this.updateParticles(vdt);
    this.updateTracers(dt);
    this.updateSmoke(vdt);
    this.updateShell(dt);
    this.env.update(this.time);
    this.updateAimTarget();
    this.hudAcc += dt;
    if (this.hudAcc >= 0.12) {
      this.hudAcc = 0;
      this.emitHud();
    }
  }

  private render(): void {
    const bY = Math.sin(this.time * 1.6) * 0.003;
    const bR = Math.sin(this.time * 1.1) * 0.0008;
    const sX = hashNoise(this.time * 28) * this.shake * 0.03;
    const sY = hashNoise(this.time * 32 + 100) * this.shake * 0.025;
    const iY = Math.sin(this.time * 1.15) * 0.008;
    const iX = Math.sin(this.time * 0.7) * 0.004;

    this.camera.position.set(iX + sX, 1.5 + iY + sY + bY + this.recoil * 0.01, 4.6);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch - this.recoil * 0.04;
    this.camera.rotation.z = this.yaw * -0.04 + bR;

    const wX = this.swayYaw * 0.08;
    const wY = this.swayPitch * 0.06;
    this.gun.group.position.set(0.22 + iX * 0.4 - wX, -0.28 + iY * 0.5 - wY, -0.5);
    this.gun.group.rotation.set(
      0.035 + Math.sin(this.time * 1.4) * 0.01 - this.recoil * 0.22,
      0.07 + wX * 0.5,
      0.07 + this.recoil * 0.04
    );

    if (this.reloading) {
      const p = 1 - this.reloadT / RELOAD_TIME;
      const dip = Math.sin(Math.min(1, p) * Math.PI);
      this.gun.group.rotation.x += dip * 0.55;
      this.gun.group.position.y -= dip * 0.12;
      this.gun.magazine.position.y = -0.168 - dip * 0.16;
    } else {
      this.gun.magazine.position.y = -0.168;
    }
    this.gun.slide.position.z = -this.recoil * 0.055;

    this.renderer.render(this.scene, this.camera);
  }

  private updateBottles(dt: number): void {
    const sp = this.level?.moveSpeed ?? 1;
    this.bottles.forEach((b) => {
      if (!b.alive) return;
      if (b.moving) b.group.position.x = b.base.x + Math.sin(this.time * sp * b.speed + b.phase) * b.amplitude;
      if (b.spinning) b.group.rotation.y += dt * (1.4 + b.speed);
      b.knock.multiplyScalar(Math.max(0, 1 - dt * 6));
      b.spinVel.multiplyScalar(Math.max(0, 1 - dt * 5));
      b.group.position.addScaledVector(b.knock, dt);
      b.group.rotation.x += b.spinVel.x * dt;
      b.group.rotation.z += b.spinVel.z * dt;
      if (b.kind === 'gold' && b.emissiveMat) b.emissiveMat.emissiveIntensity = 0.18 + Math.sin(this.time * 3.5) * 0.12;
      if (b.sparkleRing) {
        b.sparkleRing.rotation.y += dt * 2.8;
        b.sparkleRing.rotation.z = Math.sin(this.time * 2) * 0.15;
      }
    });
  }

  private updateShards(dt: number): void {
    this.shards.forEach((s) => {
      if (!s.active) return;
      s.life -= dt;
      s.velocity.y -= GRAVITY * dt;
      s.mesh.position.addScaledVector(s.velocity, dt);
      s.mesh.rotation.x += s.angular.x * dt;
      s.mesh.rotation.y += s.angular.y * dt;
      s.mesh.rotation.z += s.angular.z * dt;
      (s.mesh.material as THREE.MeshStandardMaterial).opacity = Math.max(0, s.life / SHARD_LIFE);
      if (s.mesh.position.y < 0.05) {
        s.mesh.position.y = 0.05;
        s.velocity.y *= -0.24;
        s.velocity.x *= 0.68;
        s.velocity.z *= 0.68;
        if (!s.bounced) {
          s.bounced = true;
          this.burstParticles(s.mesh.position.clone(), new THREE.Vector3(0, 1, 0), 0xe8e0d0, 2, 0.45);
        }
      }
      if (s.life <= 0) {
        s.active = false;
        s.mesh.visible = false;
      }
    });
  }

  private updateParticles(dt: number): void {
    this.particles.forEach((p) => {
      if (!p.active) return;
      p.life -= dt;
      p.velocity.y -= (p.sparkle ? 2.2 : 5.5) * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      const t = Math.max(0, p.life / p.maxLife);
      p.mesh.scale.setScalar(0.018 + t * (p.sparkle ? 0.05 : 0.075));
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.sparkle
        ? t * (0.5 + Math.sin(this.time * 35 + p.life * 50) * 0.5)
        : t;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
      }
    });
  }

  private updateTracers(dt: number): void {
    this.tracers.forEach((tr) => {
      if (!tr.active) return;
      tr.life -= dt;
      (tr.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, tr.life / TRACER_LIFE) * 0.8;
      if (tr.life <= 0) {
        tr.active = false;
        tr.mesh.visible = false;
      }
    });
  }

  private updateSmoke(dt: number): void {
    this.smokes.forEach((s) => {
      if (!s.active) return;
      s.life -= dt;
      s.velocity.y += 0.6 * dt;
      s.velocity.x *= 0.97;
      s.velocity.z *= 0.97;
      s.mesh.position.addScaledVector(s.velocity, dt);
      const t = Math.max(0, s.life / SMOKE_LIFE);
      s.mesh.scale.setScalar(0.016 + (1 - t) * 0.05);
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = t * 0.32;
      if (s.life <= 0) {
        s.active = false;
        s.mesh.visible = false;
      }
    });
  }

  private updateShell(dt: number): void {
    if (this.shellLife <= 0) {
      this.gun.shell.visible = false;
      return;
    }
    this.shellLife -= dt;
    this.shellVel.y -= 14 * dt;
    this.gun.shell.position.addScaledVector(this.shellVel, dt);
    this.gun.shell.rotation.x += this.shellAng.x * dt;
    this.gun.shell.rotation.z += this.shellAng.z * dt;
    this.gun.shell.visible = this.shellLife > 0;
  }

  private updateAimTarget(): void {
    if (this.mode !== 'play') {
      this.targeted = false;
      return;
    }
    const o = new THREE.Vector3();
    this.camera.getWorldPosition(o);
    const d = new THREE.Vector3();
    this.camera.getWorldDirection(d);
    this.raycaster.set(o, d);
    this.targeted =
      this.raycaster.intersectObjects(
        this.bottles.filter((b) => b.alive).map((b) => b.hitMesh),
        false
      ).length > 0;
  }

  private strikeBottle(id: number, point: THREE.Vector3, dir: THREE.Vector3, pan: number): void {
    const bottle = this.bottles.find((b) => b.id === id && b.alive);
    if (!bottle) return;
    this.hits += 1;
    const local = bottle.group.worldToLocal(point.clone());
    const center = Math.hypot(local.x, local.z) < 0.055 * bottle.scale;
    const force = 1 + Math.min(1.4, dir.length()) + this.recoil * 0.2;
    bottle.health -= 1;
    bottle.knock.copy(dir).multiplyScalar(center ? 0.35 : 1.15 * force);
    bottle.knock.y += 0.2;
    bottle.spinVel.set((Math.random() - 0.5) * 2.2, 0, (local.x > 0 ? -1 : 1) * (center ? 1.1 : 3.2));
    this.impactFlash(point);
    this.hitPulse = 0.12;
    this.hooks.onEvent('hit-glass', { pan });
    this.burstParticles(point, dir, 0xf3fbff, center ? 16 : 9, force);
    this.impactSprite(point);

    if (bottle.health > 0) {
      this.hooks.onEvent('crack', { pan });
      (bottle.crackDecal.material as THREE.MeshBasicMaterial).opacity = 0.85;
      this.spawnShards(bottle, point, dir, 7, force * 0.55, true);
      this.emitHud();
      return;
    }

    bottle.alive = false;
    bottle.group.visible = false;
    this.unregisterHit(bottle.hitMesh);
    this.bottlesBroken += 1;
    this.spawnShards(bottle, point, dir, center ? 26 : 16, force * (center ? 1.45 : 0.95), false);
    this.burstParticles(point, dir, 0xffffff, 20, force, true);
    this.dustPuff(point);

    this.combo += 1;
    this.comboT = COMBO_WINDOW;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    let pts = KIND_SCORE[bottle.kind];
    if (center && !['gold', 'bonus', 'moving', 'spinning'].includes(bottle.kind)) pts = 200;
    if (this.combo >= 2) pts *= Math.min(this.combo, 5);
    this.score += pts;

    if (center) {
      this.perfectPulse = 0.22;
      this.slowMo = 0.14;
      this.hooks.onEvent('perfect', { points: pts, kind: bottle.kind, center, pan });
    }
    this.hooks.onEvent('shatter', { points: pts, kind: bottle.kind, center, pan });
    if (this.combo >= 2) this.hooks.onEvent('combo', { combo: this.combo, points: pts });
    if (bottle.kind === 'bonus') this.hooks.onEvent('bonus', { points: pts, kind: bottle.kind });
    if (bottle.kind === 'gold') this.hooks.onEvent('gold', { points: pts, kind: bottle.kind });
    if (!this.bottles.some((b) => b.alive)) this.finish('level-complete');
    this.emitHud();
  }

  private finish(ev: 'level-complete' | 'out-of-ammo' | 'time-up'): void {
    if (this.ended) return;
    this.ended = true;
    this.hooks.onEvent(ev);
    this.emitHud();
  }

  private finishReload(): void {
    const cap = this.level?.magazineSize || MAG_SIZE_DEFAULT;
    const take = Math.min(cap - this.magazineCount, this.reserve);
    this.magazineCount += take;
    this.reserve -= take;
    this.reloading = false;
    this.reloadT = 0;
    this.hooks.onEvent('magazine-click');
    this.hooks.onEvent('reload-end');
    this.emitHud();
  }

  private spawnBottles(config: LevelConfig): void {
    const kinds = this.planKinds(config);
    const cols = Math.min(config.bottleCount, config.elevatedTargets ? 6 : 5);
    const heights = config.elevatedTargets ? [1.18, 1.72, 2.22] : [1.18, 1.68];
    kinds.forEach((kind, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const inRow = Math.min(cols, config.bottleCount - row * cols);
      const x = (col - (inRow - 1) / 2) * (0.78 * config.bottleScale) + (Math.random() - 0.5) * 0.06;
      const y = heights[row % heights.length] + (kind === 'heavy' ? 0.02 : 0);
      const z = -6.15 - row * 0.95 - Math.random() * 0.08;
      const moving =
        kind === 'moving' || (config.movingTargets && (kind === 'spinning' || (i % 3 === 0 && kind !== 'heavy')));
      const spinning = kind === 'spinning' || (config.spinningTargets && i % 4 === 1);
      this.createBottle(kind, new THREE.Vector3(x, y, z), config.bottleScale, moving, spinning);
    });
    if (config.obstacles) this.spawnObstacles();
  }

  private planKinds(c: LevelConfig): BottleKind[] {
    const k: BottleKind[] = [];
    for (let i = 0; i < c.goldCount; i += 1) k.push('gold');
    for (let i = 0; i < c.bonusCount; i += 1) k.push('bonus');
    for (let i = 0; i < c.heavyCount; i += 1) k.push('heavy');
    if (c.spinningTargets) k.push('spinning');
    if (c.movingTargets) k.push('moving', 'moving');
    while (k.length < c.bottleCount) k.push('normal');
    for (let i = k.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [k[i], k[j]] = [k[j], k[i]];
    }
    return k.slice(0, c.bottleCount);
  }

  private createBottle(kind: BottleKind, pos: THREE.Vector3, scale: number, moving: boolean, spinning: boolean): void {
    const id = ++this.bottleId;
    const built = createBottleMesh(kind, scale, id, this.quality, this.textures);
    built.hitMesh.userData = { kind: 'bottle', bottleId: id };
    built.group.position.copy(pos);
    built.group.rotation.y = (Math.random() - 0.5) * 0.6;
    built.group.rotation.z = (Math.random() - 0.5) * 0.02;
    this.scene.add(built.group);
    this.hitSurfaces.push(built.hitMesh);
    this.bottles.push({
      id,
      kind,
      group: built.group,
      hitMesh: built.hitMesh,
      health: kind === 'heavy' ? 2 : 1,
      maxHealth: kind === 'heavy' ? 2 : 1,
      alive: true,
      base: pos.clone(),
      moving,
      spinning,
      phase: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 0.6,
      amplitude: 0.55 + Math.random() * 0.35,
      scale: scale * 1.38,
      sparkleRing: built.sparkleRing,
      emissiveMat: kind === 'gold' || kind === 'bonus' ? built.glass : null,
      crackDecal: built.crackDecal,
      knock: new THREE.Vector3(),
      spinVel: new THREE.Vector3(),
    });
  }

  private spawnObstacles(): void {
    if (this.obstacleGrp) {
      this.obstacleGrp.traverse((o) => {
        if ((o as THREE.Mesh).userData?.kind === 'wood') this.hitSurfaces = this.hitSurfaces.filter((h) => h !== o);
      });
      this.scene.remove(this.obstacleGrp);
    }
    this.obstacleGrp = new THREE.Group();
    const wm = new THREE.MeshStandardMaterial({
      map: this.textures.wood,
      normalMap: this.textures.woodNormal,
      color: 0xb07a48,
      roughness: 0.78,
      metalness: 0.04,
    });
    (
      [
        [0.8, 1.2, 0.15, -2.0, 0.6, -5.4],
        [0.7, 1.0, 0.15, 1.7, 0.5, -5.9],
        [0.9, 0.9, 0.15, 0.2, 0.45, -7.2],
      ] as number[][]
    ).forEach(([w, h, d, x, y, z]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wm);
      m.position.set(x, y, z);
      m.rotation.y = (Math.random() - 0.5) * 0.2;
      m.castShadow = m.receiveShadow = true;
      m.userData.kind = 'wood';
      this.obstacleGrp!.add(m);
      this.hitSurfaces.push(m);
    });
    this.scene.add(this.obstacleGrp);
  }

  private spawnShards(
    bottle: BottleEntity,
    pt: THREE.Vector3,
    dir: THREE.Vector3,
    count: number,
    force: number,
    chip: boolean
  ): void {
    const col = KIND_COLOR[bottle.kind];
    const budget = Math.min(count, this.quality.shards);
    let n = 0;
    for (const s of this.shards) {
      if (s.active) continue;
      s.active = true;
      s.bounced = false;
      const sv = chip ? 0.55 + Math.random() * 0.45 : 0.35 + Math.random() * 1.35;
      s.life = SHARD_LIFE * (chip ? 0.7 : 1);
      s.mesh.visible = true;
      s.mesh.position.copy(pt);
      s.mesh.scale.setScalar(sv * bottle.scale);
      const mat = s.mesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(col);
      mat.opacity = 0.88;
      const scatter = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.85, Math.random() - 0.5);
      s.velocity.copy(dir).multiplyScalar(3.4 * force).add(scatter.multiplyScalar(2.8 * force));
      s.velocity.y += 1.8 * force;
      s.angular.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 16);
      if (++n >= budget) break;
    }
  }

  private burstParticles(
    pt: THREE.Vector3,
    dir: THREE.Vector3,
    col: number,
    count: number,
    force: number,
    sparkle = false,
    metalSparks = false
  ): void {
    const budget = Math.min(count, this.quality.particles);
    let n = 0;
    for (const p of this.particles) {
      if (p.active) continue;
      p.active = true;
      p.sparkle = sparkle && n % 3 === 0;
      p.maxLife = metalSparks ? 0.5 + Math.random() * 0.3 : p.sparkle ? 0.9 : PARTICLE_LIFE;
      p.life = p.maxLife;
      p.mesh.visible = true;
      p.mesh.position.copy(pt);
      const m = p.mesh.material as THREE.MeshBasicMaterial;
      m.color.setHex(p.sparkle ? 0xfff4c2 : col);
      m.opacity = 1;
      p.velocity.copy(dir).multiplyScalar((metalSparks ? 3.5 : 2.4) * force);
      p.velocity.x += (Math.random() - 0.5) * 2.4;
      p.velocity.y += 1.2 + Math.random() * 2.2;
      p.velocity.z += (Math.random() - 0.5) * 2.4;
      if (++n >= budget) break;
    }
  }

  private dustPuff(pt: THREE.Vector3): void {
    let n = 0;
    for (const s of this.smokes) {
      if (s.active) continue;
      s.active = true;
      s.life = SMOKE_LIFE * (0.6 + Math.random() * 0.4);
      s.mesh.visible = true;
      s.mesh.position.copy(pt);
      s.mesh.position.y += 0.02;
      (s.mesh.material as THREE.MeshBasicMaterial).color.setHex(0xb8a888);
      s.velocity.set((Math.random() - 0.5) * 0.6, 0.3 + Math.random() * 0.5, (Math.random() - 0.5) * 0.6);
      if (++n >= 6) break;
    }
  }

  private muzzleSmoke(): void {
    const mp = new THREE.Vector3();
    this.gun.muzzle.getWorldPosition(mp);
    let n = 0;
    for (const s of this.smokes) {
      if (s.active) continue;
      s.active = true;
      s.life = SMOKE_LIFE;
      s.mesh.visible = true;
      s.mesh.position.copy(mp);
      (s.mesh.material as THREE.MeshBasicMaterial).color.setHex(0xcccccc);
      s.velocity.set((Math.random() - 0.5) * 0.15, 0.35 + Math.random() * 0.25, (Math.random() - 0.5) * 0.15);
      if (++n >= 4) break;
    }
  }

  private impactSprite(pt: THREE.Vector3): void {
    const p = this.particles.find((pp) => !pp.active);
    if (!p) return;
    p.active = true;
    p.sparkle = false;
    p.maxLife = 0.08;
    p.life = 0.08;
    p.mesh.visible = true;
    p.mesh.position.copy(pt);
    p.mesh.scale.setScalar(0.12);
    const m = p.mesh.material as THREE.MeshBasicMaterial;
    m.color.setHex(0xffffff);
    m.opacity = 1;
    p.velocity.set(0, 0, 0);
  }

  private spawnTracer(from: THREE.Vector3, to: THREE.Vector3): void {
    const tr = this.tracers.find((t) => !t.active);
    if (!tr) return;
    const mid = from.clone().lerp(to, 0.5);
    const len = from.distanceTo(to);
    tr.mesh.position.copy(mid);
    tr.mesh.scale.set(1, 1, len);
    tr.mesh.lookAt(to);
    tr.mesh.visible = true;
    tr.life = TRACER_LIFE;
    tr.active = true;
    (tr.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
  }

  private ejectShell(): void {
    this.gun.shell.position.set(0.06, 0.04, -0.18);
    this.shellVel.set(1.6 + Math.random() * 0.6, 2.4 + Math.random() * 0.4, 0.3 + Math.random() * 0.3);
    this.shellAng.set(12 + Math.random() * 8, 0, 6 + Math.random() * 6);
    this.shellLife = 0.5;
    this.gun.shell.visible = true;
  }

  private impactFlash(pt: THREE.Vector3): void {
    this.impactLight.position.copy(pt);
    this.impactT = 0.08;
  }

  private accuracy(): number {
    return this.shots <= 0 ? 100 : Math.round((this.hits / this.shots) * 100);
  }

  private emitHud(): void {
    this.hooks.onHud({
      level: this.level?.id ?? 1,
      levelName: this.level?.name ?? 'Range',
      timeLeft: this.timeLeft,
      score: this.score,
      combo: this.combo,
      accuracy: this.accuracy(),
      magazine: this.magazineCount,
      reserve: this.reserve,
      targeted: this.targeted,
      firing: this.recoil > 0.35,
      reloading: this.reloading,
      reloadHint: this.magazineCount <= 0 && this.reserve > 0,
      bottlesLeft: this.bottles.filter((b) => b.alive).length,
      bottlesTotal: this.bottles.length,
      shots: this.shots,
      hits: this.hits,
      hitPulse: this.hitPulse > 0,
      perfectPulse: this.perfectPulse > 0,
    });
  }

  private clearBottles(): void {
    this.bottles.forEach((b) => {
      this.scene.remove(b.group);
      b.group.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry && m !== b.hitMesh) m.geometry.dispose();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat && m !== b.hitMesh) (mat as THREE.Material).dispose();
      });
    });
    this.bottles = [];
    this.hitSurfaces = this.hitSurfaces.filter((o) => o.userData.kind !== 'bottle');
    if (this.obstacleGrp) {
      this.obstacleGrp.traverse((o) => {
        if ((o as THREE.Mesh).userData?.kind === 'wood') this.hitSurfaces = this.hitSurfaces.filter((h) => h !== o);
      });
      this.scene.remove(this.obstacleGrp);
      this.obstacleGrp = null;
    }
  }

  private unregisterHit(mesh: THREE.Mesh): void {
    this.hitSurfaces = this.hitSurfaces.filter((o) => o !== mesh);
  }

  private initPools(): void {
    const sMat = () =>
      new THREE.MeshStandardMaterial({
        color: 0x3d8b6e,
        transparent: true,
        opacity: 0.85,
        roughness: 0.1,
        metalness: 0.08,
      });
    for (let i = 0; i < this.quality.shards; i += 1) {
      const flat = i % 5 === 0;
      const tiny = i % 7 === 0;
      const geo = flat
        ? new THREE.PlaneGeometry(0.04 + Math.random() * 0.09, 0.03 + Math.random() * 0.07)
        : tetraShard(tiny ? 0.5 : 1);
      const mesh = new THREE.Mesh(geo, sMat());
      mesh.visible = false;
      this.scene.add(mesh);
      this.shards.push({
        mesh,
        velocity: new THREE.Vector3(),
        angular: new THREE.Vector3(),
        life: 0,
        active: false,
        bounced: false,
      });
    }
    const spGeo = new THREE.SphereGeometry(1, 6, 6);
    for (let i = 0; i < this.quality.particles; i += 1) {
      const mesh = new THREE.Mesh(
        spGeo,
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, depthWrite: false })
      );
      mesh.visible = false;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: PARTICLE_LIFE,
        active: false,
        sparkle: false,
      });
    }
    const tGeo = new THREE.CylinderGeometry(0.012, 0.006, 1, 5);
    tGeo.rotateX(Math.PI / 2);
    for (let i = 0; i < 12; i += 1) {
      const mesh = new THREE.Mesh(
        tGeo,
        new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.8, depthWrite: false })
      );
      mesh.visible = false;
      this.scene.add(mesh);
      this.tracers.push({ mesh, life: 0, active: false });
    }
    const smGeo = new THREE.SphereGeometry(1, 5, 5);
    for (let i = 0; i < this.quality.smoke; i += 1) {
      const mesh = new THREE.Mesh(
        smGeo,
        new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.3, depthWrite: false })
      );
      mesh.visible = false;
      mesh.scale.setScalar(0.02);
      this.scene.add(mesh);
      this.smokes.push({ mesh, velocity: new THREE.Vector3(), life: 0, active: false });
    }
  }

  private resize(): void {
    const p = this.canvas.parentElement || this.canvas;
    const w = p.clientWidth || window.innerWidth;
    const h = p.clientHeight || window.innerHeight;
    if (w < 2 || h < 2) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }
}
