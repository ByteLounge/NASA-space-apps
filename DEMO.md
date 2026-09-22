# MARSCOPE — 2-Minute Hackathon Demo Script

This step-by-step walkthrough is optimized for a live 2-minute presentation to judges, demonstrating the core pipeline:

$$\mathbf{NASA \ DATA} \longrightarrow \mathbf{ANALYSIS} \longrightarrow \mathbf{MISSION \ DECISION}$$

---

### Step 1: Launch & Landing Hero (0:00 – 0:15)
1. Open MARSCOPE. The dark, sleek mission control interface loads instantly.
2. Show the minimal landing hero: **"MARSCOPE — Interplanetary Survival Guide: Martian Map"**.
3. Click **"EXPLORE MARS"** (or **"MISSION PLANNER"**).
4. *Talking Point*: *"Rather than another cosmetic Mars globe, MARSCOPE is an operational mission-planning workstation designed to help future human explorers make safe, data-driven EVA traversal decisions using real NASA datasets."*

---

### Step 2: Scientific Data Layers & Inspection (0:15 – 0:40)
1. The 2D cartographic workstation centers on **Jezero Crater** (Perseverance rover landing site).
2. Open **"PLANETARY DATA LAYERS"** on the top-left:
   * Toggle **"MOLA Slope Hazards (>12°)"** — amber and red hazard blocks highlight the steep crater rim and delta front scarps.
   * Toggle **"MRO CRISM Mineralogy"** — purple indicators reveal aqueous clays and magnesite carbonates.
3. Click on the **Hawksbill Gap** marker (or click any arbitrary coordinate on the delta).
4. The **Location Inspector** panel opens on the right:
   * Point out the exact elevation: `-2,480 m` referenced to the Martian Areoid.
   * Highlight the **Slope Gradient**: `8.4°` and **Traversability**: `MODERATE`.
   * Explain the **Science Value Score**: `96/100 (EXCEPTIONAL)` with the transparent breakdown: *"Verified presence of hydrated Fe/Mg smectite clays detected by MRO CRISM."*
5. *Talking Point*: *"Notice every single telemetry point shows its NASA provenance—MGS MOLA MEGDR for topography, MRO CRISM for mineralogy. We never fabricate values."*

---

### Step 3: Multi-Objective A* Pathfinding (0:40 – 1:10)
1. Click **"Set as Start"** at Octavia E. Butler Landing, and **"Set as Target"** at Hawksbill Gap.
2. The route engine immediately computes the optimal traversal.
3. Switch between the 3 routing strategies:
   * **SAFEST**: Capped at low slope ($<14^\circ$), contour-hugging, avoids boulder ejecta.
   * **FASTEST**: Minimizes straight-line distance ($4.1 \text{ km}$, shortest EVA duration).
   * **SCIENCE**: Diverts the traverse toward Kodiak Butte and Séítah olivine contacts, boosting the Science Score.
4. Click **"Compare Routes"**:
   * Show the side-by-side comparison matrix of Distance, Time, Elevation Gain, Max Slope, and Science Score.
   * Point out the explainable rationale: *"Why this route was chosen."*

---

### Step 4: Topographic Cross-Section & 3D MOLA Terrain (1:10 – 1:35)
1. Click **"Elevation Profile"**:
   * View the interactive cross-section chart showing elevation vs distance, with color-coded slope segments.
2. In the top bar, switch to **"3D Globe"**:
   * Rotate the photorealistic Mars sphere with atmospheric limb scattering.
   * Click **"3D MOLA Terrain"** to generate the real heightfield displacement mesh.
   * Toggle **Vertical Exaggeration** from **1×** to **2×** to **5×** to vividly reveal the ancient lakebed delta scarp!
   * Show the computed 3D route line hugging the elevated topography.

---

### Step 5: Official NASA Mission Brief & Data Attribution (1:35 – 2:00)
1. Click **"GENERATE OFFICIAL MISSION BRIEF"**:
   * Review the flight authorization summary: **STATUS: GO (FLIGHT CERTIFIED)**.
   * Review the **PLSS Life-Support Consumables**: Oxygen consumption ($248 \text{ L}$), Reserve margin ($+58 \text{ min}$), Battery reserve ($82\%$).
   * Show the contingency abort protocol and scientific sampling instructions.
   * Click **"Copy Text"** or **"Print"**.
2. Open **"Data Sources"** in the top bar or toolbar to show complete attribution to NASA Goddard, JPL-Caltech, and USGS Astrogeology.
3. Click **"Commander Ares (👨‍🚀 Guide)"** in the left NASA Mars Trek toolstrip to showcase the step-by-step interactive onboarding for beginner users.
4. *Closing Line*: *"MARSCOPE empowers human Mars explorers to answer: Where should we go, how do we get there safely, and what will we discover along the way?"*
