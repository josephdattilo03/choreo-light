import { Lightbulb, Redo, Save, Undo, User } from "lucide-react";

const COLORS = [
  ["Background", "#000000"],
  ["Stage & quick tips background", "#18181B"],
  ["Stage floor (default)", "#0B0324"],
  ["Input areas", "#27272A"],
  ["Text (primary)", "#FFFFFF"],
  ["Text (secondary)", "#9F9FA9"],
  ["Save button", "#931494"],
  ["Lighting option on", "#C58383"],
] as const;

const ICONS = [
  ["Header lightbulb", Lightbulb],
  ["Performer silhouette", User],
  ["Undo", Undo],
  ["Redo", Redo],
  ["Save / floppy", Save],
] as const;

export default function HelloWorld() {
  return (
    <div style={{ padding: 16, fontFamily: "Inter, sans-serif" }}>
      <div>Hello styles.</div>

      <div style={{ marginTop: 12 }}>Colors</div>
      {COLORS.map(([name, hex]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <div style={{ width: 24, height: 24, background: hex, border: "1px solid #999" }} />
          <div>{name}</div>
          <div>{hex.replace("#", "")}</div>
        </div>
      ))}

      <div style={{ marginTop: 16 }}>Icons</div>
      {ICONS.map(([name, Icon]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <Icon size={16} />
          <div>{name}</div>
        </div>
      ))}
    </div>
  );
}