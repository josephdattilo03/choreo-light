/** Named colors → hex (no #) for Excel fills and lookups. */
export const LIGHTING_COLOR_NAME_TO_HEX: Record<string, string> = {
  red: "FF0000",
  blue: "0000FF",
  green: "00AA00",
  orange: "FF6600",
  yellow: "FFCC00",
  purple: "663399",
  pink: "FF66CC",
  teal: "008080",
  white: "FFFFFF",
  black: "1A1A1A",
  gold: "FFD700",
  lilac: "C8A2C8",
  turquoise: "40E0D0",
  "dark blue": "00008B",
  "light blue": "87CEEB",
  navy: "001F3F",
  magenta: "FF00FF",
  aqua: "00FFFF",
  coral: "FF7F50",
};

const HEX_RE = /^#?([0-9A-Fa-f]{6})$/;

export function normalizeHexForExcel(input: string | undefined): string | null {
  if (!input || typeof input !== "string") {
    return null;
  }
  const trimmed = input.trim();
  const direct = trimmed.match(HEX_RE);
  if (direct) {
    return direct[1].toUpperCase();
  }
  const key = trimmed.toLowerCase();
  const mapped = LIGHTING_COLOR_NAME_TO_HEX[key];
  return mapped ?? null;
}

function rgbFromHex(hex6: string) {
  const h = hex6.replace(/^#/, "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function hexToTopsLabel(hexInput: string | undefined): "Red" | "Blue" | "white" {
  const hex = normalizeHexForExcel(hexInput);
  if (!hex) {
    return "white";
  }
  const { r, g, b } = rgbFromHex(hex);
  if (r > 200 && g < 130 && b < 130) {
    return "Red";
  }
  if (b > 180 && b >= r && b >= g) {
    return "Blue";
  }
  return "white";
}

export function hexToFrontsType(hexInput: string | undefined): "Warm" | "Cool" | "Normal" {
  const hex = normalizeHexForExcel(hexInput);
  if (!hex) {
    return "Normal";
  }
  const { r, g, b } = rgbFromHex(hex);
  if (b > r + 25 && b > g) {
    return "Cool";
  }
  if (r > b + 25 && r > g - 40) {
    return "Warm";
  }
  return "Normal";
}
