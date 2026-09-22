# MARSCOPE — Visual Assets & Attribution Log

In strict adherence to the competition guidelines, every visual, cartographic, iconographic, and textural asset utilized in **MARSCOPE** is open-source, free-to-use, and authoritatively attributed.

---

| Asset Description | Source Repository / Provider | Author / Organization | License | Attribution | Where Used |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Viking MDIM 2.1 Color Mosaic** | USGS Astrogeology Planetary GIS | USGS / NASA | Public Domain | NASA / USGS Astrogeology Science Center | 2D Cartographic Basemap tile layer |
| **MOLA Color Shaded Relief Mosaic** | NASA Solar System Treks | NASA Goddard / JPL-Caltech | Public Domain | NASA / GSFC / MGS MOLA Science Team | 2D Topographic Elevation tile layer |
| **THEMIS Daytime IR 100m Mosaic** | ASU Mars Space Flight Facility | NASA / Arizona State University | Public Domain | NASA / JPL / ASU THEMIS Team | 2D Thermal Inertia basemap layer |
| **Martian Albedo Sphere Texture** | Synthesized dynamically client-side via HTML5 Canvas from MGS MOLA elevation & Viking MDIM albedo data | MARSCOPE Engine | MIT License | MARSCOPE Planetary Synthesis Engine | 3D Mars Globe sphere material (`src/lib/mars-textures.ts`) |
| **MOLA Elevation Bump Texture** | Synthesized dynamically client-side via HTML5 Canvas from MGS MOLA MEGDR elevation model | MARSCOPE Engine | MIT License | MARSCOPE Planetary Synthesis Engine | 3D Mars Globe topography relief bump map |
| **Lucide System Icons** | Lucide React (`lucide-react` npm package) | Lucide Contributors | ISC License | Lucide Open Source Icon Project | UI buttons, navigation, telemetry indicators, status icons |
| **Leaflet Cartography Engine** | Leaflet JS (`leaflet` npm package) | Vladimir Agafonkin & Contributors | BSD-2-Clause | Leaflet Open-Source Mapping Library | 2D Cartographic Workstation (`src/components/map/MarsMap2D.tsx`) |
| **Three.js WebGL Engine** | Three.js (`three` npm package) | Ricardo Cabello (Mr.doob) & Contributors | MIT License | Three.js WebGL Engine | 3D Mars Globe & Local 3D MOLA Terrain Heightfield Mesh (`src/components/globe/MarsGlobe3D.tsx`) |
| **Tailwind CSS System** | Tailwind Labs | Tailwind Labs Inc. | MIT License | Tailwind CSS Framework | Mission-control styling, HUD panels, telemetry badges |

---

## Zero-Cost Infrastructure Verification
* **₹0 API Cost**: No commercial mapping services (e.g. Google Maps, Mapbox, Cesium Ion token, or ArcGIS paid subscriptions) are required.
* **₹0 External Asset Cost**: All 3D planetary textures and elevation bump maps are generated client-side with 0 external network dependencies.
* **100% Offline Demo Resilience**: In the event of network disruption during live presentations, MARSCOPE's bundled high-resolution MOLA elevation grids for Jezero Crater, Olympus Mons, Melas Chasma, Gale Crater, and Planum Australe continue operating with zero latency.
