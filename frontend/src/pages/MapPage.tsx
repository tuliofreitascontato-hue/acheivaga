import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useNearbySpots } from '../hooks/useNearbySpots';
import { MapView } from '../components/MapView';
import { BottomSheet } from '../components/BottomSheet';
import { SpotCard } from '../components/SpotCard';
import { ReportButton } from '../components/ReportButton';
import { apiFetch } from '../api/client';
import { ParkingSpot } from '../types';

export function MapPage() {
  const { user, logout } = useAuth();
  const { position, error: geoError } = useGeolocation();
  const { spots, refresh } = useNearbySpots(position?.lat ?? null, position?.lng ?? null);
  const [reporting, setReporting] = useState(false);
  const [busySpotId, setBusySpotId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleReport() {
    if (!position) return;
    setReporting(true);
    setFeedback(null);
    try {
      await apiFetch<{ spot: ParkingSpot }>('/spots', {
        method: 'POST',
        body: JSON.stringify(position),
      });
      setFeedback('Vaga reportada! Obrigado 🙌');
      await refresh();
    } catch {
      setFeedback('não deu pra reportar agora, tenta de novo');
    } finally {
      setReporting(false);
    }
  }

  async function handleAction(id: string, type: 'confirm' | 'taken') {
    setBusySpotId(id);
    try {
      await apiFetch(`/spots/${id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      });
      await refresh();
    } finally {
      setBusySpotId(null);
    }
  }

  if (geoError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        {geoError}
      </div>
    );
  }

  if (!position) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        Localizando você…
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100%' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000, // acima das panes internas do Leaflet (vão até 700)
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px',
          background: 'linear-gradient(180deg, rgba(16,24,32,0.9), transparent)',
        }}
      >
        <h1 style={{ fontSize: 18 }}>Achei Vaga</h1>
        <button
          onClick={logout}
          style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: 13 }}
        >
          Sair ({user?.name})
        </button>
      </div>

      <MapView center={position} spots={spots} onSelectSpot={() => {}} />

      {feedback && (
        <div
          style={{
            position: 'absolute',
            top: 64,
            left: 16,
            right: 16,
            background: 'var(--surface-raised)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: 13,
            zIndex: 1000, // acima das panes internas do Leaflet (vão até 700)
          }}
        >
          {feedback}
        </div>
      )}

      <ReportButton onClick={handleReport} loading={reporting} />

      <BottomSheet title={`${spots.length} vaga(s) por perto`}>
        {spots.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Nenhuma vaga reportada por aqui ainda. Seja o primeiro a ajudar!
          </p>
        )}
        {spots.map((spot) => (
          <SpotCard
            key={spot.id}
            spot={spot}
            busy={busySpotId === spot.id}
            onConfirm={(id) => handleAction(id, 'confirm')}
            onMarkTaken={(id) => handleAction(id, 'taken')}
          />
        ))}
      </BottomSheet>
    </div>
  );
}
