"use client";

import React from "react";
import { REGIONAL_DEMS } from "@/lib/mola-data";
import { 
  Compass, 
  Globe2, 
  Map as MapIcon, 
  Bot, 
  Database, 
  Radio, 
  ShieldCheck,
  ChevronDown
} from "lucide-react";

interface TopBarProps {
  selectedRegionId: string;
  onSelectRegion: (id: string) => void;
  viewMode: "2D" | "3D";
  onToggleViewMode: (mode: "2D" | "3D") => void;
  onOpenAskMarscope: () => void;
  onOpenDataSources: () => void;
  onOpenGuide: () => void;
  onOpenMissionBrief?: () => void;
  hasActiveRoute: boolean;
}

export default function TopBar({
  selectedRegionId,
  onSelectRegion,
  viewMode,
  onToggleViewMode,
  onOpenAskMarscope,
  onOpenDataSources,
  onOpenGuide,
  onOpenMissionBrief,
  hasActiveRoute,
}: TopBarProps) {
  return (
    <header className="h-14 bg-surface-darker/95 backdrop-blur-md border-b border-surface-border px-3 sm:px-5 flex items-center justify-between z-30 select-none">
      {/* Brand & Mission Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-mars-600 to-mars-400 flex items-center justify-center shadow-hud">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm sm:text-base font-black text-white tracking-widest">
                MARSCOPE
              </span>
              <span className="hidden md:inline-block text-[10px] font-mono px-2 py-0.2 bg-mars-500/20 text-mars-400 border border-mars-500/30 rounded font-semibold">
                INTERPLANETARY SURVIVAL GUIDE
              </span>
            </div>
            <div className="text-[10px] text-gray-400 hidden sm:block">
              NASA Space Apps 2026 | Planetary Mission Planner
            </div>
          </div>
        </div>
      </div>

      {/* Regional Exploration Quick-Jump */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center bg-surface-dark border border-surface-border rounded-lg px-2.5 py-1">
          <span className="text-[11px] font-mono text-gray-400 mr-2 hidden md:inline">REGION:</span>
          <select
            value={selectedRegionId}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer pr-1"
          >
            {REGIONAL_DEMS.map((dem) => (
              <option key={dem.id} value={dem.id} className="bg-surface-darker text-white">
                {dem.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2D / 3D Mode Switcher */}
        <div className="flex bg-surface-dark rounded-lg p-0.5 border border-surface-border">
          <button
            onClick={() => onToggleViewMode("2D")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
              viewMode === "2D"
                ? "bg-mars-600 text-white font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2D Workstation</span>
            <span className="sm:hidden">2D</span>
          </button>
          <button
            onClick={() => onToggleViewMode("3D")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
              viewMode === "3D"
                ? "bg-mars-600 text-white font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3D Globe</span>
            <span className="sm:hidden">3D</span>
          </button>
        </div>
      </div>

      {/* Utilities & Help */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 bg-gradient-to-r from-mars-700/80 to-mars-600/80 hover:from-mars-600 hover:to-mars-500 border border-mars-500/50 text-white px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold shadow-sm transition-all"
        >
          <span className="text-sm">👨‍🚀</span>
          <span className="hidden sm:inline">Mission Guide</span>
        </button>

        <button
          onClick={onOpenAskMarscope}
          className="flex items-center gap-1.5 bg-surface-dark hover:bg-surface-card border border-surface-border text-gray-200 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors"
        >
          <Bot className="w-3.5 h-3.5 text-mars-400" />
          <span className="hidden lg:inline">Ask MARSCOPE</span>
        </button>

        <button
          onClick={onOpenDataSources}
          className="flex items-center gap-1.5 bg-surface-dark hover:bg-surface-card border border-surface-border text-gray-200 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-telemetry-cyan" />
          <span className="hidden lg:inline">Data Sources</span>
        </button>

        {/* Demo Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-mono bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 px-2.5 py-1 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          DEMO DATA: MOLA/CRISM VERIFIED
        </div>
      </div>
    </header>
  );
}
