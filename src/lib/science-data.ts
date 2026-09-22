/**
 * MARSCOPE Planetary Science and Exploration Datasets
 * 
 * Sources:
 * - NASA Planetary Data System (PDS)
 * - NASA Mars Reconnaissance Orbiter (MRO) CRISM, HiRISE, CTX, SHARAD
 * - USGS Astrogeology Planetary Nomenclature and Geologic Maps
 * - NASA Mars Exploration Program Human Landing Site Study (EZs)
 */

import { MarsCoordinate, marsDistanceKm } from "./mars-coordinates";

export type FeatureCategory = 
  | "LANDING_SITE" 
  | "SCIENCE_TARGET" 
  | "MINERAL_CRISM" 
  | "GEOLOGY_UNIT" 
  | "EXPLORATION_ZONE" 
  | "HAZARD_ZONE";

export interface SciencePoint {
  id: string;
  name: string;
  category: FeatureCategory;
  lat: number;
  lng: number;
  elevationMeters: number;
  regionId: string;
  description: string;
  scientificRelevance: string;
  instruments: string[]; // e.g. ["CRISM", "HiRISE", "MOLA"]
  mineralogy?: string;
  geologicEpoch?: "Noachian" | "Hesperian" | "Amazonian";
  scienceWeight: number; // 0 to 100 for pathfinding reward
  sourceDataset: string;
  sourceUrl: string;
}

export interface DataSourceRecord {
  id: string;
  title: string;
  mission: string;
  instrument: string;
  organization: string;
  resolution: string;
  description: string;
  usageInApp: string;
  sourceUrl: string;
  license: string;
}

export const DATA_SOURCES_REGISTRY: DataSourceRecord[] = [
  {
    id: "mola-megdr",
    title: "MOLA Mission Experiment Gridded Data Record (MEGDR)",
    mission: "Mars Global Surveyor (MGS)",
    instrument: "Mars Orbiter Laser Altimeter (MOLA)",
    organization: "NASA / Goddard Space Flight Center / USGS Astrogeology",
    resolution: "128 pixels per degree (~463 m/pixel at equator)",
    description: "High-precision global planetary topographic elevation grid referenced to the Martian Areoid gravitational equipotential datum.",
    usageInApp: "Powers 2D contouring, 3D terrain displacement meshes, point elevation inspection, slope gradient calculations, and A* terrain traversal cost grids.",
    sourceUrl: "https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/",
    license: "NASA Public Domain / Open Data",
  },
  {
    id: "mro-crism",
    title: "CRISM Targeted Empirical Data Record (EDR/CDR)",
    mission: "Mars Reconnaissance Orbiter (MRO)",
    instrument: "Compact Reconnaissance Imaging Spectrometer for Mars (CRISM)",
    organization: "NASA / JHU Applied Physics Laboratory",
    resolution: "18 - 36 m/pixel hyperspectral (0.36 - 3.92 µm)",
    description: "Hyperspectral data identifying key aqueous and primary minerals including carbonates, Fe/Mg-smectites, hydrated sulfates, and olivine.",
    usageInApp: "Used for astrobiological priority scoring, scientific interest weighting along traverses, and mineralogical detection overlays.",
    sourceUrl: "https://crism.jhuapl.edu/",
    license: "NASA Public Domain / Open Data",
  },
  {
    id: "mro-hirise",
    title: "HiRISE High Resolution Digital Elevation Models and Orthoimages",
    mission: "Mars Reconnaissance Orbiter (MRO)",
    instrument: "High Resolution Imaging Science Experiment (HiRISE)",
    organization: "NASA / JPL-Caltech / University of Arizona",
    resolution: "0.25 - 0.50 m/pixel visible spectrum",
    description: "Sub-meter orbital imaging capable of distinguishing meter-scale boulders, rover tracks, sand dune bedforms, and fine sedimentary layering.",
    usageInApp: "Provides local context imagery metadata, boulder hazard validation, and landing site verification.",
    sourceUrl: "https://www.uahirise.org/",
    license: "NASA / University of Arizona Open Access",
  },
  {
    id: "mro-ctx",
    title: "CTX Global Context Mosaic",
    mission: "Mars Reconnaissance Orbiter (MRO)",
    instrument: "Context Camera (CTX)",
    organization: "NASA / JPL-Caltech / Malin Space Science Systems (MSSS)",
    resolution: "6 m/pixel panchromatic",
    description: "Broad-area geological context imaging covering over 99% of Mars, serving as the geospatial baseline for planetary geological mapping.",
    usageInApp: "Basemap context and geological contact tracing for regional traverses.",
    sourceUrl: "https://murray-lab.caltech.edu/CTX/",
    license: "NASA / Caltech / MSSS Open Planetary Data",
  },
  {
    id: "usgs-viking-mdim21",
    title: "Viking Orbiter Mars Digital Image Mosaic (MDIM 2.1)",
    mission: "Viking Orbiters 1 & 2",
    instrument: "Visual Imaging Subsystem (VIS)",
    organization: "USGS Astrogeology Science Center / NASA",
    resolution: "231 m/pixel true/controlled color planetary mosaic",
    description: "Geodetically controlled global color mosaic of Mars, orthorectified to MOLA topography.",
    usageInApp: "Primary visible light planetary basemap for global and 3D globe visualizations.",
    sourceUrl: "https://astrogeology.usgs.gov/search/map/Mars/Global/Mars_Viking_MDIM21_ClrMosaic_global_232m",
    license: "USGS / NASA Public Domain",
  },
  {
    id: "themis-day-ir",
    title: "THEMIS Daytime Infrared 100m Global Mosaic",
    mission: "2001 Mars Odyssey",
    instrument: "Thermal Emission Imaging System (THEMIS)",
    organization: "NASA / Arizona State University (ASU)",
    resolution: "100 m/pixel multi-band thermal infrared",
    description: "Infrared thermal emission mosaic highlighting surface roughness, bedrock exposure, and thermophysical properties of dust versus stone.",
    usageInApp: "Thermal inertia indicators and terrain roughness validation for traversability models.",
    sourceUrl: "https://themis.asu.edu/",
    license: "NASA / ASU Open Planetary Data",
  },
];

export const SCIENCE_POINTS: SciencePoint[] = [
  // ---------------- Jezero Crater Region ----------------
  {
    id: "jezero-butler-landing",
    name: "Octavia E. Butler Landing (Perseverance)",
    category: "LANDING_SITE",
    lat: 18.444,
    lng: 77.451,
    elevationMeters: -2570,
    regionId: "jezero",
    description: "Touchdown site of the Mars 2020 Perseverance rover on February 18, 2021.",
    scientificRelevance: "Starting datum for rover traverse; ancient lacustrine floor deposits with low rock density.",
    instruments: ["HiRISE", "MOLA", "Mastcam-Z"],
    geologicEpoch: "Noachian",
    scienceWeight: 65,
    sourceDataset: "NASA Mars 2020 Mission Archive",
    sourceUrl: "https://mars.nasa.gov/mars2020/",
  },
  {
    id: "jezero-hawksbill-gap",
    name: "Hawksbill Gap (Delta Front Scarp)",
    category: "SCIENCE_TARGET",
    lat: 18.442,
    lng: 77.410,
    elevationMeters: -2480,
    regionId: "jezero",
    description: "Finely laminated mudstones and siltstones at the bottom of the ancient river delta.",
    scientificRelevance: "High astrobiological preservation potential; verified presence of organic molecules and biosignature candidates.",
    instruments: ["CRISM", "SHERLOC", "PIXL", "HiRISE"],
    mineralogy: "Hydrated Fe/Mg smectite clays & fine sulfates",
    geologicEpoch: "Noachian",
    scienceWeight: 96,
    sourceDataset: "MRO CRISM / Perseverance In-Situ Science",
    sourceUrl: "https://mars.nasa.gov/mars2020/mission/science/overview/",
  },
  {
    id: "jezero-kodiak-butte",
    name: "Kodiak Mesa Remnant",
    category: "GEOLOGY_UNIT",
    lat: 18.402,
    lng: 77.461,
    elevationMeters: -2410,
    regionId: "jezero",
    description: "Isolated erosional butte preserving bottomset and topset deltaic cross-bedding strata.",
    scientificRelevance: "Proves existence of sustained ancient lake standing water levels and rapid flood transitions.",
    instruments: ["HiRISE", "SuperCam"],
    mineralogy: "Layered silicates and olivine basalt caps",
    geologicEpoch: "Noachian",
    scienceWeight: 88,
    sourceDataset: "MRO HiRISE / Mangold et al. Science 2021",
    sourceUrl: "https://www.science.org/doi/10.1126/science.abl4051",
  },
  {
    id: "jezero-seitah-unit",
    name: "Séítah Fractured Olivine Formation",
    category: "HAZARD_ZONE",
    lat: 18.420,
    lng: 77.440,
    elevationMeters: -2595,
    regionId: "jezero",
    description: "Rugged igneous cumulate layered unit dominated by coarse olivine grains and sand ripples.",
    scientificRelevance: "Early igneous magma ocean differentiation; traverse hazard due to high wheel-slip sand dunes.",
    instruments: ["CRISM", "PIXL", "HiRISE"],
    mineralogy: "Coarse crystalline olivine and pyroxene",
    geologicEpoch: "Noachian",
    scienceWeight: 78,
    sourceDataset: "MRO CRISM & Perseverance Traverse Science",
    sourceUrl: "https://pds-geosciences.wustl.edu/",
  },
  {
    id: "jezero-neretva-inlet",
    name: "Neretva Vallis Inflow Gorge",
    category: "SCIENCE_TARGET",
    lat: 18.490,
    lng: 77.330,
    elevationMeters: -2320,
    regionId: "jezero",
    description: "Major carved fluvial breach through Jezero crater wall that fed the delta system.",
    scientificRelevance: "Cross-section into deep Noachian crust; catastrophic paleoflood transport boulders.",
    instruments: ["MOLA", "CTX", "HiRISE"],
    mineralogy: "Carbonate-bearing crustal lithologies",
    geologicEpoch: "Noachian",
    scienceWeight: 92,
    sourceDataset: "USGS Mars Geologic Map Series",
    sourceUrl: "https://astrogeology.usgs.gov/",
  },
  {
    id: "jezero-crism-carbonate",
    name: "Marginal Carbonate Band (CRISM Target)",
    category: "MINERAL_CRISM",
    lat: 18.475,
    lng: 77.485,
    elevationMeters: -2290,
    regionId: "jezero",
    description: "Prominent 2.3 µm and 2.5 µm spectral absorption bands indicating magnesite/dolomite.",
    scientificRelevance: "Potential 'bathtub ring' precipitated along the shoreline of ancient Lake Jezero.",
    instruments: ["CRISM", "HiRISE"],
    mineralogy: "Magnesian carbonates & phyllosilicates",
    geologicEpoch: "Noachian",
    scienceWeight: 95,
    sourceDataset: "MRO CRISM Targeted Observation HRL000040FF",
    sourceUrl: "https://crism.jhuapl.edu/",
  },

  // ---------------- Olympus Mons Region ----------------
  {
    id: "olympus-summit-caldera",
    name: "Olympus Mons Summit Caldera Complex",
    category: "SCIENCE_TARGET",
    lat: 18.65,
    lng: -133.80,
    elevationMeters: 21229,
    regionId: "olympus",
    description: "Nested collapse calderas up to 3 km deep spanning 80 km across the summit.",
    scientificRelevance: "Multi-stage magma chamber deflation events spanning Amazonian volcanic history.",
    instruments: ["MOLA", "HRSC", "THEMIS"],
    mineralogy: "Unweathered tholeiitic basalts",
    geologicEpoch: "Amazonian",
    scienceWeight: 94,
    sourceDataset: "MGS MOLA / ESA Mars Express HRSC",
    sourceUrl: "https://www.esa.int/Science_Exploration/Space_Science/Mars_Express",
  },
  {
    id: "olympus-basal-scarp",
    name: "Olympus Mons Basal Escarpment",
    category: "HAZARD_ZONE",
    lat: 19.30,
    lng: -134.60,
    elevationMeters: 7400,
    regionId: "olympus",
    description: "Sheer 6 to 8 km high vertical cliff girdling the volcano flank.",
    scientificRelevance: "Giant gravitational sector collapse and catastrophic landslide deposits; severe terrain hazard.",
    instruments: ["MOLA", "CTX"],
    geologicEpoch: "Amazonian",
    scienceWeight: 80,
    sourceDataset: "USGS Astrogeology Planetary Basemap",
    sourceUrl: "https://astrogeology.usgs.gov/",
  },
  {
    id: "olympus-lava-tube-skylight",
    name: "Flank Lava Tube Skylight Candidate",
    category: "EXPLORATION_ZONE",
    lat: 18.15,
    lng: -133.20,
    elevationMeters: 14800,
    regionId: "olympus",
    description: "Subsurface volcanic pit entry offering radiation shielding for human explorers.",
    scientificRelevance: "Subsurface human habitat candidate; natural radiation and micrometeorite shelter.",
    instruments: ["HiRISE", "THEMIS"],
    mineralogy: "Primary basaltic glass",
    geologicEpoch: "Amazonian",
    scienceWeight: 90,
    sourceDataset: "NASA Human Exploration Candidate Zones",
    sourceUrl: "https://www.nasa.gov/journeytomars/",
  },

  // ---------------- Valles Marineris (Melas Chasma) ----------------
  {
    id: "melas-layered-sulfates",
    name: "Melas Chasma Interior Layered Deposits (ILD)",
    category: "MINERAL_CRISM",
    lat: -9.70,
    lng: -76.30,
    elevationMeters: -3850,
    regionId: "melas",
    description: "Thick sequences of light-toned hydrated sulfate beds exposed in the canyon interior.",
    scientificRelevance: "Ancient sub-aqueous acid-sulfate hydrothermal or lacustrine sedimentation.",
    instruments: ["CRISM", "HiRISE", "MOLA"],
    mineralogy: "Kieserite, polyhydrated sulfates, hematite",
    geologicEpoch: "Hesperian",
    scienceWeight: 95,
    sourceDataset: "MRO CRISM Spectral Survey / Weitz et al.",
    sourceUrl: "https://pds-geosciences.wustl.edu/",
  },
  {
    id: "melas-human-ez",
    name: "Melas Chasma Exploration Zone (NASA EZ)",
    category: "EXPLORATION_ZONE",
    lat: -9.85,
    lng: -76.50,
    elevationMeters: -4150,
    regionId: "melas",
    description: "NASA Human Landing Site candidate with high atmospheric density (+6 mbar) for landing safety.",
    scientificRelevance: "Hydrated mineral water feedstock; deep atmospheric protection against radiation.",
    instruments: ["MOLA", "CRISM", "SHARAD"],
    geologicEpoch: "Hesperian",
    scienceWeight: 91,
    sourceDataset: "1st Landing Site / Exploration Zone Workshop for Human Missions to Mars",
    sourceUrl: "https://www.nasa.gov/journeytomars/mars-exploration-zones",
  },
  {
    id: "melas-canyon-wall-cliff",
    name: "Melas Chasma North Wall Fault Scarp",
    category: "HAZARD_ZONE",
    lat: -9.05,
    lng: -76.40,
    elevationMeters: 2800,
    regionId: "melas",
    description: "Massive 7 km vertical wall showing active recurring slope lineae (RSL) and rockfalls.",
    scientificRelevance: "Tectonic crustal rift faulting; impassable for wheeled or unassisted foot traverses.",
    instruments: ["MOLA", "HiRISE"],
    geologicEpoch: "Noachian/Hesperian",
    scienceWeight: 75,
    sourceDataset: "USGS Geologic Investigation Series",
    sourceUrl: "https://astrogeology.usgs.gov/",
  },

  // ---------------- Gale Crater Region ----------------
  {
    id: "gale-bradbury-landing",
    name: "Bradbury Landing (MSL Curiosity)",
    category: "LANDING_SITE",
    lat: -4.59,
    lng: 137.44,
    elevationMeters: -4501,
    regionId: "gale",
    description: "Touchdown site of the Mars Science Laboratory Curiosity rover on August 6, 2012.",
    scientificRelevance: "Ancient alluvial fan sediments derived from Peace Vallis river network.",
    instruments: ["MOLA", "HiRISE", "Mastcam"],
    geologicEpoch: "Hesperian",
    scienceWeight: 70,
    sourceDataset: "NASA MSL PDS Archive",
    sourceUrl: "https://mars.nasa.gov/msl/",
  },
  {
    id: "gale-yellowknife-bay",
    name: "Yellowknife Bay Ancient Lakebed",
    category: "SCIENCE_TARGET",
    lat: -4.58,
    lng: 137.45,
    elevationMeters: -4520,
    regionId: "gale",
    description: "Fine-grained sheepbed mudstone drilled by Curiosity revealing ancient neutral pH water.",
    scientificRelevance: "Proved Mars had habitable environmental conditions for microbial life in the past.",
    instruments: ["CheMin", "SAM", "APXS"],
    mineralogy: "Saponite clay, magnetite, anhydrite",
    geologicEpoch: "Noachian/Hesperian",
    scienceWeight: 98,
    sourceDataset: "Grotzinger et al., Science 2014",
    sourceUrl: "https://www.science.org/doi/10.1126/science.1242777",
  },
  {
    id: "gale-vera-rubin-ridge",
    name: "Vera Rubin Ridge (Hematite Ridge)",
    category: "MINERAL_CRISM",
    lat: -4.72,
    lng: 137.38,
    elevationMeters: -4250,
    regionId: "gale",
    description: "Prominent ridge standing ~20m above surrounding plains, enriched in crystalline gray hematite.",
    scientificRelevance: "Groundwater redox transition zone with intense fluid-rock chemical alteration.",
    instruments: ["CRISM", "ChemCam", "APXS"],
    mineralogy: "Crystalline gray hematite & sulfate veins",
    geologicEpoch: "Hesperian",
    scienceWeight: 92,
    sourceDataset: "MRO CRISM Targeted Spectral Analysis",
    sourceUrl: "https://pds-geosciences.wustl.edu/",
  },
  {
    id: "gale-mount-sharp",
    name: "Aeolis Mons (Mount Sharp) Lower Stratum",
    category: "GEOLOGY_UNIT",
    lat: -5.08,
    lng: 137.85,
    elevationMeters: -3100,
    regionId: "gale",
    description: "Central 5 km high mountain recording billions of years of Martian climate transition.",
    scientificRelevance: "Preserves transition from wet clay-forming environments to hyperarid sulfate deposition.",
    instruments: ["MOLA", "CRISM", "HiRISE"],
    mineralogy: "Phyllosilicates to magnesium sulfates",
    geologicEpoch: "Hesperian/Amazonian",
    scienceWeight: 94,
    sourceDataset: "USGS Mars Geologic Map / NASA MSL Science",
    sourceUrl: "https://mars.nasa.gov/msl/",
  },

  // ---------------- South Polar Region ----------------
  {
    id: "south-pole-residual-cap",
    name: "Planum Australe Residual Ice Cap",
    category: "SCIENCE_TARGET",
    lat: -86.50,
    lng: 0.0,
    elevationMeters: 3120,
    regionId: "southpole",
    description: "Perennial carbon dioxide 'Swiss cheese' slab overlying kilometers of water ice.",
    scientificRelevance: "Climate atmospheric reservoir; recorded planetary orbital obliquity cycles.",
    instruments: ["MOLA", "SHARAD", "CRISM"],
    mineralogy: "Dry ice (CO2) and basal H2O ice",
    geologicEpoch: "Amazonian",
    scienceWeight: 89,
    sourceDataset: "NASA MGS / MRO SHARAD Polar Surveys",
    sourceUrl: "https://pds-geosciences.wustl.edu/",
  },
];

/**
 * Computes an explainable Scientific Interest Score (0 - 100) for any coordinate.
 * 
 * Inputs:
 * 1. Proximity to verified NASA science points and CRISM mineral detections.
 * 2. High-value astrobiological units (clays, carbonates, ancient lakebeds).
 * 3. Geomorphic uniqueness (craters, deltas, volcanic calderas).
 */
export interface ScienceScoreResult {
  score: number;
  grade: "LOW" | "MODERATE" | "HIGH" | "EXCEPTIONAL";
  reasons: string[];
  nearestFeature: {
    name: string;
    distanceKm: number;
    category: FeatureCategory;
    scientificRelevance: string;
  } | null;
  methodology: string;
}

export function computeScientificInterestScore(coord: MarsCoordinate): ScienceScoreResult {
  let bestDist = Infinity;
  let nearest: SciencePoint | null = null;

  for (const pt of SCIENCE_POINTS) {
    const d = marsDistanceKm(coord, { lat: pt.lat, lng: pt.lng });
    if (d < bestDist) {
      bestDist = d;
      nearest = pt;
    }
  }

  const reasons: string[] = [];
  let score = 25; // Baseline planetary interest

  if (nearest && bestDist < 100) {
    // Proximity factor: decays with distance
    const proxFactor = Math.max(0, 1 - bestDist / 50); // 1.0 at 0km, 0.0 at 50km
    const featureScoreContribution = (nearest.scienceWeight - 25) * proxFactor;
    score += featureScoreContribution;

    if (bestDist < 2.0) {
      reasons.push(`Direct contact with ${nearest.name} (< 2 km): ${nearest.scientificRelevance}`);
    } else if (bestDist < 10.0) {
      reasons.push(`Within immediate rover EVA range (${bestDist.toFixed(1)} km) of ${nearest.name}`);
    } else {
      reasons.push(`Regional proximity (${bestDist.toFixed(1)} km) to ${nearest.name}`);
    }

    if (nearest.mineralogy) {
      reasons.push(`Identified aqueous/hydrothermal mineralogy: ${nearest.mineralogy}`);
      score += 5 * proxFactor;
    }

    if (nearest.category === "MINERAL_CRISM") {
      reasons.push(`MRO CRISM spectral signature detected in this exploration sector`);
    } else if (nearest.category === "LANDING_SITE") {
      reasons.push(`Historical NASA exploration corridor with verified surface ground truth`);
    } else if (nearest.category === "EXPLORATION_ZONE") {
      reasons.push(`NASA Human Exploration Zone (EZ) prioritized for resource utilization`);
    }
  } else {
    reasons.push("Standard Noachian/Hesperian basaltic bedrock plains; secondary astrobiological priority");
  }

  score = Math.min(100, Math.max(10, Math.round(score)));

  let grade: ScienceScoreResult["grade"] = "LOW";
  if (score >= 85) grade = "EXCEPTIONAL";
  else if (score >= 70) grade = "HIGH";
  else if (score >= 45) grade = "MODERATE";

  return {
    score,
    grade,
    reasons,
    nearestFeature: nearest ? {
      name: nearest.name,
      distanceKm: Math.round(bestDist * 10) / 10,
      category: nearest.category,
      scientificRelevance: nearest.scientificRelevance,
    } : null,
    methodology: "MARSCOPE Analytical Estimate: Inverse distance-weighted proximity to verified NASA MRO/CRISM/HiRISE science targets and astrobiological mineral deposits.",
  };
}
