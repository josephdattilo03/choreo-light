"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Lightbulb, User } from "lucide-react";
import { toast } from "sonner";

import { ColorIntensityPanel } from "@/components/lighting/ColorIntensityPanel";
import { CueList } from "@/components/lighting/CueList";
import { ExportCueSheetPanel } from "@/components/lighting/ExportCueSheetPanel";
import { HistoryControls } from "@/components/lighting/HistoryControls";
import { LightingControls } from "@/components/lighting/LightingControls";
import Stage3D from "@/components/lighting/Stage3D";
import { StageVisualization } from "@/components/lighting/StageVisualization";
import { TimelineEditor } from "@/components/lighting/TimelineEditor";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import {
  createBlankKeyframeLightingState,
  createDefaultLightingState,
  createDefaultTimeline,
  type Cue,
  type Light,
  type LightingState,
  type LightingTimeline,
} from "@/lib/lighting-types";
import type { LightingExportMetadata } from "@/lib/export-lighting-types";
import {
  createDefaultProjectCache,
  loadLightingProjectCache,
  normalizeExportMetadata,
  saveLightingProjectCache,
} from "@/lib/lighting-cache";
import {
  clampTimelineTime,
  cloneLightingState,
  findKeyframeAtTime,
  formatTimelineTime,
  getTimelineStateAtTime,
  normalizeTimeline,
  TIMELINE_MAX_DURATION_MS,
  TIMELINE_MIN_DURATION_MS,
} from "@/lib/lighting-timeline";

function buildCuePreview(state: LightingState) {
  const activeLights = state.lights.filter((light) => light.active);
  const uniqueColors = [...new Set(activeLights.map((light) => light.color))];
  const intensity =
    activeLights.length > 0
      ? Math.round(
          activeLights.reduce((sum, light) => sum + light.intensity, 0) /
            activeLights.length,
        )
      : 0;

  return {
    colors: uniqueColors,
    intensity,
  };
}

export function StageLightingVisualizer() {
  const [currentState, setCurrentState] = useState<LightingState>(createDefaultLightingState);
  const [history, setHistory] = useState<LightingState[]>(() => [createDefaultLightingState()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [cues, setCues] = useState<Cue[]>([]);
  const [activeCueId, setActiveCueId] = useState<string | undefined>();
  const [selectedLights, setSelectedLights] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [selectedIntensity, setSelectedIntensity] = useState(75);
  const [customColor, setCustomColor] = useState("#ff00ff");
  const [timeline, setTimeline] = useState<LightingTimeline>(createDefaultTimeline);
  const [activeKeyframeId, setActiveKeyframeId] = useState<string | undefined>();
  const [playheadMs, setPlayheadMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [is3DView, setIs3DView] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [exportMetadata, setExportMetadata] = useState<LightingExportMetadata>(
    () => createDefaultProjectCache().exportMetadata!,
  );

  const historyIndexRef = useRef(historyIndex);
  const playheadRef = useRef(playheadMs);
  const currentStateRef = useRef(currentState);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    playheadRef.current = playheadMs;
  }, [playheadMs]);

  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  const syncInspectorFromState = useCallback(
    (state: LightingState, lightIds: string[]) => {
      const selectedLight = lightIds
        .map((lightId) => state.lights.find((light) => light.id === lightId))
        .find(Boolean);

      if (selectedLight) {
        setSelectedColor(selectedLight.color);
        setSelectedIntensity(selectedLight.intensity);
      }
    },
    [],
  );

  const applyPreviewState = useCallback((nextState: LightingState) => {
    setCurrentState(cloneLightingState(nextState));
  }, []);

  const updateState = useCallback((nextState: LightingState) => {
    setIsPlaying(false);

    const clonedState = cloneLightingState(nextState);
    setCurrentState(clonedState);
    setHistory((previousHistory) => {
      const truncatedHistory = previousHistory.slice(0, historyIndexRef.current + 1);
      const nextHistory = [...truncatedHistory, clonedState];
      const nextIndex = nextHistory.length - 1;

      historyIndexRef.current = nextIndex;
      setHistoryIndex(nextIndex);
      return nextHistory;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) {
      return;
    }

    const nextIndex = historyIndexRef.current - 1;
    const restoredState = cloneLightingState(history[nextIndex]);

    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    setCurrentState(restoredState);
    setIsPlaying(false);
    toast.info("Undone");
  }, [history]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= history.length - 1) {
      return;
    }

    const nextIndex = historyIndexRef.current + 1;
    const restoredState = cloneLightingState(history[nextIndex]);

    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    setCurrentState(restoredState);
    setIsPlaying(false);
    toast.info("Redone");
  }, [history]);

  const saveCue = useCallback(
    (name: string) => {
      const newCue: Cue = {
        id: `cue-${Date.now()}`,
        name,
        timestamp: new Date().toLocaleString(),
        lightingState: cloneLightingState(currentState),
        preview: buildCuePreview(currentState),
      };

      setCues((previousCues) => [...previousCues, newCue]);
      setActiveCueId(newCue.id);
      toast.success(`Cue "${name}" saved`);
    },
    [currentState],
  );

  const loadCue = useCallback(
    (cue: Cue) => {
      updateState(cue.lightingState);
      setActiveCueId(cue.id);
      setActiveKeyframeId(undefined);
      toast.success(`Loaded cue "${cue.name}"`);
    },
    [updateState],
  );

  const deleteCue = useCallback(
    (cueId: string) => {
      setCues((previousCues) => previousCues.filter((cue) => cue.id !== cueId));

      if (activeCueId === cueId) {
        setActiveCueId(undefined);
      }

      toast.info("Cue deleted");
    },
    [activeCueId],
  );

  const toggleLight = useCallback(
    (lightId: string) => {
      const light = currentState.lights.find((entry) => entry.id === lightId);
      if (!light) {
        return;
      }

      updateState({
        ...currentState,
        lights: currentState.lights.map((entry) =>
          entry.id === lightId ? { ...entry, active: !entry.active } : entry,
        ),
      });

      if (!light.active) {
        setSelectedLights([lightId]);
      }
    },
    [currentState, updateState],
  );

  const selectLight = useCallback(
    (lightId: string, multiSelect = false) => {
      setSelectedLights((previousLights) => {
        if (!multiSelect) {
          return [lightId];
        }

        return previousLights.includes(lightId)
          ? previousLights.filter((entry) => entry !== lightId)
          : [...previousLights, lightId];
      });
    },
    [],
  );

  const editableLightIds = useMemo(() => {
    if (selectedLights.length > 0) {
      return selectedLights;
    }

    return currentState.lights
      .filter((light) => light.active)
      .map((light) => light.id);
  }, [currentState.lights, selectedLights]);

  const selectionMode: "selected" | "active" | "none" =
    selectedLights.length > 0
      ? "selected"
      : editableLightIds.length > 0
        ? "active"
        : "none";

  const toggleCategory = useCallback(
    (categoryName: string, active: boolean) => {
      let type: Light["type"];

      switch (categoryName) {
        case "Tops":
          type = "top";
          break;
        case "Sides (Left)":
          type = "side-left";
          break;
        case "Sides (Right)":
          type = "side-right";
          break;
        case "Fronts":
          type = "front";
          break;
        case "Backdrop/Cyc":
          type = "backdrop";
          break;
        case "Specials":
          type = "special";
          break;
        default:
          return;
      }

      updateState({
        ...currentState,
        lights: currentState.lights.map((light) =>
          light.type === type ? { ...light, active } : light,
        ),
      });
    },
    [currentState, updateState],
  );

  const handleColorChange = useCallback(
    (color: string) => {
      setSelectedColor(color);

      if (editableLightIds.length === 0) {
        return;
      }

      updateState({
        ...currentState,
        lights: currentState.lights.map((light) =>
          editableLightIds.includes(light.id) ? { ...light, color } : light,
        ),
      });
    },
    [currentState, editableLightIds, updateState],
  );

  const handleIntensityChange = useCallback(
    (intensity: number) => {
      setSelectedIntensity(intensity);

      if (editableLightIds.length === 0) {
        return;
      }

      updateState({
        ...currentState,
        lights: currentState.lights.map((light) =>
          editableLightIds.includes(light.id) ? { ...light, intensity } : light,
        ),
      });
    },
    [currentState, editableLightIds, updateState],
  );

  const handleCustomColorChange = useCallback(
    (color: string) => {
      setCustomColor(color);
      handleColorChange(color);
    },
    [handleColorChange],
  );

  const togglePerformer = useCallback(() => {
    updateState({
      ...currentState,
      showPerformer: !currentState.showPerformer,
    });
  }, [currentState, updateState]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (timeline.keyframes.length < 2) {
      toast.info("Add at least two keyframes to play the performance timeline.");
      return;
    }

    setIsPlaying(true);
  }, [isPlaying, timeline.keyframes.length]);

  const commitAnchoredKeyframeLighting = useCallback(() => {
    if (!activeKeyframeId) {
      return;
    }

    const keyframe = timeline.keyframes.find((entry) => entry.id === activeKeyframeId);
    if (!keyframe) {
      return;
    }

    if (Math.abs(playheadMs - keyframe.timeMs) > 250) {
      return;
    }

    if (JSON.stringify(currentState) === JSON.stringify(keyframe.lightingState)) {
      return;
    }

    setTimeline((previousTimeline) =>
      normalizeTimeline({
        ...previousTimeline,
        keyframes: previousTimeline.keyframes.map((kf) =>
          kf.id === keyframe.id
            ? { ...kf, lightingState: cloneLightingState(currentState) }
            : kf,
        ),
      }),
    );
  }, [activeKeyframeId, currentState, playheadMs, timeline.keyframes]);

  const handleStop = useCallback(() => {
    commitAnchoredKeyframeLighting();
    setIsPlaying(false);
    setPlayheadMs(0);
  }, [commitAnchoredKeyframeLighting]);

  const handleScrub = useCallback(
    (nextTimeMs: number) => {
      commitAnchoredKeyframeLighting();
      setIsPlaying(false);
      setPlayheadMs(clampTimelineTime(nextTimeMs, timeline.durationMs));
    },
    [commitAnchoredKeyframeLighting, timeline.durationMs],
  );

  const handleAddKeyframe = useCallback(() => {
    commitAnchoredKeyframeLighting();

    const existingKeyframe = findKeyframeAtTime(timeline.keyframes, playheadMs);
    if (existingKeyframe) {
      setActiveKeyframeId(existingKeyframe.id);
      toast.info(
        `A keyframe already exists at ${formatTimelineTime(existingKeyframe.timeMs)}. Update it instead.`,
      );
      return;
    }

    const snappedTime = clampTimelineTime(
      Math.round(playheadMs / 100) * 100,
      timeline.durationMs,
    );
    const blankState = cloneLightingState(createBlankKeyframeLightingState());
    const nextKeyframe = {
      id: `keyframe-${Date.now()}`,
      name: `Look ${String(timeline.keyframes.length + 1).padStart(2, "0")}`,
      timeMs: snappedTime,
      lightingState: blankState,
    };

    setTimeline((previousTimeline) =>
      normalizeTimeline({
        ...previousTimeline,
        keyframes: [...previousTimeline.keyframes, nextKeyframe],
      }),
    );
    setActiveKeyframeId(nextKeyframe.id);
    setPlayheadMs(snappedTime);
    applyPreviewState(blankState);
    toast.success(`Added ${nextKeyframe.name}`);
  }, [
    applyPreviewState,
    commitAnchoredKeyframeLighting,
    playheadMs,
    timeline.durationMs,
    timeline.keyframes,
  ]);

  const handleSelectKeyframe = useCallback(
    (keyframeId: string) => {
      commitAnchoredKeyframeLighting();

      const keyframe = timeline.keyframes.find((entry) => entry.id === keyframeId);
      if (!keyframe) {
        return;
      }

      setIsPlaying(false);
      setActiveKeyframeId(keyframe.id);
      setPlayheadMs(keyframe.timeMs);
      applyPreviewState(keyframe.lightingState);
    },
    [applyPreviewState, commitAnchoredKeyframeLighting, timeline.keyframes],
  );

  const handleUpdateKeyframe = useCallback(() => {
    const targetKeyframe =
      timeline.keyframes.find((keyframe) => keyframe.id === activeKeyframeId) ??
      findKeyframeAtTime(timeline.keyframes, playheadMs);

    if (!targetKeyframe) {
      toast.info("Select a keyframe before updating it.");
      return;
    }

    setTimeline((previousTimeline) =>
      normalizeTimeline({
        ...previousTimeline,
        keyframes: previousTimeline.keyframes.map((keyframe) =>
          keyframe.id === targetKeyframe.id
            ? {
                ...keyframe,
                lightingState: cloneLightingState(currentState),
              }
            : keyframe,
        ),
      }),
    );
    setActiveKeyframeId(targetKeyframe.id);
    toast.success(`Updated ${targetKeyframe.name}`);
  }, [activeKeyframeId, currentState, playheadMs, timeline.keyframes]);

  const handleDeleteKeyframe = useCallback(() => {
    if (!activeKeyframeId) {
      return;
    }

    const deletedKeyframe = timeline.keyframes.find(
      (keyframe) => keyframe.id === activeKeyframeId,
    );

    setTimeline((previousTimeline) =>
      normalizeTimeline({
        ...previousTimeline,
        keyframes: previousTimeline.keyframes.filter(
          (keyframe) => keyframe.id !== activeKeyframeId,
        ),
      }),
    );
    setActiveKeyframeId(undefined);
    setIsPlaying(false);
    toast.info(
      deletedKeyframe ? `Deleted ${deletedKeyframe.name}` : "Keyframe deleted",
    );
  }, [activeKeyframeId, timeline.keyframes]);

  const handleRenameKeyframe = useCallback((name: string) => {
    if (!activeKeyframeId) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    setTimeline((previousTimeline) =>
      normalizeTimeline({
        ...previousTimeline,
        keyframes: previousTimeline.keyframes.map((keyframe) =>
          keyframe.id === activeKeyframeId
            ? { ...keyframe, name: trimmedName }
            : keyframe,
        ),
      }),
    );
  }, [activeKeyframeId]);

  const handleDurationChange = useCallback(
    (nextDurationMs: number) => {
      commitAnchoredKeyframeLighting();

      const clampedDuration = Math.min(
        Math.max(nextDurationMs, TIMELINE_MIN_DURATION_MS),
        TIMELINE_MAX_DURATION_MS,
      );
      const highestKeyframeTime =
        timeline.keyframes.length > 0
          ? Math.max(...timeline.keyframes.map((keyframe) => keyframe.timeMs))
          : 0;
      const safeDuration = Math.max(clampedDuration, highestKeyframeTime);

      setTimeline((previousTimeline) =>
        normalizeTimeline({
          ...previousTimeline,
          durationMs: safeDuration,
        }),
      );
      setPlayheadMs((previousTime) => clampTimelineTime(previousTime, safeDuration));
    },
    [commitAnchoredKeyframeLighting, timeline.keyframes],
  );

  const effectiveBackdropColor = useMemo(() => {
    const backdropLights = currentState.lights.filter(
      (light) => light.type === "backdrop" && light.active && light.intensity > 0,
    );

    if (backdropLights.length === 0) {
      return currentState.backdropColor;
    }

    if (backdropLights.length === 1) {
      return backdropLights[0].color;
    }

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let totalWeight = 0;

    backdropLights.forEach((light) => {
      const weight = light.intensity / 100;
      const hex = light.color.replace("#", "");
      const red = parseInt(hex.substring(0, 2), 16);
      const green = parseInt(hex.substring(2, 4), 16);
      const blue = parseInt(hex.substring(4, 6), 16);

      totalR += red * weight;
      totalG += green * weight;
      totalB += blue * weight;
      totalWeight += weight;
    });

    const avgR = Math.round(totalR / totalWeight);
    const avgG = Math.round(totalG / totalWeight);
    const avgB = Math.round(totalB / totalWeight);

    return `#${avgR.toString(16).padStart(2, "0")}${avgG.toString(16).padStart(2, "0")}${avgB.toString(16).padStart(2, "0")}`;
  }, [currentState.backdropColor, currentState.lights]);

  const categories = useMemo(
    () => [
      { name: "Tops", lights: currentState.lights.filter((light) => light.type === "top") },
      {
        name: "Sides (Left)",
        lights: currentState.lights.filter((light) => light.type === "side-left"),
      },
      {
        name: "Sides (Right)",
        lights: currentState.lights.filter((light) => light.type === "side-right"),
      },
      {
        name: "Fronts",
        lights: currentState.lights.filter((light) => light.type === "front"),
      },
      {
        name: "Backdrop/Cyc",
        lights: currentState.lights.filter((light) => light.type === "backdrop"),
      },
      {
        name: "Specials",
        lights: currentState.lights.filter((light) => light.type === "special"),
      },
    ],
    [currentState.lights],
  );

  const selectedKeyframeName =
    timeline.keyframes.find((keyframe) => keyframe.id === activeKeyframeId)?.name ?? "";

  useEffect(() => {
    if (editableLightIds.length === 0) {
      return;
    }

    syncInspectorFromState(currentState, editableLightIds);
  }, [currentState, editableLightIds, syncInspectorFromState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);

  useEffect(() => {
    const cachedProject = loadLightingProjectCache() ?? createDefaultProjectCache();
    const normalizedTimeline = normalizeTimeline(cachedProject.timeline);
    const normalizedPlayhead = clampTimelineTime(
      cachedProject.playheadMs,
      normalizedTimeline.durationMs,
    );

    setCurrentState(cloneLightingState(cachedProject.currentState));
    setHistory([cloneLightingState(cachedProject.currentState)]);
    setHistoryIndex(0);
    historyIndexRef.current = 0;
    setCues(cachedProject.cues);
    setActiveCueId(cachedProject.activeCueId);
    setTimeline(normalizedTimeline);
    setActiveKeyframeId(cachedProject.activeKeyframeId);
    setCustomColor(cachedProject.customColor);
    setPlayheadMs(normalizedPlayhead);
    const defaults = createDefaultProjectCache();
    setExportMetadata(
      normalizeExportMetadata(cachedProject.exportMetadata, defaults.exportMetadata!),
    );
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveLightingProjectCache({
      version: createDefaultProjectCache().version,
      currentState,
      cues,
      timeline,
      activeCueId,
      activeKeyframeId,
      customColor,
      playheadMs,
      exportMetadata,
    });
  }, [
    activeCueId,
    activeKeyframeId,
    cues,
    currentState,
    customColor,
    exportMetadata,
    isHydrated,
    playheadMs,
    timeline,
  ]);

  useEffect(() => {
    if (!isHydrated || !activeKeyframeId) {
      return;
    }

    const keyframe = timeline.keyframes.find((entry) => entry.id === activeKeyframeId);
    if (!keyframe || Math.abs(playheadMs - keyframe.timeMs) > 250) {
      return;
    }

    const keyframeId = activeKeyframeId;
    const timeoutId = window.setTimeout(() => {
      const latestState = currentStateRef.current;
      setTimeline((previousTimeline) => {
        const existing = previousTimeline.keyframes.find((entry) => entry.id === keyframeId);
        if (!existing || Math.abs(playheadRef.current - existing.timeMs) > 250) {
          return previousTimeline;
        }
        if (JSON.stringify(existing.lightingState) === JSON.stringify(latestState)) {
          return previousTimeline;
        }
        return normalizeTimeline({
          ...previousTimeline,
          keyframes: previousTimeline.keyframes.map((kf) =>
            kf.id === keyframeId
              ? { ...kf, lightingState: cloneLightingState(latestState) }
              : kf,
          ),
        });
      });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [activeKeyframeId, currentState, isHydrated, playheadMs, timeline.keyframes]);

  useEffect(() => {
    if (timeline.keyframes.length === 0) {
      return;
    }

    const derivedState = getTimelineStateAtTime(
      timeline,
      playheadMs,
      currentStateRef.current,
    );
    const exactKeyframe = findKeyframeAtTime(timeline.keyframes, playheadMs);

    applyPreviewState(derivedState);
    setActiveKeyframeId(exactKeyframe?.id);
  }, [applyPreviewState, playheadMs, timeline]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const startedAt = performance.now() - playheadRef.current;
    let frameId = 0;

    const tick = (now: number) => {
      const nextTime = Math.min(now - startedAt, timeline.durationMs);
      setPlayheadMs(nextTime);

      if (nextTime >= timeline.durationMs) {
        setIsPlaying(false);
        return;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPlaying, timeline.durationMs]);

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white">
      <Toaster />

      <div className="mb-6">
        <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="mb-2 flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-yellow-400" />
              Stage Lighting Visualizer
            </h1>
            <p className="text-zinc-400">
              Build lighting cues and now choreograph them across an entire performance timeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2">
              <Label htmlFor="view-toggle" className="cursor-pointer">
                {is3DView ? "3D View" : "2D View"}
              </Label>
              <Switch
                id="view-toggle"
                checked={is3DView}
                onCheckedChange={setIs3DView}
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2">
              <User className="w-4 h-4" />
              <Label htmlFor="performer-toggle" className="cursor-pointer">
                Show Performer
              </Label>
              <Switch
                id="performer-toggle"
                checked={currentState.showPerformer}
                onCheckedChange={togglePerformer}
              />
            </div>

            <HistoryControls
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              onUndo={undo}
              onRedo={redo}
              onSave={saveCue}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="h-[500px] lg:col-span-3">
            {is3DView ? (
              <Stage3D
                lights={currentState.lights}
                backdropColor={effectiveBackdropColor}
                stageColor={currentState.stageColor}
                showPerformer={currentState.showPerformer}
                selectedLights={selectedLights}
                onLightClick={selectLight}
                onLightToggle={toggleLight}
              />
            ) : (
              <StageVisualization
                lights={currentState.lights}
                backdropColor={effectiveBackdropColor}
                stageColor={currentState.stageColor}
                showPerformer={currentState.showPerformer}
                selectedLights={selectedLights}
                onLightClick={selectLight}
                onLightToggle={toggleLight}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <ColorIntensityPanel
              selectedColor={selectedColor}
              intensity={selectedIntensity}
              onColorChange={handleColorChange}
              onIntensityChange={handleIntensityChange}
              targetLightsCount={editableLightIds.length}
              selectionMode={selectionMode}
              customColor={customColor}
              onCustomColorChange={handleCustomColorChange}
            />
          </div>
        </div>

        <TimelineEditor
          timeline={timeline}
          playheadMs={playheadMs}
          isPlaying={isPlaying}
          activeKeyframeId={activeKeyframeId}
          selectedKeyframeName={selectedKeyframeName}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onScrub={handleScrub}
          onDurationChange={handleDurationChange}
          onAddKeyframe={handleAddKeyframe}
          onUpdateKeyframe={handleUpdateKeyframe}
          onDeleteKeyframe={handleDeleteKeyframe}
          onSelectKeyframe={handleSelectKeyframe}
          onRenameKeyframe={handleRenameKeyframe}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LightingControls
            categories={categories}
            selectedLights={selectedLights}
            onToggleLight={toggleLight}
            onToggleCategory={toggleCategory}
            onSelectLight={selectLight}
          />

          <CueList
            cues={cues}
            activeCueId={activeCueId}
            onLoadCue={loadCue}
            onDeleteCue={deleteCue}
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="mb-2">Quick Tips</h3>
        <ul className="space-y-1 text-sm text-zinc-400">
          <li>• Double-click a fixture on stage to toggle it on or off</li>
          <li>• Add keyframes at important moments, then scrub to preview blended transitions</li>
          <li>• Update the selected keyframe after tweaking lights to lock in a new look</li>
          <li>• Saved cues remain separate from the timeline, so you can reuse looks anywhere</li>
          <li>• Your timeline and cues stay cached in this browser with no backend required</li>
        </ul>
      </div>

      <div className="mt-6">
        <ExportCueSheetPanel
          timeline={timeline}
          exportMetadata={exportMetadata}
          onExportMetadataChange={setExportMetadata}
        />
      </div>
    </div>
  );
}
