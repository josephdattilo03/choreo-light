import {
  createDefaultLightingState,
  createDefaultTimeline,
  type Cue,
  type LightingState,
  type LightingTimeline,
} from "@/lib/lighting-types";
import { clampTimelineTime, normalizeTimeline } from "@/lib/lighting-timeline";

export const LIGHTING_PROJECT_CACHE_KEY = "choreo-light-project-cache";
const CACHE_VERSION = 1;

export interface LightingProjectCache {
  version: number;
  currentState: LightingState;
  cues: Cue[];
  timeline: LightingTimeline;
  activeCueId?: string;
  activeKeyframeId?: string;
  customColor: string;
  playheadMs: number;
}

export function createDefaultProjectCache(): LightingProjectCache {
  return {
    version: CACHE_VERSION,
    currentState: createDefaultLightingState(),
    cues: [],
    timeline: createDefaultTimeline(),
    activeCueId: undefined,
    activeKeyframeId: undefined,
    customColor: "#ff00ff",
    playheadMs: 0,
  };
}

export function loadLightingProjectCache() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawCache = window.localStorage.getItem(LIGHTING_PROJECT_CACHE_KEY);
  if (!rawCache) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawCache) as Partial<LightingProjectCache>;
    const defaults = createDefaultProjectCache();
    const timeline = normalizeTimeline(parsed.timeline ?? defaults.timeline);

    return {
      ...defaults,
      ...parsed,
      timeline,
      playheadMs: clampTimelineTime(parsed.playheadMs ?? 0, timeline.durationMs),
      version: CACHE_VERSION,
    } satisfies LightingProjectCache;
  } catch {
    return null;
  }
}

export function saveLightingProjectCache(cache: LightingProjectCache) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    LIGHTING_PROJECT_CACHE_KEY,
    JSON.stringify({
      ...cache,
      version: CACHE_VERSION,
      timeline: normalizeTimeline(cache.timeline),
    }),
  );
}
