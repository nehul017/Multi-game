import * as THREE from 'three';
import type { TextureKit } from './textures';

export interface WeaponHandle {
  group: THREE.Group;
  slide: THREE.Object3D;
  magazine: THREE.Object3D;
  muzzle: THREE.Object3D;
  flashInner: THREE.Mesh;
  flashOuter: THREE.Mesh;
  flashLight: THREE.PointLight;
  shell: THREE.Mesh;
}

function finger(mat: THREE.Material, x: number, y: number, z: number, rx: number, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.046, 4, 8), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.x = rx;
  mesh.rotation.z = rz;
  mesh.castShadow = true;
  return mesh;
}

export function buildWeapon(tex: TextureKit): WeaponHandle {
  const group = new THREE.Group();

  const steel = new THREE.MeshPhysicalMaterial({
    color: 0x2a2d32,
    map: tex.metal,
    metalness: 0.92,
    roughness: 0.22,
    clearcoat: 0.28,
    clearcoatRoughness: 0.22,
  });
  const slideM = new THREE.MeshPhysicalMaterial({
    color: 0x17191d,
    metalness: 0.9,
    roughness: 0.16,
    clearcoat: 0.42,
    clearcoatRoughness: 0.14,
  });
  const poly = new THREE.MeshStandardMaterial({
    color: 0x141416,
    map: tex.grip,
    roughness: 0.62,
    metalness: 0.08,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x0d0d0f,
    map: tex.grip,
    roughness: 0.78,
    metalness: 0.04,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x050506, metalness: 0.86, roughness: 0.18 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc4a056, metalness: 0.8, roughness: 0.26 });
  const glove = new THREE.MeshStandardMaterial({
    color: 0x6b5340,
    map: tex.leather,
    roughness: 0.72,
    metalness: 0.05,
  });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.058, 0.2), steel);
  frame.position.set(0, 0.01, -0.01);
  frame.castShadow = true;

  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.1), dark);
  rail.position.set(0, -0.018, -0.08);

  const slide = new THREE.Group();
  const slideBody = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.036, 0.3), slideM);
  slideBody.position.set(0, 0.05, -0.028);
  slideBody.castShadow = true;
  const slideTop = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.3, 16, 1, false, 0, Math.PI), slideM);
  slideTop.rotation.z = Math.PI / 2;
  slideTop.rotation.y = Math.PI / 2;
  slideTop.position.set(0, 0.066, -0.028);
  const slideNose = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.05, 14), slideM);
  slideNose.rotation.x = Math.PI / 2;
  slideNose.position.set(0, 0.05, -0.19);
  slide.add(slideBody, slideTop, slideNose);

  for (let i = 0; i < 8; i += 1) {
    const ser = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.016, 0.005), dark);
    ser.position.set(0, 0.058, 0.07 - i * 0.01);
    slide.add(ser);
  }

  const eject = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.014, 0.046), dark);
  eject.position.set(0.026, 0.06, -0.04);
  slide.add(eject);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.19, 18), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.038, -0.22);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.011, 0.018, 14), steel);
  crown.rotation.x = Math.PI / 2;
  crown.position.set(0, 0.038, -0.325);
  const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.02, 10), dark);
  bore.rotation.x = Math.PI / 2;
  bore.position.set(0, 0.038, -0.336);

  const fs = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.018, 0.014), dark);
  fs.position.set(0, 0.086, -0.168);
  const rs = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.012, 0.012), dark);
  rs.position.set(0, 0.084, 0.1);
  const notch = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.01, 0.013), dark);
  notch.position.set(0, 0.09, 0.1);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.132, 0.072), rubber);
  grip.position.set(0, -0.092, 0.068);
  grip.rotation.x = 0.34;
  grip.castShadow = true;
  const backstrap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.02), poly);
  backstrap.position.set(0, -0.09, 0.108);
  backstrap.rotation.x = 0.34;

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.138, 0.05), steel);
  mag.position.set(0, -0.168, 0.052);
  const magPlate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.014, 0.056), poly);
  magPlate.position.set(0, -0.24, 0.048);

  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 10, 20, Math.PI), steel);
  guard.rotation.y = Math.PI / 2;
  guard.position.set(0, -0.016, 0.006);
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.024, 0.009), steel);
  trigger.position.set(0, -0.018, 0.01);
  trigger.rotation.x = 0.15;

  const slideStop = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.006, 0.006), steel);
  slideStop.position.set(0.038, 0.02, 0.02);
  const takeDown = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.02, 8), steel);
  takeDown.rotation.z = Math.PI / 2;
  takeDown.position.set(0.04, 0.01, -0.03);

  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.086, 0.062, 0.1), glove);
  palm.position.set(0.012, -0.138, 0.108);
  palm.rotation.x = 0.36;
  palm.rotation.z = 0.07;
  palm.castShadow = true;
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.11, 10), glove);
  wrist.position.set(0.03, -0.2, 0.175);
  wrist.rotation.x = 1.05;
  wrist.rotation.z = 0.12;
  const thumb = finger(glove, -0.04, -0.062, 0.055, 0.35, 0.72);
  thumb.scale.set(1.05, 1.15, 1);
  const index = finger(glove, -0.016, -0.028, 0.02, 0.2, 0.05);
  const mid = finger(glove, 0.004, -0.195, 0.1, 1.18);
  const ring = finger(glove, 0.022, -0.192, 0.102, 1.2);
  const pinky = finger(glove, 0.038, -0.182, 0.1, 1.16);

  const flashMat = new THREE.MeshBasicMaterial({
    map: tex.flash,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const flashOuterMat = flashMat.clone();
  flashOuterMat.opacity = 0.45;
  const flashInner = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.14), flashMat);
  flashInner.position.set(0, 0.038, -0.355);
  flashInner.name = 'fi';
  flashInner.visible = false;
  const flashOuter = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), flashOuterMat);
  flashOuter.position.set(0, 0.038, -0.37);
  flashOuter.name = 'fo';
  flashOuter.visible = false;

  const flashLight = new THREE.PointLight(0xffe08a, 0, 3.4);
  flashLight.position.set(0, 0.05, -0.37);
  flashLight.name = 'ml';

  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.026, 8), brass);
  shell.rotation.z = Math.PI / 2;
  shell.name = 'sh';
  shell.visible = false;

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0.038, -0.35);

  group.add(
    frame,
    rail,
    slide,
    barrel,
    crown,
    bore,
    fs,
    rs,
    notch,
    grip,
    backstrap,
    mag,
    magPlate,
    guard,
    trigger,
    slideStop,
    takeDown,
    palm,
    wrist,
    thumb,
    index,
    mid,
    ring,
    pinky,
    flashInner,
    flashOuter,
    flashLight,
    shell,
    muzzle
  );

  return {
    group,
    slide,
    magazine: mag,
    muzzle,
    flashInner,
    flashOuter,
    flashLight,
    shell,
  };
}
