"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildPieceExportFromTimeline } from "@/lib/build-piece-export";
import type { LightingExportMetadata } from "@/lib/export-lighting-types";
import { exportLightingSheet } from "@/lib/export-lighting-sheet";
import { EXPORT_SHEET_PLACEHOLDER } from "@/lib/export-lighting-types";
import type { LightingTimeline } from "@/lib/lighting-types";

function safeFilenameSegment(name: string) {
  return name.replace(/[/\\?%*:|"<>]/g, "-").trim() || "lighting-cues";
}

type Props = {
  timeline: LightingTimeline;
  exportMetadata: LightingExportMetadata;
  onExportMetadataChange: (next: LightingExportMetadata) => void;
};

export function ExportCueSheetPanel({
  timeline,
  exportMetadata,
  onExportMetadataChange,
}: Props) {
  const update = (patch: Partial<LightingExportMetadata>) => {
    onExportMetadataChange({ ...exportMetadata, ...patch });
  };

  const handleExport = async () => {
    try {
      const piece = buildPieceExportFromTimeline(timeline, exportMetadata);
      const blob = await exportLightingSheet([piece]);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${safeFilenameSegment(piece.pieceName)}-cue-sheet.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Cue sheet downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Could not export cue sheet");
    }
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Cue sheet export (.xlsx)</h3>
      <p className="mb-4 text-xs text-zinc-400">
        Plain spreadsheet export (no special formatting). Colors are written as hex text (e.g. #FF6600).
        Empty header fields use placeholders like{" "}
        <span className="text-zinc-300">{EXPORT_SHEET_PLACEHOLDER.choreographer}</span>. Shins / highs %
        stay blank unless you fill them in—those aren&apos;t in the visualizer yet.
      </p>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="export-piece-name" className="text-zinc-300">
            Piece / sheet name
          </Label>
          <Input
            id="export-piece-name"
            value={exportMetadata.pieceName}
            onChange={(e) => update({ pieceName: e.target.value })}
            placeholder={EXPORT_SHEET_PLACEHOLDER.pieceName}
            className="border-zinc-700 bg-zinc-950 text-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="export-choreographer" className="text-zinc-300">
            Choreographer
          </Label>
          <Input
            id="export-choreographer"
            value={exportMetadata.choreographerName}
            onChange={(e) => update({ choreographerName: e.target.value })}
            placeholder="Name for row 1"
            className="border-zinc-700 bg-zinc-950 text-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="export-phone" className="text-zinc-300">
            Phone
          </Label>
          <Input
            id="export-phone"
            value={exportMetadata.phoneNumber}
            onChange={(e) => update({ phoneNumber: e.target.value })}
            placeholder="Phone for row 2"
            className="border-zinc-700 bg-zinc-950 text-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="export-offset" className="text-zinc-300">
            Starting tech cue #
          </Label>
          <Input
            id="export-offset"
            type="number"
            min={0}
            step={1}
            value={exportMetadata.techCueOffset}
            onChange={(e) =>
              update({
                techCueOffset: Math.max(0, Math.floor(Number(e.target.value) || 0)),
              })
            }
            className="border-zinc-700 bg-zinc-950 text-white"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="export-vibe" className="text-zinc-300">
            General vibe
          </Label>
          <Input
            id="export-vibe"
            value={exportMetadata.generalVibe}
            onChange={(e) => update({ generalVibe: e.target.value })}
            placeholder="Mood, palette, energy (row 3)"
            className="border-zinc-700 bg-zinc-950 text-white"
          />
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full sm:w-auto"
        onClick={() => void handleExport()}
      >
        <Download className="mr-2 h-4 w-4" />
        Download cue sheet
      </Button>
    </div>
  );
}
