"use client";

import React, { useState } from "react";
import { REGIONAL_DEMS } from "@/lib/mola-data";
import { SCIENCE_POINTS, SciencePoint } from "@/lib/science-data";
import { MarsCoordinate } from "@/lib/mars-coordinates";
import { 
  Globe2, 
  Map as MapIcon, 
  Search, 
  MapPin, 
  Bot, 
  Database, 
  Sparkles,
  Layers,
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
  onSelectSearchResult: (point: SciencePoint) => void;
  onSelectPolar?: (pole: "NORTH" | "SOUTH") => void;
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
  onSelectSearchResult,
  onSelectPolar,
  hasActiveRoute,
}: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SciencePoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const q = val.toLowerCase();
    const matches = SCIENCE_POINTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
    setSearchResults(matches.slice(0, 6));
  };

  const selectResult = (pt: SciencePoint) => {
    setSearchQuery(pt.name);
    setIsSearching(false);
    onSelectSearchResult(pt);
  };

  return (
    <header className="h-14 bg-[#0a0d14]/98 backdrop-blur-md border-b border-[#232d3f] px-3 sm:px-5 flex items-center justify-between z-40 select-none">
      {/* Left: NASA Insignia & MARS TREK Branding */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* NASA Meatball Logo */}
          <div className="relative w-8 h-8 rounded-full bg-[#0b3d91] flex items-center justify-center shadow-md border border-[#105bd8]/40 overflow-hidden">
            <span className="font-sans font-black text-white text-[11px] tracking-tighter">NASA</span>
            <span className="absolute w-8 h-0.5 bg-[#fc3d21] rotate-[-28deg]" />
            <span className="absolute w-1.5 h-1.5 rounded-full bg-white top-1 right-2 opacity-80" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm sm:text-base font-black text-white tracking-widest uppercase">
                MARS TREK
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.2 bg-mars-500/20 text-mars-400 border border-mars-500/40 rounded font-semibold">
                MARSCOPE
              </span>
            </div>
            <div className="text-[10px] text-gray-400 hidden lg:block font-mono">
              NASA Solar System Treks | Planetary Mission Workstation
            </div>
          </div>
        </div>
      </div>

      {/* Center: NASA Trek Floating Search Bar */}
      <div className="relative w-64 sm:w-80 md:w-96 mx-2">
        <div className="relative flex items-center bg-[#141a26] border border-[#232d3f] rounded-xl px-2.5 py-1.5 focus-within:border-mars-500 transition-all shadow-inner">
          <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => { if (searchQuery) setIsSearching(true); }}
            placeholder="Search Mars (e.g. 'Jezero', 'Perseverance', 'Olympus Mons')..."
            className="w-full bg-transparent text-white font-mono text-xs focus:outline-none placeholder-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSearchResults([]); setIsSearching(false); }}
              className="text-gray-400 hover:text-white px-1.5 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {isSearching && searchResults.length > 0 && (
          <div className="absolute top-11 left-0 w-full bg-[#0e131d]/98 backdrop-blur-xl border border-[#232d3f] rounded-xl shadow-2xl overflow-hidden mt-1 font-mono text-xs z-50">
            {searchResults.map((res) => (
              <button
                key={res.id}
                onClick={() => selectResult(res)}
                className="w-full p-2.5 text-left hover:bg-surface-card flex items-start gap-2.5 border-b border-[#232d3f]/50 last:border-none transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-mars-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-white">{res.name}</div>
                  <div className="text-[10px] text-gray-400">{res.category.replace(/_/g, " ")} • Elev: {res.elevationMeters}m</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: NASA Trek Projections Switcher (2D / 3D / Polar) */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex bg-[#141a26] rounded-xl p-0.5 border border-[#232d3f]">
          <button
            onClick={() => onToggleViewMode("2D")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              viewMode === "2D"
                ? "bg-mars-600 text-white font-bold shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">2D Global</span>
            <span className="md:hidden">2D</span>
          </button>
          <button
            onClick={() => onToggleViewMode("3D")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              viewMode === "3D"
                ? "bg-mars-600 text-white font-bold shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">3D Globe</span>
            <span className="md:hidden">3D</span>
          </button>
          {onSelectPolar && (
            <>
              <button
                onClick={() => onSelectPolar("NORTH")}
                className="hidden 2xl:flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-mono text-gray-400 hover:text-white transition-colors"
                title="North Polar Stereographic Projection"
              >
                <span>❄ N. Polar</span>
              </button>
              <button
                onClick={() => onSelectPolar("SOUTH")}
                className="hidden 2xl:flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-mono text-gray-400 hover:text-white transition-colors"
                title="South Polar Stereographic Projection"
              >
                <span>❄ S. Polar</span>
              </button>
            </>
          )}
        </div>

        {/* Region Quick Selector */}
        <div className="hidden xl:flex items-center bg-[#141a26] border border-[#232d3f] rounded-xl px-2.5 py-1">
          <span className="text-[11px] font-mono text-gray-400 mr-2">REGION:</span>
          <select
            value={selectedRegionId}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer pr-1"
          >
            {REGIONAL_DEMS.map((dem) => (
              <option key={dem.id} value={dem.id} className="bg-[#0e131d] text-white">
                {dem.name}
              </option>
            ))}
          </select>
        </div>

        {/* Astronaut Guide Button */}
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 bg-gradient-to-r from-mars-700/80 to-mars-600/80 hover:from-mars-600 hover:to-mars-500 border border-mars-500/50 text-white px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold shadow-sm transition-all"
          title="Commander Ares • EVA Guided Tour"
        >
          <span className="text-sm">👨‍🚀</span>
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* Mission Brief Quick Access */}
        {hasActiveRoute && onOpenMissionBrief && (
          <button
            onClick={onOpenMissionBrief}
            className="flex items-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-400 text-white px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold shadow-sm transition-all animate-pulse"
            title="Generate Official Mission Brief"
          >
            <span>📋</span>
            <span className="hidden md:inline">Mission Brief</span>
          </button>
        )}

        {/* AI & Data Sources */}
        <button
          onClick={onOpenAskMarscope}
          className="hidden sm:flex items-center gap-1 bg-[#141a26] hover:bg-surface-card border border-[#232d3f] text-gray-200 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors"
          title="Ask MARSCOPE AI"
        >
          <Bot className="w-3.5 h-3.5 text-mars-400" />
        </button>

        <button
          onClick={onOpenDataSources}
          className="hidden sm:flex items-center gap-1 bg-[#141a26] hover:bg-surface-card border border-[#232d3f] text-gray-200 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors"
          title="NASA Planetary Data Sources"
        >
          <Database className="w-3.5 h-3.5 text-telemetry-cyan" />
        </button>
      </div>
    </header>
  );
}
