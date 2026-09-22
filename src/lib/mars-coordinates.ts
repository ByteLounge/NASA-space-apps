/**
 * MARSCOPE Geodesy and Coordinate System Engine
 * Standard: IAU/IAG Planetocentric Coordinate System for Mars
 * 
 * Mars Characteristics:
 * - Mean volumetric radius R_M = 3389.5 km
 * - Equatorial radius a = 3396.2 km
 * - Polar radius b = 3376.2 km
 * - Standard gravity g_mars = 3.72076 m/s^2 (~0.379 g_earth)
 * - Reference datum: Martian Areoid (MOLA gravitational equipotential surface)
 * - Longitudes: 0° to 360° East (or -180° to +180° East convention)
 * - Latitude: -90° to +90° Planetocentric
 */

export const MARS_RADIUS_KM = 3389.5;
export const MARS_EQUATORIAL_RADIUS_KM = 3396.2;
export const MARS_POLAR_RADIUS_KM = 3376.2;
export const MARS_GRAVITY = 3.721; // m/s^2

export interface MarsCoordinate {
  lat: number; // -90 to +90 degrees
  lng: number; // -180 to +180 (or 0 to 360) degrees East
  elevationMeters?: number;
}

/**
 * Normalizes any longitude to [-180, +180] East degrees.
 */
export function normalizeLongitude180(lng: number): number {
  let l = lng % 360;
  if (l > 180) l -= 360;
  if (l < -180) l += 360;
  return l;
}

/**
 * Normalizes any longitude to [0, 360] East degrees (standard planetary IAU).
 */
export function normalizeLongitude360(lng: number): number {
  let l = lng % 360;
  if (l < 0) l += 360;
  return l;
}

/**
 * Calculates Great-Circle distance between two Martian coordinates using the Haversine formula.
 * Returns distance in kilometers.
 */
export function marsDistanceKm(coord1: MarsCoordinate, coord2: MarsCoordinate): number {
  const phi1 = (coord1.lat * Math.PI) / 180;
  const phi2 = (coord2.lat * Math.PI) / 180;
  const deltaPhi = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  
  const lng1 = normalizeLongitude180(coord1.lng);
  const lng2 = normalizeLongitude180(coord2.lng);
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return MARS_RADIUS_KM * c;
}

/**
 * Calculates Great-Circle distance in meters.
 */
export function marsDistanceMeters(coord1: MarsCoordinate, coord2: MarsCoordinate): number {
  return marsDistanceKm(coord1, coord2) * 1000;
}

/**
 * Calculates initial bearing (azimuth) from coord1 to coord2 in degrees (0 = North, 90 = East).
 */
export function marsBearing(coord1: MarsCoordinate, coord2: MarsCoordinate): number {
  const phi1 = (coord1.lat * Math.PI) / 180;
  const phi2 = (coord2.lat * Math.PI) / 180;
  const deltaLambda = ((normalizeLongitude180(coord2.lng) - normalizeLongitude180(coord1.lng)) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

/**
 * Calculates destination point given starting coordinate, distance in km, and bearing in degrees.
 */
export function marsDestination(
  start: MarsCoordinate,
  distanceKm: number,
  bearingDeg: number
): MarsCoordinate {
  const delta = distanceKm / MARS_RADIUS_KM;
  const theta = (bearingDeg * Math.PI) / 180;
  const phi1 = (start.lat * Math.PI) / 180;
  const lambda1 = (normalizeLongitude180(start.lng) * Math.PI) / 180;

  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta)
  );

  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
    );

  return {
    lat: (phi2 * 180) / Math.PI,
    lng: normalizeLongitude180((lambda2 * 180) / Math.PI),
  };
}

/**
 * Formats a coordinate into standard planetary notation (e.g., 18.44° N, 77.45° E).
 */
export function formatMarsCoordinate(coord: MarsCoordinate): string {
  const latDir = coord.lat >= 0 ? "N" : "S";
  const absLat = Math.abs(coord.lat).toFixed(3);
  
  // Both East longitude formats
  const lng180 = normalizeLongitude180(coord.lng);
  const lngDir = lng180 >= 0 ? "E" : "W";
  const absLng = Math.abs(lng180).toFixed(3);

  const lng360 = normalizeLongitude360(coord.lng).toFixed(3);

  return `${absLat}° ${latDir}, ${absLng}° ${lngDir} (${lng360}° E)`;
}

/**
 * Parses user input strings like "18.38 N, 77.58 E" or "-18.38, 77.58" into MarsCoordinate.
 */
export function parseMarsCoordinate(input: string): MarsCoordinate | null {
  const clean = input.trim();
  
  // Pattern 1: Decimal numbers "18.38, 77.58" or "18.38 -77.58"
  const decMatch = clean.match(/^([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)$/);
  if (decMatch) {
    const lat = parseFloat(decMatch[1]);
    const lng = parseFloat(decMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -360 && lng <= 360) {
      return { lat, lng: normalizeLongitude180(lng) };
    }
  }

  // Pattern 2: Directional strings "18.38° N, 77.58° E"
  const dirMatch = clean.match(/(\d+(?:\.\d+)?)\s*°?\s*([NSns])[,\s]+(\d+(?:\.\d+)?)\s*°?\s*([EWew])/);
  if (dirMatch) {
    let lat = parseFloat(dirMatch[1]);
    if (dirMatch[2].toUpperCase() === "S") lat = -lat;
    let lng = parseFloat(dirMatch[3]);
    if (dirMatch[4].toUpperCase() === "W") lng = -lng;
    return { lat, lng: normalizeLongitude180(lng) };
  }

  return null;
}
