"use client";

import React from "react";
import { Compass, Navigation, Globe2, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

interface LandingHeroProps {
  onStartExploring: () => void;
  onOpenMissionPlanner: () => void;
}

export default function LandingHero({
  onStartExploring,
  onOpenMissionPlanner,
}: LandingHeroProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-surface-darkest/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative max-w-2xl w-full bg-surface-darker/95 border border-surface-border rounded-3xl shadow-2xl p-6 sm:p-10 text-center overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-mars-600/20 blur-3xl rounded-full pointer-events-none" />

        {/* Mars Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-mars-950/60 border border-mars-500/40 rounded-full text-xs font-mono text-mars-400 font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-mars-500 animate-pulse" />
          NASA SPACE APPS CHALLENGE 2026
        </div>

        {/* Main Hero Titles */}
        <h1 className="font-mono text-3xl sm:text-5xl font-black text-white tracking-wider mb-2">
          MARSCOPE
        </h1>
        <h2 className="font-mono text-sm sm:text-base font-semibold text-mars-400 tracking-widest uppercase mb-4">
          INTERPLANETARY SURVIVAL GUIDE: MARTIAN MAP
        </h2>

        <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl mx-auto mb-8 font-sans">
          Transform authoritative NASA MOLA elevation, MRO CRISM mineralogy, and HiRISE imagery into an interactive mission-planning and EVA route analysis workstation for future human Mars explorers.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
          <button
            onClick={onStartExploring}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-mars-600 to-mars-500 hover:from-mars-500 hover:to-mars-600 text-white font-mono font-bold text-sm px-6 py-3 rounded-xl shadow-hud transition-all transform hover:-translate-y-0.5"
          >
            <Globe2 className="w-4 h-4" />
            EXPLORE MARS
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenMissionPlanner}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-surface-dark hover:bg-surface-card border border-surface-border text-gray-200 font-mono font-bold text-sm px-6 py-3 rounded-xl transition-all hover:border-gray-500"
          >
            <Navigation className="w-4 h-4 text-mars-400" />
            MISSION PLANNER
          </button>
        </div>

        {/* Supporting Scientific Badges */}
        <div className="border-t border-surface-border/60 pt-6 grid grid-cols-3 gap-2 text-left font-mono text-[11px] text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>MGS MOLA DEM (463m)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>MRO CRISM Spectroscopy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-telemetry-cyan" />
            <span>A* Traversal Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
