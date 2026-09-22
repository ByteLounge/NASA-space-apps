"use client";

import React, { useState } from "react";
import { RouteResult } from "@/lib/pathfinding";
import { 
  MissionParameters, 
  generateMissionBrief, 
  MissionBrief 
} from "@/lib/mission-brief";
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Printer, 
  Copy, 
  Check, 
  X, 
  ShieldAlert, 
  User, 
  Clock, 
  Zap, 
  Compass,
  Download
} from "lucide-react";

interface MissionBriefModalProps {
  route: RouteResult | null;
  onClose: () => void;
}

export default function MissionBriefModal({ route, onClose }: MissionBriefModalProps) {
  const [copied, setCopied] = useState(false);
  const [params, setParams] = useState<MissionParameters>({
    missionName: "Ares-V Planetary Reconnaissance",
    crewSize: 2,
    maxEvaHours: 5.0,
    maxDistanceKm: 12.0,
    primaryObjective: "Astrobiological Sedimentary Delta Sampling & Geomorphology Survey",
    traversalMode: "SUITED_FOOT",
  });

  if (!route) return null;

  const brief: MissionBrief = generateMissionBrief(params, route);

  const handleCopyText = () => {
    const text = `
===================================================================
MARSCOPE OPERATIONAL EVA MISSION BRIEF
===================================================================
MISSION: ${brief.missionName}
TIMESTAMP: ${brief.timestamp}
OPERATIONAL STATUS: ${brief.operationalStatus}
SUMMARY: ${brief.operationalSummary}

-------------------------------------------------------------------
TRAVERSAL PARAMETERS
-------------------------------------------------------------------
CREW COMPLEMENT: ${brief.crewSize} Astronauts (${brief.traversalMode})
OBJECTIVE: ${brief.objective}
START: ${brief.startLocation}
DESTINATION: ${brief.destinationLocation}
ROUTE DISTANCE: ${brief.totalDistanceKm} km
ESTIMATED EVA TIME: ${brief.estimatedDuration}
TERRAIN DIFFICULTY: ${brief.terrainDifficulty} (Max Slope: ${brief.maxSlope}, Avg: ${brief.averageSlope})
SCIENCE VALUE SCORE: ${brief.scienceValueScore}/100 (${brief.scienceRating})

-------------------------------------------------------------------
PLSS LIFE SUPPORT CONSUMABLES ESTIMATE
-------------------------------------------------------------------
OXYGEN CONSUMPTION: ${brief.plssConsumables.oxygenConsumptionLiters} L
RESERVE MARGIN: ${brief.plssConsumables.oxygenMarginMinutes} minutes
BATTERY RESERVE: ${brief.plssConsumables.batteryReservePercent}%
CONSUMABLE STATUS: ${brief.plssConsumables.status} (${brief.plssConsumables.reason})

-------------------------------------------------------------------
IDENTIFIED RISKS & MITIGATION
-------------------------------------------------------------------
${brief.keyRisks.map((r, i) => `[RISK ${i+1}] ${r}`).join('\n')}

CONTINGENCY PROTOCOL:
${brief.contingencyProtocol}

-------------------------------------------------------------------
SCIENTIFIC RECOMMENDATIONS
-------------------------------------------------------------------
${brief.scientificRecommendations.map((s, i) => `• ${s}`).join('\n')}

-------------------------------------------------------------------
DATA PROVENANCE & ATTRIBUTION
-------------------------------------------------------------------
${brief.dataAttribution.join('\n')}

DISCLAIMER:
${brief.disclaimer}
===================================================================
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const statusBadge =
    brief.operationalStatus === "GO" ? (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 font-mono font-bold text-xs rounded-full">
        <CheckCircle2 className="w-4 h-4" /> STATUS: GO (FLIGHT CERTIFIED)
      </div>
    ) : brief.operationalStatus === "CAUTION" ? (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-500/50 text-amber-400 font-mono font-bold text-xs rounded-full">
        <AlertTriangle className="w-4 h-4" /> STATUS: CAUTION (OPERATIONAL CONSTRAINTS)
      </div>
    ) : (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/60 border border-red-500/50 text-red-400 font-mono font-bold text-xs rounded-full">
        <XCircle className="w-4 h-4" /> STATUS: NO-GO (FLIGHT ENVELOPE EXCEEDED)
      </div>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-surface-darker border border-surface-border rounded-2xl shadow-2xl p-5 sm:p-7 max-h-[94vh] overflow-y-auto print:p-0 print:border-none print:bg-white print:text-black">
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b border-surface-border pb-4 mb-5 print:hidden">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-mars-500 animate-pulse" />
              <h2 className="font-mono text-lg font-bold text-white tracking-wide">
                MARSCOPE EVA OPERATIONAL MISSION BRIEF
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Automated mission authorization document synthesizing NASA orbital datasets and MARSCOPE terrain calculations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 bg-surface-dark hover:bg-surface-card border border-surface-border text-gray-300 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Text"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-surface-dark hover:bg-surface-card border border-surface-border text-gray-300 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-border transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mission Parameter Controls (Interactive Tuning) */}
        <div className="bg-surface-dark/90 border border-surface-border rounded-xl p-4 mb-5 print:hidden">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-3">
            MISSION OPERATIONAL CONSTRAINTS (CONFIGURABLE)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-gray-400 text-[11px] block mb-1">Mission Identifier:</label>
              <input
                type="text"
                value={params.missionName}
                onChange={(e) => setParams({ ...params, missionName: e.target.value })}
                className="w-full bg-surface-darkest border border-surface-border rounded-md px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-mars-500"
              />
            </div>

            <div>
              <label className="text-gray-400 text-[11px] block mb-1">Crew Size:</label>
              <select
                value={params.crewSize}
                onChange={(e) => setParams({ ...params, crewSize: Number(e.target.value) })}
                className="w-full bg-surface-darkest border border-surface-border rounded-md px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-mars-500"
              >
                <option value={2}>2 Astronauts (Standard Buddy)</option>
                <option value={3}>3 Astronauts (Expanded)</option>
                <option value={4}>4 Astronauts (Full EVA Squad)</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-[11px] block mb-1">Max EVA Window (Hours):</label>
              <select
                value={params.maxEvaHours}
                onChange={(e) => setParams({ ...params, maxEvaHours: Number(e.target.value) })}
                className="w-full bg-surface-darkest border border-surface-border rounded-md px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-mars-500"
              >
                <option value={3}>3.0 Hours (Short Sortie)</option>
                <option value={4}>4.0 Hours (Nominal EVA)</option>
                <option value={5}>5.0 Hours (Extended EVA)</option>
                <option value={7}>7.0 Hours (Max PLSS Limit)</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-[11px] block mb-1">Traversal Mode:</label>
              <select
                value={params.traversalMode}
                onChange={(e) => setParams({ ...params, traversalMode: e.target.value as any })}
                className="w-full bg-surface-darkest border border-surface-border rounded-md px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-mars-500"
              >
                <option value="SUITED_FOOT">Pressurized Suited Foot</option>
                <option value="UNPRESSURIZED_ROVER">Unpressurized Rover</option>
                <option value="PRESSURIZED_ROVER">Pressurized Rover Cabin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-dark/70 border border-surface-border p-3.5 rounded-xl mb-5">
          <div className="flex items-center gap-3">
            {statusBadge}
            <span className="text-xs text-gray-300">{brief.operationalSummary}</span>
          </div>
          <div className="text-[11px] font-mono text-gray-400">
            STRATEGY: <span className="text-white font-bold">{route.strategyName}</span>
          </div>
        </div>

        {/* Briefing Content Grid */}
        <div className="space-y-4 text-xs font-mono">
          {/* Section 1: Flight Traversal Parameters */}
          <div className="bg-surface-dark/50 border border-surface-border rounded-xl p-4">
            <h3 className="text-xs font-bold text-mars-400 border-b border-surface-border/60 pb-1.5 mb-3 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              1. OPERATIONAL TRAVERSAL TELEMETRY
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="text-gray-400 block">Total Distance:</span>
                <span className="text-white font-bold text-sm">{brief.totalDistanceKm} km</span>
              </div>
              <div>
                <span className="text-gray-400 block">Est. Duration:</span>
                <span className="text-white font-bold text-sm">{brief.estimatedDuration}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Terrain Difficulty:</span>
                <span className="text-yellow-400 font-bold text-sm">{brief.terrainDifficulty}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Science Score:</span>
                <span className="text-purple-400 font-bold text-sm">{brief.scienceValueScore}/100 ({brief.scienceRating})</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2 border-t border-surface-border/40 text-gray-300 text-[11px]">
              <div><span className="text-gray-400">Departure:</span> {brief.startLocation}</div>
              <div><span className="text-gray-400">Target Station:</span> {brief.destinationLocation}</div>
            </div>
          </div>

          {/* Section 2: PLSS Life Support Consumables */}
          <div className="bg-surface-dark/50 border border-surface-border rounded-xl p-4">
            <h3 className="text-xs font-bold text-telemetry-cyan border-b border-surface-border/60 pb-1.5 mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              2. PLSS CONSUMABLES & LIFE SUPPORT MARGIN
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="text-gray-400 block">Oxygen Consumed:</span>
                <span className="text-white font-bold text-sm">{brief.plssConsumables.oxygenConsumptionLiters} Liters</span>
              </div>
              <div>
                <span className="text-gray-400 block">O2 Reserve Margin:</span>
                <span className={`font-bold text-sm ${brief.plssConsumables.oxygenMarginMinutes < 45 ? "text-red-400" : "text-emerald-400"}`}>
                  +{brief.plssConsumables.oxygenMarginMinutes} mins
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Battery Reserve:</span>
                <span className="text-white font-bold text-sm">{brief.plssConsumables.batteryReservePercent}%</span>
              </div>
              <div>
                <span className="text-gray-400 block">Cooling Water:</span>
                <span className="text-white font-bold text-sm">{brief.plssConsumables.waterCoolingLiters} Liters</span>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-gray-400 italic">
              Note: {brief.plssConsumables.reason}
            </div>
          </div>

          {/* Section 3: Risk Assessment & Contingency */}
          <div className="bg-surface-dark/50 border border-surface-border rounded-xl p-4">
            <h3 className="text-xs font-bold text-amber-400 border-b border-surface-border/60 pb-1.5 mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              3. IDENTIFIED TERRAIN HAZARDS & CONTINGENCY
            </h3>
            <div className="space-y-1.5 mb-3">
              {brief.keyRisks.map((risk, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] text-amber-200">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{risk}</span>
                </div>
              ))}
            </div>
            <div className="bg-surface-darker/70 p-2.5 rounded-lg border border-surface-border/70 text-[11px] text-gray-300">
              <span className="font-bold text-white block mb-0.5">CONTINGENCY ABORT PROTOCOL:</span>
              {brief.contingencyProtocol}
            </div>
          </div>

          {/* Section 4: Scientific Recommendations */}
          <div className="bg-surface-dark/50 border border-surface-border rounded-xl p-4">
            <h3 className="text-xs font-bold text-purple-400 border-b border-surface-border/60 pb-1.5 mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              4. SCIENTIFIC RECONNAISSANCE PROTOCOLS
            </h3>
            <ul className="space-y-1 text-[11px] text-gray-300">
              {brief.scientificRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-purple-400">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Official Disclaimers and Data Provenance */}
        <div className="mt-5 pt-4 border-t border-surface-border text-[10px] text-gray-500 font-mono space-y-1.5">
          <div className="text-gray-400">
            <span className="font-bold">NASA DATASETS EMPLOYED:</span> {brief.dataAttribution.join(" | ")}
          </div>
          <div className="italic text-gray-500">
            {brief.disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
}
