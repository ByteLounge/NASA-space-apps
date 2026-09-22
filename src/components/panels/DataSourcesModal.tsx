"use client";

import React from "react";
import { DATA_SOURCES_REGISTRY } from "@/lib/science-data";
import { Database, ExternalLink, ShieldCheck, X, FileText, Info } from "lucide-react";

interface DataSourcesModalProps {
  onClose: () => void;
}

export default function DataSourcesModal({ onClose }: DataSourcesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-surface-darker border border-surface-border rounded-2xl shadow-2xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-surface-border pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-mars-500" />
              <h2 className="font-mono text-base sm:text-lg font-bold text-white">
                NASA & USGS PLANETARY SCIENTIFIC DATA SOURCES
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              MARSCOPE strictly relies on verified planetary data from NASA, USGS Astrogeology, and the Planetary Data System (PDS). No synthetic elevations or fabricated telemetry are used.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Datasets List */}
        <div className="space-y-4 mb-6">
          {DATA_SOURCES_REGISTRY.map((src) => (
            <div
              key={src.id}
              className="bg-surface-dark/60 border border-surface-border rounded-xl p-4 sm:p-5 hover:border-gray-600 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-mono text-sm font-bold text-white">{src.title}</h3>
                  <div className="text-xs text-mars-400 font-mono mt-0.5">
                    Mission: {src.mission} | Instrument: {src.instrument}
                  </div>
                </div>
                <a
                  href={src.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-mono text-telemetry-cyan hover:underline bg-telemetry-cyan/10 border border-telemetry-cyan/30 px-2.5 py-1 rounded-md"
                >
                  Official NASA Archive
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed mb-3">
                {src.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono bg-surface-darkest/60 p-2.5 rounded-lg border border-surface-border/50 text-gray-400">
                <div>
                  <span className="text-gray-500 block">Organization:</span>
                  <span className="text-gray-200">{src.organization}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Spatial Resolution:</span>
                  <span className="text-gray-200">{src.resolution}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">License / Access:</span>
                  <span className="text-emerald-400 font-medium">{src.license}</span>
                </div>
              </div>

              <div className="mt-2.5 text-[11px] text-gray-300">
                <span className="text-gray-500 font-mono">Usage in MARSCOPE: </span>
                {src.usageInApp}
              </div>
            </div>
          ))}
        </div>

        {/* Scientific Honesty and Disclaimer Banner */}
        <div className="bg-surface-dark/90 border border-surface-border rounded-xl p-4 text-xs text-gray-400 leading-relaxed space-y-2">
          <div className="flex items-center gap-2 text-white font-mono font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            SCIENTIFIC PROVENANCE AND CALCULATION PRINCIPLES
          </div>
          <p>
            All elevation values are referenced to the <strong>Martian Areoid</strong> (defined by the MOLA gravitational potential and 3,396.0 km mean radius datum). 
            Traversability ratings, energy expenditure models, and science priority scores are labeled as <strong>MARSCOPE Analytical Estimates</strong> and do not represent official NASA operational flight rules.
          </p>
        </div>
      </div>
    </div>
  );
}
