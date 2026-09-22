"use client";

import React, { useState } from "react";
import { MarsCoordinate, formatMarsCoordinate } from "@/lib/mars-coordinates";
import { RouteResult, RouteStrategy } from "@/lib/pathfinding";
import { SCIENCE_POINTS, SciencePoint } from "@/lib/science-data";
import { 
  Navigation, 
  Flag, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Mountain, 
  AlertTriangle, 
  ArrowRight,
  BarChart2,
  FileText,
  Layers,
  RotateCcw
} from "lucide-react";

interface RoutePlannerPanelProps {
  startCoord: MarsCoordinate | null;
  destCoord: MarsCoordinate | null;
  activeRoute: RouteResult | null;
  selectedStrategy: RouteStrategy;
  isCalculating: boolean;
  onStrategyChange: (strategy: RouteStrategy) => void;
  onSelectPresetStart: (coord: MarsCoordinate) => void;
  onSelectPresetDest: (coord: MarsCoordinate) => void;
  onOpenComparison: () => void;
  onOpenElevationChart: () => void;
  onOpenMissionBrief: () => void;
  onResetRoute: () => void;
}

export default function RoutePlannerPanel({
  startCoord,
  destCoord,
  activeRoute,
  selectedStrategy,
  isCalculating,
  onStrategyChange,
  onSelectPresetStart,
  onSelectPresetDest,
  onOpenComparison,
  onOpenElevationChart,
  onOpenMissionBrief,
  onResetRoute,
}: RoutePlannerPanelProps) {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="bg-surface-darker/95 backdrop-blur-md border border-surface-border rounded-xl p-4 sm:p-5 shadow-hud flex flex-col gap-4 text-xs text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border pb-3">
        <div className="flex items-center gap-2 font-mono text-sm text-white font-semibold">
          <Navigation className="w-4 h-4 text-mars-500" />
          EVA TRAVERSAL & MISSION PLANNER
        </div>
        <button
          onClick={onResetRoute}
          title="Reset Traverse Points"
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-surface-border transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Start / Destination Display & Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-surface-dark p-2.5 rounded-lg border border-surface-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-gray-400 font-mono text-[11px]">START:</span>
          </div>
          <span className="font-mono text-white font-medium text-[11px] truncate max-w-[210px]">
            {startCoord ? formatMarsCoordinate(startCoord) : "Click map to set"}
          </span>
        </div>

        <div className="flex items-center justify-between bg-surface-dark p-2.5 rounded-lg border border-surface-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mars-500" />
            <span className="text-gray-400 font-mono text-[11px]">TARGET:</span>
          </div>
          <span className="font-mono text-white font-medium text-[11px] truncate max-w-[210px]">
            {destCoord ? formatMarsCoordinate(destCoord) : "Click map to set"}
          </span>
        </div>

        {/* Quick NASA Preset Selectors */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="text-[11px] text-mars-400 hover:text-mars-300 font-mono underline"
          >
            {showPresets ? "Hide NASA Targets" : "Load NASA Science Targets..."}
          </button>
        </div>

        {showPresets && (
          <div className="bg-surface-dark/90 p-2 rounded-lg border border-surface-border space-y-1.5 max-h-40 overflow-y-auto">
            <div className="text-[10px] font-mono text-gray-400 uppercase">Perseverance & Jezero Targets:</div>
            {SCIENCE_POINTS.slice(0, 5).map((pt) => (
              <div key={pt.id} className="flex items-center justify-between text-[11px] hover:bg-surface-card p-1 rounded">
                <span className="truncate max-w-[170px] text-gray-200">{pt.name}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onSelectPresetStart({ lat: pt.lat, lng: pt.lng })}
                    className="text-[10px] px-1.5 py-0.5 bg-emerald-950/60 text-emerald-400 rounded hover:bg-emerald-900/80 border border-emerald-800/40"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => onSelectPresetDest({ lat: pt.lat, lng: pt.lng })}
                    className="text-[10px] px-1.5 py-0.5 bg-mars-950/60 text-mars-400 rounded hover:bg-mars-900/80 border border-mars-800/40"
                  >
                    Dest
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strategy Selector Tabs */}
      <div>
        <label className="text-[11px] font-mono text-gray-400 mb-1.5 block">
          PATHFINDING STRATEGY (A* ALGORITHM):
        </label>
        <div className="grid grid-cols-3 gap-1.5 bg-surface-dark p-1 rounded-lg border border-surface-border">
          <button
            onClick={() => onStrategyChange("SAFEST")}
            className={`flex flex-col items-center py-2 px-1 rounded transition-all ${
              selectedStrategy === "SAFEST"
                ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4 mb-0.5 text-emerald-400" />
            <span className="text-[11px] font-mono">SAFEST</span>
          </button>

          <button
            onClick={() => onStrategyChange("FASTEST")}
            className={`flex flex-col items-center py-2 px-1 rounded transition-all ${
              selectedStrategy === "FASTEST"
                ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4 mb-0.5 text-telemetry-cyan" />
            <span className="text-[11px] font-mono">FASTEST</span>
          </button>

          <button
            onClick={() => onStrategyChange("SCIENCE")}
            className={`flex flex-col items-center py-2 px-1 rounded transition-all ${
              selectedStrategy === "SCIENCE"
                ? "bg-purple-600/30 text-purple-300 border border-purple-500/50 font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5 text-purple-400" />
            <span className="text-[11px] font-mono">SCIENCE</span>
          </button>
        </div>
      </div>

      {/* Calculated Route Telemetry */}
      {isCalculating ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-400">
          <span className="w-5 h-5 border-2 border-mars-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-mars-400">Computing A* Martian Traverse Graph...</span>
        </div>
      ) : activeRoute ? (
        <div className="space-y-3">
          {/* Key Metric Chips */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-surface-dark p-2 rounded-lg border border-surface-border text-center">
              <div className="text-[10px] text-gray-400">Distance</div>
              <div className="font-mono text-sm text-white font-bold">{activeRoute.totalDistanceKm} km</div>
            </div>
            <div className="bg-surface-dark p-2 rounded-lg border border-surface-border text-center">
              <div className="text-[10px] text-gray-400">Est. Time</div>
              <div className="font-mono text-sm text-white font-bold">{activeRoute.totalDurationFormatted}</div>
            </div>
            <div className="bg-surface-dark p-2 rounded-lg border border-surface-border text-center">
              <div className="text-[10px] text-gray-400">Max Slope</div>
              <div className="font-mono text-sm text-white font-bold">{activeRoute.maxSlopeDeg}°</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface-dark p-2 rounded-lg border border-surface-border flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Elevation Δ:</span>
              <span className="font-mono text-xs text-emerald-400 font-bold">
                +{activeRoute.elevationGainMeters}m / -{activeRoute.elevationLossMeters}m
              </span>
            </div>
            <div className="bg-surface-dark p-2 rounded-lg border border-surface-border flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Science Yield:</span>
              <span className="font-mono text-xs text-purple-400 font-bold">
                {activeRoute.scienceScore}/100
              </span>
            </div>
          </div>

          {/* Strategic Rationale */}
          <div className="bg-surface-dark/70 p-2.5 rounded-lg border border-surface-border/70 text-[11px] leading-relaxed">
            <div className="text-[10px] font-mono text-mars-400 font-semibold mb-1">
              MARSCOPE ALGORITHM RATIONALE:
            </div>
            {activeRoute.rationale}
          </div>

          {/* Hazard Warnings */}
          {activeRoute.hazardWarnings.length > 0 && (
            <div className="space-y-1 bg-amber-950/20 border border-amber-800/40 p-2 rounded-lg">
              <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3" />
                TRAVERSE WARNINGS ({activeRoute.hazardWarnings.length})
              </div>
              {activeRoute.hazardWarnings.map((warn, i) => (
                <div key={i} className="text-[10px] text-amber-200">
                  • {warn}
                </div>
              ))}
            </div>
          )}

          {/* Operational Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onOpenComparison}
              className="flex items-center justify-center gap-1.5 bg-surface-dark hover:bg-surface-card border border-surface-border text-gray-200 px-3 py-2 rounded-lg font-mono text-xs transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5 text-telemetry-cyan" />
              Compare Routes
            </button>
            <button
              onClick={onOpenElevationChart}
              className="flex items-center justify-center gap-1.5 bg-surface-dark hover:bg-surface-card border border-surface-border text-gray-200 px-3 py-2 rounded-lg font-mono text-xs transition-colors"
            >
              <Mountain className="w-3.5 h-3.5 text-yellow-400" />
              Elevation Profile
            </button>
          </div>

          <button
            onClick={onOpenMissionBrief}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-mars-600 to-mars-500 hover:from-mars-500 hover:to-mars-600 text-white font-mono font-bold text-xs py-2.5 px-4 rounded-lg shadow-hud transition-all"
          >
            <FileText className="w-4 h-4" />
            GENERATE OFFICIAL MISSION BRIEF
          </button>
        </div>
      ) : (
        <div className="bg-surface-dark/50 border border-surface-border/50 rounded-lg p-3 text-center text-gray-500 text-xs">
          Select both a START station and a TARGET destination on the map to compute candidate exploration traverses.
        </div>
      )}
    </div>
  );
}
