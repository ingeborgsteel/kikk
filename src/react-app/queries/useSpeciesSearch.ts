import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchSpecies } from "../api/artsdatabanken.ts";
import { TaxonRecord } from "../types/artsdatabanken.ts";

export const useSpeciesSearch = (searchTerm: string, debounceMs = 300) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return useQuery<TaxonRecord[]>({
    queryKey: ["species", debouncedTerm],
    queryFn: () => searchSpecies(debouncedTerm),
    enabled: debouncedTerm.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
