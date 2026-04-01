"use client";

import { useState, useCallback, useEffect } from "react";
import { StageVisualization } from "@/components/lighting/StageVisualization";
import { ColorIntensityPanel } from "@/components/lighting/ColorIntensityPanel";
import { LightingControls } from "@/components/lighting/LightingControls";
import { CueList } from "@/components/lighting/CueList";
import { HistoryControls } from "@/components/lighting/HistoryControls";
import { Lightbulb, User } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  createDefaultLights,
  type Cue,
  type Light,
  type LightingState,
} from "@/lib/lighting-types";

export function StageLightingVisualizer() {
  const [currentState, setCurrentState] = useState<LightingState>({
    lights: createDefaultLights(),
    backdropColor: "#2d2d3d",
    stageColor: "#1a1a24",
    showPerformer: true,
  });

  const [history, setHistory] = useState<LightingState[]>([currentState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [cues, setCues] = useState<Cue[]>([]);
  const [activeCueId, setActiveCueId] = useState<string | undefined>();
  const [selectedLights, setSelectedLights] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [selectedIntensity, setSelectedIntensity] = useState(75);
  const [customColor, setCustomColor] = useState("#ff00ff");

  const updateState = useCallback(
    (newState: LightingState) => {
      setCurrentState(newState);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newState);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setCurrentState(history[nextIndex]);
      toast.info("Undone");
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentState(history[nextIndex]);
      toast.info("Redone");
    }
  }, [history, historyIndex]);

  const saveCue = useCallback(
    (name: string) => {
      const activeLights = currentState.lights.filter((l) => l.active);
      const uniqueColors = [...new Set(activeLights.map((l) => l.color))];
      const avgIntensity =
        activeLights.length > 0
          ? Math.round(
              activeLights.reduce((sum, l) => sum + l.intensity, 0) /
                activeLights.length,
            )
          : 0;

      const newCue: Cue = {
        id: `cue-${Date.now()}`,
        name,
        timestamp: new Date().toLocaleString(),
        lightingState: structuredClone(currentState),
        preview: {
          colors: uniqueColors,
          intensity: avgIntensity,
        },
      };

      setCues((prev) => [...prev, newCue]);
      setActiveCueId(newCue.id);
      toast.success(`Cue "${name}" saved`);
    },
    [currentState],
  );

  const loadCue = useCallback(
    (cue: Cue) => {
      const clonedState = structuredClone(cue.lightingState);
      updateState(clonedState);
      setActiveCueId(cue.id);
      setSelectedLights([]);
      toast.success(`Loaded cue "${cue.name}"`);
    },
    [updateState],
  );

  const deleteCue = useCallback(
    (cueId: string) => {
      setCues((prev) => prev.filter((c) => c.id !== cueId));
      if (activeCueId === cueId) {
        setActiveCueId(undefined);
      }
      toast.info("Cue deleted");
    },
    [activeCueId],
  );

  const toggleLight = useCallback(
    (lightId: string) => {
      const light = currentState.lights.find((l) => l.id === lightId);
      if (!light) return;

      const newLights = currentState.lights.map((l) => {
        if (l.id === lightId) {
          return { ...l, active: !l.active };
        }
        return l;
      });

      updateState({ ...currentState, lights: newLights });

      if (!light.active) {
        setSelectedLights([lightId]);
      }
    },
    [currentState, updateState],
  );

  const selectLight = useCallback(
    (lightId: string, multiSelect: boolean = false) => {
      if (multiSelect) {
        setSelectedLights((prev) =>
          prev.includes(lightId)
            ? prev.filter((id) => id !== lightId)
            : [...prev, lightId],
        );
      } else {
        setSelectedLights([lightId]);
      }

      const light = currentState.lights.find((l) => l.id === lightId);
      if (light) {
        setSelectedColor(light.color);
        setSelectedIntensity(light.intensity);
      }
    },
    [currentState.lights],
  );

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

      const newLights = currentState.lights.map((light) => {
        if (light.type === type) {
          return { ...light, active };
        }
        return light;
      });

      updateState({ ...currentState, lights: newLights });
    },
    [currentState, updateState],
  );

  const handleColorChange = useCallback(
    (color: string) => {
      setSelectedColor(color);

      if (selectedLights.length > 0) {
        const newLights = currentState.lights.map((light) => {
          if (selectedLights.includes(light.id)) {
            return { ...light, color };
          }
          return light;
        });
        updateState({ ...currentState, lights: newLights });
      }
    },
    [selectedLights, currentState, updateState],
  );

  const handleIntensityChange = useCallback(
    (intensity: number) => {
      setSelectedIntensity(intensity);

      if (selectedLights.length > 0) {
        const newLights = currentState.lights.map((light) => {
          if (selectedLights.includes(light.id)) {
            return { ...light, intensity };
          }
          return light;
        });
        updateState({ ...currentState, lights: newLights });
      }
    },
    [selectedLights, currentState, updateState],
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

  const effectiveBackdropColor = useCallback(() => {
    const backdropLights = currentState.lights.filter(
      (l) => l.type === "backdrop" && l.active && l.intensity > 0,
    );

    if (backdropLights.length === 0) {
      return currentState.backdropColor;
    }

    if (backdropLights.length === 1) {
      return backdropLights[0].color;
    }

    let totalR = 0,
      totalG = 0,
      totalB = 0,
      totalWeight = 0;

    backdropLights.forEach((light) => {
      const weight = light.intensity / 100;
      const hex = light.color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      totalR += r * weight;
      totalG += g * weight;
      totalB += b * weight;
      totalWeight += weight;
    });

    const avgR = Math.round(totalR / totalWeight);
    const avgG = Math.round(totalG / totalWeight);
    const avgB = Math.round(totalB / totalWeight);

    return `#${avgR.toString(16).padStart(2, "0")}${avgG.toString(16).padStart(2, "0")}${avgB.toString(16).padStart(2, "0")}`;
  }, [currentState]);

  const categories = [
    { name: "Tops", lights: currentState.lights.filter((l) => l.type === "top") },
    {
      name: "Sides (Left)",
      lights: currentState.lights.filter((l) => l.type === "side-left"),
    },
    {
      name: "Sides (Right)",
      lights: currentState.lights.filter((l) => l.type === "side-right"),
    },
    { name: "Fronts", lights: currentState.lights.filter((l) => l.type === "front") },
    {
      name: "Backdrop/Cyc",
      lights: currentState.lights.filter((l) => l.type === "backdrop"),
    },
    {
      name: "Specials",
      lights: currentState.lights.filter((l) => l.type === "special"),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col">
      <Toaster />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="flex items-center gap-3 mb-2">
              <Lightbulb className="w-8 h-8 text-yellow-400" />
              Stage Lighting Visualizer
            </h1>
            <p className="text-zinc-400">
              Design and preview lighting cues for stage productions
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg">
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

      <div className="flex-1 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-[500px]">
            <StageVisualization
              lights={currentState.lights}
              backdropColor={effectiveBackdropColor()}
              stageColor={currentState.stageColor}
              showPerformer={currentState.showPerformer}
              selectedLights={selectedLights}
              onLightClick={selectLight}
              onLightToggle={toggleLight}
            />
          </div>

          <div className="lg:col-span-1">
            <ColorIntensityPanel
              selectedColor={selectedColor}
              intensity={selectedIntensity}
              onColorChange={handleColorChange}
              onIntensityChange={handleIntensityChange}
              selectedLightsCount={selectedLights.length}
              customColor={customColor}
              onCustomColorChange={handleCustomColorChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
        <h3 className="mb-2">Quick Tips</h3>
        <ul className="text-sm text-zinc-400 space-y-1">
          <li>• Click lights on the stage or in the categories to select them</li>
          <li>• Selected lights will update when you change color or intensity</li>
          <li>• Load cues to preview them - edits won&apos;t affect the saved cue</li>
          <li>• Use the color wheel to create custom colors</li>
          <li>• Use Cmd/Ctrl + Z to undo, Cmd/Ctrl + Shift + Z to redo</li>
        </ul>
      </div>
    </div>
  );
}
