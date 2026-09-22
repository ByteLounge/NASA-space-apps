# MARSCOPE — Interplanetary Survival Guide: Martian Map
### NASA Space Apps Challenge 2026 Project

> **MARSCOPE** is an interactive Martian mission-planning workstation that transforms authoritative NASA datasets into actionable traversal strategies for future human Mars explorers.

$$\mathbf{MAP} \longrightarrow \mathbf{DATA} \longrightarrow \mathbf{ANALYSIS} \longrightarrow \mathbf{DECISION}$$

---

## 🚀 Key Features

* **Authoritative NASA Data**: Built directly on NASA Mars Global Surveyor (MGS) MOLA MEGDR digital elevation models ($463\text{ m/pixel}$), MRO CRISM hyperspectral mineral detections, and MRO HiRISE/CTX context imagery.
* **Planetary Geodesy & Coordinates**: Strict IAU planetocentric coordinate transformations with East Longitude ($0^\circ-360^\circ$ and $-180^\circ-+180^\circ$) and elevation referenced to the Martian Areoid datum ($0\text{ m}$).
* **Multi-Objective A* EVA Pathfinding Engine**:
  * **SAFEST**: Minimizes slope gradient, vehicle roll hazard, and terrain roughness.
  * **FASTEST**: Optimizes direct geodesic line-of-sight transit and minimum elapsed mission time.
  * **SCIENCE**: Diverts traverses toward high-value CRISM astrobiological targets (clays, carbonates, ancient deltas).
* **Side-by-Side Route Comparison**: Comprehensive comparative matrix of distance, duration, elevation delta, maximum slope, traversability, and explainable scientific yield.
* **3D Planetary Globe & Terrain Mesh**: Interactive Three.js WebGL Mars globe with realistic atmospheric limb, plus 3D MOLA surface heightfield meshes with **1×, 2×, and 5× vertical relief exaggeration**.
* **Interactive Topographic Cross-Section**: SVG elevation profile showing grade variations and segment difficulties across the planned traverse.
* **EVA Mission Brief Generator**: Formal operational brief calculating PLSS life-support consumables (oxygen consumption, safety margins, battery reserve), risk mitigation, and contingency back-azimuth abort protocols.
* **Ask MARSCOPE**: Deterministic natural language interface answering queries on coordinates, terrain slopes, regional features, and routing rationale.
* **₹0 Infrastructure Cost & Offline Demo Resilience**: Runs client-side with pre-packaged MOLA DEM grids for 5 curated Martian exploration zones (Jezero Crater, Olympus Mons, Melas Chasma, Gale Crater, and Planum Australe).

---

## 🛠️ Technology Stack

* **Framework**: Next.js 15 (App Router), React 19, TypeScript
* **Styling & UI**: Tailwind CSS, Lucide React, Custom Dark Mission-Control HUD
* **2D Planetary Cartography**: Leaflet with custom IAU EPSG:4326 Equirectangular projection and USGS/NASA tile servers
* **3D Visualization**: Three.js WebGL (3D Mars Sphere & MOLA Terrain Displacement Heightfield)
* **Testing**: Vitest (14 automated unit tests covering geodesy, slope, A* pathfinding, and PLSS consumables)

---

## 📦 Quick Start & Local Development

### Prerequisites
* Node.js v18+ (tested on Node.js v20, v22, and v24)
* npm or yarn

### Installation
```bash
git clone https://github.com/your-username/marscope.git
cd marscope
npm install
```

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Automated Unit Tests
```bash
npm test
```
Executes all 14 unit tests validating coordinate conversions, MOLA elevation sampling, slope derivations, A* cost computations, and mission brief generation.

### Production Build
```bash
npm run build
npm start
```

---

## 🧪 Scientific Data Sources

* **NASA MGS MOLA MEGDR**: High-precision global topography grid ($128\text{ ppd}$, PDS Geosciences Node).
* **NASA MRO CRISM**: Hyperspectral mineralogy detections (carbonates, phyllosilicates, hydrated sulfates).
* **NASA MRO HiRISE & CTX**: High-resolution landing site characterization and context imaging.
* **USGS Astrogeology Viking MDIM 2.1**: Geodetically controlled true-color planetary mosaic.
* **NASA Odyssey THEMIS**: 100m daytime thermal infrared basemap.

For complete dataset URLs, PDS archive identifiers, and citations, see [DATA_SOURCES.md](file:///D:/Projects/NASA%20space%20apps/DATA_SOURCES.md).

---

## 📜 Documentation Index

* [ARCHITECTURE.md](file:///D:/Projects/NASA%20space%20apps/ARCHITECTURE.md) — System design, component hierarchy, and data flow.
* [DATA_SOURCES.md](file:///D:/Projects/NASA%20space%20apps/DATA_SOURCES.md) — Complete NASA and USGS scientific dataset registry.
* [SCIENTIFIC_METHOD.md](file:///D:/Projects/NASA%20space%20apps/SCIENTIFIC_METHOD.md) — Mathematical formulas for slope derivation, A* cost function, and planetary geodesy.
* [ASSETS.md](file:///D:/Projects/NASA%20space%20apps/ASSETS.md) — Visual assets, licenses, and attribution records.
* [DEMO.md](file:///D:/Projects/NASA%20space%20apps/DEMO.md) — 2-minute hackathon demo presentation guide.

---

## 🌐 Free-Tier Deployment

Deployable with zero configuration on free hosting platforms:
* **Vercel**: Import repository -> Framework: Next.js -> Deploy (Zero environment variables required).
* **Netlify**: Connect Git repository -> Build command `npm run build` -> Publish directory `.next`.

---

## ⚖️ Scientific Integrity & Disclaimer

All derived metrics (traverse durations, terrain traversability difficulty categories, and science scores) are explicitly labeled as **MARSCOPE Analytical Estimates**. They are computed from open orbital datasets for exploration simulation and do not constitute certified NASA operational flight rules.
