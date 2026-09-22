"use client";

import React, { useState } from "react";
import { MarsCoordinate, marsDistanceKm, marsBearing, formatMarsCoordinate } from "@/lib/mars-coordinates";
import { RouteResult } from "@/lib/pathfinding";
import { 
  Wrench, 
  Mountain, 
  Ruler, 
  Sun, 
  X, 
  Compass, 
  Navigation,
  FileText,
  BarChart2
} from "lucide-react";

interface TrekToolsDrawerProps {
  activeRoute: RouteResult | null;
  sunAngleLs?: number;
  onSunAngleChange?: (ls: number) => void;
  onStartMapMeasure?: () => void;
  onFlyTo?: (coord: MarsCoordinate) => void;
  onOpenElevationChart: () => void;
  onOpenComparison: () => void;
  onOpenMissionBrief: () => void;
  onClose: () => void;
}

export default function TrekToolsDrawer({
  activeRoute,
  sunAngleLs = 60,
  onSunAngleChange,
  onStartMapMeasure,
  onFlyTo,
  onOpenElevationChart,
  onOpenComparison,
  onOpenMissionBrief,
  onClose,
}: TrekToolsDrawerProps) {
  const [measPointA, setMeasPointA] = useState<MarsCoordinate>({ lat: 18.444, lng: 77.451 });
  const [measPointB, setMeasPointB] = useState<MarsCoordinate>({ lat: 18.442, lng: 77.410 });
  const [jumpLat, setJumpLat] = useState<string>("18.444");
  const [jumpLng, setJumpLng] = useState<string>("77.451");

  const distKm = marsDistanceKm(measPointA, measPointB);
  const bearingDeg = marsBearing(measPointA, measPointB);

  // Martian Season based on Solar Longitude Ls
  const getMartianSeason = (ls: number) => {
    if (ls < 90) return "Northern Spring / Southern Autumn (L_s 0°–90°)";
    if (ls < 180) return "Northern Summer / Southern Winter (L_s 90°–180°)";
    if (ls < 270) return "Northern Autumn / Southern Spring (L_s 180°–270°)";
    return "Northern Winter / Southern Summer (L_s 270°–360°)";
  };

  const handleJump = () => {
    const lat = parseFloat(jumpLat);
    const lng = parseFloat(jumpLng);
    if (!isNaN(lat) && !isNaN(lng) && onFlyTo) {
      onFlyTo({ lat, lng });
    }
  };

  return (
    <div className="absolute top-16 left-16 z-30 w-80 sm:w-96 max-h-[calc(100vh-8rem)] bg-[#0e131d]/98 backdrop-blur-xl border border-[#232d3f] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left-3 duration-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#232d3f]">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-mars-500" />
          <h2 className="font-mono text-sm font-bold text-white tracking-wider uppercase">
            NASA Trek GIS Tools & Calculators
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#182030] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto p-4 space-y-4 text-xs font-mono">
        {/* Tool 1: Geodesic Distance & Measurement Tool */}
        <div className="bg-[#141a26] border border-[#232d3f] p-3.5 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between text-white font-bold">
            <span className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-yellow-400" />
              Distance & Azimuth Measurement
            </span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Measure great-circle distance between two points directly on the 2D map or compute coordinates.
          </p>
          {onStartMapMeasure && (
            <button
              onClick={() => {
                onStartMapMeasure();
                onClose();
              }}
              className="w-full bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-300 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Ruler className="w-3.5 h-3.5" />
              Start Interactive Map Measurement
            </button>
          )}
          <div className="grid grid-cols-2 gap-2 bg-[#0b0e14] p-2.5 rounded-lg border border-[#232d3f]">
            <div>
              <span className="text-[10px] text-gray-500 block">Preset Distance:</span>
              <span className="text-white font-bold text-xs">{distKm.toFixed(2)} km</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block">Azimuth Bearing:</span>
              <span className="text-telemetry-cyan font-bold text-xs">{bearingDeg.toFixed(1)}° True</span>
            </div>
          </div>
        </div>

        {/* Tool 2: Coordinates Jump */}
        <div className="bg-[#141a26] border border-[#232d3f] p-3.5 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <Compass className="w-4 h-4 text-emerald-400" />
            Jump to Planetary Coordinates
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Enter IAU latitude (-90° to +90°) and East longitude (0° to 360° or -180° to +180°).
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-gray-400 block mb-0.5">Latitude (°N/S):</span>
              <input
                type="number"
                value={jumpLat}
                onChange={(e) => setJumpLat(e.target.value)}
                className="w-full bg-[#0b0e14] border border-[#232d3f] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block mb-0.5">Longitude (°E):</span>
              <input
                type="number"
                value={jumpLng}
                onChange={(e) => setJumpLng(e.target.value)}
                className="w-full bg-[#0b0e14] border border-[#232d3f] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <button
            onClick={handleJump}
            className="w-full bg-[#1e2738] hover:bg-emerald-600 text-white font-bold py-1.5 rounded-lg transition-colors"
          >
            Jump Camera to Coordinates
          </button>
        </div>

        {/* Tool 3: Sun Angle & Seasonal Lighting Simulator */}
        <div className="bg-[#141a26] border border-[#232d3f] p-3.5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-white font-bold">
            <span className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              Sun Angle & Lighting Simulator
            </span>
            <span className="text-amber-300 font-mono text-xs font-bold">{sunAngleLs}° L_s</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Simulate solar illumination angle and seasonal shadows across the 3D Martian globe.
          </p>
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={sunAngleLs}
            onChange={(e) => onSunAngleChange && onSunAngleChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-[#0b0e14] rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="text-[10px] text-amber-400/90 font-mono bg-[#0b0e14] p-2 rounded-lg border border-[#232d3f]">
            {getMartianSeason(sunAngleLs)}
          </div>
        </div>

        {/* Tool 4: Elevation Profile Cross-Section */}
        <div className="bg-[#141a26] border border-[#232d3f] p-3.5 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <Mountain className="w-4 h-4 text-telemetry-cyan" />
            Elevation Profile Cross-Section
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Generate an interactive topographic elevation graph across the active EVA traversal traverse.
          </p>
          <button
            onClick={onOpenElevationChart}
            disabled={!activeRoute}
            className="w-full bg-[#1e2738] hover:bg-mars-600 disabled:opacity-40 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            {activeRoute ? "Plot Route Elevation Profile" : "Calculate Route First"}
          </button>
        </div>

        {/* Tool 5: Mission Operations & Route Comparison */}
        <div className="bg-[#141a26] border border-[#232d3f] p-3.5 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <Navigation className="w-4 h-4 text-mars-500" />
            Multi-Route Operational Comparison
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Compare candidate Safest, Fastest, and Science routes side-by-side with explainable metrics.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onOpenComparison}
              className="bg-[#1e2738] hover:bg-[#28354c] text-white py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors"
            >
              Compare Routes
            </button>
            <button
              onClick={onOpenMissionBrief}
              disabled={!activeRoute}
              className="bg-mars-600 hover:bg-mars-500 disabled:opacity-40 text-white py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Mission Brief
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
