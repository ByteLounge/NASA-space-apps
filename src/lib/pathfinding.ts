/**
 * MARSCOPE Autonomous EVA Traversal and Pathfinding Engine
 * 
 * Algorithm: Multi-Objective A* on Martian DEM Surface Graph
 * Profiles:
 * 1. SAFEST: Minimizes slope gradient, roll/pitch hazard, and terrain roughness.
 * 2. FASTEST: Minimizes geodesic distance and estimated mission time.
 * 3. SCIENCE: Diverts traverse toward high-value CRISM mineralogy and geomorphic targets.
 * 
 * Labeling: MARSCOPE Analytical Traversal Simulation (Derived from NASA MOLA DEM)
 */

import { MarsCoordinate, marsDistanceKm, marsDistanceMeters, normalizeLongitude180 } from "./mars-coordinates";
import { getMarsElevation, analyzeTerrain, TerrainDifficulty } from "./mola-data";
import { SCIENCE_POINTS, computeScientificInterestScore } from "./science-data";

export type RouteStrategy = "SAFEST" | "FASTEST" | "SCIENCE";

export interface RouteWaypoint {
  lat: number;
  lng: number;
  elevationMeters: number;
  cumulativeDistanceKm: number;
  cumulativeTimeMinutes: number;
  segmentSlopeDeg: number;
  difficulty: TerrainDifficulty;
  hazardNote?: string;
}

export interface RouteResult {
  id: string;
  strategy: RouteStrategy;
  strategyName: string;
  strategyDescription: string;
  waypoints: RouteWaypoint[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalDurationFormatted: string;
  elevationGainMeters: number;
  elevationLossMeters: number;
  minElevationMeters: number;
  maxElevationMeters: number;
  maxSlopeDeg: number;
  averageSlopeDeg: number;
  terrainDifficulty: TerrainDifficulty;
  scienceScore: number;
  hazardWarnings: string[];
  scientificHighlights: string[];
  rationale: string;
  methodology: string;
}

interface GridNode {
  r: number;
  c: number;
  lat: number;
  lng: number;
  elevation: number;
  slope: number;
  roughness: number;
  scienceValue: number;
}

// Simple Priority Queue for A* search
class PriorityQueue<T> {
  private items: { item: T; priority: number }[] = [];

  push(item: T, priority: number) {
    this.items.push({ item, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  pop(): T | undefined {
    return this.items.shift()?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

/**
 * Computes speed on Mars (km/h) based on slope gradient (degrees).
 * Models astronaut EVA suited walking (baseline 2.5 km/h on flat ground)
 * Modified Tobler / Minetti hiking function under Martian 0.38g gravity.
 */
export function calculateMartianEVASpeed(slopeDegrees: number): number {
  const baseSpeed = 2.4; // km/h on flat Martian terrain
  if (slopeDegrees <= 0) {
    // Gentle downhill (slight speed increase up to -5°, then slowing for stability)
    return Math.max(1.2, baseSpeed * (1 + 0.05 * Math.sin((Math.abs(slopeDegrees) * Math.PI) / 180)));
  }
  // Uphill: exponential metabolic decay
  const speed = baseSpeed * Math.exp(-0.09 * slopeDegrees);
  return Math.max(0.4, speed);
}

/**
 * Executes multi-objective A* traversal across the Martian DEM.
 */
export function calculateRoute(
  start: MarsCoordinate,
  destination: MarsCoordinate,
  strategy: RouteStrategy,
  intermediateWaypoints: MarsCoordinate[] = []
): RouteResult {
  // If there are intermediate waypoints, chain the segments
  const allStops = [start, ...intermediateWaypoints, destination];
  let combinedWaypoints: RouteWaypoint[] = [];
  let totalDistKm = 0;
  let totalTimeMins = 0;
  let totalGain = 0;
  let totalLoss = 0;
  let maxSlopeOverall = 0;
  let slopeSum = 0;
  let slopeCount = 0;

  for (let s = 0; s < allStops.length - 1; s++) {
    const segStart = allStops[s];
    const segDest = allStops[s + 1];
    const segResult = computeSingleSegment(segStart, segDest, strategy, s === 0);

    // Merge segment waypoints (avoid duplicate joint node)
    if (combinedWaypoints.length > 0 && segResult.length > 0) {
      segResult.shift();
    }

    for (const wp of segResult) {
      const adjustedWp: RouteWaypoint = {
        ...wp,
        cumulativeDistanceKm: Math.round((totalDistKm + wp.cumulativeDistanceKm) * 100) / 100,
        cumulativeTimeMinutes: Math.round(totalTimeMins + wp.cumulativeTimeMinutes),
      };
      combinedWaypoints.push(adjustedWp);
    }

    if (segResult.length > 0) {
      const last = segResult[segResult.length - 1];
      totalDistKm += last.cumulativeDistanceKm;
      totalTimeMins += last.cumulativeTimeMinutes;
    }
  }

  // Calculate statistics over the combined path
  let minElev = Infinity;
  let maxElev = -Infinity;
  const warnings: string[] = [];
  const scienceHighlights: string[] = [];

  for (let i = 0; i < combinedWaypoints.length; i++) {
    const wp = combinedWaypoints[i];
    if (wp.elevationMeters < minElev) minElev = wp.elevationMeters;
    if (wp.elevationMeters > maxElev) maxElev = wp.elevationMeters;

    if (i > 0) {
      const prev = combinedWaypoints[i - 1];
      const dz = wp.elevationMeters - prev.elevationMeters;
      if (dz > 0) totalGain += dz;
      else totalLoss += Math.abs(dz);

      slopeSum += wp.segmentSlopeDeg;
      slopeCount++;
      if (wp.segmentSlopeDeg > maxSlopeOverall) {
        maxSlopeOverall = wp.segmentSlopeDeg;
      }

      if (wp.segmentSlopeDeg >= 15) {
        warnings.push(`Steep incline (${wp.segmentSlopeDeg.toFixed(1)}°) at km ${wp.cumulativeDistanceKm.toFixed(1)}`);
      }
    }
  }

  const avgSlope = slopeCount > 0 ? Math.round((slopeSum / slopeCount) * 10) / 10 : 0;

  // Evaluate overall terrain difficulty
  let difficulty: TerrainDifficulty = "LOW";
  if (maxSlopeOverall >= 20) difficulty = "EXTREME";
  else if (maxSlopeOverall >= 12 || avgSlope >= 8) difficulty = "HIGH";
  else if (maxSlopeOverall >= 6 || avgSlope >= 3.5) difficulty = "MODERATE";

  // Scientific score evaluation for the route
  let avgScience = 0;
  for (const wp of combinedWaypoints) {
    const sc = computeScientificInterestScore({ lat: wp.lat, lng: wp.lng });
    avgScience += sc.score;
    if (sc.nearestFeature && sc.nearestFeature.distanceKm < 1.5) {
      const highlight = `${sc.nearestFeature.name} (${sc.nearestFeature.category}): ${sc.nearestFeature.scientificRelevance}`;
      if (!scienceHighlights.includes(highlight)) {
        scienceHighlights.push(highlight);
      }
    }
  }
  const routeScienceScore = Math.round(avgScience / Math.max(1, combinedWaypoints.length));

  // Format duration
  const hours = Math.floor(totalTimeMins / 60);
  const minutes = Math.round(totalTimeMins % 60);
  const totalDurationFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  // Rationales and Strategy definitions
  const strategyInfo: Record<RouteStrategy, { name: string; desc: string; rationale: string }> = {
    SAFEST: {
      name: "Safest Traverse",
      desc: "Minimizes slope gradient and roll/pitch hazards, accepting longer distance to avoid treacherous terrain.",
      rationale: `Selected path restricts maximum inclination to ${maxSlopeOverall.toFixed(1)}° (avg ${avgSlope.toFixed(1)}°). Traverses along natural contours and low-roughness corridors to protect EVA life-support suit joints and rover wheel traction.`,
    },
    FASTEST: {
      name: "Fastest Direct Traverse",
      desc: "Prioritizes minimal mission time and direct geodesic distance, traversing moderate inclines where viable.",
      rationale: `Direct trajectory cutting travel time to ${totalDurationFormatted} across ${totalDistKm.toFixed(2)} km. Ascends manageable grades (max ${maxSlopeOverall.toFixed(1)}°) to achieve earliest point-to-point arrival.`,
    },
    SCIENCE: {
      name: "High-Value Science Traverse",
      desc: "Optimizes scientific exploration yield by routing through verified CRISM mineral signatures and geological units.",
      rationale: `Traverse diverts toward astrobiologically significant units, yielding a Science Score of ${routeScienceScore}/100. Encompasses ${scienceHighlights.length} primary geological targets while keeping slopes within safe margins.`,
    },
  };

  return {
    id: `route-${strategy.toLowerCase()}-${Date.now()}`,
    strategy,
    strategyName: strategyInfo[strategy].name,
    strategyDescription: strategyInfo[strategy].desc,
    waypoints: combinedWaypoints,
    totalDistanceKm: Math.round(totalDistKm * 100) / 100,
    totalDurationMinutes: Math.round(totalTimeMins),
    totalDurationFormatted,
    elevationGainMeters: Math.round(totalGain),
    elevationLossMeters: Math.round(totalLoss),
    minElevationMeters: Math.round(minElev),
    maxElevationMeters: Math.round(maxElev),
    maxSlopeDeg: Math.round(maxSlopeOverall * 10) / 10,
    averageSlopeDeg: avgSlope,
    terrainDifficulty: difficulty,
    scienceScore: routeScienceScore,
    hazardWarnings: Array.from(new Set(warnings)).slice(0, 4),
    scientificHighlights: scienceHighlights.slice(0, 4),
    rationale: strategyInfo[strategy].rationale,
    methodology: "MARSCOPE Multi-Objective A* Graph Solver: Cost = d + w_slope*(slope/10)^p + w_rough*roughness - w_sci*science_proximity.",
  };
}

/**
 * Computes a single A* path between two points on the Martian DEM.
 */
function computeSingleSegment(
  start: MarsCoordinate,
  destination: MarsCoordinate,
  strategy: RouteStrategy,
  isFirstSegment: boolean
): RouteWaypoint[] {
  const directDistKm = marsDistanceKm(start, destination);

  // If distance is extremely small (< 200m), return direct line
  if (directDistKm < 0.2) {
    const zStart = getMarsElevation(start);
    const zDest = getMarsElevation(destination);
    const slope = Math.min(60, (Math.abs(zDest - zStart) / Math.max(1, directDistKm * 1000)) * (180 / Math.PI));
    const speed = calculateMartianEVASpeed(slope);
    const timeMins = (directDistKm / speed) * 60;
    
    return [
      {
        lat: start.lat,
        lng: normalizeLongitude180(start.lng),
        elevationMeters: zStart,
        cumulativeDistanceKm: 0,
        cumulativeTimeMinutes: 0,
        segmentSlopeDeg: slope,
        difficulty: slope > 15 ? "HIGH" : "LOW",
      },
      {
        lat: destination.lat,
        lng: normalizeLongitude180(destination.lng),
        elevationMeters: zDest,
        cumulativeDistanceKm: directDistKm,
        cumulativeTimeMinutes: timeMins,
        segmentSlopeDeg: slope,
        difficulty: slope > 15 ? "HIGH" : "LOW",
      }
    ];
  }

  // Construct search grid bounds with 35% margin
  const latMin = Math.min(start.lat, destination.lat);
  const latMax = Math.max(start.lat, destination.lat);
  const lngMin = Math.min(normalizeLongitude180(start.lng), normalizeLongitude180(destination.lng));
  const lngMax = Math.max(normalizeLongitude180(start.lng), normalizeLongitude180(destination.lng));

  const latSpan = Math.max(0.015, latMax - latMin);
  const lngSpan = Math.max(0.015, lngMax - lngMin);

  const marginLat = latSpan * 0.4;
  const marginLng = lngSpan * 0.4;

  const gridLatMin = latMin - marginLat;
  const gridLatMax = latMax + marginLat;
  const gridLngMin = lngMin - marginLng;
  const gridLngMax = lngMax + marginLng;

  const rows = 29;
  const cols = 29;

  // Build grid
  const grid: GridNode[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    const lat = gridLatMin + (r / (rows - 1)) * (gridLatMax - gridLatMin);
    for (let c = 0; c < cols; c++) {
      const lng = gridLngMin + (c / (cols - 1)) * (gridLngMax - gridLngMin);
      const coord = { lat, lng };
      const analysis = analyzeTerrain(coord);
      const sci = computeScientificInterestScore(coord);

      grid[r][c] = {
        r,
        c,
        lat,
        lng,
        elevation: analysis.elevationMeters,
        slope: analysis.slopeDegrees,
        roughness: analysis.roughnessMeters,
        scienceValue: sci.score,
      };
    }
  }

  // Find start and target grid cells
  const getNearestCell = (coord: MarsCoordinate): { r: number; c: number } => {
    const lng = normalizeLongitude180(coord.lng);
    const r = Math.round(((coord.lat - gridLatMin) / (gridLatMax - gridLatMin)) * (rows - 1));
    const c = Math.round(((lng - gridLngMin) / (gridLngMax - gridLngMin)) * (cols - 1));
    return {
      r: Math.max(0, Math.min(rows - 1, r)),
      c: Math.max(0, Math.min(cols - 1, c)),
    };
  };

  const startCell = getNearestCell(start);
  const targetCell = getNearestCell(destination);

  // Strategy cost weights
  let slopeWeight = 2.0;
  let roughnessWeight = 1.5;
  let scienceReward = 0.0;
  let maxAllowableSlope = 25; // degrees

  if (strategy === "SAFEST") {
    slopeWeight = 6.0;
    roughnessWeight = 4.0;
    scienceReward = 0.0;
    maxAllowableSlope = 14.0;
  } else if (strategy === "FASTEST") {
    slopeWeight = 0.8;
    roughnessWeight = 0.5;
    scienceReward = 0.0;
    maxAllowableSlope = 22.0;
  } else if (strategy === "SCIENCE") {
    slopeWeight = 2.0;
    roughnessWeight = 1.0;
    scienceReward = 3.5;
    maxAllowableSlope = 16.0;
  }

  // A* Search setup
  const gScore = new Map<string, number>();
  const cameFrom = new Map<string, GridNode>();
  const openSet = new PriorityQueue<GridNode>();

  const nodeKey = (n: GridNode) => `${n.r},${n.c}`;
  const startNode = grid[startCell.r][startCell.c];
  const targetNode = grid[targetCell.r][targetCell.c];

  gScore.set(nodeKey(startNode), 0);
  openSet.push(startNode, 0);

  const neighbors = [
    [-1, 0], [1, 0], [0, -1], [0, 1], // Cardinal
    [-1, -1], [-1, 1], [1, -1], [1, 1], // Diagonals
  ];

  let found = false;

  while (!openSet.isEmpty()) {
    const current = openSet.pop()!;
    if (current.r === targetNode.r && current.c === targetNode.c) {
      found = true;
      break;
    }

    const currentKey = nodeKey(current);
    const currentG = gScore.get(currentKey) ?? Infinity;

    for (const [dr, dc] of neighbors) {
      const nr = current.r + dr;
      const nc = current.c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

      const neighbor = grid[nr][nc];
      const neighborKey = nodeKey(neighbor);

      // Calculate physical distance between nodes
      const horizDistKm = marsDistanceKm(
        { lat: current.lat, lng: current.lng },
        { lat: neighbor.lat, lng: neighbor.lng }
      );
      const dzMeters = Math.abs(neighbor.elevation - current.elevation);
      const stepSlopeDeg = Math.min(65, (dzMeters / Math.max(1, horizDistKm * 1000)) * (180 / Math.PI));

      // Impassable cliff check
      if (stepSlopeDeg > maxAllowableSlope || neighbor.slope > maxAllowableSlope + 5) {
        continue;
      }

      // Movement Cost Model
      // cost = distance * (1 + slopePenalty + roughnessPenalty) - scienceReward
      const slopePenalty = Math.pow(stepSlopeDeg / 5.0, 2.0) * slopeWeight;
      const roughnessPenalty = (neighbor.roughness / 5.0) * roughnessWeight;
      const reward = (neighbor.scienceValue / 100.0) * scienceReward * horizDistKm;

      const stepCost = Math.max(0.1, horizDistKm * (1.0 + slopePenalty + roughnessPenalty) - reward);
      const tentativeG = currentG + stepCost;

      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeG);

        // Heuristic: Estimated remaining Euclidean distance to target
        const h = marsDistanceKm(
          { lat: neighbor.lat, lng: neighbor.lng },
          { lat: targetNode.lat, lng: targetNode.lng }
        );
        openSet.push(neighbor, tentativeG + h);
      }
    }
  }

  // Reconstruct path
  const pathNodes: GridNode[] = [];
  if (found) {
    let curr: GridNode | undefined = targetNode;
    while (curr) {
      pathNodes.unshift(curr);
      curr = cameFrom.get(nodeKey(curr));
    }
  } else {
    // Graceful fallback: interpolate direct line with slight safe curve if A* hit a wall
    const steps = 15;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = start.lat + (destination.lat - start.lat) * t;
      const lng = start.lng + (destination.lng - start.lng) * t;
      const elev = getMarsElevation({ lat, lng });
      const analysis = analyzeTerrain({ lat, lng });
      pathNodes.push({
        r: 0,
        c: 0,
        lat,
        lng,
        elevation: elev,
        slope: analysis.slopeDegrees,
        roughness: analysis.roughnessMeters,
        scienceValue: 30,
      });
    }
  }

  // Ensure exact start and destination points are anchored at the ends
  if (pathNodes.length > 0) {
    pathNodes[0].lat = start.lat;
    pathNodes[0].lng = normalizeLongitude180(start.lng);
    pathNodes[0].elevation = getMarsElevation(start);

    pathNodes[pathNodes.length - 1].lat = destination.lat;
    pathNodes[pathNodes.length - 1].lng = normalizeLongitude180(destination.lng);
    pathNodes[pathNodes.length - 1].elevation = getMarsElevation(destination);
  }

  // Convert pathNodes into RouteWaypoint array with realistic physics
  const waypoints: RouteWaypoint[] = [];
  let cumDist = 0;
  let cumTime = 0;

  for (let i = 0; i < pathNodes.length; i++) {
    const node = pathNodes[i];
    let segSlope = node.slope;

    if (i > 0) {
      const prev = pathNodes[i - 1];
      const dKm = marsDistanceKm(
        { lat: prev.lat, lng: prev.lng },
        { lat: node.lat, lng: node.lng }
      );
      cumDist += dKm;

      const dz = Math.abs(node.elevation - prev.elevation);
      segSlope = Math.min(50, (dz / Math.max(1, dKm * 1000)) * (180 / Math.PI));
      const speed = calculateMartianEVASpeed(segSlope);
      cumTime += (dKm / speed) * 60;
    }

    let diff: TerrainDifficulty = "LOW";
    if (segSlope >= 18) diff = "EXTREME";
    else if (segSlope >= 12) diff = "HIGH";
    else if (segSlope >= 5) diff = "MODERATE";

    waypoints.push({
      lat: Math.round(node.lat * 100000) / 100000,
      lng: Math.round(normalizeLongitude180(node.lng) * 100000) / 100000,
      elevationMeters: Math.round(node.elevation),
      cumulativeDistanceKm: Math.round(cumDist * 100) / 100,
      cumulativeTimeMinutes: Math.round(cumTime),
      segmentSlopeDeg: Math.round(segSlope * 10) / 10,
      difficulty: diff,
    });
  }

  return waypoints;
}

/**
 * Generates all 3 candidate exploration routes (Safest, Fastest, Science) for side-by-side comparison.
 */
export function generateRouteComparison(
  start: MarsCoordinate,
  destination: MarsCoordinate,
  waypoints: MarsCoordinate[] = []
): {
  safest: RouteResult;
  fastest: RouteResult;
  science: RouteResult;
} {
  const safest = calculateRoute(start, destination, "SAFEST", waypoints);
  const fastest = calculateRoute(start, destination, "FASTEST", waypoints);
  const science = calculateRoute(start, destination, "SCIENCE", waypoints);

  return { safest, fastest, science };
}
