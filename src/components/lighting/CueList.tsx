"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Play } from "lucide-react";
import type { Cue } from "@/lib/lighting-types";

export type { Cue };

interface CueListProps {
  cues: Cue[];
  activeCueId?: string;
  onLoadCue: (cue: Cue) => void;
  onDeleteCue: (cueId: string) => void;
}

export function CueList({ cues, activeCueId, onLoadCue, onDeleteCue }: CueListProps) {
  return (
    <div className="bg-zinc-800 rounded-lg p-6 flex flex-col h-[400px]">
      <h3 className="mb-4">Saved Cues ({cues.length})</h3>
      
      {cues.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          <div className="text-center">
            <p className="mb-2">No cues saved yet</p>
            <p className="text-sm">Save your lighting setups for quick recall</p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="space-y-2">
            {cues.map((cue, index) => (
              <div
                key={cue.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  activeCueId === cue.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                }`}
                onClick={() => onLoadCue(cue)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500 font-mono">
                        Cue {index + 1}
                      </span>
                      <h4 className="truncate">{cue.name}</h4>
                    </div>
                    <p className="text-xs text-zinc-500">{cue.timestamp}</p>
                    
                    {/* Color preview */}
                    {cue.preview && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex gap-1">
                          {cue.preview.colors.slice(0, 5).map((color, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full border border-zinc-600"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          {cue.preview.colors.length > 5 && (
                            <span className="text-xs text-zinc-500">+{cue.preview.colors.length - 5}</span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400">
                          {cue.preview.intensity}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadCue(cue);
                      }}
                      title="Load cue"
                      className="hover:bg-blue-500/20"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCue(cue.id);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      title="Delete cue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
