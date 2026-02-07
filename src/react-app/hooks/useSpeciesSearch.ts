import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchSpecies } from '../api/species';

export function useSpeciesSearch(searchTerm: string, debounceMs = 300) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['species', debouncedTerm],
    queryFn: () => searchSpecies(debouncedTerm),
    enabled: debouncedTerm.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    results: data || [],
    isSearching: isLoading,
    error,
  };
}
