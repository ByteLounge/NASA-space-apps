"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface MarsLoadingScreenProps {
  onLoaded?: () => void;
}

export default function MarsLoadingScreen({ onLoaded }: MarsLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("INITIALIZING MOLA TOPOGRAPHIC DATA...");
  const [isFading, setIsFading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const steps = [
      { p: 25, text: "CALIBRATING MGS MOLA MEGDR ELEVATION GRIDS (128 PPD)..." },
      { p: 55, text: "SYNCHRONIZING MRO CRISM MINERALOGICAL SPECTROSCOPY..." },
      { p: 85, text: "COMPUTING MULTI-OBJECTIVE A* TRAVERSAL MATRICES..." },
      { p: 100, text: "MARSCOPE MISSION WORKSTATION CERTIFIED & READY." },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setStatusText(steps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsFading(true);
          setTimeout(() => {
            setIsDismissed(true);
            if (onLoaded) onLoaded();
          }, 600);
        }, 400);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [onLoaded]);

  if (isDismissed) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-darkest select-none transition-opacity duration-700 ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      }`}
    >
      {/* Deep Space Starfield Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75" />
        <div className="absolute top-2/3 left-1/5 w-1 h-1 bg-cyan-300 rounded-full animate-pulse" />
        <div className="absolute top-1/5 right-1/4 w-2 h-2 bg-amber-200 rounded-full animate-ping opacity-50" />
        <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
      </div>

      {/* Central 2D Mars & Revolving 2D Rocket Animation */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center mb-8">
        {/* Orbital Trajectory Ellipse Ring */}
        <div className="absolute w-72 h-36 sm:w-80 sm:h-40 border border-mars-500/30 rounded-[100%] rotate-[-22deg] pointer-events-none shadow-[0_0_20px_rgba(240,90,54,0.15)]" />

        {/* Realistic 2D Vector Planet Mars */}
        <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-[#98270e] via-[#dc3c17] to-[#f05a36] shadow-[0_0_50px_rgba(240,90,54,0.4)] overflow-hidden flex items-center justify-center border border-mars-400/40 z-10">
          {/* Planetary Albedo Formations & Craters */}
          <div className="absolute -top-3 left-4 w-24 h-8 bg-white/80 rounded-full blur-[1px] opacity-80" /> {/* North Polar Cap */}
          <div className="absolute -bottom-2 right-6 w-16 h-6 bg-white/70 rounded-full blur-[1px] opacity-75" /> {/* South Polar Cap */}
          <div className="absolute top-12 left-2 w-20 h-10 bg-[#7c2512]/70 rounded-full blur-[2px]" /> {/* Syrtis Major */}
          <div className="absolute top-20 right-3 w-28 h-5 bg-[#591406]/80 rotate-[-12deg] rounded-full blur-[1px]" /> {/* Valles Marineris */}
          <div className="absolute bottom-8 left-8 w-14 h-12 bg-[#591406]/60 rounded-full blur-[2px]" /> {/* Hellas Basin */}
          <div className="absolute top-8 right-10 w-6 h-6 rounded-full bg-[#f97316]/50 border border-amber-300/40" /> {/* Olympus Mons */}

          {/* Atmospheric Rim Glow */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(255,200,180,0.6)]" />
        </div>

        {/* Revolving 2D Rocket Orbiting Around Mars */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center animate-mars-orbit">
          <div className="relative -translate-x-36 -translate-y-16 rotate-[75deg] scale-90 sm:scale-100">
            {/* 2D Vector Rocket SVG */}
            <svg
              viewBox="0 0 64 64"
              className="w-12 h-12 drop-shadow-[0_0_12px_rgba(0,229,255,0.8)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Rocket Exhaust Flame */}
              <path
                d="M32 50 C29 55, 31 62, 32 64 C33 62, 35 55, 32 50 Z"
                fill="#ff7849"
                className="animate-pulse"
              />
              <path
                d="M32 50 C30.5 53, 31.5 58, 32 60 C32.5 58, 33.5 53, 32 50 Z"
                fill="#fde047"
              />
              {/* Rocket Body */}
              <path
                d="M32 6 C26 18, 24 38, 24 48 L40 48 C40 38, 38 18, 32 6 Z"
                fill="#f3f4f6"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              {/* Nose Cone Red Cap */}
              <path
                d="M32 6 C29 14, 27 20, 27 24 L37 24 C37 20, 35 14, 32 6 Z"
                fill="#dc3c17"
              />
              {/* Cockpit Porthole Window */}
              <circle cx="32" cy="30" r="4.5" fill="#00e5ff" stroke="#1f2937" strokeWidth="1.2" />
              <circle cx="33.5" cy="28.5" r="1.2" fill="#ffffff" />
              {/* Fin Wings */}
              <path d="M24 40 L16 48 L24 47 Z" fill="#b92c0c" stroke="#98270e" strokeWidth="1" />
              <path d="M40 40 L48 48 L40 47 Z" fill="#b92c0c" stroke="#98270e" strokeWidth="1" />
              <path d="M30 45 L32 49 L34 45 Z" fill="#4b5563" />
            </svg>
          </div>
        </div>
      </div>

      {/* Brand & Mission Titles */}
      <div className="text-center z-10 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-mars-950/60 border border-mars-500/40 rounded-full text-[11px] font-mono text-mars-400 font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          NASA SPACE APPS CHALLENGE 2026
        </div>
        <h1 className="font-mono text-2xl sm:text-3xl font-black text-white tracking-widest mb-1">
          MARSCOPE
        </h1>
        <h2 className="font-mono text-xs text-mars-400 font-semibold tracking-wider uppercase mb-6">
          INTERPLANETARY SURVIVAL GUIDE: MARTIAN MAP
        </h2>

        {/* Telemetry Progress Bar */}
        <div className="w-64 sm:w-80 max-w-full mx-auto">
          <div className="h-1.5 w-full bg-surface-dark rounded-full overflow-hidden border border-surface-border mb-2.5">
            <div
              className="h-full bg-gradient-to-r from-mars-600 via-mars-400 to-telemetry-cyan transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(240,90,54,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span className="truncate mr-2">{statusText}</span>
            <span className="font-bold text-white">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Inline styles for 3D orbital animation */}
      <style jsx>{`
        @keyframes marsOrbit {
          0% {
            transform: rotate(0deg) scale(0.95);
            z-index: 5;
          }
          25% {
            transform: rotate(90deg) scale(1.15);
            z-index: 25;
          }
          50% {
            transform: rotate(180deg) scale(1.05);
            z-index: 25;
          }
          75% {
            transform: rotate(270deg) scale(0.8);
            z-index: 5;
          }
          100% {
            transform: rotate(360deg) scale(0.95);
            z-index: 5;
          }
        }
        .animate-mars-orbit {
          animation: marsOrbit 5s linear infinite;
        }
      `}</style>
    </div>
  );
}
