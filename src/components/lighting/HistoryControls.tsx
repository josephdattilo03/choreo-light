"use client";

import { Button } from "@/components/ui/button";
import { Undo, Redo, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface HistoryControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: (name: string) => void;
}

export function HistoryControls({ 
  canUndo, 
  canRedo, 
  onUndo, 
  onRedo, 
  onSave 
}: HistoryControlsProps) {
  const [cueName, setCueName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSave = () => {
    if (cueName.trim()) {
      onSave(cueName.trim());
      setCueName('');
      setDialogOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
      >
        <Undo className="w-4 h-4 mr-2" />
        Undo
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo"
      >
        <Redo className="w-4 h-4 mr-2" />
        Redo
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save Cue
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Lighting Cue</DialogTitle>
            <DialogDescription>
              Give this lighting configuration a name to save it for later use.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="cue-name" className="mb-2 block">
              Cue Name
            </Label>
            <Input
              id="cue-name"
              placeholder="e.g., Opening Scene, Dramatic Moment"
              value={cueName}
              onChange={(e) => setCueName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!cueName.trim()}>
              Save Cue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
