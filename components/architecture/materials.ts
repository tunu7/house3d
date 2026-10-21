import * as THREE from "three";

/**
 * Shared, lightweight materials. Created once per module and reused by every
 * mesh so there is a single GPU program per surface type.
 */
export const MATERIALS = {
  exteriorWall: new THREE.MeshStandardMaterial({ color: "#f2efe9", roughness: 0.9 }),
  interiorWall: new THREE.MeshStandardMaterial({ color: "#e6e1d8", roughness: 0.95 }),
  slab: new THREE.MeshStandardMaterial({ color: "#bdb8ae", roughness: 0.85 }),
  plinth: new THREE.MeshStandardMaterial({ color: "#8f8a82", roughness: 0.95 }),
  roof: new THREE.MeshStandardMaterial({ color: "#d4d0c8", roughness: 0.9 }),
  ground: new THREE.MeshStandardMaterial({ color: "#c9cdb8", roughness: 1 }),
  path: new THREE.MeshStandardMaterial({ color: "#d8d2c6", roughness: 0.95 }),
  /** Window frames, railings and handrails: charcoal powder-coated aluminium. */
  frame: new THREE.MeshStandardMaterial({ color: "#3a3a38", roughness: 0.45, metalness: 0.4 }),
  /** Interior door frames and leaves. */
  doorWood: new THREE.MeshStandardMaterial({ color: "#b8956a", roughness: 0.65 }),
  entranceDoor: new THREE.MeshStandardMaterial({ color: "#5b3d27", roughness: 0.55 }),
  stairTread: new THREE.MeshStandardMaterial({ color: "#d6d1c7", roughness: 0.7 }),
  /** Cheap glazing: transparent standard material, no transmission pass. */
  glass: new THREE.MeshStandardMaterial({
    color: "#b9d2dc",
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
} as const;
