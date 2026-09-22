"use client";

import React, { useState } from "react";
import { RouteResult, RouteWaypoint } from "@/lib/pathfinding";
import { Mountain, TrendingUp, X, Activity, AlertTriangle } from "lucide-react";

interface ElevationChartModalProps {
  route: RouteResult | null;
  onClose: () => void;
}

export default function ElevationChartModal({ route, onClose }: ElevationChartModalProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!route || route.waypoints.length < 2) return null;

  const waypoints = route.waypoints;
  const totalDist = route.totalDistanceKm;

  // Chart dimensions
  const svgWidth = 800;
  const svgHeight = 280;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Min and max elevation bounds with padding
  const minElev = route.minElevationMeters - 30;
  const maxElev = route.maxElevationMeters + 30;
  const elevSpan = Math.max(1, maxElev - minElev);

  // Coordinate transformation helpers
  const getX = (distKm: number) => padding.left + (distKm / Math.max(0.1, totalDist)) * plotWidth;
  const getY = (elevM: number) => padding.top + plotHeight - ((elevM - minElev) / elevSpan) * plotHeight;

  // Build SVG path
  const points = waypoints.map((wp) => `${getX(wp.cumulativeDistanceKm)},${getY(wp.elevationMeters)}`);
  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${getX(totalDist)},${padding.top + plotHeight} L ${getX(0)},${padding.top + plotHeight} Z`;

  // Grid tick marks
  const numYTicks = 5;
  const yTicks = Array.from({ length: numYTicks }, (_, i) => {
    const val = minElev + (i / (numYTicks - 1)) * elevSpan;
    return { val: Math.round(val), y: getY(val) };
  });

  const numXTicks = 6;
  const xTicks = Array.from({ length: numXTicks }, (_, i) => {
    const dist = (i / (numXTicks - 1)) * totalDist;
    return { dist: Math.round(dist * 10) / 10, x: getX(dist) };
  });

  const activeHoverWp = hoveredIndex !== null ? waypoints[hoveredIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-surface-darker border border-surface-border rounded-2xl shadow-2xl p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-base font-bold text-white">
              <Mountain className="w-4 h-4 text-telemetry-cyan" />
              TOPOGRAPHIC ELEVATION PROFILE CROSS-SECTION
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Trajectory: {route.strategyName} ({route.totalDistanceKm} km, {route.totalDurationFormatted})
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Summary Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-dark/70 border border-surface-border p-3 rounded-xl mb-4 font-mono text-xs">
          <div>
            <span className="text-gray-400 block text-[11px]">Lowest Elevation:</span>
            <span className="text-white font-bold">{route.minElevationMeters.toLocaleString()} m</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[11px]">Peak Elevation:</span>
            <span className="text-white font-bold">{route.maxElevationMeters.toLocaleString()} m</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[11px]">Total Ascent / Descent:</span>
            <span className="text-emerald-400 font-bold">+{route.elevationGainMeters}m / -{route.elevationLossMeters}m</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[11px]">Average / Max Slope:</span>
            <span className="text-yellow-400 font-bold">{route.averageSlopeDeg}° / {route.maxSlopeDeg}°</span>
          </div>
        </div>

        {/* Interactive SVG Chart */}
        <div className="relative w-full overflow-x-auto bg-surface-darkest/90 border border-surface-border rounded-xl p-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f05a36" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f05a36" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {yTicks.map((t, idx) => (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={t.y}
                  x2={svgWidth - padding.right}
                  y2={t.y}
                  stroke="#263042"
                  strokeDasharray="3, 3"
                  strokeWidth="0.8"
                />
                <text
                  x={padding.left - 8}
                  y={t.y + 4}
                  fill="#718096"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {t.val > 0 ? `+${t.val}` : t.val}m
                </text>
              </g>
            ))}

            {/* Vertical Distance Grid lines */}
            {xTicks.map((t, idx) => (
              <g key={idx}>
                <line
                  x1={t.x}
                  y1={padding.top}
                  x2={t.x}
                  y2={svgHeight - padding.bottom}
                  stroke="#263042"
                  strokeDasharray="3, 3"
                  strokeWidth="0.8"
                />
                <text
                  x={t.x}
                  y={svgHeight - padding.bottom + 16}
                  fill="#718096"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {t.dist} km
                </text>
              </g>
            ))}

            {/* Elevation Fill Area */}
            <path d={areaPath} fill="url(#elevGradient)" />

            {/* Elevation Profile Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#f05a36"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Waypoint Interactive Circles */}
            {waypoints.map((wp, idx) => {
              const cx = getX(wp.cumulativeDistanceKm);
              const cy = getY(wp.elevationMeters);
              const isHovered = hoveredIndex === idx;

              // Color circle by slope difficulty
              const circleColor =
                wp.segmentSlopeDeg > 18 ? "#ef4444" :
                wp.segmentSlopeDeg > 12 ? "#f59e0b" :
                wp.segmentSlopeDeg > 6 ? "#38bdf8" : "#10b981";

              return (
                <g key={idx}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 3}
                    fill={circleColor}
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 2 : 1}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  />
                </g>
              );
            })}

            {/* Hover indicator vertical bar */}
            {activeHoverWp && (
              <line
                x1={getX(activeHoverWp.cumulativeDistanceKm)}
                y1={padding.top}
                x2={getX(activeHoverWp.cumulativeDistanceKm)}
                y2={svgHeight - padding.bottom}
                stroke="#00e5ff"
                strokeWidth="1.2"
                strokeDasharray="2, 2"
              />
            )}
          </svg>
        </div>

        {/* Hover Readout Tooltip Bar */}
        <div className="mt-3 bg-surface-dark border border-surface-border p-2.5 rounded-lg flex items-center justify-between font-mono text-xs text-gray-300">
          {activeHoverWp ? (
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-telemetry-cyan font-bold">
                Distance: {activeHoverWp.cumulativeDistanceKm} km
              </span>
              <span className="text-white font-bold">
                Elevation: {activeHoverWp.elevationMeters} m
              </span>
              <span className="text-yellow-400">
                Segment Slope: {activeHoverWp.segmentSlopeDeg}° ({activeHoverWp.difficulty})
              </span>
              <span className="text-gray-400">
                Est. Elapsed: {activeHoverWp.cumulativeTimeMinutes} mins
              </span>
            </div>
          ) : (
            <span className="text-gray-500 text-[11px]">
              Hover cursor across the graph points to inspect telemetry at any segment along the Martian traverse.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
