/**
 * MARSCOPE Mission Planner and Operational EVA Brief Generator
 * 
 * Generates official mission briefings adhering to planetary EVA guidelines
 * (NASA EVA Exploration Standards, PLSS consumable margins, terrain hazard matrices).
 * 
 * Clearly distinguishes NASA verified observations from MARSCOPE analytical calculations.
 */

import { RouteResult } from "./pathfinding";
import { formatMarsCoordinate } from "./mars-coordinates";

export interface MissionParameters {
  missionName: string;
  crewSize: number;
  maxEvaHours: number;
  maxDistanceKm: number;
  primaryObjective: string;
  traversalMode: "SUITED_FOOT" | "UNPRESSURIZED_ROVER" | "PRESSURIZED_ROVER";
}

export interface PlssConsumableEstimate {
  oxygenConsumptionLiters: number;
  oxygenMarginMinutes: number;
  batteryReservePercent: number;
  waterCoolingLiters: number;
  status: "GO" | "MARGINAL" | "NO_GO";
  reason: string;
}

export interface MissionBrief {
  id: string;
  timestamp: string;
  missionName: string;
  crewSize: number;
  traversalMode: string;
  objective: string;
  startLocation: string;
  destinationLocation: string;
  totalDistanceKm: number;
  estimatedDuration: string;
  terrainDifficulty: string;
  averageSlope: string;
  maxSlope: string;
  scienceValueScore: number;
  scienceRating: string;
  operationalStatus: "GO" | "CAUTION" | "NO_GO";
  operationalSummary: string;
  plssConsumables: PlssConsumableEstimate;
  keyRisks: string[];
  contingencyProtocol: string;
  scientificRecommendations: string[];
  dataAttribution: string[];
  disclaimer: string;
}

export function generateMissionBrief(
  params: MissionParameters,
  selectedRoute: RouteResult
): MissionBrief {
  const durationHours = selectedRoute.totalDurationMinutes / 60;
  
  // PLSS Consumables calculation (Portable Life Support System)
  // Average astronaut at 250 W metabolic rate consumes ~1.0 - 1.4 L O2/min under EVA load
  const isRover = params.traversalMode !== "SUITED_FOOT";
  const metabolicFactor = isRover ? 0.7 : (1.0 + (selectedRoute.averageSlopeDeg / 10) * 0.4);
  const o2RateLitersPerMin = 1.15 * metabolicFactor;
  const o2Consumed = Math.round(selectedRoute.totalDurationMinutes * o2RateLitersPerMin);
  
  // Safety rule: Mission must retain at least 45 minutes of reserve O2
  const maxAllowableMinutes = params.maxEvaHours * 60;
  const marginMinutes = Math.round(maxAllowableMinutes - selectedRoute.totalDurationMinutes);

  let plssStatus: PlssConsumableEstimate["status"] = "GO";
  let plssReason = "Sufficient consumables with nominal 45+ minute PLSS reserve.";

  if (marginMinutes < 0) {
    plssStatus = "NO_GO";
    plssReason = `Traverse duration (${selectedRoute.totalDurationFormatted}) exceeds designated maximum EVA window (${params.maxEvaHours}h).`;
  } else if (marginMinutes < 45) {
    plssStatus = "MARGINAL";
    plssReason = `Emergency reserve margin (${marginMinutes}m) is below standard 45-minute flight flight safety threshold.`;
  }

  // Determine overall Go / Caution / No-Go
  let operationalStatus: MissionBrief["operationalStatus"] = "GO";
  if (plssStatus === "NO_GO" || selectedRoute.maxSlopeDeg > 22) {
    operationalStatus = "NO_GO";
  } else if (plssStatus === "MARGINAL" || selectedRoute.terrainDifficulty === "HIGH" || selectedRoute.hazardWarnings.length >= 2) {
    operationalStatus = "CAUTION";
  }

  // Format start and dest
  const startWp = selectedRoute.waypoints[0];
  const destWp = selectedRoute.waypoints[selectedRoute.waypoints.length - 1];

  const startLoc = startWp 
    ? formatMarsCoordinate({ lat: startWp.lat, lng: startWp.lng }) 
    : "Coordinates Undefined";
  const destLoc = destWp 
    ? formatMarsCoordinate({ lat: destWp.lat, lng: destWp.lng }) 
    : "Coordinates Undefined";

  // Synthesize Key Risks
  const keyRisks: string[] = [...selectedRoute.hazardWarnings];
  if (selectedRoute.elevationGainMeters > 300) {
    keyRisks.push(`Substantial vertical climb (+${selectedRoute.elevationGainMeters} m) increasing cardiovascular strain.`);
  }
  if (marginMinutes < 60 && marginMinutes >= 0) {
    keyRisks.push(`Tight consumables timeline: ${marginMinutes} minutes remaining in nominal EVA budget.`);
  }
  if (keyRisks.length === 0) {
    keyRisks.push("Nominal flat terrain; standard low-level Martian dust abrasion and wheel slip risk.");
  }

  // Contingency protocol
  let contingency = "In the event of suit telemetry anomaly or unpredicted terrain blockage, abort toward nearest flat waypoint and execute 180° back-azimuth return along the pre-cleared outbound path.";
  if (selectedRoute.strategy === "SCIENCE") {
    contingency = "If time exceeds 75% of primary EVA window prior to reaching the final science station, bypass secondary outcrops and switch directly to the return vector.";
  }

  // Scientific Recommendations
  const sciRecs: string[] = [
    ...selectedRoute.scientificHighlights,
    "Deploy handheld Raman/XRF spectrometer at major geological contacts.",
    "Photograph sedimentary cross-stratification with millimeter-scale macroscopic camera.",
    "Prioritize sealed hermetic core sampling of light-toned hydrated sulfate or clay facies.",
  ];

  return {
    id: `brief-${Date.now()}`,
    timestamp: new Date().toISOString(),
    missionName: params.missionName || "Ares EVA Reconnaissance",
    crewSize: params.crewSize,
    traversalMode: params.traversalMode === "SUITED_FOOT" ? "Suited Foot Exploration" : "Pressurized Surface Rover",
    objective: params.primaryObjective || "Geological survey and astrobiological sample collection",
    startLocation: startLoc,
    destinationLocation: destLoc,
    totalDistanceKm: selectedRoute.totalDistanceKm,
    estimatedDuration: selectedRoute.totalDurationFormatted,
    terrainDifficulty: selectedRoute.terrainDifficulty,
    averageSlope: `${selectedRoute.averageSlopeDeg.toFixed(1)}°`,
    maxSlope: `${selectedRoute.maxSlopeDeg.toFixed(1)}°`,
    scienceValueScore: selectedRoute.scienceScore,
    scienceRating: selectedRoute.scienceScore > 80 ? "EXCEPTIONAL" : selectedRoute.scienceScore > 60 ? "HIGH" : "NOMINAL",
    operationalStatus,
    operationalSummary: operationalStatus === "GO"
      ? "Traverse parameters are within certified safety limits. Nominal consumables and acceptable slopes."
      : operationalStatus === "CAUTION"
      ? "Mission approved with operational constraints. Heightened vigilance required on high-slope or tight-consumable segments."
      : "Mission parameters violate safety envelope. Reduce planned distance or select the SAFEST traverse strategy.",
    plssConsumables: {
      oxygenConsumptionLiters: o2Consumed,
      oxygenMarginMinutes: Math.max(0, marginMinutes),
      batteryReservePercent: Math.max(15, Math.round(100 - (durationHours / params.maxEvaHours) * 70)),
      waterCoolingLiters: Math.round(durationHours * 0.85 * 10) / 10,
      status: plssStatus,
      reason: plssReason,
    },
    keyRisks: keyRisks.slice(0, 4),
    contingencyProtocol: contingency,
    scientificRecommendations: sciRecs.slice(0, 4),
    dataAttribution: [
      "NASA Mars Global Surveyor (MGS) MOLA MEGDR Topography",
      "NASA Mars Reconnaissance Orbiter (MRO) CRISM & HiRISE Science Teams",
      "USGS Astrogeology Mars Digital Image Mosaics",
    ],
    disclaimer: "MARSCOPE SIMULATED ESTIMATE: Traversal metrics, metabolic rates, and difficulty ratings are analytical models computed from public NASA orbital datasets. Not official NASA mission flight rules.",
  };
}
