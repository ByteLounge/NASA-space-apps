"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MarsCoordinate, normalizeLongitude180 } from "@/lib/mars-coordinates";
import { REGIONAL_DEMS, RegionalDEM, getMarsElevation } from "@/lib/mola-data";
import { SCIENCE_POINTS, SciencePoint } from "@/lib/science-data";
import { RouteResult } from "@/lib/pathfinding";
import { createMarsAlbedoTexture, createMarsBumpTexture } from "@/lib/mars-textures";
import { Layers, RotateCcw, Play, Pause, Mountain, Globe2, Eye } from "lucide-react";

interface MarsGlobe3DProps {
  selectedRegionId: string;
  selectedCoordinate?: MarsCoordinate | null;
  activeRoute?: RouteResult | null;
  onSelectCoordinate: (coord: MarsCoordinate) => void;
  onSelectFeature?: (feature: SciencePoint) => void;
}

export default function MarsGlobe3D({
  selectedRegionId,
  selectedCoordinate,
  activeRoute,
  onSelectCoordinate,
  onSelectFeature,
}: MarsGlobe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"GLOBE" | "TERRAIN">("GLOBE");
  const [exaggeration, setExaggeration] = useState<number>(2); // 1x, 2x, 5x
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const marsSphereRef = useRef<THREE.Mesh | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const routeLineRef = useRef<THREE.Line | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07080a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff4e8, 1.8);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xf05a36, 0.4);
    rimLight.position.set(-5, -2, -4);
    scene.add(rimLight);

    // Create Mars Globe
    const globeRadius = 1.8;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const albedoTex = createMarsAlbedoTexture();
    const bumpTex = createMarsBumpTexture();

    const globeMat = new THREE.MeshStandardMaterial({
      map: albedoTex,
      bumpMap: bumpTex,
      bumpScale: 0.04,
      roughness: 0.88,
      metalness: 0.05,
    });

    const marsSphere = new THREE.Mesh(globeGeo, globeMat);
    marsSphereRef.current = marsSphere;
    scene.add(marsSphere);

    // Atmosphere halo
    const haloGeo = new THREE.SphereGeometry(globeRadius * 1.018, 64, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf95738,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    scene.add(halo);

    // Add Science Markers
    const markersGroup = new THREE.Group();
    markersGroupRef.current = markersGroup;
    scene.add(markersGroup);

    SCIENCE_POINTS.forEach((pt) => {
      const latRad = (pt.lat * Math.PI) / 180;
      const lngRad = (normalizeLongitude180(pt.lng) * Math.PI) / 180;

      // Convert lat/lng to 3D sphere coordinates
      // In Three.js: y is up, z is forward, x is right
      const r = globeRadius * 1.01;
      const x = r * Math.cos(latRad) * Math.sin(lngRad);
      const y = r * Math.sin(latRad);
      const z = r * Math.cos(latRad) * Math.cos(lngRad);

      const markerColor =
        pt.category === "LANDING_SITE" ? 0x00e5ff :
        pt.category === "SCIENCE_TARGET" ? 0x10b981 :
        pt.category === "MINERAL_CRISM" ? 0xa855f7 :
        pt.category === "HAZARD_ZONE" ? 0xef4444 : 0xf59e0b;

      const markerGeo = new THREE.SphereGeometry(0.024, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: markerColor });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(x, y, z);
      marker.userData = { sciencePoint: pt };
      markersGroup.add(marker);
    });

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (isRotating && marsSphereRef.current && viewMode === "GLOBE") {
        marsSphereRef.current.rotation.y += 0.0015;
        if (markersGroupRef.current) {
          markersGroupRef.current.rotation.y += 0.0015;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Mouse Controls (Pan & Rotate)
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      if (viewMode === "GLOBE" && marsSphereRef.current) {
        marsSphereRef.current.rotation.y += deltaX * 0.005;
        marsSphereRef.current.rotation.x += deltaY * 0.005;
        if (markersGroupRef.current) {
          markersGroupRef.current.rotation.y += deltaX * 0.005;
          markersGroupRef.current.rotation.x += deltaY * 0.005;
        }
      } else if (viewMode === "TERRAIN" && terrainMeshRef.current) {
        terrainMeshRef.current.rotation.z += deltaX * 0.005;
        terrainMeshRef.current.rotation.x += deltaY * 0.005;
      }

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomSpeed = 0.003;
      cameraRef.current.position.z = Math.max(
        viewMode === "GLOBE" ? 2.4 : 1.5,
        Math.min(10, cameraRef.current.position.z + e.deltaY * zoomSpeed)
      );
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domEl.addEventListener("wheel", onWheel, { passive: false });

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      domEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domEl.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [viewMode, isRotating]);

  // Handle Local 3D MOLA Terrain Mesh Generation
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clean previous terrain and route line
    if (terrainMeshRef.current) {
      scene.remove(terrainMeshRef.current);
      terrainMeshRef.current.geometry.dispose();
      terrainMeshRef.current = null;
    }
    if (routeLineRef.current) {
      scene.remove(routeLineRef.current);
      routeLineRef.current.geometry.dispose();
      routeLineRef.current = null;
    }

    if (viewMode === "TERRAIN") {
      // Hide globe
      if (marsSphereRef.current) marsSphereRef.current.visible = false;
      if (markersGroupRef.current) markersGroupRef.current.visible = false;

      // Find regional DEM
      const dem = REGIONAL_DEMS.find((d) => d.id === selectedRegionId) || REGIONAL_DEMS[0];

      // Build 3D Heightfield Plane
      const meshWidth = 3.6;
      const meshHeight = 3.0;
      const geometry = new THREE.PlaneGeometry(meshWidth, meshHeight, dem.cols - 1, dem.rows - 1);
      const positionAttr = geometry.attributes.position;
      const count = positionAttr.count;

      // Elevation normalization
      let minE = Infinity;
      let maxE = -Infinity;
      for (let r = 0; r < dem.rows; r++) {
        for (let c = 0; c < dem.cols; c++) {
          const z = dem.grid[r][c];
          if (z < minE) minE = z;
          if (z > maxE) maxE = z;
        }
      }
      const spanE = Math.max(1, maxE - minE);

      // Vertex color attribute based on MOLA topography ramp
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / dem.cols);
        const col = i % dem.cols;
        const validR = Math.min(dem.rows - 1, row);
        const validC = Math.min(dem.cols - 1, col);
        const elev = dem.grid[validR][validC];

        // Apply elevation height with vertical exaggeration
        const normZ = (elev - minE) / spanE;
        const zDisplacement = normZ * 0.75 * (exaggeration / 2);
        positionAttr.setZ(i, zDisplacement);

        // MOLA color spectrum (violet/blue -> cyan -> green -> yellow -> red -> white)
        let cr = 0, cg = 0, cb = 0;
        if (normZ < 0.2) {
          cr = 0.15; cg = 0.25; cb = 0.75; // lowlands deep blue
        } else if (normZ < 0.4) {
          cr = 0.10; cg = 0.70; cb = 0.85; // cyan
        } else if (normZ < 0.6) {
          cr = 0.20; cg = 0.80; cb = 0.30; // green
        } else if (normZ < 0.8) {
          cr = 0.95; cg = 0.75; cb = 0.15; // yellow/amber
        } else if (normZ < 0.95) {
          cr = 0.90; cg = 0.30; cb = 0.15; // mars rust
        } else {
          cr = 0.98; cg = 0.95; cb = 0.95; // white peaks
        }

        colors[i * 3] = cr;
        colors[i * 3 + 1] = cg;
        colors[i * 3 + 2] = cb;
      }

      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.computeVertexNormals();

      const terrainMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.85,
        metalness: 0.1,
        flatShading: false,
        side: THREE.DoubleSide,
      });

      const terrainMesh = new THREE.Mesh(geometry, terrainMat);
      terrainMesh.rotation.x = -Math.PI / 2.6; // tilt toward viewer
      terrainMeshRef.current = terrainMesh;
      scene.add(terrainMesh);

      // Render 3D Route Polyline on top of terrain
      if (activeRoute && activeRoute.waypoints.length > 1) {
        const routePoints: THREE.Vector3[] = [];
        for (const wp of activeRoute.waypoints) {
          const u = ((wp.lng - dem.lngMin) / (dem.lngMax - dem.lngMin)) - 0.5;
          const v = ((wp.lat - dem.latMin) / (dem.latMax - dem.latMin)) - 0.5;
          const elev = getMarsElevation(wp);
          const normZ = (elev - minE) / spanE;
          const zDisp = normZ * 0.75 * (exaggeration / 2) + 0.03; // slightly elevated to avoid z-fighting

          routePoints.push(new THREE.Vector3(u * meshWidth, v * meshHeight, zDisp));
        }

        const routeGeo = new THREE.BufferGeometry().setFromPoints(routePoints);
        const routeMat = new THREE.LineBasicMaterial({
          color: activeRoute.strategy === "SAFEST" ? 0x10b981 :
                 activeRoute.strategy === "FASTEST" ? 0x00e5ff : 0xa855f7,
          linewidth: 3,
        });

        const routeLine = new THREE.Line(routeGeo, routeMat);
        routeLine.rotation.x = -Math.PI / 2.6;
        routeLineRef.current = routeLine;
        scene.add(routeLine);
      }

      if (cameraRef.current) {
        cameraRef.current.position.set(0, 0, 3.8);
      }
    } else {
      // Restore globe
      if (marsSphereRef.current) marsSphereRef.current.visible = true;
      if (markersGroupRef.current) markersGroupRef.current.visible = true;
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 0, 5.2);
      }
    }
  }, [viewMode, selectedRegionId, exaggeration, activeRoute]);

  const activeDem = REGIONAL_DEMS.find((d) => d.id === selectedRegionId) || REGIONAL_DEMS[0];

  return (
    <div className="relative w-full h-full overflow-hidden bg-surface-darkest">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Controls Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-surface-darker/90 backdrop-blur-md border border-surface-border rounded-lg p-2 text-xs text-gray-300 shadow-hud">
        {/* Mode Toggle */}
        <div className="flex bg-surface-dark rounded-md p-0.5 border border-surface-border">
          <button
            onClick={() => setViewMode("GLOBE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              viewMode === "GLOBE"
                ? "bg-mars-600 text-white font-medium shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            Planetary Globe
          </button>
          <button
            onClick={() => setViewMode("TERRAIN")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              viewMode === "TERRAIN"
                ? "bg-mars-600 text-white font-medium shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            3D MOLA Terrain
          </button>
        </div>

        {/* Vertical Exaggeration (Only for 3D Terrain) */}
        {viewMode === "TERRAIN" && (
          <div className="flex items-center gap-1.5 bg-surface-dark px-2.5 py-1.5 rounded-md border border-surface-border">
            <span className="text-gray-400">Exaggeration:</span>
            {[1, 2, 5].map((val) => (
              <button
                key={val}
                onClick={() => setExaggeration(val)}
                className={`px-2 py-0.5 rounded font-mono ${
                  exaggeration === val
                    ? "bg-telemetry-cyan/20 text-telemetry-cyan font-bold border border-telemetry-cyan/40"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {val}×
              </button>
            ))}
          </div>
        )}

        {/* Rotation toggle for Globe */}
        {viewMode === "GLOBE" && (
          <button
            onClick={() => setIsRotating(!isRotating)}
            className="flex items-center gap-1.5 bg-surface-dark px-2.5 py-1.5 rounded-md border border-surface-border hover:text-white transition-colors"
          >
            {isRotating ? <Pause className="w-3.5 h-3.5 text-yellow-400" /> : <Play className="w-3.5 h-3.5 text-green-400" />}
            {isRotating ? "Pause Orbit" : "Resume Orbit"}
          </button>
        )}
      </div>

      {/* Local Region Overlay Badge */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none bg-surface-darker/80 backdrop-blur-md border border-surface-border px-4 py-2.5 rounded-lg">
        <div className="flex items-center gap-2 text-xs font-mono text-mars-400 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-mars-500 animate-pulse" />
          {viewMode === "GLOBE" ? "MGS MOLA Global Topography" : activeDem.name}
        </div>
        <p className="text-[11px] text-gray-400 mt-1 max-w-sm leading-relaxed">
          {viewMode === "GLOBE"
            ? "Interactive planetocentric Martian sphere with MOLA MEGDR bump relief."
            : `High-resolution MOLA elevation displacement grid with ${exaggeration}× vertical relief exaggeration.`}
        </p>
      </div>
    </div>
  );
}
