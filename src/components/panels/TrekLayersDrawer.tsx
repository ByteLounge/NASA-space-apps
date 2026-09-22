"use client";

import React from "react";
import { ActiveLayers } from "@/components/map/MarsMap2D";
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Sliders, 
  Info, 
  X, 
  Check, 
  ExternalLink,
  Flame,
  Mountain,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Navigation
} from "lucide-react";

interface TrekLayersDrawerProps {
  activeLayers: ActiveLayers;
  onLayerChange: (newLayers: ActiveLayers) => void;
  baseOpacity: number;
  onBaseOpacityChange: (opacity: number) => void;
  onClose: () => void;
}

export default function TrekLayersDrawer({
  activeLayers,
  onLayerChange,
  baseOpacity,
  onBaseOpacityChange,
  onClose,
}: TrekLayersDrawerProps) {
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

  const basemaps = [
    {
      id: "VIKING" as const,
      name: "Mars Viking MDIM 2.1 Color Mosaic",
      mission: "Viking Orbiters 1 & 2 / USGS Astrogeology",
      resolution: "232 m/pixel true-color controlled mosaic",
    },
    {
      id: "MOLA_COLOR" as const,
      name: "MOLA Color Hillshade Topography",
      mission: "Mars Global Surveyor (MGS) MOLA",
      resolution: "463 m/pixel elevation color gradient (Areoid datum)",
    },
    {
      id: "THEMIS_IR" as const,
      name: "THEMIS Daytime Infrared (100m)",
      mission: "2001 Mars Odyssey / Arizona State University",
      resolution: "100 m/pixel thermal inertia & bedrock density",
    },
  ];

  const overlays = [
    {
      key: "slopeHazards" as const,
      name: "MOLA Slope Hazards (>12°)",
      desc: "Steep inclines, crater walls, & scarps",
      icon: TrendingUp,
      color: "text-amber-400",
    },
    {
      key: "scienceTargets" as const,
      name: "NASA Science Landmarks & Stations",
      desc: "Perseverance, Curiosity, Viking, & InSight",
      icon: Sparkles,
      color: "text-emerald-400",
    },
    {
      key: "crismMinerals" as const,
      name: "MRO CRISM Mineralogical Detections",
      desc: "Aqueous smectite clays, carbonates, & sulfates",
      icon: Flame,
      color: "text-purple-400",
    },
    {
      key: "hazards" as const,
      name: "Exploration Hazards & Sand Traps",
      desc: "Dune ripple slip-faces & cliff drop-offs",
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      key: "activeRoute" as const,
      name: "Planned EVA Traversal Routes",
      desc: "A* simulated paths & checkpoints",
      icon: Navigation,
      color: "text-telemetry-cyan",
    },
  ];

  return (
    <div className="absolute top-16 left-16 z-30 w-80 sm:w-96 max-h-[calc(100vh-8rem)] bg-[#0e131d]/98 backdrop-blur-xl border border-[#232d3f] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left-3 duration-200 select-none">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#232d3f]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-mars-500" />
          <h2 className="font-mono text-sm font-bold text-white tracking-wider uppercase">
            NASA Trek Products & Layers
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#182030] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto p-4 space-y-5 text-xs font-mono">
        {/* Basemap Selector */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-2 font-bold flex items-center gap-1.5">
            <span>ACTIVE GLOBAL BASEMAP:</span>
          </label>
          <div className="space-y-1.5">
            {basemaps.map((b) => {
              const isSelected = activeLayers.baseImagery === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setBase(b.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start justify-between ${
                    isSelected
                      ? "bg-mars-950/50 border-mars-500 text-white shadow-sm"
                      : "bg-[#141a26]/70 border-[#232d3f] text-gray-400 hover:text-gray-200 hover:border-gray-600"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-white">{b.name}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{b.mission}</div>
                    <div className="text-[9px] text-gray-500 mt-0.5">{b.resolution}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-mars-500 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Opacity Slider */}
          <div className="mt-3 bg-[#141a26] border border-[#232d3f] p-2.5 rounded-xl">
            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3 text-mars-400" />
                Basemap Opacity
              </span>
              <span className="text-white font-bold">{Math.round(baseOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={baseOpacity}
              onChange={(e) => onBaseOpacityChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#0b0e14] rounded-lg appearance-none cursor-pointer accent-mars-500"
            />
          </div>
        </div>

        {/* Overlays */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-2 font-bold">
            NASA SCIENTIFIC OVERLAYS & HAZARDS:
          </label>
          <div className="space-y-1.5">
            {overlays.map(({ key, name, desc, icon: Icon, color }) => {
              const isVisible = activeLayers[key];
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isVisible
                      ? "bg-[#141a26] border-[#232d3f] text-white"
                      : "bg-[#141a26]/40 border-transparent text-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <div>
                      <div className="font-bold text-xs">{name}</div>
                      <div className="text-[10px] text-gray-400">{desc}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggle(key)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isVisible
                        ? "bg-mars-600 text-white"
                        : "bg-[#0b0e14] text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
