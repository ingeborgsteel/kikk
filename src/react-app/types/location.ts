export interface UserLocation {
  id: string;
  userId?: string | null;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  uncertaintyRadius: number; // in meters
  description?: string;
  createdAt: string;
  updatedAt: string;
}
