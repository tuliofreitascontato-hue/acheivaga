import { ParkingSpot } from '../types';

function minutesAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
}

interface Props {
  spot: ParkingSpot;
  onConfirm: (id: string) => void;
  onMarkTaken: (id: string) => void;
  busy: boolean;
}

export function SpotCard({ spot, onConfirm, onMarkTaken, busy }: Props) {
  const mins = minutesAgo(spot.reported_at);
  const distance = spot.distance_m ? `${Math.round(spot.distance_m)} m` : null;

  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>
          Vaga livre {distance ? `· ${distance}` : ''}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
          reportada há {mins} min
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          disabled={busy}
          onClick={() => onConfirm(spot.id)}
          aria-label="Confirmar que a vaga ainda está livre"
          style={{
            background: 'var(--available-dim)',
            color: 'var(--available)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Ainda tá livre
        </button>
        <button
          disabled={busy}
          onClick={() => onMarkTaken(spot.id)}
          aria-label="Marcar vaga como ocupada"
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: 13,
          }}
        >
          Já foi
        </button>
      </div>
    </div>
  );
}
