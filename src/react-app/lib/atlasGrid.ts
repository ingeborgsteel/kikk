import proj4 from "proj4";
import L from "leaflet";

const GRID_SIZE_METERS = 10_000;

export interface UtmZone {
  zone: number;
  south: boolean;
}

export function getUtmZone(lon: number, lat: number): UtmZone {
  let zone = Math.floor((lon + 180) / 6) + 1;
  if (zone > 60) zone = 60;
  if (zone < 1) zone = 1;
  return { zone, south: lat < 0 };
}

export function getUtmProjectionString(zone: UtmZone): string {
  return `+proj=utm +zone=${zone.zone} +datum=WGS84 +units=m +no_defs${
    zone.south ? " +south" : ""
  }`;
}

function toUtm(lat: number, lon: number, projection: string): [number, number] {
  const [easting, northing] = proj4("WGS84", projection, [lon, lat]);
  return [easting, northing];
}

function fromUtm(
  easting: number,
  northing: number,
  projection: string,
): [number, number] {
  const [lon, lat] = proj4(projection, "WGS84", [easting, northing]);
  return [lat, lon];
}

export function getAtlasGridLines(
  bounds: L.LatLngBounds,
): L.LatLngExpression[][] {
  const center = bounds.getCenter();

  // UTM is only defined between 80°S and 84°N.
  if (Math.abs(center.lat) >= 84) {
    return [];
  }

  const zone = getUtmZone(center.lng, center.lat);
  const projection = getUtmProjectionString(zone);

  const corners = [
    toUtm(bounds.getSouthWest().lat, bounds.getSouthWest().lng, projection),
    toUtm(bounds.getNorthEast().lat, bounds.getNorthEast().lng, projection),
    toUtm(bounds.getNorthWest().lat, bounds.getNorthWest().lng, projection),
    toUtm(bounds.getSouthEast().lat, bounds.getSouthEast().lng, projection),
  ];

  let minEasting = Infinity;
  let maxEasting = -Infinity;
  let minNorthing = Infinity;
  let maxNorthing = -Infinity;

  for (const [easting, northing] of corners) {
    minEasting = Math.min(minEasting, easting);
    maxEasting = Math.max(maxEasting, easting);
    minNorthing = Math.min(minNorthing, northing);
    maxNorthing = Math.max(maxNorthing, northing);
  }

  const startEasting =
    Math.floor(minEasting / GRID_SIZE_METERS) * GRID_SIZE_METERS;
  const endEasting =
    Math.ceil(maxEasting / GRID_SIZE_METERS) * GRID_SIZE_METERS;
  const startNorthing =
    Math.floor(minNorthing / GRID_SIZE_METERS) * GRID_SIZE_METERS;
  const endNorthing =
    Math.ceil(maxNorthing / GRID_SIZE_METERS) * GRID_SIZE_METERS;

  const lines: L.LatLngExpression[][] = [];

  for (
    let easting = startEasting;
    easting <= endEasting;
    easting += GRID_SIZE_METERS
  ) {
    const points: L.LatLngExpression[] = [];
    for (
      let northing = startNorthing;
      northing <= endNorthing;
      northing += GRID_SIZE_METERS
    ) {
      const [lat, lon] = fromUtm(easting, northing, projection);
      points.push([lat, lon]);
    }
    lines.push(points);
  }

  for (
    let northing = startNorthing;
    northing <= endNorthing;
    northing += GRID_SIZE_METERS
  ) {
    const points: L.LatLngExpression[] = [];
    for (
      let easting = startEasting;
      easting <= endEasting;
      easting += GRID_SIZE_METERS
    ) {
      const [lat, lon] = fromUtm(easting, northing, projection);
      points.push([lat, lon]);
    }
    lines.push(points);
  }

  return lines;
}
