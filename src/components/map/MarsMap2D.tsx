"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MarsCoordinate, formatMarsCoordinate, normalizeLongitude180, marsDistanceKm, marsBearing } from "@/lib/mars-coordinates";
import { REGIONAL_DEMS, RegionalDEM, getMarsElevation, analyzeTerrain } from "@/lib/mola-data";
import { SCIENCE_POINTS, SciencePoint } from "@/lib/science-data";
import { RouteResult } from "@/lib/pathfinding";
import { Search, MapPin, Navigation, Mountain, Layers, Sparkles, AlertTriangle, Crosshair, Ruler, X } from "lucide-react";

export interface ActiveLayers {
  baseImagery: "VIKING" | "MOLA_COLOR" | "THEMIS_IR";
  molaElevation: boolean;
  slopeHazards: boolean;
  scienceTargets: boolean;
  crismMinerals: boolean;
  hazards: boolean;
  activeRoute: boolean;
  graticuleGrid?: boolean;
  nomenclature?: boolean;
}

interface MarsMap2DProps {
  selectedRegionId: string;
  selectedCoordinate: MarsCoordinate | null;
  activeRoute: RouteResult | null;
  comparisonRoutes?: { safest: RouteResult; fastest: RouteResult; science: RouteResult } | null;
  showComparison: boolean;
  activeLayers: ActiveLayers;
  baseOpacity?: number;
  isMeasuring?: boolean;
  measurePoints?: MarsCoordinate[];
  onAddMeasurePoint?: (coord: MarsCoordinate) => void;
  onClearMeasure?: () => void;
  onExitMeasure?: () => void;
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
  baseOpacity = 1.0,
  isMeasuring = false,
  measurePoints = [],
  onAddMeasurePoint,
  onClearMeasure,
  onExitMeasure,
  onSelectCoordinate,
  onSelectSciencePoint,
  onHoverCoordinate,
  onSetStart,
  onSetDestination,
}: MarsMap2DProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const baseLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const graticuleLayerRef = useRef<L.LayerGroup | null>(null);
  const elevationGridLayerRef = useRef<L.LayerGroup | null>(null);
  const slopeHazardLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const nomenclatureLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);

  const isMeasuringRef = useRef(isMeasuring);
  isMeasuringRef.current = isMeasuring;
  const onAddMeasurePointRef = useRef(onAddMeasurePoint);
  onAddMeasurePointRef.current = onAddMeasurePoint;

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
    graticuleLayerRef.current = L.layerGroup().addTo(map);
    elevationGridLayerRef.current = L.layerGroup().addTo(map);
    slopeHazardLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    nomenclatureLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);
    measureLayerRef.current = L.layerGroup().addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const coord: MarsCoordinate = {
        lat: Math.round(e.latlng.lat * 100000) / 100000,
        lng: Math.round(normalizeLongitude180(e.latlng.lng) * 100000) / 100000,
      };
      if (isMeasuringRef.current && onAddMeasurePointRef.current) {
        onAddMeasurePointRef.current(coord);
      } else {
        onSelectCoordinate(coord);
      }
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
      opacity: baseOpacity,
    });

    currentTileLayerRef.current = tileLayer;
    baseGroup.addLayer(tileLayer);
  }, [activeLayers.baseImagery, baseOpacity]);

  // Dynamic Opacity Adjustment
  useEffect(() => {
    if (currentTileLayerRef.current) {
      currentTileLayerRef.current.setOpacity(baseOpacity);
    }
  }, [baseOpacity]);

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

  // Fly to distant selected coordinate (e.g. from bookmarks or search)
  useEffect(() => {
    if (!mapRef.current || !selectedCoordinate) return;
    const center = mapRef.current.getCenter();
    const dLat = Math.abs(center.lat - selectedCoordinate.lat);
    const dLng = Math.abs(normalizeLongitude180(center.lng) - normalizeLongitude180(selectedCoordinate.lng));
    if (dLat > 2 || dLng > 2) {
      mapRef.current.flyTo([selectedCoordinate.lat, selectedCoordinate.lng], Math.max(mapRef.current.getZoom(), 9), {
        duration: 1.2,
      });
    }
  }, [selectedCoordinate]);

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

  // Render Planetary Graticule Lines & Labels (Lat/Lon Grid)
  useEffect(() => {
    if (!mapRef.current || !graticuleLayerRef.current) return;
    const group = graticuleLayerRef.current;
    group.clearLayers();

    if (activeLayers.graticuleGrid === false) return;

    // Latitude Parallels (-80° to +80°)
    const parallels = [-80, -60, -30, 0, 30, 60, 80];
    parallels.forEach((lat) => {
      const isEquator = lat === 0;
      const poly = L.polyline(
        [
          [lat, -180],
          [lat, 180],
        ],
        {
          color: isEquator ? "#00e5ff" : "#38bdf8",
          weight: isEquator ? 1.5 : 0.75,
          dashArray: isEquator ? "8, 6" : "3, 6",
          opacity: isEquator ? 0.65 : 0.35,
          interactive: false,
        }
      );
      group.addLayer(poly);

      const labelText = isEquator ? "0° EQUATOR" : `${Math.abs(lat)}° ${lat > 0 ? "N" : "S"}`;
      const labelIcon = L.divIcon({
        html: `<div class="text-[9px] font-mono px-1 py-0.2 rounded bg-surface-darkest/80 border border-slate-700/60 text-cyan-300 whitespace-nowrap">${labelText}</div>`,
        className: "bg-transparent border-none",
        iconAnchor: [0, 7],
      });
      group.addLayer(L.marker([lat, 0], { icon: labelIcon, interactive: false }));
    });

    // Longitude Meridians (-180° to +180°)
    const meridians = [-180, -120, -60, 0, 60, 120, 180];
    meridians.forEach((lng) => {
      const isPrime = lng === 0;
      const poly = L.polyline(
        [
          [-85, lng],
          [85, lng],
        ],
        {
          color: isPrime ? "#f05a36" : "#38bdf8",
          weight: isPrime ? 1.5 : 0.75,
          dashArray: isPrime ? "8, 6" : "3, 6",
          opacity: isPrime ? 0.7 : 0.35,
          interactive: false,
        }
      );
      group.addLayer(poly);

      const eastLng = lng < 0 ? 360 + lng : lng;
      const labelText = isPrime ? "0° AIRY-0 (PRIME MERIDIAN)" : `${eastLng}° E`;
      const labelIcon = L.divIcon({
        html: `<div class="text-[9px] font-mono px-1 py-0.2 rounded bg-surface-darkest/80 border border-slate-700/60 text-amber-300 whitespace-nowrap">${labelText}</div>`,
        className: "bg-transparent border-none",
        iconAnchor: [0, 7],
      });
      group.addLayer(L.marker([0, lng], { icon: labelIcon, interactive: false }));
    });
  }, [activeLayers.graticuleGrid]);

  // Render IAU Martian Nomenclature Labels
  useEffect(() => {
    if (!mapRef.current || !nomenclatureLayerRef.current) return;
    const group = nomenclatureLayerRef.current;
    group.clearLayers();

    if (activeLayers.nomenclature === false) return;

    SCIENCE_POINTS.forEach((pt) => {
      const isMajor = pt.category === "LANDING_SITE" || pt.category === "GEOLOGY_UNIT";
      const textColor =
        pt.category === "LANDING_SITE" ? "text-cyan-300" :
        pt.category === "GEOLOGY_UNIT" ? "text-amber-300" :
        pt.category === "MINERAL_CRISM" ? "text-purple-300" : "text-gray-300";

      const labelIcon = L.divIcon({
        html: `
          <div class="flex items-center gap-1 -translate-y-5 translate-x-4 pointer-events-none">
            <span class="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-darkest/90 border border-slate-700/60 shadow-md ${textColor} whitespace-nowrap">
              ${pt.name}
            </span>
          </div>
        `,
        className: "bg-transparent border-none",
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: labelIcon, interactive: false });
      group.addLayer(marker);
    });
  }, [activeLayers.nomenclature]);

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

  // NASA Telemetry Reticle Marker on Selected Coordinate
  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    if (selectedCoordinate) {
      const reticleHtml = `
        <div class="relative w-10 h-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
          <!-- 4 NASA Corner Brackets -->
          <div class="w-3 h-3 absolute top-0 left-0 border-t-2 border-l-2 border-mars-500"></div>
          <div class="w-3 h-3 absolute top-0 right-0 border-t-2 border-r-2 border-mars-500"></div>
          <div class="w-3 h-3 absolute bottom-0 left-0 border-b-2 border-l-2 border-mars-500"></div>
          <div class="w-3 h-3 absolute bottom-0 right-0 border-b-2 border-r-2 border-mars-500"></div>

          <!-- Concentric Reticle Ring & Crosshair -->
          <div class="absolute inset-1 rounded-full border border-mars-400/60 animate-pulse"></div>
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-mars-500 shadow-[0_0_10px_#f05a36]"></div>

          <!-- Coordinate Readout Tag -->
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#090d16]/95 border border-mars-500/70 text-mars-300 font-mono text-[9px] px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap">
            ${selectedCoordinate.lat.toFixed(3)}°, ${selectedCoordinate.lng.toFixed(3)}°
          </div>
        </div>
      `;

      const customReticleIcon = L.divIcon({
        html: reticleHtml,
        className: "bg-transparent border-none",
        iconAnchor: [0, 0],
      });

      const marker = L.marker([selectedCoordinate.lat, selectedCoordinate.lng], {
        icon: customReticleIcon,
        interactive: false,
      }).addTo(mapRef.current);

      selectedMarkerRef.current = marker;
    }
  }, [selectedCoordinate]);

  // Render Interactive Geodesic Measurement Layer (Points A & B + Great-Circle Polyline)
  useEffect(() => {
    if (!mapRef.current || !measureLayerRef.current) return;
    const group = measureLayerRef.current;
    group.clearLayers();

    if (!measurePoints || measurePoints.length === 0) return;

    measurePoints.forEach((pt, idx) => {
      const char = idx === 0 ? "A" : "B";
      const icon = L.divIcon({
        html: `
          <div class="w-6 h-6 rounded-full bg-cyan-500 border-2 border-white text-black font-mono font-black text-xs flex items-center justify-center shadow-lg -translate-x-1/2 -translate-y-1/2">
            ${char}
          </div>
        `,
        className: "bg-transparent border-none",
      });
      group.addLayer(L.marker([pt.lat, pt.lng], { icon, interactive: false }));
    });

    if (measurePoints.length >= 2) {
      const p1 = measurePoints[0];
      const p2 = measurePoints[1];
      const dist = marsDistanceKm(p1, p2);
      const bearing = marsBearing(p1, p2);

      const line = L.polyline(
        [
          [p1.lat, p1.lng],
          [p2.lat, p2.lng],
        ],
        {
          color: "#00e5ff",
          weight: 3,
          dashArray: "6, 6",
        }
      );
      group.addLayer(line);

      const midLat = (p1.lat + p2.lat) / 2;
      const midLng = (p1.lng + p2.lng) / 2;
      const badgeIcon = L.divIcon({
        html: `
          <div class="bg-[#0e131d]/98 border border-cyan-400 text-cyan-300 font-mono text-[10px] px-2.5 py-1 rounded-lg shadow-2xl -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
            <span class="font-bold text-white text-xs">${dist.toFixed(2)} km</span> • ${bearing.toFixed(1)}° True
          </div>
        `,
        className: "bg-transparent border-none",
      });
      group.addLayer(L.marker([midLat, midLng], { icon: badgeIcon, interactive: false }));
    }
  }, [measurePoints]);

  return (
    <div className="relative w-full h-full bg-surface-darkest select-none">
      <div
        ref={mapContainerRef}
        className={`w-full h-full z-0 ${isMeasuring ? "cursor-crosshair" : "cursor-default"}`}
      />

      {/* NASA Mars Trek Interactive Measurement Tool HUD */}
      {isMeasuring && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#0e131d]/98 backdrop-blur-xl border border-cyan-500/70 rounded-2xl shadow-[0_8px_30px_rgba(0,229,255,0.2)] px-4 py-2 font-mono text-xs animate-in slide-in-from-top-3">
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <Ruler className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>MEASUREMENT TOOL</span>
          </div>

          <div className="h-4 w-px bg-[#232d3f]" />

          <div className="text-gray-300">
            {measurePoints.length === 0 && <span>Click POINT A on Mars to begin</span>}
            {measurePoints.length === 1 && <span className="text-amber-300">Click POINT B to measure geodesic span</span>}
            {measurePoints.length >= 2 && (
              <span className="text-white font-bold">
                Distance: <span className="text-cyan-400">{marsDistanceKm(measurePoints[0], measurePoints[1]).toFixed(2)} km</span> • 
                Azimuth: <span className="text-cyan-400">{marsBearing(measurePoints[0], measurePoints[1]).toFixed(1)}°</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            {measurePoints.length > 0 && onClearMeasure && (
              <button
                onClick={onClearMeasure}
                className="px-2 py-1 rounded-lg bg-[#182030] hover:bg-slate-700 text-gray-300 text-[10px]"
              >
                Clear
              </button>
            )}
            {onExitMeasure && (
              <button
                onClick={onExitMeasure}
                className="p-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300"
                title="Exit Measurement Tool"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Projection Tag */}
      <div className="absolute bottom-6 left-28 z-10 pointer-events-none hidden sm:flex items-center gap-2 bg-surface-darker/80 backdrop-blur-md border border-surface-border px-3 py-1 rounded-lg text-[10px] font-mono text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        <span>IAU EPSG:4326 EQUIRECTANGULAR CARTOGRAPHY</span>
      </div>
    </div>
  );
}
