export interface Light {
  id: string;
  name: string;
  position: { x: number; y: number };
  type: "top" | "side-left" | "side-right" | "front" | "special" | "backdrop";
  color: string;
  intensity: number;
  active: boolean;
}

export interface LightingState {
  lights: Light[];
  backdropColor: string;
  stageColor: string;
  showPerformer: boolean;
}

export interface Cue {
  id: string;
  name: string;
  timestamp: string;
  lightingState: LightingState;
  preview?: {
    colors: string[];
    intensity: number;
  };
}

export function createDefaultLights(): Light[] {
  return [
    { id: "top-1", name: "Top 1", position: { x: 0, y: 0 }, type: "top", color: "#ffffff", intensity: 75, active: false },
    { id: "top-2", name: "Top 2", position: { x: 0, y: 0 }, type: "top", color: "#ffffff", intensity: 75, active: false },
    { id: "top-3", name: "Top 3", position: { x: 0, y: 0 }, type: "top", color: "#ffffff", intensity: 75, active: false },
    { id: "top-4", name: "Top 4", position: { x: 0, y: 0 }, type: "top", color: "#ffffff", intensity: 75, active: false },
    { id: "side-l-1", name: "Left 1", position: { x: 0, y: 0 }, type: "side-left", color: "#ffffff", intensity: 75, active: false },
    { id: "side-l-2", name: "Left 2", position: { x: 0, y: 0 }, type: "side-left", color: "#ffffff", intensity: 75, active: false },
    { id: "side-r-1", name: "Right 1", position: { x: 0, y: 0 }, type: "side-right", color: "#ffffff", intensity: 75, active: false },
    { id: "side-r-2", name: "Right 2", position: { x: 0, y: 0 }, type: "side-right", color: "#ffffff", intensity: 75, active: false },
    { id: "front-1", name: "Front 1", position: { x: 0, y: 0 }, type: "front", color: "#ffffff", intensity: 75, active: false },
    { id: "front-2", name: "Front 2", position: { x: 0, y: 0 }, type: "front", color: "#ffffff", intensity: 75, active: false },
    { id: "backdrop-1", name: "Cyc Left", position: { x: 0, y: 0 }, type: "backdrop", color: "#0066ff", intensity: 75, active: false },
    { id: "backdrop-2", name: "Cyc Center", position: { x: 0, y: 0 }, type: "backdrop", color: "#0066ff", intensity: 75, active: false },
    { id: "backdrop-3", name: "Cyc Right", position: { x: 0, y: 0 }, type: "backdrop", color: "#0066ff", intensity: 75, active: false },
    { id: "special-1", name: "Spot 1 (TL)", position: { x: 25, y: 25 }, type: "special", color: "#ff00ff", intensity: 75, active: false },
    { id: "special-2", name: "Spot 2 (TC)", position: { x: 50, y: 25 }, type: "special", color: "#ff00ff", intensity: 75, active: false },
    { id: "special-3", name: "Spot 3 (TR)", position: { x: 75, y: 25 }, type: "special", color: "#ff00ff", intensity: 75, active: false },
    { id: "special-4", name: "Spot 4 (ML)", position: { x: 25, y: 50 }, type: "special", color: "#00ffff", intensity: 75, active: false },
    { id: "special-5", name: "Spot 5 (MC)", position: { x: 50, y: 50 }, type: "special", color: "#ffff00", intensity: 75, active: false },
    { id: "special-6", name: "Spot 6 (MR)", position: { x: 75, y: 50 }, type: "special", color: "#00ffff", intensity: 75, active: false },
    { id: "special-7", name: "Spot 7 (BL)", position: { x: 25, y: 75 }, type: "special", color: "#ff8800", intensity: 75, active: false },
    { id: "special-8", name: "Spot 8 (BC)", position: { x: 50, y: 75 }, type: "special", color: "#ff8800", intensity: 75, active: false },
    { id: "special-9", name: "Spot 9 (BR)", position: { x: 75, y: 75 }, type: "special", color: "#ff8800", intensity: 75, active: false },
  ];
}
