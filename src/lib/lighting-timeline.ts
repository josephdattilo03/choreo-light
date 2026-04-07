import type {
  LightingState,
  LightingTimeline,
  TimelineKeyframe,
} from "@/lib/lighting-types";

export const TIMELINE_MIN_DURATION_MS = 15000;
export const TIMELINE_MAX_DURATION_MS = 900000;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function interpolateColor(start: string, end: string, progress: number) {
  const from = hexToRgb(start);
  const to = hexToRgb(end);

  return rgbToHex(
    Math.round(from.r + (to.r - from.r) * progress),
    Math.round(from.g + (to.g - from.g) * progress),
    Math.round(from.b + (to.b - from.b) * progress),
  );
}

function interpolateNumber(start: number, end: number, progress: number) {
  return Math.round(start + (end - start) * progress);
}

export function cloneLightingState(state: LightingState) {
  return structuredClone(state);
}

export function sortKeyframes(keyframes: TimelineKeyframe[]) {
  return [...keyframes].sort((a, b) => a.timeMs - b.timeMs);
}

export function clampTimelineTime(timeMs: number, durationMs: number) {
  return clamp(timeMs, 0, durationMs);
}

export function normalizeTimeline(timeline: LightingTimeline): LightingTimeline {
  const highestKeyframeTime =
    timeline.keyframes.length > 0
      ? Math.max(...timeline.keyframes.map((keyframe) => keyframe.timeMs))
      : 0;

  const durationMs = clamp(
    Math.max(timeline.durationMs, highestKeyframeTime),
    TIMELINE_MIN_DURATION_MS,
    TIMELINE_MAX_DURATION_MS,
  );

  return {
    durationMs,
    keyframes: sortKeyframes(
      timeline.keyframes.map((keyframe) => ({
        ...keyframe,
        timeMs: clampTimelineTime(keyframe.timeMs, durationMs),
      })),
    ),
  };
}

export function findKeyframeAtTime(
  keyframes: TimelineKeyframe[],
  timeMs: number,
  toleranceMs = 250,
) {
  return keyframes.find((keyframe) => Math.abs(keyframe.timeMs - timeMs) <= toleranceMs);
}

export function interpolateLightingState(
  start: LightingState,
  end: LightingState,
  progress: number,
): LightingState {
  const safeProgress = clamp(progress, 0, 1);
  if (safeProgress <= 0) {
    return cloneLightingState(start);
  }
  if (safeProgress >= 1) {
    return cloneLightingState(end);
  }

  return {
    lights: start.lights.map((light, index) => {
      const nextLight = end.lights[index] ?? light;
      const startLevel = light.active ? light.intensity : 0;
      const endLevel = nextLight.active ? nextLight.intensity : 0;
      const intensity = interpolateNumber(startLevel, endLevel, safeProgress);
      const isActive = intensity > 0;

      return {
        ...light,
        color: interpolateColor(light.color, nextLight.color, safeProgress),
        intensity,
        active: isActive,
      };
    }),
    backdropColor: interpolateColor(start.backdropColor, end.backdropColor, safeProgress),
    stageColor: interpolateColor(start.stageColor, end.stageColor, safeProgress),
    showPerformer: safeProgress < 0.5 ? start.showPerformer : end.showPerformer,
  };
}

export function getTimelineStateAtTime(
  timeline: LightingTimeline,
  timeMs: number,
  fallbackState: LightingState,
) {
  if (timeline.keyframes.length === 0) {
    return cloneLightingState(fallbackState);
  }

  const clampedTime = clampTimelineTime(timeMs, timeline.durationMs);
  const keyframes = sortKeyframes(timeline.keyframes);

  if (clampedTime <= keyframes[0].timeMs) {
    return cloneLightingState(keyframes[0].lightingState);
  }

  const lastKeyframe = keyframes[keyframes.length - 1];
  if (clampedTime >= lastKeyframe.timeMs) {
    return cloneLightingState(lastKeyframe.lightingState);
  }

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const start = keyframes[index];
    const end = keyframes[index + 1];

    if (clampedTime >= start.timeMs && clampedTime <= end.timeMs) {
      if (clampedTime <= start.timeMs) {
        return cloneLightingState(start.lightingState);
      }
      if (clampedTime >= end.timeMs) {
        return cloneLightingState(end.lightingState);
      }
      const span = end.timeMs - start.timeMs || 1;
      const progress = (clampedTime - start.timeMs) / span;
      return interpolateLightingState(start.lightingState, end.lightingState, progress);
    }
  }

  return cloneLightingState(lastKeyframe.lightingState);
}

export function formatTimelineTime(timeMs: number) {
  const totalSeconds = Math.max(0, Math.round(timeMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
