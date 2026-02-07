import {callApi} from "./apiService.ts";
import {TaxonRecord} from "../types/artsdatabanken.ts";

const API_BASE_URL = 'https://artskart.artsdatabanken.no/publicapi/api';

export async function searchSpecies(searchTerm: string): Promise<TaxonRecord[]> {
  const url = `${API_BASE_URL}/taxon?term=${encodeURIComponent(searchTerm)}`;
  return await callApi<TaxonRecord[]>({url});
}
