interface Props {
  onClick: () => void;
  loading: boolean;
  warning?: string;
}

export function ReportButton({ onClick, loading, warning }: Props) {
  return (
    <>
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          position: 'absolute',
          right: 16,
          bottom: '32vh',
          zIndex: 1000, // acima das panes internas do Leaflet (vão até 700)
          background: 'var(--available)',
          color: '#0B1210',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 15,
          padding: '14px 20px',
          borderRadius: 999,
          boxShadow: '0 6px 18px rgba(46, 217, 168, 0.35)',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Reportando…' : '🅿️ Reportar vaga aqui'}
      </button>
      {/* avisa, mas não trava — a precisão ruim vira aviso, o usuário decide */}
      {warning && !loading && (
        <div
          role="status"
          style={{
            position: 'absolute',
            right: 16,
            bottom: 'calc(32vh + 56px)',
            zIndex: 1000,
            maxWidth: 190,
            textAlign: 'right',
            fontSize: 12,
            lineHeight: 1.3,
            color: 'var(--text-muted)',
            background: 'rgba(16,24,32,0.85)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm, 8px)',
          }}
        >
          {warning}
        </div>
      )}
    </>
  );
}
