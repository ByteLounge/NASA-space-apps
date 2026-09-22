# MARSCOPE — NASA & USGS Planetary Data Sources Registry

Every scientific value, topography contour, mineralogical indicator, and context mosaic in **MARSCOPE** is derived from authoritative NASA, USGS Astrogeology, and ESA planetary science missions. No synthetic elevations or fabricated telemetry are used.

---

## 1. Topography, Elevation, & Slope

### NASA Mars Global Surveyor (MGS) — Mars Orbiter Laser Altimeter (MOLA)
* **Dataset**: MOLA Mission Experiment Gridded Data Record (MEGDR)
* **Instrument**: Mars Orbiter Laser Altimeter (MOLA)
* **Mission**: Mars Global Surveyor (NASA / Goddard Space Flight Center)
* **Resolution**: 128 pixels per degree (~463 meters per pixel at the equator)
* **Vertical Accuracy**: ~1 meter relative precision; absolute datum tied to the 0 m Martian Areoid equipotential gravity surface
* **Archive URL**: [PDS Geosciences Node - MOLA MEGDR](https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/)
* **License / Access**: NASA Open Data / Public Domain
* **Usage in MARSCOPE**:
  * Point elevation inspector for any planetocentric coordinate on Mars
  * 3D digital elevation heightfield meshes with 1×, 2×, and 5× vertical exaggeration
  * Finite-difference local gradient and slope angle ($\theta$) calculations
  * Terrain Roughness Index (TRI) standard deviation calculations
  * Core cost grid for the multi-objective A* traversal algorithm

---

## 2. Mineralogy & Astrobiology Indicators

### NASA Mars Reconnaissance Orbiter (MRO) — CRISM
* **Dataset**: Compact Reconnaissance Imaging Spectrometer for Mars Targeted Empirical Data Record (EDR/CDR)
* **Instrument**: CRISM (Visible and Near-Infrared Hyperspectral Imager, 0.36 to 3.92 µm)
* **Mission**: Mars Reconnaissance Orbiter (NASA / JPL-Caltech / JHU-APL)
* **Resolution**: 18 to 36 meters per pixel
* **Archive URL**: [CRISM Planetary Data System Archive](https://crism.jhuapl.edu/)
* **License / Access**: NASA Open Data / Public Domain
* **Key Spectral Absorption Signatures in MARSCOPE**:
  * **Magnesite / Dolomite Carbonates** ($2.30 \ \mu\text{m}, 2.51 \ \mu\text{m}$): Jezero Marginal Carbonate unit, indicator of ancient alkaline lake water
  * **Fe/Mg Smectite Phyllosilicates / Clays** ($1.4 \ \mu\text{m}, 1.9 \ \mu\text{m}, 2.3 \ \mu\text{m}$): Jezero Delta front (Hawksbill Gap), Gale crater Yellowknife Bay mudstones
  * **Hydrated Sulfates (Kieserite, Polyhydrated)** ($1.9 \ \mu\text{m}, 2.4 \ \mu\text{m}$): Melas Chasma Interior Layered Deposits (ILD), Mount Sharp lower stratum
  * **Crystalline Gray Hematite** ($0.86 \ \mu\text{m}$): Vera Rubin Ridge (Gale Crater)
* **Usage in MARSCOPE**:
  * Astro-biological Science Interest Score weighting
  * CRISM mineral overlay points with verified spectral absorption characteristics
  * Positive heuristic bonus for the "SCIENCE" routing strategy

---

## 3. High-Resolution & Context Imagery

### NASA MRO — High Resolution Imaging Science Experiment (HiRISE)
* **Instrument**: HiRISE
* **Organization**: NASA / JPL-Caltech / University of Arizona
* **Resolution**: 0.25 to 0.50 meters per pixel (visible spectrum)
* **Archive URL**: [HiRISE Operations Center](https://www.uahirise.org/)
* **License / Access**: NASA / University of Arizona Open Access
* **Usage in MARSCOPE**: Boulder hazard validation, delta bottomset cross-bedding verification (Kodiak Butte), and landing ellipse terrain characterization.

### NASA MRO — Context Camera (CTX)
* **Instrument**: Context Camera (CTX)
* **Organization**: NASA / JPL-Caltech / Malin Space Science Systems (MSSS)
* **Resolution**: 6 meters per pixel panchromatic
* **Archive URL**: [Murray Lab Global CTX Mosaic](https://murray-lab.caltech.edu/CTX/)
* **License / Access**: NASA / Caltech Open Planetary Data
* **Usage in MARSCOPE**: Basemap context and morphological fault scarp boundaries.

### USGS Astrogeology — Viking Mars Digital Image Mosaic (MDIM 2.1)
* **Instrument**: Viking Visual Imaging Subsystem (VIS)
* **Organization**: USGS Astrogeology Science Center / NASA
* **Resolution**: 231 meters per pixel controlled color global mosaic
* **Archive URL**: [USGS Astrogeology Viking MDIM 2.1](https://astrogeology.usgs.gov/search/map/Mars/Global/Mars_Viking_MDIM21_ClrMosaic_global_232m)
* **License / Access**: USGS / NASA Public Domain
* **Usage in MARSCOPE**: Global 2D cartographic base layer and 3D planetary globe texture.

### NASA Mars Odyssey — THEMIS Daytime Infrared
* **Instrument**: Thermal Emission Imaging System (THEMIS)
* **Organization**: NASA / Arizona State University
* **Resolution**: 100 meters per pixel multi-band thermal infrared
* **Archive URL**: [THEMIS Data Node](https://themis.asu.edu/)
* **License / Access**: NASA / ASU Open Planetary Data
* **Usage in MARSCOPE**: Thermal inertia basemap highlighting bedrock exposure versus fine loose dust mantle.

---

## 4. Human Exploration & Landing Site Studies

### NASA Human Exploration Zones (EZs)
* **Origin**: 1st Landing Site / Exploration Zone Workshop for Human Missions to Mars
* **Organization**: NASA Human Exploration and Operations Mission Directorate (HEOMD)
* **Archive URL**: [NASA Journey to Mars - Exploration Zones](https://www.nasa.gov/journeytomars/mars-exploration-zones)
* **Usage in MARSCOPE**: In-situ resource utilization (ISRU) target points, candidate human base habitats in Melas Chasma and Jezero Crater.
