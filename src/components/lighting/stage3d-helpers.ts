import type { Light } from "@/lib/lighting-types";

/** Stage world dimensions. */
export const STAGE_WIDTH = 14; // x: -7..+7
export const STAGE_DEPTH = 10; // z: -5..+5

function fixtureIndex(id: string): number {
  const match = id.match(/(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : 1;
}

/**
 * Maps grid coordinates (0..100 each axis, where y is depth from upstage)
 * to three.js world coords on the stage floor plane.
 * 0,0 = upstage-left.  100,100 = downstage-right.
 */
export function gridToFloor(x: number, y: number): [number, number, number] {
  const clampedX = Math.max(0, Math.min(100, x));
  const clampedY = Math.max(0, Math.min(100, y));
  const worldX = (clampedX / 100) * STAGE_WIDTH - STAGE_WIDTH / 2;
  const worldZ = (clampedY / 100) * STAGE_DEPTH - STAGE_DEPTH / 2;
  return [worldX, 0, worldZ];
}

/** Scale UI 0..100 intensity to three.js lumens (0..12). Clamps out-of-range. */
export function intensityScale(intensity: number): number {
  if (!Number.isFinite(intensity)) return 0;
  const clamped = Math.max(0, Math.min(100, intensity));
  return (clamped / 100) * 12;
}

/** Compute world-space fixture position (where the light hangs). */
export function buildLightPosition(light: Light): [number, number, number] {
  switch (light.type) {
    case "top": {
      const idx = fixtureIndex(light.id);
      const positions: [number, number, number][] = [
        [-4.5, 6.4, -1.5],
        [-1.5, 6.4, 0.5],
        [1.5, 6.4, 0.5],
        [4.5, 6.4, -1.5],
      ];
      return positions[(idx - 1) % positions.length]!;
    }
    case "side-left":
      return fixtureIndex(light.id) === 1 ? [-6.8, 2.8, 2.5] : [-6.8, 4.6, -0.5];
    case "side-right":
      return fixtureIndex(light.id) === 1 ? [6.8, 2.8, 2.5] : [6.8, 4.6, -0.5];
    case "front": {
      return fixtureIndex(light.id) === 1 ? [-4.2, 6, 7.5] : [4.2, 6, 7.5];
    }
    case "special": {
      const [fx, , fz] = gridToFloor(light.position.x, light.position.y);
      return [fx, 6, fz];
    }
    case "backdrop": {
      const idx = fixtureIndex(light.id);
      const positions: [number, number, number][] = [
        [-4.5, 4.8, -7.8],
        [0, 4.8, -7.8],
        [4.5, 4.8, -7.8],
      ];
      return positions[(idx - 1) % positions.length]!;
    }
    default:
      return [0, 4.8, -7.8];
  }
}

/** Compute world-space target point (where the light points). */
export function buildLightTarget(light: Light): [number, number, number] {
  switch (light.type) {
    case "top": {
      const idx = fixtureIndex(light.id);
      const targets: [number, number, number][] = [
        [-3.5, 0.2, 1],
        [-1.2, 0.2, 1.5],
        [1.2, 0.2, 1.5],
        [3.5, 0.2, 1],
      ];
      return targets[(idx - 1) % targets.length]!;
    }
    case "side-left":
      return fixtureIndex(light.id) === 1 ? [-1.6, 1.25, 2] : [-0.8, 1.7, -0.8];
    case "side-right":
      return fixtureIndex(light.id) === 1 ? [1.6, 1.25, 2] : [0.8, 1.7, -0.8];
    case "front":
      return fixtureIndex(light.id) === 1 ? [-2.2, 1.5, 2] : [2.2, 1.5, 2];
    case "special": {
      const [fx, , fz] = gridToFloor(light.position.x, light.position.y);
      return [fx, 0, fz];
    }
    case "backdrop": {
      const idx = fixtureIndex(light.id);
      const targets: [number, number, number][] = [
        [-4.5, 3, -5.2],
        [0, 3, -5.2],
        [4.5, 3, -5.2],
      ];
      return targets[(idx - 1) % targets.length]!;
    }
    default:
      return [0, 3, -5.2];
  }
}

export function computeShadowCasters(lights: Light[]): Set<string> {
  const actives = lights
    .filter((l) => l.type !== "backdrop" && l.active && l.intensity > 0)
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 6);
  return new Set(actives.map((l) => l.id));
}

export function penumbraForType(type: Light["type"]): number {
  switch (type) {
    case "special":
      return 0.3;
    case "top":
      return 0.55;
    case "front":
      return 0.6;
    case "side-left":
    case "side-right":
      return 0.5;
    default:
      return 0.7;
  }
}

export function angleForType(type: Light["type"]): number {
  switch (type) {
    case "special":
      return 0.35;
    case "top":
      return 0.55;
    case "front":
      return 0.75;
    case "side-left":
    case "side-right":
      return 0.7;
    default:
      return 0.9;
  }
}
