"use client";

import * as React from "react";
import { Canvas } from "@react-three/fiber";
import {
  SpotLight as DreiSpotLight,
  ContactShadows,
  Environment,
  useDepthBuffer,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import type { Light } from "@/lib/lighting-types";
import {
  STAGE_WIDTH,
  STAGE_DEPTH,
  gridToFloor,
  intensityScale,
  buildLightPosition,
  buildLightTarget,
  computeShadowCasters,
  angleForType,
} from "./stage3d-helpers";

// Re-export pure helpers for external consumers/tests.
export {
  gridToFloor,
  intensityScale,
  buildLightPosition,
  buildLightTarget,
};

/* Environment / scene constants tuned for a "contemporary dance black box"
 * look: near-black, heavy haze, low-density fog, cinematic tone-mapping.
 * DO NOT enable logarithmicDepthBuffer on the Canvas — drei volumetric
 * SpotLight breaks without a proper depth buffer (drei issue #1722). */
const BG_COLOR = "#020203";
const FOG_NEAR = 14;
const FOG_FAR = 38;
const CAMERA_POSITION: [number, number, number] = [0, 3.2, 14];
const CAMERA_TARGET: [number, number, number] = [0, 1.8, 0];

function usePrefersReducedMotion() {
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, []);
  return reduce;
}

/* ============================================================
 * Angle/attenuation/distance per fixture type
 * Drei volumetric SpotLight wants TIGHTER angles and lower
 * intensities than vanilla three.SpotLight — the cone is
 * rendered as a painted mesh, not raw lumens.
 * ============================================================ */
function dreiAngleForType(type: Light["type"]): number {
  switch (type) {
    case "special":
      return 0.18;
    case "top":
      return 0.38;
    case "front":
      return 0.45;
    case "side-left":
    case "side-right":
      return 0.5;
    case "backdrop":
      return 0.24;
    default:
      return angleForType(type);
  }
}

function dreiDistanceForType(type: Light["type"]): number {
  switch (type) {
    case "special":
      return 16;
    case "top":
      return 14;
    case "front":
      return 18;
    case "side-left":
    case "side-right":
      return 16;
    case "backdrop":
      return 12;
    default:
      return 14;
  }
}

/* ============================================================
 * StageSpot — one fixture (drei volumetric w/ shared depth buffer)
 * ============================================================ */

interface StageSpotProps {
  light: Light;
  shadowCastingIds: Set<string>;
  reduceMotion: boolean;
  depthBuffer?: THREE.DepthTexture;
  onHover: (lightId: string | null) => void;
  onClick: (lightId: string, shift: boolean) => void;
  onDoubleClick: (lightId: string) => void;
  hovered: boolean;
  selected: boolean;
  fixturesVisible: boolean;
}

const StageSpot = React.memo(function StageSpot({
  light,
  shadowCastingIds,
  reduceMotion,
  depthBuffer,
  onHover,
  onClick,
  onDoubleClick,
  hovered,
  selected,
  fixturesVisible,
}: StageSpotProps) {
  const position = buildLightPosition(light);
  const target = buildLightTarget(light);
  const targetRef = React.useRef<THREE.Object3D>(null);
  const spotRef = React.useRef<THREE.SpotLight>(null);

  // Drei volumetric mesh is painted via a shader that requires much
  // higher intensity than raw three.SpotLight to read visibly as a cone.
  // Empirically ~2.5× the normalized UI value gives soft but clearly
  // visible beams without blowing out the floor wash.
  const effectiveIntensity =
    light.active && light.intensity > 0 ? (light.intensity / 100) * 2.5 : 0;

  const [tx, ty, tz] = target;
  React.useEffect(() => {
    if (spotRef.current && targetRef.current) {
      spotRef.current.target = targetRef.current;
      targetRef.current.updateMatrixWorld();
    }
  }, [tx, ty, tz]);

  const castShadow = shadowCastingIds.has(light.id) && effectiveIntensity > 0;
  const useVolumetric = !reduceMotion;

  // Indicator body: tiny matte cylinder (miniature lantern body) instead
  // of a glowing sphere. Emissive tint only when active+hovered/selected.
  const indicatorEmissive = light.active
    ? light.color
    : (hovered || selected)
      ? "#7aa2ff"
      : "#000000";

  return (
    <group>
      <object3D ref={targetRef} position={target} />
      {useVolumetric ? (
        <DreiSpotLight
          ref={spotRef as unknown as React.Ref<THREE.SpotLight>}
          position={position}
          color={light.color}
          intensity={effectiveIntensity}
          angle={dreiAngleForType(light.type)}
          distance={dreiDistanceForType(light.type)}
          castShadow={castShadow}
          attenuation={8}
          anglePower={2}
          opacity={effectiveIntensity > 0 ? 0.25 : 0}
          volumetric
          depthBuffer={depthBuffer}
        />
      ) : (
        <spotLight
          ref={spotRef}
          position={position}
          color={light.color}
          intensity={intensityScale(light.intensity) * (light.active ? 1 : 0)}
          angle={dreiAngleForType(light.type)}
          penumbra={0.5}
          distance={dreiDistanceForType(light.type)}
          decay={1.6}
          castShadow={castShadow}
        />
      )}

      {fixturesVisible && (
        <mesh
          position={position}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(light.id);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            onHover(null);
            document.body.style.cursor = "";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick(light.id, e.shiftKey);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onDoubleClick(light.id);
          }}
        >
          {/* Miniature stage lantern body — matte cylinder, not a glowing sphere. */}
          <cylinderGeometry args={[0.08, 0.1, 0.2, 12]} />
          <meshStandardMaterial
            color="#0a0a0a"
            roughness={0.9}
            metalness={0.1}
            emissive={indicatorEmissive}
            emissiveIntensity={
              light.active ? 0.4 : (hovered || selected ? 0.8 : 0)
            }
          />
          {(selected || hovered) && (
            <mesh>
              <ringGeometry args={[0.16, 0.22, 24]} />
              <meshBasicMaterial
                color={selected ? "#60a5fa" : "#a1a1aa"}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </mesh>
      )}
    </group>
  );
});

/* ============================================================
 * Dancer — procedural humanoid silhouette with Vitruvian-ish
 * proportions. ~1.75 m tall, 7 welded segments.
 * Used because sandboxed GLB downloads from Poly Pizza / Quaternius
 * were not reachable at build time — see AGENTS.md step 2 fallback D.
 * ============================================================ */

function Dancer({
  x,
  z = 2,
  armAngle = 0.2,
  headTilt = 0,
}: {
  x: number;
  z?: number;
  armAngle?: number;
  headTilt?: number;
}) {
  // Shared silhouette material — charcoal with emissive lift so figures
  // always read against haze/wash. Pure black would vanish on a lit stage.
  const silhouetteProps = {
    color: "#1a1a1a",
    emissive: "#161616",
    emissiveIntensity: 0.45,
    roughness: 0.75,
    metalness: 0,
  } as const;

  return (
    <group position={[x, 0, z]}>
      {/* Pelvis */}
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.18, 0.22]} />
        <meshStandardMaterial {...silhouetteProps} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 1.21, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.64, 0.24]} />
        <meshStandardMaterial {...silhouetteProps} />
      </mesh>

      {/* Head */}
      <group position={[0, 1.59, 0]} rotation={[headTilt, 0, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.16, 20, 20]} />
          <meshStandardMaterial {...silhouetteProps} />
        </mesh>
      </group>

      {/* Left arm */}
      <group position={[-0.31, 1.42, 0]} rotation={[0, 0, armAngle]}>
        <mesh position={[0, -0.36, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.055, 0.05, 0.72, 12]} />
          <meshStandardMaterial {...silhouetteProps} />
        </mesh>
      </group>

      {/* Right arm (mirror) */}
      <group position={[0.31, 1.42, 0]} rotation={[0, 0, -armAngle]}>
        <mesh position={[0, -0.36, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.055, 0.05, 0.72, 12]} />
          <meshStandardMaterial {...silhouetteProps} />
        </mesh>
      </group>

      {/* Left leg */}
      <mesh position={[-0.11, 0.43, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.065, 0.86, 12]} />
        <meshStandardMaterial {...silhouetteProps} />
      </mesh>

      {/* Right leg (mirror) */}
      <mesh position={[0.11, 0.43, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.065, 0.86, 12]} />
        <meshStandardMaterial {...silhouetteProps} />
      </mesh>
    </group>
  );
}

/* ============================================================
 * Marley floor — PBR from Poly Haven "rubber tiles" pack (CC0).
 * Textures live in /public/textures/floor. If any file is missing,
 * falls back gracefully to a charcoal-colored roughness material.
 * ============================================================ */

function MarleyFloor() {
  const [diff, nor, rough] = useTexture([
    "/textures/floor/floor_diff.jpg",
    "/textures/floor/floor_nor.jpg",
    "/textures/floor/floor_rough.jpg",
  ]);

  React.useMemo(() => {
    [diff, nor, rough].forEach((t) => {
      if (!t) return;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(4, 3);
      t.anisotropy = 8;
    });
    // Diffuse should be sRGB; others linear
    if (diff) diff.colorSpace = THREE.SRGBColorSpace;
  }, [diff, nor, rough]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[STAGE_WIDTH, STAGE_DEPTH]} />
      <meshStandardMaterial
        map={diff ?? undefined}
        normalMap={nor ?? undefined}
        roughnessMap={rough ?? undefined}
        // Reviewer wants a black floor. We keep the texture for subtle grain
        // under spot pools but multiply the diffuse by near-black so the base
        // reads as charcoal-black; bumps still catch light pools.
        color="#0a0a0a"
        roughness={0.95}
        metalness={0}
      />
    </mesh>
  );
}

/* ============================================================
 * Proscenium / masking / cyc / truss — the "black box" architecture
 * ============================================================ */

function StageArchitecture({ cycColor }: { cycColor: string }) {
  return (
    <group>
      {/* Cyclorama — curved color backdrop only. Proscenium frame, side
          masking legs, top teasers, and overhead truss were removed per
          reviewer feedback (stage felt too crowded / architectural). */}
      <mesh position={[0, 4, -18]}>
        <cylinderGeometry args={[11, 11, 8, 64, 1, true, -1.22173, 2.44346]} />
        <meshBasicMaterial
          color={cycColor}
          fog={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* ============================================================
 * SceneLights — owns the shared depth buffer for all SpotLights.
 * useDepthBuffer must be called inside Canvas, so this component
 * is rendered as a Canvas child.
 * ============================================================ */

interface SceneLightsProps {
  lights: Light[];
  selectedLights: string[];
  reduceMotion: boolean;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  onLightClick: (id: string, shift: boolean) => void;
  onLightToggle: (id: string) => void;
  fixturesVisible: boolean;
}

function SceneLights({
  lights,
  selectedLights,
  reduceMotion,
  hovered,
  setHovered,
  onLightClick,
  onLightToggle,
  fixturesVisible,
}: SceneLightsProps) {
  // CRITICAL: drei volumetric SpotLight needs a depth buffer to mask
  // its cone against scene geometry — otherwise cones render as flat
  // triangles. Shared across all spots.
  const depthBuffer = useDepthBuffer({ frames: 1 });

  const shadowCastingIds = React.useMemo(
    () => computeShadowCasters(lights),
    [lights],
  );

  return (
    <>
      {lights.map((light) => (
        <StageSpot
          key={light.id}
          light={light}
          shadowCastingIds={shadowCastingIds}
          reduceMotion={reduceMotion}
          depthBuffer={depthBuffer}
          onHover={setHovered}
          onClick={onLightClick}
          onDoubleClick={onLightToggle}
          hovered={hovered === light.id}
          selected={selectedLights.includes(light.id)}
          fixturesVisible={fixturesVisible}
        />
      ))}
    </>
  );
}

/* ============================================================
 * Stage3D — main component
 * ============================================================ */

export interface Stage3DProps {
  lights: Light[];
  backdropColor: string;
  stageColor: string;
  showPerformer: boolean;
  selectedLights: string[];
  onLightClick: (lightId: string, multiSelect: boolean) => void;
  onLightToggle: (lightId: string) => void;
}

export default function Stage3D({
  lights,
  backdropColor,
  stageColor,
  showPerformer,
  selectedLights,
  onLightClick,
  onLightToggle,
}: Stage3DProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [fixturesVisible, setFixturesVisible] = React.useState(true);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-black">
      <Canvas
        shadows
        camera={{ position: CAMERA_POSITION, fov: 36, near: 0.1, far: 60 }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          // Do NOT enable logarithmicDepthBuffer — breaks drei volumetric.
        }}
        onCreated={({ camera, gl }) => {
          camera.position.set(...CAMERA_POSITION);
          camera.lookAt(...CAMERA_TARGET);
          camera.updateProjectionMatrix();
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        {/* Near-black background (not pure black — gives bloom something
            to lift so the scene doesn't crush to zero). */}
        <color attach="background" args={[BG_COLOR]} />

        {/* Low-density linear fog for haze. FOG_NEAR must be in front
            of the camera position.z or beams get clipped instantly. */}
        <fog attach="fog" args={["#000000", FOG_NEAR, FOG_FAR]} />

        {/* Ultra-low-level environment: just enough to hint at skin/fabric
            microfacets on the dancers' edges without lifting the blacks. */}
        <React.Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.12} />
        </React.Suspense>

        <ambientLight intensity={0.14} />
        <hemisphereLight args={["#7c8696", "#050505", 0.18]} />

        {/* Architecture: proscenium, side legs, teasers, cyc, truss */}
        <StageArchitecture cycColor={backdropColor} />

        {/* Floor — Marley PBR */}
        <React.Suspense
          fallback={
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[STAGE_WIDTH, STAGE_DEPTH]} />
              <meshStandardMaterial
                color={stageColor}
                roughness={0.75}
                metalness={0.05}
              />
            </mesh>
          }
        >
          <MarleyFloor />
        </React.Suspense>

        {/* Dancers — three silhouetted figures, slightly differentiated
            pose so they don't look like clones. */}
        {showPerformer && (
          <>
            <Dancer x={-3} armAngle={0.35} headTilt={-0.05} />
            <Dancer x={0} armAngle={0.15} headTilt={0.04} />
            <Dancer x={3} armAngle={-0.25} headTilt={-0.02} />
          </>
        )}

        {showPerformer && (
          <ContactShadows
            position={[0, 0.01, 2]}
            opacity={0.45}
            scale={STAGE_WIDTH}
            blur={2.8}
            far={4.5}
          />
        )}

        {/* Scene lights — drei SpotLights with shared depthBuffer */}
        <SceneLights
          lights={lights}
          selectedLights={selectedLights}
          reduceMotion={reduceMotion}
          hovered={hovered}
          setHovered={setHovered}
          onLightClick={onLightClick}
          onLightToggle={onLightToggle}
          fixturesVisible={fixturesVisible}
        />

      </Canvas>

      {/* Fixture toggle */}
      <button
        type="button"
        onClick={() => setFixturesVisible((v) => !v)}
        className="absolute top-3 right-3 rounded-md bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-700 border border-zinc-700"
      >
        {fixturesVisible ? "Hide" : "Show"} Fixtures
      </button>
    </div>
  );
}
