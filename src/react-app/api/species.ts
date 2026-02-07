import { TaxonSearchResponse, Species } from '../types/observation';

const API_BASE_URL = 'https://artskart.artsdatabanken.no/publicapi/api';
const BIRDS_TAXON_GROUP = '8';

export async function searchSpecies(searchTerm: string): Promise<Species[]> {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  try {
    const url = `${API_BASE_URL}/taxon?term=${encodeURIComponent(searchTerm)}&taxonGroups=${BIRDS_TAXON_GROUP}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: TaxonSearchResponse = await response.json();
    
    return data.items.map(item => ({
      id: item.id,
      scientificName: item.scientificName,
      vernacularName: item.vernacularName,
      scientificNameId: item.scientificNameId,
      acceptedScientificName: item.acceptedScientificName,
    }));
  } catch (error) {
    console.error('Error searching species:', error);
    return [];
  }
}
