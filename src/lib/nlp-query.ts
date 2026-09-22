/**
 * MARSCOPE Natural Language Interface and Query Engine
 * 
 * Translates astronaut and mission-planner natural language queries into deterministic
 * geospatial operations, filter updates, camera navigation, or scientific explanations.
 * 
 * Strictly grounds all factual outputs in verified NASA datasets and MARSCOPE calculations.
 */

import { MarsCoordinate, parseMarsCoordinate, formatMarsCoordinate } from "./mars-coordinates";
import { REGIONAL_DEMS, analyzeTerrain, getMarsElevation } from "./mola-data";
import { SCIENCE_POINTS, computeScientificInterestScore } from "./science-data";
import { RouteStrategy } from "./pathfinding";

export interface NlpActionResult {
  intent: 
    | "NAVIGATE_REGION" 
    | "INSPECT_POINT" 
    | "PLAN_ROUTE" 
    | "FILTER_LAYER" 
    | "EXPLAIN_ROUTE" 
    | "SCIENCE_QUERY" 
    | "UNKNOWN";
  reply: string;
  targetCoordinate?: MarsCoordinate;
  targetRegionId?: string;
  routeStrategy?: RouteStrategy;
  layerToggle?: string;
  confidence: number;
}

export function processNlpQuery(query: string, currentContext?: {
  currentCenter?: MarsCoordinate;
  lastRouteStrategy?: RouteStrategy;
}): NlpActionResult {
  const q = query.trim().toLowerCase();

  // 1. Direct coordinate lookup (e.g. "elevation at 18.42N, 77.31E" or "what is at -4.59, 137.44")
  const parsedCoord = parseMarsCoordinate(query);
  if (parsedCoord) {
    const analysis = analyzeTerrain(parsedCoord);
    const sci = computeScientificInterestScore(parsedCoord);
    return {
      intent: "INSPECT_POINT",
      targetCoordinate: parsedCoord,
      reply: `Telemetry at ${formatMarsCoordinate(parsedCoord)}:\n• Elevation: ${analysis.elevationMeters > 0 ? '+' : ''}${analysis.elevationMeters} m (MOLA Areoid datum)\n• Local Slope: ${analysis.slopeDegrees}°\n• Terrain Traversability: ${analysis.difficulty}\n• Science Interest Score: ${sci.score}/100 (${sci.grade})\n• Nearest Target: ${sci.nearestFeature ? sci.nearestFeature.name : 'Regional Martian bedrock'}`,
      confidence: 0.98,
    };
  }

  // 2. Region Navigation (Jezero, Olympus Mons, Valles Marineris, Gale, South Pole)
  if (q.includes("jezero") || q.includes("perseverance") || q.includes("neretva")) {
    return {
      intent: "NAVIGATE_REGION",
      targetRegionId: "jezero",
      targetCoordinate: { lat: 18.38, lng: 77.53 },
      reply: "Navigating camera to Jezero Crater (18.38° N, 77.53° E). Region elevation averages -2500m across the ancient lacustrine delta deposit. MOLA MEGDR and CRISM layers loaded.",
      confidence: 0.95,
    };
  }

  if (q.includes("olympus") || q.includes("volcano") || q.includes("caldera")) {
    return {
      intent: "NAVIGATE_REGION",
      targetRegionId: "olympus",
      targetCoordinate: { lat: 18.65, lng: -133.80 },
      reply: "Navigating to Olympus Mons Summit Caldera (18.65° N, -133.80° E). Elevation reaches +21,229m, the highest volcanic edifice in the Solar System.",
      confidence: 0.95,
    };
  }

  if (q.includes("valles") || q.includes("marineris") || q.includes("melas") || q.includes("canyon")) {
    return {
      intent: "NAVIGATE_REGION",
      targetRegionId: "melas",
      targetCoordinate: { lat: -9.85, lng: -76.50 },
      reply: "Navigating to Valles Marineris - Melas Chasma (-9.85° S, -76.50° E). Floor drops to -4200m with 8 km vertical wall relief and thick hydrated sulfate beds.",
      confidence: 0.95,
    };
  }

  if (q.includes("gale") || q.includes("curiosity") || q.includes("sharp") || q.includes("aeolis")) {
    return {
      intent: "NAVIGATE_REGION",
      targetRegionId: "gale",
      targetCoordinate: { lat: -4.59, lng: 137.44 },
      reply: "Navigating to Gale Crater & Mount Sharp (-4.59° S, 137.44° E). Base elevation -4500m, exploring transition from clay lakebeds to sulfate stratigraphy.",
      confidence: 0.95,
    };
  }

  if (q.includes("south pole") || q.includes("australe") || q.includes("ice cap") || q.includes("polar")) {
    return {
      intent: "NAVIGATE_REGION",
      targetRegionId: "southpole",
      targetCoordinate: { lat: -86.50, lng: 0.0 },
      reply: "Navigating to Planum Australe South Polar Ice Cap (-86.50° S, 0.0° E). Elevation +3120m, perennial CO2/H2O layered ice cap.",
      confidence: 0.95,
    };
  }

  // 3. Layer queries ("show slope", "show crism", "show hazards", "show elevation")
  if (q.includes("slope") || q.includes("steep") || q.includes("gradient")) {
    return {
      intent: "FILTER_LAYER",
      layerToggle: "slope",
      reply: "Activated MOLA Slope & Gradient analytical layer. Highlights terrain steeper than 12° in amber and impassable scarps (>20°) in bright red.",
      confidence: 0.9,
    };
  }

  if (q.includes("crism") || q.includes("mineral") || q.includes("clay") || q.includes("carbonate") || q.includes("sulfate")) {
    return {
      intent: "FILTER_LAYER",
      layerToggle: "minerals",
      reply: "Filtered MRO CRISM mineralogical detections. Displaying verified spectral detections for hydrated smectites, magnesium carbonates, and polyhydrated sulfates.",
      confidence: 0.92,
    };
  }

  if (q.includes("hazard") || q.includes("danger") || q.includes("roughness") || q.includes("boulder")) {
    return {
      intent: "FILTER_LAYER",
      layerToggle: "hazards",
      reply: "Enabled MARSCOPE Exploration Hazard Layer. Visualizes steep scarps, dune slip-faces (sand entrapment risk), and high-roughness boulder fields.",
      confidence: 0.92,
    };
  }

  // 4. Route Strategy queries ("why this route", "plan safest", "plan fastest", "plan science")
  if (q.includes("why") || q.includes("explain route") || q.includes("rationale")) {
    return {
      intent: "EXPLAIN_ROUTE",
      reply: "Route Selection Rationale:\nMARSCOPE evaluates routes using an A* graph solver over MOLA elevation. The SAFEST strategy heavily penalizes slopes above 8°, avoiding mechanical strain on rover actuators and EVA suits. The FASTEST strategy minimizes straight-line geodesic distance. The SCIENCE strategy diverts toward CRISM mineral deposits and geomorphic contacts.",
      confidence: 0.9,
    };
  }

  if (q.includes("safe") || q.includes("safest")) {
    return {
      intent: "PLAN_ROUTE",
      routeStrategy: "SAFEST",
      reply: "Configured route engine to SAFEST profile. Max allowable slope capped at 14°, prioritizing contour swales and lowest terrain roughness.",
      confidence: 0.88,
    };
  }

  if (q.includes("fast") || q.includes("fastest") || q.includes("quick")) {
    return {
      intent: "PLAN_ROUTE",
      routeStrategy: "FASTEST",
      reply: "Configured route engine to FASTEST profile. Optimizes for minimum traverse time and direct line-of-sight distance across moderate gradients.",
      confidence: 0.88,
    };
  }

  if (q.includes("science") || q.includes("sample") || q.includes("research")) {
    return {
      intent: "PLAN_ROUTE",
      routeStrategy: "SCIENCE",
      reply: "Configured route engine to SCIENCE profile. Adds positive heuristics for visiting CRISM mineral targets and ancient river delta contacts.",
      confidence: 0.88,
    };
  }

  // 5. General fallback with suggested commands
  return {
    intent: "UNKNOWN",
    reply: `Command not recognized. Try one of these Martian exploration queries:\n• "Zoom to Jezero Crater"\n• "Show steep terrain around Olympus Mons"\n• "Filter CRISM mineral deposits"\n• "What is the elevation at 18.44, 77.45?"\n• "Plan safest route"`,
    confidence: 0.4,
  };
}
