import type { LightingCue } from "@/lib/export-lighting-types";
import { hexToFrontsType, hexToTopsLabel } from "@/lib/lighting-export-colors";
import type { Light, LightingState } from "@/lib/lighting-types";

function avgActiveIntensity(lights: Light[]) {
  const on = lights.filter((l) => l.active && l.intensity > 0);
  if (!on.length) {
    return 0;
  }
  return Math.round(on.reduce((s, l) => s + l.intensity, 0) / on.length);
}

export function lightingStateToExportCue(input: {
  cueNumber: number;
  timestampSeconds: number;
  fadeIn: number;
  description: string;
  state: LightingState;
}): LightingCue {
  const { state, cueNumber, timestampSeconds, fadeIn, description } = input;
  const L = (t: Light["type"]) => state.lights.filter((l) => l.type === t);

  const sideL = L("side-left");
  const sideR = L("side-right");
  const leftOn = sideL.filter((l) => l.active);
  const rightOn = sideR.filter((l) => l.active);
  const allSides = [...sideL, ...sideR];
  const sidesWhich =
    allSides.length && allSides.every((l) => l.active)
      ? "all"
      : [...leftOn, ...rightOn].map((l) => l.name).join(", ") || undefined;

  const tops = L("top");
  const fronts = L("front");
  const specials = L("special").filter((l) => l.active);
  const topOn = tops.filter((t) => t.active);
  const frontOn = fronts.filter((f) => f.active);

  const bd = (id: string) => state.lights.find((l) => l.id === id);
  const backdrops = [bd("backdrop-1"), bd("backdrop-2"), bd("backdrop-3")].filter(Boolean) as Light[];

  const rgbOn = [...leftOn, ...rightOn];
  const sidesRgbPct =
    rgbOn.length > 0
      ? Math.round(rgbOn.reduce((s, l) => s + l.intensity, 0) / rgbOn.length)
      : undefined;

  const cycIntensity = avgActiveIntensity(backdrops);

  return {
    cueNumber,
    timestampSeconds,
    fadeIn,
    description,
    cycColor1: bd("backdrop-1")?.color,
    cycColor2: bd("backdrop-2")?.color,
    cycColor3: bd("backdrop-3")?.color,
    cycIntensity: cycIntensity || undefined,
    sidesColorLeft: sideL[0]?.color,
    sidesColorRight: sideR[0]?.color,
    sidesRgbPct,
    sidesWhich,
    topsColor: hexToTopsLabel((topOn[0] ?? tops[0])?.color),
    topsPct: (topOn.length ? avgActiveIntensity(topOn) : avgActiveIntensity(tops)) || undefined,
    frontsType: hexToFrontsType((frontOn[0] ?? fronts[0])?.color),
    frontsPct:
      (frontOn.length ? avgActiveIntensity(frontOn) : avgActiveIntensity(fronts)) || undefined,
    specials: specials.length ? specials.map((l) => `${l.name} (${l.intensity}%)`).join("; ") : undefined,
  };
}
