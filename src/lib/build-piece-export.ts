import type { LightingExportMetadata, PieceExport } from "@/lib/export-lighting-types";
import { lightingStateToExportCue } from "@/lib/lighting-state-to-export-cue";
import type { LightingTimeline } from "@/lib/lighting-types";
import { sortKeyframes } from "@/lib/lighting-timeline";

export function buildPieceExportFromTimeline(
  timeline: LightingTimeline,
  metadata: LightingExportMetadata,
  fadeInSeconds = 0,
): PieceExport {
  const keyframes = sortKeyframes(timeline.keyframes);
  const cues = keyframes.map((keyframe, index) =>
    lightingStateToExportCue({
      cueNumber: index + 1,
      timestampSeconds: keyframe.timeMs / 1000,
      fadeIn: fadeInSeconds,
      description: keyframe.name,
      state: keyframe.lightingState,
    }),
  );

  return {
    pieceName: metadata.pieceName,
    choreographerName: metadata.choreographerName,
    phoneNumber: metadata.phoneNumber,
    generalVibe: metadata.generalVibe,
    techCueOffset: metadata.techCueOffset,
    cues,
  };
}
