import type { LightingCue, PieceExport } from "@/lib/export-lighting-types";
import { EXPORT_SHEET_PLACEHOLDER } from "@/lib/export-lighting-types";
import { normalizeHexForExcel } from "@/lib/lighting-export-colors";
import type { Workbook, Worksheet } from "exceljs";

const DATA_ROW = 5;
const PAD_AFTER = 36;
const MIN_LAST_ROW = 40;
const TAIL_DURATION = 2;

function sheetTitle(name: string) {
  return (name.replace(/[:\\/?*[\]]/g, "-").trim() || "Piece").slice(0, 31);
}

function colorAsText(input?: string): string | undefined {
  const hex = input ? normalizeHexForExcel(input) : null;
  return hex ? `#${hex}` : undefined;
}

function writeCueColors(sheet: Worksheet, row: number, cue: LightingCue | undefined) {
  if (!cue) {
    return;
  }
  const pairs: [number, string | undefined][] = [
    [8, colorAsText(cue.cycColor1)],
    [9, colorAsText(cue.cycColor2)],
    [10, colorAsText(cue.cycColor3)],
    [12, colorAsText(cue.sidesColorLeft)],
    [13, colorAsText(cue.sidesColorRight)],
  ];
  for (const [col, val] of pairs) {
    if (val) {
      sheet.getCell(row, col).value = val;
    }
  }
  if (cue.cycIntensity != null) {
    sheet.getCell(row, 11).value = cue.cycIntensity;
  }
}

function optionalCueValues(cue: LightingCue): [number, string | number][] {
  return [
    [14, cue.sidesRgbPct],
    [15, cue.sidesShinsPct],
    [16, cue.sidesHighsPct],
    [17, cue.sidesWhich],
    [18, cue.topsColor],
    [19, cue.topsPct],
    [20, cue.frontsType],
    [21, cue.frontsPct],
    [22, cue.specials],
    [23, cue.notes],
  ].filter(([, v]) => v != null && v !== "") as [number, string | number][];
}

function headerBlock(sheet: Worksheet, piece: PieceExport) {
  const choreographer =
    piece.choreographerName.trim() || EXPORT_SHEET_PLACEHOLDER.choreographer;
  const phone = piece.phoneNumber.trim() || EXPORT_SHEET_PLACEHOLDER.phone;
  const vibe = piece.generalVibe.trim() || EXPORT_SHEET_PLACEHOLDER.vibe;

  sheet.getCell("A1").value = "Name";
  sheet.getCell("B1").value = choreographer;
  sheet.getCell("H1").value =
    "Intensity 0–100. Cyc H–J colors (hex), K cyc %. Sides L/M hex, N–Q. Tops/fronts R–U, specials V, notes W.";

  const r2: [string, string][] = [
    ["A2", "Phone Number"],
    ["B2", phone],
    ["C2", "Time in song cut"],
    ["D2", "Nominal time (sec)"],
    ["E2", "Cue Duration"],
    ["F2", "Fade-in or bump?"],
    ["G2", "Cue Description"],
    ["H2", "Cyclorama (Cyc)"],
    ["L2", "Sides"],
    ["R2", "Tops"],
    ["T2", "Fronts"],
    ["V2", "Specials"],
    ["W2", "Additional Notes"],
  ];
  r2.forEach(([ref, v]) => {
    sheet.getCell(ref).value = v;
  });

  sheet.getCell("A3").value = "General vibe";
  sheet.getCell("B3").value = vibe;

  const r4: [string, string][] = [
    ["A4", "Tech cue #"],
    ["B4", "Choreographer cue #"],
    ["C4", "Time (Excel time)"],
    ["D4", "Seconds (formula)"],
    ["E4", "Cue duration (formula)"],
    ["F4", "Fade-in sec"],
    ["G4", "Description"],
    ["H4", "Cyc L color (hex)"],
    ["I4", "Cyc C color (hex)"],
    ["J4", "Cyc R color (hex)"],
    ["K4", "Cyc %"],
    ["L4", "Sides SL (hex)"],
    ["M4", "Sides SR (hex)"],
    ["N4", "RGB %"],
    ["O4", "Shins %"],
    ["P4", "Highs %"],
    ["Q4", "Which lights"],
    ["R4", "Tops color"],
    ["S4", "Tops %"],
    ["T4", "Fronts type"],
    ["U4", "Fronts %"],
    ["V4", "Specials"],
    ["W4", "Notes"],
  ];
  r4.forEach(([ref, v]) => {
    sheet.getCell(ref).value = v;
  });
}

function sortedRenumberedCues(piece: PieceExport): LightingCue[] {
  return [...piece.cues]
    .sort((a, b) => a.timestampSeconds - b.timestampSeconds)
    .map((c, i) => ({ ...c, cueNumber: i + 1 }));
}

function lastDataRow(realCount: number) {
  if (realCount === 0) {
    return DATA_ROW + PAD_AFTER - 1;
  }
  return Math.max(DATA_ROW + realCount - 1 + PAD_AFTER, MIN_LAST_ROW);
}

function addPieceSheet(workbook: Workbook, piece: PieceExport) {
  const sheet = workbook.addWorksheet(sheetTitle(piece.pieceName));

  headerBlock(sheet, piece);

  const cues = sortedRenumberedCues(piece);
  const n = cues.length;
  const lastRealRow = n > 0 ? DATA_ROW + n - 1 : DATA_ROW - 1;
  const lastRow = lastDataRow(n);
  const offset = Math.max(0, Math.floor(Number(piece.techCueOffset) || 0));

  for (let r = DATA_ROW; r <= lastRow; r += 1) {
    const cue = cues[r - DATA_ROW];

    sheet.getCell(r, 1).value =
      r === DATA_ROW ? offset : { formula: `A${r - 1}+1`, result: undefined };

    if (cue) {
      sheet.getCell(r, 2).value = cue.cueNumber;
      const sec = Math.max(0, cue.timestampSeconds);
      sheet.getCell(r, 3).value = sec / 86400;
      sheet.getCell(r, 6).value = cue.fadeIn;
      sheet.getCell(r, 7).value = cue.description;
      for (const [col, val] of optionalCueValues(cue)) {
        sheet.getCell(r, col).value = val;
      }
    } else {
      sheet.getCell(r, 3).value = 0;
    }

    sheet.getCell(r, 4).value = { formula: `C${r}*86400`, result: undefined };

    const lastReal = n > 0 && r === lastRealRow;
    const tailCell = lastReal || r === lastRow;
    sheet.getCell(r, 5).value = tailCell
      ? TAIL_DURATION
      : { formula: `D${r + 1}-D${r}`, result: undefined };

    writeCueColors(sheet, r, cue);
  }
}

/** Multi-sheet .xlsx with cue data (minimal formatting). */
export async function exportLightingSheet(pieces: PieceExport[]): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Choreo Light";
  workbook.created = new Date();

  const list =
    pieces.length > 0
      ? pieces
      : [
          {
            pieceName: EXPORT_SHEET_PLACEHOLDER.pieceName,
            choreographerName: "",
            phoneNumber: "",
            generalVibe: "",
            techCueOffset: 1,
            cues: [],
          },
        ];

  list.forEach((p) => addPieceSheet(workbook, p));

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
