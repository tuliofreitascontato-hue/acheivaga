import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { ParkingSpot } from '../types';

const POLL_INTERVAL_MS = 15_000;

// Polling simples: suficiente para o MVP (vagas mudam em minutos, não em
// segundos). Trocar por WebSocket é uma troca isolada aqui — o resto da UI
// não muda, só a forma como `spots` é atualizado.
export function useNearbySpots(lat: number | null, lng: number | null, radiusM = 500) {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (lat === null || lng === null) return;
    try {
      const { spots } = await apiFetch<{ spots: ParkingSpot[] }>(
        `/spots/nearby?lat=${lat}&lng=${lng}&radius_m=${radiusM}`
      );
      setSpots(spots);
      setError(null);
    } catch {
      setError('não foi possível atualizar as vagas agora');
    }
  }, [lat, lng, radiusM]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { spots, error, refresh };
}
