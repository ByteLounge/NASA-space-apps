"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MarsCoordinate, formatMarsCoordinate, normalizeLongitude180 } from "@/lib/mars-coordinates";
import { REGIONAL_DEMS, RegionalDEM, getMarsElevation, analyzeTerrain } from "@/lib/mola-data";
import { SCIENCE_POINTS, SciencePoint } from "@/lib/science-data";
import { RouteResult } from "@/lib/pathfinding";
import { Search, MapPin, Navigation, Mountain, Layers, Sparkles, AlertTriangle, Crosshair } from "lucide-react";

export interface ActiveLayers {
  baseImagery: "VIKING" | "MOLA_COLOR" | "THEMIS_IR";
  molaElevation: boolean;
  slopeHazards: boolean;
  scienceTargets: boolean;
  crismMinerals: boolean;
  hazards: boolean;
  activeRoute: boolean;
}

interface MarsMap2DProps {
  selectedRegionId: string;
  selectedCoordinate: MarsCoordinate | null;
  activeRoute: RouteResult | null;
  comparisonRoutes?: { safest: RouteResult; fastest: RouteResult; science: RouteResult } | null;
  showComparison: boolean;
  activeLayers: ActiveLayers;
  onSelectCoordinate: (coord: MarsCoordinate) => void;
  onSelectSciencePoint: (point: SciencePoint) => void;
  onHoverCoordinate?: (coord: MarsCoordinate | null) => void;
  onSetStart?: (coord: MarsCoordinate) => void;
  onSetDestination?: (coord: MarsCoordinate) => void;
}

export default function MarsMap2D({
  selectedRegionId,
  selectedCoordinate,
  activeRoute,
  comparisonRoutes,
  showComparison,
  activeLayers,
  onSelectCoordinate,
  onSelectSciencePoint,
  onHoverCoordinate,
  onSetStart,
  onSetDestination,
}: MarsMap2DProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const baseLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const elevationGridLayerRef = useRef<L.LayerGroup | null>(null);
  const slopeHazardLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedMarkerRef = useRef<L.CircleMarker | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SciencePoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Use EPSG:4326 Equirectangular (Standard IAU Mars Cartographic Projection)
    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.EPSG4326,
      center: [18.38, 77.53], // Default Jezero Crater
      zoom: 8,
      minZoom: 2,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    mapRef.current = map;

    // Google Maps Style Controls
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.scale({ imperial: false, position: "bottomleft", maxWidth: 120 }).addTo(map);

    baseLayerGroupRef.current = L.layerGroup().addTo(map);
    elevationGridLayerRef.current = L.layerGroup().addTo(map);
    slopeHazardLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const coord: MarsCoordinate = {
        lat: Math.round(e.latlng.lat * 100000) / 100000,
        lng: Math.round(normalizeLongitude180(e.latlng.lng) * 100000) / 100000,
      };
      onSelectCoordinate(coord);
    });

    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      if (onHoverCoordinate) {
        onHoverCoordinate({
          lat: Math.round(e.latlng.lat * 10000) / 10000,
          lng: Math.round(normalizeLongitude180(e.latlng.lng) * 10000) / 10000,
        });
      }
    });

    map.on("mouseout", () => {
      if (onHoverCoordinate) onHoverCoordinate(null);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Basemap Layer
  useEffect(() => {
    if (!mapRef.current || !baseLayerGroupRef.current) return;
    const baseGroup = baseLayerGroupRef.current;
    baseGroup.clearLayers();

    let tileUrl = "";
    if (activeLayers.baseImagery === "VIKING") {
      tileUrl = "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg";
    } else if (activeLayers.baseImagery === "MOLA_COLOR") {
      tileUrl = "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg";
    } else {
      tileUrl = "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v2/1.0.0/default/default028mm/{z}/{y}/{x}.jpg";
    }

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 16,
      noWrap: false,
      bounds: [[-90, -180], [90, 180]],
    });

    baseGroup.addLayer(tileLayer);
  }, [activeLayers.baseImagery]);

  // Fly to region
  useEffect(() => {
    if (!mapRef.current) return;
    const dem = REGIONAL_DEMS.find((d) => d.id === selectedRegionId);
    if (dem) {
      const centerLat = (dem.latMin + dem.latMax) / 2;
      const centerLng = (dem.lngMin + dem.lngMax) / 2;
      mapRef.current.flyTo([centerLat, centerLng], 9, { duration: 1.2 });
    }
  }, [selectedRegionId]);

  // Render Google Maps Style Pins for Landmarks
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    const group = markersLayerRef.current;
    group.clearLayers();

    SCIENCE_POINTS.forEach((pt) => {
      if (pt.category === "SCIENCE_TARGET" && !activeLayers.scienceTargets) return;
      if (pt.category === "MINERAL_CRISM" && !activeLayers.crismMinerals) return;
      if (pt.category === "HAZARD_ZONE" && !activeLayers.hazards) return;

      const color =
        pt.category === "LANDING_SITE" ? "#00e5ff" :
        pt.category === "SCIENCE_TARGET" ? "#10b981" :
        pt.category === "MINERAL_CRISM" ? "#a855f7" :
        pt.category === "HAZARD_ZONE" ? "#ef4444" : "#f59e0b";

      // Google Maps Custom SVG Pin
      const iconHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -100%);">
          <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-lg border border-white/80 transition-transform group-hover:scale-125" style="background-color: ${color};">
            <span class="w-2.5 h-2.5 rounded-full bg-white"></span>
          </div>
          <div class="w-1.5 h-2 mx-auto" style="background-color: ${color}; clip-path: polygon(0 0, 100% 0, 50% 100%);"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-mars-pin",
        iconSize: [28, 36],
        iconAnchor: [14, 36],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon });

      // Rich Google Maps Popup
      marker.bindPopup(
        `<div class="p-2 font-mono text-xs max-w-xs">
          <div class="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${color}"></span>
            ${pt.name}
          </div>
          <div class="text-[11px] text-gray-300 mb-2">${pt.description}</div>
          <div class="bg-surface-dark p-2 rounded border border-surface-border text-[10px] space-y-1 mb-2">
            <div><span class="text-gray-400">Coordinates:</span> ${formatMarsCoordinate({ lat: pt.lat, lng: pt.lng })}</div>
            <div><span class="text-gray-400">Elevation:</span> ${pt.elevationMeters} m</div>
            <div><span class="text-gray-400">Missions:</span> ${pt.instruments.join(", ")}</div>
          </div>
        </div>`,
        { className: "bg-surface-darker/95 border border-surface-border text-white shadow-2xl rounded-xl" }
      );

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectSciencePoint(pt);
      });

      group.addLayer(marker);
    });
  }, [activeLayers.scienceTargets, activeLayers.crismMinerals, activeLayers.hazards, onSelectSciencePoint]);

  // Render MOLA Elevation Grid & Slope Hazard Overlays
  useEffect(() => {
    if (!mapRef.current || !slopeHazardLayerRef.current || !elevationGridLayerRef.current) return;
    const slopeGroup = slopeHazardLayerRef.current;
    const elevGroup = elevationGridLayerRef.current;
    slopeGroup.clearLayers();
    elevGroup.clearLayers();

    const dem = REGIONAL_DEMS.find((d) => d.id === selectedRegionId);
    if (!dem) return;

    if (activeLayers.slopeHazards) {
      for (let r = 0; r < dem.rows - 1; r += 2) {
        for (let c = 0; c < dem.cols - 1; c += 2) {
          const lat = dem.latMin + (r / (dem.rows - 1)) * (dem.latMax - dem.latMin);
          const lng = dem.lngMin + (c / (dem.cols - 1)) * (dem.lngMax - dem.lngMin);
          const analysis = analyzeTerrain({ lat, lng });

          if (analysis.slopeDegrees >= 12) {
            const cellLatSpan = (dem.latMax - dem.latMin) / (dem.rows - 1) * 2;
            const cellLngSpan = (dem.lngMax - dem.lngMin) / (dem.cols - 1) * 2;
            const isExtreme = analysis.slopeDegrees >= 18;

            const rect = L.rectangle(
              [
                [lat, lng],
                [lat + cellLatSpan, lng + cellLngSpan],
              ],
              {
                color: isExtreme ? "#ef4444" : "#f59e0b",
                weight: 1,
                fillColor: isExtreme ? "#ef4444" : "#f59e0b",
                fillOpacity: isExtreme ? 0.35 : 0.22,
              }
            );

            rect.bindTooltip(
              `<div class="text-[11px] font-mono">
                <span class="text-amber-400 font-bold">⚠ STEEP SLOPE: ${analysis.slopeDegrees}°</span><br/>
                Roughness: ${analysis.roughnessMeters}m | Traversability: ${analysis.difficulty}
              </div>`,
              { className: "bg-surface-darker/95 border border-surface-border text-white rounded p-1.5", sticky: true }
            );

            slopeGroup.addLayer(rect);
          }
        }
      }
    }

    const boundary = L.rectangle(
      [
        [dem.latMin, dem.lngMin],
        [dem.latMax, dem.lngMax],
      ],
      {
        color: "#f05a36",
        weight: 1.5,
        dashArray: "4, 6",
        fill: false,
        opacity: 0.6,
      }
    );
    elevGroup.addLayer(boundary);
  }, [selectedRegionId, activeLayers.slopeHazards, activeLayers.molaElevation]);

  // Render Routes
  useEffect(() => {
    if (!mapRef.current || !routesLayerRef.current) return;
    const group = routesLayerRef.current;
    group.clearLayers();

    if (!activeLayers.activeRoute) return;

    if (showComparison && comparisonRoutes) {
      const routesToRender = [
        { route: comparisonRoutes.safest, color: "#10b981", name: "SAFEST" },
        { route: comparisonRoutes.fastest, color: "#00e5ff", name: "FASTEST" },
        { route: comparisonRoutes.science, color: "#a855f7", name: "SCIENCE" },
      ];

      routesToRender.forEach(({ route, color, name }) => {
        if (!route || route.waypoints.length === 0) return;
        const latLngs: [number, number][] = route.waypoints.map((wp) => [wp.lat, wp.lng]);
        const line = L.polyline(latLngs, {
          color,
          weight: route.strategy === activeRoute?.strategy ? 5 : 3,
          opacity: route.strategy === activeRoute?.strategy ? 1.0 : 0.65,
          dashArray: route.strategy === "SAFEST" ? undefined : route.strategy === "FASTEST" ? "6, 6" : "2, 5",
        });

        line.bindTooltip(
          `<div class="p-1 font-mono text-xs">
            <span class="font-bold" style="color: ${color}">${name}</span>: ${route.totalDistanceKm} km (${route.totalDurationFormatted})
          </div>`,
          { className: "bg-surface-darker/95 border border-surface-border text-white rounded p-1.5", sticky: true }
        );

        group.addLayer(line);
      });
    } else if (activeRoute && activeRoute.waypoints.length > 0) {
      const latLngs: [number, number][] = activeRoute.waypoints.map((wp) => [wp.lat, wp.lng]);
      const color =
        activeRoute.strategy === "SAFEST" ? "#10b981" :
        activeRoute.strategy === "FASTEST" ? "#00e5ff" : "#a855f7";

      const polyline = L.polyline(latLngs, {
        color,
        weight: 4,
        opacity: 0.95,
      });

      group.addLayer(polyline);

      // Start & Dest Markers
      const startWp = activeRoute.waypoints[0];
      const startMarker = L.circleMarker([startWp.lat, startWp.lng], {
        radius: 8,
        fillColor: "#10b981",
        fillOpacity: 1,
        color: "#ffffff",
        weight: 2,
      }).bindTooltip("<b>START STATION</b>", { permanent: false, direction: "top" });
      group.addLayer(startMarker);

      const destWp = activeRoute.waypoints[activeRoute.waypoints.length - 1];
      const destMarker = L.circleMarker([destWp.lat, destWp.lng], {
        radius: 8,
        fillColor: "#ef4444",
        fillOpacity: 1,
        color: "#ffffff",
        weight: 2,
      }).bindTooltip("<b>MISSION OBJECTIVE / DESTINATION</b>", { permanent: false, direction: "top" });
      group.addLayer(destMarker);
    }
  }, [activeRoute, comparisonRoutes, showComparison, activeLayers.activeRoute]);

  // Reticle Marker
  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    if (selectedCoordinate) {
      const marker = L.circleMarker([selectedCoordinate.lat, selectedCoordinate.lng], {
        radius: 9,
        fillColor: "#f05a36",
        fillOpacity: 0.4,
        color: "#f05a36",
        weight: 2,
        dashArray: "3, 3",
      }).addTo(mapRef.current);

      selectedMarkerRef.current = marker;
    }
  }, [selectedCoordinate]);

  // Google Maps Search Filter
  const handleSearchChange = (val: string) => {
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

  const handleSelectSearchResult = (pt: SciencePoint) => {
    setSearchQuery(pt.name);
    setIsSearching(false);
    onSelectSciencePoint(pt);
    if (mapRef.current) {
      mapRef.current.flyTo([pt.lat, pt.lng], 11, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full h-full bg-surface-darkest select-none">
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Google Maps Style Floating Search Pill (Top-Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-80 sm:w-96">
        <div className="relative flex items-center bg-surface-darker/95 backdrop-blur-md border border-surface-border rounded-2xl shadow-2xl p-1.5 focus-within:border-mars-500 transition-all">
          <Search className="w-4 h-4 text-gray-400 ml-2.5 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => { if (searchQuery) setIsSearching(true); }}
            placeholder="Search Mars (e.g. 'Perseverance', 'Olympus Mons')..."
            className="w-full bg-transparent text-white font-mono text-xs focus:outline-none placeholder-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSearchResults([]); setIsSearching(false); }}
              className="text-gray-400 hover:text-white px-2"
            >
              ✕
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isSearching && searchResults.length > 0 && (
          <div className="absolute top-12 left-0 w-full bg-surface-darker/95 backdrop-blur-md border border-surface-border rounded-xl shadow-2xl overflow-hidden mt-1 font-mono text-xs z-30">
            {searchResults.map((res) => (
              <button
                key={res.id}
                onClick={() => handleSelectSearchResult(res)}
                className="w-full p-2.5 text-left hover:bg-surface-card flex items-start gap-2.5 border-b border-surface-border/50 last:border-none transition-colors"
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

      {/* Projection Tag */}
      <div className="absolute bottom-6 left-28 z-10 pointer-events-none hidden sm:flex items-center gap-2 bg-surface-darker/80 backdrop-blur-md border border-surface-border px-3 py-1 rounded-lg text-[10px] font-mono text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span>IAU EPSG:4326 EQUIRECTANGULAR CARTOGRAPHY</span>
      </div>
    </div>
  );
}
