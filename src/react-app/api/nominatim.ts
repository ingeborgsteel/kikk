import { NominatimReverseResponse } from "../types/nominatim.ts";

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

// Ordered by preference for a single, balanced locality name.
// Small localities (city_district/neighbourhood/hamlet/suburb/village/town) are best.
// Named places (farm/park/nature reserve) are preferred over street/building
// names. When a specific fallback is chosen, municipality is appended.
const LOCATION_NAME_KEYS = [
  // Small settlement or neighbourhood
  "neighbourhood",
  "quarter",
  "hamlet",
  "locality",

  // Village / suburb / town
  "suburb",
  "village",
  "city_district",

  // Named place or area (farm, park, nature reserve, etc.)
  "farm",
  "leisure",
  "natural",
  "tourism",
] as const;

const MUNICIPALITY_COMBINE_KEYS = [
  // Minor / building fallbacks
  "allotments",
  "pedestrian",
  "house",

  // Street / path fallback
  "road",
];

function buildLocationName(data: NominatimReverseResponse): string | null {
  if (data.error || !data.address) {
    return null;
  }

  const { address } = data;
  const key = LOCATION_NAME_KEYS.find((k) => address[k]);
  const fallbackKey = MUNICIPALITY_COMBINE_KEYS.find((k) => address[k]);

  if (key) {
    const value = address[key];
    if (value) {
      const municipality = address.municipality;
      if (municipality && MUNICIPALITY_COMBINE_KEYS.includes(key)) {
        return `${value}, ${municipality}`;
      }
      return value;
    }
  } else if (fallbackKey) {
    const value = address[fallbackKey];
    if (value) {
      const municipality = address.municipality;
      if (municipality) {
        return `${value}, ${municipality}`;
      }
      return value;
    }
  } else if (address.city) {
    return address.city;
  }

  if (data.display_name) {
    const first = data.display_name.split(",")[0]?.trim();
    return first || null;
  }

  return null;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  const url = new URL(NOMINATIM_REVERSE_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "no");
  url.searchParams.set("zoom", "18");
  url.searchParams.set("layer", "address");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "kikk-app/1.0 (+https://github.com/ingeborgsteel/kikk)",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as NominatimReverseResponse;
  return buildLocationName(data);
}
