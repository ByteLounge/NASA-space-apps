# MARSCOPE — Scientific Methodology & Geodesy Specification

This document details the mathematical, geophysical, and computational methodologies implemented in **MARSCOPE**, ensuring full scientific transparency for researchers, mission planners, and hackathon adjudicators.

---

## 1. Planetary Geodesy & Coordinate Systems

### 1.1 IAU Planetocentric Standard
Mars is modeled as a rotating oblate spheroid defined by the International Astronomical Union (IAU) Working Group on Cartographic Coordinates and Rotational Elements:

* **Mean Volumetric Radius**: $R_M = 3,389.5 \text{ km}$
* **Equatorial Radius**: $a = 3,396.2 \text{ km}$
* **Polar Radius**: $b = 3,376.2 \text{ km}$
* **Surface Gravity**: $g_{\text{mars}} = 3.721 \text{ m/s}^2$ ($\approx 0.379 \ g_{\text{earth}}$)
* **Coordinate Standard**: Planetocentric Latitude ($\phi \in [-90^\circ, +90^\circ]$), measured from the equatorial plane to the radial vector.
* **Longitude Convention**: East Longitude ($\lambda \in [0^\circ, 360^\circ]$ or $[-180^\circ, +180^\circ]$), where $0^\circ$ passes through Airy-0 crater in Sinus Meridiani.

### 1.2 Great-Circle Geodesic Distance (Haversine on Mars)
The geodesic distance $d$ across the Martian surface between two coordinates $(\phi_1, \lambda_1)$ and $(\phi_2, \lambda_2)$ is computed as:

$$\Delta\phi = \phi_2 - \phi_1, \quad \Delta\lambda = \lambda_2 - \lambda_1$$

$$a_h = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$

$$d = 2 R_M \arcsin\left(\sqrt{a_h}\right)$$

### 1.3 Vertical Reference Datum: The Martian Areoid
Unlike Earth (which uses sea level as the geoid), Mars has no liquid water body. Martian elevation is referenced to the **Martian Areoid**—an equipotential gravitational surface established by the MGS Radio Science and MOLA teams:
* Defined as the gravitational potential surface whose average equatorial radius equals $3,396.0 \text{ km}$.
* Mars elevations range from $-8,200 \text{ m}$ (in the floor of the Hellas Impact Basin) to $+21,229 \text{ m}$ (at the caldera rim of Olympus Mons).

---

## 2. Elevation Interpolation & Finite Gradient Derivation

### 2.1 Regional Digital Elevation Models (DEM)
High-resolution matrices sampled from the MOLA Mission Experiment Gridded Data Record (MEGDR 128-ppd) are stored as 2D floating-point grids for operational regions (Jezero Crater, Olympus Mons, Melas Chasma, Gale Crater, South Pole).

For any arbitrary query coordinate $(\phi, \lambda)$ within DEM bounds, elevation is sampled using **bilinear interpolation**:

$$u = \frac{\lambda - \lambda_{\min}}{\lambda_{\max} - \lambda_{\min}} \times (N_{\text{cols}} - 1), \quad v = \frac{\phi - \phi_{\min}}{\phi_{\max} - \phi_{\min}} \times (N_{\text{rows}} - 1)$$

$$z(u, v) = z_{00}(1 - \Delta u)(1 - \Delta v) + z_{01}(\Delta u)(1 - \Delta v) + z_{10}(1 - \Delta u)(\Delta v) + z_{11}(\Delta u)(\Delta v)$$

### 2.2 Central Finite-Difference Slope Gradient ($\theta$)
To calculate local slope angle at coordinate $(\phi, \lambda)$, central spatial differences are computed across a small orthogonal step $\delta \approx 150 \text{ m}$:

$$\frac{\partial z}{\partial y} = \frac{z(\phi + \delta, \lambda) - z(\phi - \delta, \lambda)}{d_y}, \quad \frac{\partial z}{\partial x} = \frac{z(\phi, \lambda + \delta) - z(\phi, \lambda - \delta)}{d_x}$$

$$\text{Gradient } G = \sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}$$

$$\text{Slope } \theta = \arctan(G) \times \frac{180^\circ}{\pi}$$

### 2.3 Terrain Roughness Index (TRI)
The Terrain Roughness Index (TRI) measures micro-topographic heterogeneity by evaluating the standard deviation of elevations among cardinal neighbors:

$$\text{TRI} = \sqrt{\frac{1}{N}\sum_{i=1}^N (z_i - \bar{z})^2}$$

### 2.4 Traversability Difficulty Classification
Traversability ratings are computed as a **MARSCOPE Analytical Estimate**:

| Category | Slope ($\theta$) | Roughness (TRI) | Operational Description |
| :--- | :--- | :--- | :--- |
| **LOW** | $< 5^\circ$ | $< 3 \text{ m}$ | Smooth basaltic plains, flat inter-crater regolith |
| **MODERATE** | $5^\circ - 12^\circ$ | $3 - 8 \text{ m}$ | Low alluvial slopes, gentle swales, passable with minor rover slip |
| **HIGH** | $12^\circ - 20^\circ$ | $8 - 18 \text{ m}$ | Steep crater inner walls, delta fronts, significant actuator strain |
| **EXTREME** | $> 20^\circ$ | $> 18 \text{ m}$ | Impassable cliff scarps, fault walls, rollover hazard |

---

## 3. EVA Traversal Pathfinding Engine

### 3.1 Biomechanical Walking Speed Model on Mars
Under reduced gravity ($0.38 \ g$), human locomotion in a pressurized Planetary Extravehicular Life Support suit (total system mass $\approx 220 \text{ kg}$, effective Martian weight $\approx 820 \text{ N}$) follows an adjusted Minetti / Tobler metabolic curve:

* **Flat ground baseline speed**: $v_0 = 2.4 \text{ km/h} \ (0.67 \text{ m/s})$
* **Uphill slope velocity decay**:
  $$v(\theta) = \max\left(0.4 \text{ km/h}, \ v_0 \cdot \exp(-0.09 \cdot \theta)\right)$$
* **Downhill braking**: Slopes steeper than $-15^\circ$ require deliberate braking to prevent slip/fall in loose regolith.

### 3.2 Multi-Objective A* Graph Solver
A discrete 8-connected grid graph $G = (V, E)$ is generated across the bounding box of the planned traverse with a 35% margin. Each directed edge $(u, v)$ has a step distance $\Delta s = \sqrt{\Delta s_{\text{horiz}}^2 + \Delta z^2}$.

The edge traversal cost is formulated as:

$$\text{Cost}(u, v) = \max\left(0.1, \ \Delta s \cdot \left[1 + w_{\text{slope}} \cdot \left(\frac{\theta}{5^\circ}\right)^2 + w_{\text{rough}} \cdot \left(\frac{\text{TRI}}{5\text{m}}\right)\right] - w_{\text{sci}} \cdot \left(\frac{S_v}{100}\right) \cdot \Delta s\right)$$

Where $S_v \in [0, 100]$ is the scientific interest score at target node $v$.

### 3.3 Strategy Parameter Profiles

| Parameter | SAFEST Strategy | FASTEST Strategy | SCIENCE Strategy |
| :--- | :---: | :---: | :---: |
| **Slope Weight ($w_{\text{slope}}$)** | $6.0$ | $0.8$ | $2.0$ |
| **Roughness Weight ($w_{\text{rough}}$)** | $4.0$ | $0.5$ | $1.0$ |
| **Science Reward ($w_{\text{sci}}$)** | $0.0$ | $0.0$ | $3.5$ |
| **Max Passable Slope ($\theta_{\max}$)** | $14^\circ$ | $22^\circ$ | $16^\circ$ |
| **Primary Design Objective** | Zero-hazard contour traverse | Minimum elapsed time & distance | Maximize CRISM mineral contact |

---

## 4. Scientific Interest Score Formula

The explainable Scientific Interest Score ($0 - 100$) quantifies the astrobiological and geological value of any Martian coordinate based on:
1. **Target Proximity**: Inverse-distance decay $f_{\text{prox}} = \max(0, 1 - d / 50\text{km})$ toward verified NASA science features.
2. **Spectral Mineralogy**: Presence of high-priority aqueous minerals identified by MRO CRISM (Fe/Mg clays, carbonates, sulfates).
3. **Geomorphic Uniqueness**: River deltas, volcanic pit skylights, layered sedimentary deposits.

Every score displays its exact contributing factors in the Location Inspector panel.

---

## 5. Scientific Limitations & Transparency

1. **Spatial Resolution**: MOLA orbital grids provide global coverage at $\sim 463 \text{ m/pixel}$. Meter-scale rocks and localized sand ripples (such as Séítah dunes) require localized HiRISE validation.
2. **Atmospheric Factors**: The model assumes nominal atmospheric conditions ($\sim 6 \text{ mbar}$) and does not simulate localized dust storms.
3. **Disclaimer**: All generated routes and consumable estimates are **MARSCOPE Analytical Estimates** intended for mission planning simulation, not official NASA flight software.
