import * as THREE from 'three';
import { fbm, hash2 } from './math';
import type { QualityPreset } from './quality';
import type { TextureKit } from './textures';

export interface EnvHandle {
  group: THREE.Group;
  hitSurfaces: THREE.Object3D[];
  sun: THREE.DirectionalLight;
  clouds: THREE.Mesh[];
  swayTrees: THREE.Object3D[];
  fogHaze: THREE.Mesh;
  casingInst: THREE.InstancedMesh | null;
  dust: THREE.Points | null;
  update: (time: number) => void;
  applyQuality: (quality: QualityPreset) => void;
}

const SKY_VERT = `
varying vec3 vDir;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vDir = normalize(world.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAG = `
varying vec3 vDir;
uniform vec3 uSun;
void main() {
  vec3 dir = normalize(vDir);
  float h = dir.y;
  vec3 zenith = vec3(0.18, 0.40, 0.78);
  vec3 mid = vec3(0.52, 0.72, 0.92);
  vec3 horizon = vec3(0.86, 0.88, 0.90);
  vec3 ground = vec3(0.58, 0.64, 0.70);
  vec3 col = mix(horizon, mid, smoothstep(0.0, 0.22, h));
  col = mix(col, zenith, smoothstep(0.18, 0.72, h));
  col = mix(ground, col, smoothstep(-0.12, 0.04, h));
  float sunAmt = pow(max(0.0, dot(dir, normalize(uSun))), 48.0);
  float disc = pow(max(0.0, dot(dir, normalize(uSun))), 1400.0);
  col += vec3(1.0, 0.86, 0.58) * sunAmt * 0.55;
  col += vec3(1.0, 0.95, 0.82) * disc * 2.4;
  float haze = exp(-abs(h) * 5.4);
  col = mix(col, vec3(0.82, 0.86, 0.90), haze * 0.38);
  gl_FragColor = vec4(col, 1.0);
}
`;

function addMesh(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  cast = true,
  receive = true
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}

function buildSky(scene: THREE.Scene): { sky: THREE.Mesh; sunDir: THREE.Vector3 } {
  const sunDir = new THREE.Vector3(-0.62, 0.48, 0.42).normalize();
  const mat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms: { uSun: { value: sunDir.clone() } },
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: true,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(160, 32, 20), mat);
  sky.frustumCulled = false;
  scene.add(sky);
  scene.background = new THREE.Color(0x8fb4d8);
  return { sky, sunDir };
}

function buildTerrain(quality: QualityPreset, tex: TextureKit): THREE.Mesh {
  const segs = quality.terrainSegs;
  const geo = new THREE.PlaneGeometry(220, 220, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors: number[] = [];
  const color = new THREE.Color();
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const lane = Math.abs(x) < 9 && z > -22 && z < 10;
    const n = fbm(x * 0.035 + 4, z * 0.035, 5);
    let y = n * 4.8 - 1.1;
    if (lane) y = Math.min(y, 0.01);
    if (Math.hypot(x, z + 8) < 18) y *= 0.15;
    pos.setY(i, y);
    if (lane) color.setRGB(0.42, 0.38, 0.32);
    else if (y > 2.4) color.setRGB(0.48, 0.46, 0.42);
    else color.setRGB(0.36 + n * 0.12, 0.42 + n * 0.1, 0.24 + n * 0.05);
    colors.push(color.r, color.g, color.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    map: tex.dirt,
    normalMap: tex.dirtNormal,
    roughness: 0.96,
    metalness: 0.02,
    vertexColors: true,
  });
  mat.normalScale.set(1.1, 1.1);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.userData.kind = 'ground';
  return mesh;
}

function buildMountains(quality: QualityPreset, tex: TextureKit, parent: THREE.Group): void {
  const segs = quality.mountainSegs;
  const peaks: Array<[number, number, number, number]> = [
    [-36, -78, 28, 38],
    [-12, -88, 36, 46],
    [10, -92, 32, 42],
    [34, -80, 26, 36],
    [-54, -70, 22, 30],
    [52, -72, 24, 32],
  ];
  const rock = new THREE.MeshStandardMaterial({
    map: tex.rock,
    normalMap: tex.rockNormal,
    color: 0x8a8378,
    roughness: 0.92,
    metalness: 0.04,
  });
  const snow = new THREE.MeshStandardMaterial({ color: 0xf3f0ea, roughness: 0.62, metalness: 0.02 });
  peaks.forEach(([x, z, w, h], idx) => {
    const geo = new THREE.PlaneGeometry(w, h, segs, Math.max(10, segs >> 1));
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const n = fbm(px * 0.12 + idx * 8, py * 0.1, 4);
      const edge = 1 - Math.abs(px) / (w * 0.5);
      pos.setZ(i, n * 6.5 * Math.max(0, edge));
      pos.setY(i, py + n * 2.2);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, rock);
    mesh.position.set(x, h * 0.18, z);
    parent.add(mesh);
    const cap = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.42, h * 0.22, 8, 6), snow);
    cap.position.set(x, h * 0.52, z - 1.2);
    parent.add(cap);
  });
}

function makePine(tex: TextureKit, scale: number, sway: boolean): THREE.Group {
  const g = new THREE.Group();
  const bark = new THREE.MeshStandardMaterial({ map: tex.bark, color: 0x5a4030, roughness: 0.94 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * scale, 0.13 * scale, 1.5 * scale, 7), bark);
  trunk.position.y = 0.75 * scale;
  trunk.castShadow = true;
  g.add(trunk);
  const greens = [0x2a4a2a, 0x355534, 0x243e26];
  for (let i = 0; i < 4; i += 1) {
    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry((1.05 - i * 0.16) * scale, 1.15 * scale, 8),
      new THREE.MeshStandardMaterial({ color: greens[i % greens.length], roughness: 0.95 })
    );
    foliage.position.y = 1.15 * scale + i * 0.55 * scale;
    foliage.rotation.y = i * 0.4;
    foliage.castShadow = true;
    g.add(foliage);
  }
  g.userData.sway = sway;
  return g;
}

function buildRange(tex: TextureKit, quality: QualityPreset, hits: THREE.Object3D[], parent: THREE.Group): void {
  const wood = new THREE.MeshStandardMaterial({
    map: tex.wood,
    normalMap: tex.woodNormal,
    color: 0xc49a62,
    roughness: 0.68,
    metalness: 0.04,
  });
  const darkWood = new THREE.MeshStandardMaterial({
    map: tex.wood,
    normalMap: tex.woodNormal,
    color: 0x5c3a22,
    roughness: 0.74,
    metalness: 0.05,
  });
  const steel = new THREE.MeshStandardMaterial({
    map: tex.metal,
    color: 0x6a6e74,
    metalness: 0.82,
    roughness: 0.32,
  });
  const rust = new THREE.MeshStandardMaterial({ color: 0x6a4a32, metalness: 0.45, roughness: 0.55 });

  const aw = (w: number, h: number, d: number, x: number, y: number, z: number, mat = wood, kind = 'wood') => {
    const m = addMesh(parent, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
    m.userData.kind = kind;
    hits.push(m);
    return m;
  };

  const gravel = new THREE.MeshStandardMaterial({
    map: tex.gravel,
    normalMap: tex.gravelNormal,
    color: 0x8a8276,
    roughness: 0.9,
    metalness: 0.04,
  });
  const lane = addMesh(parent, new THREE.BoxGeometry(10.5, 0.06, 16), gravel, 0, 0.02, -2.4, false, true);
  lane.userData.kind = 'ground';
  hits.push(lane);

  const pad = addMesh(
    parent,
    new THREE.BoxGeometry(4.4, 0.08, 2.2),
    new THREE.MeshStandardMaterial({
      map: tex.gravel,
      color: 0x7a756c,
      roughness: 0.42,
      metalness: 0.08,
    }),
    0.1,
    0.06,
    3.7,
    false,
    true
  );
  pad.userData.kind = 'ground';
  hits.push(pad);

  aw(2.9, 0.07, 1.05, 0.12, 0.78, 3.82);
  aw(0.09, 0.74, 0.09, -1.2, 0.38, 3.42, darkWood);
  aw(0.09, 0.74, 0.09, 1.38, 0.38, 3.42, darkWood);
  aw(0.09, 0.74, 0.09, -1.2, 0.38, 4.18, darkWood);
  aw(0.09, 0.74, 0.09, 1.38, 0.38, 4.18, darkWood);
  aw(2.7, 0.04, 0.18, 0.12, 0.82, 3.36, darkWood);

  [[-1.18, 0.78, 3.82], [1.36, 0.78, 3.82], [0.12, 0.78, 3.38], [0.12, 0.78, 4.22]].forEach(([x, y, z]) => {
    const bolt = addMesh(parent, new THREE.CylinderGeometry(0.016, 0.016, 0.02, 8), rust, x, y, z, false, false);
    bolt.userData.kind = 'metal';
    hits.push(bolt);
  });

  aw(5.8, 0.09, 0.52, 0, 1.12, -6.15);
  aw(5.5, 0.09, 0.48, 0, 1.66, -7.05);
  aw(4.9, 0.09, 0.46, 0, 2.16, -7.9);

  [-2.62, 2.62].forEach((x) => {
    aw(0.16, 2.62, 0.16, x, 1.32, -6.18, darkWood);
    aw(0.14, 2.78, 0.14, x * 0.92, 1.38, -7.12, darkWood);
    const strap = addMesh(parent, new THREE.BoxGeometry(0.18, 0.05, 0.18), steel, x, 1.55, -6.18, true, true);
    strap.userData.kind = 'metal';
    hits.push(strap);
  });
  aw(5.95, 0.11, 0.14, 0, 2.58, -6.18, darkWood);
  aw(5.7, 0.11, 0.14, 0, 2.74, -7.95, darkWood);

  const roof = addMesh(parent, new THREE.BoxGeometry(6.5, 0.08, 3.5), darkWood, 0, 2.98, -6.9);
  roof.rotation.x = -0.05;
  const sheet = addMesh(
    parent,
    new THREE.BoxGeometry(6.3, 0.03, 3.3),
    new THREE.MeshStandardMaterial({ map: tex.metal, color: 0x6e6860, metalness: 0.55, roughness: 0.4 }),
    0,
    3.04,
    -6.9,
    true,
    true
  );
  sheet.rotation.x = -0.05;
  sheet.userData.kind = 'metal';
  hits.push(sheet);

  const board = (x: number, z: number, ry: number) => {
    const face = addMesh(
      parent,
      new THREE.CylinderGeometry(0.44, 0.44, 0.05, 28),
      new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.58 }),
      x,
      1.18,
      z
    );
    face.rotation.x = Math.PI / 2;
    face.rotation.z = ry;
    [0.34, 0.21, 0.08].forEach((r, i) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r - 0.032, r, 28),
        new THREE.MeshStandardMaterial({ color: i === 2 ? 0xc62828 : 0x1c1c1c, side: THREE.DoubleSide })
      );
      ring.position.set(x, 1.18, z + 0.03);
      ring.rotation.y = ry;
      parent.add(ring);
    });
    aw(0.08, 1.18, 0.08, x, 0.56, z + 0.02, darkWood);
  };
  board(-3.4, -5.3, 0.16);
  board(3.4, -5.3, -0.16);

  if (!quality.propDetail) return;

  const crate = (x: number, y: number, z: number, ry: number) => {
    const box = addMesh(parent, new THREE.BoxGeometry(0.52, 0.34, 0.4), darkWood, x, y, z);
    box.rotation.y = ry;
    [-0.16, 0.16].forEach((ox) => {
      addMesh(parent, new THREE.BoxGeometry(0.04, 0.36, 0.42), wood, x + ox, y, z, true, true).rotation.y = ry;
    });
  };
  crate(-3.55, 0.2, 1.35, 0.18);
  crate(3.45, 0.2, 1.1, -0.22);
  crate(3.62, 0.54, 1.18, 0.08);

  const ammo = new THREE.MeshStandardMaterial({ color: 0x3d4a2c, roughness: 0.55, metalness: 0.25 });
  [[-3.15, 0.42, 1.42], [3.2, 0.18, 1.55]].forEach(([x, y, z]) => {
    const b = addMesh(parent, new THREE.BoxGeometry(0.28, 0.16, 0.18), ammo, x, y, z);
    b.userData.kind = 'metal';
    hits.push(b);
  });

  const tireM = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.94 });
  [[-3.95, 0.2, 0.55], [-3.95, 0.42, 0.55], [3.98, 0.2, 0.28]].forEach(([x, y, z]) => {
    const tire = addMesh(parent, new THREE.TorusGeometry(0.2, 0.075, 10, 18), tireM, x, y, z);
    tire.rotation.x = Math.PI / 2;
  });

  const sign = aw(0.62, 0.9, 0.04, -4.2, 1.12, -3.5, darkWood);
  sign.rotation.y = 0.38;
  const plate = addMesh(
    parent,
    new THREE.PlaneGeometry(0.5, 0.28),
    new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.45 }),
    -4.18,
    1.28,
    -3.47
  );
  plate.rotation.y = 0.38;

  const debris = new THREE.MeshStandardMaterial({ color: 0x6a5a44, roughness: 0.9 });
  for (let i = 0; i < 10; i += 1) {
    const chip = addMesh(
      parent,
      new THREE.BoxGeometry(0.08 + hash2(i, 1) * 0.1, 0.02, 0.05 + hash2(i, 2) * 0.08),
      debris,
      -2 + hash2(i, 3) * 4.2,
      0.08,
      2.6 + hash2(i, 4) * 1.6,
      false,
      true
    );
    chip.rotation.y = hash2(i, 5) * Math.PI;
  }
}

export function buildEnvironment(
  scene: THREE.Scene,
  tex: TextureKit,
  quality: QualityPreset
): EnvHandle {
  const group = new THREE.Group();
  scene.add(group);
  const hitSurfaces: THREE.Object3D[] = [];
  const clouds: THREE.Mesh[] = [];
  const swayTrees: THREE.Object3D[] = [];

  const { sunDir } = buildSky(scene);
  scene.fog = new THREE.Fog(0xb7c9d8, 28, 128);

  const sun = new THREE.DirectionalLight(0xfff1d2, 2.15);
  sun.position.copy(sunDir.clone().multiplyScalar(36));
  sun.castShadow = quality.shadows;
  sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
  sun.shadow.camera.near = 4;
  sun.shadow.camera.far = 80;
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -10;
  sun.shadow.bias = -0.00028;
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xb9cbe0, 0.32));
  scene.add(new THREE.HemisphereLight(0xd5e7ff, 0x5a5344, 0.62));
  const fill = new THREE.DirectionalLight(0xa8c4de, 0.32);
  fill.position.set(12, 7, 6);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffe2b0, 0.42);
  rim.position.set(-10, 9, -18);
  scene.add(rim);

  const terrain = buildTerrain(quality, tex);
  group.add(terrain);
  hitSurfaces.push(terrain);
  buildMountains(quality, tex, group);
  buildRange(tex, quality, hitSurfaces, group);

  const near: Array<[number, number, number]> = [
    [-9.5, -9, 1.15],
    [-12.5, -14, 1.35],
    [10.8, -11, 1.2],
    [14.2, -17, 1.45],
    [-8.2, -18, 1.05],
    [8.6, -20, 1.2],
    [-16, -10, 1.1],
    [17, -13, 1.25],
  ];
  near.slice(0, quality.treeNear).forEach(([x, z, s], i) => {
    const tree = makePine(tex, s, true);
    tree.position.set(x, 0, z);
    tree.rotation.y = hash2(i, 8) * Math.PI;
    group.add(tree);
    swayTrees.push(tree);
  });

  const far: Array<[number, number, number]> = [];
  for (let i = 0; i < quality.treeFar; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    far.push([
      side * (18 + hash2(i, 1) * 22),
      -16 - hash2(i, 2) * 28,
      0.9 + hash2(i, 3) * 0.8,
    ]);
  }
  far.forEach(([x, z, s], i) => {
    const tree = makePine(tex, s, false);
    tree.position.set(x, 0, z);
    tree.rotation.y = hash2(i, 9) * Math.PI;
    group.add(tree);
  });

  for (let i = 0; i < quality.clouds; i += 1) {
    const cloud = new THREE.Mesh(
      new THREE.PlaneGeometry(28 + hash2(i, 1) * 18, 10 + hash2(i, 2) * 6),
      new THREE.MeshBasicMaterial({
        map: tex.cloud,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    cloud.position.set(-30 + i * 12, 22 + hash2(i, 3) * 8, -70 - hash2(i, 4) * 16);
    cloud.lookAt(0, 14, 0);
    group.add(cloud);
    clouds.push(cloud);
  }

  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.MeshBasicMaterial({
      color: 0xd5e2ee,
      transparent: true,
      opacity: 0.055,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  haze.rotation.x = -Math.PI / 2;
  haze.position.y = 0.35;
  group.add(haze);

  let casingInst: THREE.InstancedMesh | null = null;
  if (quality.propDetail) {
    const cgeo = new THREE.CylinderGeometry(0.006, 0.006, 0.022, 6);
    const cmat = new THREE.MeshStandardMaterial({ color: 0xc4a056, metalness: 0.78, roughness: 0.28 });
    casingInst = new THREE.InstancedMesh(cgeo, cmat, 34);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 34; i += 1) {
      dummy.position.set(-0.5 + hash2(i, 1) * 1.2, 0.8, 3.45 + hash2(i, 2) * 0.5);
      dummy.rotation.set(hash2(i, 3) * Math.PI, hash2(i, 4) * Math.PI, hash2(i, 5) * Math.PI);
      dummy.scale.setScalar(0.85 + hash2(i, 6) * 0.3);
      dummy.updateMatrix();
      casingInst.setMatrixAt(i, dummy.matrix);
    }
    group.add(casingInst);
  }

  let dust: THREE.Points | null = null;
  if (quality.dust) {
    const count = 80;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (hash2(i, 1) - 0.5) * 16;
      pos[i * 3 + 1] = 0.4 + hash2(i, 2) * 3.2;
      pos[i * 3 + 2] = -8 + hash2(i, 3) * 14;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dust = new THREE.Points(
      g,
      new THREE.PointsMaterial({ color: 0xd8c9a8, size: 0.035, transparent: true, opacity: 0.28, depthWrite: false })
    );
    group.add(dust);
  }

  return {
    group,
    hitSurfaces,
    sun,
    clouds,
    swayTrees,
    fogHaze: haze,
    casingInst,
    dust,
    update(time: number) {
      this.clouds.forEach((cloud, i) => {
        cloud.position.x += Math.sin(time * 0.02 + i) * 0.004;
      });
      this.swayTrees.forEach((tree, i) => {
        tree.rotation.z = Math.sin(time * 0.55 + i) * 0.018;
      });
      (this.fogHaze.material as THREE.MeshBasicMaterial).opacity = 0.045 + Math.sin(time * 0.28) * 0.012;
      this.sun.intensity = 2.08 + Math.sin(time * 0.12) * 0.06;
      if (this.dust) {
        this.dust.rotation.y = time * 0.015;
        const arr = this.dust.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < arr.count; i += 1) {
          arr.setY(i, 0.4 + ((arr.getY(i) + 0.004 + i * 0.0002) % 3.4));
        }
        arr.needsUpdate = true;
      }
    },
    applyQuality(next: QualityPreset) {
      this.sun.castShadow = next.shadows;
      this.sun.shadow.mapSize.set(next.shadowMapSize, next.shadowMapSize);
    },
  };
}

export function buildEnvMap(renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const probe = new THREE.Scene();
  probe.add(new THREE.HemisphereLight(0xffe6c8, 0x5a6a80, 1.15));
  probe.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(10, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xb6d4ef, side: THREE.BackSide })
    )
  );
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff1c2 })
  );
  sun.position.set(-6, 5, 4);
  probe.add(sun);
  const rt = pmrem.fromScene(probe, 0.04);
  scene.environment = rt.texture;
  pmrem.dispose();
  return rt.texture;
}
