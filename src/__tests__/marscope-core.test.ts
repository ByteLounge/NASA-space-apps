import { describe, it, expect } from "vitest";
import {
  marsDistanceKm,
  marsBearing,
  normalizeLongitude180,
  normalizeLongitude360,
  parseMarsCoordinate,
  formatMarsCoordinate,
  MARS_RADIUS_KM,
} from "../lib/mars-coordinates";
import {
  getMarsElevation,
  analyzeTerrain,
  findRegionalDEM,
} from "../lib/mola-data";
import {
  computeScientificInterestScore,
  SCIENCE_POINTS,
  DATA_SOURCES_REGISTRY,
} from "../lib/science-data";
import {
  calculateMartianEVASpeed,
  calculateRoute,
  generateRouteComparison,
} from "../lib/pathfinding";
import { generateMissionBrief } from "../lib/mission-brief";
import { processNlpQuery } from "../lib/nlp-query";

describe("Mars Coordinates and Planetary Geodesy", () => {
  it("normalizes longitudes to [-180, 180] and [0, 360]", () => {
    expect(normalizeLongitude180(190)).toBe(-170);
    expect(normalizeLongitude180(-190)).toBe(170);
    expect(normalizeLongitude180(77.45)).toBe(77.45);

    expect(normalizeLongitude360(-10)).toBe(350);
    expect(normalizeLongitude360(370)).toBe(10);
    expect(normalizeLongitude360(77.45)).toBe(77.45);
  });

  it("calculates accurate great circle distance using Mars radius 3389.5 km", () => {
    // 1 degree along Martian equator should be ~ 59.16 km
    const p1 = { lat: 0, lng: 0 };
    const p2 = { lat: 0, lng: 1 };
    const dist = marsDistanceKm(p1, p2);
    const expected = (2 * Math.PI * MARS_RADIUS_KM) / 360;
    expect(Math.abs(dist - expected)).toBeLessThan(0.01);
  });

  it("computes cardinal bearings accurately", () => {
    const pNorth = { lat: 10, lng: 0 };
    const pSouth = { lat: 0, lng: 0 };
    expect(marsBearing(pSouth, pNorth)).toBeCloseTo(0, 1); // Bearing North is 0°
  });

  it("correctly parses directional and decimal Mars coordinates", () => {
    const c1 = parseMarsCoordinate("18.38 N, 77.58 E");
    expect(c1).not.toBeNull();
    expect(c1?.lat).toBeCloseTo(18.38);
    expect(c1?.lng).toBeCloseTo(77.58);

    const c2 = parseMarsCoordinate("-9.85, -76.50");
    expect(c2).not.toBeNull();
    expect(c2?.lat).toBeCloseTo(-9.85);
    expect(c2?.lng).toBeCloseTo(-76.50);
  });
});

describe("MOLA Topography and Terrain Analysis", () => {
  it("samples elevation within Jezero Crater regional DEM accurately", () => {
    const octavia = { lat: 18.444, lng: 77.451 };
    const dem = findRegionalDEM(octavia);
    expect(dem).not.toBeNull();
    expect(dem?.id).toBe("jezero");

    const elev = getMarsElevation(octavia);
    // Jezero floor is ~ -2500m to -2600m
    expect(elev).toBeLessThan(-2000);
    expect(elev).toBeGreaterThan(-2700);
  });

  it("identifies Olympus Mons caldera rim peak altitude above 20,000 meters", () => {
    // Caldera rim peak is at ~19.00°N, -133.80°E (dCenter = 0.35)
    const rimPeak = { lat: 19.00, lng: -133.80 };
    const elevRim = getMarsElevation(rimPeak);
    expect(elevRim).toBeGreaterThan(20000);

    // Caldera sunken floor is ~18,200 meters
    const floor = { lat: 18.65, lng: -133.80 };
    const elevFloor = getMarsElevation(floor);
    expect(elevFloor).toBeGreaterThan(17000);
    expect(elevFloor).toBeLessThan(19000);
  });

  it("computes slope and terrain traversability difficulty categories", () => {
    const octavia = { lat: 18.444, lng: 77.451 };
    const analysis = analyzeTerrain(octavia);
    expect(analysis.slopeDegrees).toBeGreaterThanOrEqual(0);
    expect(analysis.slopeDegrees).toBeLessThan(70);
    expect(["LOW", "MODERATE", "HIGH", "EXTREME"]).toContain(analysis.difficulty);
    expect(analysis.scientificDataSource).toContain("MOLA");
  });
});

describe("Scientific Interest Scoring and Data Sources", () => {
  it("registers authoritative NASA and USGS data sources", () => {
    expect(DATA_SOURCES_REGISTRY.length).toBeGreaterThanOrEqual(5);
    const mola = DATA_SOURCES_REGISTRY.find((d) => d.id === "mola-megdr");
    expect(mola).toBeDefined();
    expect(mola?.mission).toContain("Mars Global Surveyor");
  });

  it("evaluates high score near verified CRISM/HiRISE science points", () => {
    // Hawksbill Gap delta front
    const hawksbill = { lat: 18.442, lng: 77.410 };
    const result = computeScientificInterestScore(hawksbill);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.grade).toBe("EXCEPTIONAL");
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

describe("A* Martian EVA Pathfinding Engine", () => {
  it("computes biomechanical EVA speed accounting for slope", () => {
    const flatSpeed = calculateMartianEVASpeed(0);
    const steepUphillSpeed = calculateMartianEVASpeed(15);
    expect(flatSpeed).toBeCloseTo(2.4, 0.5);
    expect(steepUphillSpeed).toBeLessThan(flatSpeed);
  });

  it("generates distinct routes for SAFEST, FASTEST, and SCIENCE strategies", () => {
    const start = { lat: 18.444, lng: 77.451 }; // Butler Landing
    const dest = { lat: 18.442, lng: 77.410 }; // Hawksbill Gap

    const comparison = generateRouteComparison(start, dest);
    expect(comparison.safest.waypoints.length).toBeGreaterThan(1);
    expect(comparison.fastest.waypoints.length).toBeGreaterThan(1);
    expect(comparison.science.waypoints.length).toBeGreaterThan(1);

    // Science route should visit science targets and achieve high science score
    expect(comparison.science.scienceScore).toBeGreaterThanOrEqual(50);
    // Safest route should restrict max slope
    expect(comparison.safest.maxSlopeDeg).toBeLessThanOrEqual(20);
    // Fastest route should minimize or match direct duration
    expect(comparison.fastest.totalDurationMinutes).toBeLessThanOrEqual(
      comparison.safest.totalDurationMinutes + 5
    );
  });
});

describe("Mission Brief Generator and Consumables", () => {
  it("generates valid EVA brief with operational GO/CAUTION status", () => {
    const start = { lat: 18.444, lng: 77.451 };
    const dest = { lat: 18.442, lng: 77.410 };
    const route = calculateRoute(start, dest, "SAFEST");

    const brief = generateMissionBrief(
      {
        missionName: "Jezero Delta Traverse 01",
        crewSize: 2,
        maxEvaHours: 4.0,
        maxDistanceKm: 10.0,
        primaryObjective: "Sedimentary Delta Core Sampling",
        traversalMode: "SUITED_FOOT",
      },
      route
    );

    expect(brief.missionName).toBe("Jezero Delta Traverse 01");
    expect(["GO", "CAUTION", "NO_GO"]).toContain(brief.operationalStatus);
    expect(brief.plssConsumables.oxygenConsumptionLiters).toBeGreaterThan(0);
    expect(brief.dataAttribution.length).toBeGreaterThan(0);
    expect(brief.disclaimer).toContain("MARSCOPE SIMULATED ESTIMATE");
  });
});

describe("Ask MARSCOPE Natural Language Interface", () => {
  it("interprets region navigation queries", () => {
    const res = processNlpQuery("Show Jezero Crater");
    expect(res.intent).toBe("NAVIGATE_REGION");
    expect(res.targetRegionId).toBe("jezero");
  });

  it("handles coordinate query deterministically", () => {
    const res = processNlpQuery("18.444, 77.451");
    expect(res.intent).toBe("INSPECT_POINT");
    expect(res.reply).toContain("Elevation:");
    expect(res.reply).toContain("MOLA");
  });
});
