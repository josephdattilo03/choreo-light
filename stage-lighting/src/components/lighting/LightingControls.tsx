"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface LightingControlsProps {
  categories: {
    name: string;
    lights: Array<{ id: string; name: string; active: boolean; color: string }>;
  }[];
  selectedLights: string[];
  onToggleLight: (lightId: string) => void;
  onToggleCategory: (categoryName: string, active: boolean) => void;
  onSelectLight: (lightId: string, multiSelect: boolean) => void;
}

export function LightingControls({ 
  categories, 
  selectedLights,
  onToggleLight,
  onToggleCategory,
  onSelectLight,
}: LightingControlsProps) {
  return (
    <div className="bg-zinc-800 rounded-lg p-6">
      <h3 className="mb-4">Lighting Categories</h3>
      
      <Accordion type="multiple" className="space-y-2">
        {categories.map((category, index) => {
          const allActive = category.lights.every(l => l.active);
          const someActive = category.lights.some(l => l.active);
          
          return (
            <AccordionItem 
              key={category.name} 
              value={`item-${index}`}
              className="border border-zinc-700 rounded-lg bg-zinc-900/50"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-zinc-700/30 rounded-lg">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{category.name}</span>
                    <span className="text-sm text-zinc-400">
                      ({category.lights.filter(l => l.active).length}/{category.lights.length})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-zinc-500">All</span>
                    <Switch
                      checked={allActive}
                      onCheckedChange={(checked) => onToggleCategory(category.name, checked)}
                      className={someActive && !allActive ? 'opacity-60' : ''}
                    />
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 pb-3">
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {category.lights.map(light => (
                    <div 
                      key={light.id} 
                      className={`flex items-center gap-2 p-2 rounded transition-colors cursor-pointer ${
                        selectedLights.includes(light.id)
                          ? 'bg-blue-500/20 border border-blue-500/50'
                          : 'hover:bg-zinc-700/50 border border-transparent'
                      }`}
                      onClick={(e) => {
                        onSelectLight(light.id, e.shiftKey);
                      }}
                    >
                      <Switch
                        checked={light.active}
                        onCheckedChange={() => onToggleLight(light.id)}
                        id={light.id}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label 
                        htmlFor={light.id}
                        className="text-sm text-zinc-300 cursor-pointer flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {light.name}
                      </Label>
                      {light.active && (
                        <div 
                          className="w-4 h-4 rounded-full border border-zinc-500 flex-shrink-0"
                          style={{ 
                            backgroundColor: light.color,
                            boxShadow: `0 0 6px ${light.color}`
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
