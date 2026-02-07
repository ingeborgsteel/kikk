import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Observation } from "../types/observation"
import { TaxonRecord } from "../types/artsdatabanken"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract the 5 most recently observed unique species from observations
 * Species are ordered by the most recent observation date (updatedAt)
 */
export function getRecentSpecies(observations: Observation[], limit = 5): TaxonRecord[] {
  // Create a map to track the most recent observation for each species
  const speciesMap = new Map<number, { species: TaxonRecord; date: string }>();
  
  // Iterate through all observations
  for (const obs of observations) {
    for (const speciesObs of obs.speciesObservations) {
      const speciesId = speciesObs.species.Id;
      const existingEntry = speciesMap.get(speciesId);
      
      // Keep the species with the most recent observation date
      if (!existingEntry || obs.updatedAt > existingEntry.date) {
        speciesMap.set(speciesId, {
          species: speciesObs.species,
          date: obs.updatedAt
        });
      }
    }
  }
  
  // Sort by date (most recent first) and take the top limit
  return Array.from(speciesMap.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map(entry => entry.species);
}

/**
 * Reverse geocode coordinates to get a human-readable location name
 * Uses OpenStreetMap Nominatim API
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=no`,
      {
        headers: {
          'User-Agent': 'kikk-app/1.0' // Required by Nominatim usage policy
        }
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Build a location name from available data
    // Priority: village/town/city, municipality, county
    const parts: string[] = [];
    
    if (data.address) {
      const addr = data.address;
      // Add locality (village, town, city, etc.)
      const locality = addr.village || addr.town || addr.city || addr.hamlet || addr.suburb;
      if (locality) parts.push(locality);
      
      // Add municipality if different from locality
      if (addr.municipality && addr.municipality !== locality) {
        parts.push(addr.municipality);
      }
      
      // Add county
      if (addr.county) parts.push(addr.county);
    }
    
    // If we have parts, join them; otherwise use display_name
    if (parts.length > 0) {
      return parts.join(', ');
    } else if (data.display_name) {
      // Fallback to first part of display_name (usually the most specific)
      return data.display_name.split(',')[0];
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}
