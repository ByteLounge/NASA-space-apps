"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import TopBar from "@/components/layout/TopBar";
import BottomBar from "@/components/layout/BottomBar";
import LandingHero from "@/components/layout/LandingHero";
import LocationInspector from "@/components/panels/LocationInspector";
import RoutePlannerPanel from "@/components/panels/RoutePlannerPanel";
import RouteComparisonPanel from "@/components/panels/RouteComparisonPanel";
import ElevationChartModal from "@/components/panels/ElevationChartModal";
import MissionBriefModal from "@/components/panels/MissionBriefModal";
import AskMarscopeModal from "@/components/panels/AskMarscopeModal";
import DataSourcesModal from "@/components/panels/DataSourcesModal";

import MarsLoadingScreen from "@/components/layout/MarsLoadingScreen";
import AstronautGuide from "@/components/layout/AstronautGuide";
import TrekToolbar, { TrekActiveDrawer } from "@/components/layout/TrekToolbar";
import TrekLayersDrawer from "@/components/panels/TrekLayersDrawer";
import TrekBookmarksDrawer from "@/components/panels/TrekBookmarksDrawer";
import TrekToolsDrawer from "@/components/panels/TrekToolsDrawer";

import { MarsCoordinate } from "@/lib/mars-coordinates";
import { REGIONAL_DEMS, analyzeTerrain, TerrainAnalysis } from "@/lib/mola-data";
import { SCIENCE_POINTS, SciencePoint, computeScientificInterestScore, ScienceScoreResult } from "@/lib/science-data";
import { RouteResult, RouteStrategy, calculateRoute, generateRouteComparison } from "@/lib/pathfinding";
import { ActiveLayers } from "@/components/map/MarsMap2D";
import { Compass, Navigation, Layers, ChevronRight, ChevronLeft, MapPin } from "lucide-react";

// Dynamically import map & 3D globe to avoid SSR window issues
const MarsMap2D = dynamic(() => import("@/components/map/MarsMap2D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-darkest text-gray-400 gap-3 font-mono text-xs">
      <span className="w-8 h-8 border-2 border-mars-500 border-t-transparent rounded-full animate-spin" />
      <span>INITIALIZING 2D PLANETARY CARTOGRAPHY WORKSTATION...</span>
    </div>
  ),
});

const MarsGlobe3D = dynamic(() => import("@/components/globe/MarsGlobe3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-darkest text-gray-400 gap-3 font-mono text-xs">
      <span className="w-8 h-8 border-2 border-mars-500 border-t-transparent rounded-full animate-spin" />
      <span>INITIALIZING THREE.JS 3D MARTIAN SPHERE...</span>
    </div>
  ),
});

export default function MarscopeApp() {
  // Region & Mode
  const [selectedRegionId, setSelectedRegionId] = useState<string>("jezero");
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");

  // Coordinates & Inspection
  const [selectedCoordinate, setSelectedCoordinate] = useState<MarsCoordinate | null>({
    lat: 18.444,
    lng: 77.451,
  });
  const [hoverCoordinate, setHoverCoordinate] = useState<MarsCoordinate | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<SciencePoint | null>(
    SCIENCE_POINTS[0]
  );

  // Layers
  const [activeLayers, setActiveLayers] = useState<ActiveLayers>({
    baseImagery: "VIKING",
    molaElevation: true,
    slopeHazards: true,
    scienceTargets: true,
    crismMinerals: true,
    hazards: true,
    activeRoute: true,
  });

  // Route Planning
  const [startCoord, setStartCoord] = useState<MarsCoordinate | null>({
    lat: 18.444,
    lng: 77.451, // Butler Landing
  });
  const [destCoord, setDestCoord] = useState<MarsCoordinate | null>({
    lat: 18.442,
    lng: 77.410, // Hawksbill Gap Delta Scarp
  });
  const [selectedStrategy, setSelectedStrategy] = useState<RouteStrategy>("SAFEST");
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [comparisonRoutes, setComparisonRoutes] = useState<{
    safest: RouteResult;
    fastest: RouteResult;
    science: RouteResult;
  } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);

  const [isLandingHeroOpen, setIsLandingHeroOpen] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTrekDrawer, setActiveTrekDrawer] = useState<TrekActiveDrawer>("NONE");
  const [baseOpacity, setBaseOpacity] = useState<number>(1.0);
  const [activeRightTab, setActiveRightTab] = useState<"INSPECTOR" | "ROUTER">("ROUTER");
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isElevationChartOpen, setIsElevationChartOpen] = useState(false);
  const [isMissionBriefOpen, setIsMissionBriefOpen] = useState(false);
  const [isAskMarscopeOpen, setIsAskMarscopeOpen] = useState(false);
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);

  // Trek drawer toggler
  const handleToggleTrekDrawer = (drawer: TrekActiveDrawer) => {
    if (drawer === "PLANNER") {
      setActiveTrekDrawer("NONE");
      setActiveRightTab("ROUTER");
      setIsRightPanelCollapsed(false);
    } else if (drawer === "SOURCES") {
      setActiveTrekDrawer("NONE");
      setIsDataSourcesOpen(true);
    } else if (drawer === "AI") {
      setActiveTrekDrawer("NONE");
      setIsAskMarscopeOpen(true);
    } else {
      setActiveTrekDrawer(activeTrekDrawer === drawer ? "NONE" : drawer);
    }
  };

  // Derived Analysis for Selected Coordinate
  const terrainAnalysis: TerrainAnalysis | null = useMemo(() => {
    if (!selectedCoordinate) return null;
    return analyzeTerrain(selectedCoordinate);
  }, [selectedCoordinate]);

  const scienceScore: ScienceScoreResult | null = useMemo(() => {
    if (!selectedCoordinate) return null;
    return computeScientificInterestScore(selectedCoordinate);
  }, [selectedCoordinate]);

  // Route calculation effect
  const computeRoutes = useCallback(() => {
    if (!startCoord || !destCoord) {
      setActiveRoute(null);
      setComparisonRoutes(null);
      return;
    }

    setIsCalculatingRoute(true);

    // Run pathfinding asynchronously to ensure zero UI freeze
    setTimeout(() => {
      try {
        const comp = generateRouteComparison(startCoord, destCoord);
        setComparisonRoutes(comp);
        setActiveRoute(
          selectedStrategy === "SAFEST"
            ? comp.safest
            : selectedStrategy === "FASTEST"
            ? comp.fastest
            : comp.science
        );
      } catch (err) {
        console.error("Pathfinding error:", err);
      } finally {
        setIsCalculatingRoute(false);
      }
    }, 50);
  }, [startCoord, destCoord, selectedStrategy]);

  useEffect(() => {
    computeRoutes();
  }, [computeRoutes]);

  // Strategy change handler
  const handleStrategyChange = (newStrategy: RouteStrategy) => {
    setSelectedStrategy(newStrategy);
    if (comparisonRoutes) {
      setActiveRoute(
        newStrategy === "SAFEST"
          ? comparisonRoutes.safest
          : newStrategy === "FASTEST"
          ? comparisonRoutes.fastest
          : comparisonRoutes.science
      );
    }
  };

  // Region change handler
  const handleSelectRegion = (regionId: string) => {
    setSelectedRegionId(regionId);
    const dem = REGIONAL_DEMS.find((d) => d.id === regionId);
    if (dem) {
      // Find default points in this region
      const regionPoints = SCIENCE_POINTS.filter((p) => p.regionId === regionId);
      if (regionPoints.length >= 2) {
        setStartCoord({ lat: regionPoints[0].lat, lng: regionPoints[0].lng });
        setDestCoord({ lat: regionPoints[1].lat, lng: regionPoints[1].lng });
        setSelectedCoordinate({ lat: regionPoints[0].lat, lng: regionPoints[0].lng });
        setSelectedFeature(regionPoints[0]);
      } else {
        const center = {
          lat: (dem.latMin + dem.latMax) / 2,
          lng: (dem.lngMin + dem.lngMax) / 2,
        };
        setSelectedCoordinate(center);
        setSelectedFeature(null);
      }
    }
  };

  // Map coordinate selection
  const handleSelectCoordinate = (coord: MarsCoordinate) => {
    setSelectedCoordinate(coord);
    setSelectedFeature(null);
    setActiveRightTab("INSPECTOR");
    setIsRightPanelCollapsed(false);
  };

  // Feature click
  const handleSelectSciencePoint = (point: SciencePoint) => {
    setSelectedCoordinate({ lat: point.lat, lng: point.lng });
    setSelectedFeature(point);
    setActiveRightTab("INSPECTOR");
    setIsRightPanelCollapsed(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-darkest select-none">
      {/* Landing Hero Overlay (Dismissable) */}
      {isLandingHeroOpen && (
        <LandingHero
          onStartExploring={() => setIsLandingHeroOpen(false)}
          onOpenMissionPlanner={() => {
            setIsLandingHeroOpen(false);
            setActiveRightTab("ROUTER");
            setIsRightPanelCollapsed(false);
          }}
        />
      )}

      {/* Top Bar Header */}
      <TopBar
        selectedRegionId={selectedRegionId}
        onSelectRegion={handleSelectRegion}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenAskMarscope={() => setIsAskMarscopeOpen(true)}
        onOpenDataSources={() => setIsDataSourcesOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenMissionBrief={() => setIsMissionBriefOpen(true)}
        onSelectSearchResult={(point) => handleSelectSciencePoint(point)}
        hasActiveRoute={!!activeRoute}
      />

      {/* Main Viewport Workspace */}
      <main className="relative flex-1 w-full h-[calc(100vh-5.75rem)] overflow-hidden">
        {/* Map / 3D Canvas with Zero-Lag Concurrency */}
        <div className="absolute inset-0 z-0">
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              viewMode === "2D" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            <MarsMap2D
              selectedRegionId={selectedRegionId}
              selectedCoordinate={selectedCoordinate}
              activeRoute={activeRoute}
              comparisonRoutes={comparisonRoutes}
              showComparison={isComparisonModalOpen}
              activeLayers={activeLayers}
              baseOpacity={baseOpacity}
              onSelectCoordinate={handleSelectCoordinate}
              onSelectSciencePoint={handleSelectSciencePoint}
              onHoverCoordinate={setHoverCoordinate}
            />
          </div>

          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              viewMode === "3D" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            <MarsGlobe3D
              selectedRegionId={selectedRegionId}
              selectedCoordinate={selectedCoordinate}
              activeRoute={activeRoute}
              onSelectCoordinate={handleSelectCoordinate}
              onSelectFeature={handleSelectSciencePoint}
            />
          </div>
        </div>

        {/* NASA Mars Trek Toolstrip (Left) */}
        <TrekToolbar
          activeDrawer={activeTrekDrawer}
          onToggleDrawer={handleToggleTrekDrawer}
          onOpenGuide={() => setIsGuideOpen(true)}
          hasActiveRoute={!!activeRoute}
        />

        {/* NASA Trek Left Flyout Drawers */}
        {activeTrekDrawer === "LAYERS" && (
          <TrekLayersDrawer
            activeLayers={activeLayers}
            onLayerChange={setActiveLayers}
            baseOpacity={baseOpacity}
            onBaseOpacityChange={setBaseOpacity}
            onClose={() => setActiveTrekDrawer("NONE")}
          />
        )}

        {activeTrekDrawer === "BOOKMARKS" && (
          <TrekBookmarksDrawer
            onSelectFeature={(feature) => {
              handleSelectSciencePoint(feature);
              setActiveTrekDrawer("NONE");
            }}
            onFlyTo={(coord) => {
              handleSelectCoordinate(coord);
              setActiveTrekDrawer("NONE");
            }}
            onClose={() => setActiveTrekDrawer("NONE")}
          />
        )}

        {activeTrekDrawer === "TOOLS" && (
          <TrekToolsDrawer
            activeRoute={activeRoute}
            onOpenElevationChart={() => {
              setIsElevationChartOpen(true);
              setActiveTrekDrawer("NONE");
            }}
            onOpenComparison={() => {
              setIsComparisonModalOpen(true);
              setActiveTrekDrawer("NONE");
            }}
            onOpenMissionBrief={() => {
              setIsMissionBriefOpen(true);
              setActiveTrekDrawer("NONE");
            }}
            onClose={() => setActiveTrekDrawer("NONE")}
          />
        )}

        {/* Right Panel: Inspector & Route Planner */}
        <div
          className={`absolute top-4 right-4 z-20 w-80 sm:w-96 max-h-[calc(100%-2rem)] transition-transform duration-300 flex flex-col ${
            isRightPanelCollapsed ? "translate-x-[calc(100%+1.5rem)]" : "translate-x-0"
          }`}
        >
          {/* Toggle Button for collapsing */}
          <button
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            className="absolute -left-9 top-2 bg-surface-darker/90 border border-surface-border p-1.5 rounded-l-lg text-gray-400 hover:text-white shadow-hud z-30"
            title={isRightPanelCollapsed ? "Expand Panel" : "Collapse Panel"}
          >
            {isRightPanelCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {/* Panel Tab Switcher */}
          <div className="flex bg-surface-darker/95 border border-surface-border rounded-t-xl p-1 gap-1 shadow-hud backdrop-blur-md">
            <button
              onClick={() => setActiveRightTab("ROUTER")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-mono text-xs transition-colors ${
                activeRightTab === "ROUTER"
                  ? "bg-mars-600 text-white font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              Route Planner
            </button>

            <button
              onClick={() => setActiveRightTab("INSPECTOR")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-mono text-xs transition-colors ${
                activeRightTab === "INSPECTOR"
                  ? "bg-mars-600 text-white font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Inspector
            </button>
          </div>

          {/* Panel Body */}
          <div className="overflow-y-auto max-h-[calc(100vh-10rem)]">
            {activeRightTab === "ROUTER" ? (
              <RoutePlannerPanel
                startCoord={startCoord}
                destCoord={destCoord}
                activeRoute={activeRoute}
                selectedStrategy={selectedStrategy}
                isCalculating={isCalculatingRoute}
                onStrategyChange={handleStrategyChange}
                onSelectPresetStart={(c) => setStartCoord(c)}
                onSelectPresetDest={(c) => setDestCoord(c)}
                onOpenComparison={() => setIsComparisonModalOpen(true)}
                onOpenElevationChart={() => setIsElevationChartOpen(true)}
                onOpenMissionBrief={() => setIsMissionBriefOpen(true)}
                onResetRoute={() => {
                  setStartCoord(null);
                  setDestCoord(null);
                  setActiveRoute(null);
                  setComparisonRoutes(null);
                }}
              />
            ) : (
              <LocationInspector
                coordinate={selectedCoordinate}
                terrainAnalysis={terrainAnalysis}
                scienceScore={scienceScore}
                selectedFeature={selectedFeature}
                onSetStart={(coord) => {
                  setStartCoord(coord);
                  setActiveRightTab("ROUTER");
                }}
                onSetDestination={(coord) => {
                  setDestCoord(coord);
                  setActiveRightTab("ROUTER");
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Bottom Status Bar */}
      <BottomBar
        hoverCoordinate={hoverCoordinate}
        selectedCoordinate={selectedCoordinate}
      />

      {/* Modals */}
      {isComparisonModalOpen && (
        <RouteComparisonPanel
          comparison={comparisonRoutes}
          activeStrategy={selectedStrategy}
          onSelectStrategy={(strat) => {
            handleStrategyChange(strat);
            setIsComparisonModalOpen(false);
          }}
          onClose={() => setIsComparisonModalOpen(false)}
        />
      )}

      {isElevationChartOpen && (
        <ElevationChartModal
          route={activeRoute}
          onClose={() => setIsElevationChartOpen(false)}
        />
      )}

      {isMissionBriefOpen && (
        <MissionBriefModal
          route={activeRoute}
          onClose={() => setIsMissionBriefOpen(false)}
        />
      )}

      {isAskMarscopeOpen && (
        <AskMarscopeModal
          currentCenter={selectedCoordinate || undefined}
          lastRouteStrategy={selectedStrategy}
          onNavigateRegion={(regionId) => {
            handleSelectRegion(regionId);
            setIsAskMarscopeOpen(false);
          }}
          onSelectCoordinate={(c) => {
            handleSelectCoordinate(c);
            setIsAskMarscopeOpen(false);
          }}
          onToggleLayer={(key) => {
            if (key in activeLayers) {
              setActiveLayers((prev) => ({ ...prev, [key]: true }));
            }
            setIsAskMarscopeOpen(false);
          }}
          onSelectStrategy={(strat) => {
            handleStrategyChange(strat);
            setIsAskMarscopeOpen(false);
          }}
          onClose={() => setIsAskMarscopeOpen(false)}
        />
      )}

      {isDataSourcesOpen && (
        <DataSourcesModal onClose={() => setIsDataSourcesOpen(false)} />
      )}

      {/* 2D Astronaut Guided Tour Companion */}
      <AstronautGuide
        isOpen={isGuideOpen}
        onToggle={() => setIsGuideOpen(!isGuideOpen)}
      />

      {/* 2D Rocket Orbiting Mars Loading Screen */}
      <MarsLoadingScreen onLoaded={() => setIsLoading(false)} />
    </div>
  );
}
