"use client";

import React from "react";
import { MarsCoordinate, formatMarsCoordinate, normalizeLongitude360, normalizeLongitude180 } from "@/lib/mars-coordinates";
import { getMarsElevation, analyzeTerrain } from "@/lib/mola-data";
import { MapPin, Mountain, TrendingUp, Sun, Database, Compass } from "lucide-react";

interface BottomBarProps {
  hoverCoordinate: MarsCoordinate | null;
  selectedCoordinate: MarsCoordinate | null;
  activeDatasetName?: string;
}

export default function BottomBar({
  hoverCoordinate,
  selectedCoordinate,
  activeDatasetName = "MGS MOLA MEGDR (128 ppd) / USGS Astrogeology",
}: BottomBarProps) {
  const displayCoord = hoverCoordinate || selectedCoordinate;
  const analysis = displayCoord ? analyzeTerrain(displayCoord) : null;

  return (
    <footer className="h-8 bg-[#0a0d14]/98 backdrop-blur-md border-t border-[#232d3f] px-3 sm:px-4 flex items-center justify-between z-30 text-[11px] font-mono text-gray-400 select-none">
      {/* Left: NASA JPL Attribution */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white text-[10px] tracking-wider">NASA / JPL-Caltech</span>
          <span className="text-gray-600 hidden sm:inline">|</span>
          <span className="text-gray-400 hidden sm:inline text-[10px]">Solar System Treks</span>
        </div>
      </div>

      {/* Center: Real-Time Telemetry Readout */}
      <div className="flex items-center gap-4 truncate mx-2">
        {displayCoord && analysis ? (
          <>
            <div className="flex items-center gap-1.5 text-gray-200">
              <MapPin className="w-3.5 h-3.5 text-mars-500" />
              <span>
                {Math.abs(displayCoord.lat).toFixed(3)}° {displayCoord.lat >= 0 ? "N" : "S"},{" "}
                {Math.abs(normalizeLongitude180(displayCoord.lng)).toFixed(3)}° {normalizeLongitude180(displayCoord.lng) >= 0 ? "E" : "W"}
                <span className="text-gray-500 hidden md:inline"> ({normalizeLongitude360(displayCoord.lng).toFixed(3)}° E)</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-white">
              <Mountain className="w-3.5 h-3.5 text-telemetry-cyan" />
              <span className="font-bold">
                {analysis.elevationMeters > 0 ? `+${analysis.elevationMeters}` : analysis.elevationMeters} m
              </span>
              <span className="text-gray-500 hidden lg:inline text-[9px]">(Areoid)</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-yellow-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Slope: {analysis.slopeDegrees}° ({analysis.difficulty})</span>
            </div>
          </>
        ) : (
          <div className="text-gray-500 italic flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-mars-500/60" />
            Hover or click surface to inspect MOLA topography and coordinates.
          </div>
        )}
      </div>

      {/* Right: Projection & Solar Parameters */}
      <div className="hidden lg:flex items-center gap-3 text-[10px] shrink-0">
        <div className="flex items-center gap-1 text-gray-400">
          <Sun className="w-3 h-3 text-amber-400" />
          <span>Ls: 142.4°</span>
        </div>
        <span className="text-gray-600">|</span>
        <div className="text-emerald-400 font-bold">
          DATUM: Martian Areoid (0m)
        </div>
        <span className="text-gray-600">|</span>
        <div className="text-gray-400 font-mono">
          IAU EPSG:4326
        </div>
      </div>
    </footer>
  );
}
