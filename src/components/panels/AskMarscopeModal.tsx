"use client";

import React, { useState } from "react";
import { processNlpQuery, NlpActionResult } from "@/lib/nlp-query";
import { MarsCoordinate } from "@/lib/mars-coordinates";
import { RouteStrategy } from "@/lib/pathfinding";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Compass, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  X,
  CornerDownLeft,
  Lightbulb
} from "lucide-react";

interface AskMarscopeModalProps {
  currentCenter?: MarsCoordinate;
  lastRouteStrategy?: RouteStrategy;
  onNavigateRegion: (regionId: string) => void;
  onSelectCoordinate: (coord: MarsCoordinate) => void;
  onToggleLayer: (layerKey: string) => void;
  onSelectStrategy: (strategy: RouteStrategy) => void;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  actionResult?: NlpActionResult;
}

const EXAMPLE_PROMPTS = [
  "Zoom to Jezero Crater",
  "Show steep terrain around Olympus Mons",
  "Filter CRISM mineral deposits",
  "18.444, 77.451",
  "Explain why this route was selected",
  "Plan safest route",
];

export default function AskMarscopeModal({
  currentCenter,
  lastRouteStrategy,
  onNavigateRegion,
  onSelectCoordinate,
  onToggleLayer,
  onSelectStrategy,
  onClose,
}: AskMarscopeModalProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Greetings, Explorer. I am MARSCOPE Science Copilot. Ask questions regarding Martian topography, CRISM mineralogy, hazardous slopes, or EVA traversal strategies.",
    },
  ]);

  const handleSubmit = (textToSubmit?: string) => {
    const q = textToSubmit || query;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: q,
    };

    const action = processNlpQuery(q, {
      currentCenter,
      lastRouteStrategy,
    });

    const assistantMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      sender: "assistant",
      text: action.reply,
      actionResult: action,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setQuery("");

    // Execute side-effects based on intent
    if (action.intent === "NAVIGATE_REGION" && action.targetRegionId) {
      onNavigateRegion(action.targetRegionId);
    } else if (action.intent === "INSPECT_POINT" && action.targetCoordinate) {
      onSelectCoordinate(action.targetCoordinate);
    } else if (action.intent === "FILTER_LAYER" && action.layerToggle) {
      onToggleLayer(action.layerToggle);
    } else if (action.intent === "PLAN_ROUTE" && action.routeStrategy) {
      onSelectStrategy(action.routeStrategy);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-surface-darker border border-surface-border rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col h-[600px] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-mars-600/30 border border-mars-500/50 flex items-center justify-center">
              <Bot className="w-4 h-4 text-mars-400" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                ASK MARSCOPE
                <span className="text-[10px] font-mono px-2 py-0.2 bg-telemetry-cyan/15 text-telemetry-cyan border border-telemetry-cyan/30 rounded">
                  DETERMINISTIC NASA AGENT
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Natural-language mission assistant translating queries into MOLA/CRISM calculations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 font-mono text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-mars-600/40 border border-mars-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-mars-400" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-xl p-3 leading-relaxed whitespace-pre-line ${
                  m.sender === "user"
                    ? "bg-mars-600 text-white shadow-sm"
                    : "bg-surface-dark border border-surface-border text-gray-200"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Suggested Quick Queries */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 mb-1.5">
            <Lightbulb className="w-3 h-3 text-yellow-400" />
            SUGGESTED EXPLORATION COMMANDS:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmit(prompt)}
                className="text-[10px] font-mono bg-surface-dark hover:bg-surface-card border border-surface-border text-gray-300 px-2.5 py-1 rounded-md transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-2 pt-2 border-t border-surface-border"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a Martian query (e.g. 'Show Jezero', 'Slope at 18.42, 77.31')..."
            className="flex-1 bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-mars-500"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="bg-mars-600 hover:bg-mars-500 disabled:opacity-40 text-white px-3.5 py-2 rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
