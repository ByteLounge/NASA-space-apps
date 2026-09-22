"use client";

import React from "react";
import { RouteResult, RouteStrategy } from "@/lib/pathfinding";
import { 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Mountain, 
  AlertTriangle, 
  Check, 
  X, 
  ArrowRight,
  Info
} from "lucide-react";

interface RouteComparisonPanelProps {
  comparison: {
    safest: RouteResult;
    fastest: RouteResult;
    science: RouteResult;
  } | null;
  activeStrategy: RouteStrategy;
  onSelectStrategy: (strategy: RouteStrategy) => void;
  onClose: () => void;
}

export default function RouteComparisonPanel({
  comparison,
  activeStrategy,
  onSelectStrategy,
  onClose,
}: RouteComparisonPanelProps) {
  if (!comparison) return null;

  const routes = [
    {
      key: "SAFEST" as RouteStrategy,
      route: comparison.safest,
      title: "SAFEST",
      subtitle: "Terrain Hazard Minimization",
      icon: ShieldCheck,
      color: "emerald",
      badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    {
      key: "FASTEST" as RouteStrategy,
      route: comparison.fastest,
      title: "FASTEST",
      subtitle: "Direct Geodesic Transit",
      icon: Zap,
      color: "cyan",
      badgeColor: "bg-cyan-500/15 text-telemetry-cyan border-cyan-500/30",
    },
    {
      key: "SCIENCE" as RouteStrategy,
      route: comparison.science,
      title: "SCIENCE",
      subtitle: "Astrobiology & Mineralogy Yield",
      icon: Sparkles,
      color: "purple",
      badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-surface-darker border border-surface-border rounded-2xl shadow-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-base font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-mars-500" />
              MARSCOPE MULTI-OBJECTIVE ROUTE EVALUATION
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Side-by-side comparison of candidate Martian traverse paths calculated across the MOLA digital elevation model.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Strategy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {routes.map(({ key, route, title, subtitle, icon: Icon, badgeColor }) => {
            const isSelected = activeStrategy === key;
            return (
              <div
                key={key}
                className={`relative rounded-xl p-4 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-surface-dark/90 border-mars-500 shadow-hud ring-1 ring-mars-500/50"
                    : "bg-surface-dark/40 border-surface-border hover:border-gray-600"
                }`}
              >
                <div>
                  {/* Card Title */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-300" />
                      <span className="font-mono font-bold text-sm text-white">{title}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeColor}`}>
                      {key}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mb-4">{subtitle}</div>

                  {/* Primary Metrics */}
                  <div className="space-y-2.5 font-mono text-xs mb-4">
                    <div className="flex justify-between border-b border-surface-border/50 pb-1.5">
                      <span className="text-gray-400">Total Distance:</span>
                      <span className="text-white font-bold">{route.totalDistanceKm} km</span>
                    </div>

                    <div className="flex justify-between border-b border-surface-border/50 pb-1.5">
                      <span className="text-gray-400">Estimated Duration:</span>
                      <span className="text-white font-bold">{route.totalDurationFormatted}</span>
                    </div>

                    <div className="flex justify-between border-b border-surface-border/50 pb-1.5">
                      <span className="text-gray-400">Max Inclination:</span>
                      <span className={`font-bold ${route.maxSlopeDeg > 15 ? "text-amber-400" : "text-white"}`}>
                        {route.maxSlopeDeg}°
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-surface-border/50 pb-1.5">
                      <span className="text-gray-400">Elevation Gain:</span>
                      <span className="text-emerald-400 font-bold">+{route.elevationGainMeters} m</span>
                    </div>

                    <div className="flex justify-between border-b border-surface-border/50 pb-1.5">
                      <span className="text-gray-400">Traversability:</span>
                      <span className="text-gray-200 font-bold">{route.terrainDifficulty}</span>
                    </div>

                    <div className="flex justify-between border-b border-surface-border/50 pb-1.5">
                      <span className="text-gray-400">Science Interest Score:</span>
                      <span className="text-purple-400 font-bold">{route.scienceScore} / 100</span>
                    </div>
                  </div>

                  {/* Strategic Rationale */}
                  <p className="text-[11px] text-gray-300 leading-relaxed bg-surface-darker/60 p-2.5 rounded-lg border border-surface-border/60 mb-4">
                    {route.rationale}
                  </p>
                </div>

                {/* Select Button */}
                <button
                  onClick={() => onSelectStrategy(key)}
                  className={`w-full py-2 px-3 rounded-lg font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isSelected
                      ? "bg-mars-600 text-white cursor-default"
                      : "bg-surface-dark hover:bg-surface-card text-gray-300 border border-surface-border"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Active Route
                    </>
                  ) : (
                    "Select Route"
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Methodology Note */}
        <div className="flex items-start gap-2 bg-surface-dark/70 border border-surface-border/60 p-3 rounded-xl text-xs text-gray-400">
          <Info className="w-4 h-4 text-mars-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-200">Evaluation Methodology: </span>
            Routes are simulated using a discrete 8-connected grid graph of the MGS MOLA elevation model. Movement costs combine 3D distance, metabolic incline penalties based on Martian 0.38g gravity, terrain roughness indices, and inverse-distance CRISM mineral signatures.
          </div>
        </div>
      </div>
    </div>
  );
}
