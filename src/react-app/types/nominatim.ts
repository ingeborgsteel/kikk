export interface NominatimAddress {
  house_number?: string;
  house?: string;
  road?: string;
  pedestrian?: string;
  leisure?: string;
  natural?: string;
  tourism?: string;
  neighbourhood?: string;
  hamlet?: string;
  farm?: string;
  allotments?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  city_district?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
  postcode?: string;
  [key: string]: string | undefined;
}

export interface NominatimReverseResponse {
  place_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: NominatimAddress;
  error?: string;
}
