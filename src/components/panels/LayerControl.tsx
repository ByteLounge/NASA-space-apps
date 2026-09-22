"use client";

import React from "react";
import { ActiveLayers } from "@/components/map/MarsMap2D";
import { 
  Layers, 
  Mountain, 
  TrendingUp, 
  Sparkles, 
  Flame, 
  AlertTriangle, 
  Navigation,
  Check,
  ChevronDown
} from "lucide-react";

interface LayerControlProps {
  activeLayers: ActiveLayers;
  onLayerChange: (newLayers: ActiveLayers) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export default function LayerControl({
  activeLayers,
  onLayerChange,
  isOpen,
  onToggleOpen,
}: LayerControlProps) {
  const toggle = (key: keyof ActiveLayers) => {
    onLayerChange({
      ...activeLayers,
      [key]: !activeLayers[key],
    });
  };

  const setBase = (mode: ActiveLayers["baseImagery"]) => {
    onLayerChange({
      ...activeLayers,
      baseImagery: mode,
    });
  };

  return (
    <div className="bg-surface-darker/95 backdrop-blur-md border border-surface-border rounded-xl shadow-hud text-xs text-gray-300 w-64 sm:w-72 overflow-hidden transition-all">
      {/* Header */}
      <button
        onClick={onToggleOpen}
        className="w-full flex items-center justify-between p-3.5 hover:bg-surface-card/60 transition-colors"
      >
        <div className="flex items-center gap-2 font-mono font-semibold text-white">
          <Layers className="w-4 h-4 text-mars-500" />
          PLANETARY DATA LAYERS
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="p-3.5 pt-0 space-y-4 border-t border-surface-border/60">
          {/* Base Imagery Radio Group */}
          <div>
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-2">
              BASE IMAGERY (USGS / NASA):
            </label>
            <div className="space-y-1.5">
              {[
                { id: "VIKING" as const, name: "Viking MDIM 2.1 Color", desc: "USGS controlled true-color mosaic" },
                { id: "MOLA_COLOR" as const, name: "MOLA Color Shaded Relief", desc: "Topographic elevation color spectrum" },
                { id: "THEMIS_IR" as const, name: "THEMIS Daytime IR (100m)", desc: "Thermal inertia & bedrock exposure" },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBase(b.id)}
                  className={`w-full text-left p-2 rounded-lg border transition-all flex items-start justify-between ${
                    activeLayers.baseImagery === b.id
                      ? "bg-mars-950/40 border-mars-500/80 text-white"
                      : "bg-surface-dark/50 border-surface-border/50 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs font-medium">{b.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{b.desc}</div>
                  </div>
                  {activeLayers.baseImagery === b.id && (
                    <Check className="w-3.5 h-3.5 text-mars-500 shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Scientific Overlay Toggles */}
          <div>
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-2">
              SCIENTIFIC OVERLAYS:
            </label>
            <div className="space-y-1">
              {[
                {
                  key: "slopeHazards" as const,
                  name: "MOLA Slope Hazards (>12°)",
                  desc: "Highlights steep inclines & scarps",
                  icon: TrendingUp,
                  color: "text-amber-400",
                },
                {
                  key: "scienceTargets" as const,
                  name: "NASA Science Waypoints",
                  desc: "Rover stations & geomorphic targets",
                  icon: Sparkles,
                  color: "text-emerald-400",
                },
                {
                  key: "crismMinerals" as const,
                  name: "MRO CRISM Mineralogy",
                  desc: "Carbonate, smectite, & sulfate deposits",
                  icon: Flame,
                  color: "text-purple-400",
                },
                {
                  key: "hazards" as const,
                  name: "Exploration Hazards",
                  desc: "Dune ripple traps & cliff drop-offs",
                  icon: AlertTriangle,
                  color: "text-red-400",
                },
                {
                  key: "activeRoute" as const,
                  name: "EVA Traversal Routes",
                  desc: "A* simulated paths & checkpoints",
                  icon: Navigation,
                  color: "text-telemetry-cyan",
                },
              ].map(({ key, name, desc, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between ${
                    activeLayers[key]
                      ? "bg-surface-dark border-surface-border text-white"
                      : "bg-surface-dark/30 border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <div>
                      <div className="font-mono text-xs">{name}</div>
                      <div className="text-[10px] text-gray-500">{desc}</div>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      activeLayers[key]
                        ? "bg-mars-600 border-mars-500 text-white"
                        : "border-surface-border bg-surface-darkest"
                    }`}
                  >
                    {activeLayers[key] && <Check className="w-3 h-3" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
