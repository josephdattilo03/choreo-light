/**
 * Types for exporting org cue sheets (.xlsx). Mirrors the dance org template columns.
 */
export interface LightingCue {
  cueNumber: number;
  timestampSeconds: number;
  fadeIn: number;
  description: string;

  cycColor1?: string;
  cycColor2?: string;
  cycColor3?: string;
  cycIntensity?: number;

  sidesColorLeft?: string;
  sidesColorRight?: string;
  sidesRgbPct?: number;
  sidesShinsPct?: number;
  sidesHighsPct?: number;
  sidesWhich?: string;

  topsColor?: string;
  topsPct?: number;

  frontsType?: string;
  frontsPct?: number;

  specials?: string;
  notes?: string;
}

export interface PieceExport {
  pieceName: string;
  choreographerName: string;
  phoneNumber: string;
  generalVibe: string;
  techCueOffset: number;
  cues: LightingCue[];
}

/** Saved with the project for header fields on export */
export interface LightingExportMetadata {
  pieceName: string;
  choreographerName: string;
  phoneNumber: string;
  generalVibe: string;
  techCueOffset: number;
}

export const EXPORT_SHEET_PLACEHOLDER = {
  choreographer: "(fill in choreographer name)",
  phone: "(fill in phone)",
  vibe: "(fill in general vibe — mood, palette, energy)",
  pieceName: "1. Piece name",
} as const;
