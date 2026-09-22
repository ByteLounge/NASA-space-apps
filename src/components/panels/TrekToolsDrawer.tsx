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
  onOpenElevationChart: () => void;
  onOpenComparison: () => void;
  onOpenMissionBrief: () => void;
  onClose: () => void;
}

export default function TrekToolsDrawer({
  activeRoute,
  onOpenElevationChart,
  onOpenComparison,
  onOpenMissionBrief,
  onClose,
}: TrekToolsDrawerProps) {
  const [measPointA, setMeasPointA] = useState<MarsCoordinate>({ lat: 18.444, lng: 77.451 });
  const [measPointB, setMeasPointB] = useState<MarsCoordinate>({ lat: 18.442, lng: 77.410 });

  const distKm = marsDistanceKm(measPointA, measPointB);
  const bearingDeg = marsBearing(measPointA, measPointB);

  return (
    <div className="absolute top-16 left-16 z-30 w-80 sm:w-96 max-h-[calc(100vh-8rem)] bg-[#0e131d]/98 backdrop-blur-xl border border-[#232d3f] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left-3 duration-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#232d3f]">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-mars-500" />
          <h2 className="font-mono text-sm font-bold text-white tracking-wider uppercase">
            NASA Trek GIS Tools
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
        {/* Tool 1: Elevation Profile Cross-Section */}
        <div className="bg-[#141a26] border border-[#232d3f] p-3.5 rounded-xl">
          <div className="flex items-center gap-2 text-white font-bold mb-1">
            <Mountain className="w-4 h-4 text-telemetry-cyan" />
            Elevation Profile Analysis
          </div>
          <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
            Generate an interactive topographic elevation cross-section graph across any Martian traverse path.
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

        {/* Tool 2: Geodesic Distance & Azimuth Tool */}
        <div className="bg-[#141a26] border border-[#232d3f] p-3.5 rounded-xl space-y-2.5">
          <div className="flex items-center gap-2 text-white font-bold">
            <Ruler className="w-4 h-4 text-yellow-400" />
            Martian Great-Circle Measurement
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Haversine geodesic distance computed with Mars mean volumetric radius (R_M = 3,389.5 km).
          </p>
          <div className="grid grid-cols-2 gap-2 bg-[#0b0e14] p-2.5 rounded-lg border border-[#232d3f]">
            <div>
              <span className="text-[10px] text-gray-500 block">Great-Circle Distance:</span>
              <span className="text-white font-bold text-sm">{distKm.toFixed(2)} km</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block">Azimuth Bearing:</span>
              <span className="text-telemetry-cyan font-bold text-sm">{bearingDeg.toFixed(1)}° True</span>
            </div>
          </div>
        </div>

        {/* Tool 3: Mission Operations & Route Comparison */}
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

        {/* Tool 4: Solar Sub-solar Point & Illumination */}
        <div className="bg-[#141a26] border border-[#232d3f] p-3 rounded-xl flex items-start gap-2.5">
          <Sun className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-gray-300 leading-relaxed">
            <span className="font-bold text-white block mb-0.5">Solar Subsolar Point:</span>
            Mars Solar Longitude ($L_s = 142.4^\circ$). Northern hemisphere late summer illumination active across Tharsis and Elysium.
          </div>
        </div>
      </div>
    </div>
  );
}
