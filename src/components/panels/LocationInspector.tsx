"use client";

import React from "react";
import { MarsCoordinate, formatMarsCoordinate, normalizeLongitude360 } from "@/lib/mars-coordinates";
import { TerrainAnalysis } from "@/lib/mola-data";
import { ScienceScoreResult, SciencePoint } from "@/lib/science-data";
import { 
  MapPin, 
  Mountain, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  Database, 
  Compass, 
  Navigation,
  Layers,
  CheckCircle2,
  X
} from "lucide-react";

interface LocationInspectorProps {
  coordinate: MarsCoordinate | null;
  terrainAnalysis: TerrainAnalysis | null;
  scienceScore: ScienceScoreResult | null;
  selectedFeature?: SciencePoint | null;
  onSetStart: (coord: MarsCoordinate) => void;
  onSetDestination: (coord: MarsCoordinate) => void;
  onClose?: () => void;
}

export default function LocationInspector({
  coordinate,
  terrainAnalysis,
  scienceScore,
  selectedFeature,
  onSetStart,
  onSetDestination,
  onClose,
}: LocationInspectorProps) {
  if (!coordinate || !terrainAnalysis) {
    return (
      <div className="bg-surface-darker/90 backdrop-blur-md border border-surface-border rounded-xl p-5 text-gray-400 text-xs">
        <div className="flex items-center gap-2 text-gray-300 font-mono text-sm mb-2">
          <Compass className="w-4 h-4 text-mars-500" />
          PLANETARY LOCATION INSPECTOR
        </div>
        <p className="leading-relaxed">
          Click any location on Mars or select a designated scientific landmark to inspect authoritative NASA MOLA elevation, slope gradient, terrain roughness, and CRISM astrobiological interest metrics.
        </p>
      </div>
    );
  }

  const diffColor =
    terrainAnalysis.difficulty === "LOW" ? "text-green-400 border-green-500/30 bg-green-500/10" :
    terrainAnalysis.difficulty === "MODERATE" ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" :
    terrainAnalysis.difficulty === "HIGH" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
    "text-red-400 border-red-500/30 bg-red-500/10";

  const scienceGradeColor =
    scienceScore?.grade === "EXCEPTIONAL" ? "text-telemetry-cyan border-cyan-500/30 bg-cyan-500/10" :
    scienceScore?.grade === "HIGH" ? "text-purple-400 border-purple-500/30 bg-purple-500/10" :
    "text-gray-300 border-gray-600 bg-gray-800/40";

  return (
    <div className="bg-surface-darker/95 backdrop-blur-md border border-surface-border rounded-xl p-4 sm:p-5 shadow-hud flex flex-col gap-4 text-xs text-gray-300">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-surface-border pb-3">
        <div>
          <div className="flex items-center gap-2 font-mono text-sm text-white font-semibold">
            <MapPin className="w-4 h-4 text-mars-500" />
            {selectedFeature ? selectedFeature.name : "Target Location"}
          </div>
          <div className="text-[11px] font-mono text-gray-400 mt-0.5">
            {formatMarsCoordinate(coordinate)}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-surface-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Elevation */}
        <div className="bg-surface-dark/80 border border-surface-border rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-gray-400 text-[11px] mb-1">
            <Mountain className="w-3.5 h-3.5 text-telemetry-cyan" />
            Elevation (Areoid)
          </div>
          <div className="font-mono text-base text-white font-bold">
            {terrainAnalysis.elevationMeters > 0 ? `+${terrainAnalysis.elevationMeters.toLocaleString()}` : terrainAnalysis.elevationMeters.toLocaleString()} m
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">MOLA MEGDR datum</div>
        </div>

        {/* Slope */}
        <div className="bg-surface-dark/80 border border-surface-border rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-gray-400 text-[11px] mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
            Slope Gradient
          </div>
          <div className="font-mono text-base text-white font-bold">
            {terrainAnalysis.slopeDegrees.toFixed(1)}°
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Local central gradient</div>
        </div>

        {/* Traversability Difficulty */}
        <div className="bg-surface-dark/80 border border-surface-border rounded-lg p-2.5">
          <div className="text-gray-400 text-[11px] mb-1">Traversability</div>
          <div className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs border ${diffColor}`}>
            {terrainAnalysis.difficulty}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Roughness: {terrainAnalysis.roughnessMeters} m</div>
        </div>

        {/* Science Score */}
        <div className="bg-surface-dark/80 border border-surface-border rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-gray-400 text-[11px] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Science Value
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-base text-white font-bold">{scienceScore?.score ?? 35}</span>
            <span className="text-[10px] text-gray-400">/ 100</span>
          </div>
          <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${scienceGradeColor}`}>
            {scienceScore?.grade ?? "NOMINAL"}
          </span>
        </div>
      </div>

      {/* Selected Landmark Detail if present */}
      {selectedFeature && (
        <div className="bg-surface-dark/60 border border-surface-border rounded-lg p-3">
          <div className="text-white font-medium text-xs mb-1">{selectedFeature.description}</div>
          <div className="text-[11px] text-gray-400 leading-relaxed">{selectedFeature.scientificRelevance}</div>
          {selectedFeature.mineralogy && (
            <div className="mt-2 text-[11px] text-purple-300 bg-purple-950/40 border border-purple-900/60 rounded px-2 py-1 font-mono">
              Mineral Signature: {selectedFeature.mineralogy}
            </div>
          )}
        </div>
      )}

      {/* Scientific Explanation Breakdown */}
      {scienceScore && scienceScore.reasons.length > 0 && (
        <div className="space-y-1.5 bg-surface-dark/40 p-2.5 rounded-lg border border-surface-border/60">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            Why this score? (MARSCOPE Analytical Evaluation)
          </div>
          {scienceScore.reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-gray-300">
              <span className="text-mars-400 mt-0.5">•</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hazard Flags */}
      {terrainAnalysis.hazardFlags.length > 0 && (
        <div className="space-y-1 bg-amber-950/20 border border-amber-800/40 p-2.5 rounded-lg">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px] font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            TERRAIN HAZARD ADVISORY
          </div>
          {terrainAnalysis.hazardFlags.map((flag, idx) => (
            <div key={idx} className="text-[10px] font-mono text-amber-200">
              ⚠ {flag.replace(/_/g, " ")}
            </div>
          ))}
        </div>
      )}

      {/* Data Source & Methodology Banner */}
      <div className="text-[10px] text-gray-400 bg-surface-dark p-2 rounded border border-surface-border/50">
        <div className="font-semibold text-gray-300 flex items-center gap-1">
          <Database className="w-3 h-3 text-mars-500" />
          Data Source: {terrainAnalysis.scientificDataSource}
        </div>
        <div className="mt-0.5 italic">{terrainAnalysis.methodology}</div>
      </div>

      {/* Route Setting Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => onSetStart(coordinate)}
          className="flex items-center justify-center gap-1.5 bg-surface-dark hover:bg-emerald-950/40 border border-emerald-600/40 hover:border-emerald-500 text-emerald-400 px-3 py-2 rounded-lg font-mono text-xs font-semibold transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          Set as Start
        </button>
        <button
          onClick={() => onSetDestination(coordinate)}
          className="flex items-center justify-center gap-1.5 bg-surface-dark hover:bg-mars-950/40 border border-mars-600/40 hover:border-mars-500 text-mars-400 px-3 py-2 rounded-lg font-mono text-xs font-semibold transition-colors"
        >
          <MapPin className="w-3.5 h-3.5" />
          Set as Target
        </button>
      </div>
    </div>
  );
}
