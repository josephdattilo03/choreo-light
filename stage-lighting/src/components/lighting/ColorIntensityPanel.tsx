"use client";

import { Slider } from "@/components/ui/slider";
import { Pipette } from 'lucide-react';

interface ColorIntensityPanelProps {
  selectedColor: string;
  intensity: number;
  onColorChange: (color: string) => void;
  onIntensityChange: (intensity: number) => void;
  selectedLightsCount: number;
  customColor: string;
  onCustomColorChange: (color: string) => void;
}

const COLORS = [
  { name: 'Red', value: '#ff0000' },
  { name: 'Orange', value: '#ff8800' },
  { name: 'Yellow', value: '#ffff00' },
  { name: 'Green', value: '#00ff00' },
  { name: 'Cyan', value: '#00ffff' },
  { name: 'Blue', value: '#0000ff' },
  { name: 'Purple', value: '#8800ff' },
  { name: 'Magenta', value: '#ff00ff' },
  { name: 'White', value: '#ffffff' },
];

export function ColorIntensityPanel({ 
  selectedColor, 
  intensity, 
  onColorChange, 
  onIntensityChange,
  selectedLightsCount,
  customColor,
  onCustomColorChange,
}: ColorIntensityPanelProps) {
  return (
    <div className="bg-zinc-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3>Light Controls</h3>
        {selectedLightsCount > 0 && (
          <span className="text-sm text-blue-400">
            {selectedLightsCount} light{selectedLightsCount > 1 ? 's' : ''} selected
          </span>
        )}
      </div>
      
      {selectedLightsCount === 0 && (
        <div className="text-sm text-zinc-500 bg-zinc-900 rounded p-3">
          Select a light to adjust its color and intensity
        </div>
      )}
      
      <div>
        <h3 className="mb-4">Color Select</h3>
        <div className="grid grid-cols-5 gap-3 mb-3">
          {COLORS.map(color => (
            <button
              key={color.value}
              onClick={() => onColorChange(color.value)}
              disabled={selectedLightsCount === 0}
              className={`w-12 h-12 rounded-full border-4 transition-all ${
                selectedColor === color.value 
                  ? 'border-white scale-110 shadow-lg' 
                  : selectedLightsCount === 0
                  ? 'border-zinc-700 opacity-50 cursor-not-allowed'
                  : 'border-zinc-600 hover:border-zinc-400'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
          
          {/* Custom Color Picker */}
          <div className="relative">
            <input
              type="color"
              value={customColor}
              onChange={(e) => onCustomColorChange(e.target.value)}
              disabled={selectedLightsCount === 0}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              title="Custom Color"
            />
            <button
              disabled={selectedLightsCount === 0}
              className={`w-12 h-12 rounded-full border-4 transition-all flex items-center justify-center ${
                selectedColor === customColor 
                  ? 'border-white scale-110 shadow-lg' 
                  : selectedLightsCount === 0
                  ? 'border-zinc-700 opacity-50 cursor-not-allowed'
                  : 'border-zinc-600 hover:border-zinc-400'
              }`}
              style={{ backgroundColor: customColor }}
              title="Custom Color"
            >
              <Pipette className="w-5 h-5 text-white drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }} />
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3>Intensity</h3>
          <span className="text-2xl font-mono">{intensity}%</span>
        </div>
        <Slider
          value={[intensity]}
          onValueChange={(values) => onIntensityChange(values[0])}
          max={100}
          step={1}
          className="w-full"
          disabled={selectedLightsCount === 0}
        />
        <div className="flex justify-between mt-2 text-sm text-zinc-400">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
