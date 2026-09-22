"use client";

import React from "react";
import { MarsCoordinate, formatMarsCoordinate } from "@/lib/mars-coordinates";
import { getMarsElevation, analyzeTerrain } from "@/lib/mola-data";
import { MapPin, Mountain, TrendingUp, Database, Sparkles } from "lucide-react";

interface BottomBarProps {
  hoverCoordinate: MarsCoordinate | null;
  selectedCoordinate: MarsCoordinate | null;
  activeDatasetName?: string;
}

export default function BottomBar({
  hoverCoordinate,
  selectedCoordinate,
  activeDatasetName = "NASA MGS MOLA MEGDR 128-ppd / USGS Astrogeology",
}: BottomBarProps) {
  const displayCoord = hoverCoordinate || selectedCoordinate;
  const analysis = displayCoord ? analyzeTerrain(displayCoord) : null;

  return (
    <footer className="h-9 bg-surface-darker/95 backdrop-blur-md border-t border-surface-border px-3 sm:px-5 flex items-center justify-between z-30 text-[11px] font-mono text-gray-400 select-none">
      {/* Coordinates and Elevation Telemetry */}
      <div className="flex items-center gap-4 truncate">
        {displayCoord && analysis ? (
          <>
            <div className="flex items-center gap-1.5 text-gray-200">
              <MapPin className="w-3.5 h-3.5 text-mars-500" />
              <span>{formatMarsCoordinate(displayCoord)}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-white">
              <Mountain className="w-3.5 h-3.5 text-telemetry-cyan" />
              <span>
                {analysis.elevationMeters > 0 ? `+${analysis.elevationMeters}` : analysis.elevationMeters} m
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-yellow-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Slope: {analysis.slopeDegrees}° ({analysis.difficulty})</span>
            </div>
          </>
        ) : (
          <div className="text-gray-500 italic flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-mars-500/60" />
            Hover or click map to inspect surface coordinates and MOLA topography datum.
          </div>
        )}
      </div>

      {/* Attribution & Status */}
      <div className="hidden lg:flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1 text-gray-400">
          <Database className="w-3 h-3 text-mars-500" />
          <span>DATA: {activeDatasetName}</span>
        </div>
        <span className="text-gray-600">|</span>
        <div className="text-emerald-400 font-bold">
          DATUM: Martian Areoid (0m)
        </div>
      </div>
    </footer>
  );
}
