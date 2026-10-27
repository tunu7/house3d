import * as THREE from "three";
import { ARCH_COLORS } from "@/lib/style/theme";

/**
 * `userData` flag for materials whose detail is finer than a pixel (grass
 * blades, leaf cards): the path tracer's denoiser filters them as a whole
 * instead of separating surface colour from lighting.
 */
export const FINE_DETAIL = "fineDetail";

/** `userData` flag for thin leaves the path tracer should let some light through (backlit palm fronds). */
export const TRANSLUCENT = "translucent";

/**
 * Shared, lightweight materials. Created once per module and reused by every
 * mesh so there is a single GPU program per surface type.
 */
export const MATERIALS = {
  // Warm cream render, as in the owner's reference photo (R9).
  exteriorWall: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.exteriorWall, roughness: 0.9 }),
  interiorWall: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.interiorWall, roughness: 0.95 }),
  // Slabs read as white ceilings from inside.
  slab: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.slab, roughness: 0.9 }),
  plinth: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.plinth, roughness: 0.9 }),
  roof: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.roof, roughness: 0.9 }),
  // Lawn: seen between grass blades, so filtered as fine detail by the path tracer's denoiser.
  ground: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.ground, roughness: 1, userData: { [FINE_DETAIL]: true } }),
  path: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.path, roughness: 0.85 }),
  /** Street carriageway (textured at runtime) and its white lane markings. */
  asphalt: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.asphalt, roughness: 0.92 }),
  marking: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.marking, roughness: 0.7 }),
  pebbles: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.pebbles, roughness: 1 }),
  /** Charcoal fascias, frames and parapet coping. */
  fascia: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.fascia, roughness: 0.6 }),
  /** White eaves and slab edges. */
  eave: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.eave, roughness: 0.8 }),
  /** Brushed stainless door levers. */
  handle: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.handle, roughness: 0.3, metalness: 0.9 }),
  /** Painted timber skirting. */
  skirting: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.skirting, roughness: 0.45 }),
  /** Rainwater pipes. */
  pipe: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.pipe, roughness: 0.5, metalness: 0.3 }),
  /** Lamp diffusers: softly lit by day, bright at dusk (set by the lighting preset). */
  bulb: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.bulb, emissive: ARCH_COLORS.bulbGlow, emissiveIntensity: 0.15, roughness: 0.3 }),
  /** Sheer curtains. */
  sheer: new THREE.MeshStandardMaterial({
    color: ARCH_COLORS.sheer,
    roughness: 1,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  }),
  /** Planting on the facade and in planters. */
  leaf: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.leaf, roughness: 0.9 }),
  /** Warm light sources: downlights, sconces, step strips, bollard heads. */
  glow: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.glow, emissive: ARCH_COLORS.glowEmissive, emissiveIntensity: 1.6, roughness: 0.4 }),
  /** Window frames, railings and handrails: charcoal powder-coated aluminium. */
  frame: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.frame, roughness: 0.35, metalness: 0.6 }),
  /** Interior door frames and leaves. */
  doorWood: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.doorWood, roughness: 0.65 }),
  entranceDoor: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.entranceDoor, roughness: 0.55 }),
  stairTread: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.stairTread, roughness: 0.7 }),
  /** Driveway pavers (concrete texture added at runtime). */
  paving: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.paving, roughness: 0.9 }),
  rubber: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.rubber, roughness: 0.95 }),
  poolTile: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.poolTile, roughness: 0.35 }),
  /**
   * Pool water in real time: a glossy, tinted, partly see-through surface.
   * The photoreal render swaps in refracting water (see PathTracer).
   */
  water: new THREE.MeshStandardMaterial({
    color: ARCH_COLORS.water,
    roughness: 0.04,
    metalness: 0.1,
    envMapIntensity: 1.6,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  }),
  timber: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.timber, roughness: 0.75 }),
  roofShingle: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.roofShingle, roughness: 0.9 }),
  soil: new THREE.MeshStandardMaterial({ color: ARCH_COLORS.soil, roughness: 1 }),
  /**
   * Glazing: transparent with strong environment reflections instead of a
   * costly transmission pass, so windows mirror the sky at grazing angles.
   */
  glass: new THREE.MeshStandardMaterial({
    color: ARCH_COLORS.glass,
    roughness: 0.03,
    metalness: 0.15,
    envMapIntensity: 2.2,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
} as const;
