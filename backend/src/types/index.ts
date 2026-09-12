export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export type SpotStatus = 'available' | 'taken' | 'expired';
export type ConfirmationType = 'confirm' | 'taken';

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

// payload decodificado do JWT
export interface AuthTokenPayload {
  sub: string; // user id
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}
