"use client";

import React, { useState } from "react";
import { SCIENCE_POINTS, SciencePoint, FeatureCategory } from "@/lib/science-data";
import { MarsCoordinate, formatMarsCoordinate } from "@/lib/mars-coordinates";
import { 
  Bookmark, 
  MapPin, 
  Search, 
  X, 
  Mountain, 
  Sparkles, 
  Flame, 
  AlertTriangle,
  ChevronRight
} from "lucide-react";

interface TrekBookmarksDrawerProps {
  onSelectFeature: (feature: SciencePoint) => void;
  onFlyTo: (coord: MarsCoordinate) => void;
  onClose: () => void;
}

export default function TrekBookmarksDrawer({
  onSelectFeature,
  onFlyTo,
  onClose,
}: TrekBookmarksDrawerProps) {
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterQuery, setFilterQuery] = useState<string>("");

  const categories = [
    { id: "ALL", label: "All Destinations" },
    { id: "LANDING_SITE", label: "Rover Landing Sites" },
    { id: "SCIENCE_TARGET", label: "Science Targets" },
    { id: "GEOLOGY_UNIT", label: "Volcanoes & Calderas" },
    { id: "MINERAL_CRISM", label: "CRISM Minerals" },
  ];

  const filteredPoints = SCIENCE_POINTS.filter((pt) => {
    const matchesCategory = filterCategory === "ALL" || pt.category === filterCategory;
    const matchesQuery = !filterQuery || pt.name.toLowerCase().includes(filterQuery.toLowerCase()) || pt.description.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const getCategoryBadge = (cat: FeatureCategory) => {
    switch (cat) {
      case "LANDING_SITE":
        return <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-telemetry-cyan border border-cyan-800/40">LANDING SITE</span>;
      case "SCIENCE_TARGET":
        return <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">SCIENCE</span>;
      case "GEOLOGY_UNIT":
        return <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">VOLCANO / GEOLOGY</span>;
      case "MINERAL_CRISM":
        return <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">CRISM MINERAL</span>;
      default:
        return <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950/60 text-red-400 border border-red-800/40">HAZARD</span>;
    }
  };

  return (
    <div className="absolute top-16 left-16 z-30 w-80 sm:w-96 max-h-[calc(100vh-8rem)] bg-[#0e131d]/98 backdrop-blur-xl border border-[#232d3f] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left-3 duration-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#232d3f]">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-mars-500" />
          <h2 className="font-mono text-sm font-bold text-white tracking-wider uppercase">
            NASA Mars Destinations ({filteredPoints.length})
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#182030] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-[#232d3f]/60">
        <div className="relative flex items-center bg-[#141a26] border border-[#232d3f] rounded-xl px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter destinations (e.g. 'Curiosity', 'Olympus')..."
            className="w-full bg-transparent text-white font-mono text-xs focus:outline-none placeholder-gray-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCategory(c.id)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono whitespace-nowrap border transition-colors ${
                filterCategory === c.id
                  ? "bg-mars-600 text-white border-mars-400 font-bold"
                  : "bg-[#141a26] text-gray-400 border-[#232d3f] hover:text-gray-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Destinations List */}
      <div className="overflow-y-auto p-3 space-y-2 text-xs font-mono">
        {filteredPoints.map((pt) => (
          <button
            key={pt.id}
            onClick={() => {
              onSelectFeature(pt);
              onFlyTo({ lat: pt.lat, lng: pt.lng });
            }}
            className="w-full text-left p-3 rounded-xl bg-[#141a26]/80 hover:bg-surface-card border border-[#232d3f] hover:border-mars-500/60 transition-all group flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                {getCategoryBadge(pt.category)}
                <span className="text-[10px] text-gray-400">Elev: {pt.elevationMeters > 0 ? `+${pt.elevationMeters}` : pt.elevationMeters}m</span>
              </div>
              <div className="font-bold text-white text-xs group-hover:text-mars-400 transition-colors">
                {pt.name}
              </div>
              <div className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                {pt.description}
              </div>
              <div className="text-[9px] text-gray-500 mt-1">
                {formatMarsCoordinate({ lat: pt.lat, lng: pt.lng })}
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-mars-400 group-hover:translate-x-0.5 transition-all mt-3 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
