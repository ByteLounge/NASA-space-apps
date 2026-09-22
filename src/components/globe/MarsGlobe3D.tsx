"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { MarsCoordinate, normalizeLongitude180, formatMarsCoordinate } from "@/lib/mars-coordinates";
import { REGIONAL_DEMS, RegionalDEM, getMarsElevation, analyzeTerrain } from "@/lib/mola-data";
import { SCIENCE_POINTS, SciencePoint } from "@/lib/science-data";
import { RouteResult } from "@/lib/pathfinding";
import { ActiveLayers } from "@/components/map/MarsMap2D";
import { 
  createMarsAlbedoTexture, 
  createMarsBumpTexture, 
  createMarsMolaColorTexture,
  createDeepSpaceSkybox 
} from "@/lib/mars-textures";
import { 
  Compass, 
  Globe2, 
  Mountain, 
  Play, 
  Pause, 
  Plus, 
  Minus, 
  RotateCcw, 
  Eye, 
  Navigation, 
  MapPin, 
  Layers, 
  ExternalLink,
  X,
  Sparkles,
  Maximize2,
  Sliders,
  Sun
} from "lucide-react";

interface MarsGlobe3DProps {
  selectedRegionId: string;
  selectedCoordinate?: MarsCoordinate | null;
  activeRoute?: RouteResult | null;
  activeLayers?: ActiveLayers;
  sunAngleLs?: number;
  onSelectCoordinate: (coord: MarsCoordinate) => void;
  onSelectFeature?: (feature: SciencePoint) => void;
}

export default function MarsGlobe3D({
  selectedRegionId,
  selectedCoordinate,
  activeRoute,
  activeLayers,
  sunAngleLs = 60,
  onSelectCoordinate,
  onSelectFeature,
}: MarsGlobe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"GLOBE" | "TERRAIN">("GLOBE");
  const [exaggeration, setExaggeration] = useState<number>(2); // 1x, 2x, 5x
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [cameraAltitudeKm, setCameraAltitudeKm] = useState<number>(5400);
  const [cameraTiltDeg, setCameraTiltDeg] = useState<number>(0);
  const [selectedPin, setSelectedPin] = useState<SciencePoint | null>(null);
  const [compassAngleDeg, setCompassAngleDeg] = useState<number>(0);
  const [hoveredFeature, setHoveredFeature] = useState<SciencePoint | null>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const marsSphereRef = useRef<THREE.Mesh | null>(null);
  const graticuleGroupRef = useRef<THREE.Group | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const routeLineRef = useRef<THREE.Line | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Interaction State
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0 });
  const targetCameraPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookAtRef = useRef<THREE.Vector3 | null>(null);

  // Convert lat/lng to 3D sphere coordinate
  const latLngToVector3 = useCallback((lat: number, lng: number, radius: number): THREE.Vector3 => {
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (normalizeLongitude180(lng) * Math.PI) / 180;
    const x = radius * Math.cos(latRad) * Math.sin(lngRad);
    const y = radius * Math.sin(latRad);
    const z = radius * Math.cos(latRad) * Math.cos(lngRad);
    return new THREE.Vector3(x, y, z);
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 2000);
    camera.position.set(0, 0.5, 4.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 1. Realistic Deep Space Skybox (Milky Way & Starfield)
    const skybox = createDeepSpaceSkybox();
    scene.add(skybox);

    // 2. Sunlight (Directional Light mimicking real Sun in space)
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    sunLight.position.set(6, 2.5, 5);
    sunLightRef.current = sunLight;
    scene.add(sunLight);

    // Ambient space light for night-side visibility
    const ambientLight = new THREE.AmbientLight(0x222a38, 0.55);
    scene.add(ambientLight);

    // 3. Realistic Mars Sphere
    const globeRadius = 1.8;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 96, 96);
    const albedoTex = createMarsAlbedoTexture();
    const bumpTex = createMarsBumpTexture();

    const globeMat = new THREE.MeshStandardMaterial({
      map: albedoTex,
      bumpMap: bumpTex,
      bumpScale: 0.035,
      roughness: 0.92,
      metalness: 0.04,
    });

    const marsSphere = new THREE.Mesh(globeGeo, globeMat);
    marsSphereRef.current = marsSphere;
    scene.add(marsSphere);

    // 3b. 3D Planetary Graticule Lines (Lat/Lon Grid)
    const graticuleGroup = new THREE.Group();
    graticuleGroupRef.current = graticuleGroup;
    const rGrat = globeRadius * 1.003;
    const gratMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, opacity: 0.35, transparent: true });
    const eqMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, opacity: 0.75, transparent: true });
    const primeMat = new THREE.LineBasicMaterial({ color: 0xf05a36, opacity: 0.75, transparent: true });

    [-60, -30, 0, 30, 60].forEach((lat) => {
      const latRad = (lat * Math.PI) / 180;
      const y = rGrat * Math.sin(latRad);
      const ringR = rGrat * Math.cos(latRad);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 96; i++) {
        const theta = (i / 96) * Math.PI * 2;
        pts.push(new THREE.Vector3(ringR * Math.sin(theta), y, ringR * Math.cos(theta)));
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lat === 0 ? eqMat : gratMat);
      graticuleGroup.add(line);
    });

    [-180, -120, -60, 0, 60, 120, 180].forEach((lng) => {
      const lngRad = (lng * Math.PI) / 180;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const latRad = (-90 + (i / 64) * 180) * (Math.PI / 180);
        pts.push(new THREE.Vector3(rGrat * Math.cos(latRad) * Math.sin(lngRad), rGrat * Math.sin(latRad), rGrat * Math.cos(latRad) * Math.cos(lngRad)));
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lng === 0 ? primeMat : gratMat);
      graticuleGroup.add(line);
    });
    scene.add(graticuleGroup);

    // 4. Photorealistic Atmospheric Rayleigh Limb Glow (Fresnel Shader)
    const atmosphereVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const atmosphereFragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 viewDir = normalize(-vPosition);
        float intensity = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.8);
        vec3 limbColor = mix(vec3(0.95, 0.45, 0.25), vec3(0.4, 0.6, 0.9), intensity * 0.4);
        gl_FragColor = vec4(limbColor, intensity * 0.42);
      }
    `;

    const atmoGeo = new THREE.SphereGeometry(globeRadius * 1.016, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // 5. 3D Landmark Pins and Beacons
    const markersGroup = new THREE.Group();
    markersGroupRef.current = markersGroup;
    scene.add(markersGroup);

    const createBillboardSprite = (name: string, strokeHex: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "rgba(11, 15, 23, 0.88)";
      ctx.strokeStyle = strokeHex;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(4, 8, 248, 48, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name, 128, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.32, 0.08, 1);
      return sprite;
    };

    SCIENCE_POINTS.forEach((pt) => {
      const pos = latLngToVector3(pt.lat, pt.lng, globeRadius * 1.012);

      const color =
        pt.category === "LANDING_SITE" ? 0x00e5ff :
        pt.category === "SCIENCE_TARGET" ? 0x10b981 :
        pt.category === "MINERAL_CRISM" ? 0xa855f7 :
        pt.category === "HAZARD_ZONE" ? 0xef4444 : 0xf59e0b;

      // Pin Head
      const pinGeo = new THREE.SphereGeometry(0.022, 16, 16);
      const pinMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);

      // Pin Stem line to surface
      const surfPos = latLngToVector3(pt.lat, pt.lng, globeRadius);
      const stemGeo = new THREE.BufferGeometry().setFromPoints([surfPos, pos]);
      const stemMat = new THREE.LineBasicMaterial({ color, opacity: 0.75, transparent: true });
      const stemLine = new THREE.Line(stemGeo, stemMat);

      // Pulsing Base Halo Ring
      const ringGeo = new THREE.RingGeometry(0.015, 0.035, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(surfPos);
      ringMesh.lookAt(pos.clone().multiplyScalar(2));

      const pinGroup = new THREE.Group();
      pinGroup.add(pinMesh);
      pinGroup.add(stemLine);
      pinGroup.add(ringMesh);
      pinGroup.userData = { sciencePoint: pt };

      // IAU Nomenclature 3D Billboard Sprite
      const sprite = createBillboardSprite(
        pt.name,
        color === 0x00e5ff ? "#00e5ff" : color === 0x10b981 ? "#10b981" : "#f59e0b"
      );
      if (sprite) {
        sprite.position.copy(pos).multiplyScalar(1.06);
        sprite.name = "nomenclatureSprite";
        pinGroup.add(sprite);
      }

      markersGroup.add(pinGroup);
    });

    // Raycaster for Pin Clicks and Hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      rotationVelocityRef.current = { x: 0, y: 0 };
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Hover test for markers
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markersGroup.children, true);
      if (intersects.length > 0) {
        let root = intersects[0].object;
        while (root.parent && root.parent !== markersGroup) {
          root = root.parent;
        }
        if (root.userData.sciencePoint) {
          setHoveredFeature(root.userData.sciencePoint);
        }
      } else {
        setHoveredFeature(null);
      }

      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      rotationVelocityRef.current = { x: deltaX * 0.0035, y: deltaY * 0.0035 };

      if (viewMode === "GLOBE" && marsSphereRef.current) {
        marsSphereRef.current.rotation.y += rotationVelocityRef.current.x;
        marsSphereRef.current.rotation.x += rotationVelocityRef.current.y;
        markersGroup.rotation.y += rotationVelocityRef.current.x;
        markersGroup.rotation.x += rotationVelocityRef.current.y;
      } else if (viewMode === "TERRAIN" && terrainMeshRef.current) {
        terrainMeshRef.current.rotation.z += deltaX * 0.004;
        terrainMeshRef.current.rotation.x += deltaY * 0.004;
      }

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: MouseEvent) => {
      // Check if this was a click rather than a drag
      const delta = Math.hypot(
        e.clientX - previousMousePositionRef.current.x,
        e.clientY - previousMousePositionRef.current.y
      );

      if (delta < 5) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const markerIntersects = raycaster.intersectObjects(markersGroup.children, true);
        if (markerIntersects.length > 0) {
          let root = markerIntersects[0].object;
          while (root.parent && root.parent !== markersGroup) {
            root = root.parent;
          }
          if (root.userData.sciencePoint) {
            const pt = root.userData.sciencePoint as SciencePoint;
            setSelectedPin(pt);
            onSelectCoordinate({ lat: pt.lat, lng: pt.lng });
            if (onSelectFeature) onSelectFeature(pt);
            flyToCoordinate(pt.lat, pt.lng);
          }
        } else {
          // Check sphere click
          const sphereIntersects = raycaster.intersectObject(marsSphere);
          if (sphereIntersects.length > 0) {
            const hit = sphereIntersects[0].point;
            // Inverse map 3D sphere coordinate back to Martian Lat/Lng
            // Invert sphere rotation
            const invPos = hit.clone().applyEuler(new THREE.Euler(-marsSphere.rotation.x, -marsSphere.rotation.y, 0, 'YXZ'));
            const r = invPos.length();
            const lat = (Math.asin(invPos.y / r) * 180) / Math.PI;
            const lng = (Math.atan2(invPos.x, invPos.z) * 180) / Math.PI;

            onSelectCoordinate({
              lat: Math.round(lat * 1000) / 1000,
              lng: Math.round(normalizeLongitude180(lng) * 1000) / 1000,
            });
          }
        }
      }

      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomSpeed = 0.0028;
      const newZ = Math.max(
        viewMode === "GLOBE" ? 2.15 : 1.2,
        Math.min(9.5, cameraRef.current.position.z + e.deltaY * zoomSpeed)
      );
      cameraRef.current.position.z = newZ;
      // Calculate realistic Google Earth eye altitude (km)
      const altKm = Math.round((newZ - globeRadius) * 2400);
      setCameraAltitudeKm(altKm);
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    dom.addEventListener("wheel", handleWheel, { passive: false });

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Inertial damping
      if (!isDraggingRef.current && (Math.abs(rotationVelocityRef.current.x) > 0.0001 || Math.abs(rotationVelocityRef.current.y) > 0.0001)) {
        if (viewMode === "GLOBE" && marsSphereRef.current) {
          marsSphereRef.current.rotation.y += rotationVelocityRef.current.x;
          marsSphereRef.current.rotation.x += rotationVelocityRef.current.y;
          markersGroup.rotation.y += rotationVelocityRef.current.x;
          markersGroup.rotation.x += rotationVelocityRef.current.y;
        }
        rotationVelocityRef.current.x *= 0.92;
        rotationVelocityRef.current.y *= 0.92;
      }

      // Sync 3D Graticule & Markers
      if (graticuleGroupRef.current && marsSphereRef.current) {
        graticuleGroupRef.current.rotation.y = marsSphereRef.current.rotation.y;
        graticuleGroupRef.current.rotation.x = marsSphereRef.current.rotation.x;
        graticuleGroupRef.current.visible = activeLayers?.graticuleGrid !== false;
      }

      markersGroup.traverse((child) => {
        if (child.name === "nomenclatureSprite") {
          child.visible = activeLayers?.nomenclature !== false;
        }
      });

      // Auto rotation
      if (isRotating && marsSphereRef.current && viewMode === "GLOBE") {
        marsSphereRef.current.rotation.y += 0.0012;
        markersGroup.rotation.y += 0.0012;
      }

      // Smooth Fly-To camera interpolation
      if (targetCameraPosRef.current && cameraRef.current) {
        cameraRef.current.position.lerp(targetCameraPosRef.current, 0.08);
        if (cameraRef.current.position.distanceTo(targetCameraPosRef.current) < 0.02) {
          targetCameraPosRef.current = null;
        }
      }

      // Update North Compass angle
      if (marsSphereRef.current) {
        const rotYDeg = ((-marsSphereRef.current.rotation.y * 180) / Math.PI) % 360;
        setCompassAngleDeg(rotYDeg);
      }

      renderer.render(scene, camera);
    };
    animate();

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
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      dom.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [viewMode, isRotating, latLngToVector3, onSelectCoordinate, onSelectFeature]);

  // Smooth Google Earth Fly-To Coordinate Animation
  const flyToCoordinate = useCallback((lat: number, lng: number) => {
    if (!marsSphereRef.current || !markersGroupRef.current || !cameraRef.current) return;

    // Convert target to radians
    const targetRotY = -((normalizeLongitude180(lng) * Math.PI) / 180);
    const targetRotX = ((lat * Math.PI) / 180) * 0.7;

    // Smoothly rotate globe to bring target facing forward
    marsSphereRef.current.rotation.y = targetRotY;
    marsSphereRef.current.rotation.x = targetRotX;
    if (markersGroupRef.current) {
      markersGroupRef.current.rotation.y = targetRotY;
      markersGroupRef.current.rotation.x = targetRotX;
    }
    if (graticuleGroupRef.current) {
      graticuleGroupRef.current.rotation.y = targetRotY;
      graticuleGroupRef.current.rotation.x = targetRotX;
    }

    // Zoom camera in like Google Earth
    targetCameraPosRef.current = new THREE.Vector3(0, 0, 2.7);
  }, []);

  // Smooth Google Earth Fly-To when selected coordinate changes
  useEffect(() => {
    if (selectedCoordinate && viewMode === "GLOBE") {
      flyToCoordinate(selectedCoordinate.lat, selectedCoordinate.lng);
    }
  }, [selectedCoordinate, viewMode, flyToCoordinate]);

  // Smooth Fly-To when region changes
  useEffect(() => {
    if (viewMode === "GLOBE") {
      const dem = REGIONAL_DEMS.find((d) => d.id === selectedRegionId);
      if (dem) {
        const centerLat = (dem.latMin + dem.latMax) / 2;
        const centerLng = (dem.lngMin + dem.lngMax) / 2;
        flyToCoordinate(centerLat, centerLng);
      }
    }
  }, [selectedRegionId, viewMode, flyToCoordinate]);

  // Dynamic Basemap Texture Switching (VIKING vs MOLA_COLOR)
  useEffect(() => {
    if (!marsSphereRef.current) return;
    const mat = marsSphereRef.current.material as THREE.MeshStandardMaterial;
    if (activeLayers?.baseImagery === "MOLA_COLOR") {
      mat.map = createMarsMolaColorTexture();
    } else {
      mat.map = createMarsAlbedoTexture();
    }
    mat.needsUpdate = true;
  }, [activeLayers?.baseImagery]);

  // Seasonal Sunlight Angle Simulator (Solar Longitude Ls)
  useEffect(() => {
    if (!sunLightRef.current) return;
    const rad = ((sunAngleLs ?? 60) * Math.PI) / 180;
    const x = Math.cos(rad) * 8;
    const y = Math.sin(rad) * Math.sin((25.19 * Math.PI) / 180) * 4;
    const z = Math.sin(rad) * Math.cos((25.19 * Math.PI) / 180) * 8;
    sunLightRef.current.position.set(x, y, z);
  }, [sunAngleLs]);

  // Camera Tilt / Horizon Perspective Handler
  const handleTiltChange = (tiltDeg: number) => {
    setCameraTiltDeg(tiltDeg);
    if (!cameraRef.current) return;
    const dist = cameraRef.current.position.length();
    const tiltRad = (tiltDeg * Math.PI) / 180;
    cameraRef.current.position.y = Math.sin(tiltRad) * dist * 0.7;
    cameraRef.current.position.z = Math.cos(tiltRad) * dist;
    cameraRef.current.lookAt(0, 0, 0);
  };

  // Handle 3D MOLA Terrain Heightfield Generation
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

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
      if (marsSphereRef.current) marsSphereRef.current.visible = false;
      if (markersGroupRef.current) markersGroupRef.current.visible = false;

      const dem = REGIONAL_DEMS.find((d) => d.id === selectedRegionId) || REGIONAL_DEMS[0];

      const meshWidth = 3.6;
      const meshHeight = 3.0;
      const geometry = new THREE.PlaneGeometry(meshWidth, meshHeight, dem.cols - 1, dem.rows - 1);
      const positionAttr = geometry.attributes.position;
      const count = positionAttr.count;

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
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / dem.cols);
        const col = i % dem.cols;
        const validR = Math.min(dem.rows - 1, row);
        const validC = Math.min(dem.cols - 1, col);
        const elev = dem.grid[validR][validC];

        const normZ = (elev - minE) / spanE;
        const zDisplacement = normZ * 0.75 * (exaggeration / 2);
        positionAttr.setZ(i, zDisplacement);

        let cr = 0, cg = 0, cb = 0;
        if (normZ < 0.2) {
          cr = 0.15; cg = 0.25; cb = 0.75;
        } else if (normZ < 0.4) {
          cr = 0.10; cg = 0.70; cb = 0.85;
        } else if (normZ < 0.6) {
          cr = 0.20; cg = 0.80; cb = 0.30;
        } else if (normZ < 0.8) {
          cr = 0.95; cg = 0.75; cb = 0.15;
        } else if (normZ < 0.95) {
          cr = 0.90; cg = 0.30; cb = 0.15;
        } else {
          cr = 0.98; cg = 0.95; cb = 0.95;
        }

        colors[i * 3] = cr;
        colors[i * 3 + 1] = cg;
        colors[i * 3 + 2] = cb;
      }

      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.computeVertexNormals();

      const terrainMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.88,
        metalness: 0.08,
        flatShading: false,
        side: THREE.DoubleSide,
      });

      const terrainMesh = new THREE.Mesh(geometry, terrainMat);
      terrainMesh.rotation.x = -Math.PI / 2.6;
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
          const zDisp = normZ * 0.75 * (exaggeration / 2) + 0.035;

          routePoints.push(new THREE.Vector3(u * meshWidth, v * meshHeight, zDisp));
        }

        const routeGeo = new THREE.BufferGeometry().setFromPoints(routePoints);
        const routeMat = new THREE.LineBasicMaterial({
          color: activeRoute.strategy === "SAFEST" ? 0x10b981 :
                 activeRoute.strategy === "FASTEST" ? 0x00e5ff : 0xa855f7,
          linewidth: 4,
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
      if (marsSphereRef.current) marsSphereRef.current.visible = true;
      if (markersGroupRef.current) markersGroupRef.current.visible = true;
    }
  }, [viewMode, selectedRegionId, exaggeration, activeRoute]);

  // Reorient North
  const handleResetNorth = () => {
    if (!marsSphereRef.current || !markersGroupRef.current) return;
    marsSphereRef.current.rotation.x = 0;
    marsSphereRef.current.rotation.y = 0;
    markersGroupRef.current.rotation.x = 0;
    markersGroupRef.current.rotation.y = 0;
    if (graticuleGroupRef.current) {
      graticuleGroupRef.current.rotation.x = 0;
      graticuleGroupRef.current.rotation.y = 0;
    }
  };

  // Zoom controls
  const handleZoom = (inward: boolean) => {
    if (!cameraRef.current) return;
    const delta = inward ? -0.5 : 0.5;
    cameraRef.current.position.z = Math.max(2.15, Math.min(9.5, cameraRef.current.position.z + delta));
    setCameraAltitudeKm(Math.round((cameraRef.current.position.z - 1.8) * 2400));
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Google Earth Style Floating Controls (Top-Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-surface-darker/90 backdrop-blur-md border border-surface-border rounded-xl p-2 text-xs text-gray-300 shadow-hud">
        {/* Mode Toggle */}
        <div className="flex bg-surface-dark rounded-lg p-0.5 border border-surface-border">
          <button
            onClick={() => setViewMode("GLOBE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono transition-colors ${
              viewMode === "GLOBE"
                ? "bg-mars-600 text-white font-bold shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            3D Globe
          </button>
          <button
            onClick={() => setViewMode("TERRAIN")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono transition-colors ${
              viewMode === "TERRAIN"
                ? "bg-mars-600 text-white font-bold shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            3D MOLA Terrain
          </button>
        </div>

        {/* Vertical Exaggeration Slider (Terrain Mode) */}
        {viewMode === "TERRAIN" && (
          <div className="flex items-center gap-1.5 bg-surface-dark px-2.5 py-1.5 rounded-lg border border-surface-border">
            <span className="text-gray-400 font-mono text-[11px]">Relief:</span>
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

        {/* Orbit Toggle */}
        {viewMode === "GLOBE" && (
          <button
            onClick={() => setIsRotating(!isRotating)}
            className="flex items-center gap-1.5 bg-surface-dark px-2.5 py-1.5 rounded-lg border border-surface-border hover:text-white transition-colors"
          >
            {isRotating ? <Pause className="w-3.5 h-3.5 text-yellow-400" /> : <Play className="w-3.5 h-3.5 text-green-400" />}
            <span className="font-mono text-[11px]">{isRotating ? "Pause Orbit" : "Auto Orbit"}</span>
          </button>
        )}
      </div>

      {/* NASA Mars Trek 3D Navigation Gizmo (Right-Hand Dock) */}
      <div className="absolute top-20 right-4 z-20 flex flex-col items-center gap-2 bg-surface-darker/95 backdrop-blur-md border border-surface-border p-2 rounded-2xl shadow-hud">
        {/* Rotating Compass Indicator */}
        <button
          onClick={handleResetNorth}
          title="Click to Reset North orientation"
          className="relative w-10 h-10 rounded-full bg-surface-dark hover:bg-surface-card border border-surface-border flex items-center justify-center transition-all group"
        >
          <div
            style={{ transform: `rotate(${compassAngleDeg}deg)` }}
            className="transition-transform duration-100 flex flex-col items-center justify-center"
          >
            <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-red-500 mb-0.5" />
            <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[8px] border-t-gray-400" />
          </div>
        </button>

        {/* Altitude Readout */}
        <div className="text-[9px] font-mono text-cyan-300 font-bold text-center px-1.5 py-0.5 rounded bg-[#090d16] border border-cyan-900/40">
          {cameraAltitudeKm > 1000 ? `${(cameraAltitudeKm / 1000).toFixed(1)}k km` : `${cameraAltitudeKm} km`}
        </div>

        <div className="w-full h-px bg-surface-border my-0.5" />

        {/* NASA Mars Trek Horizon Tilt Toggle */}
        <button
          onClick={() => {
            const nextTilt = cameraTiltDeg === 0 ? 45 : 0;
            handleTiltChange(nextTilt);
          }}
          title={cameraTiltDeg === 0 ? "Switch to Oblique Horizon Flyover View (NASA Trek)" : "Switch to Nadir (Top-Down) View"}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono text-[10px] font-black transition-colors ${
            cameraTiltDeg > 0
              ? "bg-mars-600 border-mars-400 text-white shadow-[0_0_12px_rgba(240,90,54,0.6)]"
              : "bg-surface-dark hover:bg-surface-card border-surface-border text-gray-300 hover:text-white"
          }`}
        >
          {cameraTiltDeg > 0 ? "HORIZ" : "NADIR"}
        </button>

        {/* Zoom In / Out Buttons */}
        <button
          onClick={() => handleZoom(true)}
          title="Zoom In"
          className="w-8 h-8 rounded-lg bg-surface-dark hover:bg-surface-card border border-surface-border flex items-center justify-center text-gray-200 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(false)}
          title="Zoom Out"
          className="w-8 h-8 rounded-lg bg-surface-dark hover:bg-surface-card border border-surface-border flex items-center justify-center text-gray-200 hover:text-white transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (cameraRef.current) {
              cameraRef.current.position.set(0, 0.5, 4.8);
              setCameraAltitudeKm(5400);
              setCameraTiltDeg(0);
              handleResetNorth();
            }
          }}
          title="Reset Global View"
          className="w-8 h-8 rounded-lg bg-surface-dark hover:bg-surface-card border border-surface-border flex items-center justify-center text-gray-200 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Google Earth Hover Marker Card */}
      {hoveredFeature && !selectedPin && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-surface-darker/95 backdrop-blur-md border border-surface-border px-4 py-2.5 rounded-xl shadow-hud text-xs font-mono text-white animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-mars-500 animate-ping" />
            {hoveredFeature.name}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {formatMarsCoordinate({ lat: hoveredFeature.lat, lng: hoveredFeature.lng })} • Elev: {hoveredFeature.elevationMeters > 0 ? `+${hoveredFeature.elevationMeters}` : hoveredFeature.elevationMeters} m
          </div>
        </div>
      )}

      {/* Google Earth Landmark Card (Fly-To Result) */}
      {selectedPin && (
        <div className="absolute bottom-16 left-6 z-30 max-w-sm w-full bg-surface-darker/95 backdrop-blur-md border border-surface-border rounded-2xl p-4 sm:p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 text-xs">
          <div className="flex items-start justify-between border-b border-surface-border pb-2.5 mb-3">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold bg-mars-500/20 text-mars-400 border-mars-500/40">
                {selectedPin.category.replace(/_/g, " ")}
              </span>
              <h3 className="font-mono text-sm font-bold text-white mt-1.5">
                {selectedPin.name}
              </h3>
              <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                {formatMarsCoordinate({ lat: selectedPin.lat, lng: selectedPin.lng })}
              </div>
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-surface-border"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-gray-300 leading-relaxed mb-3">
            {selectedPin.description}
          </p>

          <div className="bg-surface-dark/70 border border-surface-border/60 p-2.5 rounded-lg mb-3 font-mono text-[11px] space-y-1">
            <div className="text-gray-400">
              <span className="text-gray-500">MOLA Elevation: </span>
              <span className="text-white font-bold">{selectedPin.elevationMeters} m (Areoid)</span>
            </div>
            {selectedPin.mineralogy && (
              <div className="text-purple-300">
                <span className="text-gray-500">CRISM Mineral: </span>
                <span>{selectedPin.mineralogy}</span>
              </div>
            )}
            <div className="text-gray-400">
              <span className="text-gray-500">Instruments: </span>
              <span>{selectedPin.instruments.join(", ")}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSelectCoordinate({ lat: selectedPin.lat, lng: selectedPin.lng });
                if (onSelectFeature) onSelectFeature(selectedPin);
              }}
              className="flex-1 bg-mars-600 hover:bg-mars-500 text-white font-mono font-semibold py-1.5 px-3 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              Inspect Telemetry
            </button>
            <a
              href={selectedPin.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-surface-dark hover:bg-surface-card border border-surface-border rounded-lg text-gray-300 hover:text-white transition-colors"
              title="Official NASA Archive"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Google Earth Altitude & Planetary Telemetry (Bottom-Left) */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none hidden sm:flex items-center gap-3 bg-surface-darker/80 backdrop-blur-md border border-surface-border px-3.5 py-1.5 rounded-xl text-xs font-mono text-gray-300 shadow-hud">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-telemetry-cyan" />
          <span>EYE ALTITUDE: {cameraAltitudeKm.toLocaleString()} KM</span>
        </div>
        <span className="text-gray-600">|</span>
        <div className="text-gray-400">
          PLANETARY RADIUS: 3,389.5 KM
        </div>
      </div>
    </div>
  );
}
