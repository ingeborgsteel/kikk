import { useQuery } from "@tanstack/react-query";
import { reverseGeocode } from "../api/nominatim.ts";

export const REVERSE_GEOCODE_QUERY_KEY = "reverse-geocode";

export const useReverseGeocode = (
  lat: number,
  lng: number,
  enabled = true,
) => {
  return useQuery<string | null, Error>({
    queryKey: [REVERSE_GEOCODE_QUERY_KEY, lat, lng],
    queryFn: () => reverseGeocode(lat, lng),
    enabled,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours — place names rarely change
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days — offline cache
    retry: 1,
  });
};
