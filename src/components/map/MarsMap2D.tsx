"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MarsCoordinate, formatMarsCoordinate, normalizeLongitude180 } from "@/lib/mars-coordinates";
import { REGIONAL_DEMS, RegionalDEM, getMarsElevation, analyzeTerrain } from "@/lib/mola-data";
import { SCIENCE_POINTS, SciencePoint } from "@/lib/science-data";
import { RouteResult } from "@/lib/pathfinding";

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

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Use EPSG:4326 Equirectangular (Standard IAU Mars Cartographic Projection)
    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.EPSG4326,
      center: [18.38, 77.53], // Default Jezero
      zoom: 9,
      minZoom: 2,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    mapRef.current = map;

    // Add zoom controls to bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Initialize layer groups
    baseLayerGroupRef.current = L.layerGroup().addTo(map);
    elevationGridLayerRef.current = L.layerGroup().addTo(map);
    slopeHazardLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);

    // Map Click Handler: Inspect Point
    map.on("click", (e: L.LeafletMouseEvent) => {
      const coord: MarsCoordinate = {
        lat: Math.round(e.latlng.lat * 100000) / 100000,
        lng: Math.round(normalizeLongitude180(e.latlng.lng) * 100000) / 100000,
      };
      onSelectCoordinate(coord);
    });

    // Mousemove Handler: Hover Coordinate
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

    // High-resolution public NASA/USGS Mars tile servers
    // Viking MDIM2.1, MOLA Color Shaded Relief, THEMIS Day IR
    let tileUrl = "";
    if (activeLayers.baseImagery === "VIKING") {
      // USGS Astrogeology Viking Color Mosaic
      tileUrl = "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg";
    } else if (activeLayers.baseImagery === "MOLA_COLOR") {
      // NASA Solar System Treks MOLA Color Shaded Relief
      tileUrl = "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg";
    } else {
      // THEMIS Daytime Infrared 100m
      tileUrl = "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v2/1.0.0/default/default028mm/{z}/{y}/{x}.jpg";
    }

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 16,
      noWrap: false,
      bounds: [[-90, -180], [90, 180]],
    });

    // Fallback if network tiles are unreachable (offline demo resilience)
    tileLayer.on("tileerror", () => {
      // Graceful offline fallback: tile container retains deep Mars background styling
    });

    baseGroup.addLayer(tileLayer);
  }, [activeLayers.baseImagery]);

  // Fly to region when region selector changes
  useEffect(() => {
    if (!mapRef.current) return;
    const dem = REGIONAL_DEMS.find((d) => d.id === selectedRegionId);
    if (dem) {
      const centerLat = (dem.latMin + dem.latMax) / 2;
      const centerLng = (dem.lngMin + dem.lngMax) / 2;
      mapRef.current.flyTo([centerLat, centerLng], 10, { duration: 1.2 });
    }
  }, [selectedRegionId]);

  // Render Science Points and Hazard Markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    const group = markersLayerRef.current;
    group.clearLayers();

    SCIENCE_POINTS.forEach((pt) => {
      // Layer visibility filtering
      if (pt.category === "SCIENCE_TARGET" && !activeLayers.scienceTargets) return;
      if (pt.category === "MINERAL_CRISM" && !activeLayers.crismMinerals) return;
      if (pt.category === "HAZARD_ZONE" && !activeLayers.hazards) return;

      const color =
        pt.category === "LANDING_SITE" ? "#00e5ff" :
        pt.category === "SCIENCE_TARGET" ? "#10b981" :
        pt.category === "MINERAL_CRISM" ? "#a855f7" :
        pt.category === "HAZARD_ZONE" ? "#ef4444" : "#f59e0b";

      const marker = L.circleMarker([pt.lat, pt.lng], {
        radius: pt.category === "HAZARD_ZONE" ? 8 : 7,
        fillColor: color,
        fillOpacity: 0.85,
        color: "#ffffff",
        weight: 1.5,
      });

      // Custom tooltip with NASA telemetry
      marker.bindTooltip(
        `<div class="p-1 font-mono text-xs">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full inline-block" style="background-color: ${color}"></span>
            ${pt.name}
          </div>
          <div class="text-[11px] text-gray-300 mt-1">${pt.description}</div>
          <div class="text-[10px] text-gray-400 mt-1">Elev: ${pt.elevationMeters}m | Mission: ${pt.instruments.join(", ")}</div>
        </div>`,
        { className: "bg-surface-darker/95 border border-surface-border text-white shadow-hud rounded-md p-2", direction: "top" }
      );

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectSciencePoint(pt);
      });

      group.addLayer(marker);
    });
  }, [activeLayers.scienceTargets, activeLayers.crismMinerals, activeLayers.hazards]);

  // Render MOLA Elevation Grid & Slope Hazard Overlays
  useEffect(() => {
    if (!mapRef.current || !slopeHazardLayerRef.current || !elevationGridLayerRef.current) return;
    const slopeGroup = slopeHazardLayerRef.current;
    const elevGroup = elevationGridLayerRef.current;
    slopeGroup.clearLayers();
    elevGroup.clearLayers();

    const dem = REGIONAL_DEMS.find((d) => d.id === selectedRegionId);
    if (!dem) return;

    // Draw slope hazard cells if enabled
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

    // Draw regional boundary
    const boundary = L.rectangle(
      [
        [dem.latMin, dem.lngMin],
        [dem.latMax, dem.lngMax],
      ],
      {
        color: "#f05a36",
        weight: 1,
        dashArray: "4, 6",
        fill: false,
        opacity: 0.5,
      }
    );
    elevGroup.addLayer(boundary);
  }, [selectedRegionId, activeLayers.slopeHazards, activeLayers.molaElevation]);

  // Render Traversal Routes
  useEffect(() => {
    if (!mapRef.current || !routesLayerRef.current) return;
    const group = routesLayerRef.current;
    group.clearLayers();

    if (!activeLayers.activeRoute) return;

    // If Comparison mode is active, render all 3 routes side by side
    if (showComparison && comparisonRoutes) {
      const routesToRender = [
        { route: comparisonRoutes.safest, color: "#10b981", name: "SAFEST (Low Slope)" },
        { route: comparisonRoutes.fastest, color: "#00e5ff", name: "FASTEST (Direct)" },
        { route: comparisonRoutes.science, color: "#a855f7", name: "SCIENCE (High Value)" },
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
            <span class="font-bold" style="color: ${color}">${name}</span><br/>
            Dist: ${route.totalDistanceKm} km | Time: ${route.totalDurationFormatted} | Max Slope: ${route.maxSlopeDeg}°
          </div>`,
          { className: "bg-surface-darker/95 border border-surface-border text-white rounded p-1.5", sticky: true }
        );

        group.addLayer(line);
      });
    } else if (activeRoute && activeRoute.waypoints.length > 0) {
      // Render single active route
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

      // Start Marker (Green Pin)
      const startWp = activeRoute.waypoints[0];
      const startMarker = L.circleMarker([startWp.lat, startWp.lng], {
        radius: 8,
        fillColor: "#10b981",
        fillOpacity: 1,
        color: "#ffffff",
        weight: 2,
      }).bindTooltip("<b>START STATION</b>", { permanent: false, direction: "top" });
      group.addLayer(startMarker);

      // Destination Marker (Red Flag Pin)
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

  // Render Selected Coordinate Reticle Marker
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

  return (
    <div className="relative w-full h-full bg-surface-darkest">
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Map Reticle Legend / Scale Info */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none hidden sm:flex items-center gap-3 bg-surface-darker/85 backdrop-blur-md border border-surface-border px-3 py-1.5 rounded-lg text-xs font-mono text-gray-300">
        <span className="w-2 h-2 rounded-full bg-telemetry-cyan animate-ping" />
        <span>PLANETARY PROJECTION: IAU EPSG:4326 EQUIRECTANGULAR</span>
      </div>
    </div>
  );
}
