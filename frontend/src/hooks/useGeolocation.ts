import { useEffect, useState } from 'react';

interface Position {
  lat: number;
  lng: number;
}

// Precisão mínima exigida (em metros) para considerar a posição confiável o
// bastante pra reportar uma vaga. O GPS do navegador retorna um raio de
// incerteza (coords.accuracy); abaixo desse raio, dá pra confiar que o
// usuário está de fato perto da vaga que está reportando.
const MIN_ACCURACY_M = 8;

export function useGeolocation() {
  const [position, setPosition] = useState<Position | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('seu navegador não suporta geolocalização');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setError(null);
      },
      () => setError('não conseguimos acessar sua localização — permita o acesso e tente de novo'),
      { enableHighAccuracy: true, maximumAge: 10_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const isPrecise = accuracy !== null && accuracy <= MIN_ACCURACY_M;

  return { position, accuracy, isPrecise, error };
}
