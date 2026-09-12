export interface User {
  id: string;
  email: string;
  name: string;
}

export type SpotStatus = 'available' | 'taken' | 'expired';

export interface ParkingSpot {
  id: string;
  reporter_id: string;
  lat: number;
  lng: number;
  status: SpotStatus;
  confidence_score: number;
  reported_at: string;
  expires_at: string;
  updated_at: string;
  distance_m?: number;
}
