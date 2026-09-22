"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  HelpCircle, 
  Compass, 
  Layers, 
  Navigation, 
  Mountain, 
  FileText,
  CheckCircle2,
  Lightbulb
} from "lucide-react";

interface TourStep {
  title: string;
  subtitle: string;
  message: string;
  targetTip: string;
  pose: "WAVE" | "POINT" | "THUMBS_UP" | "SCIENCE" | "ROCKET";
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Mars, Explorer!",
    subtitle: "Commander Ares • EVA Mission Guide",
    message: "Greetings! I'm Commander Ares, your planetary survival copilot. MARSCOPE transforms real NASA MOLA topography and MRO CRISM mineralogy into an interactive mission-planning workstation. Let's take a quick 1-minute tour of how to plan safe traverses on the Red Planet!",
    targetTip: "You can open or minimize this guide anytime using the astronaut icon in the bottom corner.",
    pose: "WAVE",
  },
  {
    title: "1. Select Exploration Region",
    subtitle: "Top Bar • Planetary Jump",
    message: "Use the Region selector at the top to explore 5 iconic Martian zones: Jezero Crater (Perseverance rover delta), Olympus Mons (21 km high volcano), Valles Marineris canyon (8 km deep rift), Gale Crater (Curiosity rover), and the South Polar Ice Cap.",
    targetTip: "Try switching regions from the top menu to load high-resolution MOLA elevation grids.",
    pose: "POINT",
  },
  {
    title: "2. Scientific Data Layers",
    subtitle: "Left Panel • NASA / USGS Layers",
    message: "Click 'Planetary Data Layers' on the left to toggle MOLA Slope Hazards (>12°), MRO CRISM mineral detections (ancient lakebed smectite clays & carbonates), and rover waypoints. These highlight hazardous scarps and high-value science targets.",
    targetTip: "Notice amber cells highlight slopes >12°, while red cells mark impassable cliffs >18°.",
    pose: "SCIENCE",
  },
  {
    title: "3. Location Telemetry Inspector",
    subtitle: "Click Anywhere on Mars",
    message: "Click anywhere on the map or select a landing site! MARSCOPE samples the MOLA digital elevation model, computing the exact elevation referenced to the 0m Martian Areoid datum, local slope angle, terrain roughness, and an explainable Science Value Score (0–100).",
    targetTip: "Click any landmark on Mars to reveal its verified NASA mission dataset provenance.",
    pose: "POINT",
  },
  {
    title: "4. Multi-Objective A* Route Planner",
    subtitle: "Right Panel • Autonomous EVA Solver",
    message: "Need to navigate between stations? Set a START and TARGET point. Our A* pathfinding engine solves across the Martian DEM with 3 distinct strategies: SAFEST (restricts slopes <14° to protect EVA suits), FASTEST (direct line-of-sight transit), and SCIENCE (diverts to sample CRISM astrobiology targets)!",
    targetTip: "Click 'Compare Routes' to view a side-by-side comparison matrix of distance, duration, and slope.",
    pose: "POINT",
  },
  {
    title: "5. 3D Google Earth Experience",
    subtitle: "Top Bar • 3D Globe & MOLA Terrain",
    message: "Click '3D Globe' to orbit a realistic Mars sphere set against the Milky Way celestial starfield, complete with an atmospheric Rayleigh scattering limb glow! Switch to '3D MOLA Terrain' to view true surface elevation relief with 1×, 2×, or 5× vertical exaggeration!",
    targetTip: "Click the 3D Compass Rose in the top right at any time to reorient your view to true North.",
    pose: "ROCKET",
  },
  {
    title: "6. Official NASA Mission Brief",
    subtitle: "Action Button • Flight Authorization",
    message: "Click 'Generate Official Mission Brief' to calculate PLSS Life-Support Consumables (oxygen consumption, 45-minute safety reserve margins, and battery stamina). The brief outputs contingency abort protocols, terrain risk matrices, and is exportable for live field operations!",
    targetTip: "You're now certified for Martian mission planning. Have a safe expedition!",
    pose: "THUMBS_UP",
  },
];

interface AstronautGuideProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function AstronautGuide({ isOpen, onToggle }: AstronautGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const step = TOUR_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onToggle();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <div className="fixed bottom-12 right-4 z-40 select-none">
      {/* Floating Astronaut Avatar Companion Pill (Always Accessible) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="group flex items-center gap-2.5 bg-surface-darker/95 hover:bg-surface-card border border-surface-border hover:border-mars-500/80 px-3.5 py-2 rounded-2xl shadow-2xl transition-all duration-200 backdrop-blur-md transform hover:-translate-y-1"
        >
          {/* Animated 2D Astronaut Face SVG */}
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-white flex items-center justify-center border border-gray-400 shadow-md overflow-hidden">
            {/* Visor */}
            <div className="w-6 h-4 bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 rounded-full shadow-inner border border-amber-300/60 flex items-center justify-center">
              <span className="w-2.5 h-1 bg-white/60 rounded-full rotate-[-20deg] blur-[0.5px]" />
            </div>
            {/* Helmet side ear pods */}
            <span className="absolute -left-1 w-2 h-3 bg-gray-400 rounded-full" />
            <span className="absolute -right-1 w-2 h-3 bg-gray-400 rounded-full" />
          </div>

          <div className="text-left font-mono">
            <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <span>Commander Ares</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-mars-400">EVA Mission Guide</div>
          </div>
        </button>
      )}

      {/* Guided Tour Speech Bubble & Dialog Modal */}
      {isOpen && (
        <div className="relative w-80 sm:w-96 bg-surface-darker/98 border border-surface-border rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Close / Minimize */}
          <div className="flex items-start justify-between border-b border-surface-border pb-3 mb-3">
            <div className="flex items-center gap-3">
              {/* 2D Vector Astronaut Avatar Pose */}
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-surface-dark via-surface-card to-surface-border flex items-center justify-center border border-surface-border shadow-inner shrink-0">
                <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Space Helmet */}
                  <circle cx="32" cy="24" r="16" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
                  {/* Gold Reflective Visor */}
                  <path
                    d="M20 23 C20 18, 44 18, 44 23 C44 30, 20 30, 20 23 Z"
                    fill="url(#visorGrad)"
                    stroke="#b45309"
                    strokeWidth="1"
                  />
                  {/* Visor Glare */}
                  <ellipse cx="27" cy="22" rx="4" ry="1.5" fill="#ffffff" opacity="0.75" transform="rotate(-15 27 22)" />
                  {/* Life Support Suit Torso */}
                  <path d="M18 42 C18 36, 46 36, 46 42 L48 64 L16 64 Z" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.2" />
                  {/* Chest Telemetry Pack */}
                  <rect x="25" y="42" width="14" height="12" rx="2" fill="#1f2937" stroke="#374151" strokeWidth="1" />
                  <circle cx="28" cy="46" r="1.5" fill="#10b981" />
                  <circle cx="32" cy="46" r="1.5" fill="#00e5ff" />
                  <circle cx="36" cy="46" r="1.5" fill="#ef4444" />
                  <rect x="27" y="49.5" width="10" height="2" rx="0.5" fill="#4b5563" />
                  {/* Mars Mission Patch */}
                  <circle cx="21" cy="48" r="2.5" fill="#dc3c17" />
                  <circle cx="21" cy="48" r="1.5" fill="#f97316" />

                  <defs>
                    <linearGradient id="visorGrad" x1="20" y1="18" x2="44" y2="30" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="60%" stopColor="#d97706" />
                      <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div>
                <h3 className="font-mono text-sm font-bold text-white leading-tight">
                  {step.title}
                </h3>
                <div className="text-[10px] font-mono text-mars-400 mt-0.5">
                  {step.subtitle}
                </div>
              </div>
            </div>

            <button
              onClick={onToggle}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-border transition-colors"
              title="Close Guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dialog Message */}
          <p className="text-xs text-gray-300 leading-relaxed mb-4 font-sans">
            {step.message}
          </p>

          {/* Actionable Explorer Tip */}
          <div className="flex items-start gap-2 bg-surface-dark/90 border border-surface-border/70 p-2.5 rounded-xl mb-4 text-[11px] font-mono text-gray-400">
            <Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-gray-300">{step.targetTip}</div>
          </div>

          {/* Progress Indicator & Navigation Controls */}
          <div className="flex items-center justify-between pt-1 border-t border-surface-border/60">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? "bg-mars-500 w-4"
                      : "bg-surface-border hover:bg-gray-500"
                  }`}
                  title={`Go to step ${idx + 1}`}
                />
              ))}
              <span className="text-[10px] font-mono text-gray-500 ml-1">
                {currentStepIndex + 1}/{TOUR_STEPS.length}
              </span>
            </div>

            {/* Next / Prev Buttons */}
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-dark hover:bg-surface-card border border-surface-border text-gray-300 font-mono text-xs flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-3.5 py-1.5 rounded-lg bg-mars-600 hover:bg-mars-500 text-white font-mono font-bold text-xs flex items-center gap-1 shadow-hud transition-colors"
              >
                {currentStepIndex === TOUR_STEPS.length - 1 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Finish Tour
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
