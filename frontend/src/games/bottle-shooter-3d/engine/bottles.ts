import * as THREE from 'three';
import type { BottleKind } from '../types';
import type { QualityPreset } from './quality';
import type { TextureKit } from './textures';

export const KIND_SCORE: Record<BottleKind, number> = {
  normal: 100,
  heavy: 100,
  moving: 250,
  spinning: 250,
  bonus: 350,
  gold: 1000,
};

export const KIND_COLOR: Record<BottleKind, number> = {
  normal: 0x2f6b4a,
  heavy: 0x5a3318,
  moving: 0x2a628c,
  spinning: 0x1f7a68,
  bonus: 0x6a3488,
  gold: 0xc4921a,
};

type Profile = Array<[number, number]>;

const PROFILES: Profile[] = [
  // classic soda
  [[0, 0], [0.11, 0], [0.115, 0.02], [0.108, 0.34], [0.07, 0.42], [0.038, 0.5], [0.034, 0.6], [0.04, 0.63], [0, 0.63]],
  // wine
  [[0, 0], [0.105, 0], [0.11, 0.018], [0.108, 0.3], [0.08, 0.38], [0.036, 0.48], [0.032, 0.64], [0.038, 0.67], [0, 0.67]],
  // beer
  [[0, 0], [0.1, 0], [0.104, 0.016], [0.1, 0.26], [0.072, 0.33], [0.038, 0.39], [0.034, 0.48], [0.04, 0.5], [0, 0.5]],
  // flask
  [[0, 0], [0.08, 0], [0.13, 0.08], [0.132, 0.2], [0.1, 0.28], [0.04, 0.34], [0.032, 0.44], [0.038, 0.46], [0, 0.46]],
  // vodka
  [[0, 0], [0.07, 0], [0.072, 0.014], [0.068, 0.4], [0.04, 0.46], [0.028, 0.58], [0.032, 0.6], [0, 0.6]],
];

function lathe(profile: Profile, scale: number, segs: number): THREE.LatheGeometry {
  const pts = profile.map(([x, y]) => new THREE.Vector2(x * scale, y * scale));
  return new THREE.LatheGeometry(pts, segs);
}

export function glassMaterial(kind: BottleKind, quality: QualityPreset): THREE.MeshPhysicalMaterial {
  const color = KIND_COLOR[kind];
  const gold = kind === 'gold';
  const useTx = quality.transmission && !gold;
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: gold ? 0.16 : 0.045,
    metalness: gold ? 0.62 : 0.02,
    transmission: useTx ? 0.86 : 0,
    thickness: kind === 'heavy' ? 0.75 : 0.42,
    ior: 1.52,
    transparent: true,
    opacity: useTx ? 1 : gold ? 0.92 : 0.78,
    attenuationColor: new THREE.Color(color),
    attenuationDistance: 0.55,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.35,
    emissive: gold ? 0x4a3000 : kind === 'bonus' ? 0x2a1038 : 0x000000,
    emissiveIntensity: gold ? 0.22 : kind === 'bonus' ? 0.18 : 0,
  });
}

export interface BottleMesh {
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  glass: THREE.MeshPhysicalMaterial;
  sparkleRing: THREE.Mesh | null;
  crackDecal: THREE.Mesh;
  topY: number;
  hitH: number;
}

export function createBottleMesh(
  kind: BottleKind,
  scale: number,
  id: number,
  quality: QualityPreset,
  tex: TextureKit
): BottleMesh {
  const group = new THREE.Group();
  const s = scale * 1.38 * (kind === 'heavy' ? 1.12 : kind === 'gold' ? 1.06 : 1);
  const segs = quality.id === 'low' ? 14 : quality.id === 'medium' ? 20 : 28;
  const profile = PROFILES[kind === 'gold' ? 1 : kind === 'bonus' ? 3 : kind === 'heavy' ? 2 : id % PROFILES.length];
  const glass = glassMaterial(kind, quality);
  const body = new THREE.Mesh(lathe(profile, s, segs), glass);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const liquidProfile = profile
    .filter(([, y]) => y > 0.02 && y < profile[profile.length - 1][1] * 0.58)
    .map(([x, y]) => [Math.max(0.01, x * 0.82), y] as [number, number]);
  if (liquidProfile.length >= 3) {
    const liquid = new THREE.Mesh(
      lathe([[0, liquidProfile[0][1]], ...liquidProfile, [0, liquidProfile[liquidProfile.length - 1][1]]], s, Math.max(12, segs - 6)),
      new THREE.MeshPhysicalMaterial({
        color: KIND_COLOR[kind],
        roughness: 0.2,
        metalness: 0,
        transparent: true,
        opacity: 0.55,
        transmission: quality.transmission ? 0.25 : 0,
        thickness: 0.3,
      })
    );
    group.add(liquid);
  }

  const topY = profile[profile.length - 1][1] * s;
  const hitH = topY + 0.04 * s;
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034 * s, 0.034 * s, 0.032 * s, 12),
    new THREE.MeshStandardMaterial({
      color: kind === 'gold' ? 0xe6c35c : 0x1c1c1c,
      metalness: 0.72,
      roughness: 0.32,
    })
  );
  cap.position.y = topY + 0.016 * s;
  cap.castShadow = true;
  group.add(cap);

  const midR = profile[3][0] * s;
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(midR + 0.002, midR + 0.004, 0.12 * s, 22, 1, true),
    new THREE.MeshStandardMaterial({
      map: tex.labels[kind],
      roughness: 0.62,
      metalness: 0.02,
      side: THREE.DoubleSide,
    })
  );
  label.position.y = 0.2 * s;
  group.add(label);

  const crackDecal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18 * s, 0.28 * s),
    new THREE.MeshBasicMaterial({
      map: tex.crack,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  crackDecal.position.set(0.01, 0.22 * s, midR + 0.006);
  group.add(crackDecal);

  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13 * s, 0.14 * s, hitH, 10),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.y = hitH * 0.5;
  group.add(hit);

  let sparkleRing: THREE.Mesh | null = null;
  if (kind === 'bonus') {
    sparkleRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.16 * s, 0.007 * s, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0xd498f0, transparent: true, opacity: 0.55, depthWrite: false })
    );
    sparkleRing.position.y = 0.26 * s;
    group.add(sparkleRing);
  }

  return { group, hitMesh: hit, glass, sparkleRing, crackDecal, topY, hitH };
}
