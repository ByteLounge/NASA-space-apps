"use client";

import React from "react";
import { 
  Layers, 
  Bookmark, 
  Wrench, 
  Navigation, 
  Database, 
  Bot, 
  HelpCircle,
  Eye,
  Sliders,
  Sparkles,
  Mountain
} from "lucide-react";

export type TrekActiveDrawer = "NONE" | "LAYERS" | "BOOKMARKS" | "TOOLS" | "PLANNER" | "SOURCES" | "AI";

interface TrekToolbarProps {
  activeDrawer: TrekActiveDrawer;
  onToggleDrawer: (drawer: TrekActiveDrawer) => void;
  onOpenGuide: () => void;
  hasActiveRoute: boolean;
}

export default function TrekToolbar({
  activeDrawer,
  onToggleDrawer,
  onOpenGuide,
  hasActiveRoute,
}: TrekToolbarProps) {
  const tools = [
    {
      id: "LAYERS" as TrekActiveDrawer,
      label: "Layers & Products",
      icon: Layers,
      badge: null,
    },
    {
      id: "BOOKMARKS" as TrekActiveDrawer,
      label: "Destinations & Landmarks",
      icon: Bookmark,
      badge: "25",
    },
    {
      id: "PLANNER" as TrekActiveDrawer,
      label: "EVA Mission Planner",
      icon: Navigation,
      badge: hasActiveRoute ? "Active" : null,
      highlight: true,
    },
    {
      id: "TOOLS" as TrekActiveDrawer,
      label: "GIS Tools & Profiles",
      icon: Wrench,
      badge: null,
    },
    {
      id: "AI" as TrekActiveDrawer,
      label: "Ask MARSCOPE",
      icon: Bot,
      badge: null,
    },
    {
      id: "SOURCES" as TrekActiveDrawer,
      label: "NASA Data Sources",
      icon: Database,
      badge: null,
    },
  ];

  return (
    <div className="absolute top-16 left-3 z-30 flex flex-col items-center gap-1.5 bg-[#0e131d]/95 backdrop-blur-md border border-[#232d3f] rounded-2xl p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.7)] select-none">
      {tools.map(({ id, label, icon: Icon, badge, highlight }) => {
        const isActive = activeDrawer === id;
        return (
          <div key={id} className="relative group">
            <button
              onClick={() => onToggleDrawer(isActive ? "NONE" : id)}
              aria-label={label}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? "bg-mars-600 text-white shadow-[0_0_15px_rgba(240,90,54,0.5)] border border-mars-400"
                  : highlight
                  ? "bg-[#182030] text-mars-400 border border-mars-500/40 hover:bg-mars-950/40 hover:text-white"
                  : "bg-transparent text-gray-400 hover:text-white hover:bg-[#182030]"
              }`}
            >
              <Icon className="w-5 h-5" />
              {badge && (
                <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-telemetry-cyan text-black font-mono text-[9px] font-bold rounded-full shadow">
                  {badge}
                </span>
              )}
            </button>

            {/* NASA Trek Style Tooltip on Hover */}
            <div className="absolute left-12 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
              <div className="bg-[#0b0e14] border border-[#232d3f] text-gray-200 text-xs font-mono px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap">
                {label}
              </div>
            </div>
          </div>
        );
      })}

      <div className="w-6 h-px bg-[#232d3f] my-1" />

      {/* Guide Button */}
      <div className="relative group">
        <button
          onClick={onOpenGuide}
          aria-label="EVA Guided Tour"
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600/30 to-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-white hover:bg-amber-600/40 flex items-center justify-center transition-all"
        >
          <span className="text-base">👨‍🚀</span>
        </button>

        <div className="absolute left-12 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
          <div className="bg-[#0b0e14] border border-[#232d3f] text-amber-300 text-xs font-mono px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap">
            Commander Ares • Guided Tour
          </div>
        </div>
      </div>
    </div>
  );
}
