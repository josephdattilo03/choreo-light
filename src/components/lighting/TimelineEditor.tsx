"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { formatTimelineTime } from "@/lib/lighting-timeline";
import type { LightingTimeline } from "@/lib/lighting-types";
import { Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react";

interface TimelineEditorProps {
  timeline: LightingTimeline;
  playheadMs: number;
  isPlaying: boolean;
  activeKeyframeId?: string;
  selectedKeyframeName: string;
  onPlayPause: () => void;
  onStop: () => void;
  onScrub: (timeMs: number) => void;
  onDurationChange: (durationMs: number) => void;
  onAddKeyframe: () => void;
  onUpdateKeyframe: () => void;
  onDeleteKeyframe: () => void;
  onSelectKeyframe: (keyframeId: string) => void;
  onRenameKeyframe: (name: string) => void;
}

export function TimelineEditor({
  timeline,
  playheadMs,
  isPlaying,
  activeKeyframeId,
  selectedKeyframeName,
  onPlayPause,
  onStop,
  onScrub,
  onDurationChange,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe,
  onSelectKeyframe,
  onRenameKeyframe,
}: TimelineEditorProps) {
  const activeKeyframe = timeline.keyframes.find((keyframe) => keyframe.id === activeKeyframeId);
  const durationSeconds = Math.round(timeline.durationMs / 1000);
  const timelineProgress = timeline.durationMs === 0 ? 0 : (playheadMs / timeline.durationMs) * 100;
  const [keyframeNameDraft, setKeyframeNameDraft] = useState(selectedKeyframeName);

  useEffect(() => {
    setKeyframeNameDraft(selectedKeyframeName);
  }, [selectedKeyframeName]);

  return (
    <div className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h3 className="mb-1">Performance Timeline</h3>
          <p className="text-sm text-zinc-400">
            Add lighting keyframes, scrub through the performance, and let the stage blend between looks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPlayPause}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button variant="outline" size="sm" onClick={onStop}>
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
          <Button size="sm" onClick={onAddKeyframe}>
            <Plus className="w-4 h-4" />
            Add Keyframe
          </Button>
          <Button variant="secondary" size="sm" onClick={onUpdateKeyframe} disabled={!activeKeyframeId}>
            Update Keyframe
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteKeyframe}
            disabled={!activeKeyframeId}
            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-zinc-400">Playhead</span>
            <span className="font-mono text-zinc-100">
              {formatTimelineTime(playheadMs)} / {formatTimelineTime(timeline.durationMs)}
            </span>
          </div>

          <div className="relative pt-5">
            <div className="pointer-events-none absolute left-0 right-0 top-[23px] h-5 rounded-full bg-zinc-800/90" />
            <div
              className="pointer-events-none absolute left-0 top-[23px] h-5 rounded-full bg-gradient-to-r from-sky-500/35 via-emerald-400/30 to-amber-300/35"
              style={{ width: `${timelineProgress}%` }}
            />

            <Slider
              value={[playheadMs]}
              min={0}
              max={timeline.durationMs}
              step={100}
              onValueChange={(values) => onScrub(values[0] ?? 0)}
              className="[&_[data-slot=slider-track]]:h-5 [&_[data-slot=slider-track]]:bg-transparent [&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-sky-300 [&_[data-slot=slider-thumb]]:bg-zinc-100"
            />

            <div className="pointer-events-none absolute inset-x-2 top-2 flex justify-between text-[10px] uppercase tracking-[0.25em] text-zinc-500">
              <span>Start</span>
              <span>End</span>
            </div>

            <div className="pointer-events-none absolute inset-x-3 top-[17px] h-7">
              {timeline.keyframes.map((keyframe) => {
                const left = `${(keyframe.timeMs / timeline.durationMs) * 100}%`;
                const isActive = keyframe.id === activeKeyframeId;

                return (
                  <button
                    key={keyframe.id}
                    type="button"
                    onClick={() => onSelectKeyframe(keyframe.id)}
                    className={`pointer-events-auto absolute top-0 h-7 w-7 -translate-x-1/2 rounded-full border transition ${
                      isActive
                        ? "border-amber-300 bg-amber-300/20 shadow-[0_0_18px_rgba(252,211,77,0.55)]"
                        : "border-zinc-500 bg-zinc-900/80 hover:border-sky-300"
                    }`}
                    style={{ left }}
                    title={`${keyframe.name} at ${formatTimelineTime(keyframe.timeMs)}`}
                  >
                    <span
                      className={`mx-auto block h-2.5 w-2.5 rounded-full ${
                        isActive ? "bg-amber-300" : "bg-sky-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
            <span>{timeline.keyframes.length} keyframes</span>
            <span>Timeline is cached locally in your browser</span>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
          <label htmlFor="timeline-duration" className="mb-2 block text-sm text-zinc-400">
            Performance Length (seconds)
          </label>
          <Input
            id="timeline-duration"
            type="number"
            min={15}
            max={900}
            step={5}
            value={durationSeconds}
            onChange={(event) => onDurationChange((Number(event.target.value) || 15) * 1000)}
            className="mb-4 bg-zinc-950"
          />

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
            <p className="mb-1 text-sm text-zinc-400">Selected Keyframe</p>
            {activeKeyframe ? (
              <div className="space-y-3">
                <Input
                  value={keyframeNameDraft}
                  onChange={(event) => setKeyframeNameDraft(event.target.value)}
                  onBlur={() => {
                    const nextName = keyframeNameDraft.trim();
                    if (!nextName) {
                      setKeyframeNameDraft(selectedKeyframeName);
                      return;
                    }

                    onRenameKeyframe(nextName);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }

                    const nextName = keyframeNameDraft.trim();
                    if (!nextName) {
                      setKeyframeNameDraft(selectedKeyframeName);
                      return;
                    }

                    onRenameKeyframe(nextName);
                    event.currentTarget.blur();
                  }}
                  className="bg-zinc-900"
                />
                <div className="flex items-center justify-between text-sm text-zinc-300">
                  <span>Time</span>
                  <span className="font-mono">{formatTimelineTime(activeKeyframe.timeMs)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Select a marker or place the playhead on a keyframe to edit it.
              </p>
            )}
          </div>
        </div>
      </div>

      {timeline.keyframes.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {timeline.keyframes.map((keyframe) => {
            const isActive = keyframe.id === activeKeyframeId;

            return (
              <button
                key={keyframe.id}
                type="button"
                onClick={() => onSelectKeyframe(keyframe.id)}
                className={`rounded-lg border p-3 text-left transition ${
                  isActive
                    ? "border-sky-400 bg-sky-500/10"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-zinc-100">{keyframe.name}</span>
                  <span className="font-mono text-xs text-zinc-400">
                    {formatTimelineTime(keyframe.timeMs)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Snapshot of the full stage state at this moment.
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
